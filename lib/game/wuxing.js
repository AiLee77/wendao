// 五行连珠: one deterministic 6×6 puzzle per day, replayed server-side from the submitted moves.
// `wxSim` is deliberately written as flush-left, comment-free ES5 with its own FNV + mulberry32 and
// no reference beyond `Math`: lib/ui/page.js injects `wxSim.toString()` straight into the client so
// the page can validate a move locally, and tools/build.mjs must be able to copy it byte-for-byte
// (its stripper removes comments and leading indentation, so this function has neither).
import { dayKey } from "./time.js";
import { byPrefix, setShared, setSharedSoft, delShared } from "./shared.js";
import { ITEMS, itemOf } from "../data/items.js";
import { TIER_OF_REALM } from "../data/monsters.js";
import { addStack } from "./inventory.js";

export const WX_MOVES = 20;
// score gates: 灵石 / 灵石+材料 / 灵石+材料+悟性 / 再加一点悟性.
// 档位照人来定，不是照解算器：tools/sim-wuxing.mjs 实测随手点中位约 9.7k、认真看约 36k、
// 穷举机器人约 68k。旧的 74000/88000 两档只有穷举跑得到（8% / 4%），等于在奖励写脚本的人。
export const WX_TIERS = [4000, 14000, 30000, 55000];

