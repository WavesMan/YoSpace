import { fileURLToPath } from 'node:url';
import { cacheFriendFavicons } from './lib/friend-favicons.mjs';

try {
    await cacheFriendFavicons({ root: fileURLToPath(new URL('../', import.meta.url)), refresh: process.argv.includes('--refresh') });
} catch (error) {
    console.error(`[友链图标] 生成失败：${error.message}`);
    process.exitCode = 1;
}
