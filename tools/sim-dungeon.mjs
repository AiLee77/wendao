// Dungeon survivability sweep: a naive bot (first door, spring when hurt) per realm × difficulty.
import { Site } from "../test/harness.mjs";
for (const r of [0, 1, 2, 3, 4, 5, 6, 7, 8]) for (const diff of [0, 1, 2]) {
  if (diff > Math.min(2, r)) continue;
  const site = new Site(); let wins = 0, fights = 0, deaths = 0, done = 0, depth = 0, runs = 0, ls = 0, left = 0;
  for (let u = 1; u <= 70; u++) {
    await site.call(u, "create", { name: "t" + u }); site.setChar(u, (c) => { c.r = r; c.s = 4; });
    await site.call(u, "dg.enter", { diff }); runs++;
    for (let s = 0; s < 80 && site.char(u).dg; s++) {
      const v = await site.call(u, "dg"); const run = v.data.dg.run; if (!run) break;
      let i = 0; if (!run.pend) { const sp = run.opts.findIndex((o) => o.t === "spring"); const safe = run.opts.findIndex((o) => ["chest", "ev", "relic", "shop", "trap"].includes(o.t)); const fight = run.opts.findIndex((o) => o.t === "mon" || o.t === "elite" || o.t === "boss"); if (run.hp < 0.6 && sp >= 0) i = sp; else if (run.hp >= 0.5) i = fight >= 0 ? fight : 0; else if (safe >= 0) i = safe; else if (run.hp < 0.3) { const l = await site.call(u, "dg.leave"); if (l.data?.bank) { depth += l.data.bank.depth ?? 0; ls += l.data.bank.ls ?? 0; left++; } break; } }
      const p = await site.call(u, "dg.pick", { i }); const d = p.data || {};
      if (d.battle) { fights++; if (d.battle.win) wins++; }
      if (d.bank) { if (d.bank.dead) deaths++; else done++; depth += d.bank.depth ?? 0; ls += d.bank.ls ?? 0; break; }
    }
  }
  console.log(`realm ${r} diff ${diff}: done ${done}/${runs} deaths ${deaths} left ${left} fightWin ${wins}/${fights} avgDepth ${(depth / runs).toFixed(1)} avgLs ${(ls / runs).toFixed(0)}`);
}
