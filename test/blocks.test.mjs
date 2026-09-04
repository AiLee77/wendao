import { test } from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";
import { stageNeed } from "../lib/data/realms.js";

const ENUMS = { size: ["xs", "small", "medium", "large", "xl"], gap: ["xs", "small", "medium", "large", "xl"], padding: ["xs", "small", "medium", "large", "xl"], align: ["start", "center", "end", "stretch"], weight: ["regular", "medium", "bold"], variant: ["primary", "secondary", "danger", "flat"], fit: ["contain", "cover", "fill"] };
const ATTRS = { vstack: ["gap", "align", "padding", "children"], hstack: ["gap", "align", "padding", "children"], zstack: ["align", "children"], text: ["value", "size", "weight", "align"], button: ["label", "icon", "variant", "action", "disabled"], image: ["url", "width", "height", "fit", "alt"], icon: ["name", "size"], spacer: ["size"], divider: [], progress: ["value", "max"], input: ["name", "placeholder", "value"], select: ["name", "value", "options"] };

// Mirrors the platform's strictness: unknown types/attributes and out-of-enum values are errors.
function validate(node, depth = 1, stats = { nodes: 0, depth: 0 }) {
  stats.nodes++; stats.depth = Math.max(stats.depth, depth);
  assert.ok(node && typeof node === "object", "node is object");
  const allowed = ATTRS[node.type];
  assert.ok(allowed, `unknown block type ${node.type}`);
  for (const k of Object.keys(node)) {
    if (k === "type") continue;
    assert.ok(allowed.includes(k), `unknown attribute ${k} on ${node.type}`);
    if (ENUMS[k]) assert.ok(ENUMS[k].includes(node[k]), `bad enum ${k}=${node[k]} on ${node.type}`);
  }
  if (node.type === "text") assert.equal(typeof node.value, "string");
  if (node.type === "button") { assert.equal(typeof node.label, "string"); assert.equal(typeof node.action, "string"); if ("disabled" in node) assert.equal(typeof node.disabled, "boolean"); }
  if (node.type === "progress") { assert.equal(typeof node.value, "number"); assert.equal(typeof node.max, "number"); }
  for (const ch of node.children ?? []) validate(ch, depth + 1, stats);
  return stats;
}
function textOf(node) { let s = ""; (function w(n) { if (!n) return; if (n.type === "text") s += n.value + "\n"; if (n.type === "button") s += "[" + n.label + "]\n"; for (const c of n.children ?? []) w(c); })(node); return s; }
function buttons(node) { const out = []; (function w(n) { if (!n) return; if (n.type === "button") out.push(n); for (const c of n.children ?? []) w(c); })(node); return out; }
function btn(node, label) { return buttons(node).find((b) => b.label.startsWith(label)); }

test("blocks: every screen validates against the component contract", async () => {
  const site = new Site();
  let b = await site.render(null);
  validate(b); assert.match(textOf(b), /登录 NodeLoc/);
  b = await site.render(1);
  validate(b); assert.match(textOf(b), /普通人/);
  b = await site.action(1, "do:create", { name: "x" });
  validate(b); assert.match(textOf(b), /道号需/);
  b = await site.action(1, "do:create", { name: "块中仙" });
  validate(b); assert.match(textOf(b), /洞府/); assert.match(textOf(b), /逆天改命/);
  b = await site.action(1, "do:reroll");
  validate(b); assert.match(textOf(b), /天命重定/);
  b = await site.action(1, "do:breathe");
  validate(b); assert.match(textOf(b), /修为 \+/);
  for (const tab of ["explore", "bag", "market", "arena", "sect", "lb", "bio", "home"]) {
    b = await site.action(1, "tab:" + tab);
    const st = validate(b);
    assert.ok(st.nodes < 500 && st.depth < 32, `${tab}: ${st.nodes} nodes, depth ${st.depth}`);
    assert.ok(JSON.stringify(b).length < 256 * 1024);
  }
});

