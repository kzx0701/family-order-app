<template>
  <view class="detail-page">
    <view class="nav" :style="{ paddingTop: navTop + 'px' }">
      <button class="icon-button back" aria-label="返回菜谱" @tap="requestBack"><Icon name="arrow-left" :size="20" /></button>
    </view>
    <view class="hero">
      <image v-if="heroSrc" class="dish-art cover-img" :class="{ 'is-loaded': heroReady }" :src="heroSrc" mode="aspectFit" :webp="true" @load="onHeroLoaded" @error="onHeroError" />
      <image v-else-if="!editing" class="dish-art" :src="FALLBACK_DISH_ART" mode="aspectFit" aria-label="蒜蓉小青菜" />
      <button v-else class="cover-blank" aria-label="添加菜品封面" @tap="chooseImage"><Icon name="plus" :size="26" /><text>添加封面</text></button>
      <button v-if="editing && heroSrc" class="cover-edit" :disabled="uploading" aria-label="换一张封面" @tap="chooseImage"><Icon name="upload" :size="15" />换封面</button>
    </view>
    <!-- 上传进度：贴在封面图正下方的细横条。
         原来把「上传中 45%」塞在「换封面」按钮里，一个控件同时当按钮和状态显示，两不像，
         位置也跟着按钮飘在图片右下角。进度本来就是"这张图在传"的说明，交给图片下方这条更自然。
         宽度取 500rpx 与主图框对齐（左边缘与图片左边缘齐平），读起来属于上面那张图。 -->
    <view v-if="uploading" class="cover-progress">
      <view class="cover-progress-track"><view class="cover-progress-fill" :style="{ width: uploadProgress + '%' }" /></view>
      <text class="cover-progress-text">{{ uploadProgress }}%</text>
    </view>
    <view class="body">
      <view class="intro">
        <template v-if="editing">
          <text class="field-label">菜谱名称 · 必填</text>
          <input v-model="draft.name" class="field title-field" maxlength="24" placeholder="给这道菜起个名字" aria-label="菜谱名称" />
          <text class="field-label">菜品分类 <text>选填</text></text>
          <button class="field picker-field" aria-label="选择菜品分类" @tap="openPicker('category')"><image v-if="currentCategoryImage" class="picker-field-art" :src="currentCategoryImage" mode="aspectFit" /><Icon v-else-if="currentCategoryIcon" class="picker-field-icon" :name="currentCategoryIcon" size="36rpx" /><text class="picker-field-value" :class="{ 'is-empty': !currentCategoryName }">{{ currentCategoryName || '还没选分类' }}</text><Icon name="chevron-right" :size="15" /></button>
          <text class="field-label">辣度 <text>选填</text></text>
          <button class="field picker-field" aria-label="选择辣度" @tap="openPicker('spicy')"><image class="picker-field-art" :src="currentSpicy.image" mode="aspectFit" /><text class="picker-field-value">{{ currentSpicy.label }}</text><Icon name="chevron-right" :size="15" /></button>
          <!-- 菜谱描述：对应云端的 dishes.description（本来就有这个字段，此前只有管理端能写）。
               它是菜谱列表页**卡片副行**的来源（note 为空时回退它），所以限 40 字 ——
               再长在卡片上也会被省略号截掉，不如让用户在写的时候就看得见长度。
               字段本身与 draft.subtitle 同源：读回、保存、dirty 比较三处早已接通，这里只补入口。 -->
          <text class="field-label">菜谱描述 <text>选填</text></text>
          <input v-model="draft.subtitle" class="field" maxlength="40" placeholder="一句话说说它，比如：酸酸甜甜，拌饭刚刚好" aria-label="菜谱描述" />
        </template>
        <template v-else>
          <text class="title">{{ shown.name }}</text>
          <view v-if="shown.subtitle" class="note-row">
            <view class="recipe-note">
              <text class="recipe-note-text">{{ shown.subtitle }}</text>
            </view>
          </view>
        </template>
        <view v-if="!editing && (currentCategoryName || spicyCount || !cloudDishId)" class="meta"><view v-if="currentCategoryName" class="category-pill"><view class="leaf" />{{ currentCategoryName }}</view><text v-if="currentCategoryName && spicyCount" class="meta-dot">·</text><view v-if="spicyCount" class="spicy"><Icon v-for="n in spicyCount" :key="n" name="chili" size="28rpx" :stroke-width="2.4" /></view><text v-if="!cloudDishId" class="demo-label">本机体验菜谱</text></view>
      </view>
      <view v-for="(section, index) in sections" :key="section.key" class="material-section">
        <view class="section-head"><text class="number" :class="section.key">{{ index + 1 }}</text><text class="section-title">{{ section.title }}</text></view>
        <!-- 一个配料都没有时，整条卡片行都不渲染。
             空的 scroll-view 并不是"零高度"：里面那个 inline-flex 的 .material-row 自带 12+6rpx 内边距，
             还会生成一个按父级字号算的行盒（约 33rpx），合计撑出 30~40rpx 的**看不见的空白**。
             叠上区标题的 20rpx 与下方按钮的 26rpx，就出现默认状态下那段"空得莫名其妙"的大间距
             （实测约 70rpx，而步骤区只有 46rpx）。去掉之后三个区的间距终于一致。 -->
        <scroll-view v-if="shown[section.key].length" scroll-x class="material-scroll" :show-scrollbar="false">
          <!-- 这一行**只装已配置的配料**：添加入口不混在队伍里，而是落到它下方的整行虚线按钮（.add-row）——
               配料再多也不会把入口挤到看不见的地方，三个区的添加入口形态也就此统一。 -->
          <view class="material-row">
            <view v-for="item in shown[section.key]" :key="item.id" class="material">
              <button v-if="editing" class="remove" :aria-label="'移除' + lookup(item.id).name" @tap="removeMaterial(section.key, item.id)"><Icon name="minus" :size="13" /></button>
              <view class="material-art"><image :src="lookup(item.id).image" mode="aspectFit" /></view>
              <text class="material-name">{{ lookup(item.id).name }}</text>
            </view>
          </view>
        </scroll-view>
        <!-- 已配置的配料下面、独占一行的添加入口（与步骤区「添加步骤」同形） -->
        <button v-if="editing" class="add-row" :aria-label="'添加' + section.title" @tap="openPicker(section.key)"><Icon name="plus" :size="19" />添加{{ section.title }}</button>
        <!-- 编辑态不再出提示句：入口按钮本身就把话说完了，多一行字反而占版面 -->
        <text v-if="!editing && !shown[section.key].length" class="empty">暂未记录{{ section.title }}</text>
      </view>
      <view class="section-head steps-heading"><text class="number coral">3</text><text class="section-title">一起慢慢做</text></view>
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
      <!-- 编辑态不再出提示句（原来是「还没有步骤，点下面的「增加步骤」开始写」）：
           紧挨着的「添加步骤」按钮本身就把话说完了，多一行字只是占版面 -->
      <text v-if="!editing && !shown.steps.length" class="empty">这道菜还没有记录步骤</text>
      <button v-if="editing" class="add-row" :disabled="draft.steps.length >= 30" @tap="addStep"><Icon name="plus" :size="19" />{{ draft.steps.length >= 30 ? '最多 30 个步骤' : '添加步骤' }}</button>
      <view v-else class="end-note"><Icon name="food" :size="16" /><text>认真做饭的人，也要好好吃饭呀。</text></view>
    </view>
    <view v-if="canEdit" class="footer">
      <template v-if="editing"><button class="cancel" @tap="cancelEditing">取消</button><button class="primary save" :disabled="saving" @tap="save"><Icon name="check" :size="18" />{{ saving ? '正在保存…' : (creating ? '添加菜谱' : '保存菜谱') }}</button></template>
      <template v-else><button class="ghost" @tap="startEditing"><Icon name="edit" :size="18" />编辑菜谱</button><button class="primary grow"><Icon name="upload" :size="18" />发布菜品</button></template>
    </view>
    <view v-if="picker && editing && canEdit" class="picker-layer">
      <view class="mask" @tap="picker = ''" @touchmove.stop.prevent />
      <view class="sheet"><view class="handle" /><view class="picker-heading"><view><text class="section-title">{{ pickerKind.title }}</text><text class="subtitle">{{ pickerKind.subtitle }}</text></view></view>
        <view v-if="pickerKind.searchable" class="picker-search" :class="{ 'is-focused': pickerFocused }"><Icon name="search" :size="16" :stroke-width="2.2" /><input v-model="pickerKeyword" class="picker-search-input" :placeholder="'搜一搜' + pickerKind.noun" :placeholder-style="PLACEHOLDER_STYLE" :maxlength="20" confirm-type="search" :aria-label="'搜索' + pickerKind.noun" @focus="pickerFocused = true" @blur="pickerFocused = false" /><button v-if="pickerKeyword" class="picker-search-clear" aria-label="清空搜索" @tap="pickerKeyword = ''"><Icon name="close" :size="13" /></button></view>
        <scroll-view scroll-y class="picker-scroll" :style="{ height: pickerListHeight }"><view v-if="!pickerOptions.length" class="picker-blank"><template v-if="pickerKind.searchable && pickerKeyword.trim()"><text>没有找到「{{ pickerKeyword.trim() }}」</text><text>换个词试试</text></template><template v-else><text>{{ pickerKind.emptyTitle }}</text><text>{{ pickerKind.emptyHint }}</text></template></view><view class="picker-grid"><button v-for="(item, index) in pickerOptions" :key="item.id + '-' + pickerKeyword" class="picker-item" :style="{ animationDelay: Math.min(index, 6) * 20 + 'ms' }" :class="{ selected: selection.includes(item.id) }" :aria-label="'选择' + item.name" :aria-pressed="selection.includes(item.id)" @tap="toggleSelection(item.id)"><image v-if="item.image" :src="item.image" mode="aspectFit" /><view v-else-if="item.icon" class="picker-art-box"><Icon :name="item.icon" size="88rpx" /></view><text>{{ item.name }}</text><view class="selection-dot"><Icon v-if="selection.includes(item.id)" name="check" :size="12" /></view></button></view></scroll-view>
        <button class="primary confirm" @tap="confirmPicker">{{ pickerConfirmText }}</button>
      </view>
    </view>
    <fo-dialog :visible="discardDialog" title="收起这次修改？" subtitle="未保存的内容会丢失，原来的菜谱仍会保留。" cancel-text="继续编辑" confirm-text="放弃修改" @close="discardDialog = false" @confirm="discard" />
    <!-- 封面裁剪器：与管理页同一个组件，导出尺寸对齐主图框所需物理像素 -->
    <image-cropper :visible="cropperVisible" :image-src="cropperSrc" :ratio="1" :output-size="HERO_ART_WIDTH" @confirm="onCropConfirm" @cancel="onCropCancel" />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useCoverUpload } from '@/composables/useCoverUpload.js'
