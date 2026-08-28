// Every piece of art as a self-drawn SVG string, in the 夜青鎏金 V3 language: tab banners, realm
// seals, region cards, monster portraits, item icons. The webview CSP only allows img-src data:
// blob:, so these are embedded as data URIs; tools/art-render.mjs renders the same strings to PNG.
// Constraints for data-URI embedding: attributes use double quotes only (never a single quote
// anywhere in the output) and "#" appears only in colours and url(#id) references.
import { MONSTERS } from "../data/monsters.js";
import { ITEMS } from "../data/items.js";
import { REALMS } from "../data/realms.js";
import { REGIONS } from "../data/regions.js";

// ----------------------------------------------------------------- palette
const C = { bg: "#0B0F1A", ink: "#111C25", grey: "#283038", dgold: "#7D693F", gold: "#D6B36A", lgold: "#F3E2B3", cin: "#9E3F3F", blue: "#314A5E", paper: "#D8C9A7", mist: "#8a95a6" };
const SVG_FONT = "STKaiti,KaiTi,Noto Serif SC,Songti SC,SimSun,serif";
const SVG_DEF = {
  s: `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a12"/><stop offset=".55" stop-color="#0B0F1A"/><stop offset="1" stop-color="#16232f"/></linearGradient>`,
  g: `<radialGradient id="g" cx="50%" cy="0%" r="70%"><stop offset="0" stop-color="#D6B36A" stop-opacity=".16"/><stop offset="1" stop-color="#D6B36A" stop-opacity="0"/></radialGradient>`,
  sg: `<radialGradient id="sg" cx="50%" cy="45%" r="58%"><stop offset="0" stop-color="#1b2a3a"/><stop offset="1" stop-color="#070a12"/></radialGradient>`,
  glow: `<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
  soft: `<filter id="soft" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>`,
  soft2: `<filter id="soft2" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>`,
  lt: `<radialGradient id="lt" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F3E2B3" stop-opacity=".75"/><stop offset=".35" stop-color="#D6B36A" stop-opacity=".28"/><stop offset="1" stop-color="#D6B36A" stop-opacity="0"/></radialGradient>`,
  mt1: `<linearGradient id="mt1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22323f"/><stop offset="1" stop-color="#121c27"/></linearGradient>`,
  mt2: `<linearGradient id="mt2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15212c"/><stop offset="1" stop-color="#0B0F1A"/></linearGradient>`,
  mt3: `<linearGradient id="mt3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d131c"/><stop offset="1" stop-color="#06090f"/></linearGradient>`,
  orb: `<radialGradient id="orb" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#e6f3ff"/><stop offset=".4" stop-color="#6f9fd9"/><stop offset="1" stop-color="#1d3250"/></radialGradient>`,
  core: `<radialGradient id="core" cx="36%" cy="32%" r="72%"><stop offset="0" stop-color="#fff9e6"/><stop offset=".45" stop-color="#E2BE6E"/><stop offset="1" stop-color="#7D693F"/></radialGradient>`,
  fig: `<linearGradient id="fig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3544"/><stop offset="1" stop-color="#0B0F1A"/></linearGradient>`,
  halo: `<radialGradient id="halo" cx="50%" cy="60%" r="50%"><stop offset="0" stop-color="#F3E2B3" stop-opacity=".9"/><stop offset=".5" stop-color="#D6B36A" stop-opacity=".35"/><stop offset="1" stop-color="#D6B36A" stop-opacity="0"/></radialGradient>`,
  pa: `<linearGradient id="pa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9dcba"/><stop offset="1" stop-color="#c9b58e"/></linearGradient>`,
};
// Only the gradients/filters an SVG actually references — a missing filter id would blank the element.
const svgDefs = (ids) => `<defs>${ids.map((k) => SVG_DEF[k]).join("")}</defs>`;
const SVG_STARS = `<g fill="#F3E2B3"><circle cx="90" cy="40" r="1.2"/><circle cx="210" cy="22" r=".8"/><circle cx="330" cy="60" r="1"/><circle cx="470" cy="30" r=".8"/><circle cx="560" cy="70" r="1.1"/><circle cx="700" cy="18" r=".9"/><circle cx="150" cy="95" r=".7"/><circle cx="520" cy="100" r=".7"/><circle cx="40" cy="120" r=".8"/><circle cx="420" cy="12" r=".7"/><circle cx="640" cy="96" r=".6"/><circle cx="250" cy="70" r=".6"/></g>`;
// Four-layer cloud/mountain stack shared by every banner (far haze, far ridge, mid ridge, near ridge).
const SVG_CLOUDS = `<g filter="url(#soft)" opacity=".55"><ellipse cx="120" cy="118" rx="150" ry="16" fill="#2a3a4a"/><ellipse cx="430" cy="128" rx="190" ry="14" fill="#243441"/><ellipse cx="690" cy="112" rx="130" ry="15" fill="#2a3a4a"/></g>`;
const SVG_RIDGES = `<path d="M0 128 L40 114 L90 122 L150 92 L210 118 L270 104 L320 120 L380 90 L440 116 L500 100 L560 118 L620 94 L680 112 L760 96 L760 200 L0 200Z" fill="url(#mt1)"/><path d="M0 150 L60 134 L120 148 L190 120 L260 146 L330 128 L400 150 L470 124 L540 148 L610 130 L680 150 L760 126 L760 200 L0 200Z" fill="url(#mt2)"/><g filter="url(#soft2)" opacity=".7"><ellipse cx="200" cy="156" rx="170" ry="9" fill="#1b2a36"/><ellipse cx="560" cy="160" rx="200" ry="9" fill="#1b2a36"/></g><path d="M0 178 L70 166 L140 176 L220 160 L300 178 L390 164 L470 180 L560 162 L640 178 L760 160 L760 200 L0 200Z" fill="url(#mt3)"/>`;
const svgMoon = (mx, my, mr) => `<circle cx="${mx}" cy="${my}" r="${mr * 2.4}" fill="url(#lt)" opacity=".55"/><mask id="mn"><circle cx="${mx}" cy="${my}" r="${mr}" fill="#fff"/><circle cx="${(mx - mr * 0.38).toFixed(1)}" cy="${(my - mr * 0.25).toFixed(1)}" r="${(mr * 0.86).toFixed(1)}" fill="#000"/></mask><circle cx="${mx}" cy="${my}" r="${mr}" fill="#F3E2B3" mask="url(#mn)"/>`;
const svgFrame = (w, h) => `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="none" stroke="#D6B36A" stroke-opacity=".55" stroke-width="1"/><rect x="5.5" y="5.5" width="${w - 11}" height="${h - 11}" fill="none" stroke="#D6B36A" stroke-opacity=".18" stroke-width=".6"/><g stroke="#D6B36A" stroke-width="1.2" fill="none"><path d="M5 17 V5 H17 M${w - 17} 5 H${w - 5} V17 M5 ${h - 17} V${h - 5} H17 M${w - 17} ${h - 5} H${w - 5} V${h - 17}"/></g>`;

