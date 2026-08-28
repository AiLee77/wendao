// 法宝淬炼: reforge / lock / star merge / runes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";
import { newCharacter } from "../lib/game/char.js";
import { makeRng } from "../lib/game/rng.js";
import { rollArtifact, AFFIX_MAX } from "../lib/game/inventory.js";
import { deriveStats } from "../lib/game/stats.js";
import { refineView, refineReforge, refineStar, refineRune, refineUnrune, RF_COST, rfSockets, rfRuneValue } from "../lib/game/refine.js";
import { itemOf } from "../lib/data/items.js";

function mk(over = {}) {
  const c = newCharacter({ uid: 1, name: "淬炼子", now: 0, seed: "refine", legacy: null });
  c.ls = 100000;
  Object.assign(c, over);
  return c;
}
function give(c, id, q = 1, af = []) {
  c.ic = (c.ic ?? 0) + 1;
  const it = { iid: c.ic, id, q, af };
  c.inv.arts.push(it);
  return it;
}
const YES = { chance: () => true };
const NO = { chance: () => false };

test("rolled and reforged affixes never repeat a stat on the same artifact", async () => {
  for (let i = 0; i < 60; i++) {
    const c = mk();
    const it = rollArtifact(c, "f_leijian", makeRng("art:" + i));
    const sts = (it.af ?? []).map((a) => a.st);
    assert.equal(new Set(sts).size, sts.length, "roll #" + i + " has duplicate affix stats");
    assert.ok(sts.length <= AFFIX_MAX[3]);
  }
  // reforging the first slot must not collide with the affix left in the second
  const c = mk();
  c.inv.stack.m_xuanyuan = 200; c.inv.stack.m_jinghe = 200;
  const it = give(c, "f_leijian", 3, [{ st: "atk", v: 10, n: "锋锐" }, { st: "def", v: 10, n: "坚固" }]);
  for (let i = 0; i < 30; i++) {
    const r = refineReforge(c, it.iid, 0, null, makeRng("rf:" + i));
    assert.equal(r.ok, true, r.msg);
    assert.notEqual(it.af[0].st, it.af[1].st);
  }
});

test("reforge replaces only the target slot and charges the tier cost", async () => {
  const c = mk();
  c.ls = 1000; c.inv.stack.m_shuijing = 5;
  const it = give(c, "f_shuijian", 2, [{ st: "atk", v: 7, n: "锋锐" }, { st: "hp", v: 33, n: "厚血" }]);
  const keep = JSON.parse(JSON.stringify(it.af[1]));
  const r = refineReforge(c, it.iid, 0, null, makeRng("one"));
  assert.equal(r.ok, true, r.msg);
  assert.equal(c.ls, 1000 - RF_COST[1][0], "灵石 charged once");
  assert.equal(c.inv.stack.m_shuijing, 5 - RF_COST[1][1][0][1], "材料 charged once");
  assert.deepEqual(it.af[1], keep, "the other slot is untouched");
  assert.equal(it.af.length, 2);
  assert.equal(c.stats.refines, 1);
  // not enough materials -> refused, nothing charged
  c.inv.stack.m_shuijing = 1;
  const ls0 = c.ls;
  const bad = refineReforge(c, it.iid, 0, null, makeRng("two"));
  assert.equal(bad.ok, false);
  assert.match(bad.msg, /材料不足/);
  assert.equal(c.ls, ls0);
});

