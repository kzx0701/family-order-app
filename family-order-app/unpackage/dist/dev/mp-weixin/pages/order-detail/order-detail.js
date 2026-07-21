"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
const utils_wxConfig = require("../../utils/wx-config.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_error_state2 = common_vendor.resolveComponent("error-state");
  (_easycom_Icon2 + _easycom_error_state2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_error_state = () => "../../components/error-state/error-state.js";
if (!Math) {
  (_easycom_Icon + _easycom_error_state)();
}
const _sfc_main = {
  __name: "order-detail",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const orderId = common_vendor.ref("");
    const order = common_vendor.ref({});
    const loading = common_vendor.ref(true);
    const loadError = common_vendor.ref("");
    const actionLoading = common_vendor.ref(false);
    const STATUS_MAP = {
      pending: { label: "待制作", bg: "#FFF7ED", fg: "#C2410C" },
      preparing: { label: "制作中", bg: "#EFF6FF", fg: "#1D4ED8" },
      completed: { label: "已完成", bg: "#F0FDF4", fg: "#15803D" },
      cancelled: { label: "已取消", bg: "#F9FAFB", fg: "#6B7280" }
    };
    const statusInfo = common_vendor.computed(() => STATUS_MAP[order.value.status] || STATUS_MAP.pending);
    const statusLabel = common_vendor.computed(() => statusInfo.value.label);
    const badgeStyle = common_vendor.computed(() => ({
      backgroundColor: statusInfo.value.bg,
      color: statusInfo.value.fg
    }));
    const themeClass = common_vendor.computed(() => {
      var _a, _b;
      const firstType = ((_b = (_a = order.value.items) == null ? void 0 : _a[0]) == null ? void 0 : _b.type) || "coffee";
      return `theme-${firstType}`;
    });
    const progressWidth = common_vendor.computed(() => {
      switch (order.value.status) {
        case "pending":
          return "0%";
        case "preparing":
          return "50%";
        case "completed":
          return "100%";
        default:
          return "0%";
      }
    });
    const orderItems = common_vendor.computed(() => order.value.items || []);
    const totalQty = common_vendor.computed(() => {
      return orderItems.value.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    });
    const reservationText = common_vendor.computed(() => {
      const o = order.value;
      if (!o)
        return "";
      if (o.reservationType === "asap" || !o.reservationTime)
        return "尽快";
      return formatReservation(o.reservationTime);
    });
    const submitTimeText = common_vendor.computed(() => {
      const ts = order.value.createTime;
      if (!ts)
        return "";
      return formatDateTime(ts);
    });
    const bottomButton = common_vendor.computed(() => {
      if (actionLoading.value)
        return null;
      const s = order.value.status;
      if (s === "completed" || s === "cancelled")
        return null;
      if (userStore.isAdmin) {
        if (s === "pending") {
          return { text: "开始制作", class: "btn-prep", type: "advance", target: "preparing" };
        }
        if (s === "preparing") {
          return { text: "标记完成", class: "btn-done", type: "advance", target: "completed" };
        }
      } else {
        return { text: "催单", class: "btn-urge", type: "urge" };
      }
      return null;
    });
    const URGE_TEMPLATE_ID = utils_wxConfig.WX_CONFIG.subscribeTemplates.urgeNotify;
    const formatDateTime = (ts) => {
      const d = new Date(ts);
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${M}-${D} ${h}:${m}`;
    };
    const formatReservation = (ts) => {
      const d = new Date(ts);
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = Math.round((target - today) / 864e5);
      let dayLabel;
      if (diffDays === 0)
        dayLabel = "今天";
      else if (diffDays === 1)
        dayLabel = "明天";
      else if (diffDays === 2)
        dayLabel = "后天";
      else
        dayLabel = `${d.getMonth() + 1}月${d.getDate()}日`;
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${dayLabel} ${h}:${m}`;
    };
    const dishEmoji = (item) => {
      const name = (item == null ? void 0 : item.name) || "";
      if (/咖啡|拿铁|美式|卡布|摩卡|玛奇朵|浓缩|阿芙|澳白|意式|espresso|latte|americano|cappuccino|mocha/i.test(name))
        return "☕";
      if (/面包|吐司|蛋糕|可颂|牛角|曲奇|松饼|玛芬|donut|cake/i.test(name))
        return "🥐";
      if (/面|粉|粥|拉面|乌冬|noodle/i.test(name))
        return "🍜";
      if (/饭|炒饭|盖饭|咖喱|便当/i.test(name))
        return "🍚";
      if (/沙律|沙拉|salad/i.test(name))
        return "🥗";
      if (/汤|羹/i.test(name))
        return "🍲";
      return "🍽️";
    };
    const loadOrder = async (id) => {
      loading.value = true;
      loadError.value = "";
      try {
        const res = await common_vendor._r.callFunction({
          name: "orders-crud",
          data: { action: "get", _id: id, token: userStore.token }
        });
        if (res.result.code !== 0) {
          throw new Error(res.result.message || "订单加载失败");
        }
        order.value = res.result.order || res.result.data || {};
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order-detail/order-detail.vue:274", "[order-detail] loadOrder error", e);
        loadError.value = e.message || "订单加载失败，请稍后重试";
      } finally {
        loading.value = false;
      }
    };
    const retryLoad = () => {
      if (orderId.value)
        loadOrder(orderId.value);
    };
    const onBottomAction = async () => {
      const btn = bottomButton.value;
      if (!btn || actionLoading.value)
        return;
      if (btn.type === "urge") {
        await onUrge();
        return;
      }
      actionLoading.value = true;
      try {
        const res = await common_vendor._r.callFunction({
          name: "orders-crud",
          data: {
            action: "updateStatus",
            _id: orderId.value,
            status: btn.target,
            token: userStore.token
          }
        });
        if (res.result.code !== 0) {
          common_vendor.index.showToast({ title: res.result.message || "操作失败", icon: "none" });
          return;
        }
        order.value = { ...order.value, status: btn.target };
        common_vendor.index.showToast({
          title: btn.target === "preparing" ? "已开始制作" : "已完成",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order-detail/order-detail.vue:320", "[order-detail] onAction error", e);
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      } finally {
        actionLoading.value = false;
      }
    };
    const onUrge = async () => {
      if (actionLoading.value)
        return;
      actionLoading.value = true;
      try {
        if (!URGE_TEMPLATE_ID) {
          common_vendor.index.__f__("warn", "at pages/order-detail/order-detail.vue:338", "[order-detail] 未配置催单模板 ID，跳过订阅消息授权");
          await callUrgeCloudFunction();
          return;
        }
        const subscribeRes = await new Promise((resolve) => {
          common_vendor.wx$1.requestSubscribeMessage({
            tmplIds: [URGE_TEMPLATE_ID],
            success: resolve,
            fail: (err) => {
              common_vendor.index.__f__("warn", "at pages/order-detail/order-detail.vue:349", "[order-detail] requestSubscribeMessage fail", err);
              resolve(null);
            }
          });
        });
        if (!subscribeRes || subscribeRes[URGE_TEMPLATE_ID] !== "accept") {
          common_vendor.index.showModal({
            title: "提示",
            content: "需要订阅消息授权才能通知管理员，是否继续催单？",
            confirmText: "继续催单",
            cancelText: "取消",
            success: async (r) => {
              if (r.confirm) {
                await callUrgeCloudFunction();
              }
            }
          });
          return;
        }
        await callUrgeCloudFunction();
      } finally {
        actionLoading.value = false;
      }
    };
    const callUrgeCloudFunction = async () => {
      try {
        const res = await common_vendor._r.callFunction({
          name: "orders-crud",
          data: {
            action: "urge",
            _id: orderId.value,
            token: userStore.token
          }
        });
        if (res.result.code !== 0) {
          common_vendor.index.showToast({ title: res.result.message || "催单失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({ title: "已通知管理员加急", icon: "success" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order-detail/order-detail.vue:396", "[order-detail] urge error", e);
        common_vendor.index.showToast({ title: "催单失败", icon: "none" });
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onLoad((options) => {
      const id = (options == null ? void 0 : options.id) || "";
      orderId.value = id;
      if (id) {
        loadOrder(id);
      } else {
        loading.value = false;
        loadError.value = "订单参数缺失";
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "arrow-left",
          size: 20
        }),
        b: common_vendor.o(goBack, "ad"),
        c: common_vendor.unref(statusBarHeight) + 20 + "px",
        d: loading.value
      }, loading.value ? {} : loadError.value ? {
        f: common_vendor.o(retryLoad, "62"),
        g: common_vendor.p({
          emoji: "😵",
          title: "订单加载失败",
          desc: loadError.value,
          ["retry-text"]: "重新加载"
        })
      } : common_vendor.e({
        h: common_vendor.t(statusLabel.value),
        i: common_vendor.s(badgeStyle.value),
        j: progressWidth.value,
        k: order.value.status === "pending" ? 1 : "",
        l: order.value.status === "preparing" ? 1 : "",
        m: order.value.status === "completed" ? 1 : "",
        n: common_vendor.t(orderItems.value.length),
        o: common_vendor.t(totalQty.value),
        p: common_vendor.f(orderItems.value, (item, idx, i0) => {
          return common_vendor.e({
            a: item.image
          }, item.image ? {
            b: item.image
          } : {
            c: common_vendor.t(dishEmoji(item))
          }, {
            d: common_vendor.t(item.name),
            e: common_vendor.t(item.quantity),
            f: idx
          });
        }),
        q: common_vendor.p({
          name: "clock",
          size: 16
        }),
        r: common_vendor.t(reservationText.value),
        s: common_vendor.p({
          name: "note",
          size: 16
        }),
        t: common_vendor.t(submitTimeText.value),
        v: common_vendor.p({
          name: "utensils-crossed",
          size: 16
        }),
        w: common_vendor.t(order.value.userName || "我"),
        x: order.value.note
      }, order.value.note ? {
        y: common_vendor.p({
          name: "note",
          size: 16
        }),
        z: common_vendor.t(order.value.note)
      } : {}), {
        e: loadError.value,
        A: !loading.value && !loadError.value && bottomButton.value
      }, !loading.value && !loadError.value && bottomButton.value ? common_vendor.e({
        B: actionLoading.value
      }, actionLoading.value ? {} : {}, {
        C: common_vendor.t(bottomButton.value.text),
        D: common_vendor.n(bottomButton.value.class),
        E: common_vendor.o(onBottomAction, "4f")
      }) : !loading.value && !loadError.value && (order.value.status === "completed" || order.value.status === "cancelled") ? {
        G: common_vendor.t(order.value.status === "completed" ? "✓ 订单已完成" : "订单已取消"),
        H: common_vendor.n(order.value.status)
      } : {}, {
        F: !loading.value && !loadError.value && (order.value.status === "completed" || order.value.status === "cancelled"),
        I: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-71729483"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order-detail/order-detail.js.map
