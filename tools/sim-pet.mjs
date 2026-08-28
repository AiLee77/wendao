// 灵兽值多少「战力」：把攻方全属性乘一个系数，二分找回 50% 胜率的那个系数。
// 结果直接对应 deriveStats().power 里灵兽应该占的比重。改 PET_SHARE / PET_BITE 后跑这个校准。
import { Site } from "../test/harness.mjs";
import { deriveStats, buildUnit } from "../lib/game/stats.js";
import { battle, PET_SHARE, PET_BITE } from "../lib/game/battle.js";
import { makeRng } from "../lib/game/rng.js";

const PETS = [
  ["灵狐 lv0 ev0", { atk: 0.5, hp: 0.6, lv: 0, ev: 0 }],
  ["灵狐 lv10 ev1", { atk: 0.5, hp: 0.6, lv: 10, ev: 1 }],
  ["麒麟 lv20 ev2", { atk: 1.0, hp: 1.2, lv: 20, ev: 2 }],
];
const mkPet = (p) => ({ id: "e_linghu", name: "灵兽", elem: "火", atk: p.atk, hp: p.hp, lv: p.lv, xp: 0, ev: p.ev, hpP: 1, trip: null });
const site = new Site();
await site.call(1, "boot", {}); await site.call(1, "create", { name: "甲道友" });
await site.call(2, "boot", {}); await site.call(2, "create", { name: "乙道友" });
const N = 300;
function rate(a, b, k) {
  const sa = deriveStats(a), sb = deriveStats(b);
  let win = 0;
  for (let i = 0; i < N; i++) {
    const ua = buildUnit(a, sa, { hpFrac: 1, mpFrac: 1 });
    for (const f of ["hp", "maxHp", "atk", "def"]) ua[f] = Math.round(ua[f] * k);
    const ub = buildUnit(b, sb, { hpFrac: 1, mpFrac: 1 });
    if (battle(ua, ub, makeRng("pk:" + i), "arena").win) win++;
  }
  return win / N;
}
console.log(`PET_SHARE ${PET_SHARE}  PET_BITE ${PET_BITE}`);
for (const r of [1, 3, 5]) {
  const out = [];
  for (const [label, p] of PETS) {
    site.setChar(1, (c) => { c.r = r; c.s = 2; c.pet = null; });
    site.setChar(2, (c) => { c.r = r; c.s = 2; c.pet = mkPet(p); });
    const a = site.char(1), b = site.char(2);
    let lo = 0.5, hi = 4;
    for (let it = 0; it < 9; it++) { const mid = (lo + hi) / 2; if (rate(a, b, mid) < 0.5) lo = mid; else hi = mid; }
    out.push(`${label} ≈ 战力 ×${((lo + hi) / 2).toFixed(2)}`);
  }
  console.log(`r${r}  ${out.join("   ")}`);
}