// Wide banner: stars, moon, layered ridges, a tab scene, title + subtitle at the left, gold frame.
export function svgBanner(title, subtitle, scene = "", moon = null) {
  const [mx, my, mr] = moon ?? [650, 58, 26];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="200" viewBox="0 0 760 200">${svgDefs(["s", "g", "glow", "soft", "soft2", "lt", "mt1", "mt2", "mt3"])}<rect width="760" height="200" fill="url(#s)"/><rect width="760" height="200" fill="url(#g)"/>${SVG_STARS}${svgMoon(mx, my, mr)}${SVG_CLOUDS}${SVG_RIDGES}${scene}<rect x="24" y="60" width="2" height="96" fill="#D6B36A" opacity=".55"/><text x="40" y="116" font-family="${SVG_FONT}" font-size="56" fill="#F3E2B3" letter-spacing="10">${title}</text><text x="44" y="152" font-family="${SVG_FONT}" font-size="17" fill="#D6B36A" letter-spacing="4">${subtitle}</text>${svgFrame(760, 200)}</svg>`;
}

// -------------------------------------------------------------- realm seals
// Rune ring: alternating glyph marks around the rim (12 positions).
const svgRunes = (cx, cy, r, n = 12, s = 1) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  const x = (cx + Math.cos(a) * r).toFixed(1), y = (cy + Math.sin(a) * r).toFixed(1);
  const rot = ((a * 180) / Math.PI + 90).toFixed(1);
  const k = i % 4;
  const glyph = k === 0 ? `<path d="M0 -3 L2 0 L0 3 L-2 0Z" fill="#D6B36A"/>` : k === 1 ? `<path d="M-1.4 -2.6 V2.6 M1.4 -2.6 V2.6" stroke="#D6B36A" stroke-width=".9"/>` : k === 2 ? `<circle r="1.3" fill="#F3E2B3"/>` : `<path d="M-2.4 0 H2.4 M0 -2.4 V0" stroke="#D6B36A" stroke-width=".9"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${glyph}</g>`;
}).join("");
const SEAL_SCENE = [
  // 炼气: a comet of qi motes
  `<path d="M27 52 C33 40 50 46 46 34 C43 26 52 22 57 28" fill="none" stroke="#D6B36A" stroke-width="1.4" stroke-linecap="round" opacity=".85" filter="url(#glow)"/><g fill="#F3E2B3"><circle cx="27" cy="52" r="1.6"/><circle cx="38" cy="44" r="2.4"/><circle cx="46" cy="34" r="1.9"/><circle cx="57" cy="28" r="2.8"/><circle cx="33" cy="31" r="1"/><circle cx="55" cy="50" r="1.1"/></g>`,
  // 筑基: liquid orb cupped by a gold swirl
  `<circle cx="42" cy="40" r="12" fill="url(#orb)"/><ellipse cx="38" cy="35" rx="4" ry="2.4" fill="#fff" opacity=".45"/><path d="M26 48 C30 58 54 58 58 48 C52 54 32 54 26 48Z" fill="#D6B36A" opacity=".9"/><path d="M24 46 C30 60 54 60 60 46" fill="none" stroke="#F3E2B3" stroke-width="1.2" opacity=".7"/>`,
  // 金丹: a gold core with an orbit ring
  `<circle cx="42" cy="42" r="15" fill="#D6B36A" opacity=".14"/><circle cx="42" cy="42" r="10" fill="url(#core)"/><ellipse cx="42" cy="42" rx="20" ry="6" fill="none" stroke="#F3E2B3" stroke-width="1.1" transform="rotate(-24 42 42)" opacity=".85"/><circle cx="59" cy="33.5" r="1.8" fill="#F3E2B3"/><circle cx="38" cy="38" r="2.2" fill="#fff" opacity=".55"/>`,
  // 元婴: seated figure in a flame halo
  `<path d="M42 18 C56 30 60 44 52 54 C48 59 36 59 32 54 C24 44 28 30 42 18Z" fill="url(#halo)"/><g fill="url(#fig)" stroke="#D6B36A" stroke-width=".8"><circle cx="42" cy="36" r="4.6"/><path d="M42 41 C48 41 51 45 52 50 L55 56 C50 59 34 59 29 56 L32 50 C33 45 36 41 42 41Z"/></g><path d="M30 56 C34 54 50 54 54 56" fill="none" stroke="#F3E2B3" stroke-width="1" opacity=".8"/>`,
  // 化神: standing figure, rays
  `<g stroke="#F3E2B3" stroke-width=".9" opacity=".55"><path d="M42 42 L42 14 M42 42 L62 24 M42 42 L66 42 M42 42 L62 60 M42 42 L22 60 M42 42 L18 42 M42 42 L22 24 M42 42 L30 66 M42 42 L54 66"/></g><circle cx="42" cy="42" r="17" fill="url(#halo)"/><g fill="url(#fig)" stroke="#D6B36A" stroke-width=".8"><circle cx="42" cy="30" r="4.2"/><path d="M38 35 H46 L49 48 L47 48 L47 62 H37 V48 H35 Z"/></g>`,
];
const sealScene = (i) => i <= 3 ? SEAL_SCENE[i] : SEAL_SCENE[4];
// Seal: circular gold rune ring, inner scene per realm; the ring brightens with realm tier.
export function svgSeal(i, name) {
  const t = Math.min(1, i / 8);
  const extra = i >= 5 ? `<circle cx="42" cy="42" r="${(22 + (i - 4) * 1.4).toFixed(1)}" fill="none" stroke="#F3E2B3" stroke-opacity="${(0.25 + (i - 4) * 0.12).toFixed(2)}" stroke-width="1"${i >= 7 ? ` filter="url(#glow)"` : ""}/>` : "";
  const aura = i >= 8 ? `<circle cx="42" cy="42" r="30" fill="#F3E2B3" opacity=".12" filter="url(#glow)"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84">${svgDefs(["sg", "glow"].concat(i === 1 ? ["orb"] : i === 2 ? ["core"] : i >= 3 ? ["fig", "halo"] : []))}<circle cx="42" cy="42" r="41" fill="url(#sg)"/><circle cx="42" cy="42" r="40" fill="none" stroke="#D6B36A" stroke-opacity="${(0.55 + t * 0.45).toFixed(2)}" stroke-width="${(1 + t * 0.6).toFixed(1)}"/><circle cx="42" cy="42" r="34" fill="none" stroke="#7D693F" stroke-opacity=".8" stroke-width=".6"/><circle cx="42" cy="42" r="28" fill="none" stroke="#D6B36A" stroke-opacity=".35" stroke-width=".6" stroke-dasharray="1.5 3"/>${svgRunes(42, 42, 37, 12, 0.95)}${aura}${extra}${sealScene(i)}</svg>`;
}

// ------------------------------------------------------------- region cards
const SVG_REGION_SCENE = {
  qingshan: `<path d="M0 90 L60 50 L120 80 L200 30 L280 75 L360 45 L360 120 L0 120Z" fill="#17232e"/><path d="M0 105 L70 86 L150 104 L230 80 L300 102 L360 88 L360 120 L0 120Z" fill="#0e151d"/><g transform="translate(160,56)"><path d="M-6 40 H46 V44 H-6Z" fill="#0B0F1A"/><rect x="0" y="22" width="40" height="18" fill="#0d141c" stroke="#D6B36A" stroke-opacity=".35" stroke-width=".8"/><path d="M-8 22 Q20 6 48 22 L40 22 Q20 14 0 22Z" fill="#1a2430" stroke="#D6B36A" stroke-opacity=".5" stroke-width=".8"/><rect x="16" y="28" width="8" height="12" fill="#F3E2B3" opacity=".85" filter="url(#glow)"/></g>`,
  yunmeng: `<path d="M0 95 Q90 70 180 95 T360 95 L360 120 L0 120Z" fill="#17232e"/><g filter="url(#soft2)"><ellipse cx="120" cy="62" rx="80" ry="10" fill="#8a95a6" opacity=".22"/><ellipse cx="250" cy="78" rx="100" ry="9" fill="#8a95a6" opacity=".18"/></g><path d="M0 108 Q180 98 360 110 L360 120 L0 120Z" fill="#3a5468" opacity=".5"/><path d="M30 104 Q180 96 340 106" fill="none" stroke="#F3E2B3" stroke-opacity=".35" stroke-width=".8"/>`,
  wanyao: `<path d="M0 120 L40 40 L80 120Z M70 120 L130 20 L190 120Z M180 120 L230 50 L280 120Z M270 120 L320 35 L360 120Z" fill="#141d26"/><path d="M70 120 L130 20 L190 120" fill="none" stroke="#9E3F3F" stroke-opacity=".5" stroke-width=".8"/><g fill="#c8524a" filter="url(#glow)"><circle cx="124" cy="70" r="2.2"/><circle cx="136" cy="70" r="2.2"/></g>`,
  beiming: `<path d="M0 120 L60 30 L120 120Z M100 120 L180 10 L260 120Z M240 120 L310 40 L360 120Z" fill="#1b2a3a"/><path d="M60 30 L75 60 L45 60Z M180 10 L200 45 L160 45Z M310 40 L322 62 L298 62Z" fill="#e6eef6" opacity=".85"/><path d="M300 0 L290 30 L305 28 L295 60" stroke="#bcd4ff" stroke-width="1.4" fill="none" filter="url(#glow)"/>`,
  shangjie: `<g stroke="#F3E2B3" stroke-width=".8" opacity=".5"><path d="M180 60 L180 0 M180 60 L230 12 M180 60 L130 12 M180 60 L250 50 M180 60 L110 50"/></g><circle cx="180" cy="62" r="26" fill="url(#lt)"/><path d="M150 120 L180 70 L210 120Z" fill="#111a24"/><path d="M168 96 H192 M172 104 H188 M176 112 H184" stroke="#D6B36A" stroke-width="1.4" opacity=".9"/><g fill="#F3E2B3"><circle cx="60" cy="40" r="1.6"/><circle cx="300" cy="80" r="1.2"/><circle cx="260" cy="25" r="1"/></g>`,
  jiutian: `<g stroke="#c4d6ff" stroke-opacity=".5" stroke-linecap="round"><path d="M20 34 L128 12" stroke-width="2"/><path d="M52 74 L184 44" stroke-width="1.6"/><path d="M8 104 L140 70" stroke-width="1.2"/></g><g filter="url(#soft2)"><ellipse cx="120" cy="52" rx="86" ry="11" fill="#8a95a6" opacity=".2"/><ellipse cx="268" cy="86" rx="78" ry="9" fill="#8a95a6" opacity=".16"/></g><path d="M282 6 L262 52 L286 48 L258 114" fill="none" stroke="#bcd4ff" stroke-width="2" filter="url(#glow)"/><path d="M282 6 L262 52 L286 48 L258 114" fill="none" stroke="#fff" stroke-width=".7" opacity=".8"/><path d="M196 62 C186 56 174 56 168 62 C176 62 182 65 188 70 C194 65 200 62 208 62 C202 56 190 56 196 62Z" fill="#0B0F1A" opacity=".9"/>`,
  taixu: `<g fill="#111a24" stroke="#D6B36A" stroke-opacity=".35" stroke-width=".8"><path d="M28 92 L74 78 L92 106 L44 116Z"/><path d="M212 30 L262 22 L272 52 L220 58Z"/><path d="M292 88 L336 74 L348 102 L300 112Z"/></g><g transform="translate(148 40) rotate(28)"><rect x="-3" y="0" width="6" height="52" fill="#1b2530" stroke="#D6B36A" stroke-opacity=".6" stroke-width=".8"/><path d="M-3 0 L0 -12 L3 0Z" fill="#9aa7b8" opacity=".5"/><rect x="-11" y="52" width="22" height="4" rx="1" fill="#D6B36A" opacity=".8"/><rect x="-3" y="56" width="6" height="12" rx="2" fill="#1b2530" stroke="#D6B36A" stroke-opacity=".5" stroke-width=".6"/></g><g fill="#F3E2B3"><circle cx="64" cy="30" r="1.5"/><circle cx="108" cy="58" r="1"/><circle cx="196" cy="18" r="1.2"/><circle cx="248" cy="96" r="1"/><circle cx="316" cy="40" r="1.4"/><circle cx="352" cy="62" r="1"/></g><circle cx="180" cy="60" r="34" fill="none" stroke="#D6B36A" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="14 5 4 9 20 7" filter="url(#glow)"/>`,
};
export function svgRegion(r) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120">${svgDefs(["s", "g", "glow", "soft2", "lt"])}<rect width="360" height="120" fill="url(#s)"/><rect width="360" height="120" fill="url(#g)"/>${SVG_REGION_SCENE[r.id] ?? ""}<rect x="8" y="22" width="1.5" height="30" fill="#D6B36A" opacity=".6"/><text x="16" y="45" font-family="${SVG_FONT}" font-size="25" fill="#F3E2B3" letter-spacing="3">${r.name}</text><rect x="0.5" y="0.5" width="359" height="119" fill="none" stroke="#D6B36A" stroke-opacity=".45"/></svg>`;
}

// ---------------------------------------------------------------- tab banners
const svgLantern = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 v8" stroke="#D6B36A" stroke-opacity=".6"/><circle cy="24" r="22" fill="url(#lt)"/><rect x="-5" y="8" width="10" height="3" rx="1" fill="#9E3F3F"/><ellipse cy="24" rx="10" ry="13" fill="#F3E2B3" filter="url(#glow)"/><ellipse cy="24" rx="10" ry="13" fill="none" stroke="#9E3F3F" stroke-opacity=".65"/><path d="M-6 24 H6" stroke="#9E3F3F" stroke-opacity=".4"/><rect x="-5" y="37" width="10" height="3" rx="1" fill="#9E3F3F"/><path d="M0 40 v6" stroke="#9E3F3F" stroke-opacity=".8"/></g>`;
const svgRoof = (x, y, w, h) => `<g transform="translate(${x} ${y})"><rect x="0" y="${h}" width="${w}" height="${h * 1.1}" fill="#0d141c"/><path d="M-${w * 0.12} ${h} Q${w / 2} ${-h * 0.3} ${w * 1.12} ${h} L${w} ${h} Q${w / 2} ${h * 0.25} 0 ${h}Z" fill="#1b2530" stroke="#D6B36A" stroke-opacity=".55" stroke-width="1"/><path d="M-${w * 0.12} ${h} L${-w * 0.18} ${h - 6} M${w * 1.12} ${h} L${w * 1.18} ${h - 6}" stroke="#D6B36A" stroke-width="1" stroke-opacity=".7"/></g>`;
const svgSwordsman = (x, y, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)"><circle cx="0" cy="-34" r="4.5" fill="#0B0F1A" stroke="#D6B36A" stroke-width=".6"/><path d="M-4 -29 L4 -29 L8 -10 L5 -10 L6 6 L1 6 L0 -6 L-1 6 L-7 6 L-5 -12 L-9 -14 L-16 -26 L-13 -28 L-6 -18Z" fill="#0B0F1A" stroke="#D6B36A" stroke-width=".6" stroke-opacity=".7"/><path d="M-2 -24 L-22 -40 M-6 -20 L-14 -16" stroke="#D6B36A" stroke-width="1" opacity=".6"/><path d="M6 -22 L40 -52" stroke="#F3E2B3" stroke-width="1.6" stroke-linecap="round" filter="url(#glow)"/><path d="M6 -22 L40 -52" stroke="#fff" stroke-width=".6" opacity=".8"/></g>`;
const SVG_SCENE = {
  // 洞府: a pavilion on the cliff under the moon, one lit lamp.
  home: `<g><path d="M520 200 L600 108 L680 200Z" fill="#18222c"/><path d="M540 200 L600 140 L660 200Z" fill="#0d141c"/>${svgRoof(568, 96, 64, 14)}<rect x="574" y="110" width="52" height="20" fill="#0e161f"/><rect x="593" y="116" width="10" height="14" fill="#F3E2B3" opacity=".9" filter="url(#glow)"/><circle cx="598" cy="122" r="18" fill="url(#lt)" opacity=".7"/><path d="M520 134 Q560 128 600 130" fill="none" stroke="#D6B36A" stroke-opacity=".3"/><g fill="#1a2632"><path d="M604 82 Q600 70 612 64 Q600 78 608 86Z"/></g></g>`,
  // 游历: a crane over a winding river glowing with the moon.
  explore: `<g><path d="M760 156 C700 150 660 166 600 160 C540 154 520 172 470 180 C430 186 410 200 400 200 L760 200Z" fill="#2d4455" opacity=".55"/><path d="M760 160 C700 154 660 168 600 164 C540 158 520 176 470 184 C440 188 420 200 412 200" fill="none" stroke="#F3E2B3" stroke-opacity=".45" stroke-width="1.2" filter="url(#glow)"/><g transform="translate(520 62)"><path d="M0 0 C-14 -10 -34 -12 -52 -2 C-34 -6 -18 -2 -2 6Z" fill="#F3E2B3" opacity=".95"/><path d="M0 0 C14 -12 36 -16 54 -8 C36 -8 18 -2 2 6Z" fill="#F3E2B3" opacity=".95"/><path d="M-3 4 C2 2 8 2 12 6 L30 16 L12 8 C6 6 0 8 -4 8Z" fill="#F3E2B3" opacity=".9"/><path d="M-52 -2 L-58 -6 M54 -8 L60 -12" stroke="#0B0F1A" stroke-width="1"/><circle cx="26" cy="13" r="1.4" fill="#9E3F3F"/><path d="M-2 6 L-14 22 M-6 6 L-18 20" stroke="#F3E2B3" stroke-width=".8" opacity=".8"/></g>${svgRoof(690, 112, 26, 7)}</g>`,
  // 行囊: gourd, scroll and satchel on a low table, lamp-lit.
  bag: `<g><circle cx="600" cy="140" r="54" fill="url(#lt)" opacity=".45"/><rect x="520" y="160" width="170" height="5" rx="1" fill="#1b2530" stroke="#D6B36A" stroke-opacity=".4" stroke-width=".8"/><g transform="translate(548 104)"><path d="M0 0 C-9 0 -11 10 -5 16 C-19 22 -21 52 0 52 C21 52 19 22 5 16 C11 10 9 0 0 0Z" fill="#1b2530" stroke="#D6B36A" stroke-width="1"/><rect x="-4" y="-8" width="8" height="8" rx="2" fill="#D6B36A"/><path d="M-9 34 Q0 40 9 34" fill="none" stroke="#D6B36A" stroke-opacity=".45"/></g><g transform="translate(610 132)"><rect x="-30" y="0" width="60" height="26" rx="3" fill="#e3d5ad"/><rect x="-30" y="0" width="60" height="26" rx="3" fill="none" stroke="#7D693F" stroke-width="1"/><path d="M-18 8 H18 M-18 14 H10 M-18 20 H14" stroke="#7D693F" stroke-width="1" opacity=".7"/><rect x="-34" y="-3" width="6" height="32" rx="3" fill="#7D693F"/><rect x="28" y="-3" width="6" height="32" rx="3" fill="#7D693F"/></g><g transform="translate(668 128)"><path d="M-16 10 C-16 0 16 0 16 10 C22 20 20 32 0 34 C-20 32 -22 20 -16 10Z" fill="#1b2530" stroke="#D6B36A" stroke-width="1"/><path d="M-16 10 H16" stroke="#D6B36A" stroke-width="1.4"/><path d="M-8 4 C-4 -4 4 -4 8 4" fill="none" stroke="#D6B36A"/></g></g>`,
  // 坊市: a string of lanterns over lantern-lit rooftops.
  market: `<g><path d="M360 44 Q460 66 560 60 Q660 52 760 66" fill="none" stroke="#D6B36A" stroke-opacity=".55"/>${svgLantern(410, 52, 0.8)}${svgLantern(480, 62, 0.9)}${svgLantern(552, 60, 1)}${svgLantern(626, 56, 0.9)}${svgLantern(700, 62, 0.85)}${svgRoof(430, 136, 70, 14)}${svgRoof(540, 142, 60, 12)}${svgRoof(640, 134, 82, 15)}<g fill="#F3E2B3" opacity=".8" filter="url(#glow)"><rect x="458" y="158" width="10" height="14"/><rect x="562" y="162" width="8" height="12"/><rect x="672" y="156" width="12" height="16"/></g></g>`,
  // 论道: two swordsmen on a ridge, blades crossing in light.
  arena: `<g><path d="M420 200 L480 150 L560 170 L640 146 L720 176 L760 160 L760 200Z" fill="#0d141c"/>${svgSwordsman(512, 164, false)}${svgSwordsman(640, 160, true)}<circle cx="576" cy="112" r="34" fill="url(#lt)"/><g fill="#F3E2B3"><circle cx="552" cy="96" r="1.3"/><circle cx="596" cy="90" r="1"/><circle cx="576" cy="124" r="1"/></g></g>`,
  // 宗门: the mountain gate with banners, temple lit behind.
  sect: `<g><path d="M470 200 L560 128 L650 200Z" fill="#18222c"/>${svgRoof(536, 100, 50, 12)}<rect x="544" y="112" width="34" height="18" fill="#0e161f"/><rect x="556" y="118" width="10" height="12" fill="#F3E2B3" opacity=".9" filter="url(#glow)"/><circle cx="561" cy="124" r="20" fill="url(#lt)" opacity=".7"/><g transform="translate(486 140)"><rect x="0" y="0" width="10" height="60" fill="#1b2530" stroke="#D6B36A" stroke-opacity=".5" stroke-width=".8"/><rect x="130" y="0" width="10" height="60" fill="#1b2530" stroke="#D6B36A" stroke-opacity=".5" stroke-width=".8"/><rect x="-6" y="-12" width="152" height="14" fill="#0e161f" stroke="#D6B36A" stroke-opacity=".6" stroke-width="1"/><path d="M-16 -12 Q70 -36 156 -12" fill="none" stroke="#D6B36A" stroke-width="1.4"/><rect x="50" y="-10" width="40" height="10" fill="#9E3F3F" opacity=".8"/><path d="M58 -5 H66 M74 -5 H82" stroke="#F3E2B3" stroke-width="1.2"/></g><g><rect x="470" y="92" width="1.2" height="62" fill="#D6B36A"/><path d="M471 96 H488 L484 124 L488 136 H471Z" fill="#9E3F3F" opacity=".9"/><rect x="640" y="92" width="1.2" height="62" fill="#D6B36A"/><path d="M641 96 H658 L654 124 L658 136 H641Z" fill="#314A5E"/><path d="M476 102 V128 M646 102 V128" stroke="#F3E2B3" stroke-width="1" opacity=".5"/></g></g>`,
  // 榜单: a golden gate at the head of the stairs, light pouring through.
  lb: `<g><circle cx="580" cy="84" r="60" fill="url(#lt)"/><g fill="#1b2530" stroke="#D6B36A" stroke-width="1"><path d="M546 118 V66 Q580 36 614 66 V118Z"/></g><path d="M552 118 V68 Q580 44 608 68 V118Z" fill="#F3E2B3" opacity=".55" filter="url(#glow)"/><circle cx="580" cy="44" r="5" fill="#F3E2B3" filter="url(#glow)"/><g fill="#1a2632" stroke="#D6B36A" stroke-opacity=".5" stroke-width=".8"><rect x="530" y="118" width="100" height="10"/><rect x="514" y="128" width="132" height="10"/><rect x="498" y="138" width="164" height="10"/><rect x="482" y="148" width="196" height="10"/><rect x="466" y="158" width="228" height="10"/><rect x="450" y="168" width="260" height="10"/><rect x="434" y="178" width="292" height="10"/></g><path d="M580 118 L560 200 M580 118 L600 200" stroke="#F3E2B3" stroke-opacity=".25"/></g>`,
  // 传记: bamboo slips unrolled beside a brush.
  bio: `<g><circle cx="580" cy="110" r="58" fill="url(#lt)" opacity=".4"/><g stroke="#7D693F" stroke-width=".6">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${496 + i * 14}" y="${60 + (i % 2) * 3}" width="11" height="94" rx="3" fill="${i % 2 ? "#5a4a2c" : "#6b5834"}"/>`).join("")}</g><g stroke="#1b1308" stroke-width="1.4" stroke-linecap="round" opacity=".7"><path d="M502 90 v10 M502 106 v7 M516 92 v8 M530 90 v13 M544 94 v9 M558 90 v11 M558 108 v8 M572 92 v10 M586 90 v12 M600 94 v8 M614 92 v9"/></g><path d="M490 80 h136 M490 136 h136" stroke="#D6B36A" stroke-width="1.4" stroke-opacity=".7"/><g transform="translate(652 100) rotate(24)"><rect x="-4" y="-54" width="8" height="80" rx="3" fill="#1b2530" stroke="#D6B36A" stroke-width="1"/><rect x="-5.5" y="26" width="11" height="9" rx="2" fill="#D6B36A"/><path d="M-5 35 Q0 60 5 35Z" fill="#e6eef6" opacity=".9"/><circle cy="-56" r="2.4" fill="#D6B36A"/></g></g>`,
  // 问道: a cultivator meditating on the peak under the moon.
  guest: `<g><path d="M500 200 L580 120 L660 200Z" fill="#0d141c"/><circle cx="580" cy="112" r="26" fill="url(#lt)"/><g fill="#0B0F1A" stroke="#D6B36A" stroke-width=".7"><circle cx="580" cy="104" r="5"/><path d="M580 110 C586 110 589 114 590 119 L593 126 C587 129 573 129 567 126 L570 119 C571 114 574 110 580 110Z"/></g></g>`,
};
const SVG_TABS = [
  ["home", "洞府", "闭关 · 吐纳 · 突破", [696, 46, 22]],
  ["explore", "游历", "山高水长 · 一步一景", [670, 40, 20]],
  ["bag", "行囊", "储物 · 丹药 · 法宝", [400, 44, 16]],
  ["market", "坊市", "以物易物 · 明码标价", [364, 30, 14]],
  ["arena", "论道", "以武证道 · 点到为止", [700, 40, 18]],
  ["sect", "宗门", "同门 · 传承 · 山门", [700, 46, 20]],
  ["lb", "榜单", "天榜有名 · 万古留声", [700, 40, 16]],
  ["bio", "道册", "悬赏 · 成就 · 此生行状", [716, 44, 18]],
];

// ------------------------------------------------------------- monster badges
const SVG_ELEM_COLOR = { 金: "#e6eef6", 木: "#7cc39a", 水: "#7ba7e0", 火: "#f08d76", 土: "#D6B36A", 雷: "#c4d6ff" };
const BODY = "url(#fig)";
// Silhouette motifs, drawn inside a circle of radius ~46 around (64,64). c = element colour.
const SVG_MOTIF = {
  beast: (c) => `<path d="M40 40 L48 62 L34 58 Z M88 40 L80 62 L94 58 Z" fill="${c}" opacity=".85"/><path d="M64 100 L38 60 L52 46 L76 46 L90 60 Z" fill="${BODY}" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/><path d="M52 46 L64 56 L76 46" fill="none" stroke="${c}" stroke-width="1" opacity=".5"/><circle cx="54" cy="66" r="3.2" fill="#F3E2B3"/><circle cx="74" cy="66" r="3.2" fill="#F3E2B3"/><path d="M56 78 L59 88 L62 78 M66 78 L69 88 L72 78" fill="none" stroke="#e6eef6" stroke-width="2" opacity=".9"/>`,
  bird: (c) => `<path d="M62 64 C49 40 32 34 22 44 C35 52 42 64 49 82 Z" fill="${c}" opacity=".8"/><path d="M66 64 C79 40 96 34 106 44 C93 52 86 64 79 82 Z" fill="${c}" opacity=".8"/><path d="M62 64 C49 40 32 34 22 44" fill="none" stroke="#F3E2B3" stroke-width="1" opacity=".6"/><path d="M66 64 C79 40 96 34 106 44" fill="none" stroke="#F3E2B3" stroke-width="1" opacity=".6"/><path d="M64 34 L70 62 L64 94 L58 62 Z" fill="${BODY}" stroke="${c}" stroke-width="2"/><circle cx="64" cy="44" r="2.4" fill="#F3E2B3"/>`,
  serpent: (c) => `<path d="M38 96 C38 74 88 72 88 54 C88 40 70 34 58 44" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" opacity=".95"/><path d="M38 96 C38 74 88 72 88 54 C88 40 70 34 58 44" fill="none" stroke="#0B0F1A" stroke-width="2.6" stroke-linecap="round" opacity=".5"/><path d="M40 92 C42 76 84 74 86 56" fill="none" stroke="#F3E2B3" stroke-width="1" opacity=".5" stroke-dasharray="3 4"/><circle cx="55" cy="46" r="7.5" fill="${BODY}" stroke="${c}" stroke-width="2"/><circle cx="53" cy="44" r="2" fill="#F3E2B3"/><path d="M48 50 L38 56 M48 50 L40 46" fill="none" stroke="#9E3F3F" stroke-width="1.6"/><path d="M56 38 L60 30 M52 38 L46 32" stroke="${c}" stroke-width="1.6"/>`,
  tree: (c) => `<path d="M58 98 h12 v-26 h-12 Z" fill="#5a4a2c" stroke="${c}" stroke-width="1"/><circle cx="64" cy="54" r="26" fill="${BODY}" stroke="${c}" stroke-width="2.4"/><path d="M64 82 V50 M64 62 L50 52 M64 68 L78 56 M64 54 L54 42 M64 50 L76 40" fill="none" stroke="${c}" stroke-width="1.8" opacity=".85"/><circle cx="54" cy="48" r="2.2" fill="#9E3F3F"/><circle cx="74" cy="48" r="2.2" fill="#9E3F3F"/>`,
  human: (c) => `<path d="M64 30 C53 30 46 39 46 49 C46 56 48 61 52 64 L43 69 C34 74 29 84 29 98 L99 98 C99 84 94 74 85 69 L76 64 C80 61 82 56 82 49 C82 39 75 30 64 30 Z" fill="${BODY}" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/><path d="M51 46 C56 55 72 55 77 46" fill="none" stroke="${c}" stroke-width="1.6" opacity=".6"/><circle cx="57" cy="49" r="2.6" fill="#F3E2B3"/><circle cx="71" cy="49" r="2.6" fill="#F3E2B3"/><path d="M52 71 L64 84 L76 71 M48 92 h32" stroke="#D6B36A" stroke-width="1.6" opacity=".6" fill="none" stroke-linejoin="round"/>`,
  ghost: (c) => `<circle cx="64" cy="58" r="25" fill="${c}" opacity=".14"/><path d="M64 26 C47 26 39 43 41 62 C42 74 47 82 45 96 C51 91 56 93 59 99 C62 92 67 92 70 99 C74 93 79 91 85 96 C82 82 87 74 88 62 C90 43 81 26 64 26 Z" fill="${BODY}" stroke="${c}" stroke-width="2" filter="url(#glow)"/><circle cx="56" cy="54" r="3" fill="${c}"/><circle cx="72" cy="54" r="3" fill="${c}"/><path d="M57 70 Q64 77 71 70" fill="none" stroke="${c}" stroke-width="1.8" opacity=".7"/>`,
  spider: (c) => `<g stroke="${c}" stroke-width="2.2" fill="none" opacity=".9"><path d="M50 62 L28 46 L20 54 M50 68 L26 66 L18 74 M50 74 L28 88 L22 96 M78 62 L100 46 L108 54 M78 68 L102 66 L110 74 M78 74 L100 88 L106 96"/></g><ellipse cx="64" cy="72" rx="18" ry="20" fill="${BODY}" stroke="${c}" stroke-width="2.2"/><path d="M56 64 L64 78 L72 64" fill="none" stroke="${c}" stroke-width="1" opacity=".6"/><circle cx="64" cy="48" r="10" fill="${BODY}" stroke="${c}" stroke-width="2"/><circle cx="60" cy="46" r="2.2" fill="#F3E2B3"/><circle cx="68" cy="46" r="2.2" fill="#F3E2B3"/>`,
  turtle: (c) => `<path d="M26 94 A38 32 0 0 1 102 94 Z" fill="${BODY}" stroke="${c}" stroke-width="2.4"/><path d="M64 52 l11 7 v13 l-11 7 l-11 -7 v-13 Z M40 76 l9 5 v9 M88 76 l-9 5 v9" fill="none" stroke="${c}" stroke-width="1.8" opacity=".9"/><circle cx="99" cy="82" r="7.5" fill="${BODY}" stroke="${c}" stroke-width="2"/><circle cx="101" cy="80" r="1.8" fill="#F3E2B3"/><path d="M30 94 v6 M50 94 v6 M78 94 v6" stroke="${c}" stroke-width="2.6" opacity=".8"/>`,
  fish: (c) => `<path d="M28 64 C42 44 78 44 92 64 C78 84 42 84 28 64 Z" fill="${BODY}" stroke="${c}" stroke-width="2.2"/><path d="M92 64 L108 50 L104 64 L108 80 Z" fill="${c}" opacity=".85"/><path d="M56 46 L62 36 L70 48" fill="none" stroke="${c}" stroke-width="2" opacity=".85"/><circle cx="46" cy="61" r="3" fill="#F3E2B3"/><path d="M60 56 Q68 64 60 72 M70 54 Q78 64 70 74" fill="none" stroke="${c}" stroke-width="1.4" opacity=".6"/>`,
  toad: (c) => `<path d="M26 94 C26 68 44 54 64 54 C84 54 102 68 102 94 Z" fill="${BODY}" stroke="${c}" stroke-width="2.2"/><circle cx="48" cy="50" r="9" fill="${BODY}" stroke="${c}" stroke-width="2"/><circle cx="80" cy="50" r="9" fill="${BODY}" stroke="${c}" stroke-width="2"/><circle cx="48" cy="50" r="3" fill="#F3E2B3"/><circle cx="80" cy="50" r="3" fill="#F3E2B3"/><path d="M50 76 Q64 86 78 76" fill="none" stroke="${c}" stroke-width="2" opacity=".85"/><circle cx="40" cy="82" r="2.4" fill="${c}" opacity=".6"/><circle cx="88" cy="82" r="2.4" fill="${c}" opacity=".6"/>`,
  eye: (c) => `<path d="M22 62 C42 36 86 36 106 62 C86 88 42 88 22 62 Z" fill="${BODY}" stroke="${c}" stroke-width="2.4"/><circle cx="64" cy="62" r="12" fill="${c}" opacity=".9"/><circle cx="64" cy="62" r="4.5" fill="#0B0F1A"/><circle cx="60" cy="57" r="2" fill="#fff" opacity=".7"/><path d="M64 26 v8 M34 40 l6 6 M94 40 l-6 6 M64 90 v8" fill="none" stroke="${c}" stroke-width="2" opacity=".6"/>`,
};
const SVG_MOTIF_RULES = [
  [/虚空|👁/, "eye"],
  [/龟|玄武|🐢/, "turtle"],
  [/蛟|龙|蟒|蛇|🐉|🐍/, "serpent"],
  [/鸟|鹰|雕|鹤|🦅/, "bird"],
  [/树|藤|🌳/, "tree"],
  [/蟾|蛙|🐸/, "toad"],
  [/鱼|鲛|🐟/, "fish"],
  [/蛛|🕷/, "spider"],
  [/狼|猪|鼠|貂|猿|狐|虎|豹|熊|犬|狮|🐺|🐗|🐭|🦡|🦍|🦊/, "beast"],
  [/贼|修|道|兵|仙|老|人|尸|将|士|🧙/, "human"],
  [/鬼|魂|魄|煞|灵|妖|雾|魔|念|精|👻|🌀|🌫|❄|✨|😈/, "ghost"],
];
function svgMotifOf(m) {
  const key = m.name + (m.icon ?? "");
  for (const [re, name] of SVG_MOTIF_RULES) if (re.test(key)) return name;
  return "eye";
}
// Circular portrait: dark vignette inside a gold rune ring; tier dots along the bottom arc.
export function svgMon(m) {
  const c = SVG_ELEM_COLOR[m.elem] ?? C.mist;
  const motif = svgMotifOf(m);
  const dots = Array.from({ length: (m.t | 0) + 1 }, (_, i) => `<circle cx="${(64 + (i - m.t / 2) * 9).toFixed(1)}" cy="113" r="2.2" fill="#F3E2B3"/>`).join("");
  const ring = m.boss
    ? `<circle cx="64" cy="64" r="60" fill="none" stroke="#F3E2B3" stroke-width="1.2" opacity=".9" filter="url(#glow)"/><circle cx="64" cy="64" r="56" fill="none" stroke="#D6B36A" stroke-width="1.6"/>${svgRunes(64, 64, 58, 16, 0.9)}`
    : `<circle cx="64" cy="64" r="58" fill="none" stroke="#D6B36A" stroke-width="1.5" opacity=".9"/><circle cx="64" cy="64" r="54" fill="none" stroke="#7D693F" stroke-width=".6" opacity=".8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${svgDefs(["sg", "glow", "fig"])}<circle cx="64" cy="64" r="62" fill="url(#sg)"/><circle cx="64" cy="70" r="40" fill="${c}" opacity=".08"/><ellipse cx="64" cy="98" rx="34" ry="5" fill="${c}" opacity=".18"/>${ring}${SVG_MOTIF[motif](c)}${dots}</svg>`;
}

