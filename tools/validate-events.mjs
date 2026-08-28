// Validates lib/data/events.js against the content rules for 游历事件.
// Run: node tools/validate-events.mjs   (exits non-zero on any rule violation)
import { EVENTS } from "../lib/data/events.js";
import { ITEMS } from "../lib/data/items.js";
import { MONSTERS } from "../lib/data/monsters.js";
import { REGIONS } from "../lib/data/regions.js";
import { GONGFA, ARTS } from "../lib/data/skills.js";
import { PATHS, SUB_PATHS } from "../lib/data/paths.js";

const ITEM_IDS = new Set(ITEMS.map((i) => i.id));
const ITEM_BY = new Map(ITEMS.map((i) => [i.id, i]));
const MON_BY = new Map(MONSTERS.map((m) => [m.id, m]));
const REGION_BY = new Map(REGIONS.map((r) => [r.id, r]));
const GONGFA_IDS = new Set(GONGFA.map((g) => g.id));
const ART_IDS = new Set(ARTS.map((a) => a.id));
const PATH_IDS = new Set(PATHS.map((p) => p.id));
const SUB_IDS = new Set(SUB_PATHS.map((p) => p.id));
const ELEMS = new Set(["金", "木", "水", "火", "土", "雷", "无"]);
const STAT_KEYS = new Set(["spd", "atk", "def", "hp", "mp", "crit"]);

// caps for a single xp / ls figure inside one outcome node; "any" is capped like low-tier content
const XP_CAP = { 0: 80, 1: 200, 2: 600, 3: 1500, 4: 8000, 5: 25000, 6: 60000, any: 200 };
const LS_CAP = { 0: 80, 1: 200, 2: 600, 3: 1500, 4: 8000, 5: 25000, 6: 60000, any: 200 };
const REGION_MIN = { qingshan: 16, yunmeng: 14, wanyao: 12, beiming: 10, shangjie: 7, jiutian: 5, taixu: 5, any: 8 };
const TOTAL_MIN = 85;
const CHAIN_MIN = 6;
const SUB_OPT_MIN = 4;
const FLAG_EVENT_MIN = 3;
const MEME_MAX = 4;
const RARE_CHANCE_MAX = 0.5;
// Two events predate the 2-4 option rule and are deliberately left unchanged
// (both are "you just take it" story codas). They are reported as warnings, not errors.
const LEGACY_SINGLE_OPT = new Set(["ym_dongfu_in", "wy_saved_return"]);
// w:0 events the engine hands out directly (sub-path hooks), not reached through another event's `next`.
// They are also excluded from the "any" region minimum, which must be met by events that can actually roll.
const CODE_CHAINED = new Set(["sh_trade_1", "sh_trade_2", "sh_trade_3"]);

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

// ---- pass 1: ids and structure ----
const byId = new Map();
for (const e of EVENTS) {
  if (byId.has(e.id)) err(`duplicate event id: ${e.id}`);
  byId.set(e.id, e);
  if (typeof e.id !== "string" || !e.id) err("event with missing id");
  if (e.region !== "any" && !REGION_BY.has(e.region)) err(`${e.id}: unknown region "${e.region}"`);
  if (typeof e.w !== "number" || e.w < 0) err(`${e.id}: w must be a number >= 0`);
  if (typeof e.text !== "string" || !e.text.trim()) err(`${e.id}: missing text`);
  if (!Array.isArray(e.opts)) { err(`${e.id}: opts must be an array`); continue; }
  if (e.opts.length < 2 || e.opts.length > 4) {
    const msg = `${e.id}: has ${e.opts.length} options (must be 2-4)`;
    if (LEGACY_SINGLE_OPT.has(e.id) && e.opts.length === 1) warn(msg + " [pre-existing, left unchanged]");
    else err(msg);
  }
  const optIds = new Set();
  for (const o of e.opts) {
    if (optIds.has(o.id)) err(`${e.id}: duplicate option id "${o.id}"`);
    optIds.add(o.id);
    if (typeof o.label !== "string" || !o.label) err(`${e.id}.${o.id}: missing label`);
    else if ([...o.label].length > 12) err(`${e.id}.${o.id}: label "${o.label}" is ${[...o.label].length} chars (max 12)`);
    if (!o.out || typeof o.out !== "object") err(`${e.id}.${o.id}: missing out`);
  }
  // every event needs one always-available way out, or a player who meets no
  // requirement is stuck with c.ev set and no choice that choose() will accept
  if (e.opts.length && !e.opts.some((o) => !o.req)) err(`${e.id}: every option is req-gated (no way out for a player who meets none)`);
}

