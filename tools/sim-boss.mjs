// 世界 BOSS / 宗门试炼的威胁度是否跨 BOSS 一致：同一角色打遍全池，看威能与回合数的离散度。
import { Site } from "../test/harness.mjs";
import { MONSTERS } from "../lib/data/monsters.js";
import { makeRng } from "../lib/game/rng.js";
import { worldFor } from "../lib/game/boss.js";
const DAY = 86400000, base = Math.floor(Date.UTC(2026, 8, 3, 8) / DAY);
const dayOf = (name) => { for (let d = base; d < base + 400; d++) if (worldFor(d).boss.name === name) return d; return null; };
const bosses = MONSTERS.filter((x) => x.boss);
for (const r of [0, 3, 5, 8]) {
  const rows = [];
  for (const b of bosses) {
    const day = dayOf(b.name); if (day === null) continue;
    const s = new Site(day * DAY + 8 * 3600000);
    await s.call(1, "boot", {}); await s.call(1, "create", { name: "试道人" });
    s.setChar(1, (c) => { c.r = r; c.s = 2; });
    const ds = [], ts = [];
    for (let i = 0; i < 12; i++) {
      s.setChar(1, (c) => { c.daily.boss = 0; c.hpP = 1; c.mpP = 1; });
      const x = await s.call(1, "boss.attack", {});
      ds.push(Number(/造成了 (\d+) 点/.exec(x.msg)[1]));
      ts.push(x.data?.battle?.turns ?? 0);
    }
    ds.sort((a, c) => a - c);
    rows.push({ n: b.name, t: b.t, d: ds[6], turns: Math.round(ts.reduce((a, c) => a + c, 0) / ts.length) });
  }
  const ds = rows.map((x) => x.d).sort((a, b) => a - b);
  console.log(`r${r}  威能 ${ds[0]}–${ds[ds.length - 1]}（离散 ${(ds[ds.length - 1] / Math.max(1, ds[0])).toFixed(1)}×）  ` +
    rows.map((x) => `${x.n.slice(0, 4)}·t${x.t} ${x.d}/${x.turns}回`).join("  "));
}
