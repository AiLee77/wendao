// 12 players × N days exercising every v6 loop. Exits non-zero on throws / negative balances; prints economy stats.
import { Site } from "../test/harness.mjs";
import { wxSim, wxSeed } from "../lib/game/wuxing.js";
import { dayKey } from "../lib/game/time.js";
const DAYS = Number(process.argv[2] ?? 14), N = 12, H = 3600e3;
const site = new Site();
const paths = ["jian", "fa", "ti", "dan", "zhen", "fu", "qi", "shou", "xie", "jian", "fa", "dan"];
const uids = Array.from({ length: N }, (_, i) => 100 + i);
const fails = [], stat = { dgRuns: 0, dgDone: 0, dgDead: 0, dgDepth: [], wx: [], harvests: 0, trips: 0, bounties: 0, ach: 0 };
const ok = (r) => r && r.ok !== false;
async function call(uid, m, p) { try { return await site.call(uid, m, p ?? {}); } catch (e) { fails.push(`${uid} ${m}: ${e.message}`); return null; } }
for (const [i, uid] of uids.entries()) {
  await call(uid, "create", { name: "模拟" + i });
  site.setChar(uid, (c) => { c.r = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7][i]; c.s = 2; c.path = c.r >= 1 ? paths[i] : null; c.sub = c.r >= 2 ? ["shang", "tan", null][i % 3] : null; c.ls += 500 * (c.r + 1); c.inv.stack.e_linghu = 1; c.inv.stack.s_lingcao = 3; });
}
const ls0 = uids.map((u) => site.char(u).ls);
for (let d = 0; d < DAYS; d++) {
  for (const uid of uids) {
    await call(uid, "home");
    await call(uid, "breathe");
    // dungeon ×2
    for (let k = 0; k < 2; k++) {
      const e = await call(uid, "dg.enter", { diff: Math.min(2, site.char(uid).r) }); if (!ok(e)) break; stat.dgRuns++;
      for (let s = 0; s < 60; s++) { const c = site.char(uid); if (!c.dg) break; const v = await call(uid, "dg", {}); const run = v?.data?.dg?.run; if (!run) break; let i = 0; if (run.pend) i = run.pend.t === "relic" ? 0 : run.pend.t === "shop" ? -1 : 0; else { if (run.hp < 0.35 && run.f > 3) { await call(uid, "dg.leave"); break; } const sp = run.opts.findIndex((o) => o.t === "spring"); i = run.hp < 0.5 && sp >= 0 ? sp : 0; } const r = await call(uid, "dg.pick", { i }); const bk = r?.data?.bank; if (bk) { if (bk.dead) stat.dgDead++; else stat.dgDone++; stat.dgDepth.push(bk.depth ?? run.f); break; } }
      if (site.char(uid).dg) { const l = await call(uid, "dg.leave"); stat.dgDepth.push(l?.data?.bank?.depth ?? 0); }
    }
    for (let k = 0; k < 10; k++) { const r = await call(uid, "explore", { region: "qingshan" }); if (!ok(r)) break; const ev = r.data?.event; if (ev?.opts?.length) { const o = ev.opts.find((x) => x.ok) ?? ev.opts[0]; const rr = await call(uid, "choose", { opt: o.id }); const nx = rr?.data?.result?.nextEvent; if (nx) await call(uid, "choose", { opt: (nx.opts.find((x) => x.ok) ?? nx.opts[0]).id }); } }
    for (let k = 0; k < 3; k++) await call(uid, "boss.attack");
    // farm
    const fv = (await call(uid, "farm"))?.data?.farm; if (fv) { for (const p of fv.plots) { if (!p || !p.seed) continue; if (p.ready) { const h = await call(uid, "farm.harvest", { i: p.i }); if (ok(h)) stat.harvests++; } else if (p.ev) await call(uid, "farm.tend", { i: p.i }); } const fv2 = (await call(uid, "farm"))?.data?.farm; for (const [i, p] of fv2.plots.entries()) if (p && !p.seed && fv2.seeds.length) await call(uid, "farm.plant", { i, seed: fv2.seeds[0].id }); }
    // pet
    const c0 = site.char(uid); if (!c0.pet && c0.inv.stack.e_linghu) await call(uid, "use", { id: "e_linghu" });
    const pv = (await call(uid, "pet"))?.data?.pet; if (pv?.pet) { if (pv.pet.trip?.ready) { const r = await call(uid, "pet.collect"); if (ok(r)) stat.trips++; } else if (!pv.pet.trip) await call(uid, "pet.send", { region: "qingshan", hours: 12 }); if (pv.feed?.length) await call(uid, "pet.feed", { item: pv.feed[0].id }); }
    // wuxing: greedy legal moves
    { const seed = wxSeed(dayKey(site.now)); const moves = []; for (let m = 0; m < 20; m++) { let best = null; for (let r = 0; r < 6; r++) for (let cc = 0; cc < 6; cc++) for (const [dr, dc] of [[0, 1], [1, 0]]) { const r2 = r + dr, c2 = cc + dc; if (r2 > 5 || c2 > 5) continue; const t = wxSim(seed, moves.concat([[r, cc, r2, c2]])); if (t.ok && (!best || t.score > best.s)) best = { mv: [r, cc, r2, c2], s: t.score }; } if (!best) break; moves.push(best.mv); } const r = await call(uid, "wx.submit", { moves }); if (ok(r)) stat.wx.push(r.score ?? r.data?.wx?.mine ?? 0); }
    // bounty
    const bv = (await call(uid, "bounty"))?.data?.bounty; for (const b of bv?.list ?? []) if (b.done && !b.claimed) { const r = await call(uid, "bounty.claim", { i: b.i }); if (ok(r)) stat.bounties++; }
    for (let k = 0; k < 5; k++) await call(uid, "arena.fight", { uid: uids[(uids.indexOf(uid) + 1 + k) % N] });
    const c = site.char(uid); if (c.ls < 0) fails.push(`${uid} negative ls ${c.ls}`); if (c.hpP < 0 || c.hpP > 1) fails.push(`${uid} hpP ${c.hpP}`);
  }
  site.advance(24 * H); await site.tick();
}
const ls1 = uids.map((u) => site.char(u).ls);
const ach = uids.reduce((n, u) => n + Object.keys(site.kv.get(u)?.get("legacy")?.ach ?? {}).length, 0);
const med = (a) => a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : 0;
console.log({ days: DAYS, fails: fails.length, dgRuns: stat.dgRuns, dgDone: stat.dgDone, dgDead: stat.dgDead, dgDepthMed: med(stat.dgDepth), wxMed: med(stat.wx), harvests: stat.harvests, trips: stat.trips, bounties: stat.bounties, achievements: ach });
console.log("ls per player: start→end", uids.map((u, i) => `r${site.char(u).r}:${ls0[i]}→${ls1[i]}`).join("  "));
if (fails.length) { console.log(fails.slice(0, 20).join("\n")); process.exit(1); }
