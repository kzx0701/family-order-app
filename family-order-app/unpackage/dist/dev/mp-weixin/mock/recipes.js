"use strict";
const recipeCategories = [
  { id: "all", name: "全部", icon: "book-open" },
  { id: "home", name: "家常菜", icon: "food" },
  { id: "vegetable", name: "蔬菜", icon: "star" },
  { id: "soup", name: "暖汤", icon: "coffee" },
  { id: "coffee", name: "咖啡", icon: "coffee" },
  { id: "breakfast", name: "早餐", icon: "food" }
];
const ingredient = (id, name, amount, unit, extra = {}) => ({ id, name, amount, unit, ...extra });
const step = (title, description, tip = "") => ({ title, description, tip });
const recipes = [
  {
    id: "tomato-eggs",
    name: "番茄炒蛋",
    subtitle: "酸酸甜甜，是家的味道",
    category: "home",
    art: 0,
    minutes: 12,
    difficulty: "新手友好",
    servings: 2,
    unit: "人份",
    label: "下饭担当",
    complete: true,
    flavors: ["不辣", "微辣", "中辣"],
    defaultFlavor: "不辣",
    note: "番茄多炒一小会儿，让汤汁裹住鸡蛋。记得留一点拌饭呀！",
    ingredients: [ingredient("tomato", "番茄", 2, "个"), ingredient("egg", "鸡蛋", 3, "个"), ingredient("onion", "小葱", 1, "根"), ingredient("oil", "食用油", 15, "ml"), ingredient("salt", "盐", 2, "g"), ingredient("sugar", "白糖", 3, "g"), ingredient("chili", "小米椒", 0, "个", { flavorAmounts: { 不辣: 0, 微辣: 1, 中辣: 2 } })],
    steps: [step("先把食材准备好", "番茄洗净切块，小葱切碎。鸡蛋打入碗中，加入一半的盐，充分打散。", "番茄切小一点，更容易炒出汁。"), step("炒一份蓬松的鸡蛋", "锅热后倒入一半食用油，倒入蛋液。待底部凝固后轻轻推散，炒至刚凝固就盛出。", "鸡蛋不用炒太久，后面还要回锅。"), step("把番茄炒出小红汤", "倒入剩余食用油，加入番茄翻炒至变软出汁，放入剩余盐和白糖。若选择辣味，此时加入切碎的小米椒。"), step("合在一起就开饭啦", "鸡蛋倒回锅中，轻轻翻炒均匀，让每一块都裹上番茄汁。确认鸡蛋完全熟透，撒上葱花出锅。")]
  },
  {
    id: "potato-chicken",
    name: "土豆焖鸡",
    subtitle: "软糯土豆，承包一碗饭",
    category: "home",
    art: 1,
    minutes: 35,
    difficulty: "小试身手",
    servings: 2,
    unit: "人份",
    label: "家的拿手菜",
    complete: true,
    flavors: ["不辣", "微辣", "中辣"],
    defaultFlavor: "微辣",
    note: "收汁时留一点汤汁，土豆拌饭真的很香。",
    ingredients: [ingredient("chicken", "鸡腿肉", 400, "g"), ingredient("potato", "土豆", 2, "个"), ingredient("ginger", "生姜", 10, "g"), ingredient("soy", "生抽", 20, "ml"), ingredient("oil", "食用油", 10, "ml"), ingredient("water", "热水", 300, "ml"), ingredient("chili", "小米椒", 0, "个", { flavorAmounts: { 不辣: 0, 微辣: 1, 中辣: 3 } })],
    steps: [step("准备食材", "鸡腿肉切块并擦干，土豆去皮切块，姜切片。生熟食材使用不同砧板。"), step("煎出香气", "锅中热油，放入姜片和鸡肉，煎至两面微黄，加入生抽翻炒。选择辣味时加入小米椒。"), step("盖上锅盖慢慢焖", "加入土豆和热水，煮开后转小火，盖盖焖约 20 分钟，直到土豆软糯、鸡肉完全熟透。"), step("收汁装盘", "开盖略收浓汤汁，轻轻翻动避免土豆碎裂，即可装盘。")]
  },
  {
    id: "garlic-greens",
    name: "蒜蓉小青菜",
    subtitle: "给餐桌加一点绿意",
    category: "vegetable",
    art: 2,
    minutes: 8,
    difficulty: "新手友好",
    servings: 2,
    unit: "人份",
    label: "轻盈一餐",
    complete: true,
    flavors: ["清淡", "蒜香"],
    defaultFlavor: "蒜香",
    note: "青菜沥干再下锅，大火快炒，颜色更好看。",
    ingredients: [ingredient("greens", "小青菜", 300, "g"), ingredient("garlic", "蒜瓣", 4, "瓣", { flavorAmounts: { 清淡: 2, 蒜香: 4 } }), ingredient("oil", "食用油", 10, "ml"), ingredient("salt", "盐", 2, "g")],
    steps: [step("洗净沥干", "青菜掰开，充分清洗叶片和根部，沥干水分。蒜切成细末。"), step("爆香蒜末", "锅内热油，放入一半蒜末，小火炒出香味。"), step("大火快炒", "转大火放入青菜翻炒，炒至菜梗熟透，加盐和剩余蒜末，翻匀出锅。")]
  },
  {
    id: "corn-soup",
    name: "玉米排骨汤",
    subtitle: "咕嘟咕嘟，暖到心里",
    category: "soup",
    art: 3,
    minutes: 60,
    difficulty: "慢慢来就好",
    servings: 2,
    unit: "人份",
    label: "暖胃小幸福",
    complete: true,
    flavors: ["原味"],
    defaultFlavor: "原味",
    note: "盐在最后放，让玉米的清甜先慢慢煮进汤里。",
    ingredients: [ingredient("rib", "排骨", 300, "g"), ingredient("corn", "玉米", 1, "根"), ingredient("carrot", "胡萝卜", 1, "根"), ingredient("ginger", "生姜", 10, "g"), ingredient("water", "清水", 1e3, "ml"), ingredient("salt", "盐", 3, "g")],
    steps: [step("给排骨焯水", "排骨冷水下锅，煮开后撇去浮沫，捞出用温水冲净。"), step("准备一锅暖汤", "玉米、胡萝卜切块。排骨和姜片放入汤锅，加入清水煮开。"), step("小火慢慢炖", "放入玉米、胡萝卜，转小火炖约 45 分钟，直到排骨完全熟透、软烂。"), step("调味盛出", "加入盐调味，搅匀后盛出。小心烫，稍微晾一晾再喝。")]
  },
  {
    id: "latte",
    name: "暖暖拿铁",
    subtitle: "把日子泡得香香的",
    category: "coffee",
    art: 4,
    minutes: 5,
    difficulty: "新手友好",
    servings: 1,
    unit: "杯",
    label: "咖啡时间",
    complete: true,
    flavors: ["无糖", "微甜"],
    defaultFlavor: "无糖",
    note: "没有奶泡机，也可以用温牛奶直接兑浓缩。",
    ingredients: [ingredient("espresso", "浓缩咖啡", 30, "ml"), ingredient("milk", "牛奶", 200, "ml"), ingredient("sugar", "白糖", 0, "g", { flavorAmounts: { 无糖: 0, 微甜: 5 } })],
    steps: [step("准备咖啡", "萃取一份浓缩咖啡，倒入杯中。选择微甜时，趁热加入白糖搅匀。"), step("温热牛奶", "将牛奶加热至温热，用奶泡器打出细腻奶泡，避免煮沸。"), step("合成一杯温柔", "将牛奶缓缓倒入咖啡，再铺上薄薄一层奶泡。")]
  },
  {
    id: "french-toast",
    name: "草莓法式吐司",
    subtitle: "把早晨过成小小节日",
    category: "breakfast",
    art: 5,
    minutes: 15,
    difficulty: "新手友好",
    servings: 1,
    unit: "人份",
    label: "待补充步骤",
    complete: false,
    flavors: ["原味"],
    defaultFlavor: "原味",
    note: "这份菜谱还在记录中，完整做法补好后就可以跟着做啦。",
    ingredients: [ingredient("bread", "厚吐司", 2, "片"), ingredient("egg", "鸡蛋", 1, "个"), ingredient("milk", "牛奶", 60, "ml"), ingredient("butter", "黄油", 10, "g"), ingredient("strawberry", "草莓", 4, "颗")],
    steps: []
  }
];
function resolveIngredients(recipe, flavor, servings) {
  return recipe.ingredients.map((item) => {
    var _a;
    const base = ((_a = item.flavorAmounts) == null ? void 0 : _a[flavor]) ?? item.amount;
    return { ...item, amount: Math.round(base * servings / recipe.servings * 10) / 10 };
  }).filter((item) => item.amount > 0);
}
exports.recipeCategories = recipeCategories;
exports.recipes = recipes;
exports.resolveIngredients = resolveIngredients;
//# sourceMappingURL=../../.sourcemap/mp-weixin/mock/recipes.js.map
