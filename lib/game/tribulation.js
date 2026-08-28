import { REALMS, ASCEND_REALM, isMajorStep, realmName } from "../data/realms.js";
import { deriveStats } from "./stats.js";
import { xpNeed } from "./char.js";
import { makeRng } from "./rng.js";
import { countOf, removeItems } from "./inventory.js";
import { itemOf } from "../data/items.js";
import { pathOf } from "../data/paths.js";
import { HOUR } from "./time.js";

const BOLTS = { 1: 3, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 9, 8: 9, 9: 12 };
export const ACTIONS = ["tank", "parry", "dodge", "artifact", "talisman", "pill"];

function bolts(target, seed) {
  const rng = makeRng(seed);
  const n = BOLTS[target] ?? 5;
  const out = [];
  for (let i = 0; i < n; i++) {
    const kind = i === n - 1 ? "心魔" : rng.weighted([["雷", 6], ["火", 2], ["风", 2]]);
    const pow = 0.22 + i * 0.045 + rng.next() * 0.1;
    out.push({ k: kind, p: +pow.toFixed(3) });
  }
  return out;
}

export function startTribulation(c, now, seed) {
  if (c.r >= ASCEND_REALM) return { ok: false, msg: "已登仙籍" };
  if (c.trib) return { ok: false, msg: "天劫已至" };
  if (!isMajorStep(c.r, c.s)) return { ok: false, msg: "此非大境界关口" };
  if (c.xp < xpNeed(c)) return { ok: false, msg: "修为未满" };
  const st = deriveStats(c);
  if (st.qi) return { ok: false, msg: "走火入魔之际渡劫必死，先养伤" };
  const target = c.r + 1;
  const seedStr = `${seed}:${c.uid}:${c.ac}`;
  c.trib = {
    target, seed: seedStr, i: 0, n: (BOLTS[target] ?? 5), hp: 1, mp: 1, art: 1, log: [], t: now,
  };
  c.ac++;
  c.stats.tribs++;
  return { ok: true, msg: `乌云聚集，${target >= ASCEND_REALM ? "飞升" : REALMS[target].name}之劫降临！`, trib: tribView(c, st) };
}

export function tribView(c, st) {
  if (!c.trib) return null;
  const T = c.trib;
  const list = bolts(T.target, T.seed);
  return {
    target: T.target, targetName: T.target >= ASCEND_REALM ? "飞升" : REALMS[T.target].name,
    i: T.i, n: T.n, hp: T.hp, mp: T.mp, art: T.art, bolts: list.slice(0, T.i + 1), log: T.log.slice(-6),
    can: {
      artifact: T.art > 0 && !!c.eq.w,
      talisman: countOf(c, "t_bilei") > 0,
      pill: countOf(c, "p_dingxin") > 0,
      parry: T.mp >= 0.1, dodge: T.mp >= 0.15,
    },
    maxHp: st.hp, maxMp: st.mp,
  };
}

