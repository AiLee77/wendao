import { profiles, setShared } from "./shared.js";
import { DAY } from "./time.js";

// Seasons are computed from a fixed epoch, so every handler agrees without coordination.
export const SEASON_EPOCH = Date.UTC(2026, 8, 1); // 2026-09-01
export const SEASON_DAYS = 30;

export function seasonOf(now) {
  const n = Math.max(0, Math.floor((now - SEASON_EPOCH) / (SEASON_DAYS * DAY)));
  const start = SEASON_EPOCH + n * SEASON_DAYS * DAY;
  return { n, start, end: start + SEASON_DAYS * DAY, daysLeft: Math.max(0, Math.ceil((start + SEASON_DAYS * DAY - now) / DAY)) };
}

export function standings(shared, n) {
  return profiles(shared).filter((p) => (p.sn ?? 0) === n).sort((a, b) => (b.ss ?? 0) - (a.ss ?? 0)).slice(0, 100)
    .map((p, i) => ({ rank: i + 1, uid: p.uid, n: p.n, ss: p.ss ?? 0, ar: p.ar ?? 1000, r: p.r, s: p.s, pa: p.pa ?? null }));
}

// Bot: when a season has ended and no result exists yet, freeze the standings.
export function botRolloverSeason(shared, now, effects) {
  const cur = seasonOf(now);
  if (cur.n === 0) return;
  const prev = cur.n - 1;
  if (shared.has(`season:${prev}:result`)) return;
  // 平台单值上限 8KB（实测）：百人满榜时全字段能顶穿，只存领赏要用的字段
  const top = standings(shared, prev).slice(0, 100).map((p) => ({ rank: p.rank, uid: p.uid, n: p.n, ss: p.ss, r: p.r, s: p.s }));
  setShared(effects, `season:${prev}:result`, { n: prev, t: now, top });
}

// Player: on load, settle the previous season if it rolled over. Returns a reward summary or null.
export function settleSeason(c, shared, now) {
  const cur = seasonOf(now);
  if ((c.season.n ?? 0) === cur.n) return null;
  const prevN = c.season.n ?? 0;
  const result = shared.get(`season:${prevN}:result`);
  // wait for the bot to freeze the table, but never more than a day
  if (!result && now < cur.start + DAY) return { pending: true };
  let reward = null;
  if (result) {
    const me = (result.top ?? []).find((p) => String(p.uid) === String(c.uid));
    if (me) {
      const ls = me.rank <= 10 ? 5000 - (me.rank - 1) * 300 : me.rank <= 50 ? 1500 : 500;
      c.ls += ls;
      reward = { n: prevN, rank: me.rank, ls, energy: me.rank === 1 ? 5 : me.rank <= 3 ? 3 : me.rank <= 10 ? 1 : 0 };
      if (me.rank === 1) c.title = `第${prevN + 1}季论道魁首`;
    }
  }
  c.season = { n: cur.n, ss: 0, ar: 1000 + Math.round(((c.season.ar ?? 1000) - 1000) / 2), w: 0, l: 0, sync: now };
  return reward ?? { n: prevN, rank: null, ls: 0, energy: 0 };
}
