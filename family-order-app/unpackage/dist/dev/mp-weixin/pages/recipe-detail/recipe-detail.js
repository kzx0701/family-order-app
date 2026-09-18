"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
const mock_recipeEditor = require("../../mock/recipe-editor.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_fo_dialog2 = common_vendor.resolveComponent("fo-dialog");
  (_easycom_Icon2 + _easycom_fo_dialog2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_fo_dialog = () => "../../components/fo-dialog/fo-dialog.js";
if (!Math) {
  (_easycom_Icon + _easycom_fo_dialog)();
}
const STORAGE_KEY = "fo_recipe_editor_demo_v2";
const _sfc_main = {
  __name: "recipe-detail",
  setup(__props) {
    const userStore = store_user.useUserStore();
    const canEdit = common_vendor.computed(() => userStore.isCook);
    const { statusBarHeight, menuButton, windowWidth } = composables_useSafeArea.useSafeArea();
    const navTop = common_vendor.computed(() => {
      const btn = menuButton.value;
      if ((btn == null ? void 0 : btn.top) != null && btn.height) {
        const btnPx = 72 / 750 * windowWidth.value;
        return Math.round(btn.top + (btn.height - btnPx) / 2);
      }
      return statusBarHeight.value + 10;
    });
    const badgeTop = common_vendor.computed(() => {
      const btn = menuButton.value;
      return (btn == null ? void 0 : btn.bottom) ? Math.round(btn.bottom + 8) : statusBarHeight.value + 10;
    });
    const saved = common_vendor.ref(mock_recipeEditor.freshRecipe()), draft = common_vendor.ref(null), editing = common_vendor.ref(false), saving = common_vendor.ref(false), attempted = common_vendor.ref(false);
    const shown = common_vendor.computed(() => editing.value ? draft.value : saved.value);
    const dirty = common_vendor.computed(() => editing.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value));
    const picker = common_vendor.ref(""), selection = common_vendor.ref([]), discardDialog = common_vendor.ref(false);
    const CLOUD_GROUP = { ingredients: "ingredient", seasonings: "seasoning" };
    const cloudMaterials = common_vendor.ref([]);
    const cloudMaterialMap = common_vendor.computed(() => {
      const map = {};
      for (const m of cloudMaterials.value)
        map[m._id] = m;
      return map;
    });
    const sections = [{ key: "ingredients", title: "食材", caption: "新鲜一点，好吃一点" }, { key: "seasonings", title: "调料", caption: "好味道的秘密" }];
    const lookup = (id) => {
      const cloud = cloudMaterialMap.value[id];
      if (cloud)
        return { name: cloud.name, image: cloud.image, quantity: cloud.defaultQuantity || "" };
      return mock_recipeEditor.pantry.find((item) => item.id === id) || { name: "食材", image: "", quantity: "" };
    };
    const pickerOptions = common_vendor.computed(() => cloudMaterials.value.filter((m) => m.group === CLOUD_GROUP[picker.value] && m.isActive !== false).map((m) => ({ id: m._id, name: m.name, image: m.image, quantity: m.defaultQuantity || "" })));
    let leaveAfterDiscard = false, nextId = 0;
    const loadCloudSeasonings = async () => {
      try {
        const [matRes, dishRes] = await Promise.all([
          common_vendor.Vs.callFunction({ name: "app-service", data: { module: "materials-crud", action: "list" } }),
          common_vendor.Vs.callFunction({ name: "app-service", data: { module: "dishes-crud", action: "list", type: "food" } })
        ]);
        const matResult = matRes.result || {};
        if (matResult.code === 0)
          cloudMaterials.value = matResult.list || [];
        const dishResult = dishRes.result || {};
        const dish = dishResult.code === 0 ? (dishResult.list || [])[0] : null;
        if (dish && Array.isArray(dish.seasonings) && dish.seasonings.length) {
          saved.value = {
            ...saved.value,
            seasonings: dish.seasonings.map((s) => ({ id: s.materialId, quantity: s.quantity || "" }))
          };
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe-detail/recipe-detail.vue:183", "[recipe-detail] 加载云端调料失败", e);
      }
    };
    common_vendor.onLoad(async () => {
      try {
        const value = common_vendor.index.getStorageSync(STORAGE_KEY);
        if ((value == null ? void 0 : value.version) === 1 && typeof value.name === "string" && typeof value.subtitle === "string" && ["ingredients", "seasonings"].every((group) => Array.isArray(value[group]) && value[group].every((item) => mock_recipeEditor.pantry.some((p) => p.id === item.id && p.group === group) && typeof item.quantity === "string")) && Array.isArray(value.steps) && value.steps.length > 0 && value.steps.every((step) => typeof step.id === "string" && ["title", "description", "tip"].every((key) => typeof step[key] === "string")) && !mock_recipeEditor.validateRecipe(value))
          saved.value = mock_recipeEditor.cloneRecipe(value);
      } catch {
      }
      await loadCloudSeasonings();
    });
    const exitEditing = () => {
      editing.value = false;
      draft.value = null;
      picker.value = "";
      attempted.value = false;
    };
    common_vendor.watch(canEdit, (allowed) => {
      if (!allowed) {
        exitEditing();
        discardDialog.value = false;
      }
    });
    const startEditing = () => {
      if (!canEdit.value)
        return;
      draft.value = mock_recipeEditor.cloneRecipe(saved.value);
      attempted.value = false;
      editing.value = true;
    };
    const back = () => getCurrentPages().length > 1 ? common_vendor.index.navigateBack() : common_vendor.index.switchTab({ url: "/pages/recipe/recipe" });
    const cancelEditing = () => {
      leaveAfterDiscard = false;
      if (dirty.value)
        discardDialog.value = true;
      else
        exitEditing();
    };
    const requestBack = () => {
      if (picker.value) {
        picker.value = "";
        return;
      }
      if (dirty.value) {
        leaveAfterDiscard = true;
        discardDialog.value = true;
      } else {
        exitEditing();
        back();
      }
    };
    const discard = () => {
      discardDialog.value = false;
      exitEditing();
      if (leaveAfterDiscard)
        back();
    };
    common_vendor.onBackPress(() => {
      if (picker.value) {
        picker.value = "";
        return true;
      }
      if (dirty.value) {
        leaveAfterDiscard = true;
        discardDialog.value = true;
        return true;
      }
      return false;
    });
    const openPicker = (group) => {
      if (!editing.value || !canEdit.value)
        return;
      selection.value = draft.value[group].map((item) => item.id);
      picker.value = group;
    };
    const toggleSelection = (id) => {
      selection.value = selection.value.includes(id) ? selection.value.filter((value) => value !== id) : [...selection.value, id];
    };
    const confirmPicker = () => {
      if (!canEdit.value || !editing.value || !picker.value)
        return;
      const group = picker.value;
      draft.value[group] = selection.value.map((id) => draft.value[group].find((item) => item.id === id) || { id, quantity: lookup(id).quantity });
      picker.value = "";
    };
    const removeMaterial = (group, id) => {
      if (canEdit.value && editing.value)
        draft.value[group] = draft.value[group].filter((item) => item.id !== id);
    };
    const addStep = async () => {
      if (!canEdit.value || !editing.value || draft.value.steps.length >= 30)
        return;
      const id = "new-" + Date.now() + "-" + nextId++;
      draft.value.steps.push({ id, title: "", description: "", tip: "" });
      await common_vendor.nextTick$1();
      common_vendor.index.pageScrollTo({ selector: "#step-" + id, duration: 220 });
    };
    const removeStep = (index) => {
      if (canEdit.value && editing.value && draft.value.steps.length > 1)
        draft.value.steps.splice(index, 1);
    };
    const moveStep = (index, direction) => {
      if (!canEdit.value || !editing.value)
        return;
      const target = index + direction;
      if (target < 0 || target >= draft.value.steps.length)
        return;
      const [step] = draft.value.steps.splice(index, 1);
      draft.value.steps.splice(target, 0, step);
    };
    const save = () => {
      if (!canEdit.value || !editing.value || saving.value)
        return;
      attempted.value = true;
      const error = mock_recipeEditor.validateRecipe(draft.value);
      if (error) {
        common_vendor.index.showToast({ title: error, icon: "none" });
        const invalid = draft.value.steps.find((step) => !step.title.trim());
        if (invalid)
          common_vendor.index.pageScrollTo({ selector: "#step-" + invalid.id, duration: 220 });
        else
          common_vendor.index.pageScrollTo({ scrollTop: 0, duration: 220 });
        return;
      }
      saving.value = true;
      try {
        const value = mock_recipeEditor.cloneRecipe(draft.value);
        value.name = value.name.trim();
        value.subtitle = value.subtitle.trim();
        for (const group of ["ingredients", "seasonings"])
          value[group].forEach((item) => {
            item.quantity = item.quantity.trim();
          });
        value.steps.forEach((step) => {
          for (const key of ["title", "description", "tip"])
            step[key] = step[key].trim();
        });
        common_vendor.index.setStorageSync(STORAGE_KEY, value);
        saved.value = value;
        exitEditing();
        common_vendor.index.showToast({ title: "菜谱已保存到本机", icon: "none" });
      } catch {
        common_vendor.index.showToast({ title: "保存失败，修改仍在，请重试", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          name: "arrow-left",
          size: 20
        }),
        b: common_vendor.o(requestBack, "1f"),
        c: navTop.value + "px",
        d: editing.value
      }, editing.value ? {
        e: badgeTop.value + "px"
      } : {}, {
        f: common_assets._imports_0$1,
        g: editing.value
      }, editing.value ? {
        h: draft.value.name,
        i: common_vendor.o(($event) => draft.value.name = $event.detail.value, "c1"),
        j: draft.value.subtitle,
        k: common_vendor.o(($event) => draft.value.subtitle = $event.detail.value, "d0")
      } : common_vendor.e({
        l: common_vendor.t(shown.value.name),
        m: shown.value.subtitle
      }, shown.value.subtitle ? {
        n: common_vendor.t(shown.value.subtitle)
      } : {}), {
        o: common_vendor.f(sections, (section, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.n(section.key),
            c: common_vendor.t(section.title)
          }, !editing.value ? {
            d: common_vendor.t(section.caption)
          } : {
            e: "fc6387aa-1-" + i0,
            f: common_vendor.p({
              name: "plus",
              size: 14
            }),
            g: "添加" + section.title,
            h: common_vendor.o(($event) => openPicker(section.key), section.key)
          }, {
            i: common_vendor.f(shown.value[section.key], (item, k1, i1) => {
              return common_vendor.e(editing.value ? {
                a: "fc6387aa-2-" + i0 + "-" + i1,
                b: common_vendor.p({
                  name: "minus",
                  size: 13
                }),
                c: "移除" + lookup(item.id).name,
                d: common_vendor.o(($event) => removeMaterial(section.key, item.id), item.id)
              } : {}, {
                e: lookup(item.id).image,
                f: common_vendor.t(lookup(item.id).name),
                g: item.id
              });
            })
          }, editing.value ? {
            j: "fc6387aa-3-" + i0,
            k: common_vendor.p({
              name: "plus",
              size: 23
            }),
            l: "选择" + section.title,
            m: common_vendor.o(($event) => openPicker(section.key), section.key)
          } : {}, {
            n: !shown.value[section.key].length
          }, !shown.value[section.key].length ? {
            o: common_vendor.t(editing.value ? "点「添加」，挑选需要的" + section.title : "暂未记录" + section.title)
          } : {}, {
            p: section.key
          });
        }),
        p: !editing.value,
        q: editing.value,
        r: editing.value,
        s: common_vendor.t(shown.value.steps.length),
        t: editing.value
      }, editing.value ? {} : {}, {
        v: common_vendor.f(shown.value.steps, (step, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1)
          }, editing.value ? {
            b: "fc6387aa-4-" + i0,
            c: common_vendor.p({
              name: "chevron-up",
              size: 17
            }),
            d: index === 0,
            e: "上移步骤" + (index + 1),
            f: common_vendor.o(($event) => moveStep(index, -1), step.id),
            g: "fc6387aa-5-" + i0,
            h: common_vendor.p({
              name: "chevron-down",
              size: 17
            }),
            i: index === draft.value.steps.length - 1,
            j: "下移步骤" + (index + 1),
            k: common_vendor.o(($event) => moveStep(index, 1), step.id),
            l: "fc6387aa-6-" + i0,
            m: common_vendor.p({
              name: "trash",
              size: 16
            }),
            n: draft.value.steps.length === 1,
            o: "删除步骤" + (index + 1),
            p: common_vendor.o(($event) => removeStep(index), step.id)
          } : {}, editing.value ? common_vendor.e({
            q: "步骤" + (index + 1) + "名称",
            r: step.title,
            s: common_vendor.o(($event) => step.title = $event.detail.value, step.id),
            t: attempted.value && !step.title.trim()
          }, attempted.value && !step.title.trim() ? {} : {}, {
            v: "步骤" + (index + 1) + "详情",
            w: step.description,
            x: common_vendor.o(($event) => step.description = $event.detail.value, step.id),
            y: "步骤" + (index + 1) + "注意事项",
            z: step.tip,
            A: common_vendor.o(($event) => step.tip = $event.detail.value, step.id)
          }) : common_vendor.e({
            B: common_vendor.t(step.title),
            C: step.description
          }, step.description ? {
            D: common_vendor.t(step.description)
          } : {}, {
            E: step.tip
          }, step.tip ? {
            F: "fc6387aa-7-" + i0,
            G: common_vendor.p({
              name: "note",
              size: 16
            }),
            H: common_vendor.t(step.tip)
          } : {}), {
            I: "step-" + step.id,
            J: step.id,
            K: editing.value && attempted.value && !step.title.trim() ? 1 : ""
          });
        }),
        w: editing.value,
        x: editing.value,
        y: editing.value ? 1 : "",
        z: editing.value
      }, editing.value ? {
        A: common_vendor.p({
          name: "plus",
          size: 19
        }),
        B: common_vendor.t(draft.value.steps.length >= 30 ? "最多 30 个步骤" : "增加步骤"),
        C: draft.value.steps.length >= 30,
        D: common_vendor.o(addStep, "86")
      } : {
        E: common_vendor.p({
          name: "food",
          size: 16
        })
      }, {
        F: canEdit.value
      }, canEdit.value ? common_vendor.e({
        G: editing.value
      }, editing.value ? {
        H: common_vendor.o(cancelEditing, "6e"),
        I: common_vendor.p({
          name: "check",
          size: 18
        }),
        J: common_vendor.t(saving.value ? "正在保存…" : "保存菜谱"),
        K: saving.value,
        L: common_vendor.o(save, "c7")
      } : {
        M: common_vendor.p({
          name: "edit",
          size: 18
        }),
        N: common_vendor.o(startEditing, "c6"),
        O: common_vendor.p({
          name: "upload",
          size: 18
        })
      }) : {}, {
        P: picker.value && editing.value && canEdit.value
      }, picker.value && editing.value && canEdit.value ? {
        Q: common_vendor.o(($event) => picker.value = "", "11"),
        R: common_vendor.o(() => {
        }, "fc"),
        S: common_vendor.t(picker.value === "ingredients" ? "食材" : "调料"),
        T: common_vendor.p({
          name: "close",
          size: 20
        }),
        U: common_vendor.o(($event) => picker.value = "", "93"),
        V: common_vendor.f(pickerOptions.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.image,
            b: common_vendor.t(item.name),
            c: selection.value.includes(item.id)
          }, selection.value.includes(item.id) ? {
            d: "fc6387aa-14-" + i0,
            e: common_vendor.p({
              name: "check",
              size: 12
            })
          } : {}, {
            f: item.id,
            g: selection.value.includes(item.id) ? 1 : "",
            h: "选择" + item.name,
            i: selection.value.includes(item.id),
            j: common_vendor.o(($event) => toggleSelection(item.id), item.id)
          });
        }),
        W: common_vendor.t(selection.value.length),
        X: common_vendor.o(confirmPicker, "0b")
      } : {}, {
        Y: common_vendor.o(($event) => discardDialog.value = false, "b2"),
        Z: common_vendor.o(discard, "d9"),
        aa: common_vendor.p({
          visible: discardDialog.value,
          title: "收起这次修改？",
          subtitle: "未保存的内容会丢失，原来的菜谱仍会保留。",
          ["cancel-text"]: "继续编辑",
          ["confirm-text"]: "放弃修改"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fc6387aa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe-detail/recipe-detail.js.map
