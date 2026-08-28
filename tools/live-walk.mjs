// 线上真机走一遍：八个页签 + 新子页，看有没有报错、有没有空白页。
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const PROFILE = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-profile";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/live-walk";
mkdirSync(OUT, { recursive: true });
const ctx = await chromium.launchPersistentContext(PROFILE, { channel: "chrome", headless: true, viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (m) => { const t = m.text(); if (m.type() === "error" && !/cloudflareinsights|beacon/.test(t)) errs.push("console: " + t.slice(0, 160)); });
await page.goto("https://www.nodeloc.com/apps/authoring/wendao", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const start = page.getByRole("button", { name: /开始试玩/ });
if (await start.count()) { await start.first().click(); await page.waitForTimeout(3000); }
const inner = () => page.frames().find((f) => f.url().startsWith("about:srcdoc") || /srcdoc/.test(f.url())) ?? page.frames().at(-1);
await page.waitForTimeout(1500);
const f = inner();
const click = async (label) => {
  const ok = await f.evaluate((t) => {
    const b = [...document.querySelectorAll("#wd button")].find((x) => x.innerText.trim().includes(t));
    if (!b) return false; b.click(); return true;
  }, label);
  await page.waitForTimeout(1600);
  return ok;
};
const text = async () => (await f.evaluate(() => document.getElementById("app").innerText)).replace(/\s+/g, " ").slice(0, 110);
const steps = [["洞府"], ["游历"], ["游历", "秘境"], ["行囊"], ["行囊", "灵兽"], ["坊市"], ["论道"], ["论道", "棋局"], ["宗门"], ["榜单"], ["道册"], ["道册", "成就"]];
let bad = 0;
for (const [tab, sub] of steps) {
  if (!(await click(tab))) { console.log(`✗ 找不到页签 ${tab}`); bad++; continue; }
  if (sub && !(await click(sub))) { console.log(`✗ ${tab} 里找不到子页 ${sub}`); bad++; continue; }
  const t = await text();
  const empty = t.length < 20;
  if (empty) bad++;
  console.log(`${empty ? "✗" : "✓"} ${tab}${sub ? "/" + sub : ""} — ${t}`);
  await page.screenshot({ path: `${OUT}/${tab}${sub ? "-" + sub : ""}.png` });
}
const ovf = await f.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log(`横向溢出 ${ovf}px`);
console.log(errs.length ? "错误:\n" + errs.slice(0, 5).join("\n") : "无客户端报错");
console.log(bad === 0 && ovf <= 0 && errs.length === 0 ? "线上真机走查通过" : "线上真机走查有问题");
await ctx.close();
