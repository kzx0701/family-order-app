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
  __name: "fo-sheet",
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: "" },
    // 整个 sheet 的最大高度（含标题栏与底部操作区，如 76vh）
    maxHeight: { type: String, default: "76vh" }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const slots = common_vendor.useSlots();
    const hasFooter = common_vendor.computed(() => !!slots.footer);
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
    const contentStyle = common_vendor.computed(() => ({
      maxHeight: `calc(${props.maxHeight} - ${hasFooter.value ? "264rpx" : "140rpx"})`
    }));
    const onClose = () => {
      show.value = false;
      setTimeout(() => {
        emit("close");
      }, 320);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: common_vendor.o(onClose, "e1"),
        c: common_vendor.t(__props.title),
        d: common_vendor.p({
          name: "close",
          size: 20
        }),
        e: common_vendor.o(onClose, "27"),
        f: common_vendor.s(contentStyle.value),
        g: hasFooter.value
      }, hasFooter.value ? {} : {}, {
        h: show.value ? 1 : ""
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-23c57873"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/fo-sheet/fo-sheet.js.map
