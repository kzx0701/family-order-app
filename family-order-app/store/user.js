import { defineStore } from 'pinia'

/**
 * 用户 Store
 *
 * 身份模型（二期）：
 *   - 身份是**可随时切换的工作模式**，不是固定的账号权限
 *   - currentMode：当前工作模式，'diner' 干饭人 / 'cook' 饲养员
 *   - 服务端以 users.lastMode 作为饲养员权限校验依据，切换身份时立即写库
 *
 * 引导状态：
 *   - onboardingCompleted 表示「信息配置引导已处理完毕」（完成或主动跳过）
 *   - 跳过时 gender='male'、currentMode='diner'，因此两者都不会出现空值
 */

// 合法枚举与默认值（与云端 users.schema.json 保持一致）
const VALID_MODES = ['diner', 'cook']
const VALID_GENDERS = ['male', 'female']
const DEFAULT_MODE = 'diner'
const DEFAULT_GENDER = 'male'

/** 归一化工作模式，非法值回落到默认干饭人 */
const sanitizeMode = (mode) => (VALID_MODES.includes(mode) ? mode : DEFAULT_MODE)

/** 归一化性别，非法值回落到默认男性（与引导跳过时的行为一致） */
const sanitizeGender = (gender) => (VALID_GENDERS.includes(gender) ? gender : DEFAULT_GENDER)

/** 本地持久化键名 */
const STORAGE_KEY = 'fo_user_state'

