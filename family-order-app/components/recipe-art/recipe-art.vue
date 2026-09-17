<template>
  <view class="recipe-art" :class="'art-' + index" role="img" :aria-label="label">
    <image class="atlas" src="/static/images/recipes/food-atlas-v1.webp" mode="scaleToFill" :style="position" />
  </view>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ index: { type: Number, default: 0 }, label: { type: String, default: '菜品插画' } })
// Generated atlas rows have unequal content bounds. Map each verified band into
// the same 4:3 container, so the next dish cannot bleed into the current card.
const bands = [[0, 425], [425, 840], [840, 1330]]
const position = computed(() => {
  const [top, bottom] = bands[Math.floor(props.index / 2)] || bands[0]
  return { left: -(props.index % 2) * 100 + '%', top: -top / (bottom - top) * 100 + '%', height: 1330 / (bottom - top) * 100 + '%' }
})
</script>
<style scoped>
.recipe-art { position: relative; width: 100%; padding-top: 75%; overflow: hidden; background: #fff9ed; }
.atlas { position: absolute; width: 200%; height: 300%; max-width: none; }
</style>
