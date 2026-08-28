import { OVERCOME } from "../data/roots.js";
import { ENV_RULES } from "../data/regions.js";
import { itemOf } from "../data/items.js";

export const MAX_TURNS = 30;
// 灵兽在战斗里的两份贡献：替主人挡下的伤害比例，以及自己每回合撕咬的倍率。
// 两个数一起决定「带灵兽」相对「不带」的优势，改动前请跑 tools/sim-pet.mjs。
export const PET_SHARE = 0.15;
export const PET_BITE = 0.5;

function elemMult(atkElem, defElem, env) {
  let m = 1;
  if (atkElem && defElem) {
    if (OVERCOME[atkElem] === defElem) m *= 1.3;
    else if (OVERCOME[defElem] === atkElem) m *= 0.8;
  }
  if (atkElem === "雷" && defElem && defElem !== "雷") m *= 1.1; // 雷系克妖邪
  if (atkElem === "无") m *= 1.05;
  const rules = ENV_RULES[env ?? "arena"]?.bonus ?? {};
  if (atkElem && rules[atkElem]) m *= rules[atkElem];
  return m;
}

function cloneUnit(u) {
  return {
    ...u, hp: u.hp, mp: u.mp, shield: 0, defUp: 0, defUpT: 0, defDown: 0, defDownT: 0, slow: 0, slowT: 0,
    dot: [], stun: false, petBoost: 0, pet: u.pet ? { ...u.pet } : null, tals: (u.tals ?? []).slice(),
  };
}

function chooseArt(u, foe, turn, rng) {
  const affordable = u.arts.filter((a) => a.mp <= u.mp);
  const pool = affordable.length ? affordable : [{ id: "a_slash", name: "基础剑式", mult: 1, mp: 0 }];
  const hurt = u.hp / u.maxHp < 0.35;
  const heal = pool.find((a) => a.effect?.heal);
  if (hurt && heal && rng.chance(0.7)) return heal;
  const shield = pool.find((a) => a.effect?.shield);
  if (hurt && shield && u.shield <= 0 && rng.chance(0.5)) return shield;
  // open with a setup art (debuff / buff) once, while it is not active yet
  if (turn <= 2) {
    const setup = pool.find((a) => {
      const fx = a.effect ?? {};
      if (fx.defDown && foe.defDownT <= 0) return true;
      if (fx.slow && foe.slowT <= 0) return true;
      if (fx.defUp && u.defUpT <= 0) return true;
      return false;
    });
    if (setup && rng.chance(0.7)) return setup;
  }
  const sorted = pool.filter((a) => a.mult >= 1).sort((a, b) => b.mult - a.mult);
  if (!sorted.length) return pool.filter((a) => a.mult > 0).sort((a, b) => b.mult - a.mult)[0] ?? pool[0];
  if (sorted.length > 1 && rng.chance(0.2)) return sorted[1];
  return sorted[0];
}

function dealDamage(att, def, rawMult, elem, env, rng, opts = {}) {
  const base = opts.scaleHp ? att.maxHp * 0.1 : att.atk;
  let dmg = base * rawMult;
  if (elem) dmg *= att.spell;
  dmg *= elemMult(elem, def.elem, env);
  let defense = def.def * (1 + def.defUp - def.defDown);
  if (opts.pierce) defense *= 1 - opts.pierce;
  dmg = Math.max(1, dmg - defense * 0.5);
  dmg *= 0.9 + rng.next() * 0.2;
  const crit = rng.chance(att.crit + (opts.crit ?? 0));
  if (crit) dmg *= 1.6;
  dmg = Math.round(dmg);
  let absorbed = 0;
  if (def.shield > 0) {
    absorbed = Math.min(def.shield, dmg);
    def.shield -= absorbed;
    dmg -= absorbed;
  }
  def.hp = Math.max(0, def.hp - dmg);
  return { dmg, crit, absorbed };
}

