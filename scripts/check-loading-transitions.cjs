// 生产模式验证统一过渡、聚合页首批数据与可中断导航，不依赖个人文章。
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const slug = `transition-check-${process.pid}`;
const fixture = path.join(process.cwd(), 'src/content/posts', `${slug}.zh-CN.md`);
fs.writeFileSync(fixture, '---\ntitle: "统一过渡验证"\ndate: "2026-10-19"\n---\n\n正文一次呈现，不再逐字裁切。\n\n```bash\necho 验证代码高亮\n```', { flag: 'wx' });
const cleanup = () => { if (fs.existsSync(fixture)) fs.unlinkSync(fixture); };
process.on('exit', cleanup);

(async () => {
    const base = process.env.PRODUCTION ? 'http://localhost:3004' : 'http://localhost:3000';
    const server = process.env.PRODUCTION ? spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3004'], { stdio: 'ignore', windowsHide: true }) : null;
    process.on('exit', () => server?.kill());
    let browser;
    try {
        if (server) for (let i = 0; i < 60; i++) {
            try { if ((await fetch(base)).ok) break; } catch {}
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_BROWSER || 'msedge', headless: true });
        for (const mobile of [false, true]) {
            const context = await browser.newContext(mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/api/music-proxy/**', route => route.fulfill({ json: { code: 200, songs: [] } }));
            let listRequests = 0;
            page.on('request', request => { if (request.url().includes('/api/blog/list')) listRequests++; });
            for (const route of ['/', `/blog/${slug}`, '/archive', '/tags', '/categories', '/search', '/blog', '/links']) {
                await page.goto(base + route, { waitUntil: 'domcontentloaded' });
                await page.locator('[data-page-ready="true"]').waitFor();
                assert.equal(await page.locator('[data-page-overlay]').count(), 1);
                assert.equal(await page.locator('.app_transition_card,.app_transition_spinner').count(), 0);
                assert.equal(await page.locator('header,[class*="Header"][class*="nav"]').first().evaluate(node => getComputedStyle(node).opacity), '1');
            }
            assert.equal(listRequests, 0, '已有服务端首批数据不能重复请求列表');
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            await page.route('**/archive?*', async route => { await gate; if (!route.request().isNavigationRequest()) await route.continue().catch(() => {}); else await route.continue(); });
            const navigate = async href => {
                if (mobile) await page.getByRole('button', { name: 'Toggle menu' }).click();
                await page.locator(`a[href="${href}"]:visible`).first().click();
            };
            try {
                await navigate('/archive');
                await page.locator('[data-page-ready="false"]').waitFor();
                assert.equal(await page.locator('[data-page-overlay]').count(), 1);
                // 等待期间导航仍可用，后一次跳转可以中断前一次。
                await navigate('/links');
                await page.waitForURL(base + '/links');
                await page.locator('[data-page-ready="true"]').waitFor();
            } finally { release(); }
            await page.waitForTimeout(250);
            assert.equal(new URL(page.url()).pathname, '/links');
            assert.deepEqual(errors, []);
            await page.emulateMedia({ reducedMotion: 'reduce' });
            assert.equal(await page.locator('.page_transition_mark').evaluate(node => getComputedStyle(node).animationName), 'none');
            console.log(`${mobile ? '移动端' : '桌面端'}：八类页面单一过渡、无重复列表请求、可中断导航、减少动态效果通过`);
            await context.close();
        }
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();
        await page.goto(`${base}/blog/${slug}`);
        const content = page.locator('[data-page-ready]');
        assert.equal(await content.evaluate(node => getComputedStyle(node).opacity), '1');
        assert.equal(await content.getAttribute('inert'), null);
        assert.equal(await page.locator('[data-page-overlay]').evaluate(node => getComputedStyle(node).display), 'none');
        console.log('无脚本阅读及链接可用性通过');
        await context.close();
    } finally { await browser?.close(); server?.kill(); cleanup(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
