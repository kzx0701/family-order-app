"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_cart = require("../../store/cart.js");
const utils_menuArt = require("../../utils/menu-art.js");
const mock_orderMenu = require("../../mock/order-menu.js");
const utils_spicy = require("../../utils/spicy.js");
const utils_categoryArt = require("../../utils/category-art.js");
const utils_image = require("../../utils/image.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  const _easycom_fo_dialog2 = common_vendor.resolveComponent("fo-dialog");
  (_easycom_Icon2 + _easycom_custom_tabbar2 + _easycom_fo_dialog2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
const _easycom_fo_dialog = () => "../../components/fo-dialog/fo-dialog.js";
if (!Math) {
  (_easycom_Icon + _easycom_custom_tabbar + _easycom_fo_dialog)();
}
const _sfc_main = {
  __name: "order",
  setup(__props) {
    const { statusBarHeight, menuButton } = composables_useSafeArea.useSafeArea();
    const headerTop = common_vendor.computed(() => {
      var _a;
      return ((_a = menuButton.value) == null ? void 0 : _a.bottom) ? menuButton.value.bottom + 12 : statusBarHeight.value + 16;
    });
    const types = [{ id: "food", label: "吃点好的", icon: "food" }, { id: "coffee", label: "喝杯咖啡", icon: "coffee" }];
    const mode = common_vendor.ref("food"), categories = common_vendor.reactive({ food: "all", coffee: "all" }), queries = common_vendor.reactive({ food: "", coffee: "" });
    const carts = common_vendor.reactive({ food: [], coffee: [] }), notes = common_vendor.reactive({ food: "", coffee: "" });
    const cart = common_vendor.computed(() => carts[mode.value]);
    const countFor = (type) => carts[type].length;
    const total = common_vendor.computed(() => countFor(mode.value));
    const inCart = (id) => cart.value.some((line) => line.id === id);
    const menus = common_vendor.reactive({
      food: { dishes: [], categories: [], loading: false, loaded: false, error: "" },
      coffee: { dishes: [], categories: [], loading: false, loaded: false, error: "" }
    });
    const menu = common_vendor.computed(() => menus[mode.value]);
    const TONES = ["yellow", "green", "blue", "coral"];
    const toneFor = (seed) => {
      const s = String(seed || "");
      let h = 2166136261;
      for (let i = 0; i < s.length; i += 1) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return TONES[Math.abs(h) % TONES.length];
    };
    const loadMenu = async (type) => {
      const target = menus[type];
      if (!target || target.loading)
        return;
      target.loading = true;
      target.error = "";
      try {
        const res = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "menu-list", type } });
        const result = res.result || {};
        if (result.code !== 0) {
          target.error = result.message || "菜单加载失败";
          return;
        }
        target.categories = result.categories || [];
        target.dishes = (result.dishes || []).map((d) => ({
          id: d.dishId,
          name: d.name,
          // 云端存的是静态托管域名，过 imgUrl 拿按需尺寸 + WebP
          // （卡片图约 200rpx 宽、取 480 覆盖 2x/3x 屏）
          image: utils_image.imgUrl(d.image, { w: 480 }),
          description: d.description || "",
          spicy: d.spicy || "none",
          // 做法分类名（炒菜 / 汤类…）→ 卡片上那枚图标的素材，categoryArt 按名匹配
          recipeCategory: d.categoryName || "",
          // 菜单分类 id（云端 categories 的 _id），顶部筛选栏按它过滤
          category: d.categoryId || "",
          signature: !!d.isSignature,
          tone: toneFor(d.dishId)
        }));
        target.loaded = true;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order/order.vue:221", "[order] 菜单加载异常", e);
        target.error = "网络不太顺，稍后再试";
      } finally {
        target.loading = false;
      }
    };
    const categoryTabs = common_vendor.computed(() => {
      const cloud = (menu.value.categories || []).map((c) => ({ id: c.id, name: c.name }));
      return [{ id: "all", name: "全部" }, { id: "signature", name: "拿手菜" }, ...cloud];
    });
    const visibleItems = common_vendor.computed(() => {
      const key = categories[mode.value];
      const keyword = queries[mode.value].trim().toLocaleLowerCase();
      return menu.value.dishes.filter((item) => {
        const hitCategory = key === "all" || (key === "signature" ? item.signature : item.category === key);
        if (!hitCategory)
          return false;
        if (!keyword)
          return true;
        return (item.name + " " + item.description).toLocaleLowerCase().includes(keyword);
      });
    });
    const searchOpen = common_vendor.ref(false), panel = common_vendor.ref(""), closing = common_vendor.ref(false), confirmClear = common_vendor.ref(false), feedback = common_vendor.ref("");
    const selected = common_vendor.ref(null), selectedNote = common_vendor.ref(""), submitting = common_vendor.ref(false), submitted = common_vendor.ref(null);
    let closeTimer, feedbackTimer, submitTimer;
    common_vendor.onLoad((options) => {
      if (["food", "coffee"].includes(options == null ? void 0 : options.type))
        mode.value = options.type;
    });
    common_vendor.onShow(() => {
      const pending = store_cart.useCartStore().consumePendingType();
      if (["food", "coffee"].includes(pending))
        mode.value = pending;
      menus[mode.value === "food" ? "coffee" : "food"].loaded = false;
      loadMenu(mode.value);
    });
    const switchMode = (type) => {
      if (panel.value || mode.value === type)
        return;
      mode.value = type;
      feedback.value = "";
      if (!menus[type].loaded)
        loadMenu(type);
    };
    const resetFilters = () => {
      queries[mode.value] = "";
      categories[mode.value] = "all";
    };
    const toggleSearch = () => {
      searchOpen.value = !searchOpen.value;
      if (!searchOpen.value)
        queries[mode.value] = "";
    };
    const showFeedback = (text) => {
      clearTimeout(feedbackTimer);
      feedback.value = text;
      feedbackTimer = setTimeout(() => {
        feedback.value = "";
      }, 1400);
    };
    const openDish = (item) => {
      const line = cart.value.find((value) => value.id === item.id);
      selected.value = item;
      selectedNote.value = line ? line.note : "";
      closing.value = false;
      panel.value = "dish";
    };
    const spicyText = common_vendor.computed(() => selected.value && utils_spicy.SPICY_TEXT[selected.value.spicy] || "");
    const spicyArt = common_vendor.computed(() => selected.value ? utils_spicy.spicyImage(selected.value.spicy) : "");
    const selectedInCart = common_vendor.computed(() => !!selected.value && inCart(selected.value.id));
    const removeFromCart = (line) => {
      mock_orderMenu.removeLine(cart.value, line.key);
      showFeedback("已把 " + line.name + " 从清单里去掉");
    };
    const openCart = () => {
      closing.value = false;
      panel.value = "cart";
    };
    const openReview = () => {
      if (!total.value || closing.value)
        return;
      panel.value = "review";
    };
    const closePanel = () => {
      if (closing.value || submitting.value)
        return;
      closing.value = true;
      closeTimer = setTimeout(() => {
        panel.value = "";
        closing.value = false;
        selected.value = null;
      }, 220);
    };
    const addSelected = () => {
      if (closing.value || !selected.value)
        return;
      const existed = inCart(selected.value.id);
      mock_orderMenu.addToCart(cart.value, selected.value, selectedNote.value);
      showFeedback(existed ? selected.value.name + "已更新" : selected.value.name + "已加入清单");
      closePanel();
    };
    const clearCart = () => {
      carts[mode.value] = [];
      confirmClear.value = false;
    };
    const submitMock = () => {
      if (submitting.value || !total.value)
        return;
      submitting.value = true;
      const type = mode.value;
      const snapshot = { type, lines: JSON.parse(JSON.stringify(cart.value)), note: notes[type].trim(), count: total.value };
      submitTimer = setTimeout(() => {
        submitted.value = snapshot;
        carts[type] = [];
        notes[type] = "";
        submitting.value = false;
        panel.value = "success";
      }, 350);
    };
    const cleanup = () => {
      clearTimeout(closeTimer);
      clearTimeout(feedbackTimer);
      clearTimeout(submitTimer);
      panel.value = "";
      closing.value = false;
      confirmClear.value = false;
      submitting.value = false;
      feedback.value = "";
    };
    common_vendor.onHide(cleanup);
    common_vendor.onUnmounted(cleanup);
    common_vendor.onBackPress(() => {
      if (confirmClear.value) {
        confirmClear.value = false;
        return true;
      }
      if (panel.value) {
        closePanel();
        return true;
      }
      return false;
    });
    const panelTitle = common_vendor.computed(() => {
      var _a;
      return panel.value === "dish" ? (_a = selected.value) == null ? void 0 : _a.name : panel.value === "cart" ? "今天的快乐清单" : panel.value === "review" ? "把想吃的，写成小纸条" : "点单小回执";
    });
    const panelSubtitle = common_vendor.computed(() => panel.value === "dish" ? "" : panel.value === "cart" ? mode.value === "food" ? "每一道，都是你喜欢的味道" : "一杯一杯，装进今天的小快乐" : panel.value === "review" ? "确认一下，就准备开饭的心情" : "这是一张本地演示回执");
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(mode.value === "food" ? "今天，想吃点什么？" : "给今天，加点咖啡香"),
        b: common_vendor.t(mode.value === "food" ? "你负责好好吃，我负责用心做。" : "忙里偷个闲，喝杯喜欢的。"),
        c: mode.value === "food" ? common_vendor.unref(utils_menuArt.bowlArt) : common_vendor.unref(utils_menuArt.coffeeArt),
        d: mode.value === "coffee" ? 1 : "",
        e: common_vendor.f(types, (type, k0, i0) => {
          return common_vendor.e({
            a: "93207a4f-0-" + i0,
            b: common_vendor.p({
              name: type.icon,
              size: 20,
              ["stroke-width"]: 1.6
            }),
            c: common_vendor.t(type.label),
            d: countFor(type.id)
          }, countFor(type.id) ? {
            e: common_vendor.t(countFor(type.id))
          } : {}, {
            f: type.id,
            g: mode.value === type.id,
            h: type.label,
            i: mode.value === type.id ? 1 : "",
            j: common_vendor.o(($event) => switchMode(type.id), type.id)
          });
        }),
        f: common_vendor.f(categoryTabs.value, (category, k0, i0) => {
          return {
            a: common_vendor.t(category.name),
            b: category.id,
            c: categories[mode.value] === category.id ? 1 : "",
            d: categories[mode.value] === category.id,
            e: common_vendor.o(($event) => categories[mode.value] = category.id, category.id)
          };
        }),
        g: searchOpen.value ? 1 : "",
        h: searchOpen.value,
        i: common_vendor.o(toggleSearch, "bf"),
        j: searchOpen.value
      }, searchOpen.value ? common_vendor.e({
        k: queries[mode.value],
        l: common_vendor.o(($event) => queries[mode.value] = $event.detail.value, "18"),
        m: queries[mode.value]
      }, queries[mode.value] ? {
        n: common_vendor.p({
          name: "close",
          size: 17
        }),
        o: common_vendor.o(($event) => queries[mode.value] = "", "ab")
      } : {}) : {}, {
        p: headerTop.value + "px",
        q: common_vendor.f(visibleItems.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.n(item.tone),
            b: item.image,
            c: "查看" + item.name,
            d: common_vendor.o(($event) => openDish(item), item.id),
            e: common_vendor.t(item.name),
            f: "选择" + item.name + "口味",
            g: common_vendor.o(($event) => openDish(item), item.id),
            h: common_vendor.t(item.description),
            i: common_vendor.unref(utils_categoryArt.categoryArt)(item.recipeCategory)
          }, common_vendor.unref(utils_categoryArt.categoryArt)(item.recipeCategory) ? {
            j: common_vendor.unref(utils_categoryArt.categoryArt)(item.recipeCategory)
          } : {}, {
            k: common_vendor.unref(utils_spicy.spicyMark)(item.spicy)
          }, common_vendor.unref(utils_spicy.spicyMark)(item.spicy) ? {
            l: common_vendor.unref(utils_spicy.spicyMark)(item.spicy)
          } : {}, {
            m: "93207a4f-2-" + i0,
            n: common_vendor.p({
              name: inCart(item.id) ? "check" : "plus",
              size: inCart(item.id) ? 15 : 17
            }),
            o: inCart(item.id) ? 1 : "",
            p: inCart(item.id) ? "调整" + item.name + "的口味" : "选口味并添加" + item.name,
            q: common_vendor.o(($event) => openDish(item), item.id),
            r: item.id,
            s: inCart(item.id) ? 1 : ""
          });
        }),
        r: mode.value + categories[mode.value],
        s: menu.value.loading && !menu.value.loaded
      }, menu.value.loading && !menu.value.loaded ? {} : menu.value.error ? {
        v: common_vendor.t(menu.value.error),
        w: common_vendor.o(($event) => loadMenu(mode.value), "bb")
      } : !visibleItems.value.length ? common_vendor.e({
        y: common_vendor.unref(utils_menuArt.bowlArt),
        z: common_vendor.t(menu.value.dishes.length ? "这口快乐，还没找到" : "菜单还空着"),
        A: common_vendor.t(menu.value.dishes.length ? "换个关键词或分类试试看吧。" : "在菜谱里点「发布菜品」，它就会出现在这里。"),
        B: menu.value.dishes.length
      }, menu.value.dishes.length ? {
        C: common_vendor.o(resetFilters, "b8")
      } : {}) : {}, {
        t: menu.value.error,
        x: !visibleItems.value.length,
        D: visibleItems.value.length
      }, visibleItems.value.length ? {
        E: common_vendor.t(mode.value === "food" ? "好好吃饭，是今天的小正事" : "日子慢慢过，咖啡慢慢喝")
      } : {}, {
        F: mode.value + categories[mode.value],
        G: common_vendor.p({
          name: mode.value === "food" ? "shopping-bag" : "coffee",
          size: 24,
          ["stroke-width"]: 1.6
        }),
        H: total.value
      }, total.value ? {
        I: common_vendor.t(total.value),
        J: total.value
      } : {}, {
        K: common_vendor.t(total.value ? "已选 " + total.value + (mode.value === "food" ? " 道好味道" : " 杯小快乐") : "今天的快乐，还差一口"),
        L: common_vendor.t(total.value ? "点这里，看看你的小清单" : mode.value === "food" ? "挑几道喜欢的，开饭啦" : "选一杯喜欢的，歇一歇"),
        M: total.value
      }, total.value ? {
        N: common_vendor.p({
          name: "chevron-up",
          size: 14
        })
      } : {}, {
        O: common_vendor.o(openCart, "dc"),
        P: common_vendor.p({
          name: "chevron-right",
          size: 16
        }),
        Q: !total.value,
        R: common_vendor.o(openReview, "2b"),
        S: total.value > 0 ? 1 : "",
        T: panel.value
      }, panel.value ? common_vendor.e({
        U: closing.value ? 1 : "",
        V: common_vendor.o(closePanel, "eb"),
        W: common_vendor.o(() => {
        }, "f3"),
        X: common_vendor.t(panelTitle.value),
        Y: panelSubtitle.value
      }, panelSubtitle.value ? {
        Z: common_vendor.t(panelSubtitle.value)
      } : {}, {
        aa: common_vendor.p({
          name: "close",
          size: 20
        }),
        ab: common_vendor.o(closePanel, "98"),
        ac: panel.value === "dish" && selected.value
      }, panel.value === "dish" && selected.value ? common_vendor.e({
        ad: selected.value.image,
        ae: common_vendor.t(selected.value.description),
        af: spicyArt.value
      }, spicyArt.value ? {
        ag: spicyArt.value,
        ah: "辣度 " + spicyText.value
      } : {}, {
        ai: selectedNote.value,
        aj: common_vendor.o(($event) => selectedNote.value = $event.detail.value, "e1")
      }) : panel.value === "cart" || panel.value === "review" ? common_vendor.e({
        al: total.value
      }, total.value ? common_vendor.e({
        am: panel.value === "cart"
      }, panel.value === "cart" ? {
        an: common_vendor.t(cart.value.length),
        ao: common_vendor.t(mode.value === "food" ? "好味道" : "小快乐"),
        ap: common_vendor.p({
          name: "trash",
          size: 14
        }),
        aq: common_vendor.o(($event) => confirmClear.value = true, "8e")
      } : {}, {
        ar: common_vendor.f(cart.value, (line, k0, i0) => {
          return common_vendor.e({
            a: line.image,
            b: common_vendor.t(line.name),
            c: line.note
          }, line.note ? {
            d: common_vendor.t(line.note)
          } : {}, panel.value === "cart" ? {
            e: "93207a4f-9-" + i0,
            f: common_vendor.p({
              name: "trash",
              size: 16
            }),
            g: "把" + line.name + "从清单里去掉",
            h: common_vendor.o(($event) => removeFromCart(line), line.key)
          } : {}, {
            i: line.key
          });
        }),
        as: panel.value === "cart",
        at: panel.value === "review"
      }, panel.value === "review" ? {
        av: common_vendor.t(mode.value === "food" ? "做饭人" : "咖啡师"),
        aw: notes[mode.value],
        ax: common_vendor.o(($event) => notes[mode.value] = $event.detail.value, "cd"),
        ay: common_vendor.t(notes[mode.value].length),
        az: common_vendor.p({
          name: "note",
          size: 14
        })
      } : {}) : {
        aA: common_vendor.unref(utils_menuArt.bowlArt)
      }) : panel.value === "success" ? common_vendor.e({
        aC: common_vendor.p({
          name: "check",
          size: 35,
          ["stroke-width"]: 1.7
        }),
        aD: common_vendor.t(submitted.value.type === "food" ? "菜品" : "咖啡"),
        aE: common_vendor.f(submitted.value.lines, (line, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(line.name),
            b: line.note
          }, line.note ? {
            c: common_vendor.t(line.note)
          } : {}, {
            d: line.key
          });
        }),
        aF: submitted.value.note
      }, submitted.value.note ? {
        aG: common_vendor.t(submitted.value.note)
      } : {}, {
        aH: common_vendor.t(submitted.value.count),
        aI: common_vendor.t(submitted.value.type === "food" ? "道" : "杯")
      }) : {}, {
        ak: panel.value === "cart" || panel.value === "review",
        aB: panel.value === "success",
        aJ: panel.value === "dish"
      }, panel.value === "dish" ? {
        aK: common_vendor.p({
          name: selectedInCart.value ? "check" : "plus",
          size: 18
        }),
        aL: common_vendor.t(selectedInCart.value ? "更新备注" : "加入清单"),
        aM: common_vendor.o(addSelected, "b8")
      } : panel.value === "cart" ? {
        aO: common_vendor.t(total.value ? "选好了，去点单 · " + total.value + (mode.value === "food" ? " 道" : " 杯") : "去挑点好吃的"),
        aP: common_vendor.p({
          name: "chevron-right",
          size: 17
        }),
        aQ: common_vendor.o(($event) => total.value ? openReview() : closePanel(), "03")
      } : panel.value === "review" ? {
        aS: common_vendor.o(($event) => panel.value = "cart", "ab"),
        aT: common_vendor.t(submitting.value ? "正在写小纸条…" : "确认点单"),
        aU: common_vendor.p({
          name: "check",
          size: 17
        }),
        aV: !total.value || submitting.value,
        aW: common_vendor.o(submitMock, "66")
      } : {
        aX: common_vendor.p({
          name: "check",
          size: 17
        }),
        aY: common_vendor.o(closePanel, "56")
      }, {
        aN: panel.value === "cart",
        aR: panel.value === "review",
        aZ: closing.value ? 1 : "",
        ba: panel.value === "success" ? 1 : "",
        bb: panelTitle.value
      }) : {}, {
        bc: common_vendor.o(($event) => confirmClear.value = false, "e9"),
        bd: common_vendor.o(clearCart, "2e"),
        be: common_vendor.p({
          visible: confirmClear.value,
          title: "清空这份小清单？",
          subtitle: "只清空当前分类的已选内容。",
          ["cancel-text"]: "再想想",
          ["confirm-text"]: "清空"
        }),
        bf: feedback.value
      }, feedback.value ? {
        bg: common_vendor.p({
          name: "check",
          size: 15
        }),
        bh: common_vendor.t(feedback.value)
      } : {}, {
        bi: common_vendor.n("mode-" + mode.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-93207a4f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
