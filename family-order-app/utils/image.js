/**
 * 云存储图片地址处理
 *
 * 规则：项目所有图片素材统一存放在 uniCloud 云存储（底层为阿里云 OSS），
 * 页面按需通过 URL 参数指定输出尺寸与格式，不改动云存储上的原始文件。
 *
 * 为什么需要它：
 * - 素材原图普遍是 2MB 级（例如首页 1216×1293 人物图 1.8MB），
 *   而移动端实际显示尺寸所需的物理像素远小于原图，直接加载会拖慢首屏
 * - OSS 处理结果会被 CDN 缓存（响应头 x-cache: HIT），
 *   首次处理后可重复命中，不产生每次请求的实时处理开销
 * - 原图保留在云存储中，随时可通过改参数回退或调整，无需重新上传素材
 *
 * 尺寸参考（rpx 与物理像素换算）：
 *   显示宽度(rpx) / 750 × 屏幕宽度(pt) × DPR = 所需物理像素
 *   例：300rpx 在 430pt 屏、DPR 3 下约为 516 物理像素
 *   因此 960px 输出对全机型有约 1.9 倍余量
 *
 * 用法：
 *   imgUrl(fileID)                     // 仅转 WebP
 *   imgUrl(fileID, { w: 960 })         // 转 WebP 并限制宽度为 960
 *   imgUrl(fileID, { w: 300, q: 80 })  // 列表小图，进一步降尺寸与质量
 */

// 参与处理的云存储域名；其他地址（本地路径、第三方图床）原样返回
const CLOUD_HOSTS = ['cloudstatic.cn']

// 默认质量：实测 q90 相比 q95 体积更小且画质差异不可见
const DEFAULT_QUALITY = 90

/**
 * 为云存储图片追加 OSS 图片处理参数
 * @param {string} fileID - 图片地址（云存储 https 地址或 fileID）
 * @param {object} [options]
 * @param {number} [options.w] - 输出宽度（px），不传则保持原尺寸只做格式转换
 * @param {number} [options.q] - WebP 质量，1-100，默认 90
 * @returns {string} 处理后的图片地址
 */
export const imgUrl = (fileID, { w, q = DEFAULT_QUALITY } = {}) => {
  const url = String(fileID || '')
  if (!url) return ''

  // 已带处理参数：避免重复拼接
  if (url.includes('x-oss-process=')) return url

  // 非云存储资源（本地 static、第三方地址）：不做处理
  if (!CLOUD_HOSTS.some((host) => url.includes(host))) return url

  const ops = []
  if (w) ops.push(`resize,w_${w}`)
  ops.push('format,webp')
  ops.push(`quality,q_${q}`)

  return `${url}?x-oss-process=image/${ops.join('/')}`
}
