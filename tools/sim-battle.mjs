// Win rates of a typical player of each realm against the monsters of each tier (200 fights each).
import { newCharacter } from "../lib/game/char.js";
import { deriveStats, buildUnit } from "../lib/game/stats.js";
import { battle } from "../lib/game/battle.js";
import { monsterUnit } from "../lib/game/explore.js";
import { MONSTERS } from "../lib/data/monsters.js";
import { makeRng } from "../lib/game/rng.js";
import { REALMS } from "../lib/data/realms.js";

const now = Date.now();
function player(r, s, path) {
  const c = newCharacter({ uid: 1, name: "测", now, seed: "x", legacy: null });
  c.r = r; c.s = s; c.path = path; c._now = now;
  c.root = { t: "san", e: ["金", "木", "水"] };
  if (r >= 1) { c.arts.push("a_metal", "a_water"); c.eqArts = ["a_fire", "a_metal", "a_water"]; }
  if (r >= 2) c.gf = "g_chiyan";
  if (process.env.GEAR) {
    // tier gear of the player's own realm, 3-star, one affix
    const t = Math.min(4, r);
    const ids = { 0: ["f_tiejian", "f_bupao", "f_yupei"], 1: ["f_shuijian", "f_jiaolinjia", "f_lingzhu"], 2: ["f_huoyun", "f_xuanjinjia", "f_yaodanling"], 3: ["f_leijian", "f_bingjia", "f_xuanyuanjing"], 4: ["f_xingjian", "f_xukongyi", "f_xianyin"] }[t];
    let iid = 0;
    for (const id of ids) { iid++; c.inv.arts.push({ iid, id, q: 3, af: [] }); }
    c.eq = { w: 1, a: 2, r: 3 };
  }
  return c;
}
const rows = [];
for (let r = 0; r <= 5; r++) {
  const c = player(r, 1, null);
  const st = deriveStats(c);
  const line = [`${REALMS[r].name}中期 战力${st.power}`.padEnd(18)];
  for (let t = 0; t <= 4; t++) {
    const ms = MONSTERS.filter((m) => m.t === t);
    let wins = 0, n = 0, bossWins = 0, bossN = 0;
    for (const m of ms) {
      for (let i = 0; i < 40; i++) {
        const rng = makeRng(`${r}:${t}:${m.id}:${i}`);
        const res = battle(buildUnit(c, st, { hpFrac: 1, mpFrac: 1 }), monsterUnit(m.id, rng), rng, "forest");
        if (m.boss) { bossN++; if (res.win) bossWins++; } else { n++; if (res.win) wins++; }
      }
    }
    line.push(`T${t} ${Math.round((wins / n) * 100)}%/boss ${Math.round((bossWins / bossN) * 100)}%`.padEnd(20));
  }
  rows.push(line.join(" "));
}
console.log(rows.join("\n"));
// path comparison at 金丹 vs tier 2
console.log("\n金丹中期 各道途 vs T2 普通怪:");
for (const p of ["jian", "fa", "ti", "zhen", "fu", "xie", "shou", null]) {
  const c = player(2, 1, p);
  if (p === "shou") c.pet = { id: "e_linghu", name: "灵狐", elem: "火", atk: 0.3, hp: 0.3, lv: 5, xp: 0 };
  if (p === "jian") { c.arts.push("a_jianqi"); c.eqArts = ["a_jianqi", "a_metal", "a_fire"]; }
  if (p === "fa") { c.arts.push("a_inferno"); c.eqArts = ["a_inferno", "a_fire", "a_water"]; }
  if (p === "ti") { c.arts.push("a_fist", "a_iron"); c.eqArts = ["a_fist", "a_iron", "a_fire"]; }
  if (p === "zhen") { c.arts.push("a_zhen_kun"); c.eqArts = ["a_zhen_kun", "a_fire", "a_metal"]; }
  if (p === "fu") { c.arts.push("a_fu_lei"); c.eqArts = ["a_fu_lei", "a_fire", "a_metal"]; }
  if (p === "xie") { c.arts.push("a_drain"); c.eqArts = ["a_drain", "a_fire", "a_metal"]; }
  const st = deriveStats(c);
  let wins = 0, n = 0;
  for (const m of MONSTERS.filter((m) => m.t === 2 && !m.boss)) for (let i = 0; i < 40; i++) { const rng = makeRng(`p:${p}:${m.id}:${i}`); n++; if (battle(buildUnit(c, st, { hpFrac: 1, mpFrac: 1 }), monsterUnit(m.id, rng), rng, "forest").win) wins++; }
  console.log(`${String(p).padEnd(6)} 战力${String(st.power).padEnd(7)} 胜率 ${Math.round((wins / n) * 100)}%`);
}
