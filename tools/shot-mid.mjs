import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/mid";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); });
const wait = (ms) => p.waitForTimeout(ms);
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
const btn = (t) => p.locator("#wd button", { hasText: t }).first();
const rpc = (m, q) => p.evaluate(([m, q]) => window.community.call(m, q || {}), [m, q]);
const clearOv = async () => { for (let i = 0; i < 4; i++) { const o = p.locator("#overlay button"); if (!(await o.count())) break; await o.last().click().catch(() => {}); await wait(400); } };
await p.goto("http://localhost:8790/?uid=26651"); await wait(1000);
if (await p.locator("#app input").count()) { await p.fill("#app input", "云中客"); await btn("定下道号").click(); await wait(900); }
await clearOv();
await rpc("dev.realm", { r: 3, s: 3 });
await rpc("dev.give", { ls: 200000, items: { m_lingcao: 20, m_xuanyuan: 20, m_jinghe: 5, r_feng: 2, r_yun: 2, s_hanlian: 4, s_longxue: 2, p_huixue: 5, e_linghu: 1, m_yaodan: 8, f_leijian: 1 } });
await p.reload(); await wait(1200); await clearOv();
await btn("洞府").click(); await wait(900); await clearOv(); await shot("01-home-farm");
// plant a seed
const seedChip = p.locator("#wd .card", { hasText: "灵田药圃" }).locator("button").first();
if (await seedChip.count()) { await seedChip.click(); await wait(400); const plot = p.locator("#wd .item.fe").first(); if (await plot.count()) { await plot.click(); await wait(900); } }
await shot("02-farm-planted");
await btn("行囊").click(); await wait(900); await clearOv();
if (await btn("淬炼").count()) { await btn("淬炼").click(); await wait(900); await shot("03-refine"); await clearOv(); }
if (await btn("灵兽").count()) { await btn("灵兽").click(); await wait(900); await shot("04-pet"); }
await btn("宗门").click(); await wait(900); await clearOv(); await shot("05-sect");
await btn("道册").click(); await wait(900); if (await btn("成就").count()) { await btn("成就").click(); await wait(800); } await shot("06-ach");
console.log(errs.length ? "ERRORS: " + errs.slice(0, 5).join(" | ") : "no client errors");
await b.close();
