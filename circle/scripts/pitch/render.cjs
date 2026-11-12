/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose: a globally installed Playwright resolves via require() but not ESM import. */
// Renders scripts/pitch/slides.html into public/pitch/: one PNG per slide (1920×1080),
// a small JPG thumbnail per slide, and the whole deck as a PDF.
//   node scripts/pitch/render.cjs
// Needs Playwright with Chromium (npx playwright install chromium, if you don't have it).
const { mkdirSync } = require("fs");
const { join } = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const here = __dirname;
const out = join(here, "../../public/pitch");
mkdirSync(out, { recursive: true });

(async () => {
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(join(here, "slides.html")).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const slides = page.locator("section.slide");
const count = await slides.count();
for (let i = 0; i < count; i++) {
  await slides.nth(i).screenshot({ path: join(out, `slide-${i + 1}.png`) });
}

const thumbs = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.25 });
await thumbs.goto(pathToFileURL(join(here, "slides.html")).href, { waitUntil: "load" });
await thumbs.evaluate(() => document.fonts.ready);
for (let i = 0; i < count; i++) {
  await thumbs.locator("section.slide").nth(i).screenshot({ path: join(out, `thumb-${i + 1}.jpg`), type: "jpeg", quality: 80 });
}

await page.pdf({ path: join(out, "circle-pitch-deck.pdf"), width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`Rendered ${count} slides, thumbnails and a PDF to public/pitch/`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