import { useUserStore } from '@/store/user.js'
import { pantry, freshRecipe, blankRecipe, cloneRecipe, validateRecipe } from '@/mock/recipe-editor.js'
import { SPICY_OPTIONS, SPICY_LEVELS } from '@/utils/spicy.js'
import { categoryArt } from '@/utils/category-art.js'
import { imgUrl } from '@/utils/image.js'
const STORAGE_KEY = 'fo_recipe_editor_demo_v2'
const userStore = useUserStore()
const canEdit = computed(() => userStore.isCook)
const { statusBarHeight, menuButton, windowWidth } = useSafeArea()
/**
 * 返回按钮的纵向位置（.nav 的 paddingTop）
 *
 * 与微信胶囊**垂直居中对齐** —— 小程序自定义导航栏的标准位置。原来是 `menuButton.bottom + 8`，
 * 即把按钮放在胶囊**下方**；主图放大后，按钮就悬在盘子左侧半空、看着没有归属。
 *
 * 页面是自定义导航（内容区从屏幕顶起算），故直接用胶囊的 top/height 即可，无需再减状态栏高度。
 * 按钮高 72rpx 必须按屏宽换算成 px —— rpx 随屏宽自适应，硬编码 36px 在 430pt 屏上会偏约 4px。
 * 兜底：拿不到胶囊信息时（非微信端）退回状态栏下方 10px。
 */
const navTop = computed(() => {
  const btn = menuButton.value
  if (btn?.top != null && btn.height) {
    const btnPx = (72 / 750) * windowWidth.value
    return Math.round(btn.top + (btn.height - btnPx) / 2)
  }
  return statusBarHeight.value + 10
})
const saved = ref(freshRecipe()), draft = ref(null), editing = ref(false), saving = ref(false), attempted = ref(false)
const shown = computed(() => editing.value ? draft.value : saved.value)
const dirty = computed(() => editing.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value))

/* === 菜品封面 === */
// 静态兜底图：云端还没有封面时，浏览态拿它当演示（与「本机体验菜谱」那套本地数据是一组）
const FALLBACK_DISH_ART = '/static/images/recipes/dishes/garlic-bok-choy-v1.png'
/**
 * 封面图输出宽度
 *
 * 主图框 500rpx，最大机型（430pt 屏、DPR 3）约需 860 物理像素，取 960 留一点余量；
 * 同一个值也作为裁剪器的导出尺寸（见模板里 image-cropper 的 output-size）——
 * 落库的原图就是 960，页面再经 imgUrl 按需取尺寸，不会出现「先压缩再放大」。
 */
const HERO_ART_WIDTH = 960
const heroReady = ref(false), heroFailed = ref(false)
/** 当前要显示的封面：统一走 imgUrl（与菜谱列表页卡片同一套口径：OSS 缩略图 + WebP） */
const heroSrc = computed(() => {
  if (heroFailed.value) return ''
  const raw = (shown.value && shown.value.image) || ''
  return raw ? imgUrl(raw, { w: HERO_ART_WIDTH }) : ''
})
// 封面换了就让淡入重来一次（is-loaded 还停在上一张的状态），同时清掉上一次的失败标记。
// 依赖的是**存的值**而不是 heroSrc —— 后者受 heroFailed 影响，互相依赖会反复重试坏链接。
watch(() => (shown.value && shown.value.image) || '', () => { heroReady.value = false; heroFailed.value = false })
// 链接不可用（历史上存过不可访问的地址）时不显示破图：退回静态兜底 / 编辑态的添加占位
const onHeroError = () => { heroFailed.value = true }
// 淡入的触发点。写成函数而不是在模板里直接赋值：模板里对 ref 赋值要依赖编译器的引用处理，
// 万一没生效，图片会停在 opacity:0（看不见）——这种错很难从代码上看出来
const onHeroLoaded = () => { heroReady.value = true }
// 封面：选图 → 裁剪 → 上传 → 换链接，与管理页共用一套（composables/useCoverUpload.js）
const {
  uploading, uploadProgress, chooseImage,
  cropperVisible, cropperSrc,
  cancelCrop: onCropCancel, confirmCrop: onCropConfirm
} = useCoverUpload({ onUploaded: url => { if (draft.value) draft.value.image = url } })

