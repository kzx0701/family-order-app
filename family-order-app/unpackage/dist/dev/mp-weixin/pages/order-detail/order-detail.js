"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
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
      if (userStore.isAdmin) {
        if (s === "pending") {
          return { text: "开始制作", class: "btn-prep", type: "advance", target: "preparing" };
        }
        if (s === "preparing") {
          return { text: "标记完成", class: "btn-done", type: "advance", target: "completed" };
        }
        if (s === "completed") {
          return { text: "提醒取餐", class: "btn-pickup", type: "pickup" };
        }
      }
      return null;
    });
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
        const res = await common_vendor.wr.callFunction({
          name: "orders-crud",
          data: { action: "get", _id: id, token: userStore.token }
        });
        if (res.result.code !== 0) {
          throw new Error(res.result.message || "订单加载失败");
        }
        order.value = res.result.order || res.result.data || {};
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order-detail/order-detail.vue:317", "[order-detail] loadOrder error", e);
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
      if (btn.type === "pickup") {
        openPickupModal();
        return;
      }
      actionLoading.value = true;
      try {
        const res = await common_vendor.wr.callFunction({
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
        common_vendor.index.__f__("error", "at pages/order-detail/order-detail.vue:363", "[order-detail] onAction error", e);
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      } finally {
        actionLoading.value = false;
      }
    };
    const showPickupModal = common_vendor.ref(false);
    const pickupMethod = common_vendor.ref("");
    const pickupTip = common_vendor.ref("");
    const pickupSending = common_vendor.ref(false);
    const openPickupModal = () => {
      pickupMethod.value = "";
      pickupTip.value = "";
      showPickupModal.value = true;
    };
    const closePickupModal = () => {
      if (pickupSending.value)
        return;
      showPickupModal.value = false;
    };
    const onPickupMethodInput = (e) => {
      pickupMethod.value = e.detail.value || "";
    };
    const onPickupTipInput = (e) => {
      pickupTip.value = e.detail.value || "";
    };
    const onPickupConfirm = async () => {
      if (pickupSending.value)
        return;
      const method = pickupMethod.value.trim();
      const tip = pickupTip.value.trim();
      if (!method) {
        common_vendor.index.showToast({ title: "请填写取餐方式", icon: "none" });
        return;
      }
      if (!tip) {
        common_vendor.index.showToast({ title: "请填写温馨提示", icon: "none" });
        return;
      }
      pickupSending.value = true;
      try {
        const res = await common_vendor.wr.callFunction({
          name: "orders-crud",
          data: {
            action: "pickup",
            _id: orderId.value,
            pickupMethod: method,
            pickupTip: tip,
            token: userStore.token
          }
        });
        if (res.result.code !== 0) {
          common_vendor.index.showToast({ title: res.result.message || "发送失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({ title: "已发送取餐提醒", icon: "success" });
        showPickupModal.value = false;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order-detail/order-detail.vue:428", "[order-detail] pickup error", e);
        common_vendor.index.showToast({ title: "发送失败", icon: "none" });
      } finally {
        pickupSending.value = false;
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
        b: common_vendor.o(goBack, "38"),
        c: common_vendor.unref(statusBarHeight) + 32 + "px",
        d: loading.value
      }, loading.value ? {} : loadError.value ? {
        f: common_vendor.o(retryLoad, "66"),
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
        E: common_vendor.o(onBottomAction, "fb")
      }) : !loading.value && !loadError.value && (order.value.status === "cancelled" || order.value.status === "completed" && !common_vendor.unref(userStore).isAdmin) ? {
        G: common_vendor.t(order.value.status === "completed" ? "✓ 订单已完成" : "订单已取消"),
        H: common_vendor.n(order.value.status)
      } : {}, {
        F: !loading.value && !loadError.value && (order.value.status === "cancelled" || order.value.status === "completed" && !common_vendor.unref(userStore).isAdmin),
        I: showPickupModal.value
      }, showPickupModal.value ? {
        J: pickupMethod.value,
        K: showPickupModal.value,
        L: common_vendor.o(onPickupMethodInput, "c8"),
        M: pickupTip.value,
        N: common_vendor.o(onPickupTipInput, "7c"),
        O: common_vendor.o(closePickupModal, "2c"),
        P: common_vendor.t(pickupSending.value ? "发送中..." : "确认发送"),
        Q: pickupSending.value ? 1 : "",
        R: common_vendor.o(onPickupConfirm, "26"),
        S: common_vendor.o(() => {
        }, "4f"),
        T: common_vendor.o(closePickupModal, "4c")
      } : {}, {
        U: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-71729483"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order-detail/order-detail.js.map
