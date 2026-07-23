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
  __name: "error-state",
  props: {
    // emoji 图标
    emoji: { type: String, default: "😵" },
    // 错误标题
    title: { type: String, default: "加载失败" },
    // 错误描述（可选）
    desc: { type: String, default: "" },
    // 是否显示重试按钮
    showRetry: { type: Boolean, default: true },
    // 重试按钮文案
    retryText: { type: String, default: "重试" }
  },
  emits: ["retry"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const retrying = common_vendor.ref(false);
    const onRetry = async () => {
      if (retrying.value)
        return;
      retrying.value = true;
      emit("retry");
      setTimeout(() => {
        retrying.value = false;
      }, 3e3);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(__props.emoji),
        b: common_vendor.t(__props.title),
        c: __props.desc
      }, __props.desc ? {
        d: common_vendor.t(__props.desc)
      } : {}, {
        e: __props.showRetry
      }, __props.showRetry ? {
        f: common_vendor.p({
          name: "refresh-cw",
          size: 14
        }),
        g: retrying.value ? 1 : "",
        h: common_vendor.t(__props.retryText),
        i: common_vendor.o(onRetry, "d8")
      } : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6ef95da6"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/error-state/error-state.js.map
