// Drives the live playtest card (blocks surface) in the persistent Chrome profile and records every step.
// usage: node tools/play.mjs [scriptName]   — screenshots + log land in wendao-browser-out/
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const PROFILE = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-profile";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out";
mkdirSync(OUT, { recursive: true });
const log = [];
const say = (...a) => { const s = a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "); console.log(s); log.push(s); };
const ctx = await chromium.launchPersistentContext(PROFILE, { channel: "chrome", headless: process.env.HEADED ? false : true, viewport: { width: 1100, height: 1400 } });
const page = ctx.pages()[0] ?? (await ctx.newPage());
page.on("pageerror", (e) => say("[pageerror]", e.message));
page.on("response", async (r) => {
  if (!r.url().includes("/apps/installs/")) return;
  let body = ""; try { body = await r.text(); } catch {}
  let j = null; try { j = JSON.parse(body); } catch {}
  const err = j?.error ? JSON.stringify(j.error) : "";
  say("[res]", r.status(), r.url().split("/").slice(-2).join("/"), err, j?.effects ? `effects=${j.effects.length}` : body.slice(0, 200));
});
const card = () => page.locator(".discourse-app").first();
const text = async () => (await card().innerText()).replace(/\n+/g, " | ");
const click = async (label, nth = 0) => {
  const b = card().getByRole("button", { name: label }).nth(nth);
  await b.waitFor({ timeout: 15000 });
  await b.click();
  await page.waitForTimeout(1200);
  // wait until not busy (buttons re-enabled)
  for (let i = 0; i < 40; i++) { const busy = await card().locator("button[disabled]").count(); const total = await card().locator("button").count(); if (busy < total) break; await page.waitForTimeout(250); }
};
const fill = async (placeholder, value) => { await card().getByPlaceholder(placeholder).first().fill(value); await page.waitForTimeout(200); };
const shot = async (name) => { await card().screenshot({ path: path.join(OUT, name + ".png") }); };
const has = async (re) => re.test(await text());

let step = 0;
const expect = async (re, label) => { const t = await text(); const ok = re.test(t); say(`[step ${++step}] ${ok ? "✓" : "✗"} ${label}`, ok ? "" : "TEXT=" + t.slice(0, 600)); if (!ok) await shot(`fail-${step}`); return ok; };

try {
  await page.goto("https://www.nodeloc.com/apps/authoring/wendao", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const start = page.getByRole("button", { name: /开始试玩/ });
  if (await start.count()) { await start.first().click(); await page.waitForTimeout(3000); }
  await card().waitFor({ timeout: 20000 });
  say("[card]", (await text()).slice(0, 300));
  await shot("00-start");

const optionButton = () => card().locator("button:not([disabled])").filter({ hasText: /[一-鿿]{2,}/ }).filter({ hasNotText: /洞府|游历|行囊|坊市|论道|宗门|榜单|传记|试玩|重试/ }).first();
  const script = process.argv[2] ?? "full";
  if (script === "full") {
    if (await has(/踏上仙路/)) {
      await fill("取一个道号", "块中仙");
      await click("定下道号");
      await expect(/洞府/, "created");
    }
    await shot("01-home");
    if (await has(/逆天改命/)) { await click(/逆天改命/); await expect(/天命重定|已踏上/, "reroll"); }
    if (await card().getByRole("button", { name: "吐纳", disabled: false }).count()) { await click("吐纳"); await expect(/修为 [+]|气息未平/, "breathe"); } else say("[skip] 吐纳 on cooldown");
    await click("游历"); for (let i = 0; i < 3 && (await has(/奇遇|遭遇/)); i++) { await optionButton().click(); await page.waitForTimeout(1500); await click("游历"); await page.waitForTimeout(1000); } await expect(/青山村/, "explore tab"); await shot("02-explore");
    await click(/青山村/); await expect(/奇遇|遭遇/, "event"); await shot("03-event");
    const opt = optionButton();
    await opt.click(); await page.waitForTimeout(1500); await expect(/经过|奇遇|遭遇/, "chose option"); await shot("04-result");
    await click("行囊"); await expect(/行囊|物品/, "bag"); await shot("05-bag");
    await click("炼制"); await expect(/炼丹/, "craft tab");
    await click("法宝"); await click("功法神通"); await expect(/太玄吐纳诀/, "skills");
    await click("坊市"); await expect(/每日换货/, "shop"); await shot("06-shop");
    await click("拍卖行"); await expect(/在拍/, "auction");
    await click("论道"); await expect(/今日余/, "arena"); await shot("07-arena");
    await click("讨伐"); await expect(/出手/, "boss tab");
    await click("出手"); await expect(/威能|气血不足|次数已尽/, "boss attack"); await shot("08-boss");
    await click("宗门"); await expect(/散修|门人/, "sect"); await shot("09-sect");
    await click("榜单"); await expect(/共 \d+ 人/, "lb"); await shot("10-lb");
    await click("战力"); await expect(/共 \d+ 人/, "lb power");
    await click("传记"); await expect(/年谱/, "bio"); await shot("11-bio");
    await click("洞府"); await expect(/洞府/, "back home"); await shot("12-home");
  }
  if (script === "explore") {
    await page.setViewportSize({ width: 390, height: 1200 });
    await click("游历"); await expect(/青山村/, "explore tab");
    for (let i = 0; i < 3; i++) {
      if (!(await has(/奇遇|遭遇/))) { const go = card().getByRole("button", { name: /青山村/ }); if (!(await go.isEnabled())) break; await go.click(); await page.waitForTimeout(1500); }
      await expect(/奇遇|遭遇/, `event ${i}`); await shot(`m-event-${i}`);
      const before = await text();
      const opts = card().locator("button:not([disabled])");
      const n = await opts.count();
      let label = null;
      for (let k = 0; k < n; k++) { const l = (await opts.nth(k).innerText()).replace(/[​‌﻿]/g, "").trim(); if (l && !/^(洞府|游历|行囊|坊市|论道|宗门|榜单|传记|…|\.\.\.)$/.test(l)) { label = l; break; } }
      say("[opt]", label);
      await card().getByRole("button", { name: label, exact: true }).first().click();
      await page.waitForTimeout(2500);
      const after = await text();
      say(`[step ${++step}] ${after !== before ? "✓" : "✗"} option applied`, after.slice(0, 400));
      await shot(`m-result-${i}`);
    }
  }
  if (script === "surface") { const id = process.argv[3] ?? "69"; const r = await page.evaluate(async (id) => { const csrf = document.querySelector("meta[name=csrf-token]")?.content; const x = await fetch("/apps/installs/" + id + "/render", { method: "POST", headers: { "content-type": "application/json", "X-CSRF-Token": csrf, "X-Requested-With": "XMLHttpRequest" }, body: "{}" }); return { status: x.status, app: (await x.json()).app }; }, id); say("[surface]", JSON.stringify(r)); }
  if (script === "buttons") { const all = await card().locator("button").allInnerTexts(); say("[buttons]", JSON.stringify(all)); }
  if (script === "mobile") {
    await page.setViewportSize({ width: 390, height: 1300 });
    await click("洞府"); await expect(/洞府/, "home"); await shot("mb-home");
    await click("行囊"); await expect(/物品/, "bag"); await shot("mb-bag");
    if (await card().getByRole("button", { name: "使用" }).count()) { await click("使用"); await expect(/服下/, "use pill"); }
    await click("游历"); await expect(/青山村|奇遇|遭遇/, "explore");
    if (await has(/奇遇|遭遇/)) { const o = optionButton(); say("[opt]", await o.innerText()); await o.click(); await page.waitForTimeout(1500); await click("游历"); await page.waitForTimeout(1200); }
    await shot("mb-regions");
    if (!(await has(/奇遇|遭遇/))) { await click(/青山村/); await page.waitForTimeout(1200); }
    await expect(/奇遇|遭遇|伤势|体力/, "event or blocked"); await shot("mb-event");
    await click("论道"); await expect(/今日余/, "arena"); await shot("mb-arena");
    await click("宗门"); await expect(/散修|门人/, "sect"); await shot("mb-sect");
    await click("榜单"); await expect(/共 \d+ 人/, "lb"); await shot("mb-lb");
    await click("坊市"); await expect(/每日换货/, "shop"); await shot("mb-shop");
  }
} catch (e) {
  say("[error]", e.message);
  await shot("error");
} finally {
  writeFileSync(path.join(OUT, "play-log.txt"), log.join("\n"));
  await ctx.close();
}
