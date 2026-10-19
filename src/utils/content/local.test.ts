import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let root: string;
beforeEach(() => {
    vi.resetModules();
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'yospace-content-'));
    fs.mkdirSync(path.join(root, 'src/content/posts'), { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(root);
});
afterEach(() => { vi.restoreAllMocks(); fs.rmSync(root, { recursive: true, force: true }); });
function write(name: string, title: string, date = '2026-01-01') {
    fs.writeFileSync(path.join(root, 'src/content/posts', name), `---\ntitle: "${title}"\ndate: "${date}"\n---\n正文 ${title}`);
}

describe('按语言和文件版本复用内容索引', () => {
    it('不同分页共用已解析索引，不重复读取 Markdown', async () => {
        write('a.zh-CN.md', '文章甲', '2026-01-02');
        write('b.zh-CN.md', '文章乙');
        const content = await import('./local');
        const read = vi.spyOn(fs, 'readFileSync');
        expect((await content.getLocalPostsList(0, 1, 'zh-CN')).items[0].title).toBe('文章甲');
        const firstReads = read.mock.calls.length;
        expect(firstReads).toBe(2);
        expect((await content.getLocalPostsList(1, 1, 'zh-CN')).items[0].title).toBe('文章乙');
        expect(read.mock.calls.length).toBe(firstReads);
    });
    it('修改文章内容无需等待 TTL，列表和详情立即失效且语言不串用', async () => {
        write('a.zh-CN.md', '旧标题');
        write('a.md', 'English');
        const content = await import('./local');
        await content.getLocalPostsList(0, 10, 'zh-CN');
        await content.getLocalPostContent('a', 'zh-CN');
        write('a.zh-CN.md', '修改后更长的标题');
        expect((await content.getLocalPostsList(0, 10, 'zh-CN')).items[0].title).toBe('修改后更长的标题');
        expect((await content.getLocalPostContent('a', 'zh-CN')).title).toBe('修改后更长的标题');
        expect((await content.getLocalPostsList(0, 10, 'en')).items[0].title).toBe('English');
        fs.unlinkSync(path.join(root, 'src/content/posts/a.zh-CN.md'));
        expect((await content.getLocalPostsList(0, 10, 'zh-CN')).total).toBe(0);
    });
});
