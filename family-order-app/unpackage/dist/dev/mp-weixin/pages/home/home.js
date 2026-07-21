"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const composables_useHeaderFixed = require("../../composables/useHeaderFixed.js");
const store_cart = require("../../store/cart.js");
const utils_lottie = require("../../utils/lottie.js");
const v$1 = "5.7.4";
const fr$1 = 30;
const ip$1 = 0;
const op$1 = 90;
const w$1 = 200;
const h$1 = 200;
const nm$1 = "home-decoration";
const ddd$1 = 0;
const assets$1 = [];
const layers$1 = [
  {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "cup",
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
          120,
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
            ty: "rc",
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
                60
              ]
            },
            r: {
              a: 0,
              k: 12
            },
            nm: "CupBody"
          },
          {
            ty: "fl",
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
        nm: "CupGroup"
      }
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0
  },
  {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: "steam-1",
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          {
            t: 0,
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
            t: 20,
            s: [
              80
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
              0
            ]
          }
        ]
      },
      r: {
        a: 0,
        k: 0
      },
      p: {
        a: 1,
        k: [
          {
            t: 0,
            s: [
              80,
              80,
              0
            ],
            i: {
              x: 0.4,
              y: 1
            },
            o: {
              x: 0.6,
              y: 0
            },
            to: [
              0,
              -10,
              0
            ],
            ti: [
              0,
              0,
              0
            ]
          },
          {
            t: 60,
            s: [
              80,
              30,
              0
            ]
          }
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
                14,
                14
              ]
            },
            nm: "Steam1"
          },
          {
            ty: "fl",
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
              k: 80
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
        nm: "Steam1Group"
      }
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0
  },
  {
    ddd: 0,
    ind: 3,
    ty: 4,
    nm: "steam-2",
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
            t: 35,
            s: [
              80
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
            t: 75,
            s: [
              0
            ]
          }
        ]
      },
      r: {
        a: 0,
        k: 0
      },
      p: {
        a: 1,
        k: [
          {
            t: 15,
            s: [
              100,
              80,
              0
            ],
            i: {
              x: 0.4,
              y: 1
            },
            o: {
              x: 0.6,
              y: 0
            },
            to: [
              0,
              -10,
              0
            ],
            ti: [
              0,
              0,
              0
            ]
          },
          {
            t: 75,
            s: [
              100,
              30,
              0
            ]
          }
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
                12,
                12
              ]
            },
            nm: "Steam2"
          },
          {
            ty: "fl",
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
              k: 80
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
        nm: "Steam2Group"
      }
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0
  },
  {
    ddd: 0,
    ind: 4,
    ty: 4,
    nm: "steam-3",
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          {
            t: 30,
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
            t: 50,
            s: [
              80
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
            t: 90,
            s: [
              0
            ]
          }
        ]
      },
      r: {
        a: 0,
        k: 0
      },
      p: {
        a: 1,
        k: [
          {
            t: 30,
            s: [
              120,
              80,
              0
            ],
            i: {
              x: 0.4,
              y: 1
            },
            o: {
              x: 0.6,
              y: 0
            },
            to: [
              0,
              -10,
              0
            ],
            ti: [
              0,
              0,
              0
            ]
          },
          {
            t: 90,
            s: [
              120,
              30,
              0
            ]
          }
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
                10,
                10
              ]
            },
            nm: "Steam3"
          },
          {
            ty: "fl",
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
              k: 80
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
        nm: "Steam3Group"
      }
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0
  }
];
const homeDecoAnim = {
  v: v$1,
  fr: fr$1,
  ip: ip$1,
  op: op$1,
  w: w$1,
  h: h$1,
  nm: nm$1,
  ddd: ddd$1,
  assets: assets$1,
  layers: layers$1
};
const v = "5.7.4";
const fr = 30;
const ip = 0;
const op = 90;
const w = 200;
const h = 200;
const nm = "empty";
const ddd = 0;
const assets = [];
const layers = [
  {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "plate",
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
          110,
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
              95,
              95,
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
            t: 90,
            s: [
              95,
              95,
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
                110,
                40
              ]
            },
            nm: "PlateOuter"
          },
          {
            ty: "fl",
            c: {
              a: 0,
              k: [
                0.96,
                0.94,
                0.92,
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
        nm: "PlateGroup"
      },
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
                30
              ]
            },
            nm: "PlateInner"
          },
          {
            ty: "fl",
            c: {
              a: 0,
              k: [
                0.88,
                0.85,
                0.82,
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
        nm: "PlateInnerGroup"
      }
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0
  },
  {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: "sad",
    sr: 1,
    ks: {
      o: {
        a: 0,
        k: 60
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
                  ]
                ],
                v: [
                  [
                    -12,
                    0
                  ],
                  [
                    12,
                    0
                  ]
                ],
                c: false
              }
            },
            nm: "Mouth"
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
              k: 5
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
        nm: "MouthGroup"
      },
      {
        ty: "gr",
        it: [
          {
            ty: "el",
            p: {
              a: 0,
              k: [
                -15,
                -8
              ]
            },
            s: {
              a: 0,
              k: [
                6,
                6
              ]
            },
            nm: "EyeL"
          },
          {
            ty: "fl",
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
        nm: "EyeLGroup"
      },
      {
        ty: "gr",
        it: [
          {
            ty: "el",
            p: {
              a: 0,
              k: [
                15,
                -8
              ]
            },
            s: {
              a: 0,
              k: [
                6,
                6
              ]
            },
            nm: "EyeR"
          },
          {
            ty: "fl",
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
        nm: "EyeRGroup"
      }
    ],
    ip: 0,
    op: 90,
    st: 0,
    bm: 0
  }
];
const emptyAnim = {
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
  const _easycom_default_avatar2 = common_vendor.resolveComponent("default-avatar");
  const _easycom_skeleton2 = common_vendor.resolveComponent("skeleton");
  const _easycom_order_card2 = common_vendor.resolveComponent("order-card");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_default_avatar2 + _easycom_skeleton2 + _easycom_order_card2 + _easycom_custom_tabbar2)();
}
const _easycom_default_avatar = () => "../../components/default-avatar/default-avatar.js";
const _easycom_skeleton = () => "../../components/skeleton/skeleton.js";
const _easycom_order_card = () => "../../components/order-card/order-card.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_default_avatar + _easycom_skeleton + _easycom_order_card + _easycom_custom_tabbar)();
}
const DECO_CANVAS_ID = "home-deco-lottie";
const EMPTY_CANVAS_ID = "home-empty-lottie";
const _sfc_main = {
  __name: "home",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const { headerHeight } = composables_useHeaderFixed.useHeaderFixed(".header");
    const userStore = store_user.useUserStore();
    const cartStore = store_cart.useCartStore();
    const orders = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const showProfileModal = common_vendor.ref(false);
    const editNickname = common_vendor.ref("");
    const editAvatar = common_vendor.ref("");
    const avatarChanged = common_vendor.ref(false);
    const saving = common_vendor.ref(false);
    const onAvatarTap = () => {
      editNickname.value = userStore.nickname || "";
      editAvatar.value = userStore.avatar || "";
      avatarChanged.value = false;
      showProfileModal.value = true;
    };
    const closeProfileModal = () => {
      if (saving.value)
        return;
      showProfileModal.value = false;
    };
    const onNicknameInput = (e) => {
      editNickname.value = e.detail.value || "";
    };
    const onChooseAvatar = (e) => {
      const path = e.detail.avatarUrl;
      if (path) {
        editAvatar.value = path;
        avatarChanged.value = true;
      }
    };
    const saveProfile = async () => {
      const name = editNickname.value.trim();
      if (!name) {
        common_vendor.index.showToast({ title: "昵称不能为空", icon: "none" });
        return;
      }
      const nicknameChanged = name !== userStore.nickname;
      const needUploadAvatar = avatarChanged.value && editAvatar.value;
      if (!nicknameChanged && !needUploadAvatar) {
        showProfileModal.value = false;
        return;
      }
      saving.value = true;
      try {
        if (needUploadAvatar) {
          await userStore.updateAvatar(editAvatar.value);
        }
        if (nicknameChanged) {
          await userStore.updateNickname(name);
        }
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        showProfileModal.value = false;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/home/home.vue:282", "[home] saveProfile error", e);
        common_vendor.index.showToast({ title: e.message || "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const decoLottieLoaded = common_vendor.ref(false);
    const emptyLottieLoaded = common_vendor.ref(false);
    const instance = common_vendor.getCurrentInstance();
    const loadDecoLottie = async () => {
      await common_vendor.nextTick$1();
      await new Promise((r) => setTimeout(r, 100));
      const anim = await utils_lottie.loadLottieOnReady(
        DECO_CANVAS_ID,
        homeDecoAnim,
        { loop: true, autoplay: true },
        (instance == null ? void 0 : instance.proxy) || null
      );
      if (anim) {
        decoLottieLoaded.value = true;
      }
    };
    const loadEmptyLottie = async () => {
      await common_vendor.nextTick$1();
      await new Promise((r) => setTimeout(r, 100));
      const anim = await utils_lottie.loadLottieOnReady(
        EMPTY_CANVAS_ID,
        emptyAnim,
        { loop: true, autoplay: true },
        (instance == null ? void 0 : instance.proxy) || null
      );
      if (anim) {
        emptyLottieLoaded.value = true;
      }
    };
    const greeting = common_vendor.computed(() => {
      const h2 = (/* @__PURE__ */ new Date()).getHours();
      if (h2 >= 5 && h2 < 11)
        return "早安~";
      if (h2 >= 11 && h2 < 14)
        return "午安~";
      if (h2 >= 14 && h2 < 18)
        return "下午好~";
      if (h2 >= 18 && h2 < 22)
        return "晚上好~";
      return "深夜啦~";
    });
    const greetingSub = common_vendor.computed(() => {
      const h2 = (/* @__PURE__ */ new Date()).getHours();
      if (h2 >= 5 && h2 < 11)
        return "今天想吃点啥呀~";
      if (h2 >= 11 && h2 < 14)
        return "肚子饿了吗~";
      if (h2 >= 14 && h2 < 18)
        return "来杯下午茶吧~";
      if (h2 >= 18 && h2 < 22)
        return "晚饭想吃点啥~";
      return "夜宵时间到啦~";
    });
    const avatarUrl = common_vendor.computed(() => userStore.avatar || "");
    const todaySectionTitle = common_vendor.computed(
      () => userStore.isAdmin ? "今日待制作" : "今日我的点单"
    );
    const emptyEmoji = common_vendor.computed(() => userStore.isAdmin ? "👨‍🍳" : "🛒");
    const emptyText = common_vendor.computed(
      () => userStore.isAdmin ? "今天还没有订单~ 等老婆来点单吧" : "今天还没点单哦~ 去点一杯吧"
    );
    const displayOrders = common_vendor.computed(() => {
      if (userStore.isAdmin)
        return orders.value;
      return orders.value.slice(0, 3);
    });
    const loadOrders = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        const res = await common_vendor._r.callFunction({
          name: "home-data",
          data: {
            token: userStore.token,
            role: userStore.role
          }
        });
        if (res.result.code === 0) {
          orders.value = res.result.list || [];
        } else {
          common_vendor.index.showToast({ title: res.result.message || "加载失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/home/home.vue:389", "[home] loadOrders error", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const goOrder = (type) => {
      cartStore.setPendingType(type);
      common_vendor.index.switchTab({ url: "/pages/order/order" });
    };
    const goRecord = () => {
      common_vendor.index.switchTab({ url: "/pages/record/record" });
    };
    const onOrderTap = ({ order }) => {
      common_vendor.index.navigateTo({
        url: `/pages/order-detail/order-detail?id=${order._id}`
      });
    };
    common_vendor.onMounted(() => {
      loadDecoLottie();
    });
    common_vendor.watch(
      () => !loading.value && orders.value.length === 0,
      (isEmpty) => {
        if (isEmpty) {
          common_vendor.nextTick$1(() => {
            loadEmptyLottie();
          });
        }
      }
    );
    common_vendor.onShow(() => {
      loadOrders();
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadOrders();
      common_vendor.index.stopPullDownRefresh();
    });
    common_vendor.onUnmounted(() => {
      utils_lottie.destroyLottie(DECO_CANVAS_ID);
      utils_lottie.destroyLottie(EMPTY_CANVAS_ID);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: decoLottieLoaded.value ? 1 : "",
        b: !decoLottieLoaded.value,
        c: common_vendor.t(greeting.value),
        d: common_vendor.t(greetingSub.value),
        e: avatarUrl.value
      }, avatarUrl.value ? {
        f: avatarUrl.value
      } : {}, {
        g: common_vendor.o(onAvatarTap, "a8"),
        h: common_vendor.unref(statusBarHeight) + 28 + "px",
        i: common_vendor.unref(headerHeight) + "px",
        j: common_vendor.o(($event) => goOrder("coffee"), "4c"),
        k: common_vendor.o(($event) => goOrder("food"), "45"),
        l: common_vendor.t(todaySectionTitle.value),
        m: common_vendor.t(displayOrders.value.length),
        n: common_vendor.o(goRecord, "94"),
        o: loading.value && orders.value.length === 0
      }, loading.value && orders.value.length === 0 ? {
        p: common_vendor.p({
          type: "card",
          count: 2
        })
      } : orders.value.length === 0 ? {
        r: emptyLottieLoaded.value ? 1 : "",
        s: common_vendor.t(emptyEmoji.value),
        t: !emptyLottieLoaded.value,
        v: common_vendor.t(emptyText.value)
      } : {
        w: common_vendor.f(displayOrders.value, (order, idx, i0) => {
          return {
            a: order._id,
            b: `${idx * 60}ms`,
            c: common_vendor.o(onOrderTap, order._id),
            d: "07e72d3c-2-" + i0,
            e: common_vendor.p({
              order,
              ["show-user"]: common_vendor.unref(userStore).isAdmin
            })
          };
        })
      }, {
        q: orders.value.length === 0,
        x: showProfileModal.value
      }, showProfileModal.value ? common_vendor.e({
        y: editAvatar.value
      }, editAvatar.value ? {
        z: editAvatar.value
      } : {}, {
        A: common_vendor.o(onChooseAvatar, "0b"),
        B: editNickname.value,
        C: showProfileModal.value,
        D: common_vendor.o(onNicknameInput, "a2"),
        E: common_vendor.o(saveProfile, "fd"),
        F: common_vendor.t(editNickname.value.length),
        G: common_vendor.o(closeProfileModal, "1b"),
        H: common_vendor.t(saving.value ? "保存中..." : "保存"),
        I: saving.value || !editNickname.value.trim() ? 1 : "",
        J: common_vendor.o(saveProfile, "29"),
        K: common_vendor.o(() => {
        }, "7d"),
        L: common_vendor.o(closeProfileModal, "5c")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-07e72d3c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/home.js.map
