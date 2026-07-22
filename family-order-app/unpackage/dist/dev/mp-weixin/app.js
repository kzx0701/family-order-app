"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_user = require("./store/user.js");
if (!Math) {
  "./pages/home/home.js";
  "./pages/order/order.js";
  "./pages/record/record.js";
  "./pages/admin/admin.js";
  "./pages/dish-detail/dish-detail.js";
  "./pages/order-detail/order-detail.js";
  "./pages/submit/submit.js";
  "./pages/order-success/order-success.js";
  "./pages/role-select/role-select.js";
}
const _sfc_main = {
  onLaunch(options) {
    common_vendor.index.__f__("log", "at App.vue:7", "[App] onLaunch", options);
    this.setupPrivacyHandler();
    this.bootstrap();
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.vue:19", "[App] onShow");
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.vue:22", "[App] onHide");
  },
  methods: {
    // 隐私授权处理：当用户首次使用相册/摄像头等隐私接口时弹窗确认
    setupPrivacyHandler() {
      if (common_vendor.wx$1.onNeedPrivacyAuthorization) {
        common_vendor.wx$1.onNeedPrivacyAuthorization((resolve) => {
          common_vendor.wx$1.showModal({
            title: "隐私保护提示",
            content: "为了上传菜品图片，需要使用您的相册和摄像头权限，是否同意？",
            confirmText: "同意",
            cancelText: "拒绝",
            success: (res) => {
              if (res.confirm) {
                resolve({ event: "agree" });
              } else {
                resolve({ event: "disagree" });
              }
            }
          });
        });
      }
    },
    async bootstrap() {
      try {
        const userStore = store_user.useUserStore();
        await userStore.restore();
        if (!userStore.isLoggedIn) {
          await userStore.login();
        }
        if (!userStore.role) {
          common_vendor.index.reLaunch({ url: "/pages/role-select/role-select" });
          return;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:71", "[App] bootstrap error", e);
        common_vendor.index.showToast({
          title: "登录失败，请重试",
          icon: "none",
          duration: 2e3
        });
      }
    }
    // applyTabBarByRole 已移除：自定义 tabBar 模式下原生 API 不可用，
    // 由 custom-tabbar 组件根据 userStore.role 响应式渲染 tab 数量
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