// One bolt. Returns { ok, done?, success?, msg, trib }.
export function tribStep(c, action, now) {
  if (!c.trib) return { ok: false, msg: "没有天劫" };
  if (!ACTIONS.includes(action)) return { ok: false, msg: "无此应对" };
  const T = c.trib;
  const st = deriveStats(c);
  const list = bolts(T.target, T.seed);
  const bolt = list[T.i];
  const rng = makeRng(`${T.seed}:${T.i}:${action}`);
  const pm = pathOf(c.path)?.trib ?? {}; // 渡劫专长在道途的 trib 字段里，不在 mods 里
  let dmg = st.hp * bolt.p * (0.9 + rng.next() * 0.3);
  dmg *= 1 - Math.min(0.5, st.trib);
  if (c.root.t === "bian" && bolt.k === "雷") dmg *= 0.75;
  let note = "";
  let mpCost = 0;
  if (bolt.k === "心魔") {
    // the last bolt tests the heart: wisdom and a clear mind
    const resist = Math.min(0.6, (c.wu ?? 0) * 0.02) + (st.heart ? -0.2 : 0);
    dmg *= 1 - resist;
    note = "心魔幻象";
  }
  switch (action) {
    case "tank": dmg *= 0.8 * (1 - (pm.tank ?? 0)); note += " 硬抗"; break;
    case "parry":
      if (T.mp >= 0.1) { mpCost = 0.1; dmg *= 0.5 * (1 - (pm.ward ?? 0)); note += " 招架"; }
      else { note += " 灵力不足，招架失败"; }
      break;
    case "dodge": {
      if (T.mp >= 0.15) {
        mpCost = 0.15;
        const p = 0.3 + (pm.dodge ?? 0) + Math.min(0.2, st.spd / (st.spd + 200));
        if (rng.chance(p)) { dmg = 0; note += " 御剑闪避成功"; } else { note += " 闪避失败"; }
      } else note += " 灵力不足，无法御剑";
      break;
    }
    case "artifact":
      if (T.art > 0 && c.eq.w) { T.art--; dmg *= 0.3; note += ` 祭出${itemOf((c.inv.arts.find((a) => a.iid === c.eq.w) ?? {}).id)?.name ?? "法宝"}`; }
      else note += " 无法宝可祭";
      break;
    case "talisman":
      if (countOf(c, "t_bilei") > 0) { removeItems(c, [["t_bilei", 1]]); dmg = 0; note += " 避雷符化去此雷"; }
      else note += " 没有避雷符";
      break;
    case "pill":
      if (countOf(c, "p_dingxin") > 0) { removeItems(c, [["p_dingxin", 1]]); T.hp = Math.min(1, T.hp + 0.4); c.tox = Math.min(100, c.tox + 5); note += " 服定心丹回复四成"; }
      else note += " 没有定心丹";
      break;
  }
  T.mp = Math.max(0, T.mp - mpCost);
  const frac = dmg / st.hp;
  T.hp = Math.max(0, T.hp - frac);
  T.log.push({ i: T.i, k: bolt.k, d: Math.round(dmg), hp: +T.hp.toFixed(3), note: note.trim() });
  T.i++;
  T.mp = Math.min(1, T.mp + 0.04);

  if (T.hp <= 0) {
    // failure
    const target = T.target;
    c.trib = null;
    c.hpP = 0.1; c.mpP = 0.2;
    c.dbf.injury = now + 24 * HOUR;
    c.xp = Math.max(0, c.xp - xpNeed(c) * 0.5);
    c.lifeBonus = (c.lifeBonus ?? 0) - 10;
    if (c.r >= 2 && c.s > 0) c.s--;
    c.stats.btFail++;
    c.pillBt = 0;
    return { ok: true, done: true, success: false, msg: `第${T.i}道${bolt.k}劫落下，你倒在了雷光里。重伤、跌境、折寿十年。${target >= 2 ? "但你还活着。" : ""}`, trib: null, log: T.log };
  }
  if (T.i >= T.n) {
    // success
    const target = T.target;
    c.trib = null;
    c.xp = 0;
    c.r = target;
    c.s = 0;
    c.hpP = Math.max(0.2, T.hp); c.mpP = Math.max(0.2, T.mp);
    c.pillBt = 0;
    c.wu += 2;
    const ascended = target >= ASCEND_REALM;
    if (ascended) c.ascended = true;
    return { ok: true, done: true, success: true, target, msg: ascended ? "九重天雷散尽，云开处金光万丈。你，飞升了。" : `雷劫散去，天地澄明。你已是${realmName(c.r, c.s)}。`, trib: null, log: T.log };
  }
  return { ok: true, done: false, msg: `第${T.i}道${bolt.k}劫：${note.trim()}，伤 ${Math.round(dmg)}`, trib: tribView(c, st) };
}

export function abandonTribulation(c, now) {
  if (!c.trib) return { ok: false, msg: "没有天劫" };
  // Escaping mid-tribulation is worse than failing: the heavens do not forgive.
  c.trib = null;
  c.hpP = 0.05;
  c.dbf.injury = now + 48 * HOUR;
  c.xp = Math.max(0, c.xp - xpNeed(c) * 0.7);
  c.lifeBonus = (c.lifeBonus ?? 0) - 20;
  return { ok: true, msg: "你逃了。天劫追着你劈了三天三夜。" };
}
