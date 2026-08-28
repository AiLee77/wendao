// 灵兽: hatching, dispatch, loot, battle share, feeding, evolution, release, rebirth.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";
import { newCharacter } from "../lib/game/char.js";
import { HOUR } from "../lib/game/time.js";
import { makeRng } from "../lib/game/rng.js";
import { deriveStats, buildUnit } from "../lib/game/stats.js";
import { battle } from "../lib/game/battle.js";
import { monsterUnit } from "../lib/game/explore.js";
import { petView, petTick, petSend, petCollect, petFeed, petEvolve, petRelease, PT_MATS_BY_T, PT_TRIP_DAILY } from "../lib/game/pet.js";

const T0 = Date.UTC(2026, 8, 3, 8);
function mk(over = {}) {
  const c = newCharacter({ uid: 11, name: "驭兽人", now: T0, seed: "pet", legacy: null });
  c.sk = "sk";
  c.pet = { id: "e_linghu", name: "灵狐", elem: "火", atk: 0.3, hp: 0.3, lv: 0, xp: 0, hpP: 1, ev: 0, trip: null };
  Object.assign(c, over);
  return c;
}

test("hatching over a living beast needs a confirmation", async () => {
  const site = new Site();
  await site.call(12, "boot");
  await site.call(12, "create", { name: "孵蛋人" });
  site.setChar(12, (c) => { c.inv.stack.e_linghu = 2; });
  const first = await site.call(12, "use", { id: "e_linghu" });
  assert.equal(first.ok, true, first.msg);
  assert.equal(site.char(12).pet.name, "灵狐");
  const again = await site.call(12, "use", { id: "e_linghu" });
  assert.equal(again.ok, false);
  assert.equal(again.confirm, true, "the client is told to ask first");
  assert.equal(site.char(12).inv.stack.e_linghu, 1, "the egg was not spent");
  const sure = await site.call(12, "use", { id: "e_linghu", confirm: "1" });
  assert.equal(sure.ok, true, sure.msg);
  assert.equal(site.char(12).inv.stack.e_linghu, undefined);
  assert.equal(site.char(12).pet.lv, 0);
});

test("dispatch checks the region, the beast's wounds and the daily count; loot matches the region tier", async () => {
  const c = mk();
  assert.equal(petSend(c, "wanyao", 8, T0).ok, false, "region locked at 炼气");
  assert.equal(petSend(c, "qingshan", 5, T0).ok, false, "only 4 / 8 / 12 hours");
  c.pet.hpP = 0.2;
  assert.match(petSend(c, "qingshan", 8, T0).msg, /歇一歇/);
  c.pet.hpP = 1;
  const s = petSend(c, "qingshan", 8, T0);
  assert.equal(s.ok, true, s.msg);
  assert.equal(c.pet.trip.region, "qingshan");
  assert.equal(petSend(c, "qingshan", 8, T0).ok, false, "already away");
  assert.equal(petCollect(c, T0 + HOUR).ok, false, "not home yet");
  const r = petCollect(c, T0 + 8 * HOUR);
  assert.equal(r.ok, true, r.msg);
  assert.equal(c.pet.trip, null);
  assert.ok(r.drops.length >= 1);
  const allowed = new Set([...PT_MATS_BY_T[0], "e_linghu", "m_jinghe", "r_ji", "r_tu"]);
  for (const d of r.drops) assert.ok(allowed.has(d.id), `unexpected drop ${d.id} from a tier 0 region`);
  assert.ok(c.pet.xp >= 80 || c.pet.lv > 0, "the beast gained 10 xp per hour");
  // the daily allowance
  for (let i = 1; i < PT_TRIP_DAILY; i++) {
    assert.equal(petSend(c, "qingshan", 4, T0).ok, true, "trip " + i);
    c.pet.trip = null;
  }
  const over = petSend(c, "qingshan", 4, T0);
  assert.equal(over.ok, false);
  assert.match(over.msg, /今日派遣已够/);
  assert.equal(petView(c, deriveStats(c), T0).tripsLeft, 0);
});

