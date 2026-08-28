// 真实安装探针：打开卡片所在的论坛帖子，在游戏 iframe 里直接调 community.call，读 world.kv 诊断。
// 用法：node tools/probe-real.mjs [帖子URL]  （不带参数则先列出分类里的帖子）
import { chromium } from "playwright-core";
const PROFILE = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-profile";
const url = process.argv[2];
const ctx = await chromium.launchPersistentContext(PROFILE, { channel: "chrome", headless: true, viewport: { width: 1200, height: 900 } });
const page = ctx.pages()[0] ?? (await ctx.newPage());
if (!url) {
  await page.goto("https://www.nodeloc.com/c/155-category/wendao/206", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const topics = await page.evaluate(() => [...document.querySelectorAll("a.title, td.main-link a, a.raw-topic-link")].map((a) => ({ t: a.innerText.trim(), href: a.href })).slice(0, 12));
  console.log(JSON.stringify(topics, null, 1));
} else {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const start = page.getByRole("button", { name: /开始|试玩|进入/ });
  if (await start.count()) { await start.first().click(); await page.waitForTimeout(4000); }
  await page.waitForTimeout(2000);
  const frames = page.frames().map((f) => f.url().slice(0, 80));
  console.log("frames:", JSON.stringify(frames));
  const f = page.frames().find((x) => x.url().startsWith("about:srcdoc")) ?? page.frames().at(-1);
  const res = await f.evaluate(async () => {
    const w = typeof community !== "undefined" ? { community } : window;
    if (!w.community?.call) return { err: "no community bridge" };
    const v = await w.community.call("home", {});
    const d = v?.data ?? v;
    return { world: d?.world ?? v?.world ?? null, keys: Object.keys(d ?? {}) };
  }).catch((e) => ({ err: String(e).slice(0, 300) }));
  console.log(JSON.stringify(res, null, 1));
}
await ctx.close();
