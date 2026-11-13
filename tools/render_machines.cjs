// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Render the home page images from tools/render-machines.html.
//   python3 -m http.server 8765   (in the root of refaqt-web)
//   node tools/render_machines.cjs
// Needs Playwright with Chromium. Writes assets/img/machines.png and assets/img/og.png.
// Then make the smaller WebP copy that the page loads first, for example:
//   python3 -c "from PIL import Image; Image.open('assets/img/machines.png').save('assets/img/machines.webp', quality=86, method=6)"
// Set ONLY=mill (or laser, lathe, cmm) to write one machine to the current folder, for checking.
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = process.env.SITE_URL || 'http://localhost:8765';
const ONLY = process.env.ONLY || '';

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-certificate-errors'] });
  const shots = ONLY
    ? [{ query: `?only=${ONLY}${process.env.CAM ? '&cam=' + process.env.CAM : ''}${process.env.TILT ? '&tilt=' + process.env.TILT : ''}`, hash: '', file: path.resolve(`check-${ONLY}.png`), viewport: { width: 1500, height: 1200 }, transparent: false }]
    : [
        { query: '', hash: '', file: path.join(ROOT, 'assets/img/machines.png'), viewport: { width: 1500, height: 1200 }, transparent: true, trim: 24 },
        { query: '', hash: '#og', file: path.join(ROOT, 'assets/img/og.png'), viewport: { width: 1200, height: 630 }, transparent: false },
      ];
  for (const s of shots) {
    const page = await browser.newPage({ viewport: s.viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    page.on('console', m => { if (m.type() === 'error') console.error(m.text()); });
    page.on('pageerror', e => console.error(e.message));
    await page.goto(`${URL}/tools/render-machines.html${s.query}${s.hash}`);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 180000 });
    // Cut away the empty border, keeping a small margin.
    const clip = s.trim ? await page.evaluate(m => {
      const src = document.querySelector('#v canvas'), w = src.clientWidth, h = src.clientHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      let l = w, t = h, r = 0, b = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
      l = Math.max(0, l - m); t = Math.max(0, t - m); r = Math.min(w, r + m); b = Math.min(h, b + m);
      return { x: l, y: t, width: r - l, height: b - t };
    }, s.trim) : undefined;
    await page.screenshot({ path: s.file, omitBackground: s.transparent, clip, timeout: 120000 });
    console.log('wrote', s.file);
    await page.close();
  }
  await browser.close();
})();
