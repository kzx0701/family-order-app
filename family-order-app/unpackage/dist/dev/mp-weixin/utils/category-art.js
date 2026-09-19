"use strict";
const CATEGORY_ART = {
  炒菜: "/static/images/recipes/categories/stir-fry-v2.svg",
  蒸菜: "/static/images/recipes/categories/steam-v2.svg",
  烧菜: "/static/images/recipes/categories/braise-v2.svg",
  汤类: "/static/images/recipes/categories/soup-v2.svg",
  凉菜: "/static/images/recipes/categories/cold-v2.svg",
  主食: "/static/images/recipes/categories/staple-v2.svg"
};
const ALIAS = { 汤: "汤类", 炖汤: "汤类", 煲汤: "汤类", 凉拌: "凉菜", 主: "主食", 饭: "主食" };
const categoryArt = (name) => {
  const key = String(name === null || name === void 0 ? "" : name).trim();
  return CATEGORY_ART[key] || CATEGORY_ART[ALIAS[key]] || "";
};
exports.categoryArt = categoryArt;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/category-art.js.map
