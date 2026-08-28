// 灵兽派遣 + 养成: send the beast out for hours, feed it, evolve it, or let it go.
// A trip's loot is rolled from the seed chosen when it left, so collecting late changes nothing.
import { itemOf, ITEMS } from "../data/items.js";
import { REGIONS, regionOf } from "../data/regions.js";
import { addStack, countOf, hasItems, removeItems } from "./inventory.js";
import { petGain, PET_MAX_LV } from "./explore.js";
import { xpNeed } from "./char.js";
import { makeRng } from "./rng.js";
import { HOUR } from "./time.js";

export const PT_TRIP_DAILY = 3;
export const PT_HOURS = [4, 8, 12];
export const PT_YIELD = { 4: 0.6, 8: 1, 12: 1.5 };
export const PT_HP_MIN = 0.3;
export const PT_EVO_LV = [10, 20];
export const PT_EVO_PREFIX = ["", "灵·", "仙·"];
// which 妖兽 portrait stands in for a hatched egg
export const PT_MON = { e_linghu: "w_hulimei", e_shuijiao: "w_jiao", e_leiying: "w_leiniao", e_xuanwu: "w_xuanwu", e_qilin: "w_xingling" };
export const PT_MATS_BY_T = [
  ["m_lingcao", "m_tiekuang", "m_yaopi"],
  ["m_shuijing", "m_jiaolin", "m_hanlian"],
  ["m_yaodan", "m_longxue", "m_xuanjin"],
  ["m_leijing", "m_bingpo", "m_xuanyuan"],
  ["m_xingchen", "m_xukong", "m_xianlu"],
  ["m_gangfeng", "m_xianjin", "m_taixu"],
  ["m_taixu", "m_xianjin", "m_gangfeng"],
];
export const PT_FEED_CAP = 2000;

function ptNeed(lv) {
  return 50 * ((lv ?? 0) + 1);
}
function ptEvoCost(c) {
  const eggT = itemOf(c.pet?.id)?.t ?? 0;
  return [["m_yaodan", 1 + eggT], ["m_xuanyuan", 1 + eggT]];
}
function ptFeedXp(def) {
  if (!def) return 0;
  if (def.k === "mat") return Math.min(PT_FEED_CAP, def.v ?? 0);
  if (def.k === "pill" && def.fx && def.fx.xp) return Math.min(PT_FEED_CAP, Math.round(def.fx.xp / 10));
  return 0;
}
function ptDrop(c, id, n, into) {
  const d = itemOf(id);
  if (!d || n <= 0) return;
  into.push({ id, n, name: d.name, t: d.t, lost: !addStack(c, id, n) });
}

// housekeeping: the beast heals a full bar per hour of rest and calls out once when it gets home.
export function petTick(c, now, notes) {
  const p = c.pet;
  if (!p) return;
  p.hpP = p.hpP ?? 1;
  if (p.hpP < 1) {
    const h = Math.max(0, (now - (p.restAt ?? now)) / HOUR);
    if (h > 0) p.hpP = Math.min(1, p.hpP + h);
  }
  p.restAt = now;
  if (p.trip && now >= p.trip.ready && !p.trip.noted) {
    p.trip.noted = 1;
    if (notes) notes.push({ k: "pet", v: `${p.name}从${regionOf(p.trip.region)?.name ?? "远方"}回来了，带了些东西。` });
  }
}

