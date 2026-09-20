"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  __name: "recipe-art",
  props: { index: { type: Number, default: 0 }, label: { type: String, default: "菜品插画" } },
  setup(__props) {
    const props = __props;
    const bands = [[0, 425], [425, 840], [840, 1330]];
    const position = common_vendor.computed(() => {
      const [top, bottom] = bands[Math.floor(props.index / 2)] || bands[0];
      return { left: -(props.index % 2) * 100 + "%", top: -top / (bottom - top) * 100 + "%", height: 1330 / (bottom - top) * 100 + "%" };
    });
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0$1,
        b: common_vendor.s(position.value),
        c: common_vendor.n("art-" + __props.index),
        d: __props.label
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-36d9182a"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/recipe-art/recipe-art.js.map
