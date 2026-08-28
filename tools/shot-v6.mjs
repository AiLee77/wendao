import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/v6";
mkdirSync(OUT, { recursive: true });
const port = 8790, uid = 26651;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
const btn = (t) => page.locator("#wd button", { hasText: t }).first();
const rpc = (m, p) => page.evaluate(([m, p]) => window.community.call(m, p || {}), [m, p]);
await page.goto(`http://localhost:${port}/?uid=${uid}`); await wait(900);
if (await page.locator("#app input").count()) { await page.fill("#app input", "云中客"); await btn("定下道号").click(); await wait(800); }
if (await btn("就这样").count()) { await btn("就这样").click(); await wait(600); }
// cheat: realm 2, stuff
await rpc("dev.realm", { r: 2, s: 3 }); await rpc("dev.give", { ls: 80000, items: { m_lingcao: 20, m_tiekuang: 30, m_xuanjin: 10, m_jinghe: 3, r_feng: 2, r_yun: 1, s_lingcao: 4, s_hanlian: 2, p_huixue: 5, p_huiling: 5, e_linghu: 1, m_yaodan: 6 } });
await page.reload(); await wait(1000); await shot("01-home");
// farm: plant
const chip = page.locator("#wd .card", { hasText: "灵田" }).locator("button").first();
await btn("游历").click(); await wait(700); await btn("秘境").click(); await wait(800); await shot("02-dungeon-lobby");
const enter = btn("寻幽"); if (await enter.count()) { await enter.click(); await wait(900); await shot("03-dungeon-floor"); const o = page.locator("#wd button.opt").first(); if (await o.count()) { await o.click(); await wait(2500); const skip = btn("跳过"); if (await skip.count()) { await skip.click(); await wait(800); } await shot("04-dungeon-result"); } }
await btn("论道").click(); await wait(700); await btn("棋局").click(); await wait(900); await shot("05-wuxing");
await btn("行囊").click(); await wait(700); await shot("06-bag");
if (await btn("淬炼").count()) { await btn("淬炼").click(); await wait(800); await shot("07-refine"); const close = btn("关闭"); if (await close.count()) await close.click(); await wait(300); }
if (await btn("灵兽").count()) { await btn("灵兽").click(); await wait(800); await shot("08-pet"); }
await btn("洞府").click(); await wait(800); await shot("09-home-farm");
await btn("宗门").click(); await wait(800); if (await btn("拜入").count()) { await btn("拜入").click(); await wait(900); } await shot("10-sect");
await btn("道册").click(); await wait(900); await shot("11-bounty");
if (await btn("成就").count()) { await btn("成就").click(); await wait(800); await shot("12-ach"); }
await btn("榜单").click(); await wait(800); await shot("13-lb");
await page.setViewportSize({ width: 760, height: 900 }); await btn("游历").click(); await wait(500); await btn("秘境").click(); await wait(700); await shot("14-desktop-dungeon");
await browser.close();
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no client errors");
