"use strict";
const common_vendor = require("../../common/vendor.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const composables_useCoverUpload = require("../../composables/useCoverUpload.js");
const store_user = require("../../store/user.js");
const mock_recipeEditor = require("../../mock/recipe-editor.js");
const utils_spicy = require("../../utils/spicy.js");
const utils_categoryArt = require("../../utils/category-art.js");
const utils_image = require("../../utils/image.js");
if (!Array) {
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_fo_dialog2 = common_vendor.resolveComponent("fo-dialog");
  const _easycom_image_cropper2 = common_vendor.resolveComponent("image-cropper");
  (_easycom_Icon2 + _easycom_fo_dialog2 + _easycom_image_cropper2)();
}
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_fo_dialog = () => "../../components/fo-dialog/fo-dialog.js";
const _easycom_image_cropper = () => "../../components/image-cropper/image-cropper.js";
if (!Math) {
  (_easycom_Icon + _easycom_fo_dialog + _easycom_image_cropper)();
}
const PLACEHOLDER_STYLE = "color: rgba(140, 114, 94, 0.55)";
const FALLBACK_CATEGORY_ICON = "food";
const PICKER_ROW_RPX = 190;
const PICKER_ROW_SPICY_RPX = 176;
const PICKER_GAP_RPX = 18;
const PICKER_GRID_PAD_RPX = 12;
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
    const saved = common_vendor.ref(mock_recipeEditor.blankRecipe()), draft = common_vendor.ref(null), editing = common_vendor.ref(false), saving = common_vendor.ref(false), attempted = common_vendor.ref(false);
    const shown = common_vendor.computed(() => editing.value ? draft.value : saved.value);
    const dirty = common_vendor.computed(() => editing.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value));
    const loadFailed = common_vendor.ref(false);
    const retrying = common_vendor.ref(false);
    const routeId = common_vendor.ref("");
    const HERO_ART_WIDTH = utils_image.IMG_W.dishCover;
    const MATERIAL_ART_WIDTH = utils_image.IMG_W.materialArt;
    const PICKER_ART_WIDTH = utils_image.IMG_W.pickerArt;
    const FIELD_ART_WIDTH = utils_image.IMG_W.fieldArt;
    const heroReady = common_vendor.ref(false), heroFailed = common_vendor.ref(false);
    const heroSrc = common_vendor.computed(() => {
      if (heroFailed.value)
        return "";
      const raw = shown.value && shown.value.image || "";
      return raw ? utils_image.imgUrl(raw, { w: HERO_ART_WIDTH }) : "";
    });
    common_vendor.watch(() => shown.value && shown.value.image || "", () => {
      heroReady.value = false;
      heroFailed.value = false;
    });
    const onHeroError = () => {
      heroFailed.value = true;
    };
    const onHeroLoaded = () => {
      heroReady.value = true;
    };
    const {
      uploading,
      uploadProgress,
      chooseImage,
      cropperVisible,
      cropperSrc,
      cancelCrop: onCropCancel,
      confirmCrop: onCropConfirm
    } = composables_useCoverUpload.useCoverUpload({ onUploaded: (url) => {
      if (draft.value)
        draft.value.image = url;
    } });
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
    const categoryOptions = common_vendor.computed(() => categories.value.map((c) => {
      const art = c.image || utils_categoryArt.categoryArt(c.name);
      return { id: c.id, name: c.name, image: utils_image.imgUrl(art, { w: PICKER_ART_WIDTH }), icon: art ? "" : FALLBACK_CATEGORY_ICON };
    }));
    const spicyArt = common_vendor.computed(() => utils_spicy.spicyMark(shown.value && shown.value.spicy));
    const currentCategory = common_vendor.computed(() => categoryOptions.value.find((o) => o.id === (shown.value && shown.value.categoryId)) || null);
    const currentCategoryName = common_vendor.computed(() => (currentCategory.value || {}).name || "");
    const currentCategoryImage = common_vendor.computed(() => utils_image.imgUrl((currentCategory.value || {}).image || "", { w: FIELD_ART_WIDTH }));
    const currentCategoryIcon = common_vendor.computed(() => {
      const item = currentCategory.value || {};
      return item.icon || (item.image ? "" : FALLBACK_CATEGORY_ICON);
    });
    const currentSpicy = common_vendor.computed(() => utils_spicy.SPICY_OPTIONS.find((o) => o.value === (shown.value && shown.value.spicy)) || utils_spicy.SPICY_OPTIONS[0]);
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
      return { name: "食材", image: "", quantity: "" };
    };
    const materialArt = (id) => utils_image.imgUrl(lookup(id).image, { w: MATERIAL_ART_WIDTH });
    const PICKER_KINDS = {
      ingredients: {
        noun: "食材",
        title: "挑一点食材",
        subtitle: "厨房的小伙伴，都在这里",
        searchable: true,
        multiple: true,
        emptyTitle: "这里还没有可选的食材",
        emptyHint: "请先在云端的 materials 集合里添加，group 填 ingredient"
      },
      seasonings: {
        noun: "调料",
        title: "挑一点调料",
        subtitle: "好味道的秘密，都在这里",
        searchable: true,
        multiple: true,
        emptyTitle: "这里还没有可选的调料",
        emptyHint: "请先在云端的 materials 集合里添加，group 填 seasoning"
      },
      category: {
        noun: "分类",
        title: "挑一个最像它的",
        subtitle: "先归好类，翻菜谱时更好找",
        searchable: false,
        multiple: false,
        emptyTitle: "这里还没有可选的分类",
        emptyHint: "请先在云端的 categories 集合里添加，type 填 food"
      },
      spicy: {
        noun: "辣度",
        title: "这道菜有多辣",
        subtitle: "挑一档，做的时候照着来",
        searchable: false,
        multiple: false,
        emptyTitle: "",
        emptyHint: ""
      }
    };
    const pickerKind = common_vendor.computed(() => PICKER_KINDS[picker.value] || PICKER_KINDS.ingredients);
    const pickerAllOptions = common_vendor.computed(() => {
      if (picker.value === "category")
        return categoryOptions.value;
      if (picker.value === "spicy")
        return utils_spicy.SPICY_OPTIONS.map((o) => ({ id: o.value, name: o.label, image: o.image }));
      return cloudMaterials.value.filter((m) => m.group === CLOUD_GROUP[picker.value] && m.isActive !== false).map((m) => ({ id: m._id, name: m.name, image: utils_image.imgUrl(m.image, { w: PICKER_ART_WIDTH }) }));
    });
    const pickerOptions = common_vendor.computed(() => {
      if (!pickerKind.value.searchable)
        return pickerAllOptions.value;
      const keyword = pickerKeyword.value.trim().toLocaleLowerCase();
      if (!keyword)
        return pickerAllOptions.value;
      return pickerAllOptions.value.filter((o) => String(o.name || "").toLocaleLowerCase().includes(keyword));
    });
    const pickerConfirmText = common_vendor.computed(() => {
      if (!picker.value)
        return "";
      if (!pickerKind.value.multiple)
        return selection.value.length ? "就选这个" : "先不选";
      return `就选这些 · ${selection.value.length} 种`;
    });
    const pickerCols = common_vendor.computed(() => picker.value === "spicy" ? 4 : 3);
    const pickerRowRpx = common_vendor.computed(() => picker.value === "spicy" ? PICKER_ROW_SPICY_RPX : PICKER_ROW_RPX);
    const pickerListHeight = common_vendor.computed(() => {
      const rows = Math.min(Math.max(Math.ceil(pickerAllOptions.value.length / pickerCols.value), 1), PICKER_MAX_ROWS);
      return rows * pickerRowRpx.value + (rows - 1) * PICKER_GAP_RPX + PICKER_GRID_PAD_RPX + "rpx";
    });
    let leaveAfterDiscard = false, nextId = 0;
    const cloudDishId = common_vendor.ref("");
    const published = common_vendor.ref(false);
    const publishing = common_vendor.ref(false);
    const loadMaterials = async () => {
      try {
        const res = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "materials-crud", action: "list" } });
        const result = res.result || {};
        if (result.code === 0) {
          cloudMaterials.value = result.list || [];
        } else {
          common_vendor.index.__f__("warn", "at pages/recipe-detail/recipe-detail.vue:512", "[recipe-detail] 物料加载失败", result.code, result.message);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe-detail/recipe-detail.vue:515", "[recipe-detail] 物料请求异常", e);
      }
    };
    const loadCategories = async () => {
      try {
        const res = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "categories-crud", action: "list", type: "food" } });
        const result = res.result || {};
        if (result.code !== 0)
          common_vendor.index.__f__("warn", "at pages/recipe-detail/recipe-detail.vue:535", "[recipe-detail] 分类(type=food)查询失败", result.code, result.message);
        let list = result.code === 0 ? result.list || [] : [];
        if (!list.length) {
          const allRes = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "categories-crud", action: "list" } });
          const allResult = allRes.result || {};
          if (allResult.code === 0) {
            list = allResult.list || [];
          } else {
            common_vendor.index.__f__("warn", "at pages/recipe-detail/recipe-detail.vue:543", "[recipe-detail] 分类全量查询也失败", allResult.code, allResult.message);
          }
        }
        categories.value = list.filter((c) => !c.type || c.type === "food").map((c) => ({ id: c._id, name: c.name, image: c.image || "" }));
        if (!categories.value.length)
          common_vendor.index.__f__("warn", "at pages/recipe-detail/recipe-detail.vue:549", "[recipe-detail] 分类结果为空，抽屉会显示空态");
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe-detail/recipe-detail.vue:551", "[recipe-detail] 分类请求异常", e);
      }
    };
    const loadCloudRecipe = async (id) => {
      await Promise.all([loadMaterials(), loadCategories()]);
      if (!id)
        return;
      try {
        const dishRes = await common_vendor.Vs.callFunction({ name: "app-service", data: { module: "dishes-crud", action: "detail", _id: id } });
        const dishResult = dishRes.result || {};
        if (dishResult.code !== 0 || !dishResult.dish) {
          common_vendor.index.__f__("warn", "at pages/recipe-detail/recipe-detail.vue:574", "[recipe-detail] 菜谱详情没拿到", dishResult.code, dishResult.message || "（接口未返回 dish）");
          loadFailed.value = true;
          return;
        }
        const dish = dishResult.dish;
        const pick = (list) => (Array.isArray(list) ? list : []).filter((item) => item && item.materialId).map(materialFromCloud);
        saved.value = {
          ...saved.value,
          name: dish.name || saved.value.name,
          // description 为空串代表「用户清空了简介」，不能用 || 退回本地那份
          subtitle: typeof dish.description === "string" ? dish.description : saved.value.subtitle,
          // 封面同一规则：空串是「这道菜还没有封面」，不能退回本地那份
          image: typeof dish.image === "string" ? dish.image : saved.value.image,
          // 分类与辣度：云端是旧数据、没有这两个字段时就落回本地那份，
          // 不要在界面上把「本来就没有」显示成「被清空了」
          categoryId: typeof dish.categoryId === "string" ? dish.categoryId : saved.value.categoryId,
          spicy: utils_spicy.SPICY_LEVELS.includes(dish.spicy) ? dish.spicy : saved.value.spicy,
          ingredients: pick(dish.ingredients),
          seasonings: pick(dish.seasonings),
          // 步骤同样以云端为准。云端还没有这个字段时（旧数据、尚未录入步骤的菜谱）落回空数组，
          // 页面显示「还没有记录步骤」，而不是继续展示本地演示数据里的那三步
          steps: (Array.isArray(dish.steps) ? dish.steps : []).map(stepFromCloud)
        };
        cloudDishId.value = id;
        published.value = dish.isOnSale !== false;
        loadFailed.value = false;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe-detail/recipe-detail.vue:605", "[recipe-detail] 加载云端菜谱失败", e);
        loadFailed.value = true;
      }
    };
    const retryLoad = async () => {
      if (retrying.value || !routeId.value)
        return;
      retrying.value = true;
      try {
        await loadCloudRecipe(routeId.value);
      } finally {
        retrying.value = false;
      }
    };
    const creating = common_vendor.ref(false);
    common_vendor.onLoad(async (options) => {
      const route = options || {};
      routeId.value = route.id || "";
      if (route.mode === "create") {
        creating.value = true;
        saved.value = mock_recipeEditor.blankRecipe();
        draft.value = mock_recipeEditor.cloneRecipe(saved.value);
        editing.value = true;
        attempted.value = false;
        await loadCloudRecipe("");
        return;
      }
      if (!routeId.value) {
        common_vendor.index.__f__("warn", "at pages/recipe-detail/recipe-detail.vue:662", "[recipe-detail] 路由没有带 id，无法取菜谱");
        loadFailed.value = true;
        return;
      }
      await loadCloudRecipe(routeId.value);
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
      if (creating.value) {
        creating.value = false;
        if (dirty.value) {
          leaveAfterDiscard = true;
          discardDialog.value = true;
        } else
          back();
        return;
      }
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
      if (creating.value) {
        creating.value = false;
        back();
        return;
      }
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
    const openPicker = (kind) => {
      if (!editing.value || !canEdit.value || !PICKER_KINDS[kind])
        return;
      if (kind === "category")
        selection.value = draft.value.categoryId ? [draft.value.categoryId] : [];
      else if (kind === "spicy")
        selection.value = [utils_spicy.SPICY_LEVELS.includes(draft.value.spicy) ? draft.value.spicy : "none"];
      else
        selection.value = draft.value[kind].map((item) => item.id);
      pickerKeyword.value = "";
      picker.value = kind;
    };
    const toggleSelection = (id) => {
      if (pickerKind.value.multiple)
        selection.value = selection.value.includes(id) ? selection.value.filter((value) => value !== id) : [...selection.value, id];
      else
        selection.value = selection.value.includes(id) ? [] : [id];
    };
    const confirmPicker = () => {
      if (!canEdit.value || !editing.value || !picker.value)
        return;
      const kind = picker.value;
      if (kind === "category") {
        draft.value.categoryId = selection.value[0] || "";
      } else if (kind === "spicy") {
        draft.value.spicy = selection.value[0] || "none";
      } else {
        draft.value[kind] = selection.value.map((id) => draft.value[kind].find((item) => item.id === id) || { id, quantity: lookup(id).quantity });
      }
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
        const fields = {
          name: value.name,
          // 封面：编辑器里刚换过的就是可访问链接；没换过则是从云端读回的原值，原样回传
          // （空串是合法值 —— 这道菜没有封面）
          image: value.image || "",
          // 描述：这一页已经能编辑（辣度下方那个输入框）；它同时是菜谱列表页卡片副行的来源
          // （note 为空时回退它），所以为空串也要如实写回去 —— 那是「用户清空了描述」，不是「没改」
          description: value.subtitle,
          // 分类：没选就是空串（合法状态 —— 菜品可以不归类）
          categoryId: value.categoryId || "",
          // 辣度：只有四档之内才写库，脏值落回不辣
          spicy: utils_spicy.SPICY_LEVELS.includes(value.spicy) ? value.spicy : "none",
          ingredients: value.ingredients.map(materialToCloud),
          seasonings: value.seasonings.map(materialToCloud),
          // 步骤显式摘掉前端的 id（渲染标识，不进库）；顺序即数组顺序
          steps: value.steps.map((step) => ({ title: step.title, description: step.description, tip: step.tip }))
        };
        const action = creating.value ? "create" : "update";
        const data = action === "create" ? { module: "dishes-crud", action, token: userStore.token, type: "food", isOnSale: false, ...fields } : { module: "dishes-crud", action, token: userStore.token, _id: cloudDishId.value, ...fields };
        const res = await common_vendor.Vs.callFunction({ name: "app-service", data });
        const result = res.result || {};
        if (result.code !== 0) {
          common_vendor.index.showToast({ title: result.message || "保存到云端失败，请重试", icon: "none" });
          return;
        }
        let toast = "菜谱已保存";
        if (action === "create") {
          cloudDishId.value = result._id || "";
          creating.value = false;
          published.value = false;
          toast = "菜谱已添加";
        }
        saved.value = value;
        exitEditing();
        common_vendor.index.showToast({ title: toast, icon: "none" });
      } catch {
        common_vendor.index.showToast({ title: "保存失败，修改仍在，请重试", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const togglePublish = async () => {
      if (!canEdit.value || editing.value || publishing.value)
        return;
      if (!cloudDishId.value) {
        common_vendor.index.showToast({ title: "这道菜还没连上云端，先保存一次", icon: "none" });
        return;
      }
      const next = !published.value;
      publishing.value = true;
      try {
        const res = await common_vendor.Vs.callFunction({
          name: "app-service",
          data: {
            module: "dishes-crud",
            action: "toggleSale",
            token: userStore.token,
            _id: cloudDishId.value,
            isOnSale: next
          }
        });
        const result = res.result || {};
        if (result.code !== 0) {
          common_vendor.index.showToast({ title: result.message || "操作失败，请重试", icon: "none" });
          return;
        }
        published.value = next;
        common_vendor.index.showToast({ title: next ? "已发布，去菜单看看吧" : "已从菜单撤下", icon: "none" });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/recipe-detail/recipe-detail.vue:852", "[recipe-detail] 切换发布状态失败", e);
        common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
      } finally {
        publishing.value = false;
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
        d: heroSrc.value
      }, heroSrc.value ? {
        e: heroReady.value ? 1 : "",
        f: heroSrc.value,
        g: common_vendor.o(onHeroLoaded, "7a"),
        h: common_vendor.o(onHeroError, "9a")
      } : editing.value ? {
        j: common_vendor.p({
          name: "plus",
          size: 26
        }),
        k: common_vendor.o((...args) => common_vendor.unref(chooseImage) && common_vendor.unref(chooseImage)(...args), "ae")
      } : {}, {
        i: editing.value,
        l: editing.value && heroSrc.value
      }, editing.value && heroSrc.value ? {
        m: common_vendor.p({
          name: "upload",
          size: 15
        }),
        n: common_vendor.unref(uploading),
        o: common_vendor.o((...args) => common_vendor.unref(chooseImage) && common_vendor.unref(chooseImage)(...args), "fa")
      } : {}, {
        p: !heroSrc.value && !editing.value ? 1 : "",
        q: common_vendor.unref(uploading)
      }, common_vendor.unref(uploading) ? {
        r: common_vendor.unref(uploadProgress) + "%",
        s: common_vendor.t(common_vendor.unref(uploadProgress))
      } : {}, {
        t: loadFailed.value
      }, loadFailed.value ? {
        v: common_vendor.p({
          name: "book-open",
          size: 40,
          ["stroke-width"]: 1.3
        }),
        w: common_vendor.p({
          name: "refresh-cw",
          size: 16
        }),
        x: common_vendor.t(retrying.value ? "正在重试…" : "再试一次"),
        y: retrying.value,
        z: common_vendor.o(retryLoad, "44")
      } : common_vendor.e({
        A: editing.value
      }, editing.value ? common_vendor.e({
        B: draft.value.name,
        C: common_vendor.o(($event) => draft.value.name = $event.detail.value, "e3"),
        D: currentCategoryImage.value
      }, currentCategoryImage.value ? {
        E: currentCategoryImage.value
      } : currentCategoryIcon.value ? {
        G: common_vendor.p({
          name: currentCategoryIcon.value,
          size: "36rpx"
        })
      } : {}, {
        F: currentCategoryIcon.value,
        H: common_vendor.t(currentCategoryName.value || "还没选分类"),
        I: !currentCategoryName.value ? 1 : "",
        J: common_vendor.p({
          name: "chevron-right",
          size: 15
        }),
        K: common_vendor.o(($event) => openPicker("category"), "27"),
        L: currentSpicy.value.image,
        M: common_vendor.t(currentSpicy.value.label),
        N: common_vendor.p({
          name: "chevron-right",
          size: 15
        }),
        O: common_vendor.o(($event) => openPicker("spicy"), "9b"),
        P: draft.value.subtitle,
        Q: common_vendor.o(($event) => draft.value.subtitle = $event.detail.value, "10")
      }) : common_vendor.e({
        R: common_vendor.t(shown.value.name),
        S: shown.value.subtitle
      }, shown.value.subtitle ? {
        T: common_vendor.t(shown.value.subtitle)
      } : {}), {
        U: !editing.value && (currentCategoryName.value || spicyArt.value)
      }, !editing.value && (currentCategoryName.value || spicyArt.value) ? common_vendor.e({
        V: currentCategoryName.value
      }, currentCategoryName.value ? {
        W: common_vendor.t(currentCategoryName.value)
      } : {}, {
        X: currentCategoryName.value && spicyArt.value
      }, currentCategoryName.value && spicyArt.value ? {} : {}, {
        Y: spicyArt.value
      }, spicyArt.value ? {
        Z: spicyArt.value
      } : {}) : {}, {
        aa: common_vendor.f(sections, (section, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: common_vendor.n(section.key),
            c: common_vendor.t(section.title),
            d: shown.value[section.key].length
          }, shown.value[section.key].length ? {
            e: common_vendor.f(shown.value[section.key], (item, k1, i1) => {
              return common_vendor.e(editing.value ? {
                a: "fc6387aa-8-" + i0 + "-" + i1,
                b: common_vendor.p({
                  name: "minus",
                  size: 13
                }),
                c: "移除" + lookup(item.id).name,
                d: common_vendor.o(($event) => removeMaterial(section.key, item.id), item.id)
              } : {}, {
                e: lookup(item.id).image
              }, lookup(item.id).image ? {
                f: materialArt(item.id)
              } : {
                g: "fc6387aa-9-" + i0 + "-" + i1,
                h: common_vendor.p({
                  name: "food",
                  size: 15
                })
              }, {
                i: common_vendor.t(lookup(item.id).name),
                j: item.id
              });
            }),
            f: editing.value
          } : {}, editing.value ? {
            g: "fc6387aa-10-" + i0,
            h: common_vendor.p({
              name: "plus",
              size: 19
            }),
            i: common_vendor.t(section.title),
            j: "添加" + section.title,
            k: common_vendor.o(($event) => openPicker(section.key), section.key)
          } : {}, {
            l: !editing.value && !shown.value[section.key].length
          }, !editing.value && !shown.value[section.key].length ? {
            m: common_vendor.t(section.title)
          } : {}, {
            n: section.key
          });
        }),
        ab: editing.value,
        ac: common_vendor.f(shown.value.steps, (step, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(index + 1)
          }, editing.value ? {
            b: "fc6387aa-11-" + i0,
            c: common_vendor.p({
              name: "chevron-up",
              size: 17
            }),
            d: index === 0,
            e: "上移步骤" + (index + 1),
            f: common_vendor.o(($event) => moveStep(index, -1), step.id),
            g: "fc6387aa-12-" + i0,
            h: common_vendor.p({
              name: "chevron-down",
              size: 17
            }),
            i: index === draft.value.steps.length - 1,
            j: "下移步骤" + (index + 1),
            k: common_vendor.o(($event) => moveStep(index, 1), step.id),
            l: "fc6387aa-13-" + i0,
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
            F: "fc6387aa-14-" + i0,
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
        ad: editing.value,
        ae: editing.value,
        af: editing.value ? 1 : "",
        ag: !editing.value && !shown.value.steps.length
      }, !editing.value && !shown.value.steps.length ? {} : {}, {
        ah: editing.value
      }, editing.value ? {
        ai: common_vendor.p({
          name: "plus",
          size: 19
        }),
        aj: common_vendor.t(draft.value.steps.length >= 30 ? "最多 30 个步骤" : "添加步骤"),
        ak: draft.value.steps.length >= 30,
        al: common_vendor.o(addStep, "7d")
      } : {
        am: common_vendor.p({
          name: "food",
          size: 16
        })
      }), {
        an: canEdit.value && !loadFailed.value
      }, canEdit.value && !loadFailed.value ? common_vendor.e({
        ao: editing.value
      }, editing.value ? {
        ap: common_vendor.o(cancelEditing, "c3"),
        aq: common_vendor.p({
          name: "check",
          size: 18
        }),
        ar: common_vendor.t(saving.value ? "正在保存…" : creating.value ? "添加菜谱" : "保存菜谱"),
        as: saving.value,
        at: common_vendor.o(save, "19")
      } : {
        av: common_vendor.p({
          name: "edit",
          size: 18
        }),
        aw: common_vendor.o(startEditing, "c2"),
        ax: common_vendor.p({
          name: published.value ? "check" : "upload",
          size: 18
        }),
        ay: common_vendor.t(publishing.value ? "处理中…" : published.value ? "取消发布" : "发布菜品"),
        az: publishing.value,
        aA: common_vendor.o(togglePublish, "c2")
      }) : {}, {
        aB: picker.value && editing.value && canEdit.value
      }, picker.value && editing.value && canEdit.value ? common_vendor.e({
        aC: common_vendor.o(($event) => picker.value = "", "34"),
        aD: common_vendor.o(() => {
        }, "02"),
        aE: common_vendor.t(pickerKind.value.title),
        aF: common_vendor.t(pickerKind.value.subtitle),
        aG: pickerKind.value.searchable
      }, pickerKind.value.searchable ? common_vendor.e({
        aH: common_vendor.p({
          name: "search",
          size: 16,
          ["stroke-width"]: 2.2
        }),
        aI: "搜一搜" + pickerKind.value.noun,
        aJ: PLACEHOLDER_STYLE,
        aK: "搜索" + pickerKind.value.noun,
        aL: common_vendor.o(($event) => pickerFocused.value = true, "bb"),
        aM: common_vendor.o(($event) => pickerFocused.value = false, "27"),
        aN: pickerKeyword.value,
        aO: common_vendor.o(($event) => pickerKeyword.value = $event.detail.value, "87"),
        aP: pickerKeyword.value
      }, pickerKeyword.value ? {
        aQ: common_vendor.p({
          name: "close",
          size: 13
        }),
        aR: common_vendor.o(($event) => pickerKeyword.value = "", "f7")
      } : {}, {
        aS: pickerFocused.value ? 1 : ""
      }) : {}, {
        aT: !pickerOptions.value.length
      }, !pickerOptions.value.length ? common_vendor.e({
        aU: pickerKind.value.searchable && pickerKeyword.value.trim()
      }, pickerKind.value.searchable && pickerKeyword.value.trim() ? {
        aV: common_vendor.t(pickerKeyword.value.trim())
      } : {
        aW: common_vendor.t(pickerKind.value.emptyTitle),
        aX: common_vendor.t(pickerKind.value.emptyHint)
      }) : {}, {
        aY: common_vendor.f(pickerOptions.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.image
          }, item.image ? {
            b: item.image
          } : item.icon ? {
            d: "fc6387aa-22-" + i0,
            e: common_vendor.p({
              name: item.icon,
              size: "88rpx"
            })
          } : {}, {
            c: item.icon,
            f: common_vendor.t(item.name),
            g: selection.value.includes(item.id)
          }, selection.value.includes(item.id) ? {
            h: "fc6387aa-23-" + i0,
            i: common_vendor.p({
              name: "check",
              size: 12
            })
          } : {}, {
            j: item.id + "-" + pickerKeyword.value,
            k: Math.min(index, 6) * 20 + "ms",
            l: selection.value.includes(item.id) ? 1 : "",
            m: "选择" + item.name,
            n: selection.value.includes(item.id),
            o: common_vendor.o(($event) => toggleSelection(item.id), item.id + "-" + pickerKeyword.value)
          });
        }),
        aZ: common_vendor.n("cols-" + pickerCols.value),
        ba: pickerListHeight.value,
        bb: common_vendor.t(pickerConfirmText.value),
        bc: common_vendor.o(confirmPicker, "e7")
      }) : {}, {
        bd: common_vendor.o(($event) => discardDialog.value = false, "5f"),
        be: common_vendor.o(discard, "75"),
        bf: common_vendor.p({
          visible: discardDialog.value,
          title: "收起这次修改？",
          subtitle: "未保存的内容会丢失，原来的菜谱仍会保留。",
          ["cancel-text"]: "继续编辑",
          ["confirm-text"]: "放弃修改"
        }),
        bg: common_vendor.o(common_vendor.unref(onCropConfirm), "2b"),
        bh: common_vendor.o(common_vendor.unref(onCropCancel), "50"),
        bi: common_vendor.p({
          visible: common_vendor.unref(cropperVisible),
          ["image-src"]: common_vendor.unref(cropperSrc),
          ratio: 1,
          ["output-size"]: common_vendor.unref(HERO_ART_WIDTH)
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-fc6387aa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recipe-detail/recipe-detail.js.map
