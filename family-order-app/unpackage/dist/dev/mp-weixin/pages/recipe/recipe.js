"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
const utils_image = require("../../utils/image.js");
const utils_spicy = require("../../utils/spicy.js");
const utils_categoryArt = require("../../utils/category-art.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_skeleton2 = common_vendor.resolveComponent("skeleton");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_Icon2 + _easycom_skeleton2 + _easycom_custom_tabbar2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_skeleton = () => "../../components/skeleton/skeleton.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_Icon + _easycom_skeleton + RecipeArt + _easycom_custom_tabbar)();
}
const RecipeArt = () => "../../components/recipe-art/recipe-art.js";
const PLACEHOLDER_STYLE = "color: rgba(140, 114, 94, 0.55)";
const _sfc_main = {
  __name: "recipe",
  setup(__props) {
    const { statusBarHeight, menuButton } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const canAdd = common_vendor.computed(() => userStore.isCook);
    const headerTop = common_vendor.computed(() => {
      var _a;
      return ((_a = menuButton.value) == null ? void 0 : _a.bottom) ? Math.round(menuButton.value.bottom + 12) : statusBarHeight.value + 26;
    });
    const search = common_vendor.ref("");
    const searchFocused = common_vendor.ref(false);
    const categories = common_vendor.ref([]);
    const dishes = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const loaded = common_vendor.ref(false);
    const activeCategory = common_vendor.ref("all");
    const showAddBar = common_vendor.computed(() => canAdd.value && dishes.value.length > 0);
    const photoReady = common_vendor.reactive({});
    const markPhotoReady = (id) => {
      photoReady[id] = true;
    };
    const CATEGORY_MINUTES = {
      汤: [40, 45, 60],
      烧: [35, 40, 45],
      蒸: [25, 30, 35],
      主食: [25, 30, 40],
      炒: [10, 15, 20],
      凉: [10, 15, 20]
    };
    const FALLBACK_MINUTES = [15, 20, 25, 30, 40];
    const stableHash = (seed) => {
      const s = String(seed || "");
      let h = 2166136261;
      for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h);
    };
    const fakeMinutes = (seed, categoryName) => {
      const h = stableHash(seed);
      const name = String(categoryName || "");
      for (const key of Object.keys(CATEGORY_MINUTES)) {
        if (name.includes(key)) {
          const options = CATEGORY_MINUTES[key];
          return options[h % options.length];
        }
      }
      return FALLBACK_MINUTES[h % FALLBACK_MINUTES.length];
    };
    const loadRecipes = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const dishRes = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "dishes-crud", action: "list", type: "food" } });
        const dishResult = dishRes.result || {};
        if (dishResult.code !== 0) {
          common_vendor.index.showToast({ title: dishResult.message || "菜谱加载失败", icon: "none" });
          return;
        }
        dishes.value = (dishResult.list || []).map((d) => ({
          id: d._id,
          name: d.name,
          image: d.image || "",
          // 辣度：卡片只显示辣椒的**根数**，不显示文字档位（角标那条已删，避免同卡说两遍）——
          // 根数与详情页同一个算法（none 0 根、mild 1、medium 2、hot 3），
          // 卡片只消费这个数字，不在模板里另算一遍，两处的表达才不会跑偏
          spicyCount: Math.max(utils_spicy.SPICY_LEVELS.indexOf(d.spicy), 0),
          isSignature: !!d.isSignature,
          categoryId: d.categoryId || "",
          // 所需时间：云端有就先用，没有才落到临时假数据（见上方 fakeMinutes 的说明）。
          // categoryName 由 list 接口 join 后返回，假数据靠它给一个符合直觉的档位
          minutes: Number(d.minutes) || fakeMinutes(d._id || d.name, d.categoryName),
          // 卡片副行不再显示它，但**搜索要用**（「找道菜，或搜搜备注…」按 name + tip 匹配），
          // 所以这个字段继续留在视图模型里，别顺手删
          tip: d.note || d.description || ""
        }));
        let catList = dishResult.categories;
        if (!Array.isArray(catList)) {
          const catRes = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "categories-crud", action: "list", type: "food" } });
          const catResult = catRes.result || {};
          catList = (catResult.code === 0 ? catResult.list || [] : []).map((c) => ({ id: c._id, name: c.name }));
        }
        categories.value = catList.filter((c) => !c.type || c.type === "food").map((c) => ({ id: c.id || c._id, name: c.name }));
        if (activeCategory.value !== "all" && !categories.value.some((c) => c.id === activeCategory.value)) {
          activeCategory.value = "all";
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe/recipe.vue:247", "[recipe] loadRecipes error", e);
        common_vendor.index.showToast({ title: "网络不太好，稍后再试", icon: "none" });
      } finally {
        loading.value = false;
        loaded.value = true;
      }
    };
    common_vendor.onShow(loadRecipes);
    const categoryTabs = common_vendor.computed(() => [
      { id: "all", name: "全部", icon: "" },
      ...categories.value.map((item) => ({ ...item, icon: utils_categoryArt.categoryArt(item.name) }))
    ]);
    const categoryIconMap = common_vendor.computed(() => {
      const map = {};
      for (const item of categories.value)
        map[item.id] = utils_categoryArt.categoryArt(item.name);
      return map;
    });
    const filtered = common_vendor.computed(() => {
      const keyword = search.value.trim().toLocaleLowerCase();
      return dishes.value.filter((dish) => (activeCategory.value === "all" || dish.categoryId === activeCategory.value) && (!keyword || [dish.name, dish.tip].some((value) => String(value).toLocaleLowerCase().includes(keyword))));
    });
    const openRecipe = (recipe) => common_vendor.index.navigateTo({ url: "/pages/recipe-detail/recipe-detail?id=" + recipe.id, animationType: "slide-in-right", animationDuration: 260 });
    const createRecipe = () => common_vendor.index.navigateTo({ url: "/pages/recipe-detail/recipe-detail?mode=create", animationType: "slide-in-right", animationDuration: 260 });
    const resetFilters = () => {
      search.value = "";
      activeCategory.value = "all";
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: headerTop.value + "px",
        b: common_vendor.p({
          name: "search",
          size: 18,
          ["stroke-width"]: 2.2
        }),
        c: PLACEHOLDER_STYLE,
        d: common_vendor.o(($event) => searchFocused.value = true, "07"),
        e: common_vendor.o(($event) => searchFocused.value = false, "0e"),
        f: search.value,
        g: common_vendor.o(($event) => search.value = $event.detail.value, "a4"),
        h: search.value
      }, search.value ? {
        i: common_vendor.p({
          name: "close",
          size: 16
        }),
        j: common_vendor.o(($event) => search.value = "", "dd")
      } : {}, {
        k: searchFocused.value ? 1 : "",
        l: common_vendor.f(categoryTabs.value, (category, k0, i0) => {
          return common_vendor.e({
            a: category.icon
          }, category.icon ? {
            b: category.icon
          } : {}, {
            c: common_vendor.t(category.name),
            d: category.id,
            e: activeCategory.value === category.id ? 1 : "",
            f: activeCategory.value === category.id,
            g: common_vendor.o(($event) => activeCategory.value = category.id, category.id)
          });
        }),
        m: loading.value && !dishes.value.length
      }, loading.value && !dishes.value.length ? {
        n: common_vendor.p({
          type: "dish",
          count: 4
        })
      } : filtered.value.length ? {
        p: common_vendor.f(filtered.value, (recipe, index, i0) => {
          return common_vendor.e({
            a: recipe.image
          }, recipe.image ? {
            b: photoReady[recipe.id] ? 1 : "",
            c: common_vendor.unref(utils_image.imgUrl)(recipe.image, {
              w: 480
            }),
            d: common_vendor.o(($event) => markPhotoReady(recipe.id), recipe.id),
            e: common_vendor.o(($event) => markPhotoReady(recipe.id), recipe.id)
          } : {
            f: "fb437fc6-3-" + i0,
            g: common_vendor.p({
              index: index % 6,
              label: recipe.name
            })
          }, {
            h: recipe.isSignature
          }, recipe.isSignature ? {} : {}, {
            i: common_vendor.t(recipe.name),
            j: categoryIconMap.value[recipe.categoryId]
          }, categoryIconMap.value[recipe.categoryId] ? {
            k: categoryIconMap.value[recipe.categoryId]
          } : {}, {
            l: recipe.spicyCount
          }, recipe.spicyCount ? {
            m: common_vendor.f(recipe.spicyCount, (n, k1, i1) => {
              return {
                a: n,
                b: "fb437fc6-4-" + i0 + "-" + i1
              };
            }),
            n: common_vendor.p({
              name: "chili",
              size: 13,
              ["stroke-width"]: 2.4
            })
          } : {}, {
            o: common_vendor.t(recipe.minutes),
            p: recipe.id,
            q: Math.min(index, 5) * 35 + "ms",
            r: "查看" + recipe.name + "菜谱",
            s: common_vendor.o(($event) => openRecipe(recipe), recipe.id)
          });
        }),
        q: activeCategory.value
      } : loaded.value ? common_vendor.e({
        s: common_vendor.p({
          name: "book-open",
          size: 42,
          ["stroke-width"]: 1.3
        }),
        t: common_vendor.t(dishes.value.length ? "这道味道，还没翻到" : "第一道菜，还等你记下来"),
        v: common_vendor.t(dishes.value.length ? "试试其他菜名、备注，或放宽筛选吧。" : "饲养员添几道拿手菜，就会出现在这里。"),
        w: dishes.value.length
      }, dishes.value.length ? {
        x: common_vendor.o(resetFilters, "1c")
      } : canAdd.value ? {
        z: common_vendor.p({
          name: "plus",
          size: 16
        }),
        A: common_vendor.o(createRecipe, "2a")
      } : {}, {
        y: canAdd.value
      }) : {}, {
        o: filtered.value.length,
        r: loaded.value,
        B: common_vendor.p({
          name: "food",
          size: 14
        }),
        C: showAddBar.value
      }, showAddBar.value ? {
        D: common_vendor.p({
          name: "plus",
          size: 20,
          ["stroke-width"]: 2.2
        }),
        E: common_vendor.o(createRecipe, "db")
      } : {}, {
        F: showAddBar.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fb437fc6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe/recipe.js.map
