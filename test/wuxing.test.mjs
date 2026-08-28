// 五行连珠: the shared ES5 simulator, its scoring table, and the daily server rules around it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";
import { wxSim, wxSeed, WX_TIERS, WX_MOVES } from "../lib/game/wuxing.js";
import { DAY, dayKey } from "../lib/game/time.js";

const SWAPS = [];
for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
  if (c < 5) SWAPS.push([r, c, r, c + 1]);
  if (r < 5) SWAPS.push([r, c, r + 1, c]);
}
// An independent chain detector, written from the rules rather than from wxSim.
function chainsIn(board) {
  const out = [];
  const step = (x, y) => (y - x + 5) % 5;
  const linked = (d) => d === 0 || d === 1 || d === 4;
  const scan = (base, stride) => {
    let start = 0, len = 1, s0 = -1;
    const flush = () => { if (len >= 3 && linked(s0)) out.push({ len, s: s0 }); };
    for (let j = 1; j < 6; j++) {
      const d = step(board[base + (j - 1) * stride], board[base + j * stride]);
      if (len === 1) { s0 = d; len = 2; start = j - 1; }
      else if (d === s0) len++;
      else { flush(); s0 = d; len = 2; start = j - 1; }
    }
    flush();
  };
  for (let i = 0; i < 6; i++) { scan(i * 6, 1); scan(i, 6); }
  return out;
}
// Greedy: take the swap that scores most this step. Cheap enough for a unit test.
function greedy(seed, maxMoves) {
  const moves = [];
  let cur = wxSim(seed, moves);
  for (let step = 0; step < maxMoves; step++) {
    let best = null, bestScore = cur.score;
    for (const s of SWAPS) {
      const r = wxSim(seed, moves.concat([s]));
      if (r.ok && r.score > bestScore) { bestScore = r.score; best = s; }
    }
    if (!best) break;
    moves.push(best);
    cur = wxSim(seed, moves);
  }
  return { moves, res: cur };
}