// ----------------------------------------------------------------- item icons
const SVG_TIER_COLOR = ["#8d98a8", "#9fb96a", "#6aa6c4", "#a88fd6", "#D6B36A", "#e08a5a"];
const LIQ = ["#9E3F3F", "#4f86c6", "#D6B36A", "#5fa37a", "#a88fd6"];
const svgHash = (s) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
// Motifs are drawn inside roughly x 14..82, y 16..86 of the 96px tile. c = tier colour.
const SVG_ICON = {
  leaf: (c) => `<path d="M48 84 C24 68 24 34 48 16 C72 34 72 68 48 84 Z" fill="#3d6b48" opacity=".55" stroke="#7cc39a" stroke-width="2"/><path d="M48 82 V22" stroke="#bfe6c8" stroke-width="1.6" opacity=".8"/><path d="M48 62 L34 52 M48 48 L62 36 M48 72 L60 62 M48 38 L36 30" fill="none" stroke="#bfe6c8" stroke-width="1.2" opacity=".6"/><circle cx="41" cy="36" r="2" fill="#fff" opacity=".35"/>`,
  ore: (c) => `<path d="M16 72 L24 44 L44 32 L62 40 L74 62 L62 80 L28 80 Z" fill="#3b4656" stroke="#9aa7b8" stroke-width="2" stroke-linejoin="round"/><path d="M24 44 L44 54 L74 62 M44 54 V80 M44 54 L62 40" fill="none" stroke="#cfd8e4" stroke-width="1.4" opacity=".6"/><path d="M30 60 L40 56 L42 66Z" fill="#fff" opacity=".2"/><path d="M68 20 l3.2 7.8 7.8 3.2 -7.8 3.2 -3.2 7.8 -3.2 -7.8 -7.8 -3.2 7.8 -3.2 Z" fill="#F3E2B3" opacity=".8"/>`,
  crystal: (c) => `<path d="M48 12 L72 44 L57 84 L39 84 L24 44 Z" fill="${c}" fill-opacity=".35" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/><path d="M48 12 V84 M24 44 L48 54 L72 44" fill="none" stroke="#fff" stroke-width="1.2" opacity=".5"/><path d="M40 30 L44 24" stroke="#fff" stroke-width="2" opacity=".5"/>`,
  drop: (c) => `<path d="M48 14 C68 44 74 56 74 64 A26 26 0 0 1 22 64 C22 56 28 44 48 14 Z" fill="#9E3F3F" opacity=".85" stroke="#d77a6a" stroke-width="1.8"/><ellipse cx="38" cy="62" rx="6" ry="9" fill="#fff" opacity=".3" transform="rotate(-20 38 62)"/>`,
  // The liquid colour and shoulder marks vary by item id so two pills of the same tier never render identically.
  pill: (c, it) => { const hsh = svgHash(it?.id ?? ""); const l = LIQ[hsh % LIQ.length]; return `<path d="M40 28 C40 22 44 18 48 18 C52 18 56 22 56 28 C56 32 54 35 52 37 C64 43 69 55 69 66 C69 78 60 85 48 85 C36 85 27 78 27 66 C27 55 32 43 44 37 C42 35 40 32 40 28 Z" fill="#121c28" stroke="#D6B36A" stroke-width="1.8"/><path d="M31 58 C31 52 36 46 42 44 C56 44 66 52 66 66 C66 76 58 82 48 82 C38 82 31 76 31 66Z" fill="${l}" opacity=".9"/><path d="M34 62 Q48 56 64 62" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35"/><circle cx="40" cy="66" r="4.4" fill="#fff" opacity=".3"/><rect x="41" y="10" width="14" height="8" rx="2" fill="#D6B36A"/><path d="M41 12 H55" stroke="#F3E2B3" stroke-width="1"/><g fill="#F3E2B3" opacity=".8">${[[[48, 40]], [[42, 41], [54, 41]], [[42, 41], [48, 38], [54, 41]]][hsh % 3].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join("")}</g>`; },
  sword: (c) => `<path d="M48 10 L55 24 L55 56 L41 56 L41 24 Z" fill="#cfd8e4" stroke="#e6eef6" stroke-width="1.2"/><path d="M48 14 V56" stroke="#8a95a6" stroke-width="1.4" opacity=".7"/><path d="M41 24 L48 14 L48 56 L41 56Z" fill="#9aa7b8" opacity=".5"/><rect x="29" y="56" width="38" height="7" rx="3" fill="#D6B36A"/><rect x="43" y="63" width="10" height="16" rx="2" fill="#2a2115" stroke="#D6B36A" stroke-width="1.4"/><circle cx="48" cy="83" r="4.5" fill="#D6B36A"/><path d="M33 58 H63" stroke="#F3E2B3" stroke-width="1" opacity=".7"/>`,
  robe: (c) => `<path d="M34 24 L48 31 L62 24 L76 33 L69 46 L64 41 L64 82 L32 82 L32 41 L27 46 L20 33 Z" fill="#314A5E" stroke="#7ba7e0" stroke-width="1.8" stroke-linejoin="round"/><path d="M48 31 V82" stroke="#D6B36A" stroke-width="1.4" opacity=".8"/><path d="M48 31 L40 46 L48 60 L56 46Z" fill="#1d2f3f" opacity=".8"/><path d="M33 60 h30" stroke="#D6B36A" stroke-width="2.4" opacity=".8"/>`,
  orb: (c) => `<circle cx="48" cy="52" r="24" fill="none" stroke="#D6B36A" stroke-width="4"/><circle cx="48" cy="52" r="15" fill="${c}" opacity=".3"/><circle cx="40" cy="44" r="4.5" fill="#fff" opacity=".4"/><path d="M48 22 l5 8 h-10 Z" fill="#F3E2B3"/><circle cx="48" cy="52" r="30" fill="none" stroke="#D6B36A" stroke-opacity=".35" stroke-dasharray="3 5"/>`,
  fan: (c) => `<path d="M48 80 L15 61 A38 38 0 0 1 81 61 Z" fill="#d8c9a7" opacity=".85" stroke="#D6B36A" stroke-width="1.8" stroke-linejoin="round"/><g stroke="#7D693F" stroke-width="1.3" opacity=".7"><path d="M48 80 L26 46 M48 80 L48 42 M48 80 L70 46 M48 80 L36 43 M48 80 L60 43"/></g><circle cx="48" cy="80" r="4" fill="#D6B36A"/>`,
  tal: (c) => `<rect x="30" y="12" width="36" height="72" rx="3" fill="#e3d5ad"/><rect x="30" y="12" width="36" height="72" rx="3" fill="none" stroke="#D6B36A" stroke-width="1.6"/><g fill="#9E3F3F"><circle cx="41" cy="24" r="2.2"/><circle cx="48" cy="21" r="2.2"/><circle cx="55" cy="24" r="2.2"/></g><g stroke="#9E3F3F" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M48 32 v34"/><path d="M39 40 c6 5 11 -4 17 1"/><path d="M39 53 c6 5 11 -4 17 1"/><path d="M48 66 c0 7 -7 9 -11 4"/></g><rect x="52" y="70" width="10" height="10" fill="#9E3F3F" opacity=".9"/>`,
  egg: (c) => `<ellipse cx="48" cy="54" rx="24" ry="30" fill="#1b2735" stroke="${c}" stroke-width="2.2"/><path d="M27 50 L38 44 L34 56 L47 49 L43 62 L57 54 L52 67 L67 60" fill="none" stroke="${c}" stroke-width="2" opacity=".9"/><ellipse cx="40" cy="38" rx="5" ry="7" fill="#fff" opacity=".14"/><circle cx="58" cy="74" r="2" fill="${c}" opacity=".6"/>`,
  book: (c) => `<rect x="22" y="20" width="52" height="60" rx="4" fill="#2a2115" stroke="#D6B36A" stroke-width="1.8"/><path d="M31 20 V80" stroke="#D6B36A" stroke-width="1.4" opacity=".7"/><g stroke="#F3E2B3" stroke-width="1.4" opacity=".6"><path d="M39 34 h28 M39 44 h22 M39 54 h28 M39 64 h16"/></g><path d="M22 50 h52" stroke="#D6B36A" stroke-width="2.2" opacity=".8"/>`,
  pouch: (c) => `<path d="M27 44 C27 33 69 33 69 44 C75 57 74 80 48 82 C22 80 21 57 27 44 Z" fill="#5a4a2c" stroke="#D6B36A" stroke-width="1.8"/><path d="M27 44 h42" stroke="#D6B36A" stroke-width="2.4"/><path d="M36 36 c4 -9 20 -9 24 0" fill="none" stroke="#D6B36A" stroke-width="1.8"/><circle cx="48" cy="62" r="7" fill="#F3E2B3" opacity=".35"/>`,
  array: (c) => `<circle cx="48" cy="52" r="28" fill="none" stroke="#D6B36A" stroke-width="2.2"/><circle cx="48" cy="52" r="18" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="1.4"/><path d="M48 24 V80 M20 52 H76 M28 32 L68 72 M68 32 L28 72" stroke="#D6B36A" stroke-width="1.1" opacity=".5"/><circle cx="48" cy="52" r="5" fill="#F3E2B3" opacity=".9"/>`,
  gem: (c) => `<path d="M30 40 L48 24 L66 40 L48 80 Z" fill="#9E3F3F" stroke="#d77a6a" stroke-width="1.6" stroke-linejoin="round"/><path d="M30 40 H66 M48 24 L40 40 L48 80 M48 24 L56 40 L48 80" fill="none" stroke="#fff" stroke-width="1" opacity=".4"/>`,
  horn: (c) => `<path d="M30 80 C30 56 40 30 66 18 C58 38 56 56 54 80 Z" fill="#d8c9a7" stroke="#D6B36A" stroke-width="1.6"/><path d="M36 70 C40 52 48 36 60 26" fill="none" stroke="#7D693F" stroke-width="1" opacity=".6"/><path d="M30 80 H54" stroke="#7D693F" stroke-width="2"/>`,
  nugget: (c) => `<path d="M22 66 L34 46 L50 40 L66 48 L74 64 L62 78 L34 78 Z" fill="#D6B36A" stroke="#F3E2B3" stroke-width="1.4" stroke-linejoin="round"/><path d="M34 46 L46 56 L66 48 M46 56 L40 78 M46 56 L62 78" fill="none" stroke="#7D693F" stroke-width="1.2" opacity=".7"/><path d="M38 52 L44 48" stroke="#fff" stroke-width="2" opacity=".5"/>`,
};
function svgIconOf(it) {
  const n = it.name;
  if (it.k === "mat") {
    if (/草|花|莲|叶|木/.test(n)) return "leaf";
    if (/矿|铁|钢|锭/.test(n)) return "ore";
    if (/金|砂/.test(n)) return "nugget";
    if (/晶|石|冰|魄|玉/.test(n)) return "crystal";
    if (/血|露/.test(n)) return "drop";
    if (/角|牙|骨/.test(n)) return "horn";
    if (/珠|丹/.test(n)) return "gem";
    if (/皮|鳞/.test(n)) return "pouch";
    return "crystal";
  }
  if (it.k === "pill") return "pill";
  if (it.k === "art") {
    if (/剑|刀|枪|戟/.test(n)) return "sword";
    if (/袍|甲|衣|裳/.test(n)) return "robe";
    if (/扇/.test(n)) return "fan";
    if (/珠|环|佩|镜|盘|鼎|链|印|符牌/.test(n)) return "orb";
    return it.slot === "w" ? "sword" : it.slot === "a" ? "robe" : "orb";
  }
  if (it.k === "tal") return "tal";
  if (it.k === "egg") return "egg";
  if (it.k === "book") return "book";
  if (/简/.test(n)) return "book";
  if (/盘|阵/.test(n)) return "array";
  return "pouch";
}
// Square tile: dark gradient, 1px gold border, tier-tinted hairline, tier glyph dots.
export function svgItem(it) {
  const t = it.t | 0;
  const c = SVG_TIER_COLOR[t] ?? C.mist;
  const glow = t >= 4 ? ` filter="url(#glow)"` : "";
  const dots = t > 0 ? `<g fill="${c}">${Array.from({ length: Math.min(5, t) }, (_, i) => `<circle cx="${(78 - i * 6).toFixed(1)}" cy="12" r="1.6"/>`).join("")}</g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${svgDefs(t >= 4 ? ["sg", "glow"] : ["sg"])}<rect width="96" height="96" rx="10" fill="url(#sg)"/><rect x="1.5" y="1.5" width="93" height="93" rx="9" fill="none" stroke="#D6B36A" stroke-width="1" opacity=".9"${glow}/><rect x="5.5" y="5.5" width="85" height="85" rx="6" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width=".7"/><path d="M5 13 V5 H13 M83 5 H91 V13 M5 83 V91 H13 M83 91 H91 V83" fill="none" stroke="${c}" stroke-width="1" opacity=".8"/>${dots}${SVG_ICON[svgIconOf(it)](c, it)}</svg>`;
}