// Deterministic battle. Returns { win: bool, turns, log: [...], a: {hp,mp}, b: {hp,mp} }.
// Log entries: { t, w: "A"|"B"|"P"|"T"|"D", s: skill name, d: dmg, c: crit, e: note, ah, bh } (ah/bh = hp after).
export function battle(unitA, unitB, rng, env = "arena") {
  const A = cloneUnit(unitA);
  const B = cloneUnit(unitB);
  const log = [];
  const push = (e) => log.push({ ...e, ah: A.hp, bh: B.hp });

  // talismans fire at the start
  for (const [who, me, foe] of [["A", A, B], ["B", B, A]]) {
    for (const tid of me.tals) {
      const t = itemOf(tid);
      if (!t?.fx) continue;
      if (t.fx.dmg) {
        const r = dealDamage(me, foe, t.fx.dmg * (me.talis ?? 1), t.fx.elem, env, rng);
        if (t.fx.stun && rng.chance(t.fx.stun)) foe.stun = true;
        push({ t: 0, w: who, s: t.name, d: r.dmg, c: r.crit, e: "符" });
      } else if (t.fx.shield) {
        me.shield += Math.round(me.maxHp * t.fx.shield);
        push({ t: 0, w: who, s: t.name, e: "护盾" });
      }
    }
  }
  // 阵修：战前布阵
  if (A.array) { B.defDown += A.array; B.defDownT = 3; push({ t: 0, w: "A", s: "布阵", e: "敌防御下降" }); }
  if (B.array) { A.defDown += B.array; A.defDownT = 3; push({ t: 0, w: "B", s: "布阵", e: "敌防御下降" }); }

  let turn = 0;
  while (turn < MAX_TURNS && A.hp > 0 && B.hp > 0) {
    turn++;
    const firstA = A.arts.some((a) => a.effect?.first) && !B.arts.some((a) => a.effect?.first);
    const firstB = B.arts.some((a) => a.effect?.first) && !A.arts.some((a) => a.effect?.first);
    const spdA = A.spd * (1 - A.slow), spdB = B.spd * (1 - B.slow);
    let order;
    if (firstA) order = [["A", A, B], ["B", B, A]];
    else if (firstB) order = [["B", B, A], ["A", A, B]];
    else order = spdA >= spdB ? [["A", A, B], ["B", B, A]] : [["B", B, A], ["A", A, B]];

    for (const [who, me, foe] of order) {
      if (me.hp <= 0 || foe.hp <= 0) break;
      // dots
      for (const d of me.dot) {
        const dd = Math.round(me.maxHp * d.p);
        me.hp = Math.max(0, me.hp - dd);
        d.t--;
        push({ t: turn, w: who, s: d.n, d: dd, e: "持续伤害" });
      }
      me.dot = me.dot.filter((d) => d.t > 0);
      if (me.hp <= 0) break;
      if (me.stun) { me.stun = false; push({ t: turn, w: who, s: "僵直", e: "无法行动" }); continue; }

      const art = chooseArt(me, foe, turn, rng);
      me.mp = Math.max(0, me.mp - art.mp);
      const fx = art.effect ?? {};
      // 符修打断：敌方若准备大招则被打断
      let mult = art.mult;
      if (foe.interrupt && art.mp >= 15 && rng.chance(foe.interrupt)) {
        push({ t: turn, w: who, s: art.name, e: "被打断" });
        mult = 0.3;
      }
      let entry = { t: turn, w: who, s: art.name };
      if (mult > 0) {
        const hp0 = foe.hp;
        const r = dealDamage(me, foe, mult, art.elem ?? me.elem, env, rng, { crit: art.crit ?? 0, pierce: fx.pierce, scaleHp: art.scale === "hp" });
        entry.d = r.dmg; entry.c = r.crit;
        if (r.absorbed) entry.e = "护盾抵消";
        // 灵兽分担：灵兽替主人挡下这一击的 PET_SHARE，但只挡得动它自己剩下那点血。
        // 主人挨的是「原伤害 − 灵兽挡下的」，不是先扣满再补回来 —— 否则溢出伤害会被退还，一击必杀反成满血。
        if (foe.pet && foe.pet.hp > 0 && r.dmg > 0) {
          const s = Math.min(Math.ceil(r.dmg * PET_SHARE), foe.pet.hp); // ceil：低境界一击才 3 点伤害，四舍五入会让灵兽白站着
          foe.pet.hp -= s;
          foe.hp = Math.max(0, hp0 - (r.dmg - s));
          if (foe.pet.hp === 0) entry.e = `${foe.pet.name}倒下`;
        }
        if (fx.interrupt && rng.chance(fx.interrupt)) { foe.stun = true; entry.e = "雷音震慑"; }
        if (fx.lifesteal) { const h = Math.round(r.dmg * fx.lifesteal); me.hp = Math.min(me.maxHp, me.hp + h); entry.e = `吸血 ${h}`; }
        if (fx.selfHurt) { me.hp = Math.max(1, me.hp - Math.round(me.maxHp * fx.selfHurt)); }
        if (fx.stun && rng.chance(fx.stun)) { foe.stun = true; entry.e = "敌人僵直"; }
        if (fx.bleed) { foe.dot.push({ n: "流血", p: fx.bleed, t: fx.turns ?? 2 }); entry.e = "流血"; }
        if (fx.burn) { foe.dot.push({ n: "灼烧", p: fx.burn, t: fx.turns ?? 2 }); entry.e = "灼烧"; }
        if (fx.slow) { foe.slow = Math.max(foe.slow, fx.slow); foe.slowT = fx.turns ?? 2; entry.e = "减速"; }
        if (fx.defDown) { foe.defDown += fx.defDown; foe.defDownT = fx.turns ?? 2; entry.e = "破防"; }
      }
      if (fx.heal) { const h = Math.round(me.maxHp * fx.heal); me.hp = Math.min(me.maxHp, me.hp + h); entry.e = `回复 ${h}`; }
      if (fx.shield) { me.shield += Math.round(me.maxHp * fx.shield); entry.e = "护盾"; }
      if (fx.defUp) { me.defUp = fx.defUp; me.defUpT = fx.turns ?? 2; entry.e = "防御提升"; }
      if (fx.petBoost) { me.petBoost = fx.petBoost; entry.e = "灵兽振奋"; }
      push(entry);

      // pet attack
      if (me.pet && me.pet.hp > 0 && foe.hp > 0) {
        const petUnit = { atk: me.pet.atk * (1 + me.petBoost), maxHp: me.pet.maxHp, spell: 1, crit: 0.05 };
        const r = dealDamage(petUnit, foe, PET_BITE, me.pet.elem, env, rng);
        me.petBoost = 0;
        push({ t: turn, w: who, s: `${me.pet.name}·撕咬`, d: r.dmg, c: r.crit, e: "灵兽" });
      }
      // timers
      if (me.defUpT > 0 && --me.defUpT === 0) me.defUp = 0;
      if (me.slowT > 0 && --me.slowT === 0) me.slow = 0;
      if (me.defDownT > 0 && --me.defDownT === 0) me.defDown = 0;
      // mp regen
      me.mp = Math.min(me.maxMp, me.mp + Math.round(me.maxMp * 0.05));
    }
  }
  let win;
  if (A.hp <= 0) win = false;
  else if (B.hp <= 0) win = true;
  else win = A.hp / A.maxHp >= B.hp / B.maxHp;
  push({ t: turn, w: win ? "A" : "B", s: win ? "胜" : "败", e: turn >= MAX_TURNS ? "久战不下，以气血论胜负" : "" });
  const petHp = (u) => (u.pet && u.pet.maxHp ? u.pet.hp / u.pet.maxHp : null);
  return { win, turns: turn, log, a: { hp: A.hp, maxHp: A.maxHp, mp: A.mp, maxMp: A.maxMp, petHp: petHp(A) }, b: { hp: B.hp, maxHp: B.maxHp, mp: B.mp, maxMp: B.maxMp, petHp: petHp(B) } };
}
