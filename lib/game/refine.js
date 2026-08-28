// 法宝淬炼: reforge one affix slot, merge two copies into a higher star, socket runes.
// Every outcome is decided here from a server-chosen seed; the page only sends intent.
import { itemOf } from "../data/items.js";
import { artifactOf, rollAffix, AFFIX_MAX, countOf, hasItems, removeItems } from "./inventory.js";

// 灵石 + 材料 per artifact tier. Star-up costs the 灵石 twice over; a locked affix doubles everything.
export const RF_COST = [
  [30, [["m_tiekuang", 3]]],
  [150, [["m_shuijing", 2]]],
  [600, [["m_xuanjin", 2]]],
  [2500, [["m_xuanyuan", 2], ["m_jinghe", 1]]],
  [10000, [["m_xingchen", 2], ["m_jinghe", 2]]],
  [40000, [["m_taixu", 2], ["m_jinghe", 3]]],
];
// chance of reaching star 2 / 3 / 4 / 5, indexed by the artifact's current quality - 1
export const RF_STAR_P = [1.0, 0.8, 0.6, 0.4];
export const RF_QI_BONUS = 0.15;

export function rfSockets(t) {
  return Math.min(3, (t | 0) + 1);
}
function rfCost(t, mult) {
  const row = RF_COST[Math.max(0, Math.min(RF_COST.length - 1, t | 0))];
  return { ls: row[0] * mult, mats: row[1].map(([id, n]) => [id, n * mult]) };
}
function rfMatView(c, cost) {
  return cost.mats.map(([id, n]) => ({ id, name: itemOf(id)?.name ?? id, n, have: countOf(c, id) }));
}
function rfPay(c, cost) {
  if (c.ls < cost.ls) return { ok: false, msg: `灵石不足，需 ${cost.ls}` };
  if (!hasItems(c, cost.mats)) return { ok: false, msg: "材料不足：" + cost.mats.map(([id, n]) => `${itemOf(id)?.name ?? id}×${n}`).join("、") };
  c.ls -= cost.ls;
  removeItems(c, cost.mats);
  return { ok: true };
}
function rfStarP(c, q) {
  return Math.min(1, (RF_STAR_P[q - 1] ?? 0) + (c.path === "qi" ? RF_QI_BONUS : 0));
}
// atk/def scale off the artifact's own main stat; spd is flat; the ratio stats scale off the rune's tier.
export function rfRuneValue(def, t, rdef) {
  const st = rdef?.fx?.rune;
  const rt = rdef?.t ?? 0;
  const main = Math.max(...Object.values(def.st ?? { atk: 1 }), 1);
  if (st === "atk" || st === "def") return Math.max(1, Math.round(main * 0.05 * (1 + t)));
  if (st === "spd") return 2 + 2 * t;
  if (st === "rate") return +(0.015 * (1 + rt * 0.5)).toFixed(3);
  return +(0.02 * (1 + rt * 0.5)).toFixed(3); // spell / crit
}
function rfBump(c) {
  c.stats.refines = (c.stats.refines ?? 0) + 1;
}
function rfSpares(c, it) {
  const eq = Object.values(c.eq ?? {});
  return c.inv.arts.filter((a) => a.id === it.id && a.iid !== it.iid && !eq.includes(a.iid)).slice().sort((a, b) => a.q - b.q);
}
const rfShow = (v) => (v < 1 && v > -1 ? Math.round(v * 100) + "%" : String(v));

export function refineView(c, iid) {
  const it = artifactOf(c, Number(iid));
  if (!it) return null;
  const def = itemOf(it.id);
  if (!def) return null;
  const t = def.t ?? 0;
  const one = rfCost(t, 1), two = rfCost(t, 2);
  const af = it.af ?? [], rn = it.rn ?? [];
  const spares = rfSpares(c, it);
  const runes = Object.entries(c.inv.stack).map(([id, n]) => ({ id, n, d: itemOf(id) }))
    .filter((x) => x.d && x.d.fx && x.d.fx.rune)
    .map((x) => ({ id: x.id, name: x.d.name, n: x.n, st: x.d.fx.rune, v: rfRuneValue(def, t, x.d), had: rn.some((r) => r.st === x.d.fx.rune) }));
  return {
    iid: it.iid, id: it.id, name: def.name, slot: def.slot, t, q: it.q, af, rn, lk: it.lk ?? null,
    maxAf: AFFIX_MAX[t] ?? 3, maxRn: rfSockets(t),
    reforge: {
      ls: one.ls, mats: rfMatView(c, one), can: c.ls >= one.ls && hasItems(c, one.mats),
      lockLs: two.ls, lockMats: rfMatView(c, two), canLock: c.ls >= two.ls && hasItems(c, two.mats),
    },
    star: { ls: two.ls, p: rfStarP(c, it.q), cands: spares.map((a) => ({ iid: a.iid, q: a.q })), can: it.q < 5 && spares.length > 0 && c.ls >= two.ls },
    runes,
  };
}