// Every art key the surface can ask for, in render order.
export const SVG_KEYS = [
  "banner_guest",
  "banner_create",
  ...SVG_TABS.map(([k]) => "banner_" + k),
  ...REALMS.slice(0, 10).map((r) => "seal_" + r.id),
  ...REGIONS.map((r) => "region_" + r.id),
  ...MONSTERS.map((m) => "mon_" + m.id),
  ...ITEMS.map((it) => "item_" + it.id),
];
// key -> SVG string. Built on demand; the surface embeds these as data URIs.
export function svgAssets() {
  const out = {
    banner_guest: svgBanner("问道", "今日踏仙路，一念问长生", SVG_SCENE.guest, [690, 44, 22]),
    banner_create: svgBanner("问道", "踏上仙路", SVG_SCENE.guest, [690, 44, 22]),
  };
  for (const [k, title, sub, moon] of SVG_TABS) out["banner_" + k] = svgBanner(title, sub, SVG_SCENE[k], moon);
  for (const r of REALMS.slice(0, 10)) out["seal_" + r.id] = svgSeal(r.id, r.name);
  for (const r of REGIONS) out["region_" + r.id] = svgRegion(r);
  for (const m of MONSTERS) out["mon_" + m.id] = svgMon(m);
  for (const it of ITEMS) out["item_" + it.id] = svgItem(it);
  return out;
}
