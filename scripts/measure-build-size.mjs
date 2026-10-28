#!/usr/bin/env node
/**
 * 构建产物体积测量脚本
 *
 * 按“部署口径”统计 .next 目录体积：
 *  - .next/cache      —— Turbopack 本地构建缓存，不参与部署
 *  - *.js.map         —— SSR 源码映射，不下发浏览器，自托管可剔除
 *  - .next/server/.next/static —— 真正随部署上线的服务端与客户端产物
 *
 * 用法：node scripts/measure-build-size.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const NEXT_DIR = join(process.cwd(), '.next');

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...await walk(full));
        else if (entry.isFile()) files.push(full);
    }
    return files;
}

const mb = (bytes) => (bytes / 1048576).toFixed(2);

async function main() {
    const files = await walk(NEXT_DIR);
    let cache = 0;
    let serverJs = 0;
    let serverMap = 0;
    let staticSize = 0;
    let other = 0;

    for (const file of files) {
        const rel = relative(NEXT_DIR, file).split(sep).join('/');
        const size = (await stat(file)).size;
        if (rel.startsWith('cache/')) cache += size;
        else if (rel.endsWith('.js.map')) serverMap += size;
        else if (rel.startsWith('server/')) serverJs += size;
        else if (rel.startsWith('static/')) staticSize += size;
        else other += size;
    }

    const total = cache + serverJs + serverMap + staticSize + other;
    const deployable = serverJs + staticSize + other;

    console.log('=== .next 构建产物体积（部署口径）===');
    console.log(`总计                 ${mb(total)} MB`);
    console.log(`  构建缓存 cache     ${mb(cache)} MB  （不部署）`);
    console.log(`  服务端 server      ${mb(serverJs)} MB  （部署）`);
    console.log(`  SSR 源码映射       ${mb(serverMap)} MB  （不下发，可剔除）`);
    console.log(`  客户端 static      ${mb(staticSize)} MB  （部署）`);
    console.log(`  其他               ${mb(other)} MB`);
    console.log('-----------------------------------------');
    console.log(`部署产物合计         ${mb(deployable)} MB`);
}

main().catch((error) => {
    console.error('体积统计失败：', error);
    process.exit(1);
});
