/**
 * 云存储图片地址处理
 *
 * 规则：项目所有图片素材统一存放在 uniCloud 云存储（底层为阿里云 OSS），
 * 页面按需通过 URL 参数指定输出尺寸与格式，不改动云存储上的原始文件。
 *
 * **本模块同时是「云存储地址」的唯一归一入口**：支付宝云（本项目用的就是支付宝云）
 * 上传后拿到的是 `cloud://<spaceId>/<path>` 这种内部协议地址，不能直接展示；
 * 由 cloudFileUrl() 统一推导成空间静态托管域名下的 https 链接。
 * 落库前记录地址、渲染前拼参数，都走它，避免各处各写一遍转换规则。
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
 *   imgUrl(fileID)                     // 仅转 WebP（fileID 与链接都接受，内部先归一）
 *   imgUrl(fileID, { w: 960 })         // 转 WebP 并限制宽度为 960
 *   imgUrl(fileID, { w: 300, q: 80 })  // 列表小图，进一步降尺寸与质量
 *   cloudFileUrl(fileID)               // 只要链接、不要 OSS 参数（落库前用这个）
 */

// 参与处理的云存储域名；其他地址（本地路径、第三方图床）原样返回
const CLOUD_HOSTS = ['cloudstatic.cn']

// 云存储 fileID 的协议前缀：cloud://<spaceId>/<path>
const FILE_ID_SCHEME = 'cloud://'

/**
 * fileID → 云存储静态链接（同步、纯字符串推导）
 *
 * 为什么必须转换：支付宝云的 uploadFile 返回的是 `cloud://` 内部协议地址
 * （只有阿里云才直接返回链接形式），这个地址 <image> 组件解析不了，必须先换成链接。
 *
 * 为什么不用 getTempFileURL：它在支付宝云下是按 `expire: 600` 申请的下载链接，
 * 带签名、十分钟后失效，**不能拿去落库**（SDK 实现见 vendor.js 的 getTempFileURL）。
 * 而空间自身的静态托管域名 `<spaceId>.normal.cloudstatic.cn` 是公开只读的，
 * 同一个 object key 直接拼在域名后面即可访问 —— 项目内既有的素材图（首页插画、
 * 引导页角色、分类图标）全部是这个形态，且实测能命中 OSS 处理参数。
 * 因此按同一规则推导，得到的是可长期使用的链接，与素材图同一套地址体系。
 *
 * 幂等：已经是链接（或本地 static 路径）的值原样返回，
 * 于是「读旧数据（历史上存成 fileID 的记录）」与「读新数据」可以走同一段代码。
 *
 * @param {string} fileID - `cloud://<spaceId>/<path>`，或其他任意地址
 * @returns {string} `https://<spaceId>.normal.cloudstatic.cn/<path>`
 */
export const cloudFileUrl = (fileID) => {
  const raw = String(fileID || '')
  if (!raw.startsWith(FILE_ID_SCHEME)) return raw
  const rest = raw.slice(FILE_ID_SCHEME.length)
  const slash = rest.indexOf('/')
  // 解析不出「空间 id + 路径」的残缺 fileID 原样返回，交给调用方的空值兜底
  if (slash <= 0 || slash === rest.length - 1) return raw
  const spaceId = rest.slice(0, slash)
  const path = rest.slice(slash + 1)
  // 路径做 URI 编码并保留 '/'：既有素材就是中文目录，编码后才是可访问的地址
  return `https://${spaceId}.normal.cloudstatic.cn/${encodeURI(path)}`
}

// 默认质量：实测 q90 相比 q95 体积更小且画质差异不可见
const DEFAULT_QUALITY = 90

/**
 * 项目统一的图片输出档位（**跨页面共用一份，不要各自写数**）
 *
 * 每个值都由「显示尺寸 → 真机物理像素」算出，公式：
 *   物理像素 = 显示宽度(rpx) ÷ 750 × 屏宽(pt) × DPR
 * 取最大机型 430pt / DPR 3，即 ×1.72。**小于需求值会在真机上被插值放大（隐性模糊）**，
 * 所以这些档位只上不下；将来改显示尺寸时记得回来重算。
 *
 * ⚠️ 为什么必须共用：菜谱列表页会在点开卡片时**预取详情页的封面**（隐藏 `<image>`），
 * 靠的正是「两页拼出的 URL 逐字符相同」才能命中同一份客户端图片缓存。
 * 一旦有一侧改了数，预加载会**静默失效**（不报错，只是白下一份）。
 */
export const IMG_W = {
  // 菜谱列表卡片。卡片框宽 (750 − 页面 32×2 − 网格 gap 22) ÷ 2 = 332rpx、高 75% = 249rpx，
  // 图片是 aspectFit，所以要**按最不利的那一边**算：
  //   · 素材为 1:1（本项目裁剪器导出的规格）→ 受高度限制，显示 249rpx → 428px
  //   · 素材为 4:3 等横图（云端历史图有可能）→ 受宽度限制，显示 332rpx → 571px
  // 取 576 覆盖后一种情况；只按 1:1 算会得到 428，那种"刚好够"的档位在横向素材上会糊。
  dishCard: 576,
  // 菜谱详情封面 / 点单页菜品大图：框 500rpx 见方，两种素材比例下需求都 ≤860px → 取 960
  dishCover: 960,
  // 食材 / 调料卡片里的小图：100×96rpx 的框、aspectFit → 需求 172px 以内 → 取 176
  materialArt: 176,
  // 选择抽屉里的物料 / 分类格子：image 110rpx → 需求 189px → 取 192
  pickerArt: 192,
  // 编辑态分类行的前导小图：44rpx → 需求 76px → 取 96
  fieldArt: 96
}

/**
 * 为云存储图片追加 OSS 图片处理参数
 * @param {string} fileID - 图片地址（云存储 https 地址或 fileID）
 * @param {object} [options]
 * @param {number} [options.w] - 输出宽度（px），不传则保持原尺寸只做格式转换
 * @param {number} [options.q] - WebP 质量，1-100，默认 90
 * @returns {string} 处理后的图片地址
 */
export const imgUrl = (fileID, { w, q = DEFAULT_QUALITY } = {}) => {
  // 先归一到 https 链接：fileID 与链接两种入参都能落到下面的 OSS 处理分支上。
  // 历史上 admin 把 fileID 直接写进了 dishes.image，靠这一步才能在页面里正常显示。
  const url = cloudFileUrl(fileID)
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
