"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "fo-input",
  props: {
    modelValue: { type: String, default: "" },
    label: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    type: { type: String, default: "text" },
    // text | textarea
    required: { type: Boolean, default: false },
    error: { type: String, default: "" },
    maxlength: { type: [Number, String], default: -1 }
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const placeholderStyle = common_vendor.computed(
      () => "color: #A8A29E"
    );
    const onInput = (e) => {
      emit("update:modelValue", e.detail.value);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.label
      }, __props.label ? common_vendor.e({
        b: common_vendor.t(__props.label),
        c: __props.required
      }, __props.required ? {} : {}) : {}, {
        d: __props.type === "textarea"
      }, __props.type === "textarea" ? {
        e: __props.modelValue,
        f: __props.placeholder,
        g: __props.maxlength,
        h: placeholderStyle.value,
        i: common_vendor.o(onInput, "f0")
      } : {
        j: __props.modelValue,
        k: __props.placeholder,
        l: placeholderStyle.value,
        m: common_vendor.o(onInput, "1f")
      }, {
        n: __props.error
      }, __props.error ? {
        o: common_vendor.t(__props.error)
      } : {}, {
        p: !!__props.error ? 1 : ""
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cca7a573"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/fo-input/fo-input.js.map
