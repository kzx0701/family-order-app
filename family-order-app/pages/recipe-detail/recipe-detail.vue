<template>
  <view class="detail-page">
    <view class="nav" :style="{ paddingTop: navTop + 'px' }">
      <button class="icon-button back" aria-label="返回菜谱" @tap="requestBack"><Icon name="arrow-left" :size="20" /></button>
      <text>家庭小食谱</text><text class="badge">{{ editing ? '正在编辑' : '家的拿手菜' }}</text>
    </view>
    <view class="hero">
      <view class="hero-wash" />
      <image class="dish-art" src="/static/images/recipes/dishes/garlic-bok-choy-v1.png" mode="aspectFit" aria-label="蒜蓉小青菜" />
      <text class="scribble">一盘绿意，一点蒜香</text>
    </view>
    <view class="body">
      <view class="intro">
        <template v-if="editing">
          <text class="field-label">菜谱名称 · 必填</text>
          <input v-model="draft.name" class="field title-field" maxlength="24" placeholder="给这道菜起个名字" aria-label="菜谱名称" />
          <input v-model="draft.subtitle" class="field subtitle-field" maxlength="60" placeholder="写一句小介绍（选填）" aria-label="菜谱简介" />
        </template>
        <template v-else><text class="title">{{ shown.name }}</text><text v-if="shown.subtitle" class="subtitle">{{ shown.subtitle }}</text></template>
        <view class="meta"><view class="leaf" /><text>家常菜 · 不辣</text><text class="demo-label">本机体验菜谱</text></view>
      </view>
      <view v-for="(section, index) in sections" :key="section.key" class="material-section">
        <view class="section-head"><text class="number" :class="section.key">{{ index + 1 }}</text><text class="section-title">{{ section.title }}</text><text v-if="!editing" class="caption">{{ section.caption }}</text><button v-else class="text-button" :aria-label="'添加' + section.title" @tap="openPicker(section.key)"><Icon name="plus" :size="14" />添加</button></view>
        <scroll-view scroll-x class="material-scroll" :show-scrollbar="false">
          <view class="material-row">
            <view v-for="item in shown[section.key]" :key="item.id" class="material">
              <button v-if="editing" class="remove" :aria-label="'移除' + lookup(item.id).name" @tap="removeMaterial(section.key, item.id)"><Icon name="minus" :size="13" /></button>
              <view class="material-art"><image :src="lookup(item.id).image" mode="aspectFit" /></view>
              <text class="material-name">{{ lookup(item.id).name }}</text>
              <input v-if="editing" v-model="item.quantity" class="quantity-input" maxlength="20" placeholder="用量（选填）" :aria-label="lookup(item.id).name + '用量'" />
              <text v-else-if="item.quantity" class="quantity">{{ item.quantity }}</text>
            </view>
            <button v-if="editing" class="add-material" :aria-label="'选择' + section.title" @tap="openPicker(section.key)"><Icon name="plus" :size="23" /><text>加一点</text></button>
          </view>
        </scroll-view>
        <text v-if="!shown[section.key].length" class="empty">{{ editing ? '点「添加」，挑选需要的' + section.title : '暂未记录' + section.title }}</text>
      </view>
      <view class="section-head steps-heading"><text class="number coral">3</text><text class="section-title">一起慢慢做</text><text class="caption">{{ shown.steps.length }} 个小步骤</text></view>
      <text v-if="editing" class="hint">步骤名称必填，详情和注意事项可以留空。</text>
      <view v-for="(step, index) in shown.steps" :id="'step-' + step.id" :key="step.id" class="step" :class="{ editor: editing, invalid: editing && attempted && !step.title.trim() }">
        <view class="step-top"><text class="step-index">步骤 {{ index + 1 }}</text><view v-if="editing" class="step-actions">
          <button class="small-icon" :disabled="index === 0" :aria-label="'上移步骤' + (index + 1)" @tap="moveStep(index, -1)"><Icon name="chevron-up" :size="17" /></button>
          <button class="small-icon" :disabled="index === draft.steps.length - 1" :aria-label="'下移步骤' + (index + 1)" @tap="moveStep(index, 1)"><Icon name="chevron-down" :size="17" /></button>
          <button class="small-icon danger" :disabled="draft.steps.length === 1" :aria-label="'删除步骤' + (index + 1)" @tap="removeStep(index)"><Icon name="trash" :size="16" /></button>
        </view><view v-else class="dash" /></view>
        <template v-if="editing">
          <input v-model="step.title" class="field" maxlength="50" placeholder="这一步做什么？（必填）" :aria-label="'步骤' + (index + 1) + '名称'" />
          <text v-if="attempted && !step.title.trim()" class="error">请给这一步写个名称</text>
          <text class="field-label">步骤详情 <text>选填</text></text>
          <textarea v-model="step.description" class="area" auto-height maxlength="1000" :show-confirm-bar="false" placeholder="记下做法、火候、时间…" :aria-label="'步骤' + (index + 1) + '详情'" />
          <text class="field-label">注意事项 <text>选填</text></text>
          <textarea v-model="step.tip" class="area tip-area" auto-height maxlength="300" :show-confirm-bar="false" placeholder="有什么小诀窍，悄悄记在这里…" :aria-label="'步骤' + (index + 1) + '注意事项'" />
        </template>
        <template v-else><text class="step-title">{{ step.title }}</text><text v-if="step.description" class="description">{{ step.description }}</text><view v-if="step.tip" class="tip"><Icon name="note" :size="16" /><view><text class="tip-label">小小提醒</text><text>{{ step.tip }}</text></view></view></template>
      </view>
      <button v-if="editing" class="add-step" :disabled="draft.steps.length >= 30" @tap="addStep"><Icon name="plus" :size="19" />{{ draft.steps.length >= 30 ? '最多 30 个步骤' : '增加步骤' }}<text>把好味道，接着往下记</text></button>
      <view v-else class="end-note"><Icon name="food" :size="16" /><text>认真做饭的人，也要好好吃饭呀。</text></view>
    </view>
    <view v-if="canEdit" class="footer">
      <template v-if="editing"><button class="cancel" @tap="cancelEditing">取消</button><button class="primary save" :disabled="saving" @tap="save"><Icon name="check" :size="18" />{{ saving ? '正在保存…' : '保存菜谱' }}</button></template>
      <template v-else><view class="footer-copy"><text>家的味道，由你记录</text><text>添一点用心，多一点好吃</text></view><button class="primary" @tap="startEditing"><Icon name="edit" :size="18" />编辑菜谱</button></template>
    </view>
    <view v-if="picker && editing && canEdit" class="picker-layer">
      <view class="mask" @tap="picker = ''" @touchmove.stop.prevent />
      <view class="sheet"><view class="handle" /><view class="picker-heading"><view><text class="section-title">挑一点{{ picker === 'ingredients' ? '食材' : '调料' }}</text><text class="subtitle">厨房的小伙伴，都在这里</text></view><button class="icon-button" aria-label="关闭选择" @tap="picker = ''"><Icon name="close" :size="20" /></button></view>
        <scroll-view scroll-y class="picker-scroll"><view class="picker-grid"><button v-for="item in pickerOptions" :key="item.id" class="picker-item" :class="{ selected: selection.includes(item.id) }" :aria-label="'选择' + item.name" :aria-pressed="selection.includes(item.id)" @tap="toggleSelection(item.id)"><image :src="item.image" mode="aspectFit" /><text>{{ item.name }}</text><view class="selection-dot"><Icon v-if="selection.includes(item.id)" name="check" :size="12" /></view></button></view></scroll-view>
        <button class="primary confirm" @tap="confirmPicker">就选这些 · {{ selection.length }} 种</button>
      </view>
    </view>
    <fo-dialog :visible="discardDialog" title="收起这次修改？" subtitle="未保存的内容会丢失，原来的菜谱仍会保留。" cancel-text="继续编辑" confirm-text="放弃修改" @close="discardDialog = false" @confirm="discard" />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useUserStore } from '@/store/user.js'
