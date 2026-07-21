"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_lottie = require("../../utils/lottie.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
const v = "5.7.4";
const fr = 30;
const ip = 0;
const op = 60;
const w = 200;
const h = 200;
const nm = "success";
const ddd = 0;
const assets = [];
const layers = [
  {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "circle",
    sr: 1,
    ks: {
      o: {
        a: 0,
        k: 100
      },
      r: {
        a: 0,
        k: 0
      },
      p: {
        a: 0,
        k: [
          100,
          100,
          0
        ]
      },
      a: {
        a: 0,
        k: [
          0,
          0,
          0
        ]
      },
      s: {
        a: 1,
        k: [
          {
            t: 0,
            s: [
              0,
              0,
              100
            ],
            i: {
              x: [
                0.34
              ],
              y: [
                1.56
              ]
            },
            o: {
              x: [
                0.6
              ],
              y: [
                0
              ]
            }
          },
          {
            t: 18,
            s: [
              115,
              115,
              100
            ],
            i: {
              x: [
                0.4
              ],
              y: [
                1
              ]
            },
            o: {
              x: [
                0.6
              ],
              y: [
                0
              ]
            }
          },
          {
            t: 30,
            s: [
              100,
              100,
              100
            ],
            i: {
              x: [
                0.4
              ],
              y: [
                1
              ]
            },
            o: {
              x: [
                0.6
              ],
              y: [
                0
              ]
            }
          },
          {
            t: 45,
            s: [
              105,
              105,
              100
            ],
            i: {
              x: [
                0.4
              ],
              y: [
                1
              ]
            },
            o: {
              x: [
                0.6
              ],
              y: [
                0
              ]
            }
          },
          {
            t: 60,
            s: [
              100,
              100,
              100
            ]
          }
        ]
      }
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "el",
            p: {
              a: 0,
              k: [
                0,
                0
              ]
            },
            s: {
              a: 0,
              k: [
                120,
                120
              ]
            },
            nm: "Ellipse"
          },
          {
            ty: "fl",
            c: {
              a: 0,
              k: [
                0.133,
                0.769,
                0.369,
                1
              ]
            },
            o: {
              a: 0,
              k: 100
            },
            nm: "Fill"
          },
          {
            ty: "tr",
            p: {
              a: 0,
              k: [
                0,
                0
              ]
            },
            a: {
              a: 0,
              k: [
                0,
                0
              ]
            },
            s: {
              a: 0,
              k: [
                100,
                100
              ]
            },
            r: {
              a: 0,
              k: 0
            },
            o: {
              a: 0,
              k: 100
            }
          }
        ],
        nm: "Group"
      }
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0
  },
  {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: "check",
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          {
            t: 15,
            s: [
              0
            ],
            i: {
              x: [
                0.4
              ],
              y: [
                1
              ]
            },
            o: {
              x: [
                0.6
              ],
              y: [
                0
              ]
            }
          },
          {
            t: 30,
            s: [
              100
            ]
          }
        ]
      },
      r: {
        a: 0,
        k: 0
      },
      p: {
        a: 0,
        k: [
          100,
          100,
          0
        ]
      },
      a: {
        a: 0,
        k: [
          0,
          0,
          0
        ]
      },
      s: {
        a: 0,
        k: [
          100,
          100,
          100
        ]
      }
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [
                  [
                    0,
                    0
                  ],
                  [
                    0,
                    0
                  ],
                  [
                    0,
                    0
                  ]
                ],
                o: [
                  [
                    0,
                    0
                  ],
                  [
                    0,
                    0
                  ],
                  [
                    0,
                    0
                  ]
                ],
                v: [
                  [
                    -30,
                    0
                  ],
                  [
                    -8,
                    24
                  ],
                  [
                    30,
                    -22
                  ]
                ],
                c: false
              }
            },
            nm: "Check"
          },
          {
            ty: "st",
            c: {
              a: 0,
              k: [
                1,
                1,
                1,
                1
              ]
            },
            o: {
              a: 0,
              k: 100
            },
            w: {
              a: 0,
              k: 14
            },
            lc: 3,
            lj: 3,
            nm: "Stroke"
          },
          {
            ty: "tr",
            p: {
              a: 0,
              k: [
                0,
                0
              ]
            },
            a: {
              a: 0,
              k: [
                0,
                0
              ]
            },
            s: {
              a: 0,
              k: [
                100,
                100
              ]
            },
            r: {
              a: 0,
              k: 0
            },
            o: {
              a: 0,
              k: 100
            }
          }
        ],
        nm: "CheckGroup"
      }
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0
  }
];
const successAnim = {
  v,
  fr,
  ip,
  op,
  w,
  h,
  nm,
  ddd,
  assets,
  layers
};
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_error_state2 = common_vendor.resolveComponent("error-state");
  const _easycom_status_badge2 = common_vendor.resolveComponent("status-badge");
  (_easycom_Icon2 + _easycom_error_state2 + _easycom_status_badge2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_error_state = () => "../../components/error-state/error-state.js";
const _easycom_status_badge = () => "../../components/status-badge/status-badge.js";
if (!Math) {
  (_easycom_Icon + _easycom_error_state + _easycom_status_badge)();
}
const LOTTIE_CANVAS_ID = "success-lottie";
const _sfc_main = {
  __name: "order-success",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const orderId = common_vendor.ref("");
    const order = common_vendor.ref(null);
    const loading = common_vendor.ref(true);
    const loadError = common_vendor.ref("");
    const themeClass = common_vendor.computed(() => {
      var _a, _b, _c, _d;
      const t = ((_c = (_b = (_a = order.value) == null ? void 0 : _a.items) == null ? void 0 : _b[0]) == null ? void 0 : _c.type) || ((_d = order.value) == null ? void 0 : _d.type) || "coffee";
      return `theme-${t}`;
    });
    const lottieInstance = common_vendor.getCurrentInstance();
    const loadSuccessLottie = async () => {
      await common_vendor.nextTick$1();
      await new Promise((r) => setTimeout(r, 100));
      const anim = await utils_lottie.loadLottieOnReady(
        LOTTIE_CANVAS_ID,
        successAnim,
        { loop: false, autoplay: true },
        (lottieInstance == null ? void 0 : lottieInstance.proxy) || null
      );
      if (anim) {
        common_vendor.index.__f__("log", "at pages/order-success/order-success.vue:146", "[order-success] Lottie 加载成功");
      } else {
        common_vendor.index.__f__("warn", "at pages/order-success/order-success.vue:148", "[order-success] Lottie 加载失败，使用 CSS 降级动效");
      }
    };
    const burstConfetti = common_vendor.ref(false);
    const confettiColors = [
      "#FFA726",
      "#22C55E",
      "#3B82F6",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899"
    ];
    const confettiPieces = Array.from({ length: 14 }, (_, i) => {
      const angle = i / 14 * Math.PI * 2 + i % 2 * 0.25;
      const distance = 140 + i % 4 * 30;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        color: confettiColors[i % confettiColors.length],
        delay: i * 0.04,
        rotate: 360 + i % 5 * 120,
        size: 14 + i % 3 * 6
      };
    });
    const confettiStyle = (c) => {
      const base = {
        backgroundColor: c.color,
        width: c.size + "rpx",
        height: c.size + "rpx",
        marginTop: -c.size / 2 + "rpx",
        marginLeft: -c.size / 2 + "rpx",
        transitionDelay: c.delay + "s"
      };
      if (burstConfetti.value) {
        return {
          ...base,
          transform: `translate(${c.tx}rpx, ${c.ty}rpx) rotate(${c.rotate}deg) scale(0.3)`,
          opacity: 0
        };
      }
      return {
        ...base,
        transform: "translate(0, 0) rotate(0deg) scale(1)",
        opacity: 1
      };
    };
    const orderItems = common_vendor.computed(() => {
      var _a;
      return ((_a = order.value) == null ? void 0 : _a.items) || [];
    });
    const orderNote = common_vendor.computed(() => {
      var _a;
      return ((_a = order.value) == null ? void 0 : _a.note) || "";
    });
    const orderUserName = common_vendor.computed(() => {
      var _a;
      return ((_a = order.value) == null ? void 0 : _a.userName) || "我";
    });
    const reservationText = common_vendor.computed(() => {
      const o = order.value;
      if (!o)
        return "尽快";
      if (o.reservationType === "asap" || !o.reservationTime)
        return "尽快";
      return formatReservation(o.reservationTime);
    });
    const submitTimeText = common_vendor.computed(() => {
      var _a, _b;
      const ts = ((_a = order.value) == null ? void 0 : _a.createdAt) || ((_b = order.value) == null ? void 0 : _b.submitTime);
      return ts ? formatDateTime(ts) : "";
    });
    const formatDateTime = (ts) => {
      const d = new Date(ts);
      const M = String(d.getMonth() + 1).padStart(2, "0");
      const D = String(d.getDate()).padStart(2, "0");
      const h2 = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${M}-${D} ${h2}:${m}`;
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
      const h2 = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${dayLabel} ${h2}:${m}`;
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
        order.value = res.result.data || res.result.order;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/order-success/order-success.vue:271", "[order-success] loadOrder error", e);
        loadError.value = "订单加载失败，请稍后重试";
      } finally {
        loading.value = false;
      }
    };
    const goHome = () => {
      common_vendor.index.switchTab({ url: "/pages/home/home" });
    };
    const goRecord = () => {
      common_vendor.index.switchTab({ url: "/pages/record/record" });
    };
    const retryLoad = () => {
      if (orderId.value) {
        loadOrder(orderId.value);
      }
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
    common_vendor.onMounted(() => {
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          burstConfetti.value = true;
        }, 250);
      });
      loadSuccessLottie();
    });
    common_vendor.onUnmounted(() => {
      utils_lottie.destroyLottie(LOTTIE_CANVAS_ID);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(common_vendor.unref(confettiPieces), (c, k0, i0) => {
          return {
            a: c.id,
            b: common_vendor.s(confettiStyle(c))
          };
        }),
        b: common_vendor.p({
          name: "check",
          size: 56,
          color: "#fff",
          ["stroke-width"]: 3
        }),
        c: common_vendor.unref(statusBarHeight) + 48 + "px",
        d: loading.value
      }, loading.value ? {} : loadError.value ? {
        f: common_vendor.o(retryLoad, "67"),
        g: common_vendor.p({
          emoji: "😵",
          title: "订单加载失败",
          desc: loadError.value,
          ["retry-text"]: "重新加载"
        })
      } : common_vendor.e({
        h: order.value
      }, order.value ? {
        i: common_vendor.p({
          status: order.value.status || "pending"
        })
      } : {}, {
        j: common_vendor.f(orderItems.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.quantity),
            c: item.dishId
          };
        }),
        k: common_vendor.t(reservationText.value),
        l: orderNote.value
      }, orderNote.value ? {
        m: common_vendor.t(orderNote.value)
      } : {}, {
        n: common_vendor.t(orderUserName.value),
        o: common_vendor.t(submitTimeText.value)
      }), {
        e: loadError.value,
        p: !loading.value
      }, !loading.value ? {
        q: common_vendor.o(goHome, "11"),
        r: common_vendor.o(goRecord, "f2")
      } : {}, {
        s: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-982e71f9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order-success/order-success.js.map
