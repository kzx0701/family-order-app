"use strict";
const common_vendor = require("../../common/vendor.js");
const store_cart = require("../../store/cart.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_skeleton2 = common_vendor.resolveComponent("skeleton");
  const _easycom_dish_card2 = common_vendor.resolveComponent("dish-card");
  const _easycom_cart_popup2 = common_vendor.resolveComponent("cart-popup");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_Icon2 + _easycom_skeleton2 + _easycom_dish_card2 + _easycom_cart_popup2 + _easycom_custom_tabbar2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_skeleton = () => "../../components/skeleton/skeleton.js";
const _easycom_dish_card = () => "../../components/dish-card/dish-card.js";
const _easycom_cart_popup = () => "../../components/cart-popup/cart-popup.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_Icon + _easycom_skeleton + _easycom_dish_card + _easycom_cart_popup + _easycom_custom_tabbar)();
}
const flySize = 40;
const _sfc_main = {
  __name: "order",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const cartStore = store_cart.useCartStore();
    store_user.useUserStore();
    const instance = common_vendor.getCurrentInstance();
    const orderType = common_vendor.ref("coffee");
    const themeClass = common_vendor.computed(() => `theme-${orderType.value}`);
    const pageTitle = common_vendor.computed(() => orderType.value === "coffee" ? "咖啡点单" : "美食点单");
    const categories = common_vendor.ref([]);
    const dishes = common_vendor.ref([]);
    const activeCategory = common_vendor.ref("recommend");
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const loaded = common_vendor.ref(false);
    const dishScrollInto = common_vendor.ref("");
    const isClickScrolling = common_vendor.ref(false);
    let scrollThrottleTimer = null;
    const flyingItems = common_vendor.ref([]);
    const cartShaking = common_vendor.ref(false);
    let shakeTimer = null;
    const cartTotal = common_vendor.computed(() => cartStore.totalCount);
    const cartVisible = common_vendor.ref(false);
    const dishesByCategory = common_vendor.computed(() => {
      const map = {};
      for (const cat of categories.value) {
        if (cat.id === "recommend") {
          map[cat.id] = dishes.value.filter((d) => d.isRecommended);
        } else {
          map[cat.id] = dishes.value.filter((d) => d.categoryId === cat.id);
        }
      }
      return map;
    });
    const emptyEmoji = common_vendor.computed(() => orderType.value === "food" ? "🍽️" : "☕");
    const emptyText = common_vendor.computed(
      () => orderType.value === "food" ? "暂无美食菜品\n管理员赶紧上架吧~" : "暂无咖啡菜品\n管理员赶紧上架吧~"
    );
    const loadMenu = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const res = await common_vendor._r.callFunction({
          name: "menu-list",
          data: { type: orderType.value }
        });
        if (res.result.code === 0) {
          categories.value = res.result.categories || [];
          dishes.value = res.result.dishes || [];
          if (categories.value.length > 0) {
            activeCategory.value = categories.value[0].id;
          }
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order/order.vue:214", "[order] loadMenu error", e);
        common_vendor.index.showToast({ title: "加载失败，下拉刷新重试", icon: "none" });
      } finally {
        loading.value = false;
        loaded.value = true;
      }
    };
    const onRefresh = async () => {
      refreshing.value = true;
      await loadMenu();
      refreshing.value = false;
    };
    const onCategoryTap = (catId) => {
      if (activeCategory.value === catId)
        return;
      activeCategory.value = catId;
      dishScrollInto.value = `section-${catId}`;
      setTimeout(() => {
        dishScrollInto.value = "";
      }, 300);
      isClickScrolling.value = true;
      setTimeout(() => {
        isClickScrolling.value = false;
      }, 500);
    };
    const onScroll = () => {
      if (isClickScrolling.value)
        return;
      if (scrollThrottleTimer)
        return;
      scrollThrottleTimer = setTimeout(() => {
        scrollThrottleTimer = null;
        updateActiveFromScroll();
      }, 100);
    };
    const updateActiveFromScroll = () => {
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.selectAll(".dish-section").boundingClientRect();
      query.select(".dish-list").boundingClientRect();
      query.exec((res) => {
        var _a;
        const sections = res[0] || [];
        const scrollView = res[1];
        if (!scrollView || sections.length === 0)
          return;
        const threshold = scrollView.top + 20;
        let activeIdx = 0;
        sections.forEach((sec, idx) => {
          if (sec.top <= threshold)
            activeIdx = idx;
        });
        const newActive = (_a = categories.value[activeIdx]) == null ? void 0 : _a.id;
        if (newActive && newActive !== activeCategory.value) {
          activeCategory.value = newActive;
        }
      });
    };
    const onAddToCart = ({ dish, originX, originY }) => {
      cartStore.addItem(dish);
      playFlyAnimation(originX, originY, dish);
    };
    const playFlyAnimation = (originX, originY, dish) => {
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.select(".cart-btn").boundingClientRect((rect) => {
        if (!rect) {
          triggerCartShake();
          return;
        }
        const endX = rect.left + rect.width / 2;
        const endY = rect.top + rect.height / 2;
        const startLeft = originX - flySize / 2;
        const startTop = originY - flySize / 2;
        const endLeft = endX - flySize / 2;
        const endTop = endY - flySize / 2;
        const peakLeft = (startLeft + endLeft) / 2;
        const peakTop = Math.min(startTop, endTop) - 60;
        const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const emoji = dish.type === "food" ? "🍲" : "☕";
        flyingItems.value.push({
          id,
          image: dish.image || "",
          emoji,
          style: {
            "--sx": `${startLeft}px`,
            "--sy": `${startTop}px`,
            "--px": `${peakLeft}px`,
            "--py": `${peakTop}px`,
            "--ex": `${endLeft}px`,
            "--ey": `${endTop}px`
          }
        });
        setTimeout(() => {
          onFlyEnd(id);
        }, 900);
      });
      query.exec();
    };
    const onFlyEnd = (id) => {
      const idx = flyingItems.value.findIndex((f) => f.id === id);
      if (idx > -1) {
        flyingItems.value.splice(idx, 1);
      }
      triggerCartShake();
    };
    const triggerCartShake = () => {
      if (cartShaking.value) {
        cartShaking.value = false;
      }
      clearTimeout(shakeTimer);
      setTimeout(() => {
        cartShaking.value = true;
        shakeTimer = setTimeout(() => {
          cartShaking.value = false;
        }, 500);
      }, 20);
    };
    const onDishTap = (dish) => {
      if (!dish || !dish.dishId) {
        common_vendor.index.showToast({ title: "菜品信息异常", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/dish-detail/dish-detail?dishId=${dish.dishId}&type=${dish.type}`
      });
    };
    const onCartClick = () => {
      if (cartTotal.value === 0) {
        common_vendor.index.showToast({ title: "购物车是空的~", icon: "none" });
        return;
      }
      cartVisible.value = true;
    };
    const onPopupClose = () => {
      cartVisible.value = false;
    };
    const onPopupSubmit = () => {
      cartVisible.value = false;
      goSubmit();
    };
    const goSubmit = () => {
      if (cartTotal.value === 0)
        return;
      common_vendor.index.navigateTo({ url: "/pages/submit/submit" });
    };
    const goHome = () => {
      common_vendor.index.switchTab({ url: "/pages/home/home" });
    };
    common_vendor.onLoad((options) => {
      if (options.type && ["coffee", "food"].includes(options.type)) {
        orderType.value = options.type;
      }
      cartStore.setActiveType(orderType.value);
    });
    common_vendor.onShow(() => {
      const pendingType = cartStore.consumePendingType();
      let needReload = false;
      if (pendingType && ["coffee", "food"].includes(pendingType) && pendingType !== orderType.value) {
        orderType.value = pendingType;
        needReload = true;
      }
      cartStore.setActiveType(orderType.value);
      if (!loaded.value || needReload) {
        loadMenu();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "arrow-left",
          size: 20
        }),
        b: common_vendor.o(goHome, "0b"),
        c: common_vendor.t(pageTitle.value),
        d: common_vendor.p({
          name: "shopping-cart",
          size: 20
        }),
        e: cartTotal.value > 0
      }, cartTotal.value > 0 ? {
        f: common_vendor.t(cartTotal.value)
      } : {}, {
        g: cartShaking.value ? 1 : "",
        h: common_vendor.o(onCartClick, "56"),
        i: common_vendor.unref(statusBarHeight) + 20 + "px",
        j: common_vendor.f(categories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: cat.id,
            c: activeCategory.value === cat.id ? 1 : "",
            d: common_vendor.o(($event) => onCategoryTap(cat.id), cat.id)
          };
        }),
        k: loading.value && dishes.value.length === 0
      }, loading.value && dishes.value.length === 0 ? {
        l: common_vendor.p({
          type: "dish",
          count: 4
        })
      } : dishes.value.length === 0 ? {
        n: common_vendor.t(emptyEmoji.value),
        o: common_vendor.t(emptyText.value),
        p: common_vendor.o(loadMenu, "94")
      } : {
        q: common_vendor.f(categories.value, (cat, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(cat.name),
            b: cat.id === "recommend"
          }, cat.id === "recommend" ? {} : {}, {
            c: (dishesByCategory.value[cat.id] || []).length > 0
          }, (dishesByCategory.value[cat.id] || []).length > 0 ? {
            d: common_vendor.f(dishesByCategory.value[cat.id] || [], (dish, idx, i1) => {
              return {
                a: dish.dishId,
                b: common_vendor.o(onAddToCart, dish.dishId),
                c: common_vendor.o(onDishTap, dish.dishId),
                d: "93207a4f-3-" + i0 + "-" + i1,
                e: common_vendor.p({
                  dish,
                  index: idx
                })
              };
            })
          } : {}, {
            e: cat.id,
            f: `section-${cat.id}`
          });
        })
      }, {
        m: dishes.value.length === 0,
        r: dishScrollInto.value,
        s: refreshing.value,
        t: common_vendor.o(onRefresh, "3d"),
        v: common_vendor.o(onScroll, "49"),
        w: common_vendor.p({
          name: "shopping-bag",
          size: 22
        }),
        x: cartTotal.value > 0 ? 1 : "",
        y: common_vendor.o(onCartClick, "3b"),
        z: common_vendor.t(cartTotal.value === 0 ? "购物车是空的" : "去下单"),
        A: cartTotal.value === 0 ? 1 : "",
        B: common_vendor.o(goSubmit, "cb"),
        C: common_vendor.f(flyingItems.value, (fly, k0, i0) => {
          return common_vendor.e({
            a: fly.image
          }, fly.image ? {
            b: fly.image
          } : {
            c: common_vendor.t(fly.emoji)
          }, {
            d: fly.id,
            e: common_vendor.s(fly.style),
            f: common_vendor.o(($event) => onFlyEnd(fly.id), fly.id)
          });
        }),
        D: common_vendor.o(onPopupClose, "c1"),
        E: common_vendor.o(onPopupSubmit, "00"),
        F: common_vendor.p({
          visible: cartVisible.value,
          theme: orderType.value
        }),
        G: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-93207a4f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
