<template>
  <view class="fo-icon" :style="iconStyle" @click="$emit('click', $event)"></view>
</template>

<script setup>
/**
 * 通用 SVG 图标组件
 * - lucide 风格（stroke 描边，圆角线帽）
 * - 使用 CSS mask 实现着色：图标形状作为 mask，背景色为 currentColor，从而继承父级文字颜色
 * - 支持自定义尺寸、线宽、颜色
 *
 * 用法：<Icon name="home" :size="24" />
 *      <Icon name="coffee" :size="20" color="#6F4E37" />
 */
import { computed } from 'vue'

const props = defineProps({
  // 图标名称（见 iconPaths 映射）
  name: { type: String, required: true },
  // 尺寸（同时设置宽高），单位 px
  size: { type: [Number, String], default: 24 },
  // 单独宽度（优先于 size）
  width: { type: [Number, String], default: null },
  // 单独高度（优先于 size）
  height: { type: [Number, String], default: null },
  // 描边线宽
  strokeWidth: { type: [Number, String], default: 2 },
  // 颜色（留空则继承父级 currentColor）
  color: { type: String, default: '' }
})

defineEmits(['click'])

// lucide 风格图标 path 数据（viewBox 24x24，stroke 描边）
const iconPaths = {
  // 首页
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  // 餐具交叉（点单 tab）
  'utensils-crossed': '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.1 6.4-6.4"/><path d="m19 5-7 7"/>',
  // 返回
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  // 购物袋
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  // 加号
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  // 减号
  minus: '<path d="M5 12h14"/>',
  // 对勾
  check: '<path d="M20 6 9 17l-5-5"/>',
  // 时钟（预约时间）
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  // 备注（便签）
  note: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
  // 咖啡
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  // 美食（餐具）
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  // 打开的书（菜谱 tab）
  'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
  // 关闭
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  // 搜索
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  // 裁剪
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  // 右箭头
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  // 上箭头（分类上移）
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  // 下箭头（分类下移）
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  // 刷新（重试按钮）
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  // 用户（默认头像用）
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  // 编辑
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  // 删除
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  // 上传
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  // 设置（管理 tab）
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  // 微信品牌图标：simple-icons 官方剪影（实心，非 lucide 线性描边 —— 品牌 logo 用官方形态）。
  // 自带 fill/stroke 覆盖组件默认的描边设置；mask 只取形状，fill 用什么颜色都可以。
  wechat: '<path fill="#000" stroke="none" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>'
}

// 构建 SVG data URI（mask 用）
const svgDataUri = computed(() => {
  const inner = iconPaths[props.name] || ''
  const sw = Number(props.strokeWidth) || 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})

// 数值转 px 字符串
const toPx = (val) => {
  if (val === null || val === undefined || val === '') return null
  return typeof val === 'number' ? `${val}px` : String(val)
}

const iconStyle = computed(() => {
  const w = toPx(props.width ?? props.size)
  const h = toPx(props.height ?? props.size)
  const style = {
    width: w,
    height: h,
    '-webkit-mask-image': `url("${svgDataUri.value}")`,
    'mask-image': `url("${svgDataUri.value}")`
  }
  // 显式 color 覆盖 currentColor
  if (props.color) {
    style['background-color'] = props.color
  }
  return style
})
</script>

<style lang="scss" scoped>
.fo-icon {
  display: inline-block;
  background-color: currentColor; /* 默认继承父级文字颜色 */
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-size: contain;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