export function petView(c, st, now) {
  const p = c.pet;
  const maxed = !!p && (p.lv ?? 0) >= PET_MAX_LV;
  const feed = maxed ? [] : Object.entries(c.inv.stack).map(([id, n]) => ({ id, n, d: itemOf(id) }))
    .map((x) => ({ id: x.id, n: x.n, name: x.d?.name ?? x.id, xp: ptFeedXp(x.d) }))
    .filter((x) => x.xp > 0).sort((a, b) => b.xp - a.xp).slice(0, 12);
  let pet = null;
  if (p) {
    const ev = Math.min(2, p.ev ?? 0);
    const lvm = (1 + (p.lv ?? 0) * 0.1) * [1, 1.3, 1.69][ev];
    const petMult = st?.pathMods?.pet ?? 1;
    const rg = p.trip ? regionOf(p.trip.region) : null;
    pet = {
      id: p.id, name: p.name, elem: p.elem, lv: p.lv ?? 0, xp: p.xp ?? 0, need: ptNeed(p.lv), hpP: p.hpP ?? 1, ev,
      mon: PT_MON[p.id] ?? null, eggTier: itemOf(p.id)?.t ?? 0,
      atk: Math.round((st?.atk ?? 0) * p.atk * lvm * petMult), hp: Math.round((st?.hp ?? 0) * p.hp * lvm * petMult),
      trip: p.trip ? { region: p.trip.region, regionName: rg?.name ?? p.trip.region, h: p.trip.h, ready: now >= p.trip.ready, left: Math.max(0, p.trip.ready - now) } : null,
      canEvolve: ev < 2 && (p.lv ?? 0) >= PT_EVO_LV[ev] && hasItems(c, ptEvoCost(c)),
      evoCost: ev < 2 ? ptEvoCost(c).map(([id, n]) => ({ id, name: itemOf(id)?.name ?? id, n, have: countOf(c, id) })) : [],
      evoLv: ev < 2 ? PT_EVO_LV[ev] : null,
    };
  }
  const eggs = Object.entries(c.inv.stack).map(([id, n]) => ({ id, n, d: itemOf(id) })).filter((x) => x.d?.k === "egg").map((x) => ({ id: x.id, n: x.n, name: x.d.name, pet: x.d.pet.name }));
  return { pet, eggs, maxed, regions: REGIONS.map((r) => ({ id: r.id, name: r.name, icon: r.icon, tier: r.tier, open: c.r >= r.realm })), feed, hours: PT_HOURS, tripsLeft: Math.max(0, PT_TRIP_DAILY - (c.daily.petTrip ?? 0)) };
}

export function petSend(c, regionId, hours, now) {
  const p = c.pet;
  if (!p) return { ok: false, msg: "你还没有灵兽" };
  if (p.trip) return { ok: false, msg: `${p.name}正在远行` };
  const h = Math.round(Number(hours));
  if (!PT_HOURS.includes(h)) return { ok: false, msg: "只能派遣 4 / 8 / 12 小时" };
  const rg = regionOf(String(regionId));
  if (!rg) return { ok: false, msg: "无此地域" };
  if (c.r < rg.realm) return { ok: false, msg: "此地尚未解锁，灵兽去了回不来" };
  if ((p.hpP ?? 1) < PT_HP_MIN) return { ok: false, msg: `${p.name}伤势未愈，先让它歇一歇` };
  if ((c.daily.petTrip ?? 0) >= PT_TRIP_DAILY) return { ok: false, msg: "今日派遣已够，明日再说" };
  c.daily.petTrip = (c.daily.petTrip ?? 0) + 1;
  p.trip = { region: rg.id, at: now, ready: now + h * HOUR, h, seed: `${c.uid}:${c.sk ?? ""}:${now}`, noted: 0 };
  return { ok: true, msg: `${p.name}往${rg.name}去了，${h} 小时后回来。` };
}

