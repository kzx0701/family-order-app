"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_status_badge2 = common_vendor.resolveComponent("status-badge");
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  (_easycom_status_badge2 + _easycom_Icon2)();
}
const _easycom_status_badge = () => "../status-badge/status-badge.js";
const _easycom_Icon = () => "../icons/Icon.js";
if (!Math) {
  (_easycom_status_badge + _easycom_Icon)();
}
const _sfc_main = {
  __name: "order-card",
  props: {
    order: { type: Object, required: true },
    // 是否显示点单人（管理员视图）
    showUser: { type: Boolean, default: false },
    // 是否在 pending 状态显示取消按钮
    cancelable: { type: Boolean, default: false },
    // 是否允许点击卡片展开详情
    expandable: { type: Boolean, default: false }
  },
  emits: ["tap", "cancel"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const flashing = common_vendor.ref(false);
    const expanded = common_vendor.ref(false);
    const showCancel = common_vendor.computed(() => {
      if (!props.cancelable)
        return false;
      return props.order.status === "pending";
    });
    const displaySummary = common_vendor.computed(() => {
      if (props.order.summary)
        return props.order.summary;
      const items = props.order.items;
      if (!Array.isArray(items) || items.length === 0)
        return "订单详情";
      return items.map((i) => `${i.name} x${i.quantity}`).join(", ");
    });
    const displayEmoji = common_vendor.computed(() => {
      var _a;
      if (props.order.summaryEmoji)
        return props.order.summaryEmoji;
      const items = props.order.items;
      if (!Array.isArray(items) || items.length === 0)
        return "🍽️";
      return pickEmoji(((_a = items[0]) == null ? void 0 : _a.name) || "");
    });
    const formattedTime = common_vendor.computed(() => {
      const ts = props.order.createTime;
      if (!ts)
        return "";
      const d = new Date(ts);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    });
    const formattedReservation = common_vendor.computed(() => {
      if (!props.order.reservationTime)
        return "";
      const d = new Date(props.order.reservationTime);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${mm}-${dd} ${hh}:${mi}`;
    });
    const reservationText = common_vendor.computed(() => {
      const o = props.order;
      if (!o)
        return "";
      if (o.reservationType === "asap")
        return "尽快";
      if (o.reservationType === "scheduled" && o.reservationTime) {
        const d = new Date(o.reservationTime);
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
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${dayLabel} ${hh}:${mi}`;
      }
      return "";
    });
    const itemEmoji = (item) => pickEmoji((item == null ? void 0 : item.name) || "");
    const pickEmoji = (name) => {
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
    const onCardTap = () => {
      if (props.expandable) {
        expanded.value = !expanded.value;
        return;
      }
      emit("tap", { order: props.order });
    };
    const onCancel = () => {
      flashing.value = true;
      setTimeout(() => {
        flashing.value = false;
      }, 600);
      emit("cancel", { order: props.order });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(displayEmoji.value),
        b: common_vendor.t(displaySummary.value),
        c: common_vendor.t(formattedTime.value),
        d: __props.showUser && __props.order.userName
      }, __props.showUser && __props.order.userName ? {
        e: common_vendor.t(__props.order.userName)
      } : {}, {
        f: __props.expandable
      }, __props.expandable ? {
        g: common_vendor.t(expanded.value ? "收起" : "详情")
      } : {}, {
        h: common_vendor.p({
          status: __props.order.status
        }),
        i: reservationText.value
      }, reservationText.value ? {
        j: common_vendor.t(reservationText.value)
      } : {}, {
        k: showCancel.value
      }, showCancel.value ? common_vendor.e({
        l: showCancel.value
      }, showCancel.value ? {
        m: common_vendor.o(onCancel, "81")
      } : {}) : {}, {
        n: flashing.value ? 1 : "",
        o: __props.expandable && expanded.value ? 1 : "",
        p: common_vendor.o(onCardTap, "5d"),
        q: __props.expandable && expanded.value
      }, __props.expandable && expanded.value ? common_vendor.e({
        r: common_vendor.f(__props.order.items, (item, idx, i0) => {
          return common_vendor.e({
            a: item.image
          }, item.image ? {
            b: item.image
          } : {
            c: common_vendor.t(itemEmoji(item))
          }, {
            d: common_vendor.t(item.name),
            e: common_vendor.t(item.quantity),
            f: idx
          });
        }),
        s: __props.order.reservationType === "scheduled" && __props.order.reservationTime
      }, __props.order.reservationType === "scheduled" && __props.order.reservationTime ? {
        t: common_vendor.p({
          name: "clock",
          size: 14
        }),
        v: common_vendor.t(formattedReservation.value)
      } : {}, {
        w: __props.order.note
      }, __props.order.note ? {
        x: common_vendor.p({
          name: "note",
          size: 14
        }),
        y: common_vendor.t(__props.order.note)
      } : {}) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1ab9fcf6"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/order-card/order-card.js.map
