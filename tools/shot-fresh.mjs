// Fresh-player experience pass: no cheats beyond stamina, phone width, screenshots each new surface.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = (process.env.LOCALAPPDATA ?? "/tmp") + "/Temp/claude/wendao-browser-out/fresh";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 });
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 160)); });
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
const btn = (t) => page.locator("#wd button", { hasText: t }).first();
const txt = async () => (await page.locator("#wd").innerText()).replace(/\s+/g, " ");
await page.goto("http://localhost:8790/?uid=1"); await wait(900);
if (await page.locator("#app input").count()) { await page.fill("#app input", "初来客"); await btn("定下道号").click(); await wait(900); await btn("就这样").click(); await wait(900); }
await shot("01-home-fresh");
// what does a brand-new player's 悬赏 look like
await btn("道册").click(); await wait(900); await shot("02-bounty-fresh");
// 秘境 as a 炼气 player
await btn("游历").click(); await wait(700); await btn("秘境").click(); await wait(900); await shot("03-dungeon-lobby-fresh");
await btn("寻幽").click(); await wait(1200); await shot("04-dungeon-floor1");
for (let i = 0; i < 3; i++) {
  const o = page.locator("#app button.opt:not([disabled])").first();
  if (!(await o.count())) break;
  await o.click(); await wait(2200);
  const sk = page.locator("#overlay button", { hasText: "跳过" }); if (await sk.count()) { await sk.first().click(); await wait(600); }
  const ov = page.locator("#overlay button.pri"); if (await ov.count()) { await ov.first().click(); await wait(600); }
}
await shot("05-dungeon-mid");
// 连珠
await btn("论道").click(); await wait(700); await btn("棋局").click(); await wait(1000); await shot("06-wuxing-fresh");
// play three swaps like a human: click a tile then a neighbour, repeat
const n = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const steps = () => { const m = document.getElementById("wd").innerText.match(/第 (\d+)\/20 步/); return m ? Number(m[1]) : 0; };
  let done = 0;
  for (let r = 0; r < 6 && done < 3; r++) for (let c = 0; c < 5 && done < 3; c++) {
    const t = document.querySelectorAll("#wd .wxt"); const b = steps();
    t[r * 6 + c].click(); await sleep(70); t[r * 6 + c + 1].click(); await sleep(400);
    if (steps() > b) done++;
  }
  return done;
});
await wait(600); await shot("07-wuxing-played");
console.log("swaps landed:", n, "| board text:", (await txt()).match(/第 \d+\/20 步.{0,60}/)?.[0]);
// 行囊 / 灵兽 empty state, 洞府 farm empty state
await btn("行囊").click(); await wait(700); if (await btn("灵兽").count()) { await btn("灵兽").click(); await wait(800); await shot("08-pet-empty"); }
await btn("洞府").click(); await wait(900); await shot("09-home-farm-empty");
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no client errors");
await browser.close();
