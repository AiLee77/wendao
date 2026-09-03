import { REALMS, ASCEND_REALM, isMajorStep, realmName } from "../data/realms.js";
import { PATH_CHOOSE_REALM, SUB_CHOOSE_REALM, RESPEC_COST, pathOf, subOf } from "../data/paths.js";
import { deriveStats } from "./stats.js";
import { xpNeed } from "./char.js";
import { HOUR } from "./time.js";

export const BREATH_CD = 10 * 60 * 1000;
export const BREATH_DAILY = 30;

// 吐纳：主动小爆发
export function breathe(c, now) {
  if (now - (c.breathAt ?? 0) < BREATH_CD) {
    const left = Math.ceil((BREATH_CD - (now - c.breathAt)) / 1000);
    return { ok: false, msg: `气息未平，${left} 秒后再吐纳` };
  }
  if (c.daily.breath >= BREATH_DAILY) return { ok: false, msg: "今日吐纳已足，过犹不及" };
  if (c.r >= ASCEND_REALM) return { ok: false, msg: "已登仙籍" };
  const st = deriveStats(c);
  const gain = Math.round(REALMS[c.r].rate * st.rate * 0.1);
  const need = xpNeed(c);
  c.xp = Math.min(need * 1.5, c.xp + gain);
  c.breathAt = now;
  c.daily.breath++;
  const ls = 1 + Math.floor(c.r * 1.5);
  c.ls += ls;
  c.mpP = Math.min(1, c.mpP + 0.1);
  return { ok: true, msg: `一呼一吸间，修为 +${gain}，拾得灵石 +${ls}`, gain, ls };
}

export function breakthroughChance(c, st) {
  const base = c.r === 0 ? 0.9 : Math.max(0.55, 0.82 - c.r * 0.03);
  let p = base + st.bt + (c.pillBt ?? 0);
  if (c.tox > 40) p -= 0.1;
  if (c.tox > 70) p -= 0.15;
  if (st.injured) p -= 0.15;
  if (st.heart) p -= 0.1;
  if (st.qi) p -= 0.2;
  p += 0.15 * (c.btStreak ?? 0); // 连败保底：每失败一次，下一次成功率 +15%，四连败必成
  return Math.max(0.05, Math.min(0.98, p));
}

// Minor breakthrough (no tribulation). Major steps are handled by tribulation.js.
export function breakthrough(c, now, rng) {
  if (c.r >= ASCEND_REALM) return { ok: false, msg: "已登仙籍" };
  const need = xpNeed(c);
  if (c.xp < need) return { ok: false, msg: "修为未满，不可强求" };
  if (c.trib) return { ok: false, msg: "天劫当前，先渡劫" };
  if (isMajorStep(c.r, c.s)) return { ok: false, msg: "需渡劫方可晋升大境界", major: true };
  const st = deriveStats(c);
  const p = breakthroughChance(c, st);
  c.stats.bt++;
  c.pillBt = 0;
  if (rng.chance(p)) {
    c.xp -= need;
    c.s++;
    c.hpP = 1; c.mpP = 1;
    c.btStreak = 0;
    return { ok: true, success: true, msg: `丹田一震，你踏入了${realmName(c.r, c.s)}。`, p };
  }
  c.stats.btFail++;
  c.btStreak = (c.btStreak ?? 0) + 1;
  // 旧惩罚是「掉三成修为 + 十二小时修炼减半」——一次失手赔掉大半天，八成的成功率也让人不敢点。
  // 现在压到「掉一成 + 四小时」，并把「下次 +15%」当场说给玩家听。
  c.xp = Math.max(0, c.xp - need * 0.1);
  c.dbf.qi = now + 4 * HOUR;
  c.hpP = Math.max(0.15, c.hpP - 0.25);
  const next = Math.round(Math.min(0.98, p + 0.15) * 100);
  return { ok: true, success: false, msg: `灵气逆冲，你走火入魔，修为损失一成，四小时内修炼迟滞。心境却也磨利了一分——下次成功率 ${next}%。`, p };
}

export function choosePath(c, id) {
  const p = pathOf(id);
  if (!p) return { ok: false, msg: "无此道途" };
  if (c.r < PATH_CHOOSE_REALM) return { ok: false, msg: "筑基之后方可择道" };
  if (c.path && c.path === id) return { ok: false, msg: "已在此道" };
  if (c.path) {
    if (c.r < SUB_CHOOSE_REALM) return { ok: false, msg: "金丹之后方可转修" };
    if (c.ls < RESPEC_COST) return { ok: false, msg: `转修需 ${RESPEC_COST} 灵石` };
    c.ls -= RESPEC_COST;
    c.respec = (c.respec ?? 0) + 1;
    c.xp = Math.max(0, c.xp * 0.5);
  }
  c.path = id;
  // drop arts/gongfa locked to another path
  c.eqArts = c.eqArts.filter((a) => { const art = c.arts.includes(a); return art; });
  if (c.path === "xie") c.wu = Math.max(0, c.wu - 2);
  return { ok: true, msg: `自今日起，你是一名${p.name}。` };
}
export function chooseSub(c, id) {
  const s = subOf(id);
  if (!s) return { ok: false, msg: "无此副业" };
  if (c.r < SUB_CHOOSE_REALM) return { ok: false, msg: "金丹之后方可兼修副业" };
  if (c.sub) return { ok: false, msg: "副业已定，不可更改" };
  c.sub = id;
  return { ok: true, msg: `你兼修${s.name}之道。` };
}
