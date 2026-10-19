// 使用本机 Playwright 检验目录滚动约束、归档居中及图片载入动画。
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const slug = `responsive-layout-check-${process.pid}`;
const fixture = path.join(process.cwd(), 'src/content/posts', `${slug}.zh-CN.md`);
fs.writeFileSync(fixture, ['---', 'title: "响应式布局验证"', 'date: "2026-01-01"', '---',
    '图片解码并进入视口之后，应该从左侧柔和呈现。', '![验证图片](/__layout-check.svg)',
    ...Array.from({ length: 80 }, (_, index) => `## ${index + 1}. 用于验证目录长标题换行与内部滚动的测试章节\n\n用于保留阅读布局的正文段落。`),
].join('\n\n'), { flag: 'wx' });
const cleanup = () => { try { fs.unlinkSync(fixture); } catch (error) { if (error.code !== 'ENOENT') throw error; } };
process.on('exit', cleanup);

(async () => {
    const baseURL = process.env.PRODUCTION ? 'http://localhost:3002' : 'http://localhost:3000';
    const server = process.env.PRODUCTION ? require('node:child_process').spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3002'], { stdio: 'ignore', windowsHide: true }) : null;
    process.on('exit', () => server?.kill());
    try {
        if (server) for (let attempt = 0; attempt < 60; attempt++) {
            try { await fetch(baseURL); break; } catch { await new Promise(resolve => setTimeout(resolve, 300)); }
        }
        const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_BROWSER || 'msedge', headless: true });
        try {
            for (const [width, height, mobile] of [[1440, 900, false], [1440, 320, false], [1024, 600, false], [771, 1340, true], [390, 844, true], [320, 568, true], [844, 390, true]]) {
                const context = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : {}), viewport: { width, height }, locale: 'zh-CN', colorScheme: width === 771 ? 'dark' : 'light' });
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                let releaseImage;
                const imageGate = new Promise(resolve => { releaseImage = resolve; });
                await page.route('**/__layout-check.svg', async route => {
                    await imageGate;
                    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400"><rect width="700" height="400" fill="#e4aaaa"/></svg>' });
                });
                await page.goto(`${baseURL}/blog/${slug}`, { waitUntil: 'domcontentloaded' });
                await page.locator('[data-page-ready="true"]').waitFor();
                const image = page.getByAltText('验证图片');
                await image.scrollIntoViewIfNeeded();
                assert.equal(await image.getAttribute('data-image-state'), 'pending', '解码前不能提前播放动画');
                releaseImage();
                await page.waitForFunction(() => document.querySelector('[data-image-state]')?.dataset.imageState === 'entering');
                const animation = await image.evaluate(node => { const style = getComputedStyle(node); return { duration: style.animationDuration, name: style.animationName }; });
                assert.equal(animation.duration, '0.8s');
                await page.waitForFunction(() => document.querySelector('[data-image-state]')?.dataset.imageState === 'done');
                await image.click();
                await page.getByRole('dialog').waitFor();
                await page.getByRole('button', { name: '关闭图片预览' }).click();
                assert.equal(await image.getAttribute('data-image-state'), 'done', '关闭预览不能重播图片动画');
                await page.emulateMedia({ reducedMotion: 'reduce' });
                assert.equal(await image.evaluate(node => getComputedStyle(node).animationName), 'none', '减少动态效果时不能播放动画');
                await page.emulateMedia({ reducedMotion: 'no-preference' });

                const toggle = page.getByRole('button', { name: '切换目录' });
                const compact = await toggle.count() > 0;
                if (compact) await toggle.click();
                const nav = page.getByRole('navigation', { name: '文章目录' });
                const geometry = await nav.evaluate(node => {
                    const body = node.querySelector('[class*="post_toc_body"]');
                    const box = node.getBoundingClientRect();
                    const scroll = body.getBoundingClientRect();
                    body.scrollTop = body.scrollHeight;
                    return { top: box.top, bottom: box.bottom, bodyBottom: scroll.bottom, viewport: window.innerHeight, client: body.clientHeight, total: body.scrollHeight };
                });
                assert(geometry.top >= 0 && geometry.bottom <= height + 1, `目录溢出视口：${JSON.stringify(geometry)}`);
                assert(geometry.bodyBottom <= geometry.bottom + 1 && geometry.client > 0 && geometry.total > geometry.client, '长目录必须在面板内部滚动');
                if (compact) await page.getByRole('button', { name: '关闭目录' }).click();
                await page.goto(`${baseURL}/archive`, { waitUntil: 'domcontentloaded' });
                await page.locator('[class*="blog_card_container"]').first().waitFor();
                await page.waitForTimeout(1000);
                const cards = await page.locator('[class*="blog_card_container"]').evaluateAll(nodes => nodes.slice(0, 8).map(node => {
                    const box = node.getBoundingClientRect();
                    const width = document.documentElement.clientWidth;
                    return { left: box.left, right: width - box.right, width: box.width, scroll: node.scrollWidth, client: node.clientWidth };
                }));
                assert(cards.length > 0);
                assert(cards.every(card => Math.abs(card.left - card.right) <= 2 && card.left >= 0 && card.right >= 0 && card.scroll <= card.client + 1), `归档卡片未居中或内容溢出：${JSON.stringify(cards)}`);
                assert.equal(errors.length, 0, errors.join('\n'));
                console.log(JSON.stringify({ width, height, compact, 目录: geometry, 卡片: cards[0], 图片动画: animation }));
                if (process.env.SCREENSHOT_DIR && width === 390) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'archive-centered.png') });
                if (process.env.SCREENSHOT_DIR && width === 771) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'archive-centered-dark.png') });
                await context.close();
            }
            const noScript = await browser.newContext({ javaScriptEnabled: false });
            try {
                const page = await noScript.newPage();
                await page.route('**/__layout-check.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400"><rect width="700" height="400" fill="#e4aaaa"/></svg>' }));
                await page.goto(`${baseURL}/blog/${slug}`, { waitUntil: 'domcontentloaded' });
                const appearance = await page.getByAltText('验证图片').evaluate(node => { const style = getComputedStyle(node); return { opacity: style.opacity, transform: style.transform }; });
                assert.deepEqual(appearance, { opacity: '1', transform: 'none' }, '禁用脚本时图片仍应可见');
                console.log('禁用脚本的图片阅读回退通过');
            } finally { await noScript.close(); }
        } finally { await browser.close(); }
    } finally { server?.kill(); cleanup(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
