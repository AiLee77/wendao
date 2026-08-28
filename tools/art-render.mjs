// Renders the blocks-surface art to PNG files with headless Chrome. The SVG source of truth is
// lib/ui/artsvg.js (the webview embeds the same strings as data URIs); this only rasterises it.
// Output: tools/art/*.png — upload them with tools/art-upload.mjs.
// Optional argv[1]: a regex, render only the keys it matches.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { svgAssets } from "../lib/ui/artsvg.js";

const OUT = "tools/art";
mkdirSync(OUT, { recursive: true });

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const jobs = Object.entries(svgAssets()).map(([name, svg]) => [name, svg, +svg.match(/width="(\d+)"/)[1], +svg.match(/height="(\d+)"/)[1]]);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [name, svg, w, h] of jobs) {
  if (only && !only.test(name)) continue;
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Noto+Serif+SC:wght@600&display=swap"><style>html,body{margin:0;background:#0c1426}svg{display:block}</style></head><body>${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h }, omitBackground: false });
  writeFileSync(`${OUT}/${name}.png`, buf);
  console.log(name, buf.length, "bytes");
}
await browser.close();
