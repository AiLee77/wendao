// 线上跑的是不是这次修好的版本：抓 webview 的页面源码，找几个只有 v6.1 才有的串。
import { chromium } from "playwright-core";
const PROFILE = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-profile";
const ctx = await chromium.launchPersistentContext(PROFILE, { channel: "chrome", headless: true, viewport: { width: 1100, height: 1200 } });
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("https://www.nodeloc.com/apps/authoring/wendao", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const start = page.getByRole("button", { name: /开始试玩/ });
if (await start.count()) { await start.first().click(); await page.waitForTimeout(2500); }
const fr = page.frameLocator("iframe[src*='/webview']").frameLocator("iframe").first();
await page.waitForTimeout(2000);
const html = await page.frames().map((f) => f).reduce(async (acc, f) => {
  const prev = await acc;
  try { return prev + (await f.content()); } catch { return prev; }
}, Promise.resolve(""));
const MARKS = [
  ["试炼出手", "宗务改成出手次数"], ["保值", "淬炼保值重铸"], ["它已至二十级", "满级灵兽不再喂"],
  ["丹毒：服丹积毒", "丹毒副作用写在根骨卡"], ["点此播种", "空田直接点开选种"],
  ["托管 ◆", "拍卖行显示托管额"], ["已被超", "拍卖行标出是否领先"],
  ["品质 +", "法宝卡标出星级加成"], ["小时", "时辰改成小时"],
  ["修炼 ×0.5", "状态栏写明减益影响"], ["大乘", "地域标签补到大乘"],
  ["去播种", "种子指向灵田而非假使用"], ["每半小时回 1 点", "体力恢复提速"], ["辟谷丹", "辟谷丹已上架"], ["折半价卖给坊市", "卖出说明"], ["S.pend=tab", "连点页签补渲染"],
];
for (const [s, what] of MARKS) console.log((html.includes(s) ? "✓ " : "✗ ") + what + "（" + s + "）");
console.log("页面源码长度", html.length);
// worldView 直接把共享区键数读出来（纯读，配额满了也拿得到）
const m = html.match(/"kv":\{"k":(\d+)/);
const b = html.match(/"w":\{"k":(\d+),"b":(\d+),"d":(\d+)\}/);
console.log(m ? `共享区：${m[1]} 键` + (b ? `，天机阁上轮 ${b[1]} 键 / ${(Number(b[2]) / 1024).toFixed(0)} KB，清理 ${b[3]} 个` : "，天机阁尚未写过统计") : "共享区：页面里没带 kv 统计");
await ctx.close();
