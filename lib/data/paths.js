// 道途：筑基后选择的主修方向。副业在金丹后选择。身份（散修/宗门弟子/长老/掌门）由宗门系统决定。
export const PATHS = [
  { id: "jian", name: "剑修", icon: "🗡", desc: "一剑破万法。攻击与暴击最强，渡劫时可御剑闪避。", mods: { atk: 1.25, crit: 0.08, spd: 1.1 }, trib: { dodge: 0.15 } },
  { id: "fa", name: "法修", icon: "✨", desc: "术法通玄。灵力雄厚，五行术法伤害加成。", mods: { mp: 1.5, spell: 1.3, atk: 0.95 }, trib: { ward: 0.1 } },
  { id: "ti", name: "体修", icon: "🛡", desc: "肉身成圣。气血与防御极高，能硬抗天劫。", mods: { hp: 1.5, def: 1.4, atk: 0.9 }, trib: { tank: 0.25 } },
  { id: "dan", name: "丹修", icon: "🧪", desc: "丹道圣手。炼丹成功率大增、丹毒减半，服丹效果更好。", mods: { alch: 0.25, toxin: 0.5, pill: 1.2 } },
  { id: "zhen", name: "阵修", icon: "🔯", desc: "布阵天地。洞府聚灵阵效率更高，战前布阵削弱敌人。", mods: { rate: 1.12, array: 0.15, def: 1.1 } },
  { id: "fu", name: "符修", icon: "📜", desc: "一符千钧。符箓威力翻倍，可打断敌人神通。", mods: { talis: 2.0, interrupt: 0.3, spd: 1.05 } },
  { id: "qi", name: "器修", icon: "⚒", desc: "炼器宗师。炼器成功率与词条品质提升，法宝加成更强。", mods: { forge: 0.25, artifact: 1.25 } },
  { id: "shou", name: "驭兽师", icon: "🐾", desc: "与灵兽共生。灵兽可随你出战，成长更快。", mods: { pet: 1.5, hp: 1.1 } },
  { id: "xie", name: "邪修", icon: "🩸", desc: "魔道速成。修炼速度 +50%，但折损寿元、心魔缠身，正道修士斩你有赏。", mods: { rate: 1.5, life: 0.7, atk: 1.15, demon: true } },
];
export const SUB_PATHS = [
  { id: "shang", name: "商人", icon: "💰", desc: "坊市九折、拍卖免手续费，每日一次行商奇遇。", mods: { discount: 0.9, fee: 0, trade: true } },
  { id: "tan", name: "探险者", icon: "🧭", desc: "体力上限 +4、恢复更快，游历时多一个隐藏选项。", mods: { stamina: 4, stRegen: 1.5, hidden: true } },
  { id: "none", name: "专心修行", icon: "🧘", desc: "不务副业，修炼速度 +8%。", mods: { rate: 1.08 } },
];
export const PATH_CHOOSE_REALM = 1; // 筑基后可选道途
export const SUB_CHOOSE_REALM = 2; // 金丹后可选副业
export const RESPEC_COST = 3000; // 转修灵石

export function pathOf(id) {
  return PATHS.find((p) => p.id === id) ?? null;
}
export function subOf(id) {
  return SUB_PATHS.find((p) => p.id === id) ?? null;
}
