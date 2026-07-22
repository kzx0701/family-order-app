import { defineStore } from 'pinia'

/**
 * 合法的角色值白名单
 * 任何不在白名单中的角色值都将被归一化为 null
 */
const VALID_ROLES = ['orderer', 'admin']

/**
 * 将任意角色值归一化为合法值或 null
 * @param {*} role - 原始角色值
 * @returns {string|null}
 */
const sanitizeRole = (role) => {
  if (role && VALID_ROLES.includes(role)) return role
  if (role && role !== '') {
    console.warn('[user] 检测到异常角色值，已重置为 null:', role)
  }
  return null
}

/**
 * 用户 Store
 * 管理用户登录态、角色、基本信息
 * 角色系统：orderer（下单人）/ admin（管理员），单家庭共享
 */
export const useUserStore = defineStore('user', {
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
    isAdmin: (state) => state.role === 'admin',
    isOrderer: (state) => state.role === 'orderer',
    nickname: (state) => state.userInfo?.nickname || '',
    avatar: (state) => state.userInfo?.avatar || '',
    openid: (state) => state.userInfo?.openid || ''
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
        // 1. 获取微信登录 code（H5 环境返回空字符串，云函数走 mock 流程）
        const code = await this.getWxCode()

        // 2. 调用云函数登录
        const res = await uniCloud.callFunction({
          name: 'user-login',
          data: { code }
        })

        if (res.result.code !== 0) {
          throw new Error(res.result.message || '登录失败')
        }

        // 3. 写入 state
        const { userInfo, token, isNewUser } = res.result
        this.userInfo = userInfo
        this.token = token
        // 新用户强制 role=null（防止数据库 schema 校验层意外设值），
        // 老用户使用 sanitizeRole 过滤掉异常值
        this.role = isNewUser ? null : sanitizeRole(userInfo.role)
        this.familyId = userInfo.familyId || null

        if (isNewUser) {
          console.log('[user] 新用户登录，role 已置为 null，待选择身份')
        }

        // 4. 持久化
        this.persist()
        return userInfo
      } catch (e) {
        console.error('[user] login error', e)
        throw e
      }
    },

    /**
     * 获取微信登录 code
     * 仅在微信小程序环境调用 uni.login；其他环境直接 reject（本项目仅支持微信小程序）
     * @returns {Promise<string>}
     */
    getWxCode() {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.login({
          provider: 'weixin',
          success: (res) => {
            if (res.code) {
              resolve(res.code)
            } else {
              reject(new Error('未获取到微信登录凭证'))
            }
          },
          fail: (err) => {
            console.error('[user] uni.login fail', err)
            reject(new Error(err?.errMsg || '微信登录调用失败'))
          }
        })
        // #endif
        // #ifndef MP-WEIXIN
        reject(new Error('请在微信小程序环境中使用'))
        // #endif
      })
    },

    /**
     * 设置角色（仅角色选择页首次选择时调用）
     * 调用 user-update-role 云函数写入 users 集合的 role 字段，同步本地 state
     * 角色一经选择不可更改：服务端校验已有非空 role 且不同时返回 403
     * @param {string} role - 'orderer' | 'admin'
     */
    async setRole(role) {
      if (!['orderer', 'admin'].includes(role)) {
        throw new Error('无效的角色')
      }

      let res = await uniCloud.callFunction({
        name: 'user-update-role',
        data: {
          role,
          token: this.token
        }
      })

      // 缺少登录凭证（token 未正确设置），重新登录获取 token 后重试
      if (res.result.code === 401) {
        console.warn('[user] setRole 缺少登录凭证，尝试重新登录')
        await this.login()
        res = await uniCloud.callFunction({
          name: 'user-update-role',
          data: {
            role,
            token: this.token
          }
        })
      }

      // 用户记录不存在：本地 token 与数据库不匹配
      // （开发期切换登录方式/数据库重置），重新登录获取有效 token 后重试
      if (res.result.code === 404) {
        await this.login()
        res = await uniCloud.callFunction({
          name: 'user-update-role',
          data: {
            role,
            token: this.token
          }
        })
      }

      if (res.result.code !== 0) {
        throw new Error(res.result.message || '角色设置失败')
      }

      // 同步本地 state
      this.role = role
      this.userInfo = res.result.userInfo || { ...this.userInfo, role }
      this.persist()
    },

    /**
     * 设置完整用户信息
     */
    setUserInfo(info) {
      this.userInfo = info
      this.role = sanitizeRole(info?.role)
      this.familyId = info?.familyId || null
      this.persist()
    },

    /**
     * 更新昵称（首页头像点击弹窗调用）
     * 调用 user-update-profile 云函数更新 users 集合的 nickname 字段
     * @param {string} nickname - 新昵称
     */
    async updateNickname(nickname) {
      const name = String(nickname || '').trim()
      if (!name) {
        throw new Error('昵称不能为空')
      }

      const res = await uniCloud.callFunction({
        name: 'user-update-profile',
        data: {
          nickname: name,
          token: this.token
        }
      })

      if (res.result.code !== 0) {
        throw new Error(res.result.message || '昵称更新失败')
      }

      // 同步本地 state
      this.userInfo = res.result.userInfo || { ...this.userInfo, nickname: name }
      this.persist()
    },

    /**
     * 更新头像（首页 chooseAvatar 选择后调用）
     * 上传到 uniCloud 云存储，再调 user-update-profile 保存 URL
     * @param {string} cloudPath - 云存储路径
     * @param {File} filePath - 本地临时文件路径
     */
    async updateAvatar(filePath) {
      if (!filePath) {
        throw new Error('头像文件无效')
      }

      // 1. 上传到 uniCloud 云存储
      const ext = filePath.split('.').pop() || 'png'
      const cloudPath = `avatars/${this.token || 'anonymous'}_${Date.now()}.${ext}`
      const uploadRes = await uniCloud.uploadFile({
        filePath,
        cloudPath
      })

      if (!uploadRes.fileID) {
        throw new Error('头像上传失败')
      }

      // 2. 调云函数保存 URL 到 users 集合
      const res = await uniCloud.callFunction({
        name: 'user-update-profile',
        data: {
          avatar: uploadRes.fileID,
          token: this.token
        }
      })

      if (res.result.code !== 0) {
        throw new Error(res.result.message || '头像更新失败')
      }

      // 同步本地 state
      this.userInfo = res.result.userInfo || { ...this.userInfo, avatar: uploadRes.fileID }
      this.persist()
    },

    /**
     * 退出登录：清空本地存储与 state
     */
    logout() {
      this.userInfo = null
      this.role = null
      this.token = null
      this.familyId = null
      try {
        uni.removeStorageSync('fo_user_state')
      } catch (e) {
        console.error('[user] logout clear storage error', e)
      }
    },

    /**
     * 持久化到本地存储（同步写入，确保 App 重启可恢复）
     */
    persist() {
      try {
        uni.setStorageSync('fo_user_state', {
          userInfo: this.userInfo,
          role: this.role,
          token: this.token,
          familyId: this.familyId
        })
      } catch (e) {
        console.error('[user] persist error', e)
      }
    },

    /**
     * 从本地存储恢复登录态（App.vue onLaunch 调用）
     */
    async restore() {
      try {
        const data = uni.getStorageSync('fo_user_state')
        if (data) {
          this.userInfo = data.userInfo || null
          this.role = sanitizeRole(data.role)
          this.token = data.token || null
          this.familyId = data.familyId || null
        }
      } catch (e) {
        console.error('[user] restore error', e)
      }
    }
  }
})
