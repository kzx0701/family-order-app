"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "Icon",
  props: {
    // 图标名称（见 iconPaths 映射）
    name: { type: String, required: true },
    // 尺寸（同时设置宽高），单位 px
    size: { type: [Number, String], default: 24 },
    // 单独宽度（优先于 size）
    width: { type: [Number, String], default: null },
    // 单独高度（优先于 size）
    height: { type: [Number, String], default: null },
    // 描边线宽
    strokeWidth: { type: [Number, String], default: 2 },
    // 颜色（留空则继承父级 currentColor）
    color: { type: String, default: "" }
  },
  emits: ["click"],
  setup(__props) {
    const props = __props;
    const iconPaths = {
      // 首页
      home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
      // 餐具交叉（点单 tab）
      "utensils-crossed": '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.1 6.4-6.4"/><path d="m19 5-7 7"/>',
      // 列表（记录 tab）
      "clipboard-list": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
      // 返回
      "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
      // 购物车
      "shopping-cart": '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
      // 购物袋
      "shopping-bag": '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
      // 加号
      plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
      // 减号
      minus: '<path d="M5 12h14"/>',
      // 对勾
      check: '<path d="M20 6 9 17l-5-5"/>',
      // 时钟（预约时间）
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      // 备注（便签）
      note: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
      // 咖啡
      coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
      // 美食（餐具）
      food: '<path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
      // 关闭
      close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      // 右箭头
      "chevron-right": '<path d="m9 18 6-6-6-6"/>',
      // 上箭头（分类上移）
      "chevron-up": '<path d="m18 15-6-6-6 6"/>',
      // 下箭头（分类下移）
      "chevron-down": '<path d="m6 9 6 6 6-6"/>',
      // 刷新（重试按钮）
      "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
      // 星标
      star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
      // 用户（默认头像用）
      user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      // 编辑
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      // 删除
      trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
      // 上传
      upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
      // 设置（管理 tab）
      settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
    };
    const svgDataUri = common_vendor.computed(() => {
      const inner = iconPaths[props.name] || "";
      const sw = Number(props.strokeWidth) || 2;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    });
    const toPx = (val) => {
      if (val === null || val === void 0 || val === "")
        return null;
      return typeof val === "number" ? `${val}px` : String(val);
    };
    const iconStyle = common_vendor.computed(() => {
      const w = toPx(props.width ?? props.size);
      const h = toPx(props.height ?? props.size);
      const style = {
        width: w,
        height: h,
        "-webkit-mask-image": `url("${svgDataUri.value}")`,
        "mask-image": `url("${svgDataUri.value}")`
      };
      if (props.color) {
        style["background-color"] = props.color;
      }
      return style;
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.s(iconStyle.value),
        b: common_vendor.o(($event) => _ctx.$emit("click", $event), "4e")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-18283852"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/icons/Icon.js.map
