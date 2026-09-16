"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const composables_useSafeArea = require("../../composables/useSafeArea.js");
const store_user = require("../../store/user.js");
if (!Array) {
  const _easycom_default_avatar2 = common_vendor.resolveComponent("default-avatar");
  const _easycom_Icon2 = common_vendor.resolveComponent("Icon");
  const _easycom_custom_tabbar2 = common_vendor.resolveComponent("custom-tabbar");
  (_easycom_default_avatar2 + _easycom_Icon2 + _easycom_custom_tabbar2)();
}
const _easycom_default_avatar = () => "../../components/default-avatar/default-avatar.js";
const _easycom_Icon = () => "../../components/icons/Icon.js";
const _easycom_custom_tabbar = () => "../../components/custom-tabbar/custom-tabbar.js";
if (!Math) {
  (_easycom_default_avatar + _easycom_Icon + _easycom_custom_tabbar)();
}
const _sfc_main = {
  __name: "my",
  setup(__props) {
    const { statusBarHeight } = composables_useSafeArea.useSafeArea();
    const userStore = store_user.useUserStore();
    const familyName = common_vendor.computed(() => userStore.familyName);
    const modeLabel = common_vendor.computed(() => userStore.isCook ? "饲养员" : "干饭人");
    const goRecords = () => {
      common_vendor.index.navigateTo({ url: "/pages/record/record" });
    };
    const showPreviewTip = (title) => {
      common_vendor.index.showToast({ title, icon: "none" });
    };
    common_vendor.onShow(() => {
      userStore.refreshProfile();
    });
    const MODE_OPTIONS = [
      { value: "diner", label: "干饭人" },
      { value: "cook", label: "饲养员" }
    ];
    const GENDER_OPTIONS = [
      { value: "male", label: "男生" },
      { value: "female", label: "女生" }
    ];
    const pickOption = (options, current, onPick) => {
      common_vendor.index.showActionSheet({
        itemList: options.map((o) => o.value === current ? `${o.label}（当前）` : o.label),
        success: (res) => {
          const target = options[res.tapIndex];
          if (!target || target.value === current)
            return;
          onPick(target);
        }
      });
    };
    const onChangeMode = () => {
      pickOption(MODE_OPTIONS, userStore.currentMode, async (target) => {
        try {
          await userStore.switchMode(target.value);
          common_vendor.index.showToast({ title: `已切换为${target.label}`, icon: "none" });
        } catch (e) {
          common_vendor.index.showToast({ title: e.message || "切换失败", icon: "none" });
        }
      });
    };
    const onChangeGender = () => {
      pickOption(GENDER_OPTIONS, userStore.gender, async (target) => {
        try {
          await userStore.updateProfile({ gender: target.value });
          common_vendor.index.showToast({ title: `已切换为${target.label}头像`, icon: "none" });
        } catch (e) {
          common_vendor.index.showToast({ title: e.message || "修改失败", icon: "none" });
        }
      });
    };
    const onEditProfile = () => {
      common_vendor.index.showActionSheet({
        itemList: ["修改性别", "修改昵称（后续接入）", "修改头像（后续接入）"],
        success: (res) => {
          if (res.tapIndex === 0) {
            onChangeGender();
            return;
          }
          showPreviewTip("该功能将在后续接入");
        }
      });
    };
    const onEditFamily = () => {
      if (!userStore.family) {
        showPreviewTip("家庭信息加载中，请稍后再试");
        return;
      }
      if (!userStore.isFamilyOwner) {
        showPreviewTip("家庭名称由最初创建家庭的成员修改");
        return;
      }
      common_vendor.index.showModal({
        title: "修改家庭名称",
        editable: true,
        placeholderText: userStore.familyName,
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await userStore.updateFamilyName(res.content);
            common_vendor.index.showToast({ title: "家庭名称已更新", icon: "none" });
          } catch (e) {
            common_vendor.index.showToast({ title: e.message || "修改失败", icon: "none" });
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(userStore).avatar
      }, common_vendor.unref(userStore).avatar ? {
        b: common_vendor.unref(userStore).avatar
      } : {
        c: common_vendor.p({
          gender: common_vendor.unref(userStore).gender
        })
      }, {
        d: common_vendor.t(common_vendor.unref(userStore).nickname || "家庭成员"),
        e: common_vendor.t(modeLabel.value),
        f: common_vendor.unref(userStore).isCook ? 1 : "",
        g: common_vendor.p({
          name: "edit",
          size: 17,
          ["stroke-width"]: 2.2
        }),
        h: common_vendor.o(onEditProfile, "cc"),
        i: common_vendor.unref(statusBarHeight) + 52 + "px",
        j: common_assets._imports_0,
        k: common_vendor.t(familyName.value),
        l: common_vendor.p({
          name: "chevron-right",
          size: 19,
          ["stroke-width"]: 2.4
        }),
        m: common_vendor.o(onEditFamily, "4f"),
        n: common_assets._imports_1,
        o: common_vendor.t(modeLabel.value),
        p: common_vendor.p({
          name: "chevron-right",
          size: 19,
          ["stroke-width"]: 2.4
        }),
        q: common_vendor.o(onChangeMode, "1c"),
        r: common_assets._imports_2,
        s: common_vendor.p({
          name: "chevron-right",
          size: 19,
          ["stroke-width"]: 2.4
        }),
        t: common_vendor.o(goRecords, "b0")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2f1ef635"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my/my.js.map