test("blocks: explore -> choose -> result, bag use/sell/equip, craft, shop buy", async () => {
  const site = new Site();
  await site.render(2);
  let b = await site.action(2, "do:create", { name: "块游子" });
  b = await site.action(2, "tab:explore");
  const go = btn(b, "🏘 青山村"); assert.ok(go && !go.disabled);
  b = await site.action(2, go.action);
  validate(b);
  const opt = buttons(b).find((x) => x.action.startsWith("do:choose:") && !x.disabled);
  assert.ok(opt, "option button present");
  b = await site.action(2, opt.action);
  validate(b); assert.match(textOf(b), /经过|青山村/);
  site.setChar(2, (c) => { c.inv.stack.m_tiekuang = 10; c.inv.stack.p_huixue = 2; c.ls = 2000; c.hpP = 0.5; });
  b = await site.action(2, "tab:bag");
  validate(b); assert.match(textOf(b), /回血丹/);
  b = await site.action(2, "do:use:p_huixue");
  validate(b); assert.match(textOf(b), /服下回血丹/);
  b = await site.action(2, "do:sell:m_tiekuang", { n_m_tiekuang: "3" });
  validate(b); assert.match(textOf(b), /卖出 精铁矿×3/);
  b = await site.action(2, "sub:craft");
  validate(b);
  const craft = btn(b, "精铁剑"); assert.ok(craft);
  b = await site.action(2, craft.action);
  validate(b); assert.match(textOf(b), /炉开宝现|炸裂/);
  b = await site.action(2, "sub:arts");
  validate(b);
  const eq = buttons(b).find((x) => x.action.startsWith("do:equip:"));
  if (eq) { b = await site.action(2, eq.action); validate(b); assert.match(textOf(b), /已祭炼/); }
  b = await site.action(2, "sub:skills");
  validate(b);
  b = await site.action(2, "do:arts.toggle:a_fire");
  validate(b); assert.match(textOf(b), /神通已调整/);
  b = await site.action(2, "tab:market");
  validate(b);
  const buy = buttons(b).find((x) => x.action.startsWith("do:buy:") && !x.disabled);
  if (buy) { b = await site.action(2, buy.action); validate(b); assert.match(textOf(b), /买下/); }
});

test("blocks: tribulation, path choice, arena, sect, auction via inputs", async () => {
  const site = new Site();
  await site.render(3); await site.action(3, "do:create", { name: "块渡劫" });
  await site.render(4); await site.action(4, "do:create", { name: "块对手" });
  site.setChar(3, (c) => { c.r = 0; c.s = 8; c.xp = stageNeed(0, 8); });
  let b = await site.action(3, "tab:home");
  validate(b);
  const trib = btn(b, "引动"); assert.ok(trib, "tribulation button");
  b = await site.action(3, trib.action);
  validate(b); assert.match(textOf(b), /之劫/);
  let guard = 0;
  while (guard++ < 20 && btn(b, "招架")) { b = await site.action(3, "do:trib.step:parry"); validate(b); }
  assert.match(textOf(b), /雷劫散去|倒在了雷光里/);
  site.setChar(3, (c) => { c.r = 2; c.s = 0; c.ls = 20000; c.dbf = {}; c.hpP = 1; });
  b = await site.action(3, "tab:home");
  validate(b); assert.match(textOf(b), /择道/);
  b = await site.action(3, "do:path:jian");
  validate(b); assert.match(textOf(b), /剑修/);
  // arena against 4
  b = await site.action(3, "tab:arena");
  validate(b);
  const f = buttons(b).find((x) => x.action.startsWith("do:arena.fight:"));
  assert.ok(f, "opponent listed");
  b = await site.action(3, f.action);
  validate(b); assert.match(textOf(b), /胜|败/);
  b = await site.action(3, "sub:boss");
  validate(b);
  b = await site.action(3, "do:boss.attack");
  validate(b); assert.match(textOf(b), /威能/);
  // sect
  b = await site.action(3, "tab:sect");
  validate(b);
  b = await site.action(3, "do:sect.create", { name: "块剑宗", desc: "以块为剑" });
  validate(b); assert.match(textOf(b), /块剑宗/);
  b = await site.action(3, "do:sect.donate", { amt: "500" });
  validate(b); assert.match(textOf(b), /贡献 \+50/);
  b = await site.action(4, "tab:sect");
  const join = buttons(b).find((x) => x.action.startsWith("do:sect.join:"));
  b = await site.action(4, join.action);
  validate(b); assert.match(textOf(b), /弟子/);
  // auction from bag via inputs
  site.setChar(3, (c) => { c.inv.stack.m_jiaolin = 4; });
  b = await site.action(3, "tab:bag");
  b = await site.action(3, "sub:auc_m_jiaolin");
  validate(b); assert.match(textOf(b), /上拍 蛟鳞/);
  b = await site.action(3, "do:auction.create:m_jiaolin", { n_m_jiaolin: "2", min_m_jiaolin: "50" });
  validate(b); assert.match(textOf(b), /已上拍/);
  b = await site.action(4, "tab:market");
  b = await site.action(4, "sub:auction");
  validate(b);
  const bid = buttons(b).find((x) => x.action.startsWith("do:auction.bid:"));
  assert.ok(bid);
  site.setChar(4, (c) => { c.ls = 500; });
  b = await site.action(4, bid.action, { ["amt_" + bid.action.slice("do:auction.bid:".length)]: "60" });
  validate(b); assert.match(textOf(b), /出价 60/);
});

