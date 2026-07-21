"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "fo-switch",
  props: {
    // 开关状态
    modelValue: { type: Boolean, default: false },
    // 禁用
    disabled: { type: Boolean, default: false },
    // 开启时主色（默认咖啡棕）
    activeColor: { type: String, default: "" }
  },
  emits: ["update:modelValue", "change"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const onToggle = () => {
      if (props.disabled)
        return;
      const next = !props.modelValue;
      emit("update:modelValue", next);
      emit("change", next);
    };
    return (_ctx, _cache) => {
      return {
        a: __props.modelValue ? 1 : "",
        b: __props.disabled ? 1 : "",
        c: common_vendor.o(onToggle, "eb")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-041a9456"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/fo-switch/fo-switch.js.map
