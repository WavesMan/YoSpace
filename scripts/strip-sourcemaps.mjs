#!/usr/bin/env node
/**
 * 构建后剔除 SSR 源码映射（.next/**\/.js.map）。
 *
 * 这些映射仅用于服务端调试，既不下发浏览器，也不进入 Vercel 的部署产物；
 * 自托管整目录部署时会白白占用磁盘，可在 `next build` 之后执行本脚本。
 *
 * 用法：node scripts/strip-sourcemaps.mjs
 */
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const NEXT_DIR = join(process.cwd(), '.next');

async function collectMaps(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const maps = [];
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) maps.push(...await collectMaps(full));
        else if (entry.name.endsWith('.js.map')) maps.push(full);
    }
    return maps;
}

async function main() {
    let maps;
    try {
        maps = await collectMaps(NEXT_DIR);
    } catch {
        console.error('.next 目录不存在，请先执行 next build。');
        process.exit(1);
    }
    await Promise.all(maps.map((file) => rm(file, { force: true })));
    console.log(`已剔除 ${maps.length} 个 SSR 源码映射文件。`);
}

main().catch((error) => {
    console.error('剔除源码映射失败：', error);
    process.exit(1);
});
