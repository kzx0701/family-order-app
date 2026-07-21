"use strict";
const common_vendor = require("../../common/vendor.js");
const store_cart = require("../../store/cart.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const v = "5.7.4";
const fr = 30;
const ip = 0;
const op = 60;
const w = 200;
const h = 200;
const nm = "loading";
const ddd = 0;
const assets = [];
const layers = [
  {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "ring",
    sr: 1,
    ks: {
      o: {
        a: 0,
        k: 100
      },
      r: {
        a: 1,
        k: [
          {
            t: 0,
            s: [
              0
            ],
            i: {
              x: [
                0.5
              ],
              y: [
                0.5
              ]
            },
            o: {
              x: [
                0.5
              ],
              y: [
                0.5
              ]
            }
          },
          {
            t: 60,
            s: [
              360
            ]
          }
        ]
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
                80,
                80
              ]
            },
            nm: "Ring"
          },
          {
            ty: "st",
            c: {
              a: 0,
              k: [
                0.435,
                0.307,
                0.216,
                1
              ]
            },
            o: {
              a: 0,
              k: 100
            },
            w: {
              a: 0,
              k: 10
            },
            lc: 3,
            lj: 3,
            d: [
              {
                n: "d",
                v: {
                  a: 0,
                  k: 125
                }
              },
              {
                n: "g",
                v: {
                  a: 0,
                  k: 125
                }
              }
            ],
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
        nm: "RingGroup"
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
    nm: "dot",
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
          60,
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
            t: 30,
            s: [
              60,
              60,
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
                16,
                16
              ]
            },
            nm: "Dot"
          },
          {
            ty: "fl",
            c: {
              a: 0,
              k: [
                0.969,
                0.6,
                0.149,
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
        nm: "DotGroup"
      }
    ],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0
  }
];
const loadingAnim = {
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
  const _easycom_lottie_loading2 = common_vendor.resolveComponent("lottie-loading");
  const _easycom_error_state2 = common_vendor.resolveComponent("error-state");
  (_easycom_Icon2 + _easycom_lottie_loading2 + _easycom_error_state2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_lottie_loading = () => "../../components/lottie-loading/lottie-loading.js";
const _easycom_error_state = () => "../../components/error-state/error-state.js";
if (!Math) {
  (_easycom_Icon + _easycom_lottie_loading + _easycom_error_state)();
}
const _sfc_main = {
  __name: "dish-detail",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const cartStore = store_cart.useCartStore();
    const dish = common_vendor.ref({
      dishId: "",
      name: "",
      image: "",
      description: "",
      type: "coffee",
      categoryId: ""
    });
    const categoryName = common_vendor.ref("");
    const quantity = common_vendor.ref(1);
    const loading = common_vendor.ref(false);
    const loadError = common_vendor.ref("");
    const currentDishId = common_vendor.ref("");
    const parallaxY = common_vendor.ref(0);
    const themeClass = common_vendor.computed(() => `theme-${dish.value.type || "coffee"}`);
    const heroEmoji = common_vendor.computed(() => dish.value.type === "food" ? "🍲" : "☕");
    const onPlus = () => {
      quantity.value++;
    };
    const onMinus = () => {
      if (quantity.value > 1)
        quantity.value--;
    };
    const onAddToCart = () => {
      cartStore.addItem(
        {
          dishId: dish.value.dishId,
          name: dish.value.name,
          image: dish.value.image,
          type: dish.value.type,
          description: dish.value.description
        },
        quantity.value
      );
      common_vendor.index.showToast({ title: "已加入点单", icon: "success" });
      quantity.value = 1;
      setTimeout(() => common_vendor.index.navigateBack(), 600);
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const retryLoad = () => {
      if (currentDishId.value) {
        loadDish(currentDishId.value);
      }
    };
    const loadDish = async (dishId) => {
      loading.value = true;
      loadError.value = "";
      try {
        const res = await common_vendor._r.callFunction({
          name: "dishes-crud",
          data: { action: "detail", _id: dishId }
        });
        if (res.result.code !== 0) {
          loadError.value = res.result.message || "菜品不存在或已下架";
          return;
        }
        const d = res.result.dish;
        dish.value = {
          dishId: d._id,
          name: d.name || "",
          image: d.image || "",
          description: d.description || "",
          type: d.type || "coffee",
          categoryId: d.categoryId || ""
        };
        categoryName.value = d.categoryName || "";
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/dish-detail/dish-detail.vue:209", "[dish-detail] loadDish error", e);
        loadError.value = "加载失败，请稍后重试";
      } finally {
        loading.value = false;
      }
    };
    common_vendor.onPageScroll((e) => {
      parallaxY.value = Math.min(e.scrollTop * 0.3, 70);
    });
    common_vendor.onLoad((options) => {
      const { dishId, type } = options || {};
      if (type && ["coffee", "food"].includes(type)) {
        dish.value.type = type;
      }
      if (!dishId) {
        loadError.value = "参数错误";
        return;
      }
      currentDishId.value = dishId;
      loadDish(dishId);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "arrow-left",
          size: 20
        }),
        b: common_vendor.unref(statusBarHeight) + 16 + "px",
        c: common_vendor.o(goBack, "c9"),
        d: loading.value
      }, loading.value ? {
        e: common_vendor.p({
          ["animation-data"]: common_vendor.unref(loadingAnim),
          width: "160rpx",
          height: "160rpx"
        })
      } : loadError.value ? {
        g: common_vendor.o(retryLoad, "0f"),
        h: common_vendor.p({
          emoji: "😵",
          title: "加载失败",
          desc: loadError.value,
          ["retry-text"]: "重新加载"
        })
      } : common_vendor.e({
        i: dish.value.image
      }, dish.value.image ? {
        j: dish.value.image,
        k: `translate3d(0, ${parallaxY.value}px, 0)`
      } : {
        l: common_vendor.t(heroEmoji.value)
      }, {
        m: categoryName.value
      }, categoryName.value ? {
        n: common_vendor.t(categoryName.value)
      } : {}, {
        o: common_vendor.t(dish.value.name || "菜品名称"),
        p: common_vendor.t(dish.value.description || "暂无描述"),
        q: common_vendor.p({
          name: "minus",
          size: 16
        }),
        r: quantity.value <= 1 ? 1 : "",
        s: common_vendor.o(onMinus, "db"),
        t: common_vendor.t(quantity.value),
        v: common_vendor.p({
          name: "plus",
          size: 16
        }),
        w: common_vendor.o(onPlus, "b0")
      }), {
        f: loadError.value,
        x: !loading.value && !loadError.value
      }, !loading.value && !loadError.value ? {
        y: common_vendor.o(onAddToCart, "0e")
      } : {}, {
        z: common_vendor.n(themeClass.value)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f1b4097a"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/dish-detail/dish-detail.js.map