const tierOf = (e) => (e.region === "any" ? "any" : REGION_BY.get(e.region)?.tier);

// ---- pass 2: requirements and outcome trees ----
const nextTargets = new Set();
const pathsByRegion = new Map();
let subOptions = 0, elemReqs = 0, statReqs = 0;
let heartCount = 0, cureCount = 0, injuryCount = 0, artRewards = 0;
const legacyEvents = [];

function checkReq(e, o) {
  const r = o.req;
  if (!r) return;
  if (r.path !== undefined) {
    if (!PATH_IDS.has(r.path)) err(`${e.id}.${o.id}: unknown path "${r.path}"`);
    else if (e.region !== "any") {
      if (!pathsByRegion.has(e.region)) pathsByRegion.set(e.region, new Set());
      pathsByRegion.get(e.region).add(r.path);
    }
  }
  if (r.sub !== undefined) { if (!SUB_IDS.has(r.sub)) err(`${e.id}.${o.id}: unknown sub "${r.sub}"`); else subOptions++; }
  if (r.elem !== undefined) { if (!ELEMS.has(r.elem)) err(`${e.id}.${o.id}: unknown elem "${r.elem}"`); else elemReqs++; }
  if (r.item !== undefined) {
    if (!Array.isArray(r.item) || r.item.length !== 2) err(`${e.id}.${o.id}: req.item must be [id, n]`);
    else if (!ITEM_IDS.has(r.item[0])) err(`${e.id}.${o.id}: req.item unknown item "${r.item[0]}"`);
  }
  if (r.stat !== undefined) {
    if (!Array.isArray(r.stat) || r.stat.length !== 2) err(`${e.id}.${o.id}: req.stat must be [key, value]`);
    else if (!STAT_KEYS.has(r.stat[0])) err(`${e.id}.${o.id}: req.stat unknown key "${r.stat[0]}"`);
    else if (typeof r.stat[1] !== "number") err(`${e.id}.${o.id}: req.stat value must be a number`);
    else statReqs++;
  }
  if (r.ls !== undefined && typeof r.ls !== "number") err(`${e.id}.${o.id}: req.ls must be a number`);
  if (r.realm !== undefined && typeof r.realm !== "number") err(`${e.id}.${o.id}: req.realm must be a number`);
  if (r.flag !== undefined && typeof r.flag !== "string") err(`${e.id}.${o.id}: req.flag must be a string`);
}

