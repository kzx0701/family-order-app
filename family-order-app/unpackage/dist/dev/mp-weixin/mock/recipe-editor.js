"use strict";
const drawing = (body) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><g stroke="#765540" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`);
const greens = drawing('<path d="M48 86C28 82 12 67 17 50Q5 27 26 26Q24 7 41 12Q55 5 60 25Q84 8 87 31Q97 42 79 57Q81 76 55 88Z" fill="#a5c080"/><path d="M49 86Q36 60 32 35M51 84Q65 60 73 32M51 85Q48 57 48 29" stroke="#fff3d6" stroke-width="7"/><path d="m21 39 11 13m41-4 10-9m-43-9 7 8" stroke="#708c52"/></g><g>');
const garlic = drawing('<path d="M48 17 47 29C41 42 22 42 21 63Q17 85 49 88Q83 88 80 63C80 46 59 39 57 27L58 17Z" fill="#fff0d9"/><path d="M47 33Q30 61 40 82M56 34Q69 62 57 82M49 43 49 83" stroke="#c0a586"/><path d="m41 88-5 5m14-5v6m9-7 5 4"/></g><g>');
const mushroom = drawing('<path d="m42 51-5 32q12 9 26 0l-5-32" fill="#fff0d9"/><path d="M13 52Q16 15 49 14Q83 14 88 53Q56 69 13 52Z" fill="#cba782"/><path d="m29 35 3-5m22-4 4 1m13 16 4 2" stroke="#f9e8c5" stroke-width="5"/></g><g>');
const chili = drawing('<path d="M72 28Q88 61 53 78Q30 90 13 81Q53 66 49 36Z" fill="#e98c79"/><path d="m49 36 7-15 15 9-3 9Z" fill="#9bb977"/><path d="M62 23Q59 8 76 10" fill="none"/><path d="M60 43Q68 58 43 70" stroke="#f8b5a0" stroke-width="4"/></g><g>');
const bottle = (fill, band, cap) => drawing(`<path d="M41 12h20v20q1 5 10 13l2 37q0 7-9 8H35q-9-1-9-8l2-36 12-14Z" fill="${fill}"/><path d="M39 10h24v14H39Z" fill="${cap}"/><path d="m28 49 44 1-1 24-44-1Z" fill="${band}"/><path d="m44 53 12 0-2 15-8-1Z" fill="#fff8e8" stroke="none"/><path d="m34 38-2 9m3 30v5" stroke="#fff8e8" stroke-width="3"/></g><g>`);
const pantry = [
  { id: "greens", name: "小青菜", group: "ingredients", image: greens, quantity: "300 g" },
  { id: "garlic", name: "蒜", group: "ingredients", image: garlic, quantity: "4 瓣" },
  { id: "mushroom", name: "香菇", group: "ingredients", image: mushroom, quantity: "3 朵" },
  { id: "chili", name: "小米椒", group: "ingredients", image: chili, quantity: "1 个" },
  { id: "oil", name: "食用油", group: "seasonings", image: bottle("#efd589", "#f6ebc9", "#b6c788"), quantity: "10 ml" },
  { id: "salt", name: "盐", group: "seasonings", image: bottle("#fffdf3", "#dceaf0", "#adc9cf"), quantity: "2 g" },
  { id: "soy", name: "生抽", group: "seasonings", image: bottle("#a77b52", "#f6e7b0", "#db9380"), quantity: "1 小勺" },
  { id: "dark-soy", name: "老抽", group: "seasonings", image: bottle("#816044", "#dfe7c9", "#a0b187"), quantity: "半小勺" }
];
const freshRecipe = () => ({
  version: 1,
  name: "蒜蓉小青菜",
  subtitle: "给餐桌加一点绿意",
  categoryId: "",
  spicy: "none",
  ingredients: pantry.filter((x) => ["greens", "garlic"].includes(x.id)).map(({ id, quantity }) => ({ id, quantity })),
  seasonings: pantry.filter((x) => ["oil", "salt", "soy"].includes(x.id)).map(({ id, quantity }) => ({ id, quantity })),
  steps: [
    { id: "wash", title: "洗洗青菜，切切蒜", description: "小青菜掰开洗净，沥干水分；蒜瓣剥皮，切成细细的蒜末。", tip: "叶片里也要认真洗一洗。沥干再下锅，就不会溅油啦。" },
    { id: "fry", title: "让蒜香先跑出来", description: "锅里倒入食用油，小火加热，放入一半蒜末，轻轻翻炒到闻见香味。", tip: "蒜末很容易焦，保持小火就好。" },
    { id: "finish", title: "大火快炒，绿意上桌", description: "放入小青菜，转大火翻炒。菜梗熟透后加入盐、生抽和剩余蒜末，翻匀出锅。", tip: "" }
  ]
});
const cloneRecipe = (value) => JSON.parse(JSON.stringify(value));
function validateRecipe(value) {
  if (!value.name.trim())
    return "给这道菜起个名字吧";
  const emptyIndex = value.steps.findIndex((step) => !step.title.trim());
  return emptyIndex < 0 ? "" : `请填写步骤 ${emptyIndex + 1} 的名称`;
}
exports.cloneRecipe = cloneRecipe;
exports.freshRecipe = freshRecipe;
exports.pantry = pantry;
exports.validateRecipe = validateRecipe;
//# sourceMappingURL=../../.sourcemap/mp-weixin/mock/recipe-editor.js.map
