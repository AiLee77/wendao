import { ITEMS, itemOf } from "../data/items.js";
import { makeRng } from "./rng.js";
import { subOf } from "../data/paths.js";
import { TIER_OF_REALM } from "../data/monsters.js";
import { addStack, rollArtifact } from "./inventory.js";

export const SHOP_SLOTS = 8;

// Daily system market, seeded per day and realm bracket so everyone of a realm sees the same stock.
export function shopStock(c, day) {
  const r = TIER_OF_REALM[Math.max(0, Math.min(8, c.r | 0))];
  const rng = makeRng(`shop:${day}:${r}`);
  const maxT = Math.min(5, r + 1); // item tiers stop at 5
  const pool = ITEMS.filter((i) => i.t <= maxT && i.k !== "misc" || (i.k === "misc" && (i.fx?.array || i.fx?.seed) && i.t <= maxT));
  const weighted = pool.map((i) => [i, i.t === maxT ? 1 : i.t === maxT - 1 ? 3 : 2]);
  const picks = [];
  const seen = new Set();
  const add = (it) => {
    if (!it || seen.has(it.id)) return false;
    seen.add(it.id);
    const n = it.k === "mat" ? rng.int(3, 8) : it.k === "pill" || it.k === "tal" ? rng.int(1, 3) : it.fx?.seed ? rng.int(2, 5) : 1;
    picks.push({ idx: picks.length, id: it.id, n, left: n, price: Math.round(it.v * 1.25) });
    return true;
  };
  // 每天至少留一格给种子：随机进货实测三十天里只有一半的日子出得来，
  // 新玩家打开洞府看到的常是一张种不下东西的灵田卡。
  const seeds = pool.filter((i) => i.fx?.seed);
  if (seeds.length) add(rng.pick(seeds));
  let guard = 0;
  while (picks.length < SHOP_SLOTS && guard++ < 60) add(rng.weighted(weighted));
  return picks;
}

export function shopView(c, day) {
  const stock = shopStock(c, day);
  const bought = c.daily.shop ?? {}; // keyed by item id; stale numeric slot keys are simply ignored
  const disc = subOf(c.sub)?.mods?.discount ?? 1;
  return stock.map((s) => {
    const d = itemOf(s.id);
    return { ...s, left: Math.max(0, s.n - (bought[s.id] ?? 0)), price: Math.round(s.price * disc), name: d.name, k: d.k, t: d.t, desc: d.desc, fx: d.fx ?? null, st: d.st ?? null, slot: d.slot ?? null };
  });
}

export function buy(c, idx, day, rng) {
  idx = Number(idx);
  const stock = shopStock(c, day);
  const s = stock[idx];
  if (!s) return { ok: false, msg: "没有这件货" };
  // counted per item id, not per slot: a breakthrough re-seeds the stock and remaps the slots mid-day
  c.daily.shop = c.daily.shop ?? {};
  if ((c.daily.shop[s.id] ?? 0) >= s.n) return { ok: false, msg: "已售罄" };
  const disc = subOf(c.sub)?.mods?.discount ?? 1;
  const price = Math.round(s.price * disc);
  if (c.ls < price) return { ok: false, msg: "灵石不足" };
  const d = itemOf(s.id);
  if (d.k === "art") {
    const it = rollArtifact(c, s.id, rng);
    if (!it) return { ok: false, msg: "法宝匣已满" };
  } else if (!addStack(c, s.id, 1)) return { ok: false, msg: "行囊已满" };
  c.ls -= price;
  c.daily.shop[s.id] = (c.daily.shop[s.id] ?? 0) + 1;
  return { ok: true, msg: `买下 ${d.name}，花费 ${price} 灵石` };
}