test("blocks: death and rebirth", async () => {
  const site = new Site();
  await site.render(5); await site.action(5, "do:create", { name: "块短命" });
  site.setChar(5, (c) => { c.born = site.now - 40 * 86400000; });
  let b = await site.action(5, "tab:home");
  validate(b); assert.match(textOf(b), /坐化/);
  b = await site.action(5, "do:rebirth", { name: "块再来" });
  validate(b); assert.match(textOf(b), /块再来/);
});

test("blocks: 灵田 rows on 洞府, and the 灵兽 / 淬炼 sub-pages of 行囊", async () => {
  const site = new Site();
  await site.render(30);
  let b = await site.action(30, "do:create", { name: "块灵田" });
  site.setChar(30, (c) => {
    c.r = 1; c.ls = 50000; c.inv.stack.s_lingcao = 3; c.inv.stack.m_shuijing = 10; c.inv.stack.r_feng = 1;
    c.pet = { id: "e_linghu", name: "灵狐", elem: "火", atk: 0.3, hp: 0.3, lv: 0, xp: 0, hpP: 1, ev: 0, trip: null };
    c.ic = 1; c.inv.arts = [{ iid: 1, id: "f_shuijian", q: 1, af: [] }];
  });
  b = await site.action(30, "tab:home");
  validate(b);
  assert.match(textOf(b), /灵田 0\/3/);
  const plant = buttons(b).find((x) => x.action.startsWith("do:farm.plant:"));
  assert.ok(plant, "the first seed in the bag is offered on every empty plot");
  b = await site.action(30, plant.action);
  validate(b);
  assert.equal(site.char(30).farm.plots[0].seed, "s_lingcao");
  assert.match(textOf(b), /灵草种/);
  site.setChar(30, (c) => { c.farm.plots[0].ready = site.now - 1000; });
  b = await site.action(30, "tab:home");
  const harv = btn(b, "收获");
  assert.ok(harv, "a ripe plot offers 收获");
  b = await site.action(30, harv.action);
  validate(b);
  assert.equal(site.char(30).farm.plots[0], null);

  b = await site.action(30, "tab:bag");
  b = await site.action(30, "sub:pet");
  let st = validate(b);
  assert.match(textOf(b), /灵狐/);
  assert.ok(st.nodes < 500, `pet page: ${st.nodes} nodes`);
  // 化形按钮要说清到底卡在哪：满级但缺材料时不能再写「化形（10 级）」——
  // 玩家看到自己 20 级会以为坏了（论坛原话：「20级了还不能化形」）。
  const evoLabel = () => buttons(b).find((x) => x.action === "do:pet.evolve")?.label ?? "";
  assert.match(evoLabel(), /需 10 级/, "0 级时卡的是等级，就说等级");
  site.setChar(30, (c) => { c.pet.lv = 20; });
  b = await site.action(30, "sub:pet");
  assert.match(evoLabel(), /缺 .+×\d/, `满级缺材料时要点名缺什么，实际「${evoLabel()}」`);
  site.setChar(30, (c) => { c.inv.stack.m_yaodan = 9; c.inv.stack.m_xuanyuan = 9; });
  b = await site.action(30, "sub:pet");
  assert.equal(evoLabel(), "化形", "等级材料都够时就是干净的「化形」");
  b = await site.action(30, "do:pet.evolve");
  assert.equal(site.char(30).pet.ev, 1, "真的化形了");
  b = await site.action(30, "sub:pet");
  const send = buttons(b).find((x) => x.action.startsWith("do:pet.send:"));
  assert.ok(send, "each unlocked region offers a dispatch");
  b = await site.action(30, send.action);
  validate(b);
  assert.ok(site.char(30).pet.trip, "the beast left");
  assert.match(textOf(b), /远行中|收取/);

  b = await site.action(30, "sub:arts");
  const ref = buttons(b).find((x) => x.action === "sub:ref_1");
  assert.ok(ref, "every artifact row offers 淬炼");
  b = await site.action(30, ref.action);
  st = validate(b);
  assert.ok(st.nodes < 500, `refine page: ${st.nodes} nodes`);
  assert.match(textOf(b), /淬炼 碧水剑/);
  const rune = buttons(b).find((x) => x.action.startsWith("do:refine.rune:"));
  assert.ok(rune, "a rune in the bag can be socketed");
  b = await site.action(30, rune.action);
  validate(b);
  assert.equal(site.char(30).inv.arts[0].rn.length, 1);
  const reforge = buttons(b).find((x) => x.action === "do:refine.reforge:1/0");
  b = await site.action(30, reforge.action);
  validate(b);
  assert.equal(site.char(30).inv.arts[0].af.length, 1, "the two-part action id split into iid and slot");
});