import { pantry, freshRecipe, cloneRecipe, validateRecipe } from '@/mock/recipe-editor.js'
const STORAGE_KEY = 'fo_recipe_editor_demo_v2'
const userStore = useUserStore()
const canEdit = computed(() => userStore.isCook)
const { statusBarHeight, menuButton } = useSafeArea()
const navTop = computed(() => menuButton.value?.bottom ? menuButton.value.bottom + 8 : statusBarHeight.value + 10)
const saved = ref(freshRecipe()), draft = ref(null), editing = ref(false), saving = ref(false), attempted = ref(false)
const shown = computed(() => editing.value ? draft.value : saved.value)
const dirty = computed(() => editing.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value))
const picker = ref(''), selection = ref([]), discardDialog = ref(false)
const pickerOptions = computed(() => pantry.filter(item => item.group === picker.value))
const sections = [{ key: 'ingredients', title: '食材', caption: '新鲜一点，好吃一点' }, { key: 'seasonings', title: '调料', caption: '好味道的秘密' }]
const lookup = id => pantry.find(item => item.id === id) || { name: '食材', image: '' }
let leaveAfterDiscard = false, nextId = 0
onLoad(() => {
  try {
    const value = uni.getStorageSync(STORAGE_KEY)
    if (value?.version === 1 && typeof value.name === 'string' && typeof value.subtitle === 'string'
      && ['ingredients', 'seasonings'].every(group => Array.isArray(value[group]) && value[group].every(item => pantry.some(p => p.id === item.id && p.group === group) && typeof item.quantity === 'string'))
      && Array.isArray(value.steps) && value.steps.length > 0 && value.steps.every(step => typeof step.id === 'string' && ['title', 'description', 'tip'].every(key => typeof step[key] === 'string')) && !validateRecipe(value)) saved.value = cloneRecipe(value)
  } catch { /* Corrupted or unavailable local storage falls back to the demo. */ }
})
const exitEditing = () => { editing.value = false; draft.value = null; picker.value = ''; attempted.value = false }
watch(canEdit, allowed => { if (!allowed) { exitEditing(); discardDialog.value = false } })
const startEditing = () => { if (!canEdit.value) return; draft.value = cloneRecipe(saved.value); attempted.value = false; editing.value = true }
const back = () => getCurrentPages().length > 1 ? uni.navigateBack() : uni.switchTab({ url: '/pages/recipe/recipe' })
const cancelEditing = () => { leaveAfterDiscard = false; if (dirty.value) discardDialog.value = true; else exitEditing() }
const requestBack = () => { if (picker.value) { picker.value = ''; return } if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true } else { exitEditing(); back() } }
const discard = () => { discardDialog.value = false; exitEditing(); if (leaveAfterDiscard) back() }
onBackPress(() => { if (picker.value) { picker.value = ''; return true } if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true; return true } return false })
const openPicker = group => { if (!editing.value || !canEdit.value) return; selection.value = draft.value[group].map(item => item.id); picker.value = group }
const toggleSelection = id => { selection.value = selection.value.includes(id) ? selection.value.filter(value => value !== id) : [...selection.value, id] }
const confirmPicker = () => {
  if (!canEdit.value || !editing.value || !picker.value) return
  const group = picker.value
  draft.value[group] = selection.value.map(id => draft.value[group].find(item => item.id === id) || { id, quantity: lookup(id).quantity })
  picker.value = ''
}
const removeMaterial = (group, id) => { if (canEdit.value && editing.value) draft.value[group] = draft.value[group].filter(item => item.id !== id) }
const addStep = async () => {
  if (!canEdit.value || !editing.value || draft.value.steps.length >= 30) return
  const id = 'new-' + Date.now() + '-' + nextId++
  draft.value.steps.push({ id, title: '', description: '', tip: '' })
  await nextTick(); uni.pageScrollTo({ selector: '#step-' + id, duration: 220 })
}
const removeStep = index => { if (canEdit.value && editing.value && draft.value.steps.length > 1) draft.value.steps.splice(index, 1) }
const moveStep = (index, direction) => {
  if (!canEdit.value || !editing.value) return
  const target = index + direction
  if (target < 0 || target >= draft.value.steps.length) return
  const [step] = draft.value.steps.splice(index, 1); draft.value.steps.splice(target, 0, step)
}
const save = () => {
  if (!canEdit.value || !editing.value || saving.value) return
  attempted.value = true
  const error = validateRecipe(draft.value)
  if (error) {
    uni.showToast({ title: error, icon: 'none' })
    const invalid = draft.value.steps.find(step => !step.title.trim())
    if (invalid) uni.pageScrollTo({ selector: '#step-' + invalid.id, duration: 220 })
    else uni.pageScrollTo({ scrollTop: 0, duration: 220 })
    return
  }
  saving.value = true
  try {
    const value = cloneRecipe(draft.value)
    value.name = value.name.trim(); value.subtitle = value.subtitle.trim()
    for (const group of ['ingredients', 'seasonings']) value[group].forEach(item => { item.quantity = item.quantity.trim() })
    value.steps.forEach(step => { for (const key of ['title', 'description', 'tip']) step[key] = step[key].trim() })
    uni.setStorageSync(STORAGE_KEY, value); saved.value = value; exitEditing()
    uni.showToast({ title: '菜谱已保存到本机', icon: 'none' })
  } catch { uni.showToast({ title: '保存失败，修改仍在，请重试', icon: 'none' }) }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
@import '@/scss/font-recipe.scss';
.detail-page { min-height:100vh; background:$p2-paper; color:$p2-ink; padding-bottom:calc(170rpx + env(safe-area-inset-bottom)); }
button { margin:0; padding:0; background:transparent; color:inherit; font:inherit; line-height:inherit; border-radius:0; &::after { border:0; } transition:transform 110ms $p2-ease; &:active:not([disabled]) { transform:scale(.96); } &[disabled] { opacity:.35; } }
.nav { display:flex; align-items:center; gap:16rpx; padding:0 34rpx; font-size:$p2-fs-caption; }
.icon-button { width:72rpx; height:72rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.back { border:2rpx solid #d4c4af; background:$p2-surface; border-radius:20rpx 17rpx 22rpx 18rpx; }
.badge { margin-left:auto; color:#738060; background:#e8edda; padding:9rpx 16rpx; border-radius:16rpx 12rpx; font-size:20rpx; }
.hero { position:relative; height:340rpx; margin:8rpx 30rpx 6rpx; display:flex; justify-content:center; align-items:center; }
.hero-wash { position:absolute; width:340rpx; height:220rpx; background:#ebeed7; border-radius:51% 49% 44% 56%; transform:rotate(-9deg); opacity:.65; }
.dish-art { position:relative; width:395rpx; height:330rpx; }
.scribble { position:absolute; right:0; bottom:20rpx; color:$p2-ink-soft; font-size:20rpx; transform:rotate(-7deg); border-bottom:3rpx solid $p2-butter; padding-bottom:5rpx; }
.body { padding:0 38rpx; }
.intro { padding:5rpx 0 30rpx; }
.title { display:block; font-family:RecipeMaoken,$p2-font-fallback; font-size:$p2-fs-display; line-height:1.35; }
.subtitle { display:block; font-size:$p2-fs-body; color:$p2-ink-soft; margin-top:10rpx; line-height:1.7; }
.meta { display:flex; align-items:center; gap:12rpx; font-size:21rpx; color:$p2-ink-soft; margin-top:18rpx; }
.leaf { width:12rpx; height:18rpx; border-radius:70% 20%; background:$p2-leaf; transform:rotate(30deg); }
.demo-label { margin-left:auto; font-size:18rpx; }
.material-section { padding:24rpx 0 26rpx; border-top:2rpx dashed #e1d6c3; }
.section-head { display:flex; align-items:center; gap:13rpx; margin-bottom:20rpx; }
.number { display:flex; justify-content:center; align-items:center; width:38rpx; height:40rpx; font-size:21rpx; background:$p2-leaf-soft; border-radius:10rpx 13rpx 8rpx 12rpx; transform:rotate(-7deg); }
.seasonings { background:$p2-butter-soft; }.coral { background:$p2-coral-soft; }
.section-title { font-size:$p2-fs-title; font-weight:600; }
.caption { margin-left:auto; font-size:21rpx; color:$p2-ink-soft; }
.text-button { display:flex; align-items:center; gap:7rpx; margin-left:auto; font-size:$p2-fs-caption; color:#65794f; min-height:58rpx; }
.material-scroll { width:100%; }.material-row { display:flex; gap:19rpx; padding:12rpx 0 6rpx; }
.material { width:140rpx; flex-shrink:0; text-align:center; position:relative; }
.material-art { width:120rpx; height:116rpx; border-radius:48% 52% 47% 53%; margin:0 auto 8rpx; background:#f2efde; image { width:100%; height:100%; } }
.material-name { display:block; font-size:$p2-fs-body; }.quantity { display:block; font-size:21rpx; color:$p2-ink-soft; margin-top:6rpx; min-height:30rpx; }
.remove { position:absolute; top:-8rpx; right:2rpx; width:48rpx; height:48rpx; display:flex; align-items:center; justify-content:center; background:#fae4d9; border-radius:50%; z-index:1; }
.quantity-input { font-size:22rpx; height:62rpx; border:2rpx dashed #cbbba2; border-radius:12rpx; margin-top:10rpx; background:$p2-surface; }
.add-material { width:124rpx; min-height:190rpx; flex-shrink:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:12rpx; color:#879172; border:2rpx dashed #c3c9ac; border-radius:20rpx 24rpx 19rpx 23rpx; font-size:$p2-fs-caption; }
.empty { display:block; font-size:$p2-fs-caption; color:$p2-ink-soft; padding:20rpx 0; }
.steps-heading { padding-top:26rpx; border-top:2rpx dashed #e1d6c3; }
.step { padding:24rpx 0 30rpx; border-bottom:2rpx dashed #e1d6c3; }
.step-top { display:flex; align-items:center; gap:14rpx; margin-bottom:15rpx; min-height:36rpx; }
.step-index { color:#7a895e; font-size:$p2-fs-caption; letter-spacing:2rpx; }.dash { width:45rpx; height:3rpx; background:#c3cda8; border-radius:50%; }
.step-title { display:block; font-size:$p2-fs-control; font-weight:600; line-height:1.6; overflow-wrap:anywhere; }
.description { display:block; margin-top:12rpx; font-size:$p2-fs-body; color:$p2-ink-soft; line-height:1.95; white-space:pre-wrap; overflow-wrap:anywhere; }
.tip { display:flex; align-items:flex-start; gap:14rpx; background:#f7edca; border-radius:6rpx 18rpx 14rpx 17rpx; margin-top:22rpx; padding:20rpx; font-size:$p2-fs-caption; line-height:1.85; white-space:pre-wrap; }.tip-label { display:block; font-weight:600; margin-bottom:4rpx; }
.end-note { display:flex; align-items:center; justify-content:center; gap:12rpx; font-size:22rpx; color:$p2-ink-soft; padding:45rpx 0; }
.footer { position:fixed; bottom:0; left:0; right:0; display:flex; align-items:center; gap:22rpx; justify-content:space-between; padding:22rpx 34rpx calc(22rpx + env(safe-area-inset-bottom)); background:$p2-paper; border-top:2rpx solid #e8dfcd; z-index:30; }
.footer-copy { text { display:block; font-size:$p2-fs-body; } text + text { color:$p2-ink-soft; font-size:20rpx; margin-top:7rpx; } }
.primary { display:flex; align-items:center; justify-content:center; gap:12rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:19rpx 23rpx 16rpx 20rpx; padding:22rpx 32rpx; min-height:88rpx; font-size:$p2-fs-control; box-shadow:3rpx 4rpx 0 #62473518; }
.cancel { min-width:155rpx; padding:24rpx; font-size:$p2-fs-control; }.save { flex:1; }
.field-label { display:block; font-size:$p2-fs-caption; color:$p2-ink-soft; margin:20rpx 0 12rpx; text { font-size:20rpx; opacity:.8; margin-left:8rpx; } }
.field { height:88rpx; padding:0 22rpx; border:2rpx solid #d5c8b5; border-radius:15rpx 19rpx 14rpx 17rpx; background:$p2-surface; font-size:$p2-fs-body; box-sizing:border-box; }
.title-field { font-size:$p2-fs-title; }.subtitle-field { margin-top:16rpx; }
.area { width:100%; min-height:124rpx; padding:18rpx 22rpx; background:$p2-surface; border:2rpx solid #d5c8b5; border-radius:16rpx; font-size:$p2-fs-body; line-height:1.8; box-sizing:border-box; }.tip-area { background:#fffaf0; }
.hint { display:block; font-size:22rpx; color:$p2-ink-soft; }
.editor { border:2rpx solid #d9cbb5; border-radius:22rpx 26rpx 19rpx 24rpx; padding:20rpx 22rpx 26rpx; margin:20rpx 0; background:#fcf5e6; animation:appear 180ms $p2-ease; }
.step-actions { display:flex; margin-left:auto; gap:4rpx; }.small-icon { width:58rpx; height:58rpx; display:flex; align-items:center; justify-content:center; }.danger { color:$p2-danger; }.invalid { border-color:$p2-danger; }.error { display:block; color:$p2-danger; font-size:22rpx; margin-top:10rpx; }
.add-step { width:100%; display:flex; align-items:center; justify-content:center; gap:12rpx; padding:26rpx 12rpx; border:2rpx dashed #a8b68b; border-radius:20rpx; color:#63784f; font-size:$p2-fs-body; margin:26rpx 0 20rpx; text { font-size:20rpx; color:$p2-ink-soft; } }
.picker-layer { position:fixed; inset:0; z-index:100; }.mask { position:absolute; inset:0; background:#3e301a66; }
.sheet { position:absolute; bottom:0; left:0; right:0; padding:18rpx 34rpx calc(30rpx + env(safe-area-inset-bottom)); background:$p2-paper; border-radius:34rpx 38rpx 0 0; animation:slide-up 240ms $p2-ease; }
.handle { width:65rpx; height:7rpx; background:#d0c4ac; border-radius:6rpx; margin:0 auto 25rpx; }
.picker-heading { display:flex; justify-content:space-between; align-items:center; }.picker-scroll { max-height:48vh; margin:24rpx 0; }
.picker-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18rpx; padding:6rpx; }
.picker-item { position:relative; border:2rpx solid #e1d8c5; padding:15rpx; border-radius:20rpx; font-size:$p2-fs-body; background:$p2-surface; image { display:block; width:110rpx; height:110rpx; margin:auto; } &.selected { background:#eaf0db; border-color:#8b9e6a; } }
.selection-dot { position:absolute; top:10rpx; right:10rpx; width:28rpx; height:28rpx; border:2rpx solid #a9b695; border-radius:50%; display:flex; align-items:center; justify-content:center; }.confirm { width:100%; }
@keyframes appear { from { opacity:0; transform:translateY(6rpx); } to { opacity:1; transform:translateY(0); } }
@keyframes slide-up { from { transform:translateY(100%); } to { transform:translateY(0); } }
@media (prefers-reduced-motion:reduce) { button { transition:none; }.editor,.sheet { animation:none; } }
</style>
