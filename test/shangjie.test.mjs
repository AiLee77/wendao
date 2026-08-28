// v6 上界 content: 九天罡风层 / 太虚古战场 — region gating, tier plumbing, the 雷池 chain,
// the world-boss pool extension, the two new recipes and the t5 shop bracket.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Site } from "./harness.mjs";
import { DAY } from "../lib/game/time.js";
import { worldFor } from "../lib/game/boss.js";
import { MONSTER_MAP, TIER_REALM, TIER_OF_REALM } from "../lib/data/monsters.js";
import { EVENT_MAP } from "../lib/data/events.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

async function create(site, uid, name) {
  await site.call(uid, "boot");
  const r = await site.call(uid, "create", { name });
  assert.equal(r.ok, true, r.msg);
}
const regionOf = (list, id) => list.find((r) => r.id === id);

test("tier tables line up with the regions they serve", () => {
  assert.deepEqual(TIER_REALM, [0, 1, 2, 3, 5, 6, 7]);
  assert.deepEqual(TIER_OF_REALM, [0, 1, 2, 3, 4, 4, 5, 6, 6]);
});

test("九天 opens at 化神, 太虚 at 大乘; a 合体 修士 is still turned away from 太虚", async () => {
  const site = new Site();
  await create(site, 1, "问风客");

  site.setChar(1, (c) => { c.r = 4; c.s = 0; });
  let v = await site.call(1, "regions");
  assert.equal(v.ok, true, v.msg);
  assert.equal(regionOf(v.data.regions, "jiutian").open, false, "化神以下进不了九天");
  assert.equal(regionOf(v.data.regions, "taixu").open, false);

  site.setChar(1, (c) => { c.r = 5; });
  v = await site.call(1, "regions");
  assert.equal(regionOf(v.data.regions, "jiutian").open, true, "炼虚可入九天");
  assert.equal(regionOf(v.data.regions, "taixu").open, false);

  site.setChar(1, (c) => { c.r = 7; });
  v = await site.call(1, "regions");
  assert.equal(regionOf(v.data.regions, "jiutian").open, true);
  assert.equal(regionOf(v.data.regions, "taixu").open, true, "大乘可入太虚");

  // the realm gate is enforced on the way in, not just in the view
  site.setChar(1, (c) => { c.r = 6; c.ev = null; c.st = 20; c.daily.exp = 0; });
  const blocked = await site.call(1, "explore", { region: "taixu" });
  assert.equal(blocked.ok, false, "合体期还进不去太虚");
});

test("九天 exploration only ever yields tier-5 monsters or 九天/any events", async () => {
  const site = new Site();
  await create(site, 1, "御风者");
  site.setChar(1, (c) => { c.r = 5; c.s = 0; });
  let encounters = 0, stories = 0;
  for (let i = 0; i < 40; i++) {
    site.setChar(1, (c) => { c.ev = null; c.st = 20; c.daily.exp = 0; c.hpP = 1; c.trib = null; });
    const v = await site.call(1, "explore", { region: "jiutian" });
    assert.equal(v.ok, true, v.msg);
    const ev = v.data.event;
    assert.ok(ev, "explore returned no event");
    if (ev.id.startsWith("enc:")) {
      encounters++;
      const m = MONSTER_MAP[ev.id.slice(4)];
      assert.ok(m, `unknown encounter ${ev.id}`);
      assert.equal(m.t, 5, `${m.id} is tier ${m.t}, not a 九天 monster`);
      assert.equal(!!m.boss, false, "plain encounters are never bosses");
    } else {
      stories++;
      const e = EVENT_MAP[ev.id];
      assert.ok(e, `unknown event ${ev.id}`);
      assert.ok(e.region === "jiutian" || e.region === "any", `${e.id} belongs to ${e.region}`);
      assert.ok(e.w > 0, `${e.id} has w:0 and must not roll`);
    }
  }
  assert.ok(encounters > 0 && stories > 0, `expected both kinds (enc ${encounters}, story ${stories})`);
});

test("雷池 chains into 雷狱蛟, and the 阵修-only option is refused without the path", async () => {
  const site = new Site();
  await create(site, 1, "破阵人");
  site.setChar(1, (c) => { c.r = 5; c.s = 0; c.path = "jian"; c.ev = { id: "jt_leichi", region: "jiutian", seed: "x" }; });

  const v = await site.call(1, "choose", { opt: "in" });
  assert.equal(v.ok, true, v.msg);
  assert.equal(v.data.result.next, "jt_leichi_in");
  assert.equal(v.data.event.id, "jt_leichi_in");
  assert.equal(site.char(1).ev.id, "jt_leichi_in");

  const denied = await site.call(1, "choose", { opt: "array" });
  assert.equal(denied.ok, false, "阵修专属选项不该对剑修开放");
  assert.equal(site.char(1).ev.id, "jt_leichi_in", "被拒绝后事件仍在");

  // the always-available way out still works
  const out = await site.call(1, "choose", { opt: "back" });
  assert.equal(out.ok, true, out.msg);
  assert.equal(site.char(1).ev, null);
});

test("world boss: pre-上界 days keep their boss, and the new pool does show up", () => {
  // captured from worldFor() before the tier-5/6 bosses existed
  for (const [day, id] of [[20000, "w_gumo"], [20001, "w_xuanwu"], [20004, "w_moxiu"]]) {
    assert.equal(worldFor(day).boss.id, id, `day ${day} changed boss`);
  }
  let fresh = 0;
  for (let d = 20000; d < 20200; d++) if (worldFor(d).boss.t >= 5) fresh++;
  assert.ok(fresh > 0, "the tier-5/6 bosses never manifest");
  assert.ok(fresh < 200, "they must not have replaced the old pool");
});

test("上界 recipes need the realm they were written for", async () => {
  const site = new Site();
  await create(site, 1, "炉主");
  const ids = (v) => [...v.data.recipes.pills, ...v.data.recipes.forge].map((r) => r.id);

  site.setChar(1, (c) => { c.r = 4; c.s = 0; });
  let v = await site.call(1, "recipes");
  assert.equal(v.ok, true, v.msg);
  assert.equal(ids(v).includes("r_hunyuan"), false, "化神不该见到混元丹方");
  assert.equal(ids(v).includes("f_r_taixujian"), false);

  site.setChar(1, (c) => { c.r = 7; });
  v = await site.call(1, "recipes");
  assert.equal(ids(v).includes("r_hunyuan"), true);
  assert.equal(ids(v).includes("f_r_taixujian"), true);
});

test("shop stocks tier-5 goods for a 大乘 修士", async () => {
  const site = new Site();
  await create(site, 1, "掌柜");
  let sawT5 = false;
  for (let d = 0; d < 30; d++) {
    site.setChar(1, (c) => { c.r = 7; c.s = 0; });
    const v = await site.call(1, "shop");
    assert.equal(v.ok, true, v.msg);
    assert.ok(v.data.shop.length > 0, "empty stall");
    assert.equal(v.data.shop.every((s) => s.t <= 5), true, "shop must never stock above tier 5");
    if (v.data.shop.some((s) => s.t === 5)) sawT5 = true;
    site.advance(DAY);
  }
  assert.equal(sawT5, true, "30 days without a single 上界 good on the shelf");
});

test("the data validators still pass", () => {
  for (const tool of ["tools/validate-data.mjs", "tools/validate-events.mjs"]) {
    execFileSync(process.execPath, [tool], { cwd: ROOT, stdio: "pipe" }); // throws on a non-zero exit
  }
});