test("the same trip seed always pays the same loot", async () => {
  const a = mk(), b = mk();
  petSend(a, "qingshan", 12, T0);
  petSend(b, "qingshan", 12, T0);
  assert.equal(a.pet.trip.seed, b.pet.trip.seed);
  const ra = petCollect(a, T0 + 12 * HOUR);
  const rb = petCollect(b, T0 + 12 * HOUR + 5 * HOUR); // collected late, same result
  assert.deepEqual(ra.drops, rb.drops);
  assert.deepEqual(a.inv.stack, b.inv.stack);
});

test("a beast away on a trip does not join the fight", async () => {
  const c = mk({ r: 2 });
  const st = deriveStats(c);
  assert.ok(buildUnit(c, st).pet, "at home it fights");
  c.pet.trip = { region: "qingshan", at: T0, ready: T0 + 8 * HOUR, h: 8, seed: "x", noted: 0 };
  assert.equal(buildUnit(c, st).pet, null, "away it does not");
});

test("the beast soaks a quarter of each hit, stops once it is down, and heals back over an hour", async () => {
  const c = mk({ r: 3, s: 3 });
  const st = deriveStats(c);
  const me = buildUnit(c, st);
  me.tals = [];
  const foe = monsterUnit("w_yaowang", makeRng("foe"));
  const res = battle(me, foe, makeRng("fight"), "forest");
  assert.notEqual(res.a.petHp, null, "the result carries the beast's health");
  assert.ok(res.a.petHp < 1, "it took some of the damage");
  // a beast with a single point of health falls on the first hit and then stops biting
  const frail = mk({ r: 0, s: 3 });
  frail.pet.hp = 1 / deriveStats(frail).hp;
  const u2 = buildUnit(frail, deriveStats(frail));
  u2.tals = [];
  assert.equal(u2.pet.maxHp, 1);
  const res2 = battle(u2, monsterUnit("w_yelang", makeRng("foe")), makeRng("fight2"), "forest");
  assert.equal(res2.a.petHp, 0, "it went down");
  const bites = (r) => r.log.filter((e) => e.e === "灵兽" && e.w === "A").length;
  assert.ok(bites(res2) < bites(res), `a fallen beast bites less (${bites(res2)} vs ${bites(res)})`);
  const downAt = res2.log.findIndex((e) => e.e && String(e.e).includes("倒下"));
  assert.ok(downAt >= 0, "the log records the beast falling");
  assert.equal(res2.log.slice(downAt + 1).some((e) => e.e === "灵兽" && e.w === "A"), false, "it stops attacking");
  // the writeback in explore.js persists, and rest brings it back
  const site = new Site();
  await site.call(13, "boot");
  await site.call(13, "create", { name: "带兽人" });
  site.setChar(13, (ch) => { ch.r = 1; ch.s = 5; ch.pet = mk().pet; ch.ev = { id: "enc:w_jiao", region: "yunmeng", seed: "s1" }; });
  await site.call(13, "choose", { opt: "fight" });
  const hurt = site.char(13).pet;
  assert.ok(hurt.hpP <= 1 && hurt.hpP >= 0);
  assert.equal(typeof hurt.restAt, "number");
  site.setChar(13, (ch) => { ch.pet.hpP = 0.25; ch.pet.restAt = site.now; });
  site.advance(HOUR);
  await site.call(13, "home");
  assert.equal(site.char(13).pet.hpP, 1, "a full bar back per hour of rest");
});

