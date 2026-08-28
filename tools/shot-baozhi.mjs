import { chromium } from "playwright-core";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/fixed";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 120)); });
const wait = (ms) => p.waitForTimeout(ms);
const btn = (t) => p.locator("#wd button", { hasText: t }).first();
const ovBtn = (t) => p.locator("#overlay button", { hasText: t }).first();
await p.goto("http://localhost:8790/?uid=26651"); await wait(1200);
await btn("行囊").click(); await wait(800);
await btn("法宝").click(); await wait(700);
await btn("淬炼").click(); await wait(900);
// 先开一槽，再看保值
if (await ovBtn("开一槽").count()) { await ovBtn("开一槽").click(); await wait(1200); }
if (await btn("淬炼").count() && !(await ovBtn("保值").count())) { await btn("淬炼").click(); await wait(900); }
await p.screenshot({ path: `${OUT}/02a-refine-with-affix.png`, fullPage: true });
const before = await p.locator("#overlay").innerText();
if (await ovBtn("保值").count()) {
  await ovBtn("保值").click(); await wait(600);
  await p.screenshot({ path: `${OUT}/02b-refine-baozhi-on.png`, fullPage: true });
  const cost = (await p.locator("#overlay").innerText()).match(/重铸 [^\n]*/)?.[0];
  console.log("保值开启后费用行:", cost);
  const doIt = p.locator("#overlay button", { hasText: "保值重铸" }).first();
  if (await doIt.count()) { await doIt.click(); await wait(1400); await p.screenshot({ path: `${OUT}/02c-refine-after.png`, fullPage: true }); }
  console.log("重铸前词缀:", before.match(/词缀（[^）]*）[\s\S]{0,60}/)?.[0]?.replace(/\n/g, " "));
  console.log("重铸后词缀:", (await p.locator("#overlay,#app").first().innerText()).match(/词缀（[^）]*）[\s\S]{0,60}/)?.[0]?.replace(/\n/g, " "));
} else console.log("没找到保值按钮");
console.log(errs.length ? "ERR " + errs[0] : "no client errors");
await b.close();
