"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "status-badge",
  props: {
    status: { type: String, required: true }
  },
  setup(__props) {
    const props = __props;
    const STATUS_MAP = {
      pending: { label: "待制作", bg: "#FFF7ED", fg: "#C2410C", dot: "#FB923C" },
      // 暖橙
      preparing: { label: "制作中", bg: "#EFF6FF", fg: "#1D4ED8", dot: "#3B82F6" },
      // 蓝色
      completed: { label: "已完成", bg: "#F0FDF4", fg: "#15803D", dot: "#22C55E" },
      // 绿色
      cancelled: { label: "已取消", bg: "#F9FAFB", fg: "#6B7280", dot: "#9CA3AF" }
      // 灰色
    };
    const info = common_vendor.computed(() => STATUS_MAP[props.status] || STATUS_MAP.pending);
    const label = common_vendor.computed(() => info.value.label);
    const badgeStyle = common_vendor.computed(() => ({
      backgroundColor: info.value.bg,
      color: info.value.fg
    }));
    const dotStyle = common_vendor.computed(() => ({
      backgroundColor: info.value.dot
    }));
    return (_ctx, _cache) => {
      return {
        a: common_vendor.s(dotStyle.value),
        b: common_vendor.t(label.value),
        c: common_vendor.s(badgeStyle.value)
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e1449fbd"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/status-badge/status-badge.js.map