const picker = ref(''), selection = ref([]), discardDialog = ref(false)
// 选择器的搜索：关键词与聚焦态（沿用菜谱页搜索框那套输入框规范）
const PLACEHOLDER_STYLE = 'color: rgba(140, 114, 94, 0.55)'
const pickerKeyword = ref(''), pickerFocused = ref(false)
/**
 * 云端物料（materials 集合）
 *
 * 页面的分组 key 是复数（ingredients / seasonings），而云端 materials.group 是单数
 * （ingredient / seasoning）—— 在这里做一次映射，不把两套命名混进模板。
 */
const CLOUD_GROUP = { ingredients: 'ingredient', seasonings: 'seasoning' }

// 配料在两个方向上换名：页面内部统一用 { id, quantity }，云端存 { materialId, quantity }。
// 只在读、写云端的两处调用，模板与编辑器一律用页面内部的写法。
const materialFromCloud = item => ({ id: item.materialId, quantity: item.quantity || '' })
const materialToCloud = item => ({ materialId: item.id, quantity: item.quantity })

// 步骤只做单向映射：云端存 { title, description, tip }，**不存 id** —— id 是前端渲染用的标识
// （v-for 的 key、pageScrollTo 的锚点），不属于业务数据，读取时按位置生成、会话内保持稳定。
// 步骤顺序即数组顺序，所以写回云端时不需要任何转换。
const STEPS_STAMP = Date.now()
const stepFromCloud = (step, index) => ({
  id: 's' + STEPS_STAMP + '-' + index,
  title: step.title || '',
  description: step.description || '',
  tip: step.tip || ''
})

/**
 * 菜品分类（categories 集合里 type=food 的那些）
 *
 * 分类是**预置**的：不提供增删改，只让用户给菜品选一个，所以这里只读不写。
 * 与菜谱列表页的分类筛选共用同一份数据 —— 在详情页选好分类，列表页的筛选栏就会跟着有它。
 */
const categories = ref([])

/**
 * 分类选项
 *
 * 图标与**菜谱列表页顶部的分类 tab 是同一批素材**（utils/category-art.js）——
 * 两处曾各存一份映射（列表页用彩色 SVG 素材、这里用 Icon.vue 的线性图标名），
 * 于是同一批分类在两个页面长得不一样（一个彩色插画、一个随文字变单色），
 * 改一处另一处不会跟着动。现在只有一份，换素材只改 util。
 *
 * 优先级：云端 `categories.image`（后台配了图就用它）> 内置素材 > 内置餐具图标兜底。
 * 兜底那一档不能省：素材命中不了时若 image 与 icon 都为空，模板里的两个分支都不渲染，
 * `.picker-art-box` 提供的 110rpx 占位会一起消失 —— 那个格子会比同排另两个矮一截、整行错位。
 */
const FALLBACK_CATEGORY_ICON = 'food'
const categoryOptions = computed(() => categories.value.map(c => {
  const art = c.image || categoryArt(c.name)
  return { id: c.id, name: c.name, image: art, icon: art ? '' : FALLBACK_CATEGORY_ICON }
}))

// 辣度档位（SPICY_OPTIONS / SPICY_LEVELS）来自 utils/spicy.js —— 与列表页共用一份定义。
// 浏览态用**辣椒图标的数量**表达 —— none 不显示、mild 1 根、medium 2 根、hot 3 根
// （餐饮品牌通用的表达法，也比文字更省横向空间）；编辑态在抽屉里用图标 + 文字选，
// 与「食材 / 调料」同一个抽屉模式。
// 档位高低即数组顺序，所以浏览态直接用 SPICY_LEVELS.indexOf 取根数，不需要额外映射表。

/** 当前菜品要显示几根辣椒：0 = 不辣（完全不显示），1/2/3 = 微辣 / 中辣 / 特辣 */
const spicyCount = computed(() => {
  // 未设置、空值、非法值一律按「不辣」处理 —— indexOf 返回 -1 时被 Math.max 收到 0
  return Math.max(SPICY_LEVELS.indexOf(shown.value && shown.value.spicy), 0)
})

/**
 * 当前菜品的分类（编辑态取 draft、浏览态取 saved）
 *
 * 从分类列表里查、而不把分类名一起塞进 saved —— 否则 draft 里没有这个字段，
 * dirty 比较（JSON.stringify 全等）会永远为真、导致每次进编辑态都算「有改动」。
 */
const currentCategory = computed(() => categoryOptions.value.find(o => o.id === (shown.value && shown.value.categoryId)) || null)
const currentCategoryName = computed(() => (currentCategory.value || {}).name || '')
const currentCategoryImage = computed(() => (currentCategory.value || {}).image || '')
// 一个都没选时也留一个前导图标（餐具）占位：否则「还没选分类」的起点会比下面
// 辣度行的文字左移一格，同一组表单的左边缘读起来是歪的。
const currentCategoryIcon = computed(() => {
  const item = currentCategory.value || {}
  return item.icon || (item.image ? '' : FALLBACK_CATEGORY_ICON)
})

/** 当前辣度档位（未设置 / 脏值一律按「不辣」处理，与浏览态的辣椒根数同一套规则） */
const currentSpicy = computed(() => SPICY_OPTIONS.find(o => o.value === (shown.value && shown.value.spicy)) || SPICY_OPTIONS[0])
const cloudMaterials = ref([])
const cloudMaterialMap = computed(() => {
  const map = {}
  for (const m of cloudMaterials.value) map[m._id] = m
  return map
})

const sections = [{ key: 'ingredients', title: '食材' }, { key: 'seasonings', title: '调料' }]

/**
 * 按 id 取物料的名称与图片：**云端优先、本地兜底**
 *
 * 已入 materials 的物料（当前是调料）显示云端的真实名称与图片；
 * 尚未入库的（当前是食材）回退到内置 pantry —— 页面不会因此出现空白格。
 * 统一返回 { name, image, quantity }，调用方不必关心数据来自哪一侧。
 * quantity 恒为空串：materials 已移除「默认用量」字段，新增物料不再预填用量，
 * 仅在 confirmPicker 里作为 draft 项的初始值占位。
 */
const lookup = id => {
  const cloud = cloudMaterialMap.value[id]
  if (cloud) return { name: cloud.name, image: cloud.image, quantity: '' }
  return pantry.find(item => item.id === id) || { name: '食材', image: '', quantity: '' }
}

/**
 * 选择抽屉的四种用途
 *
 * 「食材 / 调料」是多选（一道菜可以有很多配料）且带搜索；「分类 / 辣度」是单选、
 * 选项少而固定，不需要搜索框 —— 这些差异全部收敛到这张表里，模板只读它，
 * 不再散落一堆 `picker === 'ingredients' ? … : …` 的三元判断。
 */
const PICKER_KINDS = {
  ingredients: {
    noun: '食材', title: '挑一点食材', subtitle: '厨房的小伙伴，都在这里',
    searchable: true, multiple: true,
    emptyTitle: '这里还没有可选的食材',
    emptyHint: '请先在云端的 materials 集合里添加，group 填 ingredient'
  },
  seasonings: {
    noun: '调料', title: '挑一点调料', subtitle: '好味道的秘密，都在这里',
    searchable: true, multiple: true,
    emptyTitle: '这里还没有可选的调料',
    emptyHint: '请先在云端的 materials 集合里添加，group 填 seasoning'
  },
  category: {
    noun: '分类', title: '挑一个最像它的', subtitle: '先归好类，翻菜谱时更好找',
    searchable: false, multiple: false,
    emptyTitle: '这里还没有可选的分类',
    emptyHint: '请先在云端的 categories 集合里添加，type 填 food'
  },
  spicy: {
    noun: '辣度', title: '这道菜有多辣', subtitle: '挑一档，做的时候照着来',
    searchable: false, multiple: false,
    emptyTitle: '', emptyHint: ''
  }
}
/** 当前抽屉的配置（picker 为空时给个安全默认，避免模板读到 undefined） */
const pickerKind = computed(() => PICKER_KINDS[picker.value] || PICKER_KINDS.ingredients)

