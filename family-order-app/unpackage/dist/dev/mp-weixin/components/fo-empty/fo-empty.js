"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "fo-empty",
  props: {
    text: { type: String, default: "暂无数据" },
    // emoji 图标
    icon: { type: String, default: "🍳" }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(__props.icon),
        b: common_vendor.t(__props.text)
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ca8ee2cb"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/fo-empty/fo-empty.js.map