export function petCollect(c, now) {
  const p = c.pet;
  if (!p || !p.trip) return { ok: false, msg: "灵兽不在远行" };
  const t = p.trip;
  if (now < t.ready) return { ok: false, msg: `${p.name}还没回来` };
  const rg = regionOf(t.region);
  const tier = Math.max(0, Math.min(PT_MATS_BY_T.length - 1, rg?.tier ?? 0));
  const rng = makeRng(t.seed);
  const out = { lines: [], drops: [] };
  const total = Math.max(1, Math.round(rng.int(2, 5) * (PT_YIELD[t.h] ?? 1)));
  const pool = PT_MATS_BY_T[tier];
  const kinds = rng.int(1, 2);
  const first = kinds === 1 ? total : Math.ceil(total / 2);
  const i0 = rng.int(0, pool.length - 1);
  ptDrop(c, pool[i0], first, out.drops);
  if (kinds > 1 && total - first > 0) ptDrop(c, pool[(i0 + rng.int(1, pool.length - 1)) % pool.length], total - first, out.drops);
  if (rng.chance(0.05)) {
    const eggs = ITEMS.filter((x) => x.k === "egg" && (x.t ?? 0) <= tier);
    if (eggs.length) { const e = eggs[rng.int(0, eggs.length - 1)]; ptDrop(c, e.id, 1, out.drops); out.lines.push(`${p.name}叼回来一枚${e.name}。`); }
  }
  if (rng.chance(0.02)) {
    const k = rng.int(0, 3);
    if (k === 0) { ptDrop(c, "m_jinghe", 1, out.drops); out.lines.push("它在一处塌了的洞口刨出一枚晶核。"); }
    else if (k === 1) { ptDrop(c, "r_ji", 1, out.drops); out.lines.push("它咬着一片刻着风纹的碎甲回来。"); }
    else if (k === 2) { c.xp = Math.min(xpNeed(c) * 1.5, c.xp + 200); out.xp = 200; out.lines.push("路上有个老道摸了摸它的头，你也觉出一分道理。"); }
    else { ptDrop(c, "r_tu", 1, out.drops); out.lines.push("它从枯坐的骸骨旁衔来一枚吐纳纹。"); }
  }
  petGain(c, 10 * (t.h ?? 4), out);
  p.trip = null;
  const got = out.drops.filter((d) => !d.lost).map((d) => `${d.name}×${d.n}`).join("、");
  return { ok: true, msg: `${p.name}从${rg?.name ?? "远方"}回来了${got ? "：" + got : "，两手空空"}`, drops: out.drops, lines: out.lines };
}

export function petFeed(c, itemId) {
  const p = c.pet;
  if (!p) return { ok: false, msg: "你还没有灵兽" };
  const def = itemOf(String(itemId));
  if (!def || countOf(c, def.id) < 1) return { ok: false, msg: "没有这件物品" };
  const xp = ptFeedXp(def);
  if (xp <= 0) return { ok: false, msg: "灵兽不吃这个" };
  // 满级之后历练无处可去；再喂只是白扔东西（太虚砂一颗值上万灵石）
  if ((p.lv ?? 0) >= PET_MAX_LV) return { ok: false, msg: `${p.name}已至 ${PET_MAX_LV} 级，再喂也无益` };
  removeItems(c, [[def.id, 1]]);
  const out = { lines: [] };
  petGain(c, xp, out);
  return { ok: true, msg: `${p.name}吃下${def.name}，历练 +${xp}${out.lines.length ? "。" + out.lines.join("") : ""}`, lines: out.lines };
}

export function petEvolve(c) {
  const p = c.pet;
  if (!p) return { ok: false, msg: "你还没有灵兽" };
  const ev = Math.min(2, p.ev ?? 0);
  if (ev >= 2) return { ok: false, msg: "它已臻化形之极" };
  if ((p.lv ?? 0) < PT_EVO_LV[ev]) return { ok: false, msg: `需 ${PT_EVO_LV[ev]} 级方可化形` };
  const cost = ptEvoCost(c);
  if (!hasItems(c, cost)) return { ok: false, msg: "材料不足：" + cost.map(([id, n]) => `${itemOf(id)?.name ?? id}×${n}`).join("、") };
  removeItems(c, cost);
  p.ev = ev + 1;
  const base = String(p.name).replace(/^[灵仙]·/, "");
  p.name = PT_EVO_PREFIX[p.ev] + base;
  return { ok: true, msg: `${p.name}周身灵光一敛，化形成了。` };
}

export function petRelease(c, confirm) {
  const p = c.pet;
  if (!p) return { ok: false, msg: "你还没有灵兽" };
  if (p.trip) return { ok: false, msg: "它还在远行的路上" };
  if (!confirm) return { ok: false, confirm: true, msg: `放生${p.name}？此后再无瓜葛。` };
  const name = p.name;
  c.pet = null;
  return { ok: true, msg: `${name}回头看了你一眼，转身没入林中。` };
}