/**
 * 当前抽屉的全部选项（**不受搜索词影响**）
 *
 * 单独抽出来是为了给列表定高：高度必须由它决定、而不是由搜索结果决定，
 * 否则搜出 1 项时列表塌成一行、整个抽屉跟着跳一下。
 * 四种用途各有来源：食材/调料读 materials（已停用的过滤掉）、分类读 categories、辣度是本地常量。
 */
const pickerAllOptions = computed(() => {
  if (picker.value === 'category') return categoryOptions.value
  if (picker.value === 'spicy') return SPICY_OPTIONS.map(o => ({ id: o.value, name: o.label, image: o.image }))
  return cloudMaterials.value
    .filter(m => m.group === CLOUD_GROUP[picker.value] && m.isActive !== false)
    .map(m => ({ id: m._id, name: m.name, image: m.image }))
})

/**
 * 抽屉里实际渲染的选项
 *
 * 食材/调料按名称过滤（大小写不敏感、只在当前分组内）；分类与辣度不搜索、原样返回。
 * 选项统一为 { id, name, image } 三字段 —— 模板只消费这三项。
 */
const pickerOptions = computed(() => {
  if (!pickerKind.value.searchable) return pickerAllOptions.value
  const keyword = pickerKeyword.value.trim().toLocaleLowerCase()
  if (!keyword) return pickerAllOptions.value
  return pickerAllOptions.value.filter(o => String(o.name || '').toLocaleLowerCase().includes(keyword))
})

/** 确认按钮文案：多选报数量，单选说「就选这个」（什么都没选就是「先不选」） */
const pickerConfirmText = computed(() => {
  if (!picker.value) return ''
  if (!pickerKind.value.multiple) return selection.value.length ? '就选这个' : '先不选'
  return `就选这些 · ${selection.value.length} 种`
})

// 列表区高度：由当前抽屉的选项总数决定，最多三行 —— 搜索时不随结果的增减而变化。
// 数值与样式一一对应：.picker-item 的 height 与 .picker-grid 的 grid-auto-rows = 190rpx、
// .picker-grid 的 gap = 18rpx、上下 padding 合计 12rpx。改动样式需同步改这三个常量。
const PICKER_ROW_RPX = 190
const PICKER_GAP_RPX = 18
const PICKER_GRID_PAD_RPX = 12
const PICKER_COLS = 3
const PICKER_MAX_ROWS = 3
const pickerListHeight = computed(() => {
  const rows = Math.min(Math.max(Math.ceil(pickerAllOptions.value.length / PICKER_COLS), 1), PICKER_MAX_ROWS)
  return rows * PICKER_ROW_RPX + (rows - 1) * PICKER_GAP_RPX + PICKER_GRID_PAD_RPX + 'rpx'
})
let leaveAfterDiscard = false, nextId = 0
/**
 * 已成功加载的云端菜品 ID
 *
 * **只在详情接口真正返回菜品后才赋值** —— 它是「能不能把修改写回云端」的开关。
 * 若只有跳转参数、菜谱却没取到（接口失败 / 已被删除），就保持空串：
 * 此时页面显示的是本地兜底数据，保存只能落在本机，绝不能把演示数据的 id 当成
 * materialId 写进云端。
 */
const cloudDishId = ref('')

/**
 * 加载云端真实数据
 *
 * 1. 取 materials 全量，供 lookup() 与选择器把 materialId 翻译成名称与图片
 * 2. 按路由参数 id 取菜品详情，用云端的 name / description / ingredients / seasonings / steps
 *    覆盖本地那一份 —— 配料与步骤走同一条路，一律以云端为准
 *
 * id 来自菜谱列表页的跳转（pages/recipe 的 openRecipe 会带 ?id=）。
 * 接口不通或菜谱不存在时整段静默降级为本地数据，页面照旧可看，不会白屏。
 */
/**
 * 基础数据一：物料（食材 / 调料）
 *
 * **独立 try**，不与其他请求共用一个 Promise.all —— 见 loadCategories 上方的说明。
 */
const loadMaterials = async () => {
  try {
    const res = await uniCloud.callFunction({ name: 'app-service', data: { module: 'materials-crud', action: 'list' } })
    const result = res.result || {}
    if (result.code === 0) {
      cloudMaterials.value = result.list || []
    } else {
      console.warn('[recipe-detail] 物料加载失败', result.code, result.message)
    }
  } catch (e) {
    console.error('[recipe-detail] 物料请求异常', e)
  }
}

/**
 * 基础数据二：菜品分类（categories 里 type=food 的那些）
 *
 * 两步查询，**都不能省**：
 * 1. 先按 `type: 'food'` 查（正常路径，只取菜品分类）；
 * 2. 结果为空时再不带 type 查一次全量，在页面侧按 `!c.type || c.type === 'food'` 筛 ——
 *    菜谱列表页就是这么做的（它拿的是 dishes-crud/list 顺带返回的分类，同样靠这句兜底），
 *    **两页口径必须一致**，否则会出现「列表页有 6 个分类、编辑页抽屉却是空的」这种裂缝。
 *
 * 为什么两处都要打 warn：原先这里只有一句 `if (code === 0)`，接口异常时**完全静默** ——
 * 2026-09-20 排查「抽屉空」时，就是因为没有任何输出才绕了弯路。
 */
const loadCategories = async () => {
  try {
    const res = await uniCloud.callFunction({ name: 'app-service', data: { module: 'categories-crud', action: 'list', type: 'food' } })
    const result = res.result || {}
    if (result.code !== 0) console.warn('[recipe-detail] 分类(type=food)查询失败', result.code, result.message)
    let list = result.code === 0 ? result.list || [] : []
    if (!list.length) {
      const allRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'categories-crud', action: 'list' } })
      const allResult = allRes.result || {}
      if (allResult.code === 0) {
        list = allResult.list || []
      } else {
        console.warn('[recipe-detail] 分类全量查询也失败', allResult.code, allResult.message)
      }
    }
    categories.value = list
      .filter(c => !c.type || c.type === 'food')
      .map(c => ({ id: c._id, name: c.name, image: c.image || '' }))
    if (!categories.value.length) console.warn('[recipe-detail] 分类结果为空，抽屉会显示空态')
  } catch (e) {
    console.error('[recipe-detail] 分类请求异常', e)
  }
}

