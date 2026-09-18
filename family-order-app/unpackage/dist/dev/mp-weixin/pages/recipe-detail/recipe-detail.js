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
const PLACEHOLDER_STYLE = "color: rgba(140, 114, 94, 0.55)";
const PICKER_ROW_RPX = 190;
const PICKER_GAP_RPX = 18;
const PICKER_GRID_PAD_RPX = 12;
const PICKER_COLS = 3;
const PICKER_MAX_ROWS = 3;
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
    const pickerKeyword = common_vendor.ref(""), pickerFocused = common_vendor.ref(false);
    const CLOUD_GROUP = { ingredients: "ingredient", seasonings: "seasoning" };
    const materialFromCloud = (item) => ({ id: item.materialId, quantity: item.quantity || "" });
    const materialToCloud = (item) => ({ materialId: item.id, quantity: item.quantity });
    const STEPS_STAMP = Date.now();
    const stepFromCloud = (step, index) => ({
      id: "s" + STEPS_STAMP + "-" + index,
      title: step.title || "",
      description: step.description || "",
      tip: step.tip || ""
    });
    const categories = common_vendor.ref([]);
    const SPICY_OPTIONS = [
      { value: "none", label: "不辣" },
      { value: "mild", label: "微辣" },
      { value: "medium", label: "中辣" },
      { value: "hot", label: "特辣" }
    ];
    const SPICY_LEVELS = SPICY_OPTIONS.map((option) => option.value);
    const spicyCount = common_vendor.computed(() => {
      return Math.max(SPICY_LEVELS.indexOf(shown.value && shown.value.spicy), 0);
    });
    const currentCategoryName = common_vendor.computed(() => {
      const id = shown.value && shown.value.categoryId;
      if (!id)
        return "";
      return (categories.value.find((c) => c.id === id) || {}).name || "";
    });
    const cloudMaterials = common_vendor.ref([]);
    const cloudMaterialMap = common_vendor.computed(() => {
      const map = {};
      for (const m of cloudMaterials.value)
        map[m._id] = m;
      return map;
    });
    const sections = [{ key: "ingredients", title: "食材" }, { key: "seasonings", title: "调料" }];
    const lookup = (id) => {
      const cloud = cloudMaterialMap.value[id];
      if (cloud)
        return { name: cloud.name, image: cloud.image, quantity: "" };
      return mock_recipeEditor.pantry.find((item) => item.id === id) || { name: "食材", image: "", quantity: "" };
    };
    const pickerGroupOptions = common_vendor.computed(() => cloudMaterials.value.filter((m) => m.group === CLOUD_GROUP[picker.value] && m.isActive !== false));
    const pickerOptions = common_vendor.computed(() => {
      const keyword = pickerKeyword.value.trim().toLocaleLowerCase();
      return pickerGroupOptions.value.filter((m) => !keyword || String(m.name || "").toLocaleLowerCase().includes(keyword)).map((m) => ({ id: m._id, name: m.name, image: m.image }));
    });
    const pickerListHeight = common_vendor.computed(() => {
      const rows = Math.min(Math.max(Math.ceil(pickerGroupOptions.value.length / PICKER_COLS), 1), PICKER_MAX_ROWS);
      return rows * PICKER_ROW_RPX + (rows - 1) * PICKER_GAP_RPX + PICKER_GRID_PAD_RPX + "rpx";
    });
    let leaveAfterDiscard = false, nextId = 0;
    const cloudDishId = common_vendor.ref("");
    const loadCloudRecipe = async (id) => {
      try {
        const [matRes, catRes] = await Promise.all([
          common_vendor.Vs.callFunction({ name: "app-service", data: { module: "materials-crud", action: "list" } }),
          common_vendor.Vs.callFunction({ name: "app-service", data: { module: "categories-crud", action: "list", type: "food" } })
        ]);
        const matResult = matRes.result || {};
        if (matResult.code === 0)
          cloudMaterials.value = matResult.list || [];
        const catResult = catRes.result || {};
        if (catResult.code === 0)
          categories.value = (catResult.list || []).map((c) => ({ id: c._id, name: c.name }));
        if (!id)
          return;
        const dishRes = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "dishes-crud", action: "detail", _id: id } });
        const dishResult = dishRes.result || {};
        if (dishResult.code !== 0 || !dishResult.dish)
          return;
        const dish = dishResult.dish;
        const pick = (list) => (Array.isArray(list) ? list : []).filter((item) => item && item.materialId).map(materialFromCloud);
        saved.value = {
          ...saved.value,
          name: dish.name || saved.value.name,
          // description 为空串代表「用户清空了简介」，不能用 || 退回本地那份
          subtitle: typeof dish.description === "string" ? dish.description : saved.value.subtitle,
          // 分类与辣度：云端是旧数据、没有这两个字段时就落回本地那份，
          // 不要在界面上把「本来就没有」显示成「被清空了」
          categoryId: typeof dish.categoryId === "string" ? dish.categoryId : saved.value.categoryId,
          spicy: SPICY_LEVELS.includes(dish.spicy) ? dish.spicy : saved.value.spicy,
          ingredients: pick(dish.ingredients),
          seasonings: pick(dish.seasonings),
          // 步骤同样以云端为准。云端还没有这个字段时（旧数据、尚未录入步骤的菜谱）落回空数组，
          // 页面显示「还没有记录步骤」，而不是继续展示本地演示数据里的那三步
          steps: (Array.isArray(dish.steps) ? dish.steps : []).map(stepFromCloud)
        };
        cloudDishId.value = id;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe-detail/recipe-detail.vue:305", "[recipe-detail] 加载云端菜谱失败", e);
      }
    };
    common_vendor.onLoad(async (options) => {
      try {
        const value = common_vendor.index.getStorageSync(STORAGE_KEY);
        if ((value == null ? void 0 : value.version) === 1 && typeof value.name === "string" && typeof value.subtitle === "string" && ["ingredients", "seasonings"].every((group) => Array.isArray(value[group]) && value[group].every((item) => item && typeof item.id === "string" && typeof item.quantity === "string")) && Array.isArray(value.steps) && value.steps.every((step) => typeof step.id === "string" && ["title", "description", "tip"].every((key) => typeof step[key] === "string")) && !mock_recipeEditor.validateRecipe(value))
          saved.value = mock_recipeEditor.cloneRecipe(value);
      } catch {
      }
      await loadCloudRecipe(options && options.id || "");
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
      pickerKeyword.value = "";
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
    const save = async () => {
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
        value.subtitle = String(value.subtitle || "").trim();
        for (const group of ["ingredients", "seasonings"])
          value[group].forEach((item) => {
            item.quantity = item.quantity.trim();
          });
        value.steps.forEach((step) => {
          for (const key of ["title", "description", "tip"])
            step[key] = step[key].trim();
        });
        let toast = "菜谱已保存";
        if (cloudDishId.value) {
          const res = await common_vendor.Vs.callFunction({
            name: "app-service",
            data: {
              module: "dishes-crud",
              action: "update",
              token: userStore.token,
              _id: cloudDishId.value,
              name: value.name,
              // 简介已不在界面上编辑，但仍原样回传 —— 菜谱列表页卡片的副行在用它（note 为空时回退 description）
              description: value.subtitle,
              // 分类：没选就是空串（合法状态 —— 菜品可以不归类）
              categoryId: value.categoryId || "",
              // 辣度：只有四档之内才写库，脏值落回不辣
              spicy: SPICY_LEVELS.includes(value.spicy) ? value.spicy : "none",
              ingredients: value.ingredients.map(materialToCloud),
              seasonings: value.seasonings.map(materialToCloud),
              // 步骤显式摘掉前端的 id（渲染标识，不进库）；顺序即数组顺序
              steps: value.steps.map((step) => ({ title: step.title, description: step.description, tip: step.tip }))
            }
          });
          const result = res.result || {};
          if (result.code !== 0) {
            common_vendor.index.showToast({ title: result.message || "保存到云端失败，请重试", icon: "none" });
            return;
          }
        } else {
          toast = "已存到本机（未连接云端菜谱）";
        }
        common_vendor.index.setStorageSync(STORAGE_KEY, value);
        saved.value = value;
        exitEditing();
        common_vendor.index.showToast({ title: toast, icon: "none" });
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
      }, editing.value ? common_vendor.e({
        h: draft.value.name,
        i: common_vendor.o(($event) => draft.value.name = $event.detail.value, "8b"),
        j: common_vendor.f(categories.value, (c, k0, i0) => {
          return {
            a: common_vendor.t(c.name),
            b: c.id,
            c: draft.value.categoryId === c.id ? 1 : "",
            d: draft.value.categoryId === c.id,
            e: common_vendor.o(($event) => draft.value.categoryId = c.id, c.id)
          };
        }),
        k: !categories.value.length
      }, !categories.value.length ? {} : {}, {
        l: common_vendor.f(SPICY_OPTIONS, (option, k0, i0) => {
          return {
            a: common_vendor.t(option.label),
            b: option.value,
            c: draft.value.spicy === option.value ? 1 : "",
            d: draft.value.spicy === option.value,
            e: common_vendor.o(($event) => draft.value.spicy = option.value, option.value)
          };
        })
      }) : {
        m: common_vendor.t(shown.value.name)
      }, {
        n: !editing.value && (currentCategoryName.value || spicyCount.value || !cloudDishId.value)
      }, !editing.value && (currentCategoryName.value || spicyCount.value || !cloudDishId.value) ? common_vendor.e({
        o: currentCategoryName.value
      }, currentCategoryName.value ? {
        p: common_vendor.t(currentCategoryName.value)
      } : {}, {
        q: currentCategoryName.value && spicyCount.value
      }, currentCategoryName.value && spicyCount.value ? {} : {}, {
        r: spicyCount.value
      }, spicyCount.value ? {
        s: common_vendor.f(spicyCount.value, (n, k0, i0) => {
          return {
            a: n,
            b: "fc6387aa-1-" + i0
          };
        }),
        t: common_vendor.p({
          name: "chili",
          size: "28rpx",
          ["stroke-width"]: 2.4
        })
      } : {}, {
        v: !cloudDishId.value
      }, !cloudDishId.value ? {} : {}) : {}, {
        w: common_vendor.f(sections, (section, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.n(section.key),
            c: common_vendor.t(section.title)
          }, editing.value ? {
            d: "fc6387aa-2-" + i0,
            e: common_vendor.p({
              name: "plus",
              size: 14
            }),
            f: "添加" + section.title,
            g: common_vendor.o(($event) => openPicker(section.key), section.key)
          } : {}, {
            h: common_vendor.f(shown.value[section.key], (item, k1, i1) => {
              return common_vendor.e(editing.value ? {
                a: "fc6387aa-3-" + i0 + "-" + i1,
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
            i: "fc6387aa-4-" + i0,
            j: common_vendor.p({
              name: "plus",
              size: 23
            }),
            k: "选择" + section.title,
            l: common_vendor.o(($event) => openPicker(section.key), section.key)
          } : {}, {
            m: !shown.value[section.key].length
          }, !shown.value[section.key].length ? {
            n: common_vendor.t(editing.value ? "点「添加」，挑选需要的" + section.title : "暂未记录" + section.title)
          } : {}, {
            o: section.key
          });
        }),
        x: editing.value,
        y: editing.value,
        z: editing.value,
        A: editing.value
      }, editing.value ? {} : {}, {
        B: common_vendor.f(shown.value.steps, (step, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1)
          }, editing.value ? {
            b: "fc6387aa-5-" + i0,
            c: common_vendor.p({
              name: "chevron-up",
              size: 17
            }),
            d: index === 0,
            e: "上移步骤" + (index + 1),
            f: common_vendor.o(($event) => moveStep(index, -1), step.id),
            g: "fc6387aa-6-" + i0,
            h: common_vendor.p({
              name: "chevron-down",
              size: 17
            }),
            i: index === draft.value.steps.length - 1,
            j: "下移步骤" + (index + 1),
            k: common_vendor.o(($event) => moveStep(index, 1), step.id),
            l: "fc6387aa-7-" + i0,
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
            F: "fc6387aa-8-" + i0,
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
        C: editing.value,
        D: editing.value,
        E: editing.value ? 1 : "",
        F: !shown.value.steps.length
      }, !shown.value.steps.length ? {
        G: common_vendor.t(editing.value ? "还没有步骤，点下面的「增加步骤」开始写" : "这道菜还没有记录步骤")
      } : {}, {
        H: editing.value
      }, editing.value ? {
        I: common_vendor.p({
          name: "plus",
          size: 19
        }),
        J: common_vendor.t(draft.value.steps.length >= 30 ? "最多 30 个步骤" : "增加步骤"),
        K: draft.value.steps.length >= 30,
        L: common_vendor.o(addStep, "1f")
      } : {
        M: common_vendor.p({
          name: "food",
          size: 16
        })
      }, {
        N: canEdit.value
      }, canEdit.value ? common_vendor.e({
        O: editing.value
      }, editing.value ? {
        P: common_vendor.o(cancelEditing, "b6"),
        Q: common_vendor.p({
          name: "check",
          size: 18
        }),
        R: common_vendor.t(saving.value ? "正在保存…" : "保存菜谱"),
        S: saving.value,
        T: common_vendor.o(save, "01")
      } : {
        U: common_vendor.p({
          name: "edit",
          size: 18
        }),
        V: common_vendor.o(startEditing, "1e"),
        W: common_vendor.p({
          name: "upload",
          size: 18
        })
      }) : {}, {
        X: picker.value && editing.value && canEdit.value
      }, picker.value && editing.value && canEdit.value ? common_vendor.e({
        Y: common_vendor.o(($event) => picker.value = "", "2a"),
        Z: common_vendor.o(() => {
        }, "f1"),
        aa: common_vendor.t(picker.value === "ingredients" ? "食材" : "调料"),
        ab: common_vendor.p({
          name: "search",
          size: 16,
          ["stroke-width"]: 2.2
        }),
        ac: "搜一搜" + (picker.value === "ingredients" ? "食材" : "调料"),
        ad: PLACEHOLDER_STYLE,
        ae: "搜索" + (picker.value === "ingredients" ? "食材" : "调料"),
        af: common_vendor.o(($event) => pickerFocused.value = true, "fe"),
        ag: common_vendor.o(($event) => pickerFocused.value = false, "17"),
        ah: pickerKeyword.value,
        ai: common_vendor.o(($event) => pickerKeyword.value = $event.detail.value, "0e"),
        aj: pickerKeyword.value
      }, pickerKeyword.value ? {
        ak: common_vendor.p({
          name: "close",
          size: 13
        }),
        al: common_vendor.o(($event) => pickerKeyword.value = "", "e8")
      } : {}, {
        am: pickerFocused.value ? 1 : "",
        an: !pickerOptions.value.length
      }, !pickerOptions.value.length ? common_vendor.e({
        ao: pickerKeyword.value.trim()
      }, pickerKeyword.value.trim() ? {
        ap: common_vendor.t(pickerKeyword.value.trim())
      } : {
        aq: common_vendor.t(picker.value === "ingredients" ? "食材" : "调料"),
        ar: common_vendor.t(CLOUD_GROUP[picker.value])
      }) : {}, {
        as: common_vendor.f(pickerOptions.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.image,
            b: common_vendor.t(item.name),
            c: selection.value.includes(item.id)
          }, selection.value.includes(item.id) ? {
            d: "fc6387aa-16-" + i0,
            e: common_vendor.p({
              name: "check",
              size: 12
            })
          } : {}, {
            f: item.id + "-" + pickerKeyword.value,
            g: Math.min(index, 6) * 20 + "ms",
            h: selection.value.includes(item.id) ? 1 : "",
            i: "选择" + item.name,
            j: selection.value.includes(item.id),
            k: common_vendor.o(($event) => toggleSelection(item.id), item.id + "-" + pickerKeyword.value)
          });
        }),
        at: pickerListHeight.value,
        av: common_vendor.t(selection.value.length),
        aw: common_vendor.o(confirmPicker, "f1")
      }) : {}, {
        ax: common_vendor.o(($event) => discardDialog.value = false, "3f"),
        ay: common_vendor.o(discard, "cd"),
        az: common_vendor.p({
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
