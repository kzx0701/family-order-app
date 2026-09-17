"use strict";
const common_vendor = require("../../common/vendor.js");
const placeholderStyle = "color: rgba(140, 114, 94, 0.55)";
const _sfc_main = {
  __name: "fo-dialog",
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: "" },
    // 标题下方的小字说明（可选）
    subtitle: { type: String, default: "" },
    // 输入模式：渲染内置输入框
    input: { type: Boolean, default: false },
    modelValue: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    maxlength: { type: [Number, String], default: 20 },
    // 打开时是否自动聚焦并唤起键盘。默认开启；纯提示类弹窗可关掉
    autoFocus: { type: Boolean, default: true },
    cancelText: { type: String, default: "取消" },
    confirmText: { type: String, default: "确定" },
    // 主按钮禁用（如输入为空时）
    confirmDisabled: { type: Boolean, default: false }
  },
  emits: ["close", "confirm", "update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const focused = common_vendor.ref(false);
    const closing = common_vendor.ref(false);
    common_vendor.watch(
      () => props.visible,
      (val) => {
        if (val) {
          common_vendor.nextTick$1(() => {
            closing.value = false;
          });
        }
      },
      { immediate: true }
    );
    const requestClose = () => {
      if (closing.value)
        return;
      closing.value = true;
      setTimeout(() => {
        emit("close");
      }, 180);
    };
    const onCancel = () => requestClose();
    const onConfirm = () => {
      if (props.confirmDisabled)
        return;
      emit("confirm");
    };
    const onInput = (e) => {
      emit("update:modelValue", e.detail.value);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: common_vendor.o(onCancel, "7a"),
        c: common_vendor.t(__props.title),
        d: __props.subtitle
      }, __props.subtitle ? {
        e: common_vendor.t(__props.subtitle)
      } : {}, {
        f: __props.input
      }, __props.input ? {
        g: __props.modelValue,
        h: __props.placeholder,
        i: __props.maxlength,
        j: __props.autoFocus,
        k: placeholderStyle,
        l: common_vendor.o(onInput, "e7"),
        m: common_vendor.o(($event) => focused.value = true, "10"),
        n: common_vendor.o(($event) => focused.value = false, "44"),
        o: common_vendor.o(onConfirm, "7d"),
        p: focused.value ? 1 : ""
      } : {}, {
        q: common_vendor.t(__props.cancelText),
        r: common_vendor.o(onCancel, "bb"),
        s: common_vendor.t(__props.confirmText),
        t: __props.confirmDisabled ? 1 : "",
        v: common_vendor.o(onConfirm, "b9"),
        w: closing.value ? 1 : ""
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4f6657b2"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/fo-dialog/fo-dialog.js.map