const loadCloudRecipe = async id => {
  /**
   * 物料与分类各自独立加载
   *
   * 原先这两件事与菜品详情一起挤在一个 try + Promise.all 里：**任一接口抛错就会 reject
   * 掉整段**，另外两个跟着一起变空，而外层只有一句笼统的 console.error ——
   * 排查时完全看不出是哪个接口挂了（2026-09-20 分类抽屉空，就是在这一点上绕了弯路）。
   * 现在拆开：一个挂了不影响另一个，失败也能具体到接口。
   */
  await Promise.all([loadMaterials(), loadCategories()])

  if (!id) return
  try {
    const dishRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'dishes-crud', action: 'detail', _id: id } })
    const dishResult = dishRes.result || {}
    if (dishResult.code !== 0 || !dishResult.dish) return
    const dish = dishResult.dish

    const pick = list => (Array.isArray(list) ? list : []).filter(item => item && item.materialId).map(materialFromCloud)
    saved.value = {
      ...saved.value,
      name: dish.name || saved.value.name,
      // description 为空串代表「用户清空了简介」，不能用 || 退回本地那份
      subtitle: typeof dish.description === 'string' ? dish.description : saved.value.subtitle,
      // 封面同一规则：空串是「这道菜还没有封面」，不能退回本地那份
      image: typeof dish.image === 'string' ? dish.image : saved.value.image,
      // 分类与辣度：云端是旧数据、没有这两个字段时就落回本地那份，
      // 不要在界面上把「本来就没有」显示成「被清空了」
      categoryId: typeof dish.categoryId === 'string' ? dish.categoryId : saved.value.categoryId,
      spicy: SPICY_LEVELS.includes(dish.spicy) ? dish.spicy : saved.value.spicy,
      ingredients: pick(dish.ingredients),
      seasonings: pick(dish.seasonings),
      // 步骤同样以云端为准。云端还没有这个字段时（旧数据、尚未录入步骤的菜谱）落回空数组，
      // 页面显示「还没有记录步骤」，而不是继续展示本地演示数据里的那三步
      steps: (Array.isArray(dish.steps) ? dish.steps : []).map(stepFromCloud)
    }
    cloudDishId.value = id
  } catch (e) {
    console.error('[recipe-detail] 加载云端菜谱失败', e)
  }
}

/**
 * 新建态（路由带 `mode=create`，来自菜谱列表页的「加一道菜」）
 *
 * 与「编辑既有菜谱」共用同一份表单与校验，只有两处不同：
 * 1. 起点数据 —— 空骨架，既不取演示数据也不取本地缓存（缓存里是上一次编辑的残留）；
 * 2. 保存动作 —— 走 dishes-crud / create 而不是 update。
 * 创建成功后会记下返回的 _id 并把本态关掉：这一页随即变成「编辑既有菜谱」，
 * 用户接着改再保存走的就是 update，不会重复创建。
 */
const creating = ref(false)

onLoad(async options => {
  const route = options || {}
  // 新建：直接从空骨架进编辑态，跳过后面的本地缓存恢复与菜品详情请求
  // （物料与分类仍要拉 —— 选配料、选分类都得有它们；不传 id 时函数内部会跳过详情）
  if (route.mode === 'create') {
    creating.value = true
    saved.value = blankRecipe()
    draft.value = cloneRecipe(saved.value)
    editing.value = true
    attempted.value = false
    await loadCloudRecipe('')
    return
  }
  try {
    const value = uni.getStorageSync(STORAGE_KEY)
    // 只校验结构、不校验 id 归属：配料已改用云端的 materialId，
    // 旧写法要求 id 必须存在于本地 pantry，会让云端数据一律校验失败、退回演示数据
    if (value?.version === 1 && typeof value.name === 'string' && typeof value.subtitle === 'string'
      && ['ingredients', 'seasonings'].every(group => Array.isArray(value[group]) && value[group].every(item => item && typeof item.id === 'string' && typeof item.quantity === 'string'))
      && Array.isArray(value.steps) && value.steps.every(step => typeof step.id === 'string' && ['title', 'description', 'tip'].every(key => typeof step[key] === 'string')) && !validateRecipe(value)) {
      // image 是后加的字段：旧缓存里没有它，**不能因此把整份丢掉**（那份可能只存在本机、
      // 云端还没有），缺就补空串。dirty 是 JSON 全量比较，两侧结构一致才不会一进编辑态就误判为有改动
      saved.value = { ...cloneRecipe(value), image: typeof value.image === 'string' ? value.image : '' }
    }
  } catch { /* Corrupted or unavailable local storage falls back to the demo. */ }

  // 云端数据放在最后覆盖：配料以云端为准，步骤等云端没有的字段仍沿用本地那份
  await loadCloudRecipe((options && options.id) || '')
})
const exitEditing = () => { editing.value = false; draft.value = null; picker.value = ''; attempted.value = false }
watch(canEdit, allowed => { if (!allowed) { exitEditing(); discardDialog.value = false } })
const startEditing = () => { if (!canEdit.value) return; draft.value = cloneRecipe(saved.value); attempted.value = false; editing.value = true }
const back = () => getCurrentPages().length > 1 ? uni.navigateBack() : uni.switchTab({ url: '/pages/recipe/recipe' })
const cancelEditing = () => { leaveAfterDiscard = false; if (dirty.value) discardDialog.value = true; else exitEditing() }
const requestBack = () => { if (picker.value) { picker.value = ''; return } if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true } else { exitEditing(); back() } }
const discard = () => { discardDialog.value = false; exitEditing(); if (leaveAfterDiscard) back() }
onBackPress(() => { if (picker.value) { picker.value = ''; return true } if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true; return true } return false })
const openPicker = kind => {
  if (!editing.value || !canEdit.value || !PICKER_KINDS[kind]) return
  // 打开时把当前值带进去 —— 单选带一个、多选带上已有的全部
  if (kind === 'category') selection.value = draft.value.categoryId ? [draft.value.categoryId] : []
  else if (kind === 'spicy') selection.value = [SPICY_LEVELS.includes(draft.value.spicy) ? draft.value.spicy : 'none']
  else selection.value = draft.value[kind].map(item => item.id)
  // 关键词清在打开时而不是关闭时：四条关闭路径（点遮罩、返回键、确认、取消）就不必各自清理
  pickerKeyword.value = ''
  picker.value = kind
}
const toggleSelection = id => {
  // 多选：点一下加/减；单选：点已选中的即取消（分类允许不选，辣度取消则按「不辣」处理）
  if (pickerKind.value.multiple) selection.value = selection.value.includes(id) ? selection.value.filter(value => value !== id) : [...selection.value, id]
  else selection.value = selection.value.includes(id) ? [] : [id]
}
const confirmPicker = () => {
  if (!canEdit.value || !editing.value || !picker.value) return
  const kind = picker.value
  if (kind === 'category') {
    draft.value.categoryId = selection.value[0] || ''
  } else if (kind === 'spicy') {
    draft.value.spicy = selection.value[0] || 'none'
  } else {
    draft.value[kind] = selection.value.map(id => draft.value[kind].find(item => item.id === id) || { id, quantity: lookup(id).quantity })
  }
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
const save = async () => {
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
    value.name = value.name.trim(); value.subtitle = String(value.subtitle || '').trim()
    for (const group of ['ingredients', 'seasonings']) value[group].forEach(item => { item.quantity = item.quantity.trim() })
    value.steps.forEach(step => { for (const key of ['title', 'description', 'tip']) step[key] = step[key].trim() })

    // 与菜品 CRUD 对齐的字段。create 与 update 共用同一份 —— 两处各写一遍必然会漂移，
    // 而这几个字段（封面 / 分类 / 辣度 / 配料 / 步骤）的归一化规则是同一套。
    const fields = {
      name: value.name,
      // 封面：编辑器里刚换过的就是可访问链接；没换过则是从云端读回的原值，原样回传
      // （空串是合法值 —— 这道菜没有封面）
      image: value.image || '',
      // 描述：这一页已经能编辑（辣度下方那个输入框）；它同时是菜谱列表页卡片副行的来源
      // （note 为空时回退它），所以为空串也要如实写回去 —— 那是「用户清空了描述」，不是「没改」
      description: value.subtitle,
      // 分类：没选就是空串（合法状态 —— 菜品可以不归类）
      categoryId: value.categoryId || '',
      // 辣度：只有四档之内才写库，脏值落回不辣
      spicy: SPICY_LEVELS.includes(value.spicy) ? value.spicy : 'none',
      ingredients: value.ingredients.map(materialToCloud),
      seasonings: value.seasonings.map(materialToCloud),
      // 步骤显式摘掉前端的 id（渲染标识，不进库）；顺序即数组顺序
      steps: value.steps.map(step => ({ title: step.title, description: step.description, tip: step.tip }))
    }

    // 配料（食材 / 调料）、名称与步骤写回云端 —— 这一步才是编辑真正生效的地方。
    // 云端对 ingredients / seasonings / steps 都是整组替换，所以增、删、改、步骤排序
    // 都由同一次提交表达。
    // 三种情形：新建态 → create；已连上云端菜品 → update；两者都不是（详情接口没取到）→ 只落本机，
    // 避免把本地演示数据的 id 当成云端 _id 写进去。
    let toast = '菜谱已保存'
    if (cloudDishId.value || creating.value) {
      const action = creating.value ? 'create' : 'update'
      // 新增必须带 type（云端校验必填），且菜谱页只产美食菜谱 —— 咖啡归点单页管
      const data = action === 'create'
        ? { module: 'dishes-crud', action, token: userStore.token, type: 'food', ...fields }
        : { module: 'dishes-crud', action, token: userStore.token, _id: cloudDishId.value, ...fields }
      const res = await uniCloud.callFunction({ name: 'app-service', data })
      const result = res.result || {}
      if (result.code !== 0) {
        // 云端失败就不算保存成功：留在编辑态，用户的修改还在，可以直接重试
        uni.showToast({ title: result.message || '保存到云端失败，请重试', icon: 'none' })
        return
      }
      if (action === 'create') {
        // 记下新菜品的 _id 并退出新建态：本页随即变成「编辑既有菜谱」，
        // 用户接着改再保存走的是 update，不会重复创建
        cloudDishId.value = result._id || ''
        creating.value = false
        toast = '菜谱已添加'
      }
    } else {
      toast = '已存到本机（未连接云端菜谱）'
    }

    uni.setStorageSync(STORAGE_KEY, value); saved.value = value; exitEditing()
    uni.showToast({ title: toast, icon: 'none' })
  } catch { uni.showToast({ title: '保存失败，修改仍在，请重试', icon: 'none' }) }
  finally { saving.value = false }
}
</script>

