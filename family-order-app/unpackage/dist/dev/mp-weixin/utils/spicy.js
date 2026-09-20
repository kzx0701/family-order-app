"use strict";
const SPICY_OPTIONS = [
  { value: "none", label: "不辣", image: "/static/images/recipes/spicy/none-v2.svg" },
  { value: "mild", label: "微辣", image: "/static/images/recipes/spicy/mild-v2.svg" },
  { value: "medium", label: "中辣", image: "/static/images/recipes/spicy/medium-v2.svg" },
  { value: "hot", label: "特辣", image: "/static/images/recipes/spicy/hot-v2.svg" }
];
const SPICY_LEVELS = SPICY_OPTIONS.map((option) => option.value);
const SPICY_TEXT = SPICY_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});
const spicyImage = (value) => {
  const hit = SPICY_OPTIONS.find((option) => option.value === value);
  return hit ? hit.image : "";
};
const spicyMark = (value) => value && value !== "none" ? spicyImage(value) : "";
exports.SPICY_LEVELS = SPICY_LEVELS;
exports.SPICY_OPTIONS = SPICY_OPTIONS;
exports.SPICY_TEXT = SPICY_TEXT;
exports.spicyImage = spicyImage;
exports.spicyMark = spicyMark;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/spicy.js.map
