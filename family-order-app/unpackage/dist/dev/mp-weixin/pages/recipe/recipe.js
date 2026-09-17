"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
const mock_recipes = require("../../mock/recipes.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_Icon2 + _easycom_custom_tabbar2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_Icon + RecipeArt + _easycom_custom_tabbar)();
}
const RecipeArt = () => "../../components/recipe-art/recipe-art.js";
const PLACEHOLDER_STYLE = "color: rgba(140, 114, 94, 0.55)";
const _sfc_main = {
  __name: "recipe",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const { statusBarHeight, menuButton } = composables_useSafeArea.useSafeArea();
    const headerTop = common_vendor.computed(() => {
      var _a;
      return ((_a = menuButton.value) == null ? void 0 : _a.bottom) ? Math.round(menuButton.value.bottom + 12) : statusBarHeight.value + 26;
    });
    const search = common_vendor.ref("");
    const searchFocused = common_vendor.ref(false);
    const activeCategory = common_vendor.ref("all");
    const filtered = common_vendor.computed(() => {
      const keyword = search.value.trim().toLocaleLowerCase();
      return mock_recipes.recipes.filter((recipe) => (activeCategory.value === "all" || recipe.category === activeCategory.value) && (!keyword || [recipe.name, recipe.subtitle, ...recipe.ingredients.map((item) => item.name)].some((value) => value.toLocaleLowerCase().includes(keyword))));
    });
    const openRecipe = (recipe) => common_vendor.index.navigateTo({ url: "/pages/recipe-detail/recipe-detail?id=" + recipe.id, animationType: "slide-in-right", animationDuration: 260 });
    const resetFilters = () => {
      search.value = "";
      activeCategory.value = "all";
    };
    const showConfigurationScope = () => common_vendor.index.showModal({ title: "菜谱配置", content: "当前是菜谱浏览体验版。后续可在这里维护配料、口味规则和步骤；完整菜谱才能加入菜单。", showCancel: false, confirmText: "知道啦", confirmColor: "#624735" });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: headerTop.value + "px",
        b: common_vendor.p({
          name: "search",
          size: 18,
          ["stroke-width"]: 2.2
        }),
        c: PLACEHOLDER_STYLE,
        d: common_vendor.o(($event) => searchFocused.value = true, "d2"),
        e: common_vendor.o(($event) => searchFocused.value = false, "c2"),
        f: search.value,
        g: common_vendor.o(($event) => search.value = $event.detail.value, "f0"),
        h: search.value
      }, search.value ? {
        i: common_vendor.p({
          name: "close",
          size: 16
        }),
        j: common_vendor.o(($event) => search.value = "", "04")
      } : {}, {
        k: searchFocused.value ? 1 : "",
        l: common_vendor.f(common_vendor.unref(mock_recipes.recipeCategories), (category, k0, i0) => {
          return {
            a: common_vendor.t(category.name),
            b: category.id,
            c: activeCategory.value === category.id ? 1 : "",
            d: activeCategory.value === category.id,
            e: common_vendor.o(($event) => activeCategory.value = category.id, category.id)
          };
        }),
        m: filtered.value.length
      }, filtered.value.length ? {
        n: common_vendor.f(filtered.value, (recipe, index, i0) => {
          return {
            a: "fb437fc6-2-" + i0,
            b: common_vendor.p({
              index: recipe.art,
              label: recipe.name
            }),
            c: common_vendor.t(recipe.label),
            d: !recipe.complete ? 1 : "",
            e: common_vendor.t(recipe.name),
            f: "fb437fc6-3-" + i0,
            g: common_vendor.t(recipe.minutes),
            h: common_vendor.t(recipe.difficulty),
            i: "fb437fc6-4-" + i0,
            j: recipe.id,
            k: Math.min(index, 5) * 35 + "ms",
            l: "查看" + recipe.name + "菜谱",
            m: common_vendor.o(($event) => openRecipe(recipe), recipe.id)
          };
        }),
        o: common_vendor.p({
          name: "clock",
          size: 12
        }),
        p: common_vendor.p({
          name: "chevron-right",
          size: 15
        }),
        q: activeCategory.value
      } : {
        r: common_vendor.p({
          name: "book-open",
          size: 42,
          ["stroke-width"]: 1.3
        }),
        s: common_vendor.o(resetFilters, "32")
      }, {
        t: common_vendor.p({
          name: "food",
          size: 14
        }),
        v: common_vendor.unref(userStore).isCook
      }, common_vendor.unref(userStore).isCook ? {
        w: common_vendor.p({
          name: "edit",
          size: 13
        }),
        x: common_vendor.o(showConfigurationScope, "2b")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fb437fc6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe/recipe.js.map
