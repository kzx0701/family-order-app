"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "default-avatar",
  props: {
    role: { type: String, default: "admin" }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.role === "admin"
      }, __props.role === "admin" ? {} : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-aac8b966"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/default-avatar/default-avatar.js.map
