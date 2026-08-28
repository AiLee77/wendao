// Cross-checks every id referenced across the data tables. Exits non-zero on any dangling reference.
import { ITEMS, ITEM_MAP } from "../lib/data/items.js";
import { MONSTERS, MONSTER_MAP, TIER_REALM, TIER_OF_REALM } from "../lib/data/monsters.js";
import { GONGFA, ARTS } from "../lib/data/skills.js";
import { PILL_RECIPES, FORGE_RECIPES } from "../lib/data/recipes.js";
import { EVENTS } from "../lib/data/events.js";
import { REGIONS } from "../lib/data/regions.js";
import { PATHS, SUB_PATHS } from "../lib/data/paths.js";

const problems = [];
const gf = new Set(GONGFA.map((g) => g.id)), arts = new Set(ARTS.map((a) => a.id));
const regions = new Set(REGIONS.map((r) => r.id).concat("any"));
const paths = new Set(PATHS.map((p) => p.id)), subs = new Set(SUB_PATHS.map((p) => p.id));
const regionTier = Object.fromEntries(REGIONS.map((r) => [r.id, r.tier]));
const known = (id) => ITEM_MAP[id] || gf.has(id) || arts.has(id);

for (const m of MONSTERS) {
  for (const a of m.arts) if (!arts.has(a)) problems.push(`monster ${m.id} art ${a}`);
  for (const [id] of m.drops ?? []) if (!known(id)) problems.push(`monster ${m.id} drop ${id}`);
}
for (const r of [...PILL_RECIPES, ...FORGE_RECIPES]) {
  if (!ITEM_MAP[r.out]) problems.push(`recipe ${r.id} out ${r.out}`);
  for (const [id] of r.in) if (!ITEM_MAP[id]) problems.push(`recipe ${r.id} in ${id}`);
}
const ids = new Set();
function walk(o, where) {
  if (!o) return;
  for (const [id] of o.items ?? []) if (!ITEM_MAP[id]) problems.push(`${where} item ${id}`);
  if (o.gongfa && !gf.has(o.gongfa)) problems.push(`${where} gongfa ${o.gongfa}`);
  if (o.art && !arts.has(o.art)) problems.push(`${where} art ${o.art}`);
  if (o.battle) {
    if (typeof o.battle === "string") { if (!MONSTER_MAP[o.battle]) problems.push(`${where} monster ${o.battle}`); }
    else if (typeof o.battle.tier !== "number") problems.push(`${where} battle tier`);
  }
  if (o.next && !EVENTS.some((e) => e.id === o.next && e.w === 0)) problems.push(`${where} next ${o.next} (must exist with w:0)`);
  if (o.chance) { walk(o.chance.ok, where + ".ok"); walk(o.chance.fail, where + ".fail"); }
  walk(o.win, where + ".win"); walk(o.lose, where + ".lose");
}
for (const e of EVENTS) {
  if (ids.has(e.id)) problems.push(`duplicate event ${e.id}`);
  ids.add(e.id);
  if (!regions.has(e.region)) problems.push(`event ${e.id} region ${e.region}`);
  if (!Array.isArray(e.opts) || e.opts.length < 1 || e.opts.length > 4) problems.push(`event ${e.id} opts count`);
  for (const o of e.opts ?? []) {
    const r = o.req ?? {};
    if (r.path && !paths.has(r.path)) problems.push(`event ${e.id}/${o.id} req path ${r.path}`);
    if (r.sub && !subs.has(r.sub)) problems.push(`event ${e.id}/${o.id} req sub ${r.sub}`);
    if (r.item && !ITEM_MAP[r.item[0]]) problems.push(`event ${e.id}/${o.id} req item ${r.item[0]}`);
    walk(o.out, `event ${e.id}/${o.id}`);
    // battles must match the region's tier
    const mid = typeof o.out?.battle === "string" ? o.out.battle : null;
    if (mid && e.region !== "any" && MONSTER_MAP[mid] && MONSTER_MAP[mid].t !== regionTier[e.region]) problems.push(`event ${e.id}/${o.id} monster ${mid} tier ${MONSTER_MAP[mid].t} != region tier ${regionTier[e.region]}`);
  }
}
// ---- tier tables ----
if (TIER_REALM.length !== 7) problems.push(`TIER_REALM has ${TIER_REALM.length} entries (expected 7: tiers 0-6)`);
if (TIER_OF_REALM.length !== 9) problems.push(`TIER_OF_REALM has ${TIER_OF_REALM.length} entries (expected 9: realms 0-8)`);
for (const r of REGIONS) {
  if (TIER_REALM[r.tier] === undefined) problems.push(`region ${r.id} tier ${r.tier} has no TIER_REALM entry`);
  // A region may open one realm before its content's own power (上界裂隙 and 九天罡风层 both do —
  // that overreach is the point), but never more than one: two realms of gap is a wall, not a risk.
  else if (TIER_REALM[r.tier] > r.realm + 1) problems.push(`region ${r.id} opens at realm ${r.realm} but its tier ${r.tier} fights at realm ${TIER_REALM[r.tier]}`);
}
for (let t = 0; t < TIER_REALM.length; t++) {
  const at = MONSTERS.filter((m) => m.t === t);
  if (at.filter((m) => !m.boss).length < 2) problems.push(`tier ${t}: needs >= 2 non-boss monsters (has ${at.filter((m) => !m.boss).length})`);
  if (!at.some((m) => m.boss)) problems.push(`tier ${t}: needs >= 1 boss`);
}
for (const i of ITEMS) if (!(typeof i.t === "number" && i.t >= 0 && i.t <= 5)) problems.push(`item ${i.id} tier ${i.t} out of range (0-5)`);

const counts = {};
for (const e of EVENTS) counts[e.region] = (counts[e.region] ?? 0) + 1;
console.log(`items ${ITEMS.length}, monsters ${MONSTERS.length}, gongfa ${GONGFA.length}, arts ${ARTS.length}, recipes ${PILL_RECIPES.length + FORGE_RECIPES.length}, events ${EVENTS.length}`, counts);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log("data OK");
