'use strict'
const { resolveCaller } = require('../utils/auth.js')

/**
 * 用户身份与引导状态云函数
 *
 * 支持的 action：
 *   - getState           读取 gender / lastMode / onboardingCompleted
 *   - completeOnboarding 提交信息配置引导结果（性别 + 身份），支持整页跳过
 *   - switchMode         切换工作模式并更新 lastMode，允许反复切换
 *
 * 与旧实现的区别：
 *   原 user-update-role 实现「角色一经选择不可更改」（已有非空身份则返回 403），
 *   与二期「身份是可随时切换的工作模式」直接冲突，本模块已移除该限制。
 *
 * 鉴权：token（openid）→ 定位 users 记录。
 */

// 合法的工作模式与性别，非法值一律回落到默认值
const VALID_MODES = ['diner', 'cook']
const VALID_GENDERS = ['male', 'female']

// 引导被跳过时使用的默认值：男性 + 干饭人
const DEFAULT_GENDER = 'male'
const DEFAULT_MODE = 'diner'

exports.main = async (event, context) => {
  const { action } = event
  switch (action) {
    case 'getState':
      return getState(event)
    case 'completeOnboarding':
      return completeOnboarding(event)
    case 'switchMode':
      return switchMode(event)
    default:
      return { code: 400, message: '未知 action：' + action }
  }
}

/**
 * 读取当前用户的身份与引导状态
 * 用于「我的」页面刷新，以及登录响应缺失字段时的兜底
 */
async function getState({ token }) {
  try {
    const authRes = await resolveCaller(token)
    if (!authRes.ok) {
      // 用户记录不存在（404）时前端会重新登录再重试
      const code = authRes.message === '用户记录不存在' ? 404 : 401
      return { code, message: authRes.message }
    }
    const { caller } = authRes
    return {
      code: 0,
      gender: caller.gender || DEFAULT_GENDER,
      lastMode: caller.lastMode || DEFAULT_MODE,
      onboardingCompleted: !!caller.onboardingCompleted,
      userInfo: caller
    }
  } catch (e) {
    console.error('[user-identity] getState error', e)
    return { code: 500, message: '身份状态读取异常' }
  }
}

/**
 * 提交信息配置引导结果
 *
 * 入参：
 *   - gender: 'male' | 'female'（可选，缺失或非法则用默认 'male'）
 *   - mode:   'diner' | 'cook'  （可选，缺失或非法则用默认 'diner'）
 *
 * 无论用户是完成两步还是整页跳过，都在此一次性落库，并把 onboardingCompleted 置为 true，
 * 因此 gender 与 lastMode 都不会出现空值 —— 界面无需处理「未设置」分支。
 */
async function completeOnboarding({ token, gender, mode }) {
  try {
    const authRes = await resolveCaller(token)
    if (!authRes.ok) {
      const code = authRes.message === '用户记录不存在' ? 404 : 401
      return { code, message: authRes.message }
    }

    const finalGender = VALID_GENDERS.includes(gender) ? gender : DEFAULT_GENDER
    const finalMode = VALID_MODES.includes(mode) ? mode : DEFAULT_MODE

    await uniCloud.database().collection('users').doc(authRes.caller._id).update({
      gender: finalGender,
      lastMode: finalMode,
      onboardingCompleted: true,
      updateTime: Date.now()
    })

    console.log('[user-identity] 引导完成, gender:', finalGender, 'lastMode:', finalMode)
    return {
      code: 0,
      gender: finalGender,
      lastMode: finalMode,
      onboardingCompleted: true
    }
  } catch (e) {
    console.error('[user-identity] completeOnboarding error', e)
    return { code: 500, message: '引导信息保存异常' }
  }
}

/**
 * 切换工作模式（干饭人 / 饲养员）
 *
 * 身份允许随时切换，切换后立即写库更新 lastMode；
 * 后端饲养员权限校验即以该字段为准，因此这里必须同步落库而不能只改前端状态。
 *
 * @param {string} mode - 'diner' | 'cook'
 */
async function switchMode({ token, mode }) {
  if (!VALID_MODES.includes(mode)) {
    return { code: 400, message: '身份参数无效' }
  }
  try {
    const authRes = await resolveCaller(token)
    if (!authRes.ok) {
      const code = authRes.message === '用户记录不存在' ? 404 : 401
      return { code, message: authRes.message }
    }

    await uniCloud.database().collection('users').doc(authRes.caller._id).update({
      lastMode: mode,
      updateTime: Date.now()
    })

    console.log('[user-identity] 身份切换为', mode)
    return { code: 0, lastMode: mode }
  } catch (e) {
    console.error('[user-identity] switchMode error', e)
    return { code: 500, message: '身份切换异常' }
  }
}
