"use strict";
const common_vendor = require("../../common/vendor.js");
const store_cart = require("../../store/cart.js");
const store_user = require("../../store/user.js");
const utils_wxConfig = require("../../utils/wx-config.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
if (!Math) {
  _easycom_Icon();
}
const _sfc_main = {
  __name: "submit",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const cartStore = store_cart.useCartStore();
    const userStore = store_user.useUserStore();
    const cartItems = common_vendor.computed(() => cartStore.activeItems);
    const totalCount = common_vendor.computed(() => cartStore.totalCount);
    const userName = common_vendor.computed(() => userStore.nickname || "我");
    const userAvatar = common_vendor.computed(() => userStore.avatar);
    const themeClass = common_vendor.computed(() => {
      var _a;
      const firstType = ((_a = cartItems.value[0]) == null ? void 0 : _a.type) || "coffee";
      return `theme-${firstType}`;
    });
    const reservationType = common_vendor.ref("asap");
    const scheduledDate = common_vendor.ref(0);
    const scheduledTime = common_vendor.ref(getDefaultTime());
    const note = common_vendor.ref("");
    const dateOptions = [
      { value: 0, label: "今天" },
      { value: 1, label: "明天" },
      { value: 2, label: "后天" }
    ];
    const submitting = common_vendor.ref(false);
    const leaving = common_vendor.ref(false);
    const COMPLETE_NOTIFY_TPL = utils_wxConfig.WX_CONFIG.subscribeTemplates.completeNotify;
    const PICKUP_NOTIFY_TPL = utils_wxConfig.WX_CONFIG.subscribeTemplates.pickupNotify;
    const dishEmoji = (type) => type === "food" ? "🍲" : "☕";
    function getDefaultTime() {
      const now = /* @__PURE__ */ new Date();
      let h = now.getHours();
      let m = now.getMinutes();
      if (m > 30) {
        h += 1;
        m = 0;
      } else if (m > 0) {
        m = 30;
      }
      if (h >= 24)
        h = 23;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    const setReservation = (type) => {
      reservationType.value = type;
    };
    const onTimeChange = (e) => {
      scheduledTime.value = e.detail.value;
    };
    const computeReservationTimestamp = () => {
      const now = /* @__PURE__ */ new Date();
      const target = new Date(now);
      target.setDate(target.getDate() + scheduledDate.value);
      const [h, m] = scheduledTime.value.split(":").map(Number);
      target.setHours(h, m, 0, 0);
      return target.getTime();
    };
    const requestSubscribe = () => {
      return new Promise((resolve) => {
        const tmplIds = [COMPLETE_NOTIFY_TPL, PICKUP_NOTIFY_TPL].filter((id) => !!id);
        if (tmplIds.length === 0) {
          common_vendor.index.__f__("warn", "at pages/submit/submit.vue:227", "[submit] 订阅消息模板 ID 未配置，跳过授权");
          resolve(null);
          return;
        }
        common_vendor.index.requestSubscribeMessage({
          tmplIds,
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/submit/submit.vue:236", "[submit] 订阅消息授权结果", res);
            resolve(res);
          },
          fail: (err) => {
            common_vendor.index.__f__("warn", "at pages/submit/submit.vue:240", "[submit] 订阅消息授权失败", err);
            resolve(null);
          }
        });
      });
    };
    const onSubmit = async () => {
      var _a, _b;
      if (submitting.value)
        return;
      if (cartItems.value.length === 0) {
        common_vendor.index.showToast({ title: "购物车为空", icon: "none" });
        return;
      }
      if (reservationType.value === "scheduled") {
        const ts = computeReservationTimestamp();
        if (ts < Date.now()) {
          common_vendor.index.showToast({ title: "指定时间需晚于当前时间", icon: "none" });
          return;
        }
      }
      submitting.value = true;
      try {
        await requestSubscribe();
        const res = await common_vendor._r.callFunction({
          name: "orders-crud",
          data: {
            action: "create",
            token: userStore.token,
            items: cartStore.activeItems.map((i) => ({
              dishId: i.dishId,
              name: i.name,
              image: i.image,
              quantity: i.quantity,
              type: i.type
            })),
            reservationType: reservationType.value,
            reservationTime: reservationType.value === "scheduled" ? computeReservationTimestamp() : null,
            note: note.value
          }
        });
        if (res.result.code !== 0) {
          throw new Error(res.result.message || "下单失败");
        }
        const orderId = res.result.orderId || ((_a = res.result.data) == null ? void 0 : _a._id) || ((_b = res.result.data) == null ? void 0 : _b.orderId);
        leaving.value = true;
        cartStore.clearCart();
        common_vendor.index.redirectTo({
          url: `/pages/order-success/order-success?id=${orderId}`
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/submit/submit.vue:314", "[submit] 下单失败", e);
        const msg = (e == null ? void 0 : e.message) || "";
        if (msg.indexOf("未授权") > -1 || msg.indexOf("登录") > -1) {
          userStore.logout();
          common_vendor.index.showModal({
            title: "登录已失效",
            content: "登录状态已过期，请重启小程序后重试",
            showCancel: false,
            confirmText: "我知道了"
          });
        } else {
          common_vendor.index.showToast({ title: msg || "下单失败，请重试", icon: "none" });
        }
      } finally {
        submitting.value = false;
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onShow(() => {
      if (leaving.value)
        return;
      if (cartStore.activeItems.length === 0) {
        common_vendor.index.showToast({ title: "购物车为空", icon: "none" });
        setTimeout(() => common_vendor.index.navigateBack(), 500);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "arrow-left",
          size: 20
        }),
        b: common_vendor.o(goBack, "61"),
        c: common_vendor.unref(statusBarHeight) + 32 + "px",
        d: common_vendor.t(totalCount.value),
        e: common_vendor.t(cartItems.value.length),
        f: common_vendor.f(cartItems.value, (item, idx, i0) => {
          return common_vendor.e({
            a: item.image
          }, item.image ? {
            b: item.image
          } : {
            c: common_vendor.t(dishEmoji(item.type))
          }, {
            d: common_vendor.t(item.name),
            e: item.description
          }, item.description ? {
            f: common_vendor.t(item.description)
          } : {}, {
            g: common_vendor.t(item.quantity),
            h: item.dishId,
            i: idx * 60 + "ms"
          });
        }),
        g: common_vendor.p({
          name: "clock",
          size: 16
        }),
        h: reservationType.value === "asap" ? 1 : "",
        i: common_vendor.o(($event) => setReservation("asap"), "09"),
        j: reservationType.value === "scheduled" ? 1 : "",
        k: common_vendor.o(($event) => setReservation("scheduled"), "38"),
        l: reservationType.value === "scheduled"
      }, reservationType.value === "scheduled" ? {
        m: common_vendor.f(dateOptions, (opt, k0, i0) => {
          return {
            a: common_vendor.t(opt.label),
            b: opt.value,
            c: scheduledDate.value === opt.value ? 1 : "",
            d: common_vendor.o(($event) => scheduledDate.value = opt.value, opt.value)
          };
        }),
        n: common_vendor.t(scheduledTime.value),
        o: common_vendor.p({
          name: "chevron-down",
          size: 16
        }),
        p: scheduledTime.value,
        q: common_vendor.o(onTimeChange, "46")
      } : {}, {
        r: common_vendor.p({
          name: "note",
          size: 16
        }),
        s: note.value,
        t: common_vendor.o(($event) => note.value = $event.detail.value, "3a"),
        v: common_vendor.t(note.value.length),
        w: userAvatar.value
      }, userAvatar.value ? {
        x: userAvatar.value
      } : {}, {
        y: common_vendor.t(userName.value),
        z: submitting.value
      }, submitting.value ? {} : {}, {
        A: common_vendor.t(submitting.value ? "提交中..." : "提交点单"),
        B: submitting.value ? 1 : "",
        C: common_vendor.o(onSubmit, "18"),
        D: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-61228d3b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/submit/submit.js.map
