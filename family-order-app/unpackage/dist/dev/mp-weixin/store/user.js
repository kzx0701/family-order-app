"use strict";
const common_vendor = require("../common/vendor.js");
const useUserStore = common_vendor.defineStore("user", {
  state: () => ({
    // 用户信息（来自 users 集合）
    userInfo: null,
    // 角色：orderer | admin | null（未选择）
    role: null,
    // 登录 token（user-login 云函数返回，简化为 openid）
    token: null,
    // 家庭 ID（单家庭场景下所有用户相同）
    familyId: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.role === "admin",
    isOrderer: (state) => state.role === "orderer",
    nickname: (state) => {
      var _a;
      return ((_a = state.userInfo) == null ? void 0 : _a.nickname) || "";
    },
    avatar: (state) => {
      var _a;
      return ((_a = state.userInfo) == null ? void 0 : _a.avatar) || "";
    },
    openid: (state) => {
      var _a;
      return ((_a = state.userInfo) == null ? void 0 : _a.openid) || "";
    }
  },
  actions: {
    /**
     * 微信一键登录
     * 1. 调用 uni.login 获取微信 code
     * 2. 调用 user-login 云函数换取 openid / token / userInfo
     * 3. 新用户 role 为空（待选择），老用户 role 已存在
     * 4. 持久化 token 与 userInfo 到本地存储
     */
    async login() {
      try {
        const code = await this.getWxCode();
        const res = await common_vendor.wr.callFunction({
          name: "user-login",
          data: { code }
        });
        if (res.result.code !== 0) {
          throw new Error(res.result.message || "登录失败");
        }
        const { userInfo, token } = res.result;
        this.userInfo = userInfo;
        this.token = token;
        this.role = userInfo.role || null;
        this.familyId = userInfo.familyId || null;
        this.persist();
        return userInfo;
      } catch (e) {
        common_vendor.index.__f__("error", "at store/user.js:63", "[user] login error", e);
        throw e;
      }
    },
    /**
     * 获取微信登录 code
     * 仅在微信小程序环境调用 uni.login，其他环境返回空字符串
     * @returns {Promise<string>}
     */
    getWxCode() {
      return new Promise((resolve) => {
        common_vendor.index.login({
          provider: "weixin",
          success: (res) => resolve(res.code || ""),
          fail: (err) => {
            common_vendor.index.__f__("error", "at store/user.js:80", "[user] uni.login fail", err);
            resolve("");
          }
        });
      });
    },
    /**
     * 设置角色（仅角色选择页首次选择时调用）
     * 调用 user-update-role 云函数写入 users 集合的 role 字段，同步本地 state
     * 角色一经选择不可更改：服务端校验已有非空 role 且不同时返回 403
     * @param {string} role - 'orderer' | 'admin'
     */
    async setRole(role) {
      if (!["orderer", "admin"].includes(role)) {
        throw new Error("无效的角色");
      }
      let res = await common_vendor.wr.callFunction({
        name: "user-update-role",
        data: {
          role,
          token: this.token
        }
      });
      if (res.result.code === 404) {
        await this.login();
        res = await common_vendor.wr.callFunction({
          name: "user-update-role",
          data: {
            role,
            token: this.token
          }
        });
      }
      if (res.result.code !== 0) {
        throw new Error(res.result.message || "角色设置失败");
      }
      this.role = role;
      this.userInfo = res.result.userInfo || { ...this.userInfo, role };
      this.persist();
    },
    /**
     * 设置完整用户信息
     */
    setUserInfo(info) {
      this.userInfo = info;
      this.role = (info == null ? void 0 : info.role) || null;
      this.familyId = (info == null ? void 0 : info.familyId) || null;
      this.persist();
    },
    /**
     * 更新昵称（首页头像点击弹窗调用）
     * 调用 user-update-profile 云函数更新 users 集合的 nickname 字段
     * @param {string} nickname - 新昵称
     */
    async updateNickname(nickname) {
      const name = String(nickname || "").trim();
      if (!name) {
        throw new Error("昵称不能为空");
      }
      const res = await common_vendor.wr.callFunction({
        name: "user-update-profile",
        data: {
          nickname: name,
          token: this.token
        }
      });
      if (res.result.code !== 0) {
        throw new Error(res.result.message || "昵称更新失败");
      }
      this.userInfo = res.result.userInfo || { ...this.userInfo, nickname: name };
      this.persist();
    },
    /**
     * 更新头像（首页 chooseAvatar 选择后调用）
     * 上传到 uniCloud 云存储，再调 user-update-profile 保存 URL
     * @param {string} cloudPath - 云存储路径
     * @param {File} filePath - 本地临时文件路径
     */
    async updateAvatar(filePath) {
      if (!filePath) {
        throw new Error("头像文件无效");
      }
      const ext = filePath.split(".").pop() || "png";
      const cloudPath = `avatars/${this.token || "anonymous"}_${Date.now()}.${ext}`;
      const uploadRes = await common_vendor.wr.uploadFile({
        filePath,
        cloudPath
      });
      if (!uploadRes.fileID) {
        throw new Error("头像上传失败");
      }
      const res = await common_vendor.wr.callFunction({
        name: "user-update-profile",
        data: {
          avatar: uploadRes.fileID,
          token: this.token
        }
      });
      if (res.result.code !== 0) {
        throw new Error(res.result.message || "头像更新失败");
      }
      this.userInfo = res.result.userInfo || { ...this.userInfo, avatar: uploadRes.fileID };
      this.persist();
    },
    /**
     * 退出登录：清空本地存储与 state
     */
    logout() {
      this.userInfo = null;
      this.role = null;
      this.token = null;
      this.familyId = null;
      try {
        common_vendor.index.removeStorageSync("fo_user_state");
      } catch (e) {
        common_vendor.index.__f__("error", "at store/user.js:224", "[user] logout clear storage error", e);
      }
    },
    /**
     * 持久化到本地存储（同步写入，确保 App 重启可恢复）
     */
    persist() {
      try {
        common_vendor.index.setStorageSync("fo_user_state", {
          userInfo: this.userInfo,
          role: this.role,
          token: this.token,
          familyId: this.familyId
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at store/user.js:240", "[user] persist error", e);
      }
    },
    /**
     * 从本地存储恢复登录态（App.vue onLaunch 调用）
     */
    async restore() {
      try {
        const data = common_vendor.index.getStorageSync("fo_user_state");
        if (data) {
          this.userInfo = data.userInfo || null;
          this.role = data.role || null;
          this.token = data.token || null;
          this.familyId = data.familyId || null;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at store/user.js:257", "[user] restore error", e);
      }
    }
  }
});
exports.useUserStore = useUserStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/user.js.map
