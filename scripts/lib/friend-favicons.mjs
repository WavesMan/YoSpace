import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const FALLBACK = '/friend-favicons/default.svg';
const MAX_BYTES = 2 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 24);
export const sourceKey = item => item.avatar || item.link;
const localPath = value => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !value.split('/').includes('..') && !/[?#]/.test(value);

// 只保存具有对应文件头的位图；远程 SVG 可能包含脚本、字体或外链，不直接落盘。
export function imageExtension(bytes) {
    if (bytes.length < 12) throw new Error('图片数据不完整');
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
    if (/^GIF8[79]a/.test(bytes.toString('ascii', 0, 6))) return 'gif';
    if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
    if (bytes.readUInt32LE(0) === 0x00010000 && bytes.readUInt16LE(4) > 0) return 'ico';
    if (bytes.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(bytes.toString('ascii', 8, 32))) return 'avif';
    throw new Error('响应不是支持的图片格式');
}

async function readLimited(response, limit = MAX_BYTES) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (Number(response.headers.get('content-length')) > limit) {
        await response.body?.cancel();
        throw new Error('响应超过大小限制');
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body || []) {
        size += chunk.length;
        if (size > limit) throw new Error('响应超过大小限制');
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

function httpUrl(value, base) {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('仅支持 HTTP(S) 图标源');
    return url.href;
}

export async function downloadIcon(item, { fetchImpl = fetch, timeout = 12000 } = {}) {
    // 每个友链共享总超时，避免多个回退地址逐次累加等待。
    const signal = AbortSignal.timeout(timeout);
    const request = url => fetchImpl(httpUrl(url), { signal, headers: { 'User-Agent': 'YoSpace-Favicon-Build/1.0' } });
    const image = async url => {
        const bytes = await readLimited(await request(url));
        return { bytes, extension: imageExtension(bytes) };
    };
    if (item.avatar) {
        try { return await image(item.avatar); } catch { /* 继续从站点发现图标 */ }
    }
    const site = httpUrl(item.link);
    try {
        const response = await request(site);
        const html = (await readLimited(response)).toString('utf8');
        const candidates = [];
        for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
            const attrs = Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
                .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
            if (/(?:^|\s)(?:icon|apple-touch-icon)(?:\s|$)/i.test(attrs.rel || '') && attrs.href) {
                candidates.push(httpUrl(attrs.href.replace(/&amp;/g, '&'), response.url || site));
            }
        }
        for (const candidate of [...new Set(candidates)].slice(0, 5)) {
            try { return await image(candidate); } catch { /* 尝试下一候选 */ }
        }
    } catch { /* 页面不可用时仍尝试根目录图标 */ }
    return image(new URL('/favicon.ico', site).href);
}

async function readJson(file, fallback) {
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

async function atomicJson(file, data) {
    await mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
    await rename(temporary, file);
}

export async function cacheFriendFavicons({ root, refresh = false, fetchImpl = fetch, timeout = 12000, logger = console } = {}) {
    const items = await readJson(path.join(root, 'src/data/friendLinks.json'), []);
    const manifestFile = path.join(root, 'src/data/friendFavicons.json');
    const previous = await readJson(manifestFile, {});
    const next = {};
    const publicDir = path.join(root, 'public');
    await mkdir(path.join(publicDir, 'friend-favicons'), { recursive: true });
    const queue = [...new Map(items.map(item => [sourceKey(item), item])).values()];
    const stats = { downloaded: 0, cached: 0, fallback: 0, local: 0 };
    async function processItem(item) {
        const key = sourceKey(item);
        if (localPath(item.avatar)) {
            try { await readFile(path.join(publicDir, item.avatar)); next[key] = { path: item.avatar }; stats.local++; return; }
            catch { next[key] = { path: FALLBACK }; stats.fallback++; logger.warn(`[友链图标] ${item.title}：本地图片不存在，使用默认图标`); return; }
        }
        let cached;
        const entry = previous[key];
        if (/^\/friend-favicons\/[a-f0-9]{24}\.(png|jpg|gif|webp|ico|avif)$/.test(entry?.path || '')) {
            try { imageExtension(await readFile(path.join(publicDir, entry.path))); cached = entry; } catch { /* 缓存损坏时重新拉取 */ }
        }
        if (!refresh && cached && Date.now() - Date.parse(cached.updatedAt) < 7 * 86400000) {
            next[key] = cached; stats.cached++; return;
        }
        try {
            const { bytes, extension } = await downloadIcon(item, { fetchImpl, timeout });
            const resource = `/friend-favicons/${hash(bytes)}.${extension}`;
            await writeFile(path.join(publicDir, resource), bytes);
            next[key] = { path: resource, updatedAt: new Date().toISOString() };
            stats.downloaded++;
        } catch (error) {
            next[key] = cached || { path: FALLBACK };
            stats[cached ? 'cached' : 'fallback']++;
            logger.warn(`[友链图标] ${item.title}：${error.message}，${cached ? '复用本地缓存' : '使用默认图标'}`);
        }
    }
    // 最多四个并发；相同源只下载一次，旧文件保留，避免在途页面引用失效。
    await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
        while (queue.length) await processItem(queue.shift());
    }));
    const ordered = Object.fromEntries(items.map(item => [sourceKey(item), next[sourceKey(item)]]));
    await atomicJson(manifestFile, ordered);
    logger.log(`[友链图标] 下载 ${stats.downloaded}，缓存 ${stats.cached}，本地 ${stats.local}，默认 ${stats.fallback}`);
    return { manifest: ordered, stats };
}
