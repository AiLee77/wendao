// 25 条修复之后，把改动过的界面逐个截下来自审。
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/fixed";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 120)); });
const wait = (ms) => p.waitForTimeout(ms);
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
const btn = (t) => p.locator("#wd button", { hasText: t }).first();
const rpc = (m, q) => p.evaluate(([m, q]) => window.community.call(m, q || {}), [m, q]);
const clearOv = async () => { for (let i = 0; i < 5; i++) { try { const o = p.locator("#overlay button"); if (!(await o.count())) break; await o.last().click({ timeout: 2000 }); } catch (e) { break; } await wait(350); } };
await p.goto("http://localhost:8790/?uid=26651"); await wait(1200);
if (await p.locator("#app input").count()) { await p.fill("#app input", "校验官"); await btn("定下道号").click(); await wait(900); }
await clearOv();
await rpc("dev.reset", {}); await p.reload(); await wait(1000);
if (await p.locator("#app input").count()) { await p.fill("#app input", "校验官"); await btn("定下道号").click(); await wait(900); }
await clearOv();
await rpc("dev.realm", { r: 3, s: 3 });
await rpc("dev.give", { ls: 500000, arts: ["f_leijian", "f_leijian"], items: { m_xuanyuan: 60, m_jinghe: 20, r_feng: 3, r_yun: 3, s_hanlian: 4, s_longxue: 4, e_linghu: 1, m_yaodan: 20, p_huixue: 5 } });
await p.reload(); await wait(1400); await clearOv();
// 1 淬炼「保值」
await btn("行囊").click(); await wait(800); await clearOv();
await btn("法宝").click(); await wait(700);
await btn("淬炼").click(); await wait(900); await shot("01-refine-baozhi");
const keep = p.locator("#overlay button", { hasText: "保值" }).first();
if (await keep.count()) { await keep.click(); await wait(600); await shot("02-refine-baozhi-on"); }
await clearOv();
// 2 灵兽
await btn("行囊").click(); await wait(700); await btn("灵兽").click(); await wait(800);
if (await btn("孵化").count()) { await btn("孵化").click(); await wait(900); await clearOv(); }
await shot("03-pet");
// 3 灵田
await btn("洞府").click(); await wait(900); await clearOv(); await shot("04-farm");
// 4 连珠
await btn("论道").click(); await wait(700); await btn("棋局").click(); await wait(900); await shot("05-wuxing");
// 5 宗门（建设 + 本周宗务）
await btn("宗门").click(); await wait(800); await clearOv();
if (await btn("开宗立派").count()) { await btn("开宗立派").click(); await wait(700);
  const inp = p.locator("#overlay input, #app input");
  if (await inp.count()) { await inp.first().fill("试剑宗"); if (await inp.count() > 1) await inp.nth(1).fill("以剑问道"); }
  const ok = p.locator("#overlay button.pri, #app button.pri").first(); if (await ok.count()) await ok.click(); await wait(1000); }
await clearOv(); await shot("06-sect");
// 6 秘境
await btn("游历").click(); await wait(700); await btn("秘境").click(); await wait(800); await shot("07-dungeon-lobby");
if (await btn("寻幽").count()) { await btn("寻幽").click(); await wait(1000);
  for (let i = 0; i < 2; i++) { const o = p.locator("#app button.opt:not([disabled])").first(); if (!(await o.count())) break; await o.click(); await wait(2200); await clearOv(); }
  await shot("08-dungeon-run");
  if (await btn("收手").count()) { await btn("收手").click(); await wait(600); await clearOv(); await wait(600); await shot("09-dungeon-bank"); } }
// 7 道册
await btn("道册").click(); await wait(900); await shot("10-bounty");
console.log(errs.length ? "ERRORS:\n" + errs.slice(0, 6).join("\n") : "no client errors");
await b.close();