// ctx.gated: a rare reward here is acceptable — once-per-life event, w:0 chain node,
// req-gated option, low-probability branch, or the win branch of a boss fight.
function walk(e, o, out, ctx, depth = 0) {
  if (!out || typeof out !== "object" || depth > 8) return;
  const tier = tierOf(e);
  const where = `${e.id}.${o.id}`;
  if (out.xp !== undefined) {
    if (typeof out.xp !== "number") err(`${where}: xp must be a number`);
    else if (Math.abs(out.xp) > XP_CAP[tier]) err(`${where}: xp ${out.xp} exceeds tier cap ${XP_CAP[tier]}`);
  }
  if (out.ls !== undefined) {
    if (typeof out.ls !== "number") err(`${where}: ls must be a number`);
    else if (Math.abs(out.ls) > LS_CAP[tier]) err(`${where}: ls ${out.ls} exceeds tier cap ${LS_CAP[tier]}`);
  }
  if (out.wu !== undefined && (typeof out.wu !== "number" || Math.abs(out.wu) > 5)) err(`${where}: wu ${out.wu} out of range`);
  if (out.hp !== undefined && (out.hp < -1 || out.hp > 1)) err(`${where}: hp must be a fraction in [-1,1]`);
  if (out.legacy !== undefined) {
    if (typeof out.legacy !== "number" || out.legacy < 1 || out.legacy > 2) err(`${where}: legacy ${out.legacy} out of range (1-2)`);
    legacyEvents.push(e.id);
    if (!ctx.gated) warn(`${where}: legacy granted from a repeatable, ungated option`);
  }
  if (out.heart) heartCount++;
  if (out.heartCure) cureCount++;
  if (out.injury) injuryCount++;
  if (out.flag !== undefined && typeof out.flag !== "string") err(`${where}: flag must be a string`);
  if (out.unflag !== undefined && typeof out.unflag !== "string") err(`${where}: unflag must be a string`);

  if (out.items) {
    if (!Array.isArray(out.items)) err(`${where}: items must be an array`);
    else for (const pair of out.items) {
      if (!Array.isArray(pair) || pair.length !== 2) { err(`${where}: item entry must be [id, n]`); continue; }
      const [id, n] = pair;
      if (!ITEM_IDS.has(id)) { err(`${where}: unknown item "${id}"`); continue; }
      if (typeof n !== "number" || n === 0) { err(`${where}: item "${id}" count must be non-zero`); continue; }
      if (n < 0 && !(o.req && o.req.item && o.req.item[0] === id)) err(`${where}: negative count for "${id}" without a matching req.item`);
      const kind = ITEM_BY.get(id).k;
      if (n > 0 && (kind === "art" || kind === "egg") && !ctx.gated) err(`${where}: ${kind} "${id}" handed out without once/req/chance/boss gating`);
    }
  }
  if (out.gongfa !== undefined) {
    if (!GONGFA_IDS.has(out.gongfa)) err(`${where}: unknown gongfa "${out.gongfa}"`);
    else if (!ctx.gated) err(`${where}: gongfa "${out.gongfa}" handed out without once/req/chance/boss gating`);
  }
  if (out.art !== undefined) {
    if (!ART_IDS.has(out.art)) err(`${where}: unknown art "${out.art}"`);
    else { artRewards++; if (!ctx.gated) err(`${where}: art "${out.art}" handed out without once/req/chance/boss gating`); }
  }
  if (out.next !== undefined) {
    if (typeof out.next !== "string") err(`${where}: next must be a string`);
    else nextTargets.add(out.next);
  }
  if (out.chance) {
    const p = out.chance.p;
    if (typeof p !== "number" || p <= 0 || p >= 1) err(`${where}: chance.p must be in (0,1)`);
    walk(e, o, out.chance.ok, { gated: ctx.gated || (typeof p === "number" && p <= RARE_CHANCE_MAX) }, depth + 1);
    walk(e, o, out.chance.fail, ctx, depth + 1);
  }
  if (out.battle !== undefined) {
    let boss = false;
    if (typeof out.battle === "string") {
      const m = MON_BY.get(out.battle);
      if (!m) err(`${where}: unknown monster "${out.battle}"`);
      else {
        boss = !!m.boss;
        const rt = REGION_BY.get(e.region) ? REGION_BY.get(e.region).tier : null;
        if (e.region === "any") err(`${where}: region "any" must not use an explicit monster battle`);
        else if (m.t !== rt) err(`${where}: monster "${out.battle}" is tier ${m.t} but region ${e.region} is tier ${rt}`);
      }
    } else if (out.battle && typeof out.battle === "object") {
      if (e.region !== "any") err(`${where}: tier-form battle is only allowed in region "any"`);
      if (typeof out.battle.tier !== "number") err(`${where}: battle.tier must be a number`);
      boss = !!out.battle.boss;
    } else err(`${where}: battle must be a monster id or { tier }`);
    walk(e, o, out.win, { gated: ctx.gated || boss }, depth + 1);
    walk(e, o, out.lose, ctx, depth + 1);
  }
}

for (const e of EVENTS) {
  if (!Array.isArray(e.opts)) continue;
  for (const o of e.opts) {
    checkReq(e, o);
    walk(e, o, o.out, { gated: !!e.once || e.w === 0 || !!o.req });
  }
}

// ---- pass 3: chains, flags, coverage, counts ----
for (const id of nextTargets) {
  const t = byId.get(id);
  if (!t) { err(`next target "${id}" does not exist`); continue; }
  if (t.w !== 0) err(`next target "${id}" must have w: 0 (has ${t.w})`);
}
for (const e of EVENTS) {
  if (e.w === 0 && !nextTargets.has(e.id) && !CODE_CHAINED.has(e.id)) err(`${e.id}: w:0 but no event points to it with next`);
}
const chainEdges = new Set();
for (const e of EVENTS) {
  for (const o of e.opts || []) {
    (function collect(out, d) {
      if (!out || typeof out !== "object" || d > 8) return;
      if (out.next) chainEdges.add(`${e.id}->${out.next}`);
      collect(out.chance && out.chance.ok, d + 1);
      collect(out.chance && out.chance.fail, d + 1);
      collect(out.win, d + 1);
      collect(out.lose, d + 1);
    })(o.out, 0);
  }
}
const chainStarts = new Set([...chainEdges].map((x) => x.split("->")[0]));

