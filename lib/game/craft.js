import { PILL_RECIPES, FORGE_RECIPES } from "../data/recipes.js";
import { itemOf } from "../data/items.js";
import { pathOf } from "../data/paths.js";
import { hasItems, removeItems, addStack, rollArtifact } from "./inventory.js";

// 成功率一处算：道途加成 + 悟性 + 宗门丹房（+2%/级）。面板与开炉必须用同一个数。
export function craftChance(c, r) {
  const pm = pathOf(c.path)?.mods ?? {};
  const bonus = PILL_RECIPES.includes(r) ? (pm.alch ?? 0) : (pm.forge ?? 0);
  return Math.min(0.98, r.p + bonus + Math.min(0.1, (c.wu ?? 0) * 0.003) + (c.sectB?.df ?? 0) * 0.02);
}

export function recipesView(c) {
  const map = (list, kind) => list.filter((r) => r.realm <= c.r).map((r) => {
    const out = itemOf(r.out);
    return {
      id: r.id, out: r.out, name: out?.name, desc: out?.desc, p: craftChance(c, r), ls: r.ls, n: r.n ?? 1,
      in: r.in.map(([id, n]) => ({ id, n, name: itemOf(id)?.name, have: c.inv.stack[id] ?? 0 })),
      can: hasItems(c, r.in) && c.ls >= r.ls,
    };
  });
  return { pills: map(PILL_RECIPES, "pill"), forge: map(FORGE_RECIPES, "forge") };
}

export function craft(c, recipeId, rng) {
  const isPill = PILL_RECIPES.some((r) => r.id === recipeId);
  const r = (isPill ? PILL_RECIPES : FORGE_RECIPES).find((x) => x.id === recipeId);
  if (!r) return { ok: false, msg: "无此丹方/器谱" };
  if (r.realm > c.r) return { ok: false, msg: "境界不足，驾驭不了这炉火" };
  if (!hasItems(c, r.in)) return { ok: false, msg: "材料不足" };
  if (c.ls < r.ls) return { ok: false, msg: "灵石不足" };
  const p = craftChance(c, r);
  removeItems(c, r.in);
  c.ls -= r.ls;
  c.stats.crafts++;
  const out = itemOf(r.out);
  if (!rng.chance(p)) {
    // failure: half the materials are lost, the other half survive
    for (const [id, n] of r.in) if (n > 1) addStack(c, id, Math.floor(n / 2));
    return { ok: true, success: false, msg: isPill ? "炉火失控，丹成飞灰。抢回了一半材料。" : "器胚炸裂，只抢回一半材料。" };
  }
  if (out.k === "art") {
    const it = rollArtifact(c, r.out, rng, { forge: true });
    if (!it) return { ok: true, success: true, msg: "炼成了，可法宝匣已满，宝物化作流光散去。" };
    return { ok: true, success: true, msg: `炉开宝现：${out.name}（${it.q}星）`, item: it };
  }
  const n = r.n ?? 1;
  const okAdd = addStack(c, r.out, n);
  return { ok: true, success: true, msg: okAdd ? `${isPill ? "丹成" : "炼成"}：${out.name}×${n}` : "炼成了，可行囊已满。" };
}
