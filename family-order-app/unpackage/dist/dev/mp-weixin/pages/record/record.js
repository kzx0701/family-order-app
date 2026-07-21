"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const composables_useHeaderFixed = require("../../composables/useHeaderFixed.js");
if (!Array) {
  const _easycom_skeleton2 = common_vendor.resolveComponent("skeleton");
  const _easycom_fo_empty2 = common_vendor.resolveComponent("fo-empty");
  const _easycom_status_badge2 = common_vendor.resolveComponent("status-badge");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_skeleton2 + _easycom_fo_empty2 + _easycom_status_badge2 + _easycom_custom_tabbar2)();
}
const _easycom_skeleton = () => "../../components/skeleton/skeleton.js";
const _easycom_fo_empty = () => "../../components/fo-empty/fo-empty.js";
const _easycom_status_badge = () => "../../components/status-badge/status-badge.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_skeleton + _easycom_fo_empty + _easycom_status_badge + _easycom_custom_tabbar)();
}
const pageSize = 20;
const _sfc_main = {
  __name: "record",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const { headerHeight } = composables_useHeaderFixed.useHeaderFixed(".header");
    const userStore = store_user.useUserStore();
    const orders = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const loadingMore = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const total = common_vendor.ref(0);
    const hasMore = common_vendor.computed(() => orders.value.length < total.value);
    const flashMap = common_vendor.reactive({});
    const triggerFlash = (id) => {
      flashMap[id] = true;
      setTimeout(() => {
        flashMap[id] = false;
      }, 600);
    };
    const groupDelay = (gIdx) => `${Math.min(gIdx * 60, 300)}ms`;
    const cardDelay = (gIdx, oIdx) => `${Math.min(gIdx * 60 + oIdx * 40 + 80, 500)}ms`;
    const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const toShanghaiParts = (ts) => {
      const d = new Date(ts + 8 * 3600 * 1e3);
      return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        // 0-11
        date: d.getUTCDate(),
        day: d.getUTCDay(),
        // 0=周日
        hours: d.getUTCHours(),
        minutes: d.getUTCMinutes()
      };
    };
    const dayKey = (ts) => {
      const p = toShanghaiParts(ts);
      return `${p.year}-${p.month + 1}-${p.date}`;
    };
    const formatDateLabel = (ts) => {
      const todayKey = dayKey(Date.now());
      const yesterdayKey = dayKey(Date.now() - 24 * 3600 * 1e3);
      const beforeYesterdayKey = dayKey(Date.now() - 2 * 24 * 3600 * 1e3);
      const key = dayKey(ts);
      if (key === todayKey)
        return "今天";
      if (key === yesterdayKey)
        return "昨天";
      if (key === beforeYesterdayKey)
        return "前天";
      const p = toShanghaiParts(ts);
      return `${p.year}年${p.month + 1}月${p.date}日 ${WEEKDAYS[p.day]}`;
    };
    const groupedOrders = common_vendor.computed(() => {
      const groups = [];
      const map = /* @__PURE__ */ new Map();
      for (const order of orders.value) {
        if (!order.createTime)
          continue;
        const key = dayKey(order.createTime);
        if (!map.has(key)) {
          const g = { key, label: formatDateLabel(order.createTime), orders: [] };
          map.set(key, g);
          groups.push(g);
        }
        map.get(key).orders.push(order);
      }
      return groups;
    });
    const buildSummary = (items) => {
      if (!Array.isArray(items) || items.length === 0)
        return "订单详情";
      return items.map((it) => `${it.name} x${it.quantity}`).join(", ");
    };
    const firstItemImage = (order) => {
      var _a, _b;
      return ((_b = (_a = order == null ? void 0 : order.items) == null ? void 0 : _a[0]) == null ? void 0 : _b.image) || "";
    };
    const firstItemEmoji = (order) => {
      var _a, _b;
      const name = ((_b = (_a = order == null ? void 0 : order.items) == null ? void 0 : _a[0]) == null ? void 0 : _b.name) || "";
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
    const onCardTap = (order) => {
      common_vendor.index.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order._id}`
      });
    };
    const formatTime = (ts) => {
      if (!ts)
        return "";
      const p = toShanghaiParts(ts);
      return `${String(p.hours).padStart(2, "0")}:${String(p.minutes).padStart(2, "0")}`;
    };
    const loadOrders = async (reset = true) => {
      if (reset) {
        if (loading.value)
          return;
        loading.value = true;
        page.value = 1;
      } else {
        if (loadingMore.value || !hasMore.value)
          return;
        loadingMore.value = true;
        page.value += 1;
      }
      try {
        const res = await common_vendor._r.callFunction({
          name: "orders-crud",
          data: {
            action: "list",
            page: page.value,
            pageSize,
            token: userStore.token
          }
        });
        if (res.result.code === 0) {
          const list = res.result.list || [];
          total.value = res.result.total || 0;
          if (reset) {
            orders.value = list;
          } else {
            orders.value = orders.value.concat(list);
          }
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/record/record.vue:255", "[record] loadOrders error", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };
    const onAdvance = async (order, target) => {
      const oldStatus = order.status;
      order.status = target;
      triggerFlash(order._id);
      try {
        const res = await common_vendor._r.callFunction({
          name: "orders-crud",
          data: {
            action: "updateStatus",
            _id: order._id,
            status: target,
            token: userStore.token
          }
        });
        if (res.result.code !== 0) {
          order.status = oldStatus;
          common_vendor.index.showToast({ title: res.result.message || "操作失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({
          title: target === "preparing" ? "已开始制作" : "已完成",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/record/record.vue:290", "[record] onAdvance error", e);
        order.status = oldStatus;
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      }
    };
    const onCancel = (order) => {
      common_vendor.index.showModal({
        title: "取消订单",
        content: "确定要取消这个订单吗？",
        confirmColor: "#EF4444",
        success: async (r) => {
          if (!r.confirm)
            return;
          const oldStatus = order.status;
          order.status = "cancelled";
          triggerFlash(order._id);
          try {
            const res = await common_vendor._r.callFunction({
              name: "orders-crud",
              data: {
                action: "cancel",
                _id: order._id,
                token: userStore.token
              }
            });
            if (res.result.code !== 0) {
              order.status = oldStatus;
              common_vendor.index.showToast({ title: res.result.message || "取消失败", icon: "none" });
              return;
            }
            common_vendor.index.showToast({ title: "已取消", icon: "success" });
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/record/record.vue:324", "[record] onCancel error", e);
            order.status = oldStatus;
            common_vendor.index.showToast({ title: "取消失败", icon: "none" });
          }
        }
      });
    };
    common_vendor.onShow(() => {
      loadOrders(true);
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadOrders(true);
      common_vendor.index.stopPullDownRefresh();
    });
    common_vendor.onReachBottom(() => {
      loadOrders(false);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(statusBarHeight) + 28 + "px",
        b: common_vendor.unref(headerHeight) + "px",
        c: loading.value && orders.value.length === 0
      }, loading.value && orders.value.length === 0 ? {
        d: common_vendor.p({
          type: "card",
          count: 4
        })
      } : orders.value.length === 0 ? {
        f: common_vendor.p({
          text: "还没有点单记录哦~",
          icon: "☕"
        })
      } : common_vendor.e({
        g: common_vendor.f(groupedOrders.value, (group, gIdx, i0) => {
          return {
            a: common_vendor.t(group.label),
            b: common_vendor.t(group.orders.length),
            c: common_vendor.f(group.orders, (order, oIdx, i1) => {
              return common_vendor.e({
                a: firstItemImage(order)
              }, firstItemImage(order) ? {
                b: firstItemImage(order)
              } : {
                c: common_vendor.t(firstItemEmoji(order))
              }, {
                d: order.items.length > 1
              }, order.items.length > 1 ? {
                e: common_vendor.t(order.items.length - 1)
              } : {}, {
                f: common_vendor.t(buildSummary(order.items)),
                g: common_vendor.t(order.userName || "神秘食客"),
                h: common_vendor.t(formatTime(order.createTime)),
                i: "ef6850c5-2-" + i0 + "-" + i1,
                j: common_vendor.p({
                  status: order.status
                })
              }, common_vendor.unref(userStore).isAdmin ? common_vendor.e({
                k: order.status === "pending"
              }, order.status === "pending" ? {
                l: common_vendor.o(($event) => onCancel(order), order._id),
                m: common_vendor.o(($event) => onAdvance(order, "preparing"), order._id)
              } : order.status === "preparing" ? {
                o: common_vendor.o(($event) => onAdvance(order, "completed"), order._id)
              } : {}, {
                n: order.status === "preparing"
              }) : {}, {
                p: order._id,
                q: flashMap[order._id] ? 1 : "",
                r: cardDelay(gIdx, oIdx),
                s: common_vendor.o(($event) => onCardTap(order), order._id)
              });
            }),
            d: group.key,
            e: groupDelay(gIdx)
          };
        }),
        h: common_vendor.unref(userStore).isAdmin,
        i: loadingMore.value
      }, loadingMore.value ? {} : !hasMore.value && orders.value.length > 0 ? {} : {}, {
        j: !hasMore.value && orders.value.length > 0
      }), {
        e: orders.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ef6850c5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/record.js.map
