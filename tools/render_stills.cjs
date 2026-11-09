// Render the still images of the site from the real 3D model.
//   python3 -m http.server 8765   (in the repository root)
//   node tools/render_stills.cjs
// Needs Playwright with Chromium. Writes assets/img/hero.png and assets/img/og.png.
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = process.env.SITE_URL || 'http://localhost:8765';

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  const browser = await chromium.launch({ proxy, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-certificate-errors'] });
  const shots = [
    { hash: '', file: 'hero.png', viewport: { width: 1600, height: 1000 }, transparent: true },
    { hash: '#og', file: 'og.png', viewport: { width: 1200, height: 630 }, transparent: false },
  ];
  for (const s of shots) {
    const page = await browser.newPage({ viewport: s.viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.goto(`${URL}/tools/render.html${s.hash}`);
    await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    await page.screenshot({ path: path.join(ROOT, 'assets/img', s.file), omitBackground: s.transparent, timeout: 120000 });
    console.log('wrote', s.file);
    await page.close();
  }
  await browser.close();
})();
