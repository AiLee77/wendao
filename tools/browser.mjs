// Opens a persistent Chrome (your installed Chrome, separate profile) on the playtest page, waits for login,
// then records everything the webview does: wrapper HTML, network calls to /apps/installs/*, console output.
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const PROFILE = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-profile";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out";
mkdirSync(PROFILE, { recursive: true }); mkdirSync(OUT, { recursive: true });
const INSTALL = process.env.INSTALL ?? "69";
const mode = process.argv[2] ?? "probe";

const ctx = await chromium.launchPersistentContext(PROFILE, { channel: "chrome", headless: false, viewport: { width: 1200, height: 900 }, args: ["--disable-blink-features=AutomationControlled"] });
const page = ctx.pages()[0] ?? (await ctx.newPage());
const log = [];
const say = (...a) => { const s = a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "); console.log(s); log.push(s); };

page.on("console", (m) => say("[console]", m.type(), m.text()));
page.on("pageerror", (e) => say("[pageerror]", e.message));
page.on("request", (r) => { if (r.url().includes("/apps/installs/")) say("[req]", r.method(), r.url(), r.postData()?.slice(0, 800) ?? ""); });
page.on("response", async (r) => {
  if (!r.url().includes("/apps/installs/")) return;
  let body = "";
  try { body = (await r.text()).slice(0, 4000); } catch {}
  say("[res]", r.status(), r.url(), r.headers()["content-type"] ?? "", body);
});

await page.goto("https://www.nodeloc.com/apps/authoring/wendao", { waitUntil: "domcontentloaded" });
// wait for login
for (let i = 0; i < 600; i++) {
  let me = null;
  try { me = await page.evaluate(async () => { try { const r = await fetch("/session/current.json", { headers: { Accept: "application/json" } }); if (!r.ok) return null; const j = await r.json(); return j?.current_user?.username ?? null; } catch { return null; } }); } catch { me = null; }
  if (me) { say("[login] logged in as", me); break; }
  if (i === 0) say("[login] 请在弹出的 Chrome 窗口里登录 NodeLoc（只需一次）…");
  await page.waitForTimeout(2000);
}
await page.goto("https://www.nodeloc.com/apps/authoring/wendao", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const start = page.getByRole("button", { name: /开始试玩/ });
if (await start.count()) { await start.first().click(); say("[ui] clicked 开始试玩"); }
await page.waitForTimeout(4000);

// find the webview iframe
const frames = page.frames().map((f) => f.url());
say("[frames]", frames);
const wv = page.frames().find((f) => f.url().includes("/apps/installs/"));
if (wv) {
  const html = await wv.evaluate(() => document.documentElement.outerHTML);
  writeFileSync(path.join(OUT, "webview.html"), html);
  say("[webview] wrapper saved", html.length, "bytes");
  const bridge = await wv.evaluate(() => { const c = window.community; return c ? Object.keys(c).map((k) => k + ":" + typeof c[k]) : null; });
  say("[webview] window.community =", bridge);
  const src = await wv.evaluate(() => (window.community && window.community.call ? window.community.call.toString() : null));
  say("[webview] call.toString() =", src);
} else {
  const html = await page.evaluate(() => document.querySelector(".discourse-app")?.outerHTML ?? document.body.innerHTML.slice(0, 3000));
  writeFileSync(path.join(OUT, "card.html"), html);
  say("[card] no webview iframe; card html saved");
}
await page.screenshot({ path: path.join(OUT, "shot.png"), fullPage: false });
writeFileSync(path.join(OUT, "log.txt"), log.join("\n"));
if (mode === "probe") { await ctx.close(); process.exit(0); }
