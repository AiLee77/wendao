export const HOUR = 3600 * 1000;
export const DAY = 24 * HOUR;
// One real day is three years of a cultivator's life.
export const YEARS_PER_DAY = 3;

export function nowOf(ctx) {
  const n = Number(ctx?.now ?? ctx?.time ?? ctx?.timestamp);
  if (Number.isFinite(n) && n > 1e12) return n;
  return Date.now();
}

export function dayKey(ts) {
  return Math.floor(ts / DAY);
}
export function weekKey(ts) {
  return Math.floor(ts / (7 * DAY));
}
