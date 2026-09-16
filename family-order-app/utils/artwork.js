/**
 * 手绘素材地址（云存储）
 *
 * 集中管理需要被多处复用的素材，避免长 URL 在多个文件里重复维护。
 * 仅单处使用的素材（如首页各时段场景插画）仍就近声明在各自页面中。
 *
 * 素材全部走云存储，不做本地化（小程序包体积限制），
 * 显示时统一经 utils/image.js 的 imgUrl() 拼接 OSS 处理参数按需输出尺寸与格式。
 */

const CDN = 'https://env-00jy6tjoglvj.normal.cloudstatic.cn/%E9%BB%91%E7%B1%B3%E5%92%96%E5%95%A1/%E5%9B%BE%E7%89%87%E7%B4%A0%E6%9D%90/%E5%A4%B4%E5%83%8F'

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
