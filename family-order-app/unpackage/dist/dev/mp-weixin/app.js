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
const _sfc_main = {
  onLaunch(options) {
    common_vendor.index.__f__("log", "at App.vue:8", "[App] onLaunch", options);
    this.bootstrap();
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.vue:20", "[App] onShow");
    const userStore = store_user.useUserStore();
    if (userStore.isLoggedIn && !userStore.role) {
      utils_roleGuard.ensureRoleSelected();
    }
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.vue:29", "[App] onHide");
  },
  methods: {
    async bootstrap() {
      try {
        const userStore = store_user.useUserStore();
        await userStore.restore();
        if (!userStore.isLoggedIn) {
          await userStore.login();
        }
        if (utils_roleGuard.ensureRoleSelected({ silent: true })) {
          return;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:53", "[App] bootstrap error", e);
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
  utils_roleGuard.setupRoleGuard();
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
