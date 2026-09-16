<template>
  <view class="default-avatar">
    <image
      class="avatar-art"
      :class="{ 'avatar-art--boy': isMale }"
      :src="artSrc"
      mode="aspectFill"
      :webp="true"
    />
  </view>
</template>

<script setup>
/**
 * 默认头像组件
 * 用户未上传头像时显示的手绘卡通头像（云存储素材），按性别区分
 * 尺寸由父容器决定（width / height: 100%）
 *
 * 用法：
 *   <default-avatar gender="male" />    男生头像
 *   <default-avatar gender="female" />  女生头像
 *   <default-avatar />                  缺省或非法值按男生（与引导跳过时的默认一致）
 *
 * 说明：素材是透明底的半身像，由容器圆角裁成头像；圆形之外的透明区域
 * 露出父容器底色（pages/my 的 .avatar-wrap 为 $p2-white），无需再设背景色。
 */
import { computed } from 'vue'
import { imgUrl } from '@/utils/image.js'
import { AVATAR_ART, AVATAR_ART_WIDTH } from '@/utils/artwork.js'

const props = defineProps({
  // 'male' | 'female'
  gender: { type: String, default: 'male' }
})

/* 非 female 一律按男生处理，避免出现「无头像」的空态 */
const isMale = computed(() => props.gender !== 'female')

const artSrc = computed(() =>
  imgUrl(isMale.value ? AVATAR_ART.male : AVATAR_ART.female, { w: AVATAR_ART_WIDTH })
)
</script>

<style lang="scss" scoped>
.default-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  /* 跟随父容器的圆角形状：pages/my 的 .avatar-wrap 用手绘不规则圆，
     若此处写死 50% 正圆会把它盖住、丢掉手绘感 */
  border-radius: inherit;
  overflow: hidden;
}

.avatar-art {
  width: 100%;
  height: 100%;
}

/* 男生素材的人物在 1254×1254 画布中占比偏小（头部小于女生素材约三成），
 * 放大以让两张头像的脸部尺寸在圆形内视觉一致。
 * 1.15 为去掉外框间隙、图片区域放大到 140rpx 后的实测值 */
.avatar-art--boy {
  transform: scale(1.15);
}
</style>
