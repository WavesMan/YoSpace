// 使用固定接口样本验证首页搜索，无需提交个人测试文章。
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 516, height: 600 }]) {
            const context = await browser.newContext({ viewport, locale: 'zh-CN' });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/api/music-proxy/**', route => route.fulfill({ json: { code: 200, songs: [] } }));
            let requests = 0;
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            await page.route('**/api/blog/list?**', async route => {
                requests++;
                await gate;
                await route.fulfill({ json: { items: [
                    { slug: 'search-one', title: '性能优化', description: '优化加载', publishedTime: '2026-10-19', tags: ['优化'] },
                    { slug: 'search-two', title: '性能缓存', description: '缓存策略', publishedTime: '2026-10-19', tags: ['缓存'] },
                ] } });
            });
            await page.goto(process.env.HOME_SEARCH_BASE || 'http://localhost:3000');
            await page.locator('[data-page-ready="true"]').waitFor();
            await page.getByRole('tab', { name: '导航', exact: true }).click();
            await page.getByRole('radio', { name: '站内', exact: true }).click();
            const fades = await page.evaluate(() => new Promise(resolve => {
                const values = [];
                const start = performance.now();
                function sample() {
                    const panel = document.querySelector('section[aria-label="站内"]');
                    if (panel) values.push(Number(getComputedStyle(panel).opacity));
                    if (performance.now() - start < 450) requestAnimationFrame(sample);
                    else resolve(values);
                }
                requestAnimationFrame(sample);
            }));
            assert.ok(fades.some(value => value > 0 && value < 1), '站内面板应存在淡入中间帧');
            const input = page.getByRole('searchbox');
            await input.fill('性能');
            const before = await input.boundingBox();
            assert.equal(await page.locator('[data-page-ready]').getAttribute('data-page-ready'), 'true', '索引加载不能遮住整页');
            release();
            await page.getByText('找到 2 篇文章', { exact: true }).waitFor();
            await page.waitForTimeout(450);
            assert.equal(await page.locator('[data-search-result]').count(), 2);
            assert.equal(await input.evaluate(node => document.activeElement === node), true);
            const after = await input.boundingBox();
            assert.ok(Math.abs(before.y - after.y) < 1, '结果不能推移输入框');
            assert.ok(after.x >= 0 && after.x + after.width <= viewport.width + 1, `搜索框不能横向溢出：${JSON.stringify(after)}`);
            await input.fill('缓存');
            await page.getByText('找到 1 篇文章', { exact: true }).waitFor();
            await page.waitForTimeout(300);
            assert.equal(await page.locator('[data-search-result]').count(), 1);
            await input.fill('无匹配内容');
            await page.getByText('没有找到匹配的文章', { exact: true }).waitFor();
            await input.fill('性能');
            await page.getByRole('radio', { name: 'Bing', exact: true }).click();
            await page.getByRole('radio', { name: '站内', exact: true }).click();
            await page.getByText('找到 2 篇文章', { exact: true }).waitFor();
            assert.equal(requests, 1, '引擎来回切换应复用索引');
            await page.waitForTimeout(300);
            const bounds = await page.locator('[class*="home_results"]').first().boundingBox();
            assert.ok(bounds.height > 50 && bounds.y + bounds.height <= viewport.height, '结果区应在视口内滚动');
            if (process.env.HOME_SEARCH_SCREENSHOTS) await page.screenshot({ path: `${process.env.HOME_SEARCH_SCREENSHOTS}/home-search-${viewport.width}.png` });
            const results = page.locator('[class*="home_results"]').first();
            if (await results.evaluate(node => node.scrollHeight > node.clientHeight)) {
                await results.hover();
                await page.mouse.wheel(0, 250);
                await page.waitForTimeout(100);
                assert.ok(await results.evaluate(node => node.scrollTop > 0), '结果滚动不能被首页翻页手势拦截');
            }
            // 组合输入时保留上次结果，提交完整中文后才筛选。
            await input.dispatchEvent('compositionstart');
            await input.fill('无匹配内容');
            assert.equal(await page.locator('[data-search-result]').count(), 2);
            await input.dispatchEvent('compositionend');
            await page.getByText('没有找到匹配的文章', { exact: true }).waitFor();
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await input.fill('缓存');
            await page.getByText('找到 1 篇文章', { exact: true }).waitFor();
            await page.waitForTimeout(100);
            assert.equal(await page.locator('[data-search-result="search-two"]').evaluate(node => getComputedStyle(node).opacity), '1');
            assert.deepEqual(errors, []);
            console.log(`${viewport.width}×${viewport.height}：慢请求不阻塞、输入框稳定、数量与列表更新、快速切换缓存、减少动态效果通过`);
            await context.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
