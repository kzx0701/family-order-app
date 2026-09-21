/**
 * 手绘字体的「网络大子集」加载 —— 让菜名这类自由输入也能用手写体的关键一步
 *
 * ## 为什么需要它
 *
 * 猫啃什锦黑全量 12.02MB，压成 woff 仍有 2.95MB，**是微信主包上限（2MB）的 1.5 倍**，
 * 不可能内嵌；所以历史上只能按「实际用到的字」切片内嵌（见 scss/font-hand.scss）。
 *
 * 但内嵌切片有个绕不过去的矛盾：**菜名、食材名是用户自由输入的，字符集不可枚举**。
 * 旧子集只有 405 字，对家常菜名的覆盖率仅 **52%** —— 缺的字会**静默回退**成系统字体，
 * 一条菜名里两种笔触交替，比整行都用系统字体更碎、更难发现。
 *
 * 这里用「网络加载大子集」绕开包体上限：把一个 1480 字符的子集（327KB）放云存储，
 * 运行时用 `uni.loadFontFace` 取。它
 *   · **不占包体**（主包体积零增长）
 *   · 家常菜名覆盖率 52% → **94%**
 *   · 文案迭代时**不必重新发版**（换云存储上的字体文件即可）
 *
 * ## 两层字体的分工（字体栈见 scss/phase2-tokens.scss 的 $p2-font-hand）
 *
 *   MaokenWeb   ← 本文件加载（323KB，覆盖率优先）
 *     → MaokenHand  ← 包内 628 字符，随包加载、零网络等待
 *       → 系统字体
 *
 * 固定文案由本地那份兜住，所以**首屏永远不会先闪一下系统字体**；
 * 网络档到位后接管长尾字符。
 *
 * ## ⚠️ 部署前提（三条缺一不可）
 *
 * 1. 把 `.workbuddy/assets/fonts/maoken-web-1408.woff` 上传到下面 `FONT_URL` 指向的
 *    云存储路径。若实际路径不同，**同步改 FONT_URL**。
 * 2. 微信后台「开发管理 → 服务器域名 → downloadFile 合法域名」须含
 *    `https://env-00jy6tjoglvj.normal.cloudstatic.cn`（项目已配置）。
 * 3. 云存储须允许跨域（小程序要求字体链接「同源或开启 CORS」），且返回的
 *    content-type 要是字体类型（`font/woff`）—— 不对会解析失败。
 *
 * 这三条任一不满足都**不会报错给用户**：字体栈自动落到本地子集，只是长尾字符
 * 覆盖率退回 52%。**所以本文件在字体还没传上去的当下就能先上线**，不会把页面弄坏。
 */

/** 网络字集的 family 名。**必须与本地那份（MaokenHand）不同名** —— 同名会互相覆盖 */
const FONT_FAMILY = 'MaokenWeb'

/**
 * 字体文件的云存储地址
 *
 * 外面套一层 `encodeURI`：云存储路径含中文目录，直接拼进 `url()` 会被部分基础库
 * 当成非法字符。encodeURI 只编码中文与空格，不会动 `://` 这些结构字符。
 */
const FONT_URL = encodeURI(
  'https://env-00jy6tjoglvj.normal.cloudstatic.cn/黑米咖啡/字体/maoken-web-1408.woff'
)

/** 在途 Promise：App.onLaunch 可能被重复触发（如热重载），保证只发一次请求 */
let pending = null

/**
 * 触发一次当前页面重绘
 *
 * 字体是**异步**加载的，而**已渲染出来的文本不会自动换字体**（webview 会给新内容
 * 应用新字体，但已上屏的旧内容在部分机型上要等下一次重排才更新，iOS 尤其明显）。
 * 所以在 success 里主动让当前页重新渲染一次。
 *
 * 只重绘「当前页」足够 —— 此后新渲染的页面自会用到新字体。
 */
function repaintCurrentPage() {
  try {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
    const current = pages[pages.length - 1]
    const vm = current && (current.$vm || current)
    if (vm && typeof vm.$forceUpdate === 'function') {
      vm.$forceUpdate()
    }
  } catch (e) {
    // 拿不到页面实例不是错误，新页面渲染时自然用新字体
    console.warn('[hand-font] 重绘当前页失败（可忽略）', e)
  }
  // 同时广播一次，供将来需要精细控制的页面监听（当前没有订阅方）
  uni.$emit('hand-font-ready')
}

/**
 * 加载网络手绘字集（幂等，可重复调用）
 *
 * 刻意**不传 scopes**：3.7.9 起默认全选（webview / native / skyline），
 * 低版本默认 webview —— 两种都覆盖到小程序页面的文字渲染场景。
 *
 * @returns {Promise<boolean>} 是否加载成功（失败不是异常，只是覆盖率回落）
 */
export function loadHandFont() {
  if (pending) return pending

  pending = new Promise(resolve => {
    uni.loadFontFace({
      family: FONT_FAMILY,
      source: `url("${FONT_URL}")`,
      // 全局生效：官方说明 global 需在 app.js 里调用才全局生效，
      // 否则只在「调用时的那个页面」生效
      global: true,
      success: () => {
        console.log('[hand-font] 网络字集已就绪，菜名等长尾字符启用手写体')
        repaintCurrentPage()
        resolve(true)
      },
      fail: err => {
        // 刻意不弹 toast：字体是锦上添花，缺了不该打断用户。
        // 清掉 pending 以便将来某次调用还能重试（本次会话不会自动重试，避免反复请求）
        pending = null
        console.warn('[hand-font] 网络字集加载失败，已回退本地子集（长尾字符覆盖率下降）', err)
        resolve(false)
      }
    })
  })

  return pending
}