export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户信息（来自 users 集合）
    userInfo: null,
    // 登录 token（user-login 云函数返回，简化为 openid）
    token: null,
    // 性别：male 男 / female 女，决定默认头像
    gender: DEFAULT_GENDER,
    // 当前工作模式：diner 干饭人 / cook 饲养员
    currentMode: DEFAULT_MODE,
    // 信息配置引导是否已处理完毕
    onboardingCompleted: false,
    // 当前家庭 { _id, name, ownerId }
    family: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isCook: (state) => state.currentMode === 'cook',
    isDiner: (state) => state.currentMode === 'diner',
    nickname: (state) => state.userInfo?.nickname || '',
    avatar: (state) => state.userInfo?.avatar || '',
    openid: (state) => state.userInfo?.openid || '',
    /** 家庭名称，未加载时为兜底文案 */
    familyName: (state) => state.family?.name || '我的家庭',
    /** 当前用户是否为家庭创建者（仅创建者可改家庭名称） */
    isFamilyOwner: (state) => !!state.family && state.family.ownerId === state.userInfo?._id
  },

  actions: {
    /**
     * 微信一键登录（由登录页按钮触发）
     * 1. uni.login 取 code
     * 2. 调 user-login 云函数换 openid / token / userInfo
     * 3. 写入 state 并持久化
     * @returns {Promise<Object>} userInfo
     */
    async login() {
      try {
        const code = await this.getWxCode()

        const res = await uniCloud.callFunction({
          name: 'app-service',
          data: { module: 'user-login', code }
        })

        if (res.result.code !== 0) {
          throw new Error(res.result.message || '登录失败')
        }

        const { userInfo, token } = res.result
        this.userInfo = userInfo
        this.token = token
        this.applyUserInfo(userInfo)
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
     * 用云端返回的 userInfo 同步本地 state
     * 集中处理字段归一化，避免各处重复
     */
    applyUserInfo(info) {
      if (!info) return
      this.userInfo = info
      this.gender = sanitizeGender(info.gender)
      this.currentMode = sanitizeMode(info.lastMode)
      this.onboardingCompleted = !!info.onboardingCompleted
    },

    /**
     * 提交信息配置引导结果（两步：性别 → 身份）
     * 整页跳过时两个参数都不传，云端会落为默认值（male + diner）
     * @param {Object} [payload]
     * @param {string} [payload.gender] - 'male' | 'female'
     * @param {string} [payload.mode] - 'diner' | 'cook'
     */
    async completeOnboarding({ gender, mode } = {}) {
      const res = await this.callWithAuthRetry('user-identity', {
        action: 'completeOnboarding',
        gender: VALID_GENDERS.includes(gender) ? gender : DEFAULT_GENDER,
        mode: VALID_MODES.includes(mode) ? mode : DEFAULT_MODE
      })

      if (res.result.code !== 0) {
        throw new Error(res.result.message || '引导信息保存失败')
      }

      this.gender = sanitizeGender(res.result.gender)
      this.currentMode = sanitizeMode(res.result.lastMode)
      this.onboardingCompleted = true
      if (this.userInfo) {
        this.userInfo = {
          ...this.userInfo,
          gender: this.gender,
          lastMode: this.currentMode,
          onboardingCompleted: true
        }
      }
      this.persist()
      return res.result
    },

    /**
     * 切换工作模式（干饭人 / 饲养员），可反复切换
     * 切换后服务端 lastMode 立即更新，饲养员权限随之生效
     * @param {string} mode - 'diner' | 'cook'
     */
    async switchMode(mode) {
      if (!VALID_MODES.includes(mode)) {
        throw new Error('无效的身份')
      }

      const res = await this.callWithAuthRetry('user-identity', {
        action: 'switchMode',
        mode
      })

      if (res.result.code !== 0) {
        throw new Error(res.result.message || '身份切换失败')
      }

      this.currentMode = sanitizeMode(res.result.lastMode)
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, lastMode: this.currentMode }
      }
      this.persist()
      return this.currentMode
    },

    /**
     * 读取服务端最新的身份与引导状态（「我的」页面刷新用）
     * 身份可随时切换，以服务端记录为准，避免本地缓存过期
     */
    async refreshIdentity() {
      const res = await this.callWithAuthRetry('user-identity', { action: 'getState' })
      if (res.result.code !== 0) {
        console.warn('[user] refreshIdentity 失败：', res.result.message)
        return
      }
      this.gender = sanitizeGender(res.result.gender)
      this.currentMode = sanitizeMode(res.result.lastMode)
      this.onboardingCompleted = !!res.result.onboardingCompleted
      this.persist()
    },

    /**
     * 刷新「我的」页面所需的全部服务端状态（家庭信息 + 身份状态）
     */
    async refreshProfile() {
      await Promise.all([this.loadFamily(), this.refreshIdentity()])
    },

    /**
     * 加载当前家庭信息（「我的」页面调用）
     */
    async loadFamily() {
      const res = await this.callWithAuthRetry('family-data', { action: 'get' })
      if (res.result.code !== 0) {
        // 家庭信息缺失不阻断页面，仅记录
        console.warn('[user] loadFamily 失败：', res.result.message)
        this.family = null
        this.persist()
        return null
      }
      this.family = res.result.family || null
      this.persist()
      return this.family
    },

    /**
     * 修改家庭名称（仅家庭创建者可用，服务端二次校验）
     * @param {string} name - 新家庭名称
     */
    async updateFamilyName(name) {
      const newName = String(name || '').trim()
      if (!newName) {
        throw new Error('家庭名称不能为空')
      }

      const res = await this.callWithAuthRetry('family-data', { action: 'updateName', name: newName })
      if (res.result.code !== 0) {
        throw new Error(res.result.message || '家庭名称修改失败')
      }

      this.family = this.family ? { ...this.family, name: res.result.name } : null
      this.persist()
      return res.result.name
    },

    /**
     * 更新资料字段（昵称 / 性别）
     * @param {Object} payload
     * @param {string} [payload.nickname]
     * @param {string} [payload.gender] - 'male' | 'female'
     */
    async updateProfile({ nickname, gender } = {}) {
      const data = {}
      if (nickname !== undefined) {
        const name = String(nickname || '').trim()
        if (!name) throw new Error('昵称不能为空')
        data.nickname = name
      }
      if (gender !== undefined) {
        if (!VALID_GENDERS.includes(gender)) throw new Error('性别参数无效')
        data.gender = gender
      }
      if (Object.keys(data).length === 0) {
        return
      }

      const res = await this.callWithAuthRetry('user-update-profile', data)
      if (res.result.code !== 0) {
        throw new Error(res.result.message || '资料更新失败')
      }

      this.applyUserInfo(res.result.userInfo)
      this.persist()
    },

    /**
     * 更新头像
     * 先上传到云存储，再调 user-update-profile 保存 URL
     * @param {string} filePath - 本地临时文件路径
     */
    async updateAvatar(filePath) {
      if (!filePath) {
        throw new Error('头像文件无效')
      }

      const ext = filePath.split('.').pop() || 'png'
      const cloudPath = `avatars/${this.token || 'anonymous'}_${Date.now()}.${ext}`
      const uploadRes = await uniCloud.uploadFile({ filePath, cloudPath })

      if (!uploadRes.fileID) {
        throw new Error('头像上传失败')
      }

      const res = await this.callWithAuthRetry('user-update-profile', { avatar: uploadRes.fileID })
      if (res.result.code !== 0) {
        throw new Error(res.result.message || '头像更新失败')
      }

      this.applyUserInfo(res.result.userInfo)
      this.persist()
    },

    /**
     * 带登录态自愈的云函数调用
     * 401（缺凭证）/ 404（用户记录不存在，本地 token 与库不匹配）
     * 时自动重新登录一次并重试，避免开发期换库或数据库重置后卡死
     * 注意：token 在每次 call 时读取，因此重登后新 token 会被带上
     */
    async callWithAuthRetry(moduleName, payload = {}) {
      const call = () =>
        uniCloud.callFunction({
          name: 'app-service',
          data: { module: moduleName, token: this.token, ...payload }
        })

      let res = await call()
      if (res.result.code === 401 || res.result.code === 404) {
        console.warn(`[user] ${moduleName} 登录态失效（${res.result.message}），重新登录后重试`)
        await this.login()
        res = await call()
      }
      return res
    },

    /**
     * 退出登录：清空本地存储与 state
     */
    logout() {
      this.userInfo = null
      this.token = null
      this.gender = DEFAULT_GENDER
      this.currentMode = DEFAULT_MODE
      this.onboardingCompleted = false
      this.family = null
      try {
        uni.removeStorageSync(STORAGE_KEY)
      } catch (e) {
        console.error('[user] logout clear storage error', e)
      }
    },

    /**
     * 持久化到本地存储（同步写入，确保 App 重启可恢复）
     */
    persist() {
      try {
        uni.setStorageSync(STORAGE_KEY, {
          userInfo: this.userInfo,
          token: this.token,
          gender: this.gender,
          currentMode: this.currentMode,
          onboardingCompleted: this.onboardingCompleted,
          family: this.family
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
        const data = uni.getStorageSync(STORAGE_KEY)
        if (!data) return
        this.token = data.token || null
        this.applyUserInfo(data.userInfo)
        // 缓存中的字段优先，缺失时沿用 userInfo 推导出的值（兼容旧版本缓存）
        if (data.gender) this.gender = sanitizeGender(data.gender)
        if (data.currentMode) this.currentMode = sanitizeMode(data.currentMode)
        this.onboardingCompleted = !!data.onboardingCompleted
        this.family = data.family || null
      } catch (e) {
        console.error('[user] restore error', e)
      }
    }
  }
})
