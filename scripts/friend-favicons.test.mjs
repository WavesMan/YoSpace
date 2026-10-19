import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { cacheFriendFavicons, downloadIcon, imageExtension, FALLBACK } from './lib/friend-favicons.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4L8AAAAASUVORK5CYII=', 'base64');
const quiet = { log() {}, warn() {} };
async function fixture(t, items) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'yospace-favicons-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await mkdir(path.join(root, 'src/data'), { recursive: true });
    await writeFile(path.join(root, 'src/data/friendLinks.json'), JSON.stringify(items));
    return root;
}

test('同源去重、内容哈希资源、本地映射和七天缓存', async t => {
    const item = { title: '示例', link: 'https://site.test', avatar: 'https://cdn.test/image' };
    const root = await fixture(t, [item, { ...item, title: '重复源' }]);
    let calls = 0;
    const fetchImpl = async () => { calls++; return new Response(png); };
    const first = await cacheFriendFavicons({ root, fetchImpl, logger: quiet });
    assert.equal(calls, 1);
    const entry = first.manifest[item.avatar];
    assert.match(entry.path, /^\/friend-favicons\/[a-f0-9]{24}\.png$/);
    assert.deepEqual(await readFile(path.join(root, 'public', entry.path)), png);
    await cacheFriendFavicons({ root, fetchImpl, logger: quiet });
    assert.equal(calls, 1);
    const offline = await cacheFriendFavicons({ root, refresh: true, logger: quiet, fetchImpl: async () => { throw new Error('断网'); } });
    assert.deepEqual(offline.manifest[item.avatar], entry);
});

test('拒绝 HTML 伪图片与超限响应，失败使用默认图标，损坏缓存不复用', async t => {
    const item = { title: '失败站点', avatar: 'https://cdn.test/bad', link: 'https://site.test' };
    const root = await fixture(t, [item]);
    const fake = '/friend-favicons/aaaaaaaaaaaaaaaaaaaaaaaa.png';
    await mkdir(path.join(root, 'public/friend-favicons'), { recursive: true });
    await writeFile(path.join(root, 'public', fake), '<html>错误</html>');
    await writeFile(path.join(root, 'src/data/friendFavicons.json'), JSON.stringify({ [item.avatar]: { path: fake, updatedAt: new Date().toISOString() } }));
    const result = await cacheFriendFavicons({ root, fetchImpl: async () => new Response('<html>错误</html>'), logger: quiet });
    assert.equal(result.manifest[item.avatar].path, FALLBACK);
    await assert.rejects(downloadIcon(item, { fetchImpl: async () => new Response(png, { headers: { 'content-length': '3000000' } }) }), /大小限制/);
    await assert.rejects(downloadIcon(item, { fetchImpl: async () => new Response(Buffer.alloc(2 * 1024 * 1024 + 1)) }), /大小限制/);
});

test('无头像时发现相对 favicon，支持跳转后的站点路径与根目录回退', async () => {
    const calls = [];
    const result = await downloadIcon({ link: 'https://site.test/old' }, { fetchImpl: async url => {
        calls.push(url);
        if (calls.length === 1) {
            const response = new Response('<link href="../icon.png?v=1&amp;s=2" rel="shortcut icon">');
            Object.defineProperty(response, 'url', { value: 'https://new.test/path/page' });
            return response;
        }
        return new Response(png);
    } });
    assert.equal(result.extension, 'png');
    assert.equal(calls[1], 'https://new.test/icon.png?v=1&s=2');
    const rootCalls = [];
    await downloadIcon({ link: 'https://site.test/page' }, { fetchImpl: async url => {
        rootCalls.push(url);
        return url.endsWith('/favicon.ico') ? new Response(png) : new Response('', { status: 503 });
    } });
    assert.equal(rootCalls.at(-1), 'https://site.test/favicon.ico');
});

test('保留存在的本地头像、失效本地头像回退且不触网', async t => {
    const root = await fixture(t, [{ title: '本地', avatar: '/icon.png' }, { title: '缺失', avatar: '/missing.png' }]);
    await mkdir(path.join(root, 'public'), { recursive: true });
    await writeFile(path.join(root, 'public/icon.png'), png);
    const result = await cacheFriendFavicons({ root, fetchImpl: () => assert.fail('本地图片不应请求网络'), logger: quiet });
    assert.equal(result.manifest['/icon.png'].path, '/icon.png');
    assert.equal(result.manifest['/missing.png'].path, FALLBACK);
});

test('总超时可中止请求，远程 SVG 不直接保存', async () => {
    const started = Date.now();
    await assert.rejects(downloadIcon({ link: 'https://slow.test' }, { timeout: 30, fetchImpl: async (_url, { signal }) => {
        signal.throwIfAborted();
        await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, 1000);
            signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
        });
        return new Response(png);
    } }));
    assert.ok(Date.now() - started < 1000);
    assert.throws(() => imageExtension(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), /图片格式/);
});
