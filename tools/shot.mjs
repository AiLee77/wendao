// Screenshots the local webview preview (tools/preview.mjs must be running) at phone and desktop widths.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/web";
mkdirSync(OUT, { recursive: true });
const port = process.env.PORT ?? 8787;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
async function run(width, tag, steps) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  page.on("pageerror", (e) => errors.push(tag + ": " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(tag + " console: " + m.text()); });
  await page.goto(`http://localhost:${port}/?uid=1`);
  await page.waitForTimeout(900);
  for (const [name, act] of steps) {
    if (act) { await act(page); await page.waitForTimeout(700); }
    await page.evaluate(() => Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })))); await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: false });
  }
  await page.close();
}
const clickText = (t) => async (p) => { await p.locator("#wd button", { hasText: t }).first().click(); };
const fillCreate = async (p) => { if (await p.locator("#app input").count()) { await p.fill("#app input", "云中客"); await p.locator("#wd button", { hasText: "定下道号" }).click(); await p.waitForTimeout(700); await p.locator("#wd button", { hasText: "就这样" }).click(); } };
const steps = [["create", null], ["home", fillCreate], ["explore", clickText("游历")], ["event", async (p) => { const b = p.locator("#wd button", { hasText: "前往" }).first(); if (await b.count()) await b.click(); }], ["choice", async (p) => { await p.locator("#app button.opt:not([disabled])").first().click(); await p.waitForTimeout(2600); }], ["choice-end", async (p) => { const b = p.locator("#overlay:not(.hidden) button.pri"); if (await b.count()) { await b.click(); await p.waitForTimeout(500); } }], ["bag", clickText("行囊")], ["market", clickText("坊市")], ["arena", clickText("论道")], ["replay", async (p) => { await p.locator("#app .card button", { hasText: "论道" }).first().click(); await p.waitForTimeout(2200); }], ["replay-end", async (p) => { const sk = p.locator("#overlay button", { hasText: "跳过" }); if (await sk.count()) await sk.click(); await p.waitForTimeout(500); }], ["sect", async (p) => { const b = p.locator("#overlay button.pri"); if (await b.count()) await b.click(); await p.waitForTimeout(400); await p.locator("#wd button", { hasText: "宗门" }).first().click(); }], ["lb", clickText("榜单")], ["bio", clickText("传记")]];
await run(390, "m", steps);
await run(760, "d", [["home", null], ["explore", clickText("游历")], ["arena", clickText("论道")]]);
await browser.close();
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no client errors");
console.log("shots in", OUT);
