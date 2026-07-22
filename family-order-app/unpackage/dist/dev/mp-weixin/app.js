"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_user = require("./store/user.js");
const utils_roleGuard = require("./utils/role-guard.js");
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
function showLoginError(message, retry) {
  common_vendor.index.showModal({
    title: "登录失败",
    content: message || "请检查网络后重试",
    showCancel: false,
    confirmText: "重新登录",
    success: () => retry()
  });
}
const _sfc_main = {
  onLaunch(options) {
    common_vendor.index.__f__("log", "at App.vue:23", "[App] onLaunch", options);
    this.bootstrap();
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.vue:35", "[App] onShow");
    const userStore = store_user.useUserStore();
    if (userStore.isLoggedIn && !userStore.role) {
      utils_roleGuard.ensureRoleSelected();
    }
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.vue:44", "[App] onHide");
  },
  methods: {
    async bootstrap() {
      common_vendor.index.showLoading({ title: "正在登录...", mask: true });
      try {
        const userStore = store_user.useUserStore();
        await userStore.restore();
        if (!userStore.isLoggedIn) {
          common_vendor.index.__f__("log", "at App.vue:59", "[App] 未检测到登录态，开始微信一键登录");
          await userStore.login();
          common_vendor.index.__f__("log", "at App.vue:61", "[App] 微信一键登录成功", userStore.openid);
        } else {
          common_vendor.index.__f__("log", "at App.vue:63", "[App] 已从本地恢复登录态", userStore.openid);
        }
        common_vendor.index.hideLoading();
        if (utils_roleGuard.ensureRoleSelected({ silent: true })) {
          return;
        }
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at App.vue:77", "[App] bootstrap error", e);
        showLoginError(e.message || "登录失败，请重试", () => this.bootstrap());
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
  utils_roleGuard.setupRoleGuard();
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
