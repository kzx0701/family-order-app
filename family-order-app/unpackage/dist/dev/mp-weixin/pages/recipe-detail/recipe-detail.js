"use strict";
const common_vendor = require("../../common/vendor.js");
const mock_recipes = require("../../mock/recipes.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  _easycom_Icon2();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
if (!Math) {
  (_easycom_Icon + RecipeArt)();
}
const RecipeArt = () => "../../components/recipe-art/recipe-art.js";
const _sfc_main = {
  __name: "recipe-detail",
  setup(__props) {
    const { statusBarHeight, menuButton } = composables_useSafeArea.useSafeArea();
    const navTop = common_vendor.computed(() => {
      var _a;
      return ((_a = menuButton.value) == null ? void 0 : _a.bottom) ? menuButton.value.bottom + 6 : statusBarHeight.value + 12;
    });
    const recipe = common_vendor.ref(null);
    const servings = common_vendor.ref(2);
    const flavor = common_vendor.ref("");
    const checked = common_vendor.ref([]);
    const ingredients = common_vendor.computed(() => recipe.value ? mock_recipes.resolveIngredients(recipe.value, flavor.value, servings.value) : []);
    const cooking = common_vendor.ref(false);
    const closing = common_vendor.ref(false);
    const finished = common_vendor.ref(false);
    const activeStep = common_vendor.ref(0);
    let closeTimer;
    common_vendor.onLoad((options) => {
      recipe.value = mock_recipes.recipes.find((item) => item.id === (options == null ? void 0 : options.id)) || null;
      if (recipe.value) {
        servings.value = recipe.value.servings;
        flavor.value = recipe.value.defaultFlavor;
      }
    });
    const goBack = () => getCurrentPages().length > 1 ? common_vendor.index.navigateBack() : common_vendor.index.switchTab({ url: "/pages/recipe/recipe" });
    const toggleIngredient = (id) => {
      checked.value = checked.value.includes(id) ? checked.value.filter((value) => value !== id) : [...checked.value, id];
    };
    const changeServings = (direction) => {
      servings.value = Math.max(1, Math.min(8, servings.value + direction));
      checked.value = [];
    };
    const changeFlavor = (option) => {
      if (flavor.value === option)
        return;
      flavor.value = option;
      checked.value = [];
    };
    const startCooking = () => {
      var _a;
      if (!((_a = recipe.value) == null ? void 0 : _a.complete))
        return;
      if (finished.value) {
        activeStep.value = 0;
        finished.value = false;
      }
      cooking.value = true;
      closing.value = false;
    };
    const closeCooking = () => {
      if (closing.value)
        return;
      closing.value = true;
      closeTimer = setTimeout(() => {
        cooking.value = false;
        closing.value = false;
      }, 220);
    };
    const nextStep = () => {
      if (finished.value)
        return closeCooking();
      if (activeStep.value < recipe.value.steps.length - 1)
        activeStep.value++;
      else
        finished.value = true;
    };
    common_vendor.onBackPress(() => {
      if (cooking.value) {
        closeCooking();
        return true;
      }
      return false;
    });
    common_vendor.onUnmounted(() => clearTimeout(closeTimer));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: cooking.value ? "overflow: hidden;" : "",
        b: common_vendor.p({
          name: "arrow-left",
          size: 21
        }),
        c: common_vendor.o(goBack, "2d"),
        d: navTop.value + "px",
        e: recipe.value
      }, recipe.value ? common_vendor.e({
        f: common_vendor.p({
          index: recipe.value.art,
          label: recipe.value.name
        }),
        g: common_vendor.t(recipe.value.label),
        h: common_vendor.t(recipe.value.name),
        i: common_vendor.t(recipe.value.subtitle),
        j: common_vendor.p({
          name: "clock",
          size: 18
        }),
        k: common_vendor.t(recipe.value.minutes),
        l: common_vendor.p({
          name: "star",
          size: 18
        }),
        m: common_vendor.t(recipe.value.difficulty),
        n: common_vendor.p({
          name: "user",
          size: 18
        }),
        o: common_vendor.t(servings.value),
        p: common_vendor.t(recipe.value.unit),
        q: common_vendor.p({
          name: "note",
          size: 20
        }),
        r: common_vendor.t(recipe.value.note),
        s: common_vendor.t(checked.value.length),
        t: common_vendor.t(ingredients.value.length),
        v: common_vendor.p({
          name: "minus",
          size: 16
        }),
        w: servings.value <= 1,
        x: common_vendor.o(($event) => changeServings(-1), "8e"),
        y: common_vendor.t(servings.value),
        z: common_vendor.t(recipe.value.unit),
        A: common_vendor.p({
          name: "plus",
          size: 16
        }),
        B: servings.value >= 8,
        C: common_vendor.o(($event) => changeServings(1), "59"),
        D: common_vendor.f(recipe.value.flavors, (option, k0, i0) => {
          return {
            a: common_vendor.t(option),
            b: option,
            c: flavor.value === option ? 1 : "",
            d: flavor.value === option,
            e: common_vendor.o(($event) => changeFlavor(option), option)
          };
        }),
        E: common_vendor.p({
          name: "check",
          size: 12
        }),
        F: common_vendor.f(ingredients.value, (item, k0, i0) => {
          return common_vendor.e({
            a: checked.value.includes(item.id)
          }, checked.value.includes(item.id) ? {
            b: "fc6387aa-9-" + i0,
            c: common_vendor.p({
              name: "check",
              size: 13
            })
          } : {}, {
            d: common_vendor.t(item.name),
            e: common_vendor.t(item.amount),
            f: common_vendor.t(item.unit),
            g: item.id,
            h: checked.value.includes(item.id) ? 1 : "",
            i: checked.value.includes(item.id),
            j: common_vendor.o(($event) => toggleIngredient(item.id), item.id)
          });
        }),
        G: common_vendor.t(recipe.value.steps.length ? recipe.value.steps.length + " 个小步骤" : "还在记录中"),
        H: recipe.value.steps.length
      }, recipe.value.steps.length ? {
        I: common_vendor.f(recipe.value.steps, (step, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.t(step.title),
            c: common_vendor.t(step.description),
            d: step.tip
          }, step.tip ? {
            e: common_vendor.t(step.tip)
          } : {}, {
            f: step.title
          });
        })
      } : {
        J: common_vendor.p({
          name: "edit",
          size: 26
        })
      }, {
        K: common_vendor.p({
          name: "food",
          size: 17
        }),
        L: common_vendor.t(recipe.value.complete ? "围裙系好了吗？" : "这份菜谱还在长大"),
        M: common_vendor.t(recipe.value.complete ? "一步一步来，好味道不着急" : "补齐步骤后，就能一起做啦"),
        N: common_vendor.p({
          name: "food",
          size: 17
        }),
        O: common_vendor.t(recipe.value.complete ? "跟着做" : "待完善"),
        P: !recipe.value.complete,
        Q: common_vendor.o(startCooking, "ff")
      }) : {
        R: common_vendor.p({
          name: "book-open",
          size: 45
        }),
        S: common_vendor.o(goBack, "ea")
      }, {
        T: cooking.value
      }, cooking.value ? common_vendor.e({
        U: common_vendor.o(closeCooking, "e1"),
        V: common_vendor.o(() => {
        }, "8f"),
        W: common_vendor.t(recipe.value.name),
        X: common_vendor.t(servings.value),
        Y: common_vendor.t(recipe.value.unit),
        Z: common_vendor.t(flavor.value),
        aa: common_vendor.t(finished.value ? "好啦，开饭咯！" : "一步一步，好好做饭"),
        ab: common_vendor.p({
          name: "close",
          size: 21
        }),
        ac: common_vendor.o(closeCooking, "24"),
        ad: "scaleX(" + (finished.value ? 1 : (activeStep.value + 1) / recipe.value.steps.length) + ")",
        ae: finished.value
      }, finished.value ? {
        af: common_vendor.p({
          name: "check",
          size: 44
        })
      } : common_vendor.e({
        ag: common_vendor.t(String(activeStep.value + 1).padStart(2, "0")),
        ah: common_vendor.t(String(recipe.value.steps.length).padStart(2, "0")),
        ai: common_vendor.t(recipe.value.steps[activeStep.value].title),
        aj: common_vendor.t(recipe.value.steps[activeStep.value].description),
        ak: recipe.value.steps[activeStep.value].tip
      }, recipe.value.steps[activeStep.value].tip ? {
        al: common_vendor.t(recipe.value.steps[activeStep.value].tip)
      } : {}, {
        am: activeStep.value
      }), {
        an: !finished.value
      }, !finished.value ? {
        ao: activeStep.value === 0,
        ap: common_vendor.o(($event) => activeStep.value--, "20")
      } : {}, {
        aq: common_vendor.t(finished.value ? "收好小食谱" : activeStep.value === recipe.value.steps.length - 1 ? "做好啦，开饭！" : "完成这步，继续"),
        ar: !finished.value
      }, !finished.value ? {
        as: common_vendor.p({
          name: "chevron-right",
          size: 17
        })
      } : {}, {
        at: common_vendor.o(nextStep, "4e"),
        av: common_vendor.t(finished.value ? "每一次用心，都让家的味道更好一点。" : "退出后再次打开，可以接着这一步。"),
        aw: closing.value ? 1 : ""
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fc6387aa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe-detail/recipe-detail.js.map