// slot === af.length adds a new affix slot (while under the tier cap)。
// lock = 保值重铸：费用翻倍，重摇的是这一条自己的数值，属性不变，而且只会更好不会更差。
// （旧版的「锁」是锁另一条槽位，但重铸本来就只写目标槽、exclude 也已经排掉了其它槽的属性，
//  所以它收了双倍钱却不可能改变任何结果 —— 300 组种子实测 0 差异。）
export function refineReforge(c, iid, slot, lock, rng) {
  const it = artifactOf(c, Number(iid));
  if (!it) return { ok: false, msg: "没有这件法宝" };
  const def = itemOf(it.id);
  if (!def) return { ok: false, msg: "没有这件法宝" };
  const t = def.t ?? 0;
  it.af = it.af ?? [];
  const maxAf = AFFIX_MAX[t] ?? 3;
  const i = Math.round(Number(slot));
  if (!Number.isFinite(i) || i < 0 || i > it.af.length) return { ok: false, msg: "无此词缀槽" };
  const isNew = i === it.af.length;
  if (isNew && it.af.length >= maxAf) return { ok: false, msg: `${def.name}最多开 ${maxAf} 条词缀` };
  const keepStat = !isNew && lock !== undefined && lock !== null && lock !== "" && lock !== false && Number(lock) !== 0;
  const pay = rfPay(c, rfCost(t, keepStat ? 2 : 1));
  if (!pay.ok) return pay;
  const exclude = it.af.filter((_, k) => k !== i).map((a) => a.st);
  let na;
  if (keepStat) {
    const old = it.af[i];
    // 摇到同一条属性为止（词条池只有几条，几次就中），然后取数值更好的那个
    for (let k = 0; k < 40; k++) { na = rollAffix(def, t, rng, exclude); if (na.st === old.st) break; }
    if (!na || na.st !== old.st) na = { ...old };
    if (na.v < old.v) na = { ...old };
  } else {
    na = rollAffix(def, t, rng, exclude);
  }
  if (isNew) it.af.push(na);
  else it.af[i] = na;
  delete it.lk;
  rfBump(c);
  return { ok: true, msg: `${def.name}${isNew ? "新生词缀" : keepStat ? "保值重铸" : "重铸"}：${na.n} +${rfShow(na.v)}` };
}

// Merge a spare copy in. Failure eats only the sacrifice.
export function refineStar(c, iid, withIid, rng) {
  const it = artifactOf(c, Number(iid));
  if (!it) return { ok: false, msg: "没有这件法宝" };
  const def = itemOf(it.id);
  if (!def) return { ok: false, msg: "没有这件法宝" };
  if (it.q >= 5) return { ok: false, msg: "已是五星，无可再升" };
  const eq = Object.values(c.eq ?? {});
  let s;
  if (withIid !== undefined && withIid !== null && withIid !== "") {
    s = artifactOf(c, Number(withIid));
    if (!s || s.iid === it.iid) return { ok: false, msg: "请另选一件同名法宝作祭品" };
    if (s.id !== it.id) return { ok: false, msg: "祭品须是同一种法宝" };
    if (eq.includes(s.iid)) return { ok: false, msg: "已祭炼在身的法宝不可作祭品" };
  } else {
    s = rfSpares(c, it)[0];
    if (!s) return { ok: false, msg: "没有可作祭品的同名法宝" };
  }
  const t = def.t ?? 0;
  const cost = rfCost(t, 2);
  if (c.ls < cost.ls) return { ok: false, msg: `灵石不足，需 ${cost.ls}` };
  c.ls -= cost.ls;
  c.inv.arts = c.inv.arts.filter((a) => a.iid !== s.iid);
  const p = rfStarP(c, it.q);
  const success = rng.chance(p);
  if (success) it.q = Math.min(5, it.q + 1);
  rfBump(c);
  return { ok: true, success, p, msg: success ? `两宝合一，${def.name}升至 ${it.q} 星。` : `炉火骤熄，祭品化作飞灰，${def.name}纹丝未动。` };
}

export function refineRune(c, iid, runeId) {
  const it = artifactOf(c, Number(iid));
  if (!it) return { ok: false, msg: "没有这件法宝" };
  const def = itemOf(it.id);
  const rdef = itemOf(String(runeId));
  if (!rdef || !rdef.fx || !rdef.fx.rune) return { ok: false, msg: "这不是符纹" };
  if (countOf(c, rdef.id) < 1) return { ok: false, msg: "没有这枚符纹" };
  const t = def.t ?? 0;
  it.rn = it.rn ?? [];
  if (it.rn.length >= rfSockets(t)) return { ok: false, msg: `${def.name}只有 ${rfSockets(t)} 个纹槽` };
  if (it.rn.some((r) => r.st === rdef.fx.rune)) return { ok: false, msg: "同类符纹不可重叠" };
  removeItems(c, [[rdef.id, 1]]);
  const v = rfRuneValue(def, t, rdef);
  it.rn.push({ st: rdef.fx.rune, v, id: rdef.id });
  rfBump(c);
  return { ok: true, msg: `${rdef.name}没入${def.name}，${rdef.fx.rune} +${rfShow(v)}` };
}

export function refineUnrune(c, iid, k) {
  const it = artifactOf(c, Number(iid));
  if (!it) return { ok: false, msg: "没有这件法宝" };
  it.rn = it.rn ?? [];
  const i = Math.round(Number(k));
  if (!Number.isFinite(i) || i < 0 || i >= it.rn.length) return { ok: false, msg: "此处没有符纹" };
  const gone = it.rn.splice(i, 1)[0];
  return { ok: true, msg: `${itemOf(gone.id)?.name ?? "符纹"}被剥了下来，纹路碎尽。` };
}