test("blocks: 道册三子页与宗门建设", async () => {
  const site = new Site();
  await site.render(6);
  await site.action(6, "do:create", { name: "块道册" });
  let b = await site.action(6, "tab:bio");
  validate(b);
  assert.match(textOf(b), /今日悬赏/);
  // 钉住三张悬赏，把第一张做完再领
  site.setChar(6, (c) => { c.daily.bo = ["fight", "kill", "win"]; c.daily.bs = { ...c.stats }; c.stats.fights += 20; });
  b = await site.action(6, "tab:bio");
  const claim = buttons(b).find((x) => x.action === "do:bounty.claim:0");
  assert.ok(claim && !claim.disabled, "领取按钮可用");
  b = await site.action(6, claim.action);
  validate(b);
  assert.match(textOf(b), /结清/);
  b = await site.action(6, "sub:ach");
  validate(b);
  assert.match(textOf(b), /成就 /);
  assert.ok(btn(b, "不用称号"));
  b = await site.action(6, "sub:life");
  validate(b);
  assert.match(textOf(b), /年谱/);
  // 宗门建设
  site.setChar(6, (c) => { c.r = 2; c.ls = 60000; });
  await site.action(6, "tab:sect");
  await site.action(6, "do:sect.create", { name: "块顶宗", desc: "" });
  b = await site.action(6, "do:sect.donate", { amt: "5000" });
  validate(b);
  assert.match(textOf(b), /宗门建设/);
  assert.match(textOf(b), /本周宗务/);
  const build = buttons(b).find((x) => x.action === "do:sect.build:cj");
  assert.ok(build && !build.disabled, "掌门能升级藏经阁");
  b = await site.action(6, build.action);
  validate(b);
  assert.match(textOf(b), /藏经阁修至 1 级/);
  assert.equal(site.shared.get("sect:s6").bld.cj, 1);
});

test("blocks: 秘境 enters, walks a floor and banks; 棋局 shows the day's board", async () => {
  const site = new Site();
  await site.render(11);
  await site.action(11, "do:create", { name: "块秘境" });
  // c.sk is random per character and seeds the run: pin it so the doors are the same every run
  site.setChar(11, (c) => { c.r = 8; c.s = 0; c.hpP = 1; c.mpP = 1; c.sk = "blocks-dg"; });
  let b = await site.action(11, "tab:explore");
  validate(b);
  assert.ok(btn(b, "秘境"), "游历 has a 秘境 sub-nav");
  b = await site.action(11, "sub:dg");
  validate(b);
  assert.match(textOf(b), /秘境 · 今日余 2\/2 次/);
  const enter = buttons(b).find((x) => x.action.startsWith("do:dg.enter:"));
  assert.ok(enter, "difficulties offered");
  b = await site.action(11, enter.action);
  validate(b);
  assert.match(textOf(b), /第 1\/8 层/);
  // take a door and settle it — a 行商/机缘/异象 needs one more tap before you may walk out
  for (let guard = 0; guard < 4; guard++) {
    const pick = buttons(b).find((x) => x.action.startsWith("do:dg.pick:") && !x.disabled);
    if (guard === 0) assert.ok(pick, "the floor offers a door");
    if (!pick) break;
    b = await site.action(11, pick.action);
    validate(b);
    const run = site.char(11).dg;
    if (!run || !run.pend) break;
  }
  if (site.char(11).dg) { b = await site.action(11, "do:dg.leave"); validate(b); }
  assert.match(textOf(b), /收手而归|秘境通关|力竭而返/);
  assert.equal(site.char(11).dg, null);
  b = await site.action(11, "tab:arena");
  b = await site.action(11, "sub:wx");
  const st = validate(b);
  assert.match(textOf(b), /五行连珠/);
  assert.match(textOf(b), /请在正式版游玩/);
  assert.ok(st.nodes < 500 && st.depth < 32, `棋局: ${st.nodes} nodes`);
});
