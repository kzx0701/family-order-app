"use strict";
const cloneRecipe = (value) => JSON.parse(JSON.stringify(value));
const blankRecipe = () => ({
  version: 1,
  name: "",
  subtitle: "",
  image: "",
  categoryId: "",
  spicy: "none",
  ingredients: [],
  seasonings: [],
  steps: []
});
function validateRecipe(value) {
  if (!value.name.trim())
    return "给这道菜起个名字吧";
  if (!String(value.image || "").trim())
    return "还差一张封面，给它配一张吧";
  const emptyIndex = value.steps.findIndex((step) => !step.title.trim());
  return emptyIndex < 0 ? "" : `请填写步骤 ${emptyIndex + 1} 的名称`;
}
exports.blankRecipe = blankRecipe;
exports.cloneRecipe = cloneRecipe;
exports.validateRecipe = validateRecipe;
//# sourceMappingURL=../../.sourcemap/mp-weixin/mock/recipe-editor.js.map
