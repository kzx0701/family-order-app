<template>
  <page-meta :page-style="cooking ? 'overflow: hidden;' : ''" />
  <view class="detail-page">
    <view class="detail-nav" :style="{ paddingTop: navTop + 'px' }">
      <button class="back-button" aria-label="返回菜谱列表" @tap="goBack"><Icon name="arrow-left" :size="21" /></button>
      <text>家庭小食谱</text><text class="nav-mark">RECIPE BOOK</text>
    </view>
    <template v-if="recipe">
      <view class="detail-cover"><RecipeArt :index="recipe.art" :label="recipe.name" /><text class="cover-note">{{ recipe.label }}</text></view>
      <view class="detail-body">
        <text class="recipe-title">{{ recipe.name }}</text><text class="recipe-subtitle">{{ recipe.subtitle }}</text>
        <view class="facts"><view><Icon name="clock" :size="18" /><text>{{ recipe.minutes }} 分钟</text></view><view><Icon name="star" :size="18" /><text>{{ recipe.difficulty }}</text></view><view><Icon name="user" :size="18" /><text>{{ servings }} {{ recipe.unit }}</text></view></view>
        <view class="kitchen-note"><Icon name="note" :size="20" /><view><text class="note-title">厨房小纸条</text><text class="note-content">{{ recipe.note }}</text></view></view>

        <view class="section-heading"><text class="section-number">01</text><text class="section-title">准备点好食材</text><text class="section-aside">{{ checked.length }}/{{ ingredients.length }} 已备好</text></view>
        <view class="ingredient-panel">
          <view class="portion-row"><text>今天做多少？</text><view class="stepper"><button aria-label="减少份量" :disabled="servings <= 1" @tap="changeServings(-1)"><Icon name="minus" :size="16" /></button><text>{{ servings }} {{ recipe.unit }}</text><button aria-label="增加份量" :disabled="servings >= 8" @tap="changeServings(1)"><Icon name="plus" :size="16" /></button></view></view>
          <view class="flavor-row"><text>喜欢的口味</text><view class="flavors"><button v-for="option in recipe.flavors" :key="option" :class="{ active: flavor === option }" :aria-pressed="flavor === option" @tap="changeFlavor(option)">{{ option }}</button></view></view>
          <view class="quantity-note"><Icon name="check" :size="12" /><text>用量已按口味和份量调整 · 点食材可标记备好</text></view>
          <view class="ingredient-list"><button v-for="item in ingredients" :key="item.id" class="ingredient" :class="{ checked: checked.includes(item.id) }" :aria-pressed="checked.includes(item.id)" @tap="toggleIngredient(item.id)"><view class="ingredient-name"><view class="check-box"><Icon v-if="checked.includes(item.id)" name="check" :size="13" /></view><text>{{ item.name }}</text></view><text class="ingredient-amount">{{ item.amount }} {{ item.unit }}</text></button></view>
        </view>
        <view class="section-heading"><text class="section-number coral">02</text><text class="section-title">一起慢慢做</text><text class="section-aside">{{ recipe.steps.length ? recipe.steps.length + ' 个小步骤' : '还在记录中' }}</text></view>
        <view v-if="recipe.steps.length" class="steps"><view v-for="(step, index) in recipe.steps" :key="step.title" class="step"><view class="step-marker">{{ index + 1 }}</view><view class="step-copy"><text class="step-title">{{ step.title }}</text><text class="step-description">{{ step.description }}</text><text v-if="step.tip" class="step-tip">小诀窍 · {{ step.tip }}</text></view></view></view>
        <view v-else class="unfinished-note"><Icon name="edit" :size="26" /><text>好味道，值得再认真记一记</text><text class="muted">做法还未补齐，暂时不能开始跟做。</text></view>
        <view class="detail-end"><Icon name="food" :size="17" /><text>把平凡的一餐，做成喜欢的日常。</text></view>
      </view>
      <view class="detail-footer"><view><text class="footer-title">{{ recipe.complete ? '围裙系好了吗？' : '这份菜谱还在长大' }}</text><text class="footer-caption">{{ recipe.complete ? '一步一步来，好味道不着急' : '补齐步骤后，就能一起做啦' }}</text></view><button class="primary-button" :disabled="!recipe.complete" @tap="startCooking"><Icon name="food" :size="17" /><text>{{ recipe.complete ? '跟着做' : '待完善' }}</text></button></view>
    </template>
    <view v-else class="missing"><Icon name="book-open" :size="45" /><text>这份菜谱暂时没找到</text><button class="primary-button" @tap="goBack">返回菜谱</button></view>

    <view v-if="cooking" class="cooking-layer">
      <view class="cooking-mask" @tap="closeCooking" @touchmove.stop.prevent />
      <view class="cooking-sheet" :class="{ leaving: closing }" role="dialog" aria-modal="true" aria-label="跟着菜谱做">
        <view class="sheet-handle" /><view class="cooking-head"><view><text class="cooking-eyebrow">{{ recipe.name }} · {{ servings }} {{ recipe.unit }} · {{ flavor }}</text><text class="cooking-title">{{ finished ? '好啦，开饭咯！' : '一步一步，好好做饭' }}</text></view><button class="close-button" aria-label="关闭跟做" @tap="closeCooking"><Icon name="close" :size="21" /></button></view>
        <view class="progress-track"><view :style="{ transform: 'scaleX(' + (finished ? 1 : (activeStep + 1) / recipe.steps.length) + ')' }" /></view>
        <view v-if="finished" class="finished-copy"><view class="finished-stamp"><Icon name="check" :size="44" /></view><text class="step-title">又学会一道家的味道</text><text class="step-description">辛苦啦，坐下来享受这一餐吧。</text></view>
        <view v-else :key="activeStep" class="cooking-step"><text class="step-counter">STEP {{ String(activeStep + 1).padStart(2, '0') }} / {{ String(recipe.steps.length).padStart(2, '0') }}</text><text class="cooking-step-title">{{ recipe.steps[activeStep].title }}</text><text class="step-description">{{ recipe.steps[activeStep].description }}</text><text v-if="recipe.steps[activeStep].tip" class="step-tip">小诀窍 · {{ recipe.steps[activeStep].tip }}</text></view>
        <view class="cooking-actions"><button v-if="!finished" class="previous-button" :disabled="activeStep === 0" @tap="activeStep--">上一步</button><button class="primary-button" @tap="nextStep">{{ finished ? '收好小食谱' : activeStep === recipe.steps.length - 1 ? '做好啦，开饭！' : '完成这步，继续' }}<Icon v-if="!finished" name="chevron-right" :size="17" /></button></view>
        <text class="cooking-footer">{{ finished ? '每一次用心，都让家的味道更好一点。' : '退出后再次打开，可以接着这一步。' }}</text>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { recipes, resolveIngredients } from '@/mock/recipes.js'
