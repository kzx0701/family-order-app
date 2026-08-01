"use strict";
const common_vendor = require("../../common/vendor.js");
const store_cart = require("../../store/cart.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const _sfc_main = {
  __name: "cart-popup",
  props: {
    // 是否显示
    visible: { type: Boolean, default: false },
    // 主题：coffee / food
    theme: { type: String, default: "coffee" }
  },
  emits: ["close", "submit"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const cartStore = store_cart.useCartStore();
    const items = common_vendor.computed(() => cartStore.activeItems);
    common_vendor.computed(() => cartStore.totalCount);
    const totalKinds = common_vendor.computed(() => cartStore.totalKinds);
    const themeClass = common_vendor.computed(() => `theme-${props.theme}`);
    const show = common_vendor.ref(false);
    common_vendor.watch(
      () => props.visible,
      (val) => {
        if (val) {
          common_vendor.nextTick$1(() => {
            show.value = true;
          });
        } else {
          show.value = false;
        }
      },
      { immediate: true }
    );
    const noop = () => {
    };
    const removingMap = common_vendor.ref({});
    const onClose = () => {
      show.value = false;
      setTimeout(() => {
        emit("close");
      }, 300);
    };
    const onClear = () => {
      common_vendor.index.showModal({
        title: "清空购物车",
        content: "确定要清空所有菜品吗？",
        confirmColor: "#EF4444",
        success: (res) => {
          if (res.confirm) {
            cartStore.clearCart();
            removingMap.value = {};
          }
        }
      });
    };
    const startRemove = (dishId) => {
      if (removingMap.value[dishId])
        return;
      removingMap.value = { ...removingMap.value, [dishId]: true };
      setTimeout(() => {
        cartStore.removeItem(dishId);
        const next = { ...removingMap.value };
        delete next[dishId];
        removingMap.value = next;
      }, 250);
    };
    const onMinus = (dishId) => {
      const item = items.value.find((i) => i.dishId === dishId);
      if (item && item.quantity <= 1) {
        startRemove(dishId);
      } else {
        cartStore.decrement(dishId);
      }
    };
    const onPlus = (dishId) => {
      cartStore.increment(dishId);
    };
    const onRemove = (dishId) => {
      startRemove(dishId);
    };
    const onSubmit = () => {
      show.value = false;
      setTimeout(() => {
        emit("submit");
      }, 300);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: show.value ? 1 : "",
        c: common_vendor.o(onClose, "e5"),
        d: common_vendor.o(noop, "36"),
        e: items.value.length > 0
      }, items.value.length > 0 ? {
        f: common_vendor.t(totalKinds.value)
      } : {}, {
        g: items.value.length > 0
      }, items.value.length > 0 ? {
        h: common_vendor.p({
          name: "trash",
          size: 14
        }),
        i: common_vendor.o(onClear, "ed")
      } : {}, {
        j: items.value.length === 0
      }, items.value.length === 0 ? {
        k: common_vendor.o(onClose, "cb")
      } : {
        l: common_vendor.f(items.value, (item, idx, i0) => {
          return common_vendor.e({
            a: item.image
          }, item.image ? {
            b: item.image
          } : {
            c: common_vendor.t(item.type === "food" ? "🍲" : "☕")
          }, {
            d: common_vendor.t(item.name),
            e: common_vendor.t(item.description || "暂无描述"),
            f: "f070f07b-1-" + i0,
            g: common_vendor.o(($event) => onMinus(item.dishId), item.dishId),
            h: common_vendor.t(item.quantity),
            i: item.quantity,
            j: "f070f07b-2-" + i0,
            k: common_vendor.o(($event) => onPlus(item.dishId), item.dishId),
            l: "f070f07b-3-" + i0,
            m: common_vendor.o(($event) => onRemove(item.dishId), item.dishId),
            n: item.dishId,
            o: !!removingMap.value[item.dishId] ? 1 : "",
            p: common_vendor.s(removingMap.value[item.dishId] ? {} : {
              animationDelay: `${Math.min(idx, 8) * 40}ms`
            })
          });
        }),
        m: common_vendor.p({
          name: "minus",
          size: 14
        }),
        n: common_vendor.p({
          name: "plus",
          size: 14,
          color: "#fff"
        }),
        o: common_vendor.p({
          name: "trash",
          size: 14
        })
      }, {
        p: items.value.length === 0 ? 1 : "",
        q: items.value.length > 0
      }, items.value.length > 0 ? {
        r: common_vendor.o(onSubmit, "61")
      } : {}, {
        s: show.value ? 1 : "",
        t: common_vendor.n(themeClass.value)
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f070f07b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/cart-popup/cart-popup.js.map