test("保值重铸：双倍价，属性不变，数值只升不降", async () => {
  const c = mk();
  c.ls = 100000; c.inv.stack.m_shuijing = 200;
  const it = give(c, "f_shuijian", 2, [{ st: "crit", v: 0.03, n: "锐意" }, { st: "hp", v: 33, n: "厚血" }]);
  const before = JSON.parse(JSON.stringify(it.af[1]));
  const ls0 = c.ls, mat0 = c.inv.stack.m_shuijing;
  const r = refineReforge(c, it.iid, 1, 1, makeRng("lock"));
  assert.equal(r.ok, true, r.msg);
  assert.match(r.msg, /保值重铸/);
  assert.equal(c.ls, ls0 - RF_COST[1][0] * 2, "保值重铸收双倍灵石");
  assert.equal(c.inv.stack.m_shuijing, mat0 - RF_COST[1][1][0][1] * 2, "材料也是双倍");
  assert.equal(it.af[1].st, before.st, "属性不变");
  assert.ok(it.af[1].v >= before.v, "数值不会变差");
  assert.deepEqual(it.af[0], { st: "crit", v: 0.03, n: "锐意" }, "别的槽位不动");
  // 30 次保值重铸，属性始终不变、数值单调不降
  let cur = it.af[1].v;
  for (let k = 0; k < 30; k++) {
    const x = refineReforge(c, it.iid, 1, 1, makeRng("keep" + k));
    assert.equal(x.ok, true, x.msg);
    assert.equal(it.af[1].st, before.st);
    assert.ok(it.af[1].v >= cur, `第 ${k} 次变差了：${cur} -> ${it.af[1].v}`);
    cur = it.af[1].v;
  }
  // 不保值时属性可以换成别的
  let changed = false;
  for (let k = 0; k < 30 && !changed; k++) {
    refineReforge(c, it.iid, 1, null, makeRng("free" + k));
    if (it.af[1].st !== before.st) changed = true;
  }
  assert.ok(changed, "普通重铸会换属性");
});

test("a new affix slot opens only while under the tier cap", async () => {
  const c = mk();
  c.inv.stack.m_tiekuang = 30; c.inv.stack.m_shuijing = 30;
  const t0 = give(c, "f_tiejian", 1, []);
  assert.equal(refineReforge(c, t0.iid, 0, null, makeRng("a")).ok, true, "first slot opens");
  assert.equal(t0.af.length, 1);
  const full = refineReforge(c, t0.iid, 1, null, makeRng("b"));
  assert.equal(full.ok, false);
  assert.match(full.msg, /最多开 1 条词缀/);
  const t1 = give(c, "f_shuijian", 1, [{ st: "atk", v: 5, n: "锋锐" }]);
  assert.equal(refineReforge(c, t1.iid, 1, null, makeRng("c")).ok, true, "second slot opens at tier 1");
  assert.equal(t1.af.length, AFFIX_MAX[1]);
  assert.equal(refineReforge(c, t1.iid, 2, null, makeRng("d")).ok, false);
  assert.equal(refineReforge(c, t1.iid, 5, null, makeRng("e")).ok, false, "out of range slot refused");
});

test("star merge eats the spare, stops at five stars, and picks the lowest spare by default", async () => {
  const c = mk();
  const a = give(c, "f_shuijian", 1);
  give(c, "f_shuijian", 3);
  const low = give(c, "f_shuijian", 2);
  const ls0 = c.ls;
  const r = refineStar(c, a.iid, undefined, YES);
  assert.equal(r.ok, true, r.msg);
  assert.equal(r.success, true);
  assert.equal(a.q, 2);
  assert.equal(c.ls, ls0 - RF_COST[1][0] * 2, "star costs double the reforge 灵石");
  assert.equal(c.inv.arts.some((x) => x.iid === low.iid), false, "the lowest-quality spare was consumed");
  assert.equal(c.inv.arts.length, 2);
  a.q = 5;
  const cap = refineStar(c, a.iid, undefined, YES);
  assert.equal(cap.ok, false);
  assert.match(cap.msg, /五星/);
  // an equipped artifact may not be sacrificed
  const b = give(c, "f_jiaolinjia", 1);
  const eq = give(c, "f_jiaolinjia", 1);
  c.eq.a = eq.iid;
  const guard = refineStar(c, b.iid, eq.iid, YES);
  assert.equal(guard.ok, false);
  assert.match(guard.msg, /祭炼在身/);
  assert.equal(refineStar(c, b.iid, undefined, YES).ok, false, "no free spare left");
});

