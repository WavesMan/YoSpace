// 使用慢接口和静音音频验证播放器六态、防连点、键盘操作及布局；运行时传入 PLAYWRIGHT_MODULE。
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const output = process.env.MUSIC_PLAYER_QA_OUTPUT;
  if (output) fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 },
    ...(output ? { recordVideo: { dir: output, size: { width: 1440, height: 1000 } } } : {}),
  });
  try {
    const page = await context.newPage();
    let releasePlaylist;
    let releaseSong;
    const playlistGate = new Promise(resolve => { releasePlaylist = resolve; });
    const songGate = new Promise(resolve => { releaseSong = resolve; });
    let songRequests = 0;
    let signalNextRequest;
    const nextRequestStarted = new Promise(resolve => { signalNextRequest = resolve; });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const audio = Buffer.alloc(44 + 8000 * 2 * 30);
    audio.write('RIFF', 0); audio.writeUInt32LE(audio.length - 8, 4); audio.write('WAVEfmt ', 8);
    audio.writeUInt32LE(16, 16); audio.writeUInt16LE(1, 20); audio.writeUInt16LE(1, 22);
    audio.writeUInt32LE(8000, 24); audio.writeUInt32LE(16000, 28);
    audio.writeUInt16LE(2, 32); audio.writeUInt16LE(16, 34);
    audio.write('data', 36); audio.writeUInt32LE(audio.length - 44, 40);
    await page.route('https://music.example/**', route => route.fulfill({ contentType: 'audio/wav', body: audio }));
    await page.route('https://netmusic.waveyo.cn/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/playlist/track/all') {
        await playlistGate;
        return route.fulfill({ json: { code: 200, songs: [
          { id: 1, name: '六态交互验证', ar: [{ name: '测试音源' }] },
          { id: 2, name: '下一曲验证', ar: [{ name: '测试音源' }] },
        ] } });
      }
      if (url.pathname.startsWith('/song/url/')) {
        songRequests++;
        if (url.searchParams.get('id') === '2') signalNextRequest();
        await songGate;
        return route.fulfill({ json: { code: 200, data: [{ url: `https://music.example/${url.searchParams.get('id')}.wav` }] } });
      }
      return route.fulfill({ json: { code: 200, success: true, yrc: {}, lrc: {} } });
    });
    await page.goto(process.env.MUSIC_PLAYER_BASE || 'http://localhost:3000');
    await page.getByRole('button', { name: '打开播放器', exact: true }).click();
    const root = page.locator('[data-player-root]');
    const shot = async name => {
      await page.waitForFunction(() => {
        const panel = document.querySelector('[data-player-root] > div');
        return !panel || Number(getComputedStyle(panel).opacity) > 0.99;
      });
      if (output) await root.screenshot({ path: path.join(output, name + '.png') });
    };
    await page.getByRole('button', { name: '正在加载歌单', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '下一曲', exact: true }).isDisabled(), true);
    await shot('01-initial-disabled');
    releasePlaylist();
    const next = page.getByRole('button', { name: '下一曲', exact: true });
    await next.waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('button[aria-label="下一曲"]').disabled);
    await page.mouse.move(20, 20);
    await shot('02-default');
    await next.hover();
    await shot('03-hover');
    await next.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await next.evaluate(button => button.matches(':focus-visible')), true);
    await shot('04-focus');
    await next.hover();
    await page.mouse.down();
    await shot('05-pressed');
    await page.mouse.up();
    await page.getByRole('button', { name: '正在切换下一曲', exact: true }).waitFor();
    await nextRequestStarted;
    const before = songRequests;
    await page.getByRole('button', { name: '正在切换下一曲', exact: true }).evaluate(button => { button.click(); button.click(); button.click(); });
    assert.equal(songRequests, before, '加载期间重复点击不能增加请求');
    assert.equal(await page.getByRole('button', { name: '播放', exact: true }).isDisabled(), true);
    await shot('06-loading');
    releaseSong();
    await page.getByRole('button', { name: '暂停', exact: true }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '播放', exact: true }).waitFor();
    const list = page.getByRole('button', { name: '切换播放列表', exact: true });
    await list.click();
    assert.equal(await page.getByRole('button', { name: '正在切换播放列表', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: '切换播放列表', exact: true }).waitFor();
    assert.equal(await list.getAttribute('aria-expanded'), 'true');
    await shot('07-playlist');
    const firstTrack = page.getByRole('button', { name: '播放 六态交互验证', exact: true });
    await firstTrack.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('[data-player-root] li')?.textContent.includes('下一曲验证'));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '打开播放器', exact: true }).waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '打开播放器');
    for (const settings of [{ width: 1440, height: 1000, zoom: 2 }, { width: 390, height: 844, zoom: 1 }]) {
      await page.setViewportSize({ width: settings.width, height: settings.height });
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, settings.zoom);
      await page.getByRole('button', { name: '打开播放器', exact: true }).click();
      const box = await root.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= settings.width + 1, '播放器不能溢出视口');
      await shot(settings.zoom === 2 ? '08-zoom-200' : '09-mobile');
      await page.keyboard.press('Escape');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.deepEqual(errors, [], '不应出现页面异常');
    console.log(JSON.stringify({ result: '通过', states: 6, repeatedClicksBlocked: true, keyboard: true, zoom200: true, mobile: true, songRequests, output }));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
