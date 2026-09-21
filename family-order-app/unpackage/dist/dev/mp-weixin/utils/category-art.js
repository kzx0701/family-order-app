"use strict";
const CATEGORY_ART = {
  // 「全部」不是一个菜系，但它同样要占着分类行第一格。给它一份**同族**的插画：
  // 同一套碗身/碗沿，碗里堆四团颜色各异的食物（正好取其余图标的主色
  // #9DBBC0 蓝灰 / #85A96F 叶绿 / #F2C65D 黄油 / #E97768 珊瑚）——
  // 「什么都有」即「全部」。2026-09-21 按主人要求补，此前这一格只有文字、在图标行里看着是空的。
  全部: "/static/images/recipes/categories/all-v2.svg",
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
