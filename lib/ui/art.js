// Art for the blocks surface. The platform only accepts image URLs hosted on the site itself
// (data: URIs are rejected with E_INVALID_BLOCKS), so images are pre-rendered PNGs uploaded to the
// forum (tools/art-upload.mjs) and referenced here by URL. Missing assets simply render nothing.
import { ASSETS } from "./assets.js";

const img = (key, width, height, alt, fit = "contain") => {
  const url = ASSETS[key];
  return url ? { type: "image", url, width, height, fit, alt } : null;
};
// Wide title banner (guest / creation screens).
export function bannerArt(kind) { return img("banner_" + kind, 760, 200, "问道", "cover"); }
// Realm seal medallion next to the character header.
export function sealArt(realmIdx) { return img("seal_" + Math.max(0, Math.min(8, realmIdx | 0)), 56, 56, "境界", "cover"); }
// Region card art for the explore tab.
// Item icon and monster portrait for list rows (small squares; the card crops images to rounded squares).
export function itemArt(itemId) { return img("item_" + itemId, 56, 56, "", "cover"); }
export function monArt(monId) { return img("mon_" + monId, 64, 64, "", "cover"); }
export function regionArt(regionId) { return img("region_" + regionId, 360, 120, regionId, "cover"); }
