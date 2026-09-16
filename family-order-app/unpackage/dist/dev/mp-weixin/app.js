"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_user = require("./store/user.js");
const utils_authGuard = require("./utils/auth-guard.js");
if (!Math) {
  "./pages/login/login.js";
  "./pages/onboarding/onboarding.js";
  "./pages/home/home.js";
  "./pages/order/order.js";
  "./pages/recipe/recipe.js";
  "./pages/my/my.js";
  "./pages/record/record.js";
  "./pages/admin/admin.js";
  "./pages/dish-detail/dish-detail.js";
  "./pages/order-detail/order-detail.js";
  "./pages/submit/submit.js";
  "./pages/order-success/order-success.js";
}
let bootstrapped = false;
const _sfc_main = {
  onLaunch(options) {
    common_vendor.index.__f__("log", "at App.vue:20", "[App] onLaunch", options);
    this.bootstrap();
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.vue:32", "[App] onShow");
    if (!bootstrapped)
      return;
    utils_authGuard.ensureAuth({ silent: true });
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.vue:40", "[App] onHide");
  },
  methods: {
    async bootstrap() {
      try {
        const userStore = store_user.useUserStore();
        await userStore.restore();
        common_vendor.index.__f__(
          "log",
          "at App.vue:48",
          userStore.isLoggedIn ? `[App] 已恢复本地登录态 ${userStore.openid}` : "[App] 未检测到登录态，待用户手动登录"
        );
      } catch (e) {
        common_vendor.index.__f__("error", "at App.vue:54", "[App] bootstrap error", e);
      } finally {
        bootstrapped = true;
        utils_authGuard.ensureAuth({ silent: true });
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  utils_authGuard.setupAuthGuard();
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
