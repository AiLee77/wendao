// 成就表（账号级）。达成一次记在 legacy.ach[id]=ts，永不重复发奖；转世保留。
// cond(c, legacy, shared) 只读，不得改动任何状态；抛错时视为未达成（bounty.js 内已 try/catch）。
// title 为可选称号，达成后可在道册页佩戴（ach.title）。
const ST = (k, n) => (c) => (c.stats?.[k] ?? 0) >= n; // 终身统计达标
const RL = (n) => (c) => c.r >= n; // 境界达标
export const ACH = [
  { id: "kill1", name: "初试锋芒", desc: "斩杀第一只妖兽", ls: 100, cond: ST("kills", 1) },
  { id: "kill100", name: "百妖斩", desc: "累计斩杀 100 只妖兽", ls: 800, title: "斩妖人", cond: ST("kills", 100) },
  { id: "kill1000", name: "千妖屠", desc: "累计斩杀 1000 只妖兽", ls: 6000, title: "妖族克星", cond: ST("kills", 1000) },
  { id: "exp50", name: "行万里路", desc: "游历 50 次", ls: 300, cond: ST("explores", 50) },
  { id: "exp500", name: "云游客", desc: "游历 500 次", ls: 4000, title: "云游客", cond: ST("explores", 500) },
  { id: "breath100", name: "百息", desc: "吐纳 100 次", ls: 200, cond: (c) => (c.breathN ?? 0) >= 100 },
  { id: "breath1000", name: "千息", desc: "吐纳 1000 次", ls: 3000, title: "龟息真人", cond: (c) => (c.breathN ?? 0) >= 1000 },
  { id: "craft20", name: "炉火初纯", desc: "开炉 20 次", ls: 300, cond: ST("crafts", 20) },
  { id: "craft200", name: "丹鼎大家", desc: "开炉 200 次", ls: 4000, title: "丹鼎大家", cond: ST("crafts", 200) },
  { id: "aw10", name: "论道十胜", desc: "论道胜 10 场", ls: 400, cond: ST("aw", 10) },
  { id: "aw100", name: "论道百胜", desc: "论道胜 100 场", ls: 5000, title: "道争魁首", cond: ST("aw", 100) },
  { id: "btfail10", name: "屡败屡战", desc: "突破失败 10 次仍未放弃", wu: 2, cond: ST("btFail", 10) },
  { id: "bt20", name: "二十次精进", desc: "突破成功 20 次", ls: 600, cond: ST("bt", 20) },
  // 境界成就只记名号：里程碑的能量奖励（awards.js）已经付过账了，再发灵石会双倍
  { id: "r1", name: "筑基", desc: "踏入筑基期", cond: RL(1) },
  { id: "r2", name: "金丹", desc: "结成金丹", cond: RL(2) },
  { id: "r3", name: "元婴", desc: "元婴出世", cond: RL(3) },
  { id: "r4", name: "化神", desc: "神游太虚", title: "化神真君", cond: RL(4) },
  { id: "r7", name: "大乘", desc: "修至大乘", title: "大乘尊者", cond: RL(7) },
  { id: "asc", name: "登仙", desc: "九重雷劫散尽，飞升仙界", title: "登仙者", cond: (c) => !!c.ascended },
  { id: "dead", name: "寿终正寝", desc: "寿元耗尽，坐化洞府", wu: 3, cond: (c) => !!c.dead },
  { id: "lives3", name: "三世修者", desc: "转世两次，仍在路上", ls: 1000, cond: (c, l) => (l?.lives ?? 0) >= 2 },
  { id: "trib5", name: "五度渡劫", desc: "渡劫成功 5 次", ls: 2000, cond: ST("tribs", 5) },
  { id: "pill50", name: "丹药五十", desc: "服下 50 枚丹药", ls: 400, cond: ST("pills", 50) },
  { id: "sect", name: "入宗", desc: "拜入一个宗门", ls: 200, cond: (c) => !!c.sect },
  { id: "founder", name: "开山祖师", desc: "开宗立派，自任掌门", ls: 2000, title: "开山祖师", cond: (c, l, sh) => { if (!sh) return false; for (const [k, v] of sh) if (k.startsWith("sect:") && v && String(v.leader) === String(c.uid)) return true; return false; } },
  { id: "pet10", name: "灵兽十级", desc: "把灵兽养到 10 级", ls: 800, cond: (c) => (c.pet?.lv ?? 0) >= 10 },
  { id: "boss30", name: "三十次讨伐", desc: "参与世界 BOSS 讨伐 30 次", ls: 1200, cond: ST("bossHits", 30) },
  { id: "rich", name: "富甲一方", desc: "身怀十万灵石", ls: 5000, cond: (c) => (c.ls ?? 0) >= 100000 },
  { id: "bounty7", name: "悬赏猎人", desc: "连续七日结清悬赏", ls: 2000, wu: 1, cond: (c) => (c.bountyStreak ?? 0) >= 7 },
  { id: "wu50", name: "天资聪颖", desc: "悟性达到 50", ls: 3000, cond: (c) => (c.wu ?? 0) >= 50 },
];

export function achOf(id) {
  for (const a of ACH) if (a.id === id) return a;
  return null;
}
