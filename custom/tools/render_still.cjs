// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Draws the still pictures of the AQTUATOR Custom page from its own 3D view (not published).
// Start a web server in the root of the repository first: python3 -m http.server 8765
// Then: node custom/tools/render_still.cjs
// Writes custom/assets/img/morph-still.png (fallback picture) and og.png (share
// picture, 1200 × 630). The page uses only the WebP: convert the PNG, then delete it. See
// docs/architecture.md, "AQTUATOR Custom page".
const path = require('path');
const { chromium } = require('playwright');

const STEP = process.env.STEP || '3';          // which example design to draw
const URL = `http://localhost:8765/custom/?step=${STEP}&still=1`;
const OUT = path.join(__dirname, '..', 'assets', 'img');

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const shot = async (w, h, file, css) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await page.goto(URL);
    // Show only the 3D view, at the full size of the page.
    await page.addStyleTag({ content: `body > *:not(main), main > *:not(.hero), .hero > *:not(.hero__art), .morph__below, .morph__still { display: none !important; }
      .hero { display: block; padding: 0; max-width: none; } .morph { position: fixed; inset: 0; aspect-ratio: auto; border-radius: 0; }
      ${css || 'html, body { background: transparent !important; }'}` });
    await page.waitForFunction(() => window.__morphReady, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    // A clipped page screenshot: an element screenshot waits for a still frame, which a slow
    // software renderer may never give.
    const clip = await page.locator('#morph').boundingBox();
    await page.screenshot({ path: path.join(OUT, file), clip, omitBackground: !css, timeout: 300000 });
    await page.close();
    console.log('wrote', file);
  };
  await shot(800, 600, 'morph-still.png', '');          // clear background, so it fits any page colour
  await shot(600, 315, 'og.png', 'body { background: #1b1c1d; }');
  await browser.close();
})();