test("连珠: wxSim is self-contained ES5 — the client gets it verbatim", () => {
  const src = wxSim.toString();
  assert.ok(!/[`]|\$\{|=>/.test(src), "no template literals and no arrow functions");
  assert.ok(!/\b(let|const|class|of)\b/.test(src), "no ES6 declarations");
  assert.ok(!/\b(document|window|self|require|process)\b/.test(src), "no host globals");
  // every identifier it reaches for outside its own body is Math
  const free = src.replace(/\bMath\.\w+/g, "");
  assert.ok(!/\b(JSON|Object|Array|Date)\b/.test(free), "no library objects beyond Math");
  // and the build stripper must be able to copy it byte for byte: no comments, no indentation
  const lines = src.split("\n");
  assert.ok(lines.every((l) => !/^\s+\S/.test(l)), "no indented lines");
  assert.ok(lines.every((l) => l.trim() !== ""), "no blank lines");
  assert.ok(!/\/\/|\/\*/.test(src), "no comments");
});

test("连珠: 200 seeds all open on a board with no ready-made chain", () => {
  for (let d = 0; d < 200; d++) {
    const r = wxSim(wxSeed(d), []);
    assert.equal(r.ok, true);
    assert.equal(r.board.length, 36);
    assert.ok(r.board.every((v) => v >= 0 && v <= 4), `seed ${d} board is 五行`);
    assert.deepEqual(chainsIn(r.board), [], `seed ${d} opens clean`);
  }
});

test("连珠: the same seed and moves always produce the same score and board", () => {
  const seed = wxSeed(1234);
  const { moves } = greedy(seed, 6);
  const a = wxSim(seed, moves);
  const b = wxSim(seed, moves.map((m) => m.slice()));
  assert.equal(a.score, b.score);
  assert.deepEqual(a.board, b.board);
  assert.ok(a.score > 0);
  // and the board the moves leave behind is itself chain-free
  assert.deepEqual(chainsIn(a.board), []);
});

test("连珠: a swap that forms nothing, a bad cell and a 21st move are all rejected", () => {
  const seed = wxSeed(1);
  // the opening board has no chains, so *some* swap must be illegal
  const illegal = SWAPS.find((s) => !wxSim(seed, [s]).ok);
  assert.ok(illegal, "an illegal swap exists");
  assert.deepEqual(wxSim(seed, [illegal]), { ok: false, at: 0 });
  assert.equal(wxSim(seed, [[0, 0, 5, 5]]).ok, false, "non-adjacent");
  assert.equal(wxSim(seed, [[0, 0, 0, 9]]).ok, false, "off the board");
  const legal = SWAPS.filter((s) => wxSim(seed, [s]).ok)[0];
  const long = [];
  for (let i = 0; i < 21; i++) long.push(legal);
  assert.deepEqual(wxSim(seed, long), { ok: false, at: 20 }, "the 21st move is refused outright");
});

test("连珠: 相生 L3 = 90, 同气 L3 = 36, L4 = 160/64, second wave ×1.5", () => {
  const l3 = new Set(), l4 = new Set();
  let cascade = null;
  for (let d = 0; d < 300 && (l3.size < 2 || l4.size < 2 || !cascade); d++) {
    const seed = wxSeed(d);
    for (const s of SWAPS) {
      const r = wxSim(seed, [s]);
      if (!r.ok) continue;
      if (r.chains === 1 && r.max === 3) l3.add(r.score);
      if (r.chains === 1 && r.max === 4) l4.add(r.score);
      if (!cascade && r.chains === 2 && r.max === 3 && r.score > 180) cascade = r.score;
    }
  }
  assert.deepEqual([...l3].sort((a, b) => a - b), [36, 90], "one 三连: 同气 4L² / 相生 10L²");
  assert.deepEqual([...l4].sort((a, b) => a - b), [64, 160], "one 四连: 4·16 / 10·16");
  assert.equal(cascade, 225, "90 then floor(90 × 1.5) — the second wave pays half again");
});

test("连珠: gravity and refill are pinned to a golden board", () => {
  const r = wxSim(wxSeed(7), [[0, 2, 1, 2]]);
  assert.equal(r.ok, true);
  assert.equal(wxSim(wxSeed(7), []).board.join(""), "302013300344434241200413242330040311");
  assert.equal(r.board.join(""), "320213301314434241200413242330040311", "columns fall, then refill 0..5 top-down");
  assert.equal(r.score, 126);
  assert.equal(r.ev, 6, "six tiles cleared");
});

test("连珠: one board a day — a rebirth on the same day does not buy a second", async () => {
  const site = new Site();
  await site.call(1, "boot");
  await site.call(1, "create", { name: "棋手" });
  const day = dayKey(site.now);
  let v = await site.call(1, "wx");
  assert.equal(v.data.wx.seed, wxSeed(day));
  assert.equal(v.data.wx.left, 1);
  assert.equal(v.data.wx.moves, WX_MOVES);
  const { moves, res } = greedy(wxSeed(day), 5);
  const r = await site.call(1, "wx.submit", { moves });
  assert.equal(r.ok, true, r.msg);
  assert.equal(r.data.wxres.score, res.score);
  assert.equal(site.char(1).wx.d, day);
  assert.equal(site.shared.get(`wx:${day}:1`).sc, res.score);
  const again = await site.call(1, "wx.submit", { moves });
  assert.equal(again.ok, false);
  assert.match(again.msg, /今日棋局/);
  // die, be reborn, and the shared key still holds the day
  site.setChar(1, (c) => { c.born = site.now - 40 * DAY; });
  await site.call(1, "home");
  const rb = await site.call(1, "rebirth", { name: "再棋" });
  assert.equal(rb.ok, true, rb.msg);
  assert.equal(site.char(1).wx, undefined, "a new life carries no board");
  const third = await site.call(1, "wx.submit", { moves });
  assert.equal(third.ok, false, "the day is spent, whoever you are now");
});

test("连珠: rewards follow the score gates, and bad move lists are refused", async () => {
  const site = new Site();
  await site.call(2, "boot");
  await site.call(2, "create", { name: "棋痴" });
  site.setChar(2, (c) => { c.r = 3; c.wu = 0; c.ls = 0; });
  const day = dayKey(site.now);
  let bad = await site.call(2, "wx.submit", { moves: "nope" });
  assert.equal(bad.ok, false);
  bad = await site.call(2, "wx.submit", { moves: [[0, 0, 0]] });
  assert.equal(bad.ok, false);
  assert.match(bad.msg, /不合法/);
  const dud = SWAPS.find((s) => !wxSim(wxSeed(day), [s]).ok);
  bad = await site.call(2, "wx.submit", { moves: [dud] });
  assert.equal(bad.ok, false);
  assert.match(bad.msg, /第 1 步不成连珠/);
  assert.equal(site.char(2).daily.wx, undefined, "a refused board is not spent");
  const { moves, res } = greedy(wxSeed(day), 8);
  const u = 20 * (1 + 3);
  const want = { ls: 0, wu: 0, mats: 0 };
  if (res.score >= WX_TIERS[0]) want.ls = u;
  if (res.score >= WX_TIERS[1]) { want.ls = 2 * u; want.mats = 1; }
  if (res.score >= WX_TIERS[2]) { want.ls = 3 * u; want.mats = 2; want.wu = 1; }
  if (res.score >= WX_TIERS[3]) want.wu = 2;
  assert.ok(res.score >= WX_TIERS[0], `a greedy 8-move game clears the first gate (${res.score})`);
  const ls0 = site.char(2).ls; // 登录 / 初入仙途 payouts already landed
  const r = await site.call(2, "wx.submit", { moves });
  assert.equal(r.ok, true, r.msg);
  assert.equal(r.data.wxres.ls, want.ls);
  assert.equal(r.data.wxres.wu, want.wu);
  assert.equal(r.data.wxres.drops.length, want.mats);
  assert.equal(site.char(2).wu, want.wu);
  assert.equal(site.char(2).ls - ls0, want.ls);
  assert.equal(site.char(2).daily.wx, 1);
});

test("连珠: the daily board sorts by score then by time, and the bot clears old days", async () => {
  const site = new Site();
  await site.call(3, "boot");
  await site.call(3, "create", { name: "看棋人" });
  const day = dayKey(site.now);
  site.shared.set(`wx:${day}:801`, { uid: 801, n: "先到", sc: 500, t: site.now - 1000 });
  site.shared.set(`wx:${day}:802`, { uid: 802, n: "后到", sc: 500, t: site.now });
  site.shared.set(`wx:${day}:803`, { uid: 803, n: "高分", sc: 900, t: site.now });
  site.shared.set(`wx:${day - 5}:804`, { uid: 804, n: "上周", sc: 9999, t: site.now - 5 * DAY });
  const v = await site.call(3, "wx");
  assert.deepEqual(v.data.wx.board.map((x) => x.n), ["高分", "先到", "后到"]);
  assert.equal(v.data.wx.total, 3, "yesterday's keys are a different board");
  assert.equal(v.data.wx.rank, null);
  const { moves } = greedy(wxSeed(day), 4);
  const r = await site.call(3, "wx.submit", { moves });
  assert.equal(r.ok, true, r.msg);
  assert.ok(r.data.wx.rank >= 1, "your own row is on the board straight away");
  assert.ok(r.data.wx.mine);
  // the bot prunes anything older than two days
  site.advance(3 * DAY);
  await site.tick();
  assert.equal(site.shared.has(`wx:${day - 5}:804`), false, "stale board pruned");
  assert.equal(site.shared.has(`wx:${day}:803`), false, "so is the day before last");
});

test("连珠: a greedy bot over 100 seeds never produces NaN and stays in range", () => {
  const scores = [];
  for (let d = 0; d < 100; d++) {
    const { res } = greedy(wxSeed(50000 + d), 5);
    assert.equal(res.ok, true);
    assert.ok(Number.isFinite(res.score), `seed ${d} scored a number`);
    assert.ok(res.score >= 0 && res.score < 1e7, `seed ${d} score ${res.score} in range`);
    assert.deepEqual(chainsIn(res.board), [], `seed ${d} ends chain-free`);
    scores.push(res.score);
  }
  scores.sort((a, b) => a - b);
  const median = scores[50];
  assert.ok(median > WX_TIERS[0] / 3, `a five-move greedy median (${median}) is a sane fraction of the first gate`);
});
