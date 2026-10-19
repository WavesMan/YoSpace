// 可通过 PLAYWRIGHT_MODULE 指定本机浏览器自动化运行时，无需增加项目生产依赖。
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 使用独立样本，避免依赖个人博客的文章；只创建全新文件并在退出时清理。
const readingSlug = `progressive-reading-check-${process.pid}`;
const codeSlug = `progressive-code-check-${process.pid}`;
const fixtures = [];
const cleanupFixtures = () => {
  for (const fixture of fixtures) {
    try { fs.unlinkSync(fixture); } catch (error) { if (error.code !== 'ENOENT') console.error('清理回归样本失败：', error.message); }
  }
};
process.on('exit', cleanupFixtures);
function writeFixture(slug, body) {
  const target = path.join(process.cwd(), 'src/content/posts', `${slug}.zh-CN.md`);
  fs.writeFileSync(target, `---\ntitle: "渐进阅读回归样本"\ndate: "2026-01-01"\n---\n\n${body}\n`, { encoding: 'utf8', flag: 'wx' });
  fixtures.push(target);
}
writeFixture(readingSlug, [
  '首屏应当先显示正文与目录，后续段落和图形随阅读位置逐步呈现。'.repeat(6),
  ...Array.from({ length: 13 }, (_, index) => `## ${index + 1}. 图表验证\n\n${'这一段保留完整排版，进入视口后直接阅读，回看无需重新播放。'.repeat(8)}\n\n\`\`\`mermaid\nflowchart LR\n A[步骤 ${index + 1}] --> B[就绪]\n\`\`\`\n\n\`\`\`text\n图表 ${index + 1} 的配套代码\n\`\`\``),
  '全部验证完成后，末尾段落也应随滚动正常显示。',
].join('\n\n'));
writeFixture(codeSlug, [
  '## 代码渐进显示',
  '先阅读这段说明，再向下滚动查看长命令的完整输出与高亮衔接。'.repeat(30),
  '```powershell\ndism /online /get-features /format:table | Select-String "VirtualMachinePlatform|Microsoft-Windows-Subsystem-Linux|HypervisorPlatform"\n```',
  '## 无语言标记代码',
  '```\n第一行\n\n第三行\n```',
  '验证结束。',
].join('\n\n'));

