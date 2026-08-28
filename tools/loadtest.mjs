// How long does one call take with a crowded shared area? The sandbox budget is 3 s.
import { Site } from "../test/harness.mjs";
import { makeProfile } from "../lib/game/snapshot.js";
import { newCharacter } from "../lib/game/char.js";

const N = Number(process.argv[2] ?? 2000);
const site = new Site();
for (let i = 1; i <= N; i++) {
  const c = newCharacter({ uid: 1000 + i, name: `修士${i}`, now: site.now, seed: `seed${i}`, legacy: null });
  c.r = i % 8; c.s = i % 3; c.season.ar = 800 + (i * 37) % 600; c.season.ss = (i * 13) % 500; c.ls = i * 10; c.sect = i % 5 === 0 ? "s1001" : null;
  site.shared.set(`p:${c.uid}`, makeProfile(c, site.now));
  if (i % 4 === 0) site.shared.set(`bd:${Math.floor(site.now / 86400000)}:${c.uid}`, { uid: c.uid, n: c.name, d: i, k: 1 });
  if (i % 10 === 0) site.shared.set(`atk:${c.uid}`, { uid: c.uid, list: Array.from({ length: 20 }, (_, k) => ({ t: site.now - k, d: 1001 + ((i + k) % N), n: c.name, w: k % 2 === 0, dr: 12 })) });
  if (i % 50 === 0) site.shared.set(`sc:${c.uid}`, { uid: c.uid, sect: "s1001", pts: i });
}
site.shared.set("sect:s1001", { sid: "s1001", name: "大宗", leader: 1001, leaderName: "修士1", elders: [], banned: [], req: 0, t: site.now });
const bytes = JSON.stringify([...site.shared]).length;
console.log(`shared: ${site.shared.size} keys, ${(bytes / 1024).toFixed(0)} KB`);
await site.call(1, "create", { name: "测速者" });
const t = async (label, fn) => { const t0 = performance.now(); const v = await fn(); console.log(label.padEnd(14), (performance.now() - t0).toFixed(1), "ms", v?.ok === false ? v.msg : ""); };
await t("boot", () => site.call(1, "boot"));
await t("lb realm", () => site.call(1, "lb", { type: "realm" }));
await t("lb sect", () => site.call(1, "lb", { type: "sect" }));
await t("arena", () => site.call(1, "arena"));
await t("arena.fight", async () => { const a = await site.call(1, "arena"); return site.call(1, "arena.fight", { uid: a.data.arena.list[0].uid }); });
await t("boss", () => site.call(1, "boss"));
await t("sect", () => site.call(1, "sect"));
await t("shop", () => site.call(1, "shop"));
await t("bot tick", () => site.tick());
