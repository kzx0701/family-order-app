"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_cart = require("../../store/cart.js");
const mock_orderMenu = require("../../mock/order-menu.js");
const utils_spicy = require("../../utils/spicy.js");
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
    const visibleItems = common_vendor.computed(() => mock_orderMenu.menuItems.filter((item) => item.type === mode.value && (categories[mode.value] === "all" || (categories[mode.value] === "signature" ? item.signature : item.category === categories[mode.value])) && (item.name + item.subtitle).includes(queries[mode.value].trim())));
    const searchOpen = common_vendor.ref(false), panel = common_vendor.ref(""), closing = common_vendor.ref(false), confirmClear = common_vendor.ref(false), feedback = common_vendor.ref("");
    const selected = common_vendor.ref(null), selectedOptions = common_vendor.ref([]), selectedNote = common_vendor.ref(""), submitting = common_vendor.ref(false), submitted = common_vendor.ref(null);
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
    const openDish = (item) => {
      const line = cart.value.find((value) => value.id === item.id);
      selected.value = item;
      selectedOptions.value = line ? [...line.options] : [...item.defaults];
      selectedNote.value = line ? line.note : "";
      closing.value = false;
      panel.value = "dish";
    };
    const spicyText = common_vendor.computed(() => selected.value && utils_spicy.SPICY_TEXT[selected.value.spicy] || "");
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
      mock_orderMenu.addToCart(cart.value, selected.value, selectedOptions.value, selectedNote.value);
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
        q: common_vendor.f(visibleItems.value, (item, k0, i0) => {
          return {
            a: common_vendor.n(item.tone),
            b: item.image,
            c: "查看" + item.name,
            d: common_vendor.o(($event) => openDish(item), item.id),
            e: common_vendor.t(item.name),
            f: "选择" + item.name + "口味",
            g: common_vendor.o(($event) => openDish(item), item.id),
            h: common_vendor.t(item.description),
            i: common_vendor.t(item.tag),
            j: common_vendor.n(item.tone),
            k: "93207a4f-2-" + i0,
            l: common_vendor.p({
              name: inCart(item.id) ? "check" : "plus",
              size: inCart(item.id) ? 15 : 17
            }),
            m: inCart(item.id) ? 1 : "",
            n: inCart(item.id) ? "调整" + item.name + "的口味" : "选口味并添加" + item.name,
            o: common_vendor.o(($event) => openDish(item), item.id),
            p: item.id,
            q: inCart(item.id) ? 1 : ""
          };
        }),
        r: mode.value + categories[mode.value],
        s: !visibleItems.value.length
      }, !visibleItems.value.length ? {
        t: common_vendor.unref(mock_orderMenu.bowlArt),
        v: common_vendor.o(resetFilters, "b4")
      } : {}, {
        w: common_vendor.t(mode.value === "food" ? "好好吃饭，是今天的小正事" : "日子慢慢过，咖啡慢慢喝"),
        x: mode.value + categories[mode.value],
        y: common_vendor.p({
          name: mode.value === "food" ? "shopping-bag" : "coffee",
          size: 24,
          ["stroke-width"]: 1.6
        }),
        z: total.value
      }, total.value ? {
        A: common_vendor.t(total.value),
        B: total.value
      } : {}, {
        C: common_vendor.t(total.value ? "已选 " + total.value + (mode.value === "food" ? " 道好味道" : " 杯小快乐") : "今天的快乐，还差一口"),
        D: common_vendor.t(total.value ? "点这里，看看你的小清单" : mode.value === "food" ? "挑几道喜欢的，开饭啦" : "选一杯喜欢的，歇一歇"),
        E: total.value
      }, total.value ? {
        F: common_vendor.p({
          name: "chevron-up",
          size: 14
        })
      } : {}, {
        G: common_vendor.o(openCart, "9a"),
        H: common_vendor.p({
          name: "chevron-right",
          size: 16
        }),
        I: !total.value,
        J: common_vendor.o(openReview, "d8"),
        K: total.value > 0 ? 1 : "",
        L: panel.value
      }, panel.value ? common_vendor.e({
        M: closing.value ? 1 : "",
        N: common_vendor.o(closePanel, "54"),
        O: common_vendor.o(() => {
        }, "d7"),
        P: common_vendor.t(panelTitle.value),
        Q: panelSubtitle.value
      }, panelSubtitle.value ? {
        R: common_vendor.t(panelSubtitle.value)
      } : {}, {
        S: common_vendor.p({
          name: "close",
          size: 20
        }),
        T: common_vendor.o(closePanel, "8d"),
        U: panel.value === "dish" && selected.value
      }, panel.value === "dish" && selected.value ? common_vendor.e({
        V: selected.value.image,
        W: common_vendor.t(selected.value.description),
        X: spicyText.value
      }, spicyText.value ? {
        Y: common_vendor.p({
          name: "chili",
          size: 15,
          ["stroke-width"]: 2.2
        }),
        Z: common_vendor.t(spicyText.value)
      } : {}, {
        aa: common_vendor.f(selected.value.options, (option, index, i0) => {
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
        ab: selectedNote.value,
        ac: common_vendor.o(($event) => selectedNote.value = $event.detail.value, "02")
      }) : panel.value === "cart" || panel.value === "review" ? common_vendor.e({
        ae: total.value
      }, total.value ? common_vendor.e({
        af: panel.value === "cart"
      }, panel.value === "cart" ? {
        ag: common_vendor.t(cart.value.length),
        ah: common_vendor.t(mode.value === "food" ? "好味道" : "小快乐"),
        ai: common_vendor.p({
          name: "trash",
          size: 14
        }),
        aj: common_vendor.o(($event) => confirmClear.value = true, "58")
      } : {}, {
        ak: common_vendor.f(cart.value, (line, k0, i0) => {
          return common_vendor.e({
            a: line.image,
            b: common_vendor.t(line.name),
            c: line.options.length
          }, line.options.length ? {
            d: common_vendor.t(line.options.join(" · "))
          } : {}, {
            e: line.note
          }, line.note ? {
            f: common_vendor.t(line.note)
          } : {}, panel.value === "cart" ? {
            g: "93207a4f-10-" + i0,
            h: common_vendor.p({
              name: "trash",
              size: 16
            }),
            i: "把" + line.name + "从清单里去掉",
            j: common_vendor.o(($event) => removeFromCart(line), line.key)
          } : {}, {
            k: line.key
          });
        }),
        al: panel.value === "cart",
        am: panel.value === "review"
      }, panel.value === "review" ? {
        an: common_vendor.t(mode.value === "food" ? "做饭人" : "咖啡师"),
        ao: notes[mode.value],
        ap: common_vendor.o(($event) => notes[mode.value] = $event.detail.value, "8e"),
        aq: common_vendor.t(notes[mode.value].length),
        ar: common_vendor.p({
          name: "note",
          size: 14
        })
      } : {}) : {
        as: common_vendor.unref(mock_orderMenu.bowlArt)
      }) : panel.value === "success" ? common_vendor.e({
        av: common_vendor.p({
          name: "check",
          size: 35,
          ["stroke-width"]: 1.7
        }),
        aw: common_vendor.t(submitted.value.type === "food" ? "菜品" : "咖啡"),
        ax: common_vendor.f(submitted.value.lines, (line, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(line.name),
            b: line.options.length
          }, line.options.length ? {
            c: common_vendor.t(line.options.join(" · "))
          } : {}, {
            d: line.note
          }, line.note ? {
            e: common_vendor.t(line.note)
          } : {}, {
            f: line.key
          });
        }),
        ay: submitted.value.note
      }, submitted.value.note ? {
        az: common_vendor.t(submitted.value.note)
      } : {}, {
        aA: common_vendor.t(submitted.value.count),
        aB: common_vendor.t(submitted.value.type === "food" ? "道" : "杯")
      }) : {}, {
        ad: panel.value === "cart" || panel.value === "review",
        at: panel.value === "success",
        aC: panel.value === "dish"
      }, panel.value === "dish" ? {
        aD: common_vendor.p({
          name: selectedInCart.value ? "check" : "plus",
          size: 18
        }),
        aE: common_vendor.t(selectedInCart.value ? "更新口味" : "加入清单"),
        aF: common_vendor.o(addSelected, "f0")
      } : panel.value === "cart" ? {
        aH: common_vendor.t(total.value ? "选好了，去点单 · " + total.value + (mode.value === "food" ? " 道" : " 杯") : "去挑点好吃的"),
        aI: common_vendor.p({
          name: "chevron-right",
          size: 17
        }),
        aJ: common_vendor.o(($event) => total.value ? openReview() : closePanel(), "87")
      } : panel.value === "review" ? {
        aL: common_vendor.o(($event) => panel.value = "cart", "46"),
        aM: common_vendor.t(submitting.value ? "正在写小纸条…" : "确认点单"),
        aN: common_vendor.p({
          name: "check",
          size: 17
        }),
        aO: !total.value || submitting.value,
        aP: common_vendor.o(submitMock, "3a")
      } : {
        aQ: common_vendor.p({
          name: "check",
          size: 17
        }),
        aR: common_vendor.o(closePanel, "c6")
      }, {
        aG: panel.value === "cart",
        aK: panel.value === "review",
        aS: closing.value ? 1 : "",
        aT: panel.value === "success" ? 1 : "",
        aU: panelTitle.value
      }) : {}, {
        aV: common_vendor.o(($event) => confirmClear.value = false, "81"),
        aW: common_vendor.o(clearCart, "56"),
        aX: common_vendor.p({
          visible: confirmClear.value,
          title: "清空这份小清单？",
          subtitle: "只清空当前分类的已选内容。",
          ["cancel-text"]: "再想想",
          ["confirm-text"]: "清空"
        }),
        aY: feedback.value
      }, feedback.value ? {
        aZ: common_vendor.p({
          name: "check",
          size: 15
        }),
        ba: common_vendor.t(feedback.value)
      } : {}, {
        bb: common_vendor.n("mode-" + mode.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-93207a4f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
