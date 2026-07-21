import { ref, onMounted, nextTick } from 'vue'

/**
 * 测量页面顶部 header 的实际高度
 * 用于 header 改为 position: fixed 后，在内容区上方撑开相同高度的占位
 *
 * @param {string} selector - header 的 CSS 选择器，默认 '.header'
 * @returns {{ headerHeight: import('vue').Ref<number>, remeasure: () => void }}
 */
export function useHeaderFixed(selector = '.header') {
  const headerHeight = ref(0)

  const remeasure = () => {
    uni.createSelectorQuery()
      .select(selector)
      .boundingClientRect((rect) => {
        if (rect && rect.height) {
          headerHeight.value = rect.height
        }
      })
      .exec()
  }

  onMounted(async () => {
    await nextTick()
    // 延迟一帧确保装饰元素（如 Lottie canvas）渲染完成
    setTimeout(remeasure, 50)
  })

  return { headerHeight, remeasure }
}
