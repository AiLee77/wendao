// Screenshots the tribulation overlay on the local preview (tools/preview.mjs must be running).
import { chromium } from "playwright-core";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/web";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 840 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:8787/cheat?uid=1&what=trib"); await p.waitForTimeout(900);
await p.locator("#wd button", { hasText: "引动" }).first().click(); await p.waitForTimeout(900);
await p.screenshot({ path: OUT + "/m-trib.png" });
for (let i = 0; i < 3; i++) { const btn = p.locator("#overlay button").first(); if (!(await btn.count())) break; await btn.click(); await p.waitForTimeout(120); await p.screenshot({ path: OUT + "/m-trib-strike" + i + ".png" }); await p.waitForTimeout(700); }
await p.screenshot({ path: OUT + "/m-trib-end.png" });
await b.close();
