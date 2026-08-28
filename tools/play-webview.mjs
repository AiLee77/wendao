// Verifies the webview surface on the live site: opens the authoring page, finds the app iframe,
// waits for the page to boot, reports console errors and takes screenshots (phone + desktop).
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const PROFILE = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-profile";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/live-web";
mkdirSync(OUT, { recursive: true });
const url = process.argv[2] ?? "https://www.nodeloc.com/apps/authoring/wendao";
const ctx = await chromium.launchPersistentContext(PROFILE, { channel: "chrome", headless: true, viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1.5 });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("requestfailed", (r) => { if (/webview|fonts|uploads/.test(r.url())) errors.push("reqfail: " + r.url().slice(0, 160) + " " + (r.failure()?.errorText ?? "")); });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
const start = page.getByRole("button", { name: /开始试玩/ });
if (await start.count()) { await start.first().click(); await page.waitForTimeout(2500); }
const iframe = page.locator("iframe[src*='/webview']").first();
await iframe.waitFor({ timeout: 20000 });
console.log("[iframe]", await iframe.getAttribute("src"), "sandbox=", await iframe.getAttribute("sandbox"));
const outer = await (await iframe.elementHandle()).contentFrame();
let frame = outer; for (let i = 0; i < 40 && !outer.childFrames().length; i++) await page.waitForTimeout(250); if (outer.childFrames().length) frame = outer.childFrames()[0]; console.log("[inner-frame]", outer.childFrames().length ? "srcdoc" : "none");
try { await frame.waitForSelector("#wd", { timeout: 20000 }); } catch (e) { console.log("[frame-url]", frame.url()); const html = await frame.content().catch((x) => "ERR " + x.message); console.log("[frame-html]", html.slice(0, 1500)); await page.screenshot({ path: OUT + "/live-fail.png" }); console.log("[errors]", errors.join(" || ") || "none"); await ctx.close(); process.exit(1); }
await page.waitForTimeout(3000);
const info = await frame.evaluate(() => ({
  text: document.getElementById("wd").innerText.slice(0, 400),
  fonts: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family).filter((v, i, a) => a.indexOf(v) === i),
  images: [...document.images].map((i) => ({ ok: i.complete && i.naturalWidth > 0, src: i.src.slice(-40) })),
  hero: !!document.querySelector(".hero img"),
  height: document.documentElement.scrollHeight,
}));
console.log("[fonts]", JSON.stringify(info.fonts));
console.log("[images]", info.images.length, "broken:", info.images.filter((i) => !i.ok).length);
console.log("[text]", info.text.replace(/\n+/g, " | ").slice(0, 300));
await page.screenshot({ path: OUT + "/live-desktop.png", fullPage: false });
await iframe.screenshot({ path: OUT + "/live-iframe.png" });
// click through a couple of tabs inside the frame
for (const [t, sub] of [["游历", "秘境"], ["行囊", "灵兽"], ["论道", "棋局"], ["道册", "成就"], ["宗门", null]]) {
  const b = frame.locator("#tabs button", { hasText: t });
  if (await b.count()) { await b.first().click(); await page.waitForTimeout(1800); if (sub) { const sb = frame.locator("#app button", { hasText: sub }); if (await sb.count()) { await sb.first().click(); await page.waitForTimeout(1800); } } await iframe.screenshot({ path: OUT + "/live-" + t + (sub ? "-" + sub : "") + ".png" }); }
}
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + "/live-mobile.png", fullPage: false });
console.log(errors.length ? "[errors]\n" + errors.join("\n") : "[errors] none");
await ctx.close();
