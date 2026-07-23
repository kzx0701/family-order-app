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
    const dishScrollTop = common_vendor.ref(0);
    const sidebarScrollTop = common_vendor.ref(0);
    const sectionTops = common_vendor.ref([]);
    let suppressScrollSync = false;
    let suppressTimer = null;
    let scrollThrottleTimer = null;
    let lastDishScrollTop = -1;
    let lastSidebarScrollTop = -1;
    let latestScrollTop = 0;
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
        const res = await common_vendor.wr.callFunction({
          name: "menu-list",
          data: { type: orderType.value }
        });
        if (res.result.code === 0) {
          categories.value = res.result.categories || [];
          dishes.value = res.result.dishes || [];
          if (categories.value.length > 0) {
            activeCategory.value = categories.value[0].id;
          }
          suppressScrollSync = true;
          clearTimeout(suppressTimer);
          dishScrollTop.value = lastDishScrollTop === 0 ? 0.1 : 0;
          lastDishScrollTop = dishScrollTop.value;
          common_vendor.nextTick$1(() => {
            setTimeout(() => {
              measureSections();
              suppressTimer = setTimeout(() => {
                suppressScrollSync = false;
              }, 200);
            }, 350);
          });
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order/order.vue:245", "[order] loadMenu error", e);
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
    const measureSections = (onDone) => {
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.selectAll(".dish-section").boundingClientRect();
      query.select(".dish-list").boundingClientRect();
      query.select(".dish-list").scrollOffset();
      query.exec((res) => {
        const sections = res[0] || [];
        const scrollView = res[1];
        const scrollOffset = res[2];
        if (!scrollView || sections.length === 0)
          return;
        const currentTop = scrollOffset ? scrollOffset.scrollTop : 0;
        sectionTops.value = sections.map((r) => r.top - scrollView.top + currentTop);
        if (typeof onDone === "function")
          onDone();
      });
    };
    const onCategoryTap = (catId) => {
      if (activeCategory.value === catId)
        return;
      activeCategory.value = catId;
      scrollDishToCategory(catId);
      scrollSidebarToActive();
      suppressScrollSync = true;
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(() => {
        suppressScrollSync = false;
      }, 600);
    };
    const scrollDishToCategory = (catId) => {
      const idx = categories.value.findIndex((c) => c.id === catId);
      if (idx < 0)
        return;
      if (sectionTops.value.length === 0) {
        measureSections(() => scrollDishToCategory(catId));
        return;
      }
      const top = sectionTops.value[idx];
      if (top == null)
        return;
      const target = Math.max(top - 8, 0);
      dishScrollTop.value = target === lastDishScrollTop ? target + 0.1 : target;
      lastDishScrollTop = dishScrollTop.value;
    };
    const scrollSidebarToActive = () => {
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.select(`#cat-${activeCategory.value}`).boundingClientRect();
      query.select(".sidebar").boundingClientRect();
      query.select(".sidebar").scrollOffset();
      query.exec((res) => {
        const item = res[0];
        const sidebar = res[1];
        const scrollOffset = res[2];
        if (!item || !sidebar)
          return;
        const currentTop = scrollOffset ? scrollOffset.scrollTop : 0;
        const itemTop = item.top - sidebar.top + currentTop;
        const target = Math.max(itemTop - sidebar.height / 3, 0);
        sidebarScrollTop.value = target === lastSidebarScrollTop ? target + 0.1 : target;
        lastSidebarScrollTop = sidebarScrollTop.value;
      });
    };
    const onScroll = (e) => {
      latestScrollTop = e.detail && e.detail.scrollTop || 0;
      if (suppressScrollSync)
        return;
      if (scrollThrottleTimer)
        return;
      scrollThrottleTimer = setTimeout(() => {
        scrollThrottleTimer = null;
        updateActiveFromScroll(latestScrollTop);
      }, 100);
    };
    const updateActiveFromScroll = (scrollTop) => {
      var _a;
      const tops = sectionTops.value;
      if (tops.length === 0)
        return;
      const threshold = scrollTop + 24;
      let activeIdx = 0;
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= threshold)
          activeIdx = i;
      }
      const newActive = (_a = categories.value[activeIdx]) == null ? void 0 : _a.id;
      if (newActive && newActive !== activeCategory.value) {
        activeCategory.value = newActive;
        scrollSidebarToActive();
      }
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
        b: common_vendor.o(goHome, "8d"),
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
        h: common_vendor.o(onCartClick, "a2"),
        i: common_vendor.unref(statusBarHeight) + 32 + "px",
        j: common_vendor.f(categories.value, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: cat.id,
            c: `cat-${cat.id}`,
            d: activeCategory.value === cat.id ? 1 : "",
            e: common_vendor.o(($event) => onCategoryTap(cat.id), cat.id)
          };
        }),
        k: sidebarScrollTop.value,
        l: loading.value && dishes.value.length === 0
      }, loading.value && dishes.value.length === 0 ? {
        m: common_vendor.p({
          type: "dish",
          count: 4
        })
      } : dishes.value.length === 0 ? {
        o: common_vendor.t(emptyEmoji.value),
        p: common_vendor.t(emptyText.value),
        q: common_vendor.o(loadMenu, "55")
      } : {
        r: common_vendor.f(categories.value, (cat, k0, i0) => {
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
        n: dishes.value.length === 0,
        s: dishScrollTop.value,
        t: refreshing.value,
        v: common_vendor.o(onRefresh, "17"),
        w: common_vendor.o(onScroll, "5b"),
        x: common_vendor.p({
          name: "shopping-bag",
          size: 22
        }),
        y: cartTotal.value > 0 ? 1 : "",
        z: common_vendor.o(onCartClick, "25"),
        A: common_vendor.t(cartTotal.value === 0 ? "购物车是空的" : "去下单"),
        B: cartTotal.value === 0 ? 1 : "",
        C: common_vendor.o(goSubmit, "af"),
        D: common_vendor.f(flyingItems.value, (fly, k0, i0) => {
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
        E: common_vendor.o(onPopupClose, "05"),
        F: common_vendor.o(onPopupSubmit, "f2"),
        G: common_vendor.p({
          visible: cartVisible.value,
          theme: orderType.value
        }),
        H: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-93207a4f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