export function wxSim(seed, moves) {
var i, j, k, r, c, mi;
var a = 2166136261;
var s = String(seed);
for (i = 0; i < s.length; i++) { a = (a ^ s.charCodeAt(i)) >>> 0; a = Math.imul(a, 16777619) >>> 0; }
if (a === 0) a = 2654435769;
function rnd() {
a = (a + 1831565813) >>> 0;
var t = a;
t = Math.imul(t ^ (t >>> 15), t | 1);
t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function stp(x, y) { return (y - x + 5) % 5; }
function link(d) { return d === 0 || d === 1 || d === 4; }
function bad(bd, ix, v) {
var col = ix % 6;
var row = (ix - col) / 6;
var old = bd[ix];
var hit = false, o, x, d1, d2;
bd[ix] = v;
for (o = -2; o <= 0; o++) {
if (hit || col + o < 0 || col + o + 2 > 5) continue;
x = ix + o;
if (bd[x] >= 0 && bd[x + 1] >= 0 && bd[x + 2] >= 0) {
d1 = stp(bd[x], bd[x + 1]); d2 = stp(bd[x + 1], bd[x + 2]);
if (d1 === d2 && link(d1)) hit = true;
}
}
for (o = -2; o <= 0; o++) {
if (hit || row + o < 0 || row + o + 2 > 5) continue;
x = ix + o * 6;
if (bd[x] >= 0 && bd[x + 6] >= 0 && bd[x + 12] >= 0) {
d1 = stp(bd[x], bd[x + 6]); d2 = stp(bd[x + 6], bd[x + 12]);
if (d1 === d2 && link(d1)) hit = true;
}
}
bd[ix] = old;
return hit;
}
function keep(out, base, step, start, len, s0) {
if (len < 3 || !link(s0)) return;
var cells = [], q;
for (q = 0; q < len; q++) cells.push(base + (start + q) * step);
out.push({ c: cells, l: len, s: s0 });
}
function scan(bd, out, base, step) {
var start = 0, len = 1, s0 = -1, q, d;
for (q = 1; q < 6; q++) {
d = stp(bd[base + (q - 1) * step], bd[base + q * step]);
if (len === 1) { s0 = d; len = 2; start = q - 1; }
else if (d === s0) { len++; }
else { keep(out, base, step, start, len, s0); s0 = d; len = 2; start = q - 1; }
}
keep(out, base, step, start, len, s0);
}
function groups(bd) {
var out = [], q;
for (q = 0; q < 6; q++) { scan(bd, out, q * 6, 1); scan(bd, out, q, 6); }
return out;
}
function draw(bd, ix) {
var v = -1, tries = 0, q;
while (tries < 24) { v = (rnd() * 5) | 0; if (!bad(bd, ix, v)) break; v = -1; tries++; }
if (v < 0) { for (q = 0; q < 5; q++) { if (!bad(bd, ix, q)) { v = q; break; } } }
return v < 0 ? 0 : v;
}
var b = [];
for (i = 0; i < 36; i++) { b[i] = -1; }
for (i = 0; i < 36; i++) { b[i] = draw(b, i); }
var score = 0, nch = 0, mx = 0, ev = 0;
function cascade() {
var pass, gs, sum, gone, g, q, col, row, ix, keepCol, kk;
for (pass = 0; pass < 40; pass++) {
gs = groups(b);
if (!gs.length) return;
sum = 0;
gone = {};
for (q = 0; q < gs.length; q++) {
g = gs[q];
sum += (g.s === 0 ? 4 : 10) * g.l * g.l;
nch++;
if (g.l > mx) mx = g.l;
for (k = 0; k < g.c.length; k++) { if (!gone[g.c[k]]) { gone[g.c[k]] = 1; ev++; } }
}
score += Math.floor(sum * (1 + 0.5 * pass));
for (col = 0; col < 6; col++) {
keepCol = [];
for (row = 5; row >= 0; row--) { ix = row * 6 + col; if (!gone[ix]) keepCol.push(b[ix]); }
for (row = 5; row >= 0; row--) { ix = row * 6 + col; kk = 5 - row; b[ix] = kk < keepCol.length ? keepCol[kk] : -1; }
}
for (col = 0; col < 6; col++) { for (row = 0; row < 6; row++) { ix = row * 6 + col; if (b[ix] < 0) b[ix] = draw(b, ix); } }
}
}
var list = [];
if (moves && moves.length) { for (i = 0; i < moves.length; i++) list.push(moves[i]); }
if (list.length > 20) return { ok: false, at: 20 };
for (mi = 0; mi < list.length; mi++) {
var mv = list[mi];
if (!mv || mv.length < 4) return { ok: false, at: mi };
var r1 = mv[0] | 0, c1 = mv[1] | 0, r2 = mv[2] | 0, c2 = mv[3] | 0;
if (r1 < 0 || r1 > 5 || c1 < 0 || c1 > 5 || r2 < 0 || r2 > 5 || c2 < 0 || c2 > 5) return { ok: false, at: mi };
if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return { ok: false, at: mi };
var i1 = r1 * 6 + c1, i2 = r2 * 6 + c2;
var tv = b[i1]; b[i1] = b[i2]; b[i2] = tv;
if (!groups(b).length) { tv = b[i1]; b[i1] = b[i2]; b[i2] = tv; return { ok: false, at: mi }; }
cascade();
}
return { ok: true, score: score, board: b, moves: list.length, chains: nch, max: mx, ev: ev };
}

export function wxSeed(day) {
  return `wx:${day}`;
}
export function wxKey(day, uid) {
  return `wx:${day}:${uid}`;
}
function wxMats(c) {
  const r = Math.max(0, Math.min(8, c.r | 0));
  const want = Array.isArray(TIER_OF_REALM) ? (TIER_OF_REALM[r] ?? Math.min(4, r)) : Math.min(4, r);
  for (let t = want; t >= 0; t--) {
    const list = ITEMS.filter((x) => x.k === "mat" && x.t === t);
    if (list.length) return list;
  }
  return ITEMS.filter((x) => x.k === "mat");
}

// wx 散键会被 bot 折叠进 wxb:<day>；棋局一天一局不累积，散键与折叠值等价，散键优先
export function wxFold(shared, day) {
  return shared.get(`wxb:${day}`)?.d ?? {};
}
export function wxBoard(shared, day) {
  const m = { ...wxFold(shared, day) };
  for (const e of byPrefix(shared, `${wxKey(day, "")}`)) if (e.value && e.value.uid !== undefined) m[String(e.value.uid)] = e.value;
  return Object.values(m).filter((v) => v && v.uid !== undefined)
    .sort((a, b) => (b.sc - a.sc) || ((a.t ?? 0) - (b.t ?? 0)));
}

export function wuxingView(c, shared, now) {
  const day = dayKey(now);
  const all = wxBoard(shared, day);
  const idx = all.findIndex((x) => String(x.uid) === String(c.uid));
  const mine = idx >= 0 ? all[idx] : null;
  return {
    day, seed: wxSeed(day), moves: WX_MOVES, tiers: WX_TIERS, total: all.length,
    left: mine ? 0 : 1, mine: mine ? { sc: mine.sc, n: mine.n } : null, rank: idx >= 0 ? idx + 1 : null,
    board: all.slice(0, 20).map((x, i) => ({ rank: i + 1, uid: x.uid, n: x.n, sc: x.sc })),
    u: 20 * (1 + c.r),
  };
}

export function wxSubmit(c, shared, now, moves, effects) {
  const day = dayKey(now);
  if (shared.get(wxKey(day, c.uid)) || wxFold(shared, day)[String(c.uid)] || c.daily.wx) return { ok: false, msg: "今日棋局已了，明日再来" };
  if (!Array.isArray(moves) || !moves.length) return { ok: false, msg: "至少走一步" };
  if (moves.length > WX_MOVES) return { ok: false, msg: `最多 ${WX_MOVES} 步` };
  const clean = [];
  for (const m of moves) {
    if (!Array.isArray(m) || m.length !== 4) return { ok: false, msg: "走法不合法" };
    const row = [];
    for (const x of m) {
      const n = Number(x);
      if (!Number.isInteger(n) || n < 0 || n > 5) return { ok: false, msg: "走法不合法" };
      row.push(n);
    }
    clean.push(row);
  }
  const res = wxSim(wxSeed(day), clean);
  if (!res.ok) return { ok: false, msg: `第 ${(res.at ?? 0) + 1} 步不成连珠` };
  const sc = res.score;
  const u = 20 * (1 + c.r);
  let ls = 0, wu = 0, mats = 0;
  if (sc >= WX_TIERS[0]) ls = u;
  if (sc >= WX_TIERS[1]) { ls = 2 * u; mats = 1; }
  if (sc >= WX_TIERS[2]) { ls = 3 * u; mats = 2; wu = 1; }
  if (sc >= WX_TIERS[3]) wu = 2;
  const drops = [];
  if (mats) {
    const pool = wxMats(c);
    for (let k = 0; k < mats; k++) {
      const m = pool[(sc + k * 7) % pool.length];
      drops.push({ id: m.id, n: 1, name: m.name, t: m.t, lost: !addStack(c, m.id, 1) });
    }
  }
  c.ls += ls;
  c.wu = (c.wu ?? 0) + wu;
  c.daily.wx = 1;
  c.wx = { d: day, sc };
  const rec = { uid: c.uid, n: c.name, sc, t: now };
  setSharedSoft(effects, shared, wxKey(day, c.uid), rec); // 棋局奖励照发；共享区快满时只是这一天上不了榜
  shared.set(wxKey(day, c.uid), rec);
  const parts = [`连珠 ${sc} 分`];
  if (ls) parts.push(`灵石 +${ls}`);
  if (drops.length) parts.push(drops.map((d) => d.name + (d.lost ? "（行囊已满，遗失）" : "")).join("、"));
  if (wu) parts.push(`悟性 +${wu}`);
  return { ok: true, msg: parts.join("，"), score: sc, ls, wu, drops, chains: res.chains, max: res.max, board: res.board };
}

// Bot: two days of boards is plenty of history for the daily leaderboard.
export function botPruneWx(shared, now, effects) {
  const day = dayKey(now);
  for (const e of byPrefix(shared, "wx:")) {
    const d = Number(e.key.split(":")[1]);
    if (Number.isFinite(d) && d < day) delShared(effects, e.key); // 棋局榜只显示当天，隔天就没人读了
  }
  for (const e of byPrefix(shared, "wxb:")) if (Number(e.key.slice(4)) < day) delShared(effects, e.key);
}