(async () => {
  const baseURL = process.env.PRODUCTION ? 'http://localhost:3001' : 'http://localhost:3000';
  const articleURL = process.env.PAGE_URL || `${baseURL}/blog/${readingSlug}`;
  const server = process.env.PRODUCTION
    ? require('node:child_process').spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3001'], { stdio: 'ignore', windowsHide: true })
    : null;
  if (server) {
    process.on('exit', () => server.kill());
    for (let attempt = 0; attempt < 60; attempt++) {
      try { await fetch(baseURL); break; } catch { await new Promise(resolve => setTimeout(resolve, 300)); }
    }
  }
  try {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_BROWSER || 'msedge' });
  try {
  for (const mobile of [true, false]) {
    const context = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }), locale: 'zh-CN' });
    const page = await context.newPage();
    const errors = [];
    const apiRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/\/api\/blog\//.test(request.url())) apiRequests.push(request.url()); });
    await page.addInitScript(() => {
      window.__samples = [];
      window.__blockReveals = [];
      new MutationObserver(records => {
        for (const record of records) {
          const node = record.target;
          if (node.dataset.streamVariant !== 'diagram' && node.dataset.streamVariant !== 'code') continue;
          window.__blockReveals.push({ variant: node.dataset.streamVariant, state: node.dataset.streamState, clip: node.style.clipPath });
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-stream-state'] });
      const start = performance.now();
      const tick = () => {
        const gate = document.querySelector('[data-page-ready]');
        const title = document.querySelector('h1');
        const sample = {
          t: Math.round(performance.now() - start),
          title: !!title && gate?.getAttribute('data-page-ready') === 'true',
          toc: !!document.querySelector('button[aria-label="切换目录"], nav[aria-label="文章目录"]'),
          diagrams: document.querySelectorAll('[aria-label="Mermaid diagram"]').length,
          pendingDiagrams: document.querySelectorAll('[data-diagram-pending="true"]').length,
          ready: gate?.getAttribute('data-page-ready'),
        };
        const previous = window.__samples.at(-1);
        if (!previous || JSON.stringify({ ...sample, t: 0 }) !== JSON.stringify({ ...previous, t: 0 })) window.__samples.push(sample);
        if (performance.now() - start < 40000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const session = await context.newCDPSession(page);
    if (process.env.SLOW) {
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await session.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 750000, uploadThroughput: 250000 });
    }
    await page.goto(articleURL, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-page-ready="true"]').waitFor({ timeout: 35000 });
    if (process.env.SCREENSHOT_DIR && mobile) {
      await page.waitForTimeout(200);
      await page.screenshot({ path: require('node:path').join(process.env.SCREENSHOT_DIR, 'progressive-reading-mobile.png') });
    }
    await page.waitForTimeout(500);
    const samples = await page.evaluate(() => window.__samples);
    const metrics = await page.evaluate(() => ({
      javascriptBytes: performance.getEntriesByType('resource').filter(item => item.name.includes('.js')).reduce((sum, item) => sum + item.transferSize, 0),
      domNodes: document.querySelectorAll('*').length,
    }));
    console.log(JSON.stringify({ mobile, samples, metrics, apiRequests, errors }));
    assert.equal(errors.length, 0, '页面不应发生脚本或 hydration 错误');
    assert.equal(apiRequests.length, 0, '服务端已有数据时不应重复请求正文或列表');
    assert(samples.filter(sample => sample.title).every(sample => sample.ready === 'true' && sample.toc), '正文可见时目录和基础布局应已就绪');
    assert.equal(await page.locator('[data-lazy-diagram]').count(), 13);
    assert(await page.locator('[data-lazy-diagram="idle"]').count() > 0, '屏外图表不能一次性渲染');
    const firstParagraph = page.locator('[data-post-content] p').first();

    const paragraphHeight = await firstParagraph.evaluate(node => node.getBoundingClientRect().height);
    const lastParagraph = page.locator('[data-post-content] p').last();
    assert.equal(await firstParagraph.getAttribute('data-stream-state'), null, '正文不再挂载逐字裁切组件');
    const lastDiagram = page.locator('[data-lazy-diagram]').last();
    await lastDiagram.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-lazy-diagram]')].at(-1)?.dataset.lazyDiagram === 'ready', null, { timeout: 30000 });
    if (process.env.SCREENSHOT_DIR && mobile) await page.screenshot({ path: require('node:path').join(process.env.SCREENSHOT_DIR, 'progressive-diagram.png') });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-lazy-diagram]')].at(-1)?.querySelector('[data-stream-variant="diagram"]')?.dataset.streamState === 'done');
    await lastParagraph.scrollIntoViewIfNeeded();

    await firstParagraph.scrollIntoViewIfNeeded();
    assert.equal(await firstParagraph.getAttribute('data-stream-state'), null, '回看正文不会重播打字动画');
    assert.equal(await firstParagraph.evaluate(node => node.getBoundingClientRect().height), paragraphHeight, '动画不能改变段落高度');
    if (mobile) {
      const firstDiagram = page.locator('[data-lazy-diagram="ready"]').first();
      const diagramNode = await firstDiagram.elementHandle();
      await page.getByRole('button', { name: '切换目录' }).click();
      await page.getByRole('button', { name: '关闭目录' }).click();
      assert(await diagramNode.evaluate(node => node.isConnected), '切换目录不能导致图表重建');
    }
    if (!process.env.SLOW) {
      const codePage = await context.newPage();
      await codePage.addInitScript(() => {
        window.__codeReveals = [];
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedCode = value; } } });
        new MutationObserver(records => {
          for (const record of records) {
            const node = record.target;
            if (node.dataset.streamVariant === 'code') window.__codeReveals.push({ state: node.dataset.streamState, height: node.getBoundingClientRect().height, clip: node.style.clipPath });
          }
        }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-stream-state'] });
      });
      await codePage.goto(`${baseURL}/blog/${codeSlug}`, { waitUntil: 'domcontentloaded' });
      await codePage.locator('[data-page-ready="true"]').waitFor();
      const code = codePage.locator('[data-lazy-code]').filter({ hasText: 'dism /online /get-features /format:table' }).first();
      const plainValue = await code.locator('pre code').evaluate(node => [...node.children].map(row => { const copy = row.cloneNode(true); copy.querySelectorAll('[aria-hidden="true"]').forEach(item => item.remove()); return copy.textContent; }).join('\n'));
      const beforeHeight = await code.evaluate(node => node.getBoundingClientRect().height);
      const beforeLayout = await code.evaluate(node => [...node.querySelectorAll('pre,code')].map(item => { const s = getComputedStyle(item); return { tag: item.tagName, width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height, font: s.font, whiteSpace: s.whiteSpace, wordBreak: s.wordBreak, padding: s.padding, margin: s.margin }; }));
      await code.evaluate(node => window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - 180 }));
      if (process.env.SCREENSHOT_DIR && mobile) await codePage.screenshot({ path: require('node:path').join(process.env.SCREENSHOT_DIR, 'progressive-code.png') });
      await codePage.waitForFunction(() => [...document.querySelectorAll('[data-lazy-code]')].find(node => node.textContent.includes('dism /online /get-features /format:table'))?.querySelector('[data-stream-state]')?.dataset.streamState === 'done');
      await codePage.waitForFunction(() => [...document.querySelectorAll('[data-lazy-code]')].find(node => node.textContent.includes('dism /online /get-features /format:table'))?.dataset.lazyCode === 'ready');
      const afterHeight = await code.evaluate(node => node.getBoundingClientRect().height);
      if (Math.abs(afterHeight - beforeHeight) >= 2) console.log(JSON.stringify({ beforeLayout, afterLayout: await code.evaluate(node => [...node.querySelectorAll('pre,code')].map(item => { const s = getComputedStyle(item); return { tag: item.tagName, width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height, font: s.font, whiteSpace: s.whiteSpace, wordBreak: s.wordBreak, padding: s.padding, margin: s.margin }; })) }));
      assert(Math.abs(afterHeight - beforeHeight) < 2, `代码高亮前后应保持高度：${beforeHeight} / ${afterHeight}`);
      await code.getByRole('button', { name: 'Copy code' }).click();
      assert.equal(await codePage.evaluate(() => window.__copiedCode), plainValue, '淡入与高亮不能影响复制全文');
      assert(await codePage.evaluate(() => window.__codeReveals.every(item => !item.clip)), '代码不再逐帧裁切');
      await codePage.emulateMedia({ reducedMotion: 'reduce' });
      await codePage.reload({ waitUntil: 'domcontentloaded' });
      await codePage.locator('[data-page-ready="true"]').waitFor();
      await codePage.waitForFunction(() => [...document.querySelectorAll('[data-stream-variant="code"]')].filter(node => node.getBoundingClientRect().top < innerHeight && node.getBoundingClientRect().bottom > 0).every(node => node.dataset.streamState === 'done'));
      console.log(JSON.stringify({ mobile, 检查: '长命令淡入、高亮高度、复制全文、减少动态效果通过' }));
      await codePage.close();
      await page.getByText('< Back to blog list', { exact: true }).first().click();
      await page.waitForURL(`${baseURL}/blog`);
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.locator('[data-page-ready="true"]').waitFor({ timeout: 35000 });
      assert.equal(await page.locator('[data-lazy-diagram]').count(), 13, '返回文章后应保留完整文档结构');
      assert.equal(errors.length, 0, '返回文章后不应有脚本错误');
      await context.close();

      const english = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : {}), locale: 'en-US', colorScheme: 'dark' });
      await english.addCookies([{ name: 'locale', value: 'en-US', url: baseURL }]);
      const englishPage = await english.newPage();
      const englishErrors = [];
      const englishApi = [];
      englishPage.on('pageerror', error => englishErrors.push(error.message));
      englishPage.on('request', request => { if (/\/api\/blog\//.test(request.url())) englishApi.push(request.url()); });
      await englishPage.goto(articleURL, { waitUntil: 'domcontentloaded' });
      await englishPage.locator('[data-page-ready="true"]').waitFor({ timeout: 35000 });
      assert.equal(englishErrors.length, 0, '英文与暗色模式不应发生 hydration 错误');
      assert.equal(englishApi.length, 0, '英文首屏不应先请求中文再请求英文');
      console.log(JSON.stringify({ mobile, 检查: '返回文章、英文浏览器偏好与暗色模式通过', 实际语言: await englishPage.locator('html').getAttribute('lang') }));
      await english.close();
      const noScript = await browser.newContext({ javaScriptEnabled: false });
      const noScriptPage = await noScript.newPage();
      await noScriptPage.goto(articleURL, { waitUntil: 'domcontentloaded' });
      assert.equal(await noScriptPage.locator('h1').first().evaluate(node => getComputedStyle(node).visibility), 'visible', '禁用脚本后仍能阅读服务端文章');
      assert.equal(await noScriptPage.locator('[data-stream-state]').first().evaluate(node => getComputedStyle(node).clipPath), 'none', '禁用脚本后不能隐藏段落正文');
      await noScript.close();
      continue;
    }
    await context.close();
  }
  } finally { await browser.close(); }
  } finally { server?.kill(); cleanupFixtures(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