const flagGated = EVENTS.filter((e) => typeof e.flag === "string");
const setFlags = new Set();
for (const e of EVENTS) {
  (function scan(node, d) {
    if (!node || typeof node !== "object" || d > 12) return;
    if (Array.isArray(node)) { for (const x of node) scan(x, d + 1); return; }
    if (typeof node.flag === "string") setFlags.add(node.flag);
    for (const k of ["out", "chance", "ok", "fail", "win", "lose"]) scan(node[k], d + 1);
  })(e.opts, 0);
}
for (const e of flagGated) if (!setFlags.has(e.flag)) err(`${e.id}: gated on flag "${e.flag}" that no outcome ever sets`);

const perRegion = {};
for (const e of EVENTS) perRegion[e.region] = (perRegion[e.region] || 0) + 1;
// "any" is the fallback pool every region draws from, so its minimum counts only rollable (w > 0)
// events: code-chained hooks like the 商人 trades must not pad it.
const rollableAny = EVENTS.filter((e) => e.region === "any" && e.w > 0).length;
for (const [r, min] of Object.entries(REGION_MIN)) {
  const n = r === "any" ? rollableAny : (perRegion[r] || 0);
  if (n < min) err(`region ${r}: ${n} events (need >= ${min})`);
}
if (EVENTS.length < TOTAL_MIN) err(`total ${EVENTS.length} events (need >= ${TOTAL_MIN})`);
if (chainStarts.size < CHAIN_MIN) err(`${chainStarts.size} chains (need >= ${CHAIN_MIN})`);
if (subOptions < SUB_OPT_MIN) err(`${subOptions} options require a sub-path (need >= ${SUB_OPT_MIN})`);
if (flagGated.length < FLAG_EVENT_MIN) err(`${flagGated.length} flag-gated follow-ups (need >= ${FLAG_EVENT_MIN})`);
if (!elemReqs) err("no option uses an elem requirement");
if (!statReqs) err("no option uses a stat requirement");
if (!artRewards) err("no event rewards a 神通 (art)");
if (!heartCount) err("no event causes 心魔 (heart)");
if (!cureCount) err("no event cures 心魔 (heartCure)");
if (!injuryCount) err("no event causes 重伤 (injury)");

for (const r of REGIONS) {
  const got = pathsByRegion.get(r.id) || new Set();
  const missing = [...PATH_IDS].filter((p) => !got.has(p));
  if (missing.length) err(`region ${r.id}: no option requires path(s) ${missing.join(", ")}`);
}

const memes = EVENTS.filter((e) => e.id.startsWith("meme_"));
if (memes.length > MEME_MAX) err(`${memes.length} meme_ events (max ${MEME_MAX})`);
for (const e of memes) {
  if (e.region !== "any") err(`${e.id}: meme_ events must use region "any"`);
  if (e.w !== 2) err(`${e.id}: meme_ events must use w: 2`);
}

// ---- report ----
const order = ["qingshan", "yunmeng", "wanyao", "beiming", "shangjie", "jiutian", "taixu", "any"];
console.log(`events: ${EVENTS.length}`);
console.log("per region: " + order.map((r) => `${r}=${perRegion[r] || 0}`).join("  "));
console.log(`chains: ${chainStarts.size} (${chainEdges.size} edges)   w:0 nodes: ${EVENTS.filter((e) => e.w === 0).length}   once: ${EVENTS.filter((e) => e.once).length}`);
console.log(`flag-gated events: ${flagGated.length} [${flagGated.map((e) => e.flag).join(", ")}]   distinct flags set: ${setFlags.size}`);
console.log("path-gated options per region: " + REGIONS.map((r) => `${r.id}=${(pathsByRegion.get(r.id) || new Set()).size}/9`).join("  "));
console.log(`sub options: ${subOptions}   elem reqs: ${elemReqs}   stat reqs: ${statReqs}   art rewards: ${artRewards}`);
console.log(`heart: ${heartCount}   heartCure: ${cureCount}   injury: ${injuryCount}   legacy events: ${new Set(legacyEvents).size}   meme_: ${memes.length}`);
for (const w of warns) console.log(`WARN  ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const m of errors) console.error(`  FAIL  ${m}`);
  process.exit(1);
}
console.log("\nOK - all checks passed" + (warns.length ? ` (${warns.length} warning(s))` : ""));
