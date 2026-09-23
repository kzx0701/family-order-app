"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const composables_useArtSwap = require("../../composables/useArtSwap.js");
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
const COFFEE_TAB_ID = "coffee";
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
    const loadRecipes = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const queryList = (type) => common_vendor.Vs.callFunction({ name: "app-service", data: { module: "dishes-crud", action: "list", type } });
        const [foodRes, coffeeRes] = await Promise.all([queryList("food"), queryList("coffee")]);
        const foodResult = foodRes && foodRes.result || {};
        const coffeeResult = coffeeRes && coffeeRes.result || {};
        const foodOk = foodResult.code === 0;
        const coffeeOk = coffeeResult.code === 0;
        if (!foodOk && !coffeeOk) {
          common_vendor.index.showToast({ title: foodResult.message || coffeeResult.message || "菜谱加载失败", icon: "none" });
          return;
        }
        if (!foodOk)
          common_vendor.index.__f__("warn", "at pages/recipe/recipe.vue:233", "[recipe] 美食菜谱加载失败", foodResult.code, foodResult.message);
        if (!coffeeOk)
          common_vendor.index.__f__("warn", "at pages/recipe/recipe.vue:234", "[recipe] 咖啡菜谱加载失败", coffeeResult.code, coffeeResult.message);
        const toCard = (d, type) => ({
          id: d._id,
          name: d.name,
          image: d.image || "",
          type,
          // 辣度：直接带出**档位图案**（素材路径），不显示文字档位（角标那条已删，避免同卡说两遍）。
          // 用 spicyMark 而不是 spicyImage —— 卡片是「标记」语义，「不辣」与「未设置」都不挂图标
          // （斜线辣椒留给点单抽屉那种「字段」语义），模板一个 v-if 就收掉。
          // **咖啡恒为空串**：咖啡没有辣度这个概念（编辑页那一格也已收掉），历史脏数据里
          // 若带着 spicy，也不该在卡片上画出一枚辣椒 —— 与详情页 spicyArt 同一口径。
          spicyArt: type === "coffee" ? "" : utils_spicy.spicyMark(d.spicy),
          // 档位值本身也带出来：模板要靠它挂 `pull-*` 类抵掉素材自带的透明留白（见样式区注释）。
          // 非法值与未设置都拿不到对应类 → 不产生负外边距，图上也不会画（spicyArt 为空）。
          spicy: d.spicy || "",
          isSignature: !!d.isSignature,
          // 是否已上菜单（= 会不会出现在点单页）—— 卡片右上角那枚状态贴纸由它驱动。
          // **必须 `=== true`**：schema 的默认值是 true，但历史记录若没这个字段，
          // 点单页的菜单查询（`where({ isOnSale: true })`）同样匹配不到它 ——
          // 两边用同一个判断，才不会出现「卡片标着已上菜单、点单页却找不到」这种矛盾。
          // 未设置 / 字符串 'true' / 0 一律按「没上菜单」处理。
          isOnSale: d.isOnSale === true,
          categoryId: d.categoryId || "",
          // 卡片副行不再显示它，但**搜索要用**（「找道菜，或搜搜备注…」按 name + tip 匹配），
          // 所以这个字段继续留在视图模型里，别顺手删
          tip: d.note || d.description || ""
        });
        dishes.value = [
          ...foodOk ? (foodResult.list || []).map((d) => toCard(d, "food")) : [],
          ...coffeeOk ? (coffeeResult.list || []).map((d) => toCard(d, "coffee")) : []
        ];
        let catList = foodOk && Array.isArray(foodResult.categories) ? foodResult.categories : [];
        if (!catList.length) {
          const catRes = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "categories-crud", action: "list" } });
          const catResult = catRes.result || {};
          const all = catResult.code === 0 ? catResult.list || [] : [];
          catList = all.filter((c) => !c.type || c.type === "food");
        }
        categories.value = catList.map((c) => ({ id: c.id || c._id, name: c.name }));
        if (activeCategory.value !== "all" && activeCategory.value !== COFFEE_TAB_ID && !categories.value.some((c) => c.id === activeCategory.value)) {
          activeCategory.value = "all";
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe/recipe.vue:294", "[recipe] loadRecipes error", e);
        common_vendor.index.showToast({ title: "网络不太好，稍后再试", icon: "none" });
      } finally {
        loading.value = false;
        loaded.value = true;
      }
    };
    common_vendor.onShow(loadRecipes);
    const categoryTabs = common_vendor.computed(() => [
      { id: "all", name: "全部", icon: utils_categoryArt.categoryArt("全部") },
      ...categories.value.map((item) => ({ ...item, icon: utils_categoryArt.categoryArt(item.name), iconActive: utils_categoryArt.categoryArtActive(item.name) })),
      { id: COFFEE_TAB_ID, name: "咖啡", icon: utils_categoryArt.categoryArt("咖啡"), iconActive: utils_categoryArt.categoryArtActive("咖啡") }
    ]);
    const filtered = common_vendor.computed(() => {
      const keyword = search.value.trim().toLocaleLowerCase();
      const key = activeCategory.value;
      return dishes.value.filter((dish) => {
        let hitCategory;
        if (key === "all")
          hitCategory = true;
        else if (key === COFFEE_TAB_ID)
          hitCategory = dish.type === "coffee";
        else
          hitCategory = dish.categoryId === key;
        return hitCategory && (!keyword || [dish.name, dish.tip].some((value) => String(value).toLocaleLowerCase().includes(keyword)));
      });
    });
    const preloadSrc = common_vendor.ref("");
    const { canSwap, isStaticDimmed, markLoaded, markFailed } = composables_useArtSwap.useArtSwap({
      isActive: (category) => activeCategory.value === category.id,
      resetOn: activeCategory,
      tag: "recipe"
    });
    const openRecipe = (recipe) => {
      preloadSrc.value = recipe.image ? utils_image.imgUrl(recipe.image, { w: utils_image.IMG_W.dishCover }) : "";
      common_vendor.index.navigateTo({ url: "/pages/recipe-detail/recipe-detail?id=" + recipe.id + "&type=" + (recipe.type || "food"), animationType: "slide-in-right", animationDuration: 260 });
    };
    const createRecipe = () => common_vendor.index.navigateTo({ url: "/pages/recipe-detail/recipe-detail?mode=create", animationType: "slide-in-right", animationDuration: 260 });
    const createCoffee = () => common_vendor.index.navigateTo({ url: "/pages/recipe-detail/recipe-detail?mode=create&type=coffee", animationType: "slide-in-right", animationDuration: 260 });
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
            b: common_vendor.unref(isStaticDimmed)(category) ? 1 : "",
            c: category.icon
          } : {}, {
            d: common_vendor.unref(canSwap)(category)
          }, common_vendor.unref(canSwap)(category) ? {
            e: category.iconActive,
            f: common_vendor.o(($event) => common_vendor.unref(markLoaded)(category.id), category.id),
            g: common_vendor.o(($event) => common_vendor.unref(markFailed)(category.id), category.id)
          } : {}, {
            h: common_vendor.t(category.name),
            i: category.id,
            j: activeCategory.value === category.id ? 1 : "",
            k: activeCategory.value === category.id,
            l: common_vendor.o(($event) => activeCategory.value = category.id, category.id)
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
              w: common_vendor.unref(utils_image.IMG_W).dishCard
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
            i: recipe.isOnSale
          }, recipe.isOnSale ? {
            j: "fb437fc6-4-" + i0,
            k: common_vendor.p({
              name: "menu-slip",
              size: 17,
              ["stroke-width"]: 2
            })
          } : {}, {
            l: common_vendor.t(recipe.name),
            m: recipe.spicyArt
          }, recipe.spicyArt ? {
            n: common_vendor.n("pull-" + recipe.spicy),
            o: recipe.spicyArt
          } : {}, {
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
        x: common_vendor.o(resetFilters, "c2")
      } : canAdd.value ? {
        z: common_vendor.p({
          name: "plus",
          size: 16
        }),
        A: common_vendor.o(createRecipe, "6f")
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
        E: common_vendor.o(createRecipe, "1e"),
        F: common_vendor.p({
          name: "coffee",
          size: 20,
          ["stroke-width"]: 2.2
        }),
        G: common_vendor.o(createCoffee, "0b")
      } : {}, {
        H: preloadSrc.value
      }, preloadSrc.value ? {
        I: preloadSrc.value
      } : {}, {
        J: showAddBar.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fb437fc6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe/recipe.js.map
