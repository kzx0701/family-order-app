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
    const SWIPE_ACTION_WIDTH_FULL = Math.round(320 / 750 * common_vendor.index.getSystemInfoSync().windowWidth);
    const SWIPE_ACTION_WIDTH_DELETE_ONLY = Math.round(160 / 750 * common_vendor.index.getSystemInfoSync().windowWidth);
    const swipeOffset = common_vendor.reactive({});
    const swipeAnimating = common_vendor.reactive({});
    const touchStartX = common_vendor.reactive({});
    const touchStartOffset = common_vendor.reactive({});
    const touchMoved = common_vendor.reactive({});
    const activeSwipeId = common_vendor.ref("");
    const getSwipeWidth = (order) => {
      if (order.status === "pending")
        return SWIPE_ACTION_WIDTH_FULL;
      return SWIPE_ACTION_WIDTH_DELETE_ONLY;
    };
    const onTouchStart = (e, id) => {
      const touch = e.touches[0];
      touchStartX[id] = touch.clientX;
      touchStartOffset[id] = swipeOffset[id] || 0;
      touchMoved[id] = false;
      swipeAnimating[id] = false;
      if (activeSwipeId.value && activeSwipeId.value !== id) {
        swipeAnimating[activeSwipeId.value] = true;
        swipeOffset[activeSwipeId.value] = 0;
        activeSwipeId.value = "";
      }
    };
    const onTouchMove = (e, id) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX[id];
      if (Math.abs(dx) > 5)
        touchMoved[id] = true;
      let next = touchStartOffset[id] + dx;
      if (next > 0)
        next = 0;
      if (next < -SWIPE_ACTION_WIDTH_FULL)
        next = -SWIPE_ACTION_WIDTH_FULL;
      swipeOffset[id] = next;
    };
    const onTouchEnd = (e, id) => {
      const order = orders.value.find((o) => o._id === id);
      const maxW = order ? getSwipeWidth(order) : SWIPE_ACTION_WIDTH_FULL;
      const offset = swipeOffset[id] || 0;
      swipeAnimating[id] = true;
      if (offset < -maxW / 2) {
        swipeOffset[id] = -maxW;
        activeSwipeId.value = id;
      } else {
        swipeOffset[id] = 0;
        if (activeSwipeId.value === id)
          activeSwipeId.value = "";
      }
      setTimeout(() => {
        swipeAnimating[id] = false;
      }, 300);
      setTimeout(() => {
        touchMoved[id] = false;
      }, 0);
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
      if (touchMoved[order._id])
        return;
      if (swipeOffset[order._id] < 0) {
        swipeAnimating[order._id] = true;
        swipeOffset[order._id] = 0;
        activeSwipeId.value = "";
        setTimeout(() => {
          swipeAnimating[order._id] = false;
        }, 300);
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order._id}`
      });
    };
    const onSwipeCancel = (order) => {
      swipeAnimating[order._id] = true;
      swipeOffset[order._id] = 0;
      activeSwipeId.value = "";
      setTimeout(() => {
        swipeAnimating[order._id] = false;
      }, 300);
      onCancel(order);
    };
    const onSwipeDelete = (order) => {
      onDelete(order);
    };
    const onPageTap = () => {
      if (activeSwipeId.value) {
        swipeAnimating[activeSwipeId.value] = true;
        swipeOffset[activeSwipeId.value] = 0;
        const id = activeSwipeId.value;
        activeSwipeId.value = "";
        setTimeout(() => {
          swipeAnimating[id] = false;
        }, 300);
      }
    };
    const formatTime = (ts) => {
      if (!ts)
        return "";
      const p = toShanghaiParts(ts);
      return `${String(p.hours).padStart(2, "0")}:${String(p.minutes).padStart(2, "0")}`;
    };
    const loadOrders = async (reset = true) => {
      if (!userStore.token)
        return;
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
          name: "app-service",
          data: {
            module: "orders-crud",
            action: "list",
            page: page.value,
            pageSize,
            scope: "mine",
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
        } else if (res.result.code === 401) {
          common_vendor.index.__f__("warn", "at pages/record/record.vue:363", "[record] orders-crud 401", res.result.message);
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/record/record.vue:368", "[record] loadOrders error", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
        loadingMore.value = false;
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
              name: "app-service",
              data: {
                module: "orders-crud",
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
            common_vendor.index.__f__("error", "at pages/record/record.vue:405", "[record] onCancel error", e);
            order.status = oldStatus;
            common_vendor.index.showToast({ title: "取消失败", icon: "none" });
          }
        }
      });
    };
    const onDelete = (order) => {
      common_vendor.index.showModal({
        title: "删除订单",
        content: "确定要删除这条订单记录吗？删除后不可恢复。",
        confirmText: "删除",
        confirmColor: "#EF4444",
        success: async (r) => {
          if (!r.confirm)
            return;
          try {
            const res = await common_vendor._r.callFunction({
              name: "app-service",
              data: {
                module: "orders-crud",
                action: "delete",
                _id: order._id,
                token: userStore.token
              }
            });
            if (res.result.code !== 0) {
              common_vendor.index.showToast({ title: res.result.message || "删除失败", icon: "none" });
              return;
            }
            orders.value = orders.value.filter((o) => o._id !== order._id);
            total.value = Math.max(0, total.value - 1);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          } catch (e) {
            common_vendor.index.__f__("error", "at pages/record/record.vue:441", "[record] onDelete error", e);
            common_vendor.index.showToast({ title: "删除失败", icon: "none" });
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
        a: common_vendor.unref(statusBarHeight) + 40 + "px",
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
                a: order.status === "pending"
              }, order.status === "pending" ? {
                b: common_vendor.o(($event) => onSwipeCancel(order), order._id)
              } : {}, {
                c: common_vendor.o(($event) => onSwipeDelete(order), order._id),
                d: common_vendor.o(() => {
                }, order._id),
                e: firstItemImage(order)
              }, firstItemImage(order) ? {
                f: firstItemImage(order)
              } : {
                g: common_vendor.t(firstItemEmoji(order))
              }, {
                h: order.items.length > 1
              }, order.items.length > 1 ? {
                i: common_vendor.t(order.items.length - 1)
              } : {}, {
                j: common_vendor.t(buildSummary(order.items)),
                k: common_vendor.t(formatTime(order.createTime)),
                l: "ef6850c5-2-" + i0 + "-" + i1,
                m: common_vendor.p({
                  status: order.status
                }),
                n: flashMap[order._id] ? 1 : "",
                o: swipeAnimating[order._id] ? 1 : "",
                p: `translateX(${swipeOffset[order._id] || 0}px)`,
                q: common_vendor.o(($event) => onTouchStart($event, order._id), order._id),
                r: common_vendor.o(($event) => onTouchMove($event, order._id), order._id),
                s: common_vendor.o(($event) => onTouchEnd($event, order._id), order._id),
                t: common_vendor.o(($event) => onCardTap(order), order._id),
                v: order._id,
                w: cardDelay(gIdx, oIdx)
              });
            }),
            d: group.key,
            e: groupDelay(gIdx)
          };
        }),
        h: loadingMore.value
      }, loadingMore.value ? {} : !hasMore.value && orders.value.length > 0 ? {} : {}, {
        i: !hasMore.value && orders.value.length > 0
      }), {
        e: orders.value.length === 0,
        j: common_vendor.o(onPageTap, "25")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ef6850c5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/record.js.map