test("a failed star merge burns only the sacrifice", async () => {
  const c = mk();
  const a = give(c, "f_shuijian", 4, [{ st: "atk", v: 9, n: "锋锐" }]);
  const s = give(c, "f_shuijian", 1);
  const ls0 = c.ls;
  const r = refineStar(c, a.iid, s.iid, NO);
  assert.equal(r.ok, true, r.msg);
  assert.equal(r.success, false);
  assert.equal(a.q, 4, "target keeps its quality");
  assert.deepEqual(a.af, [{ st: "atk", v: 9, n: "锋锐" }], "target keeps its affixes");
  assert.equal(c.inv.arts.length, 1);
  assert.equal(c.ls, ls0 - RF_COST[1][0] * 2, "the 灵石 are still spent");
  // 器修 gets the flat bonus on top of the base chance
  const qi = mk({ path: "qi" });
  const t = give(qi, "f_shuijian", 4);
  give(qi, "f_shuijian", 1);
  assert.equal(refineView(qi, t.iid).star.p, 0.55);
});

test("a socketed rune reaches deriveStats and the arena snapshot; pulling it out destroys it", async () => {
  const site = new Site();
  await site.call(3, "boot");
  await site.call(3, "create", { name: "刻纹客" });
  site.setChar(3, (c) => {
    c.r = 2; c.ls = 50000; c.inv.stack.r_feng = 1;
    c.ic = 1; c.inv.arts.push({ iid: 1, id: "f_huoyun", q: 3, af: [] }); c.eq.w = 1;
  });
  const before = deriveStats(site.char(3)).atk;
  const v = await site.call(3, "refine.rune", { iid: 1, rune: "r_feng" });
  assert.equal(v.ok, true, v.msg);
  const c = site.char(3);
  assert.equal(c.inv.arts[0].rn.length, 1);
  assert.equal(c.inv.stack.r_feng, undefined, "the rune was consumed");
  const want = rfRuneValue(itemOf("f_huoyun"), 2, itemOf("r_feng"));
  assert.ok(want > 0);
  assert.ok(deriveStats(c).atk > before, "攻击 rose");
  assert.equal(site.shared.get("p:3").b.atk, deriveStats(c).atk, "the arena snapshot carries it");
  assert.equal(v.data.refine.rn.length, 1);
  const u = await site.call(3, "refine.unrune", { iid: 1, k: 0 });
  assert.equal(u.ok, true, u.msg);
  assert.equal(site.char(3).inv.arts[0].rn.length, 0);
  assert.equal(site.char(3).inv.stack.r_feng, undefined, "the rune is destroyed, not refunded");
  assert.equal(deriveStats(site.char(3)).atk, before);
});

test("rune sockets are limited by tier, cannot repeat a stat, and need the item in the bag", async () => {
  const c = mk();
  c.inv.stack.r_feng = 3; c.inv.stack.r_shi = 1; c.inv.stack.r_yun = 1;
  assert.equal(rfSockets(0), 1);
  assert.equal(rfSockets(2), 3);
  const t0 = give(c, "f_tiejian", 1);
  assert.equal(refineRune(c, t0.iid, "r_feng").ok, true);
  const over = refineRune(c, t0.iid, "r_shi");
  assert.equal(over.ok, false);
  assert.match(over.msg, /只有 1 个纹槽/);
  const t2 = give(c, "f_huoyun", 1);
  assert.equal(refineRune(c, t2.iid, "r_feng").ok, true);
  const dup = refineRune(c, t2.iid, "r_feng");
  assert.equal(dup.ok, false);
  assert.match(dup.msg, /重叠/);
  assert.equal(refineRune(c, t2.iid, "m_lingcao").ok, false, "a plain material is not a rune");
  assert.equal(refineRune(c, t2.iid, "r_sha").ok, false, "not in the bag");
  assert.equal(refineUnrune(c, t2.iid, 4).ok, false, "empty socket");
  const view = refineView(c, t2.iid);
  assert.equal(view.maxRn, 3);
  assert.equal(view.rn.length, 1);
  assert.ok(view.runes.some((r) => r.id === "r_yun"));
  assert.equal(view.runes.find((r) => r.id === "r_feng").had, true);
});
