import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:8790/?uid=7"); await p.waitForTimeout(900);
const btn = (t) => p.locator("#wd button", { hasText: t }).first();
if (await p.locator("#app input").count()) { await p.fill("#app input", "量一量"); await btn("定下道号").click(); await p.waitForTimeout(800); await btn("就这样").click(); await p.waitForTimeout(800); }
const meas = (sel, label) => p.evaluate(([sel, label]) => {
  const e = document.querySelector(sel); if (!e) return label + ": (缺)";
  const r = e.getBoundingClientRect();
  return `${label}: top=${Math.round(r.top + window.scrollY)} h=${Math.round(r.height)} 视口=${window.innerHeight}`;
}, [sel, label]);
await btn("论道").click(); await p.waitForTimeout(600); await btn("棋局").click(); await p.waitForTimeout(900);
console.log(await meas("#app .wxg", "连珠棋盘"));
console.log(await p.evaluate(() => { const g = document.querySelector("#app .wxg"); const r = g.getBoundingClientRect(); const bar = document.querySelector(".tabs")?.getBoundingClientRect().height ?? 0; return `棋盘高 ${Math.round(r.height)}，可视高 ${window.innerHeight - bar}（底栏 ${Math.round(bar)}），一屏${r.height <= window.innerHeight - bar ? "放得下" : "放不下"}`; }));
console.log(await p.evaluate(() => "整页高 " + document.documentElement.scrollHeight));
await btn("游历").click(); await p.waitForTimeout(600); await btn("秘境").click(); await p.waitForTimeout(700);
await btn("寻幽").click(); await p.waitForTimeout(1200);
console.log(await p.evaluate(() => {
  const cards = [...document.querySelectorAll("#app .card")];
  const run = cards.find((c) => /第 \d+\/\d+ 层/.test(c.innerText));
  const opt = document.querySelector("#app button.opt");
  return `秘境运行卡 top=${run ? Math.round(run.getBoundingClientRect().top + scrollY) : "?"}，第一个选项 top=${opt ? Math.round(opt.getBoundingClientRect().top + scrollY) : "?"}，视口 ${innerHeight}，整页 ${document.documentElement.scrollHeight}`;
}));
console.log(await p.evaluate(() => { const bs = [...document.querySelectorAll("#app button")].filter(x => /服回血丹|服回灵丹/.test(x.innerText)); return bs.map(x => x.innerText.trim() + (x.disabled ? "(禁用)" : "(可点)")).join(" / "); }));
// 横向溢出检查
for (const [tab, sub] of [["洞府", null], ["游历", "秘境"], ["行囊", "灵兽"], ["论道", "棋局"], ["道册", null], ["宗门", null]]) {
  await btn(tab).click(); await p.waitForTimeout(600);
  if (sub && await btn(sub).count()) { await btn(sub).click(); await p.waitForTimeout(700); }
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${tab}${sub ? "/" + sub : ""} 横向溢出 ${o}px`);
}
await b.close();
