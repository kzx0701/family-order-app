"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const _sfc_main = {
  __name: "dish-card",
  props: {
    // 菜品对象：{ dishId, name, image, description, type, categoryName, ... }
    dish: { type: Object, required: true },
    // 在列表中的序号（用于错落入场动画的延迟）
    index: { type: Number, default: 0 }
  },
  emits: ["add-to-cart", "tap"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const emoji = common_vendor.computed(() => props.dish.type === "food" ? "🍲" : "☕");
    const showTemp = common_vendor.computed(() => props.dish.type === "coffee" && !!props.dish.temp);
    const tempClass = common_vendor.computed(() => showTemp.value ? `temp-${props.dish.temp}` : "");
    const instance = common_vendor.getCurrentInstance();
    const onCardTap = () => {
      emit("tap", props.dish);
    };
    const onAddTap = (e) => {
      const query = common_vendor.index.createSelectorQuery().in(instance.proxy);
      query.select(".add-btn").boundingClientRect((rect) => {
        const x = rect ? rect.left + rect.width / 2 : e.detail && e.detail.x || 0;
        const y = rect ? rect.top + rect.height / 2 : e.detail && e.detail.y || 0;
        emit("add-to-cart", { dish: props.dish, originX: x, originY: y });
      }).exec();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.dish.image
      }, __props.dish.image ? {
        b: __props.dish.image
      } : {
        c: common_vendor.t(emoji.value)
      }, {
        d: showTemp.value
      }, showTemp.value ? common_vendor.e({
        e: __props.dish.temp === "hot"
      }, __props.dish.temp === "hot" ? {} : {}, {
        f: common_vendor.n(__props.dish.temp)
      }) : {}, {
        g: showTemp.value
      }, showTemp.value ? {
        h: common_vendor.t(__props.dish.temp === "ice" ? "❄" : "🔥"),
        i: common_vendor.t(__props.dish.temp === "ice" ? "冰" : "热"),
        j: common_vendor.n(__props.dish.temp)
      } : {}, {
        k: common_vendor.t(__props.dish.name),
        l: common_vendor.t(__props.dish.description || "暂无描述"),
        m: __props.dish.categoryName
      }, __props.dish.categoryName ? {
        n: common_vendor.t(__props.dish.categoryName)
      } : {}, {
        o: common_vendor.p({
          name: "plus",
          size: 18,
          color: "#fff"
        }),
        p: common_vendor.o(onAddTap, "6c"),
        q: common_vendor.n(tempClass.value),
        r: `${__props.index * 50}ms`,
        s: common_vendor.o(onCardTap, "24")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-215fb416"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/dish-card/dish-card.js.map