<style lang="scss" scoped>
@import '@/scss/font-recipe.scss';
// position:relative 作为 .nav 绝对定位的参照（参照的是页面内容区顶部，与原来 paddingTop
// 的起算点一致，所以按钮的绝对位置不变，变的只是它不再占据文档流。
.detail-page { position:relative; min-height:100vh; background:$p2-paper; color:$p2-ink; padding-bottom:calc(170rpx + env(safe-area-inset-bottom)); }
button { margin:0; padding:0; background:transparent; color:inherit; font:inherit; line-height:inherit; border-radius:0; &::after { border:0; } transition:transform 110ms $p2-ease; &:active:not([disabled]) { transform:scale(.96); } &[disabled] { opacity:.35; } }
// 返回按钮浮在主图上、不再独占一行：绝对定位后脱离文档流，原来 nav 占的纵向空间
// （paddingTop 99px + 按钮 36px ≈ 135px）全部释放，主图随之上移同量。
// paddingTop 仍由模板内联传入（用于避开状态栏与微信胶囊），只是不再撑高页面。
// z-index:10 保证按钮浮在图片之上；做法与 pages/dish-detail 的 .back-btn 同源。
.nav { position:absolute; top:0; left:0; right:0; z-index:10; display:flex; align-items:center; padding:0 34rpx; font-size:$p2-fs-caption; }
.icon-button { width:72rpx; height:72rpx; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
// 返回按钮：形态对齐项目统一的圆形图标按钮（scss/mixins.scss 的 btn-icon —— 72rpx、
// 图标居中、按下缩放），质感改用二期语言 —— 手绘圆（同 .cover-edit / .primary 的
// 不规则圆角手法）+ 实棕描边 + 硬投影，与页面 .primary 按钮同一套「贴纸」语汇。
// 原来是一个 #d4c4af 浅描边的方角块、且无投影，与页面其它元素不是同一套语言。
.back { border:2rpx solid $p2-line; background:$p2-surface; border-radius:48% 52% 47% 53%; box-shadow:3rpx 4rpx 0 #62473518; }
// 主图区两次放大：图片 395×330 → 480×400 → 500×500rpx。
// 素材是 1:1 透明抠图、主体几乎占满画幅（alpha 包围盒实测 100%×99.3%），aspectFit 按框「短边」铺满，
// 故 1:1 素材放进 500×500 的框即得 500×500 内容 —— 盘子直径 330 → 500rpx（累计 +51%，占屏宽 66.7%）。
// hero 同步加高以容纳放大后的图片。
// **图片背后原来有一块 #ebeed7 的绿色斜贴纸（.hero-wash，525×340rpx / 旋转 −9° / opacity .65），
// 已按主人要求整块去掉**：现在主图是用户上传的真实照片，斜色块只会在照片四角露出来、
// 和照片抢视线；纯纸色底更干净。色块是绝对定位、不参与布局，去掉后图片位置零位移。
// 这里有两种图：用户上传的云端封面（裁剪器按 1:1 导出）与静态兜底素材，共用这同一个 500×500 的框，
// 所以「有没有封面」不会带来任何布局位移 —— 两种图的显示口径一致（aspectFit、透明底抠图）。
// margin-top 64rpx（32px）：导航改绝对定位后主图直接顶到内容区顶部 —— 实测盘子顶端距顶部仅
// 10.4px，与微信胶囊（占屏幕顶下方 47~83px）齐平、观感很挤。下移 28px 后盘子顶端约在屏幕
// y=85px，正好落在胶囊下方；留白仍远小于原来 nav 占的 135px，不会回到「上方大片空白」。
.hero { position:relative; height:520rpx; margin:64rpx 30rpx 6rpx; display:flex; justify-content:center; align-items:center; }
.dish-art { position:relative; width:500rpx; height:500rpx; }
// 云存储封面的淡入（与菜谱列表页卡片同一套手法）：图片要走网络，直接出现会闪一下。
// 静态兜底那张**不加这个类** —— 它是本地素材、没有等待的必要，加了反而可能因 @load 时机而不显示
.cover-img { opacity:0; transition:opacity $p2-dur-base $p2-ease; &.is-loaded { opacity:1; } }
// 编辑态且还没有封面：虚线占位（虚线描边 + 苔绿文字的语汇，同三个区的 .add-row），点了去选图。
// 这里不能沿用静态兜底那张素材 —— 用户会以为那就是这道菜的封面
.cover-blank { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14rpx; width:360rpx; height:320rpx; color:#879172; border:3rpx dashed #c3c9ac; border-radius:36rpx 40rpx 34rpx 38rpx; font-size:$p2-fs-caption; }
// 换封面：浮在主图右下角。质感沿用页面里「可交互控件」那一套 —— 2rpx 实棕描边 + 奶油底 +
// 手绘不规则圆角 + 硬投影（与 .back / .primary 同源）。用 right/bottom 定位而不是 left + transform
// 居中：全局 button:active 的 scale 会覆盖 transform，按钮按下时会横跳
.cover-edit { position:absolute; right:56rpx; bottom:36rpx; z-index:2; display:flex; align-items:center; gap:8rpx; padding:12rpx 22rpx; font-size:$p2-fs-caption; color:$p2-ink; background:$p2-surface; border:2rpx solid $p2-line; border-radius:18rpx 22rpx 16rpx 20rpx; box-shadow:3rpx 4rpx 0 #62473518; }
// 上传进度：贴在封面图正下方的细横条（模板里有说明）。
// 宽 500rpx 与主图框同宽，margin:auto 让它的左右边缘与图片对齐 —— 读起来属于上面那张图，
// 而不是一条横贯页面的系统进度条。hero 的下外边距只有 6rpx，这里再给 16rpx，共 22rpx 落在图下方。
.cover-progress { display:flex; align-items:center; gap:18rpx; width:500rpx; margin:16rpx auto 0; animation: appear 180ms $p2-ease; }
// 轨道：浅绿底，与页面「浅底标签」同一色系（不用灰色 —— 灰条会被读成系统控件）。
// 高度 14rpx：比句号厚一点、比分隔线重一点，看得清进度又不占版面。
// 圆角只写在轨道上，填充靠 overflow:hidden 裁出同样的圆头，不必给填充单独写圆角。
.cover-progress-track { flex:1; height:14rpx; background:#e8edda; border-radius:8rpx 10rpx 7rpx 9rpx; overflow:hidden; }
.cover-progress-fill { height:100%; background:$p2-leaf; }
// 百分比：定宽 + 右对齐，数字从 9% 跳到 10% 时后面的文字不会跟着抖
.cover-progress-text { width:66rpx; flex-shrink:0; text-align:right; font-size:22rpx; color:$p2-ink-soft; }
.body { padding:0 38rpx; }
.intro { padding:5rpx 0 30rpx; }
.title { display:block; font-family:RecipeMaoken,$p2-font-fallback; font-size:$p2-fs-display; line-height:1.35; }
.subtitle { display:block; font-size:$p2-fs-body; color:$p2-ink-soft; margin-top:10rpx; line-height:1.7; }
// 简约小纸条：宽度随文字收拢，淡黄纸面与不规则小圆角延续手绘风格。
.note-row { display:flex; margin-top:14rpx; }
.recipe-note {
  box-sizing:border-box;
  min-width:0;
  max-width:100%;
  padding:10rpx 18rpx;
  background:#fff0bd;
  border-radius:4rpx 7rpx 5rpx 3rpx;
  box-shadow:0 2rpx 0 #c6a96630;
}
.recipe-note-text {
  display:block;
  // 系统字体：便签里装的是**用户自由输入**的一段话，而两套手写体都是"子集化内嵌"的
  // （RecipeMaoken 405 字 / MenuHand 59 字），遇到没收录的字会静默回退 ——
  // 一句话里半个手写、半个系统，比整句都用系统字体更碎。
  // 手写体只适合用在**字表可枚举**的地方（菜名、固定文案）。
  font-family:$p2-font-fallback;
  font-size:25rpx;
  line-height:1.5;
  color:$p2-ink;
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.meta { display:flex; align-items:center; gap:12rpx; font-size:21rpx; color:$p2-ink-soft; margin-top:18rpx; }
.leaf { width:12rpx; height:18rpx; border-radius:70% 20%; background:$p2-leaf; transform:rotate(30deg); }
// 分类徽标：形制对齐页面里已有的「浅底小标签」—— 本页的 ①②③ 序号方块、列表页的卡片角标，
// 都是**浅绿底 + 无描边 + 手绘圆角**。
// 刻意不用描边：全页带 2rpx 实棕描边的都是**可交互控件**（.back / .primary / .ghost /
// .picker-search），分类是不可点的元信息，套上"控件级"的边框会让层级错乱、观感像贴上去的。
// 底色取 $p2-leaf-soft，与紧邻下方的序号方块同色，视觉上能连成一套。
.category-pill { display:inline-flex; align-items:center; gap:8rpx; padding:6rpx 15rpx 6rpx 12rpx; border-radius:12rpx 15rpx 11rpx 14rpx; background:$p2-leaf-soft; color:$p2-ink; font-size:20rpx; }
.meta-dot { color:#bdaa94; }
// 辣度：用辣椒的根数表达档位（不辣时整块都不渲染）。取 $p2-coral —— 既是「辣」的自然语义，
// 也是页面既有的强调色；gap 收窄到 3rpx，让多根辣椒读起来是一组而不是散开的几个图标。
.spicy { display:inline-flex; align-items:center; gap:3rpx; color:$p2-coral; }
.demo-label { margin-left:auto; font-size:18rpx; }
// 分类 / 辣度的编辑入口：与名称输入框同形的**整行控件**，点它开抽屉去挑。
// 形制直接落在 .field 上（描边 + 手绘圆角 + 奶油底），本类只负责内容的两端对齐 ——
// 这样两行选择器与上方的名称输入框读起来是同一组表单。
.picker-field { display:flex; align-items:center; gap:14rpx; width:100%; text-align:left; }
.picker-field-art { width:44rpx; height:44rpx; flex-shrink:0; }
// 图标走 Icon.vue（SVG mask + 继承 currentColor），颜色跟着控件的文字色走，不另设。
// 外面套一个和 .picker-field-art **等宽等高**的盒子（44rpx）：分类行是「素材 or 图标兜底」、
// 辣度行是素材，若两条前导图形宽度不同，下面一行的文字会横向错开几个像素。
.picker-field-icon { display:flex; align-items:center; justify-content:center; width:44rpx; height:44rpx; flex-shrink:0; }
.picker-field-value { flex:1; min-width:0; color:$p2-ink; }
.picker-field-value.is-empty { color:$p2-ink-soft; }
.material-section { padding:24rpx 0 26rpx; border-top:2rpx dashed #e1d6c3; }
.section-head { display:flex; align-items:center; gap:13rpx; margin-bottom:20rpx; }
.number { display:flex; justify-content:center; align-items:center; width:38rpx; height:40rpx; font-size:21rpx; background:$p2-leaf-soft; border-radius:10rpx 13rpx 8rpx 12rpx; transform:rotate(-7deg); }
.seasonings { background:$p2-butter-soft; }.coral { background:$p2-coral-soft; }
.section-title { font-size:$p2-fs-title; font-weight:600; }
// 横向滚动：scroll-view 内部的列表行必须用 inline-flex —— 容器宽度由内容决定，内容一多
// 就必然溢出容器、必然产生可滚动区域。块级 flex 的宽度恒等于父容器宽（内容再多它也不变宽），
// 其子项的溢出行不行要依赖基础库对 scroll-width 的实现，不可靠：官方文档横向滚动只给了
// 「scroll-x + enable-flex」与「white-space:nowrap + inline-block」两种写法，都没有块级 flex。
// 不加 white-space:nowrap：它会连带禁用食材名的自动换行，长名字会横溢到相邻卡片上。
// vertical-align:top 用于消除 inline 元素固有的基线间隙。
.material-scroll { width:100%; }.material-row { display:inline-flex; vertical-align:top; gap:19rpx; padding:12rpx 0 6rpx; }
.material { width:140rpx; flex-shrink:0; text-align:center; position:relative; }
// 图标不衬底色：去掉原来的浅色圆片（background:#f2efde + 不规则圆角），素材直接落在纸色底上。
// 尺寸与下间距保持不变，标题行不会位移。
.material-art { width:120rpx; height:116rpx; margin:0 auto 8rpx; image { width:100%; height:100%; } }
// 卡片只保留「图标 + 名称」：浏览态与编辑态都不再出现用量。
// 数据结构里的 quantity 字段**保留不动** —— 它与云端 dishes.seasonings 一致、随接口读入，
// 将来要恢复用量展示或编辑时数据还在，不必迁移。
.material-name { display:block; font-size:$p2-fs-body; }
.remove { position:absolute; top:-8rpx; right:2rpx; width:48rpx; height:48rpx; display:flex; align-items:center; justify-content:center; background:#fae4d9; border-radius:50%; z-index:1; }
// 三个区共用的「添加」按钮：整行虚线长条（食材 / 调料 / 步骤同形，原 .add-material 那格方形的已撤掉）。
// 在食材与调料区里它落在横向卡片行的**下方、独占一行**，所以卡片行只装已配置的配料 ——
// 配料再多也不会把入口挤到看不见的地方，三个区的添加入口位置与形态就此一致。
// 上间距 26rpx；下间距交给容器（食材/调料区自带 padding-bottom:26rpx，步骤区后面是页脚），
// 原来的 margin-bottom:20rpx 只在编辑态生效，而编辑态它后面没有兄弟元素，去掉不会产生位移。
.add-row { width:100%; display:flex; align-items:center; justify-content:center; gap:12rpx; padding:26rpx 12rpx; border:2rpx dashed #a8b68b; border-radius:20rpx; color:#63784f; font-size:$p2-fs-body; margin:26rpx 0 0; }
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
// 底栏按钮：主次只靠「实底 vs 描边」区分，不引入第二套颜色（同 fo-dialog 的主次按钮规范）。
// 发布菜品 = 主（.primary：浅绿实底 + 实棕描边 + 硬投影）；编辑菜谱 = 次（.ghost：只留实棕描边、
// 无底色无投影）。浏览态两个按钮各 flex:1 等宽平分底栏。
.ghost { display:flex; align-items:center; justify-content:center; gap:12rpx; background:transparent; border:2rpx solid $p2-line; border-radius:19rpx 23rpx 16rpx 20rpx; padding:22rpx 32rpx; min-height:88rpx; font-size:$p2-fs-control; flex:1; }
.primary { display:flex; align-items:center; justify-content:center; gap:12rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:19rpx 23rpx 16rpx 20rpx; padding:22rpx 32rpx; min-height:88rpx; font-size:$p2-fs-control; box-shadow:3rpx 4rpx 0 #62473518; }
.grow { flex:1; }
// 编辑态沿用原布局：取消固定宽 + 保存占满剩余
.cancel { min-width:155rpx; padding:24rpx; font-size:$p2-fs-control; }.save { flex:1; }
.field-label { display:block; font-size:$p2-fs-caption; color:$p2-ink-soft; margin:20rpx 0 12rpx; text { font-size:20rpx; opacity:.8; margin-left:8rpx; } }
.field { height:88rpx; padding:0 22rpx; border:2rpx solid #d5c8b5; border-radius:15rpx 19rpx 14rpx 17rpx; background:$p2-surface; font-size:$p2-fs-body; box-sizing:border-box; }
.title-field { font-size:$p2-fs-title; }
.area { width:100%; min-height:124rpx; padding:18rpx 22rpx; background:$p2-surface; border:2rpx solid #d5c8b5; border-radius:16rpx; font-size:$p2-fs-body; line-height:1.8; box-sizing:border-box; }.tip-area { background:#fffaf0; }
.editor { border:2rpx solid #d9cbb5; border-radius:22rpx 26rpx 19rpx 24rpx; padding:20rpx 22rpx 26rpx; margin:20rpx 0; background:#fcf5e6; animation:appear 180ms $p2-ease; }
.step-actions { display:flex; margin-left:auto; gap:4rpx; }.small-icon { width:58rpx; height:58rpx; display:flex; align-items:center; justify-content:center; }.danger { color:$p2-danger; }.invalid { border-color:$p2-danger; }.error { display:block; color:$p2-danger; font-size:22rpx; margin-top:10rpx; }
.picker-layer { position:fixed; inset:0; z-index:100; }.mask { position:absolute; inset:0; background:#3e301a66; }
.sheet { position:absolute; bottom:0; left:0; right:0; padding:18rpx 34rpx calc(30rpx + env(safe-area-inset-bottom)); background:$p2-paper; border-radius:34rpx 38rpx 0 0; animation:slide-up 240ms $p2-ease; }
.handle { width:65rpx; height:7rpx; background:#d0c4ac; border-radius:6rpx; margin:0 auto 25rpx; }
.picker-heading { display:flex; justify-content:space-between; align-items:center; }
// 选择器最多显示三行：行高与间距都固定，max-height 由算式推出（+12rpx 是 .picker-grid 的上下 padding），
// 超出三行由 scroll-view 内部滚动。原来用 48vh，可见行数随屏幕高度浮动，矮屏上第三行会被切掉一半。
$picker-row: 190rpx;
$picker-gap: 18rpx;
// 搜索框：复用菜谱页 .search-box 的二期输入框规范（奶油底 + 实棕描边 + 聚焦转珊瑚色）
.picker-search { display:flex; align-items:center; gap:14rpx; height:72rpx; padding:0 24rpx; margin-top:26rpx; color:$p2-ink-soft; background:$p2-surface; border:2rpx solid $p2-line; border-radius:20rpx 24rpx 19rpx 23rpx; transition:border-color $p2-dur-fast $p2-ease; &.is-focused { border-color:$p2-coral; } }
.picker-search-input { flex:1; min-width:0; height:64rpx; font-size:$p2-fs-control; color:$p2-ink; }
.picker-search-clear { display:flex; align-items:center; justify-content:center; width:56rpx; height:56rpx; color:$p2-ink-soft; }
.picker-scroll { max-height: $picker-row * 3 + $picker-gap * 2 + 12rpx; margin:22rpx 0 24rpx; }
// 选择器空态：materials 里还没有这个分组的物料时给出原因，避免看起来像功能坏了
.picker-blank { padding:44rpx 6rpx; text-align:center; color:$p2-ink-soft; font-size:$p2-fs-caption; animation: picker-pop $p2-dur-base $p2-ease backwards; text { display:block; line-height:1.9; } }
.picker-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:$picker-row; gap:$picker-gap; padding:6rpx; }
// 入场动效：关键词一变，:key 里带了关键词 → 列表节点整体重建，卡片依次淡入上浮，
// 让「筛选」读起来是内容浮现、而不是硬切；配合固定高度的列表，抽屉在搜索全程不跳动。
// fill-mode 用 backwards 而不是 both/forwards —— 那两个会在动画结束后继续锁定 to 段的
// transform:none，把按下反馈（全局 button:active 的 scale(.96)）压掉；backwards 只在
// 延迟期间维持 from，动画一结束就把属性交还给常规样式。
.picker-item { box-sizing:border-box; height:$picker-row; position:relative; border:2rpx solid #e1d8c5; padding:15rpx; border-radius:20rpx; font-size:$p2-fs-body; background:$p2-surface; animation: picker-pop $p2-dur-base $p2-ease backwards; image { display:block; width:110rpx; height:110rpx; margin:auto; } &.selected { background:#eaf0db; border-color:#8b9e6a; } }
// 内置图标与上面的 <image> 占同样高度（110rpx），让两种选项的格子高度一致 ——
// 图片是 display:block + margin:auto 居中，图标是 inline-block 的组件，套一层 flex 盒子才稳。
.picker-art-box { display:flex; align-items:center; justify-content:center; height:110rpx; }
@keyframes picker-pop { from { opacity:0; transform:translateY(16rpx) scale(.94); } to { opacity:1; transform:none; } }
.selection-dot { position:absolute; top:10rpx; right:10rpx; width:28rpx; height:28rpx; border:2rpx solid #a9b695; border-radius:50%; display:flex; align-items:center; justify-content:center; }.confirm { width:100%; }
@keyframes appear { from { opacity:0; transform:translateY(6rpx); } to { opacity:1; transform:translateY(0); } }
@keyframes slide-up { from { transform:translateY(100%); } to { transform:translateY(0); } }
@media (prefers-reduced-motion:reduce) { button { transition:none; }.editor,.sheet,.picker-item,.picker-blank,.cover-progress { animation:none; } }
</style>
