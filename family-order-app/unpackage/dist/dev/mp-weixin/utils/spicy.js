"use strict";
const SPICY_OPTIONS = [
  { value: "none", label: "不辣", image: "/static/images/recipes/spicy/none-v1.png" },
  { value: "mild", label: "微辣", image: "/static/images/recipes/spicy/mild-v1.png" },
  { value: "medium", label: "中辣", image: "/static/images/recipes/spicy/medium-v1.png" },
  { value: "hot", label: "特辣", image: "/static/images/recipes/spicy/hot-v1.png" }
];
const SPICY_LEVELS = SPICY_OPTIONS.map((option) => option.value);
const SPICY_TEXT = SPICY_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});
exports.SPICY_LEVELS = SPICY_LEVELS;
exports.SPICY_OPTIONS = SPICY_OPTIONS;
exports.SPICY_TEXT = SPICY_TEXT;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/spicy.js.map