import { useSafeArea } from '@/composables/useSafeArea.js'
import RecipeArt from '@/components/recipe-art/recipe-art.vue'
const { statusBarHeight, menuButton } = useSafeArea()
const navTop = computed(() => menuButton.value?.bottom ? menuButton.value.bottom + 6 : statusBarHeight.value + 12)
const recipe = ref(null)
const servings = ref(2)
const flavor = ref('')
const checked = ref([])
const ingredients = computed(() => recipe.value ? resolveIngredients(recipe.value, flavor.value, servings.value) : [])
const cooking = ref(false)
const closing = ref(false)
const finished = ref(false)
const activeStep = ref(0)
let closeTimer
onLoad(options => { recipe.value = recipes.find(item => item.id === options?.id) || null; if (recipe.value) { servings.value = recipe.value.servings; flavor.value = recipe.value.defaultFlavor } })
const goBack = () => getCurrentPages().length > 1 ? uni.navigateBack() : uni.switchTab({ url: '/pages/recipe/recipe' })
const toggleIngredient = id => { checked.value = checked.value.includes(id) ? checked.value.filter(value => value !== id) : [...checked.value, id] }
const changeServings = direction => { servings.value = Math.max(1, Math.min(8, servings.value + direction)); checked.value = [] }
const changeFlavor = option => { if (flavor.value === option) return; flavor.value = option; checked.value = [] }
const startCooking = () => { if (!recipe.value?.complete) return; if (finished.value) { activeStep.value = 0; finished.value = false } cooking.value = true; closing.value = false }
const closeCooking = () => { if (closing.value) return; closing.value = true; closeTimer = setTimeout(() => { cooking.value = false; closing.value = false }, 220) }
const nextStep = () => { if (finished.value) return closeCooking(); if (activeStep.value < recipe.value.steps.length - 1) activeStep.value++; else finished.value = true }
onBackPress(() => { if (cooking.value) { closeCooking(); return true } return false })
onUnmounted(() => clearTimeout(closeTimer))
</script>
<style lang="scss" scoped>
@import '@/scss/font-recipe.scss';
.detail-page { min-height: 100vh; background: $p2-paper; color: $p2-ink; padding-bottom: calc(165rpx + env(safe-area-inset-bottom)); }
button { padding: 0; margin: 0; color: inherit; background: none; line-height: inherit; font: inherit; &::after { border: 0; } transition: transform 110ms $p2-ease; &:active:not([disabled]) { transform: scale(.97); } &[disabled] { opacity: .45; color: $p2-ink-soft; } }
.detail-nav { display: flex; align-items: center; gap: 20rpx; padding: 0 32rpx 18rpx; font-size: $p2-fs-body; }
.back-button, .close-button { display: flex; align-items: center; justify-content: center; width: 80rpx; height: 80rpx; border: 2rpx solid rgba(118,85,64,.45); background: $p2-surface; border-radius: 24rpx 20rpx 25rpx 22rpx; }
.nav-mark { margin-left: auto; font-size: 17rpx; color: $p2-ink-soft; letter-spacing: 2rpx; }
.detail-cover { position: relative; margin: 0 32rpx; border-radius: 30rpx 24rpx 35rpx 22rpx; border: 2rpx solid rgba(118,85,64,.4); overflow: hidden; }
.cover-note { position: absolute; left: 24rpx; bottom: 22rpx; background: $p2-butter-soft; padding: 10rpx 18rpx; border-radius: 10rpx; transform: rotate(-3deg); font-size: $p2-fs-caption; }
.detail-body { padding: 28rpx 36rpx 0; }
.recipe-title { display: block; font-family: RecipeMaoken, $p2-font-fallback; font-size: $p2-fs-display; }
.recipe-subtitle { display: block; margin-top: 8rpx; font-size: $p2-fs-body; color: $p2-ink-soft; }
.facts { display: flex; align-items: center; gap: 30rpx; padding: 27rpx 0; border-bottom: 2rpx dashed rgba(118,85,64,.28); > view { display: flex; align-items: center; gap: 8rpx; font-size: $p2-fs-caption; } }
.kitchen-note { display: flex; gap: 18rpx; margin: 28rpx 0 38rpx; padding: 25rpx; background: $p2-butter-soft; border-radius: 6rpx 20rpx 17rpx 22rpx; }
.note-title { display: block; font-size: $p2-fs-body; font-weight: 600; }
.note-content { display: block; font-size: $p2-fs-caption; line-height: 1.8; margin-top: 8rpx; }
.section-heading { display: flex; align-items: center; gap: 14rpx; margin: 34rpx 0 24rpx; }
.section-number { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; border-radius: 13rpx 18rpx 12rpx 16rpx; background: $p2-leaf-soft; font-size: $p2-fs-caption; transform: rotate(-5deg); &.coral { background: $p2-coral-soft; } }
.section-title { font-size: $p2-fs-title; font-family: RecipeMaoken, $p2-font-fallback; }
.section-aside { margin-left: auto; font-size: 21rpx; color: $p2-ink-soft; }
.ingredient-panel { padding: 8rpx 26rpx 14rpx; border: 2rpx solid rgba(118,85,64,.45); border-radius: 25rpx 19rpx 28rpx 20rpx; background: $p2-surface; }
.portion-row, .flavor-row { display: flex; justify-content: space-between; align-items: center; gap: 15rpx; padding: 18rpx 0; font-size: $p2-fs-body; }
.stepper { display: flex; align-items: center; border: 2rpx solid rgba(118,85,64,.35); border-radius: 16rpx; overflow: hidden; > text { min-width: 100rpx; text-align: center; font-size: $p2-fs-caption; } button { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; background: $p2-paper; } }
.flavors { display: flex; gap: 10rpx; button { font-size: $p2-fs-caption; padding: 15rpx 21rpx; border: 2rpx solid transparent; border-radius: 14rpx 17rpx 12rpx 17rpx; background: $p2-paper; &.active { background: $p2-leaf-soft; border-color: $p2-line; } } }
.quantity-note { display: flex; align-items: center; gap: 6rpx; font-size: 20rpx; color: #61784e; padding: 14rpx 0 22rpx; }
.ingredient { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 88rpx; border-top: 2rpx dashed rgba(118,85,64,.18); border-radius: 0; font-size: $p2-fs-body; text-align: left; }
.ingredient-name { display: flex; align-items: center; gap: 18rpx; }
.check-box { width: 34rpx; height: 34rpx; border: 2rpx solid #a58e76; border-radius: 9rpx 8rpx 10rpx 7rpx; display: flex; align-items: center; justify-content: center; }
.ingredient-amount { color: $p2-ink-soft; font-size: $p2-fs-caption; }
.checked { .ingredient-name > text { text-decoration: line-through; color: $p2-ink-soft; } .check-box { background: $p2-leaf-soft; border-color: $p2-leaf; } }
.step { display: flex; gap: 20rpx; position: relative; padding-bottom: 35rpx; &::before { content: ''; position: absolute; left: 22rpx; top: 48rpx; bottom: 3rpx; width: 2rpx; border-left: 2rpx dashed #d9c8af; } &:last-child::before { display: none; } }
.step-marker { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 46rpx; height: 46rpx; border: 2rpx solid rgba(118,85,64,.4); border-radius: 50%; font-size: $p2-fs-caption; background: $p2-surface; }
.step-copy { flex: 1; min-width: 0; padding-top: 3rpx; }
.step-title { display: block; font-size: $p2-fs-control; font-weight: 600; }
.step-description { display: block; font-size: $p2-fs-body; color: $p2-ink-soft; line-height: 1.9; margin-top: 14rpx; }
.step-tip { display: block; font-size: $p2-fs-caption; line-height: 1.8; margin-top: 18rpx; padding: 13rpx 18rpx; background: $p2-paper-deep; border-radius: 12rpx; }
.detail-end { display: flex; align-items: center; justify-content: center; gap: 13rpx; font-size: $p2-fs-caption; color: $p2-ink-soft; margin: 35rpx 0; }
.detail-footer { display: flex; justify-content: space-between; align-items: center; gap: 15rpx; position: fixed; z-index: 30; bottom: 0; left: 0; right: 0; padding: 22rpx 32rpx calc(22rpx + env(safe-area-inset-bottom)); background: $p2-surface; border-top: 2rpx solid #e8dcc9; }
.footer-title { display: block; font-size: $p2-fs-body; font-weight: 600; }
.footer-caption { display: block; margin-top: 6rpx; font-size: 21rpx; color: $p2-ink-soft; }
.primary-button { display: flex; align-items: center; justify-content: center; gap: 10rpx; padding: 24rpx 35rpx; border: 2rpx solid $p2-line; background: $p2-coral-soft; border-radius: 21rpx 17rpx 23rpx 19rpx; font-size: $p2-fs-control; box-shadow: 3rpx 4rpx 0 rgba(98,71,53,.14); white-space: nowrap; }
.unfinished-note, .missing { display: flex; flex-direction: column; align-items: center; gap: 24rpx; padding: 50rpx 20rpx; font-size: $p2-fs-body; text-align: center; }
.muted { color: $p2-ink-soft; font-size: $p2-fs-caption; }
.cooking-layer { position: fixed; inset: 0; z-index: 500; }
.cooking-mask { position: absolute; inset: 0; background: rgba(56,40,28,.4); animation: mask-in 180ms ease backwards; }
.cooking-sheet { position: absolute; bottom: 0; left: 0; right: 0; max-height: 90vh; overflow-y: auto; overscroll-behavior: contain; background: $p2-paper; border-radius: 40rpx 37rpx 0 0; padding: 18rpx 38rpx calc(30rpx + env(safe-area-inset-bottom)); animation: sheet-in 280ms $p2-ease backwards; transition: transform 220ms $p2-ease; &.leaving { transform: translateY(100%); } }
.sheet-handle { width: 65rpx; height: 7rpx; background: #d1c1a8; border-radius: 9rpx; margin: 0 auto 30rpx; }
.cooking-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.cooking-eyebrow { font-size: $p2-fs-caption; color: $p2-ink-soft; display: block; }
.cooking-title { font-family: RecipeMaoken, $p2-font-fallback; font-size: $p2-fs-heading; display: block; margin-top: 12rpx; }
.close-button { flex-shrink: 0; border: 0; background: $p2-paper-deep; }
.progress-track { height: 9rpx; border-radius: 9rpx; background: #eaddc7; margin: 32rpx 0; overflow: hidden; > view { width: 100%; height: 100%; background: $p2-leaf; transform-origin: left; transition: transform 240ms $p2-ease; } }
.cooking-step { min-height: 310rpx; animation: step-in 220ms $p2-ease backwards; }
.step-counter { color: #698154; font-size: $p2-fs-caption; letter-spacing: 3rpx; }
.cooking-step-title { display: block; margin-top: 18rpx; font-size: $p2-fs-heading; font-family: RecipeMaoken, $p2-font-fallback; }
.cooking-actions { display: flex; align-items: center; gap: 24rpx; margin-top: 30rpx; .primary-button { flex: 1; } }
.previous-button { padding: 24rpx 20rpx; font-size: $p2-fs-body; }
.cooking-footer { display: block; text-align: center; margin-top: 26rpx; color: $p2-ink-soft; font-size: 21rpx; }
.finished-copy { padding: 12rpx 0 25rpx; text-align: center; }
.finished-stamp { display: flex; align-items: center; justify-content: center; width: 130rpx; height: 130rpx; background: $p2-leaf-soft; border: 2rpx solid $p2-line; border-radius: 48% 51% 47% 53%; margin: 0 auto 28rpx; transform: rotate(-8deg); }
@keyframes sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes mask-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes step-in { from { opacity: 0; transform: translateX(10rpx); } to { opacity: 1; transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) { .cooking-sheet, .cooking-step, .cooking-mask { animation: none; transition: none; } .progress-track > view, button { transition: none; } }
</style>
