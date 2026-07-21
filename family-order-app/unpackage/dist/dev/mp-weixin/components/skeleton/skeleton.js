"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "skeleton",
  props: {
    // 骨架类型：card / dish / list / line
    type: { type: String, default: "card" },
    // 占位数量
    count: { type: Number, default: 3 }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.type === "card"
      }, __props.type === "card" ? {
        b: common_vendor.f(__props.count, (i, k0, i0) => {
          return {
            a: i,
            b: i === 1 ? 1 : ""
          };
        })
      } : __props.type === "dish" ? {
        d: common_vendor.f(__props.count, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : __props.type === "list" ? {
        f: common_vendor.f(__props.count, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : {
        g: common_vendor.f(__props.count, (i, k0, i0) => {
          return {
            a: i
          };
        })
      }, {
        c: __props.type === "dish",
        e: __props.type === "list"
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-54f1e491"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/skeleton/skeleton.js.map
