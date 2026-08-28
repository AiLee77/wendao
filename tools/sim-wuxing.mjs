// 连珠奖励档位校准：三档「玩家水平」各跑 N 个每日种子，看各档奖励的到达率。
// 目标：随手玩也能拿到第一档，认真看的人稳拿第二档、常拿第三档，第四档留给极出色的一局。
import { wxSim, WX_TIERS, WX_MOVES } from "../lib/game/wuxing.js";
const N = Number(process.env.N ?? 40);
const SIZE = 6;
function legalMoves(seed, moves) {
  const out = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 >= SIZE || c2 >= SIZE) continue;
      const t = moves.concat([[r, c, r2, c2]]);
      const res = wxSim(seed, t);
      if (res.ok) out.push({ mv: [r, c, r2, c2], sc: res.score });
    }
  }
  return out;
}
function play(seed, pick) {
  const moves = [];
  for (let k = 0; k < WX_MOVES; k++) {
    const legal = legalMoves(seed, moves);
    if (!legal.length) break;
    moves.push(pick(legal, k).mv);
  }
  const r = wxSim(seed, moves);
  return r.ok ? r.score : 0;
}
const KINDS = [
  ["随手点", (l, k) => l[(k * 7 + 3) % l.length]],
  ["会看的人", (l, k) => { const s = l.slice().sort((a, b) => b.sc - a.sc); return s[Math.min(s.length - 1, Math.floor(s.length * 0.25 * ((k * 5 % 3) / 3)))]; }],
  ["穷举机器人", (l) => l.slice().sort((a, b) => b.sc - a.sc)[0]],
];
console.log("WX_TIERS", JSON.stringify(WX_TIERS));
for (const [name, pick] of KINDS) {
  const scores = [];
  for (let d = 0; d < N; d++) scores.push(play(`wx:${20700 + d}`, pick));
  scores.sort((a, b) => a - b);
  const med = scores[Math.floor(N / 2)];
  const hit = WX_TIERS.map((t) => Math.round(scores.filter((s) => s >= t).length / N * 100) + "%");
  console.log(`${name.padEnd(6)} 中位 ${String(med).padStart(6)}  各档到达率 ${hit.join(" / ")}`);
}
