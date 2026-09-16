/**
 * 手绘素材地址（云存储）
 *
 * 集中管理需要被多处复用的素材，避免长 URL 在多个文件里重复维护。
 * 仅单处使用的素材（如首页各时段场景插画）仍就近声明在各自页面中。
 *
 * 素材全部走云存储，不做本地化（小程序包体积限制），
 * 显示时统一经 utils/image.js 的 imgUrl() 拼接 OSS 处理参数按需输出尺寸与格式。
 */

import { imgUrl } from '@/utils/image.js'

const CDN_ROOT =
  'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90'
/** 头像目录 */
const CDN = `${CDN_ROOT}/%E5%A4%B4%E5%83%8F`
/** 界面装饰目录（卡片背景等） */
const CDN_UI = `${CDN_ROOT}/%E7%95%8C%E9%9D%A2`

/** 默认头像：按性别区分（用户未上传头像时使用） */
export const AVATAR_ART = {
  male: `${CDN}/exec-d967c2fb-634c-4c95-824c-01f66fbade17.png`,
  female: `${CDN}/exec-46cec787-28a0-42be-ae7e-f686fa273b85.png`
}

/**
 * 头像素材输出宽度
 * 头像内径 146rpx，最大机型 DPR3 约需 219 物理像素，240px 已有余量
 */
export const AVATAR_ART_WIDTH = 240

/* ==========================================================================
 * 引导页（信息配置）素材
 *
 * 这批素材有两个消费方，因此必须集中声明、不能各自就近写一份：
 *   1. 登录页 —— 用隐藏 <image> 预热缓存，把下载放在用户停留登录页期间完成
 *   2. 引导页 —— 实际渲染
 * 只有两处使用**完全相同的 URL**，才会命中同一份图片缓存。
 * 所以这里导出的是「已拼好 OSS 参数的最终地址」，而不是原始地址让两边各拼一次 ——
 * 否则任何一侧改了宽度或质量，预加载就会静默失效（缓存未命中，页面照旧要等）。
 * ========================================================================== */

/** 性别卡人物：容器 240rpx，最大机型 DPR3 约需 398 物理像素 */
const OB_GENDER_ART_WIDTH = 400
/** 身份卡人物：容器 268rpx（比性别卡大，用于补偿素材自带留白），约需 443 物理像素 */
const OB_ROLE_ART_WIDTH = 480
/** 卡片背景：卡片宽 654rpx，最大机型约需 1125 物理像素 */
const OB_CARD_BG_WIDTH = 1080
/**
 * 卡片背景的输出质量
 *
 * 背景是蜡笔涂鸦、以大色块为主，对量化误差不敏感：实测 q80 与原 q90
 * 逐像素对比 PSNR 39~41dB（人眼不可分辨），而体积省约 40%。
 *
 * 人物插画**不适用**这个值 —— 它们线条细节密集，降到 q80 只有 17% 收益，
 * 画质却掉到 33dB（已进入肉眼可能察觉的区间），因此仍用 imgUrl 的默认 q90。
 */
const OB_CARD_BG_QUALITY = 80

export const ONBOARDING_ART = {
  /** 性别卡人物：复用默认头像素材，按卡片尺寸输出更大宽度 */
  gender: {
    female: imgUrl(AVATAR_ART.female, { w: OB_GENDER_ART_WIDTH }),
    male: imgUrl(AVATAR_ART.male, { w: OB_GENDER_ART_WIDTH })
  },
  /** 身份卡人物插画：干饭人 / 饲养员 */
  role: {
    diner: imgUrl(`${CDN}/exec-2ded22a0-aa85-4c5b-998d-7698c43421a4.png`, { w: OB_ROLE_ART_WIDTH }),
    cook: imgUrl(`${CDN}/exec-c8b750dd-f6ae-412a-9a27-27e1e489818c.png`, { w: OB_ROLE_ART_WIDTH })
  },
  /** 卡片背景（蜡笔涂鸦），四张卡各一张 */
  bg: {
    female: imgUrl(`${CDN_UI}/exec-79fd56c8-73b1-4f33-8fb9-6224f06d3e48.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    }),
    male: imgUrl(`${CDN_UI}/exec-0ef5a4be-7dd3-46e6-a638-8d939f9c8aba.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    }),
    diner: imgUrl(`${CDN_UI}/exec-4e70c4a6-75e9-4619-ae25-316ccf8e2368.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    }),
    cook: imgUrl(`${CDN_UI}/exec-df221cce-3e89-49a0-9d41-2eb9163488de.png`, {
      w: OB_CARD_BG_WIDTH,
      q: OB_CARD_BG_QUALITY
    })
  }
}

/**
 * 引导页全部图片地址（8 张）
 *
 * 登录页据此渲染一组隐藏 <image> 预热缓存。
 * 用真实 image 组件而非 uni.getImageInfo / downloadFile：后者走的是 XHR 通道，
 * 与 image 组件的图片缓存不是同一套，预取了也命中不到。
 */
export const ONBOARDING_IMAGE_LIST = [
  ...Object.values(ONBOARDING_ART.gender),
  ...Object.values(ONBOARDING_ART.role),
  ...Object.values(ONBOARDING_ART.bg)
]
