import { chromium } from "playwright-core";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/mid";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const wait = (ms) => p.waitForTimeout(ms);
const btn = (t) => p.locator("#wd button", { hasText: t }).first();
const rpc = (m, q) => p.evaluate(([m, q]) => window.community.call(m, q || {}), [m, q]);
const clearOv = async () => { for (let i = 0; i < 4; i++) { const o = p.locator("#overlay button"); if (!(await o.count())) break; await o.last().click().catch(() => {}); await wait(400); } };
await p.goto("http://localhost:8790/?uid=26651"); await wait(1200);
if (await p.locator("#app input").count()) { await p.fill("#app input", "云中客"); await btn("定下道号").click(); await wait(1000); }
await clearOv();
await rpc("dev.realm", { r: 3, s: 3 });
await rpc("dev.give", { ls: 200000, items: { m_xuanyuan: 20, m_jinghe: 5, r_feng: 2, r_yun: 2, e_linghu: 1, s_hanlian: 4 }, arts: ["f_leijian", "f_bingjia"] });
await p.reload(); await wait(1400); await clearOv();
await btn("行囊").click(); await wait(1000); await clearOv();
console.log("行囊按钮:", await p.evaluate(() => [...document.querySelectorAll("#app button")].map(x => x.innerText.trim()).slice(0, 12).join(" / ")));
if (await btn("法宝").count()) { await btn("法宝").click(); await wait(900); }
await p.screenshot({ path: `${OUT}/03a-arts.png`, fullPage: true });
if (await btn("淬炼").count()) { await btn("淬炼").click(); await wait(1100); await p.screenshot({ path: `${OUT}/03-refine.png`, fullPage: true }); console.log("淬炼面板已开"); }
else console.log("无淬炼按钮:", (await p.evaluate(() => [...document.querySelectorAll("#app button")].map(x => x.innerText.trim()).join(" / "))).slice(0, 260));
console.log(errs.length ? "ERR " + errs[0] : "no client errors");
await b.close();