test("feeding turns materials and pills into levels", async () => {
  const c = mk();
  c.inv.stack.m_yaodan = 1; c.inv.stack.p_ningyuan = 1; c.inv.stack.t_huo = 1;
  assert.equal(petFeed(c, "t_huo").ok, false, "符箓 is not food");
  assert.equal(petFeed(c, "m_bingpo").ok, false, "not in the bag");
  const r = petFeed(c, "m_yaodan");
  assert.equal(r.ok, true, r.msg);
  assert.equal(c.inv.stack.m_yaodan, undefined);
  assert.equal(c.pet.lv, 1, "120 xp clears the 50 needed for level 1");
  assert.equal(c.pet.xp, 70);
  const r2 = petFeed(c, "p_ningyuan"); // 600 xp / 10 = 60
  assert.equal(r2.ok, true, r2.msg);
  assert.equal(c.pet.lv, 2);
  const list = petView(c, deriveStats(c), T0).feed;
  assert.equal(list.some((f) => f.id === "t_huo"), false);
});

test("evolution costs materials, renames the beast and multiplies its power", async () => {
  const c = mk({ r: 3 });
  assert.equal(petEvolve(c).ok, false, "level 10 first");
  c.pet.lv = 10;
  const poor = petEvolve(c);
  assert.equal(poor.ok, false);
  assert.match(poor.msg, /材料不足/);
  const before = buildUnit(c, deriveStats(c)).pet.atk;
  c.inv.stack.m_yaodan = 1; c.inv.stack.m_xuanyuan = 1;
  const r = petEvolve(c);
  assert.equal(r.ok, true, r.msg);
  assert.equal(c.pet.ev, 1);
  assert.equal(c.pet.name, "灵·灵狐");
  assert.equal(c.inv.stack.m_yaodan, undefined);
  const after = buildUnit(c, deriveStats(c)).pet.atk;
  assert.ok(Math.abs(after / before - 1.3) < 0.02, `×1.3 (${before} -> ${after})`);
  assert.equal(petEvolve(c).ok, false, "level 20 for the second step");
  c.pet.lv = 20; c.inv.stack.m_yaodan = 1; c.inv.stack.m_xuanyuan = 1;
  assert.equal(petEvolve(c).ok, true);
  assert.equal(c.pet.name, "仙·灵狐");
  assert.equal(petEvolve(c).ok, false, "and no further");
});

test("releasing a beast needs a confirmation", async () => {
  const site = new Site();
  await site.call(14, "boot");
  await site.call(14, "create", { name: "放生人" });
  site.setChar(14, (c) => { c.pet = mk().pet; });
  const ask = await site.call(14, "pet.release", {});
  assert.equal(ask.ok, false);
  assert.equal(ask.confirm, true);
  assert.ok(site.char(14).pet, "still there");
  const done = await site.call(14, "pet.release", { confirm: "1" });
  assert.equal(done.ok, true, done.msg);
  assert.equal(site.char(14).pet, null);
  assert.equal(done.data.pet.pet, null);
  const c = mk();
  c.pet.trip = { region: "qingshan", at: T0, ready: T0 + HOUR, h: 4, seed: "x", noted: 0 };
  assert.equal(petRelease(c, true).ok, false, "not while it is away");
});

test("rebirth keeps neither the 灵田 nor the 灵兽", async () => {
  const site = new Site();
  await site.call(15, "boot");
  await site.call(15, "create", { name: "转世农" });
  site.setChar(15, (c) => {
    c.r = 2; c.pet = mk().pet; c.inv.stack.s_lingcao = 1;
  });
  await site.call(15, "farm.plant", { i: 0, seed: "s_lingcao" });
  assert.ok(site.char(15).farm.plots[0]);
  site.setChar(15, (c) => { c.dead = { t: site.now, age: 99, cause: "寿元耗尽" }; });
  const r = await site.call(15, "rebirth", { name: "新农" });
  assert.equal(r.ok, true, r.msg);
  const c = site.char(15);
  assert.equal(c.pet, null, "the beast does not follow you into the next life");
  assert.equal((c.farm?.plots ?? []).filter(Boolean).length, 0, "the field is left behind");
  assert.equal(r.me.farm.ready, 0);
  const v2 = await site.call(15, "home");
  assert.equal(site.char(15).farm.plots.length, 2, "a new life lazily starts with two empty plots");
  assert.equal(v2.me.farm.n, 2);
  assert.equal(v2.data.home.farm.plots.filter((p) => p.seed).length, 0);
});
