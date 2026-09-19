"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_cart = require("../../store/cart.js");
const mock_orderMenu = require("../../mock/order-menu.js");
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
    const countFor = (type) => carts[type].reduce((sum, line) => sum + line.quantity, 0);
    const total = common_vendor.computed(() => countFor(mode.value));
    const itemCount = (id) => cart.value.filter((line) => line.id === id).reduce((sum, line) => sum + line.quantity, 0);
    const visibleItems = common_vendor.computed(() => mock_orderMenu.menuItems.filter((item) => item.type === mode.value && (categories[mode.value] === "all" || (categories[mode.value] === "signature" ? item.signature : item.category === categories[mode.value])) && (item.name + item.subtitle).includes(queries[mode.value].trim())));
    const searchOpen = common_vendor.ref(false), panel = common_vendor.ref(""), closing = common_vendor.ref(false), confirmClear = common_vendor.ref(false), feedback = common_vendor.ref("");
    const selected = common_vendor.ref(null), selectedOptions = common_vendor.ref([]), selectedQuantity = common_vendor.ref(1), submitting = common_vendor.ref(false), submitted = common_vendor.ref(null);
    let closeTimer, feedbackTimer, submitTimer;
    common_vendor.onLoad((options) => {
      if (["food", "coffee"].includes(options == null ? void 0 : options.type))
        mode.value = options.type;
    });
    common_vendor.onShow(() => {
      const pending = store_cart.useCartStore().consumePendingType();
      if (["food", "coffee"].includes(pending))
        mode.value = pending;
    });
    const switchMode = (type) => {
      if (panel.value || mode.value === type)
        return;
      mode.value = type;
      feedback.value = "";
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
    const quickAdd = (item) => {
      if (mock_orderMenu.addToCart(cart.value, item))
        showFeedback("已加一" + (mode.value === "food" ? "份" : "杯") + " " + item.name);
      else
        showFeedback("这一种口味最多选 20 份");
    };
    const removeLatest = (id) => {
      const line = [...cart.value].reverse().find((item) => item.id === id);
      if (line)
        mock_orderMenu.decreaseLine(cart.value, line.key);
    };
    const openDish = (item) => {
      selected.value = item;
      selectedOptions.value = [...item.defaults];
      selectedQuantity.value = 1;
      closing.value = false;
      panel.value = "dish";
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
      if (!mock_orderMenu.addToCart(cart.value, selected.value, selectedOptions.value, selectedQuantity.value)) {
        showFeedback("这一种口味最多选 20 份");
        return;
      }
      showFeedback(selected.value.name + "已加入清单");
      closePanel();
    };
    const incrementLine = (line) => {
      const item = mock_orderMenu.menuItems.find((item2) => item2.id === line.id);
      if (!mock_orderMenu.addToCart(cart.value, item, line.options))
        showFeedback("这一种口味最多选 20 份");
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
    const panelSubtitle = common_vendor.computed(() => {
      var _a;
      return panel.value === "dish" ? (_a = selected.value) == null ? void 0 : _a.subtitle : panel.value === "cart" ? mode.value === "food" ? "每一道，都是你喜欢的味道" : "一杯一杯，装进今天的小快乐" : panel.value === "review" ? "确认一下，就准备开饭的心情" : "这是一张本地演示回执";
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(mode.value === "food" ? "今天，想吃点什么？" : "给今天，加点咖啡香"),
        b: common_vendor.t(mode.value === "food" ? "你负责好好吃，我负责用心做。" : "忙里偷个闲，喝杯喜欢的。"),
        c: mode.value === "food" ? common_vendor.unref(mock_orderMenu.bowlArt) : common_vendor.unref(mock_orderMenu.menuItems)[4].image,
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
        f: common_vendor.f(common_vendor.unref(mock_orderMenu.menuCategories)[mode.value], (category, k0, i0) => {
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
        i: common_vendor.o(toggleSearch, "04"),
        j: searchOpen.value
      }, searchOpen.value ? common_vendor.e({
        k: queries[mode.value],
        l: common_vendor.o(($event) => queries[mode.value] = $event.detail.value, "ca"),
        m: queries[mode.value]
      }, queries[mode.value] ? {
        n: common_vendor.p({
          name: "close",
          size: 17
        }),
        o: common_vendor.o(($event) => queries[mode.value] = "", "29")
      } : {}) : {}, {
        p: headerTop.value + "px",
        q: common_vendor.p({
          name: mode.value === "food" ? "note" : "coffee",
          size: 17,
          ["stroke-width"]: 1.6
        }),
        r: common_vendor.t(mode.value === "food" ? "家里的拿手菜，今天也为你留了一份。" : "冷热与甜度，都按你的心情来。"),
        s: common_vendor.f(visibleItems.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.n(item.tone),
            b: item.image,
            c: "查看" + item.name,
            d: common_vendor.o(($event) => openDish(item), item.id),
            e: common_vendor.t(item.name),
            f: "93207a4f-3-" + i0,
            g: "选择" + item.name + "口味",
            h: common_vendor.o(($event) => openDish(item), item.id),
            i: common_vendor.t(item.subtitle),
            j: common_vendor.t(item.tag),
            k: common_vendor.n(item.tone),
            l: "93207a4f-4-" + i0,
            m: item.name + "选口味",
            n: common_vendor.o(($event) => openDish(item), item.id),
            o: itemCount(item.id)
          }, itemCount(item.id) ? {
            p: "93207a4f-5-" + i0,
            q: common_vendor.p({
              name: "minus",
              size: 15
            }),
            r: "减少" + item.name,
            s: common_vendor.o(($event) => removeLatest(item.id), item.id)
          } : {}, {
            t: itemCount(item.id)
          }, itemCount(item.id) ? {
            v: common_vendor.t(itemCount(item.id))
          } : {}, {
            w: "93207a4f-6-" + i0,
            x: "添加" + item.name,
            y: common_vendor.o(($event) => quickAdd(item), item.id),
            z: item.id,
            A: itemCount(item.id) > 0 ? 1 : ""
          });
        }),
        t: common_vendor.p({
          name: "chevron-right",
          size: 14
        }),
        v: common_vendor.p({
          name: "chevron-down",
          size: 12
        }),
        w: common_vendor.p({
          name: "plus",
          size: 18
        }),
        x: mode.value + categories[mode.value],
        y: !visibleItems.value.length
      }, !visibleItems.value.length ? {
        z: common_vendor.unref(mock_orderMenu.bowlArt),
        A: common_vendor.o(resetFilters, "af")
      } : {}, {
        B: common_vendor.t(mode.value === "food" ? "好好吃饭，是今天的小正事" : "日子慢慢过，咖啡慢慢喝"),
        C: mode.value + categories[mode.value],
        D: common_vendor.p({
          name: mode.value === "food" ? "shopping-bag" : "coffee",
          size: 24,
          ["stroke-width"]: 1.6
        }),
        E: total.value
      }, total.value ? {
        F: common_vendor.t(total.value),
        G: total.value
      } : {}, {
        H: common_vendor.t(total.value ? "已选 " + total.value + (mode.value === "food" ? " 份好味道" : " 杯小快乐") : "今天的快乐，还差一口"),
        I: common_vendor.t(total.value ? "点这里，看看你的小清单" : mode.value === "food" ? "挑几道喜欢的，开饭啦" : "选一杯喜欢的，歇一歇"),
        J: total.value
      }, total.value ? {
        K: common_vendor.p({
          name: "chevron-up",
          size: 14
        })
      } : {}, {
        L: common_vendor.o(openCart, "c4"),
        M: common_vendor.p({
          name: "chevron-right",
          size: 16
        }),
        N: !total.value,
        O: common_vendor.o(openReview, "f6"),
        P: total.value > 0 ? 1 : "",
        Q: panel.value
      }, panel.value ? common_vendor.e({
        R: closing.value ? 1 : "",
        S: common_vendor.o(closePanel, "28"),
        T: common_vendor.o(() => {
        }, "28"),
        U: common_vendor.t(panelTitle.value),
        V: common_vendor.t(panelSubtitle.value),
        W: common_vendor.p({
          name: "close",
          size: 20
        }),
        X: common_vendor.o(closePanel, "aa"),
        Y: panel.value === "dish" && selected.value
      }, panel.value === "dish" && selected.value ? {
        Z: selected.value.image,
        aa: common_vendor.t(selected.value.description),
        ab: common_vendor.f(selected.value.options, (option, index, i0) => {
          return {
            a: common_vendor.t(option.name),
            b: common_vendor.f(option.values, (value, k1, i1) => {
              return {
                a: common_vendor.t(value),
                b: value,
                c: selectedOptions.value[index] === value ? 1 : "",
                d: selectedOptions.value[index] === value,
                e: common_vendor.o(($event) => selectedOptions.value[index] = value, value)
              };
            }),
            c: option.name
          };
        }),
        ac: common_vendor.t(mode.value === "food" ? "几份" : "几杯"),
        ad: common_vendor.p({
          name: "minus",
          size: 16
        }),
        ae: selectedQuantity.value <= 1,
        af: common_vendor.o(($event) => selectedQuantity.value--, "95"),
        ag: common_vendor.t(selectedQuantity.value),
        ah: common_vendor.p({
          name: "plus",
          size: 18
        }),
        ai: selectedQuantity.value >= 20,
        aj: common_vendor.o(($event) => selectedQuantity.value++, "4f")
      } : panel.value === "cart" || panel.value === "review" ? common_vendor.e({
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
        aq: common_vendor.o(($event) => confirmClear.value = true, "af")
      } : {}, {
        ar: common_vendor.f(cart.value, (line, k0, i0) => {
          return common_vendor.e({
            a: line.image,
            b: common_vendor.t(line.name),
            c: common_vendor.t(line.options.join(" · "))
          }, panel.value === "cart" ? {
            d: "93207a4f-15-" + i0,
            e: common_vendor.p({
              name: "minus",
              size: 14
            }),
            f: "清单减少" + line.name + line.options.join(""),
            g: common_vendor.o(($event) => common_vendor.unref(mock_orderMenu.decreaseLine)(cart.value, line.key), line.key),
            h: common_vendor.t(line.quantity),
            i: "93207a4f-16-" + i0,
            j: common_vendor.p({
              name: "plus",
              size: 16
            }),
            k: "清单增加" + line.name + line.options.join(""),
            l: common_vendor.o(($event) => incrementLine(line), line.key)
          } : {
            m: common_vendor.t(line.quantity)
          }, {
            n: line.key
          });
        }),
        as: panel.value === "cart",
        at: panel.value === "review"
      }, panel.value === "review" ? {
        av: common_vendor.t(mode.value === "food" ? "做饭人" : "咖啡师"),
        aw: notes[mode.value],
        ax: common_vendor.o(($event) => notes[mode.value] = $event.detail.value, "ce"),
        ay: common_vendor.t(notes[mode.value].length),
        az: common_vendor.p({
          name: "note",
          size: 14
        })
      } : {}) : {
        aA: common_vendor.unref(mock_orderMenu.bowlArt)
      }) : panel.value === "success" ? common_vendor.e({
        aC: common_vendor.p({
          name: "check",
          size: 35,
          ["stroke-width"]: 1.7
        }),
        aD: common_vendor.t(submitted.value.type === "food" ? "菜品" : "咖啡"),
        aE: common_vendor.f(submitted.value.lines, (line, k0, i0) => {
          return {
            a: common_vendor.t(line.name),
            b: common_vendor.t(line.options.join(" · ")),
            c: common_vendor.t(line.quantity),
            d: line.key
          };
        }),
        aF: submitted.value.note
      }, submitted.value.note ? {
        aG: common_vendor.t(submitted.value.note)
      } : {}, {
        aH: common_vendor.t(submitted.value.count),
        aI: common_vendor.t(submitted.value.type === "food" ? "份" : "杯")
      }) : {}, {
        ak: panel.value === "cart" || panel.value === "review",
        aB: panel.value === "success",
        aJ: panel.value === "dish"
      }, panel.value === "dish" ? {
        aK: common_vendor.p({
          name: "plus",
          size: 18
        }),
        aL: common_vendor.t(selectedQuantity.value),
        aM: common_vendor.t(mode.value === "food" ? "份" : "杯"),
        aN: common_vendor.o(addSelected, "70")
      } : panel.value === "cart" ? {
        aP: common_vendor.t(total.value ? "选好了，去点单 · " + total.value + (mode.value === "food" ? " 份" : " 杯") : "去挑点好吃的"),
        aQ: common_vendor.p({
          name: "chevron-right",
          size: 17
        }),
        aR: common_vendor.o(($event) => total.value ? openReview() : closePanel(), "56")
      } : panel.value === "review" ? {
        aT: common_vendor.o(($event) => panel.value = "cart", "71"),
        aU: common_vendor.t(submitting.value ? "正在写小纸条…" : "确认点单"),
        aV: common_vendor.p({
          name: "check",
          size: 17
        }),
        aW: !total.value || submitting.value,
        aX: common_vendor.o(submitMock, "6d")
      } : {
        aY: common_vendor.p({
          name: "check",
          size: 17
        }),
        aZ: common_vendor.o(closePanel, "5a")
      }, {
        aO: panel.value === "cart",
        aS: panel.value === "review",
        ba: closing.value ? 1 : "",
        bb: panel.value === "success" ? 1 : "",
        bc: panelTitle.value
      }) : {}, {
        bd: common_vendor.o(($event) => confirmClear.value = false, "bc"),
        be: common_vendor.o(clearCart, "a2"),
        bf: common_vendor.p({
          visible: confirmClear.value,
          title: "清空这份小清单？",
          subtitle: "只清空当前分类的已选内容。",
          ["cancel-text"]: "再想想",
          ["confirm-text"]: "清空"
        }),
        bg: feedback.value
      }, feedback.value ? {
        bh: common_vendor.p({
          name: "check",
          size: 15
        }),
        bi: common_vendor.t(feedback.value)
      } : {}, {
        bj: common_vendor.n("mode-" + mode.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-93207a4f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
