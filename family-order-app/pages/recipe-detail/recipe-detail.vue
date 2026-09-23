<template>
  <view class="detail-page">
    <view class="nav" :style="{ paddingTop: navTop + 'px' }">
      <button class="icon-button back" aria-label="返回菜谱" @tap="requestBack"><Icon name="arrow-left" :size="20" /></button>
    </view>
    <!-- 封面**必传**（见 mock/recipe-editor.js 的 validateRecipe），所以这里**没有兜底插画**：
         没有封面就不画图，而不是拿一张本地演示图顶上去 —— 那会把「这道菜还没配图」
         这件事盖住，让人以为图是好的。
         链接不可用（历史上存过不可访问地址）时同理，不画，不退兜底。
         框本身留着：`.nav` 是 absolute 定位在页面顶部，没有封面框顶着，标题会钻到返回按钮底下。
         浏览态无封面时框收窄成一条纯占位（.hero-blank），别留 520rpx 的空洞。 -->
    <view class="hero" :class="{ 'hero-blank': !heroSrc && !editing }">
      <image v-if="heroSrc" class="dish-art cover-img" :class="{ 'is-loaded': heroReady }" :src="heroSrc" mode="aspectFit" :webp="true" @load="onHeroLoaded" @error="onHeroError" />
      <button v-else-if="editing" class="cover-blank" aria-label="添加菜品封面" @tap="chooseImage"><Icon name="plus" :size="26" /><text>添加封面</text></button>
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
      <!-- 取不到云端菜谱时的提示（2026-09-21 按主人要求改）
           原先这里会**退回落地的演示菜谱**（「蒜蓉小青菜」+ 别人的三步做法），于是用户点 A 进来
           看到的是 B，而且能进编辑态把演示数据改到本机 —— 比空白更糟：空白是「没有」，
           演示数据是「错的内容」。
           现在：数据一律置空（saved 初值就是 blankRecipe 空骨架），这一块只负责说明情况。
           底栏的编辑 / 发布同时收掉（见 .footer 的 v-if）—— 没有云端数据就无从编辑。
           内层缩进保持原样，只是多包了一层 <template v-else>。 -->
      <view v-if="loadFailed" class="load-failed">
        <view class="failed-art"><Icon name="book-open" :size="40" :stroke-width="1.3" /></view>
        <text class="failed-title">这道菜谱没有找到</text>
        <text class="failed-hint">它可能已经被删掉了，也可能只是网络不太顺。</text>
        <button class="failed-retry" :disabled="retrying" @tap="retryLoad"><Icon name="refresh-cw" :size="16" />{{ retrying ? '正在重试…' : '再试一次' }}</button>
      </view>
      <template v-else>
      <view class="intro">
        <template v-if="editing">
          <text class="field-label">{{ kindText.nameLabel }} · 必填</text>
          <input v-model="draft.name" class="field title-field" maxlength="24" :placeholder="kindText.namePlaceholder" :aria-label="kindText.nameLabel" />
          <!-- 分类：**只有美食有**（2026-09-23 按主人要求收掉咖啡的这一格）。
               咖啡没有分类这个概念 —— 它不是「某类菜」，自己就是一个类型（dishes.type=coffee）。
               与辣度同一处理：整个字段收掉，而不是留一个永远只能提示「还没选分类」的控件。
               ⚠️ 配套两处一起收，否则等于没收干净：
                 ① 本处模板 + 咖啡那一支的 `categoryLabel`（不再需要这个称呼）；
                 ② `loadCategories` 对咖啡直接不发查询 —— `categories` 恒空之后，
                    分类名 / 分类图 / 浏览态那枚分类徽标全部随之消失，
                    历史数据里若带着 `categoryId` 也不会在页面上任何地方冒出来。 -->
          <template v-if="!isCoffee">
            <text class="field-label">{{ kindText.categoryLabel }} <text>选填</text></text>
            <button class="field picker-field" :aria-label="'选择' + kindText.categoryLabel" @tap="openPicker('category')"><image v-if="currentCategoryImage" class="picker-field-art" :src="currentCategoryImage" mode="aspectFit" /><Icon v-else-if="currentCategoryIcon" class="picker-field-icon" :name="currentCategoryIcon" size="36rpx" /><text class="picker-field-value" :class="{ 'is-empty': !currentCategoryName }">{{ currentCategoryName || '还没选分类' }}</text><Icon name="chevron-right" :size="15" /></button>
          </template>
          <!-- 辣度：**只有美食有**（2026-09-22 按主人要求收掉咖啡的这一格）。
               咖啡没有辣度这个概念 —— 点单页的咖啡卡片也不读这个字段，云端 dishes.spicy 对咖啡恒为 none。
               整个字段收掉，而不是留着显示成「不辣」：一个永远只能选「不辣」的选择器，
               比没有这个字段更让人困惑，而且会诱导用户去点它。 -->
          <template v-if="!isCoffee">
            <text class="field-label">辣度 <text>选填</text></text>
            <button class="field picker-field" aria-label="选择辣度" @tap="openPicker('spicy')"><image class="picker-field-art picker-field-spicy" :src="currentSpicy.image" mode="aspectFit" /><text class="picker-field-value">{{ currentSpicy.label }}</text><Icon name="chevron-right" :size="15" /></button>
          </template>
          <!-- 菜谱描述：对应云端的 dishes.description（本来就有这个字段，此前只有管理端能写）。
               它是菜谱列表页**卡片副行**的来源（note 为空时回退它），所以限 40 字 ——
               再长在卡片上也会被省略号截掉，不如让用户在写的时候就看得见长度。
               字段本身与 draft.subtitle 同源：读回、保存、dirty 比较三处早已接通，这里只补入口。 -->
          <text class="field-label">{{ kindText.descLabel }} <text>选填</text></text>
          <input v-model="draft.subtitle" class="field" maxlength="40" placeholder="一句话说说它，比如：酸酸甜甜，拌饭刚刚好" :aria-label="kindText.descLabel" />
        </template>
        <template v-else>
          <text class="title">{{ shown.name }}</text>
          <view v-if="shown.subtitle" class="note-row">
            <view class="recipe-note">
              <text class="recipe-note-text">{{ shown.subtitle }}</text>
            </view>
          </view>
        </template>
        <!-- 元信息行只剩「分类 · 辣度」两种真实存在的值。
             原先末尾还有一个「本机体验菜谱」标签，用来解释「页面上的数据没连上云端」——
             现在没连上云端时整页走上面的失败提示，不存在「有数据、却只是没连上云端」这种中间态，
             所以那个标签一并退休（`!cloudDishId` 这个判断条件也去掉了）。 -->
        <view v-if="!editing && (currentCategoryName || spicyArt)" class="meta"><view v-if="currentCategoryName" class="category-pill"><view class="leaf" />{{ currentCategoryName }}</view><text v-if="currentCategoryName && spicyArt" class="meta-dot">·</text><image v-if="spicyArt" class="spicy" :src="spicyArt" mode="aspectFit" /></view>
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
              <view class="material-art"><image v-if="lookup(item.id).image" :src="materialArt(item.id)" mode="aspectFit" /><view v-else class="material-art-fallback"><Icon name="food" :size="15" /></view></view>
              <text class="material-name">{{ lookup(item.id).name }}</text>
            </view>
          </view>
        </scroll-view>
        <!-- 已配置的配料下面、独占一行的添加入口（与步骤区「添加步骤」同形） -->
        <button v-if="editing" class="add-row" :aria-label="'添加' + section.title" @tap="openPicker(section.key)"><Icon name="plus" :size="19" />添加{{ section.title }}</button>
        <!-- 编辑态不再出提示句：入口按钮本身就把话说完了，多一行字反而占版面 -->
        <text v-if="!editing && !shown[section.key].length" class="empty">暂未记录{{ section.title }}</text>
      </view>
      <!-- 步骤区的序号**必须算出来**（`sections.length + 1`），不能写死 3：
           美食是「① 食材 ② 调料 ③ 步骤」，咖啡只有「① 原料 ② 步骤」——
           写死 3 的话咖啡页会出现「① 原料 ② 一起慢慢做」，序号在视觉上是个坑。 -->
      <view class="section-head steps-heading"><text class="number coral">{{ sections.length + 1 }}</text><text class="section-title">一起慢慢做</text></view>
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
      </template>
    </view>
    <!-- 底栏只在「身份能编辑」且「云端菜谱真拿到了」时出现：取不到菜谱时既没有可编辑的对象、
         也没有可发布的 _id，留着按钮只会点出一串失败提示（原先要点到「发布」才被告知没连上云端） -->
    <view v-if="canEdit && !loadFailed" class="footer">
      <template v-if="editing"><button class="cancel" @tap="cancelEditing">取消</button><button class="primary save" :disabled="saving" @tap="save"><Icon name="check" :size="18" />{{ saving ? '正在保存…' : (creating ? kindText.createLabel : kindText.saveLabel) }}</button></template>
      <template v-else><button class="ghost" @tap="startEditing"><Icon name="edit" :size="18" />{{ kindText.editLabel }}</button><button class="primary grow" :disabled="publishing" @tap="togglePublish"><Icon :name="published ? 'check' : 'upload'" :size="18" />{{ publishing ? '处理中…' : (published ? '取消发布' : kindText.publishLabel) }}</button></template>
    </view>
    <view v-if="picker && editing && canEdit" class="picker-layer">
      <view class="mask" @tap="picker = ''" @touchmove.stop.prevent />
      <view class="sheet"><view class="handle" /><view class="picker-heading"><view><text class="section-title">{{ pickerKind.title }}</text><text class="subtitle">{{ pickerKind.subtitle }}</text></view></view>
        <view v-if="pickerKind.searchable" class="picker-search" :class="{ 'is-focused': pickerFocused }"><Icon name="search" :size="16" :stroke-width="2.2" /><input v-model="pickerKeyword" class="picker-search-input" :placeholder="'搜一搜' + pickerKind.noun" :placeholder-style="PLACEHOLDER_STYLE" :maxlength="20" confirm-type="search" :aria-label="'搜索' + pickerKind.noun" @focus="pickerFocused = true" @blur="pickerFocused = false" /><button v-if="pickerKeyword" class="picker-search-clear" aria-label="清空搜索" @tap="pickerKeyword = ''"><Icon name="close" :size="13" /></button></view>
        <scroll-view scroll-y class="picker-scroll" :style="{ height: pickerListHeight }"><view v-if="!pickerOptions.length" class="picker-blank"><template v-if="pickerKind.searchable && pickerKeyword.trim()"><text>没有找到「{{ pickerKeyword.trim() }}」</text><text>换个词试试</text></template><template v-else><text>{{ pickerKind.emptyTitle }}</text><text>{{ pickerKind.emptyHint }}</text></template></view><view class="picker-grid" :class="'cols-' + pickerCols"><button v-for="(item, index) in pickerOptions" :key="item.id + '-' + pickerKeyword" class="picker-item" :style="{ animationDelay: Math.min(index, 6) * 20 + 'ms' }" :class="{ selected: selection.includes(item.id) }" :aria-label="'选择' + item.name" :aria-pressed="selection.includes(item.id)" @tap="toggleSelection(item.id)"><view v-if="item.image" class="picker-art-box"><image class="picker-art" :class="{ 'is-dim': isStaticDimmed(item) }" :src="item.image" mode="aspectFit" /><image v-if="canSwap(item)" class="picker-art picker-art-moving" :src="item.imageActive" mode="aspectFit" @load="markLoaded(item.id)" @error="markFailed(item.id)" /></view><view v-else-if="item.icon" class="picker-art-box"><Icon :name="item.icon" size="88rpx" /></view><text>{{ item.name }}</text><view class="selection-dot"><Icon v-if="selection.includes(item.id)" name="check" :size="12" /></view></button></view></scroll-view>
        <button class="primary confirm" @tap="confirmPicker">{{ pickerConfirmText }}</button>
      </view>
    </view>
    <fo-dialog :visible="discardDialog" title="收起这次修改？" :subtitle="kindText.discardHint" cancel-text="继续编辑" confirm-text="放弃修改" @close="discardDialog = false" @confirm="discard" />
    <!-- 封面裁剪器：与管理页同一个组件，导出尺寸对齐主图框所需物理像素 -->
    <image-cropper :visible="cropperVisible" :image-src="cropperSrc" :ratio="1" :output-size="HERO_ART_WIDTH" @confirm="onCropConfirm" @cancel="onCropCancel" />
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { onLoad, onBackPress } from '@dcloudio/uni-app'
import { useSafeArea } from '@/composables/useSafeArea.js'
import { useCoverUpload } from '@/composables/useCoverUpload.js'
import { useArtSwap } from '@/composables/useArtSwap.js'
import { useUserStore } from '@/store/user.js'
// 编辑器逻辑。文件名里的 mock 是历史遗留 —— 这一份里的 blankRecipe / cloneRecipe / validateRecipe
// 都是**生产逻辑**，别按名字当演示数据处理。
// 原先它还导出 freshRecipe / pantry（「本机演示菜谱」的数据源），2026-09-21 随
// 「取不到云端菜谱时不再回退演示数据」一起删除 —— 页面现在只有「云端真数据」一种来源。
import { blankRecipe, cloneRecipe, validateRecipe } from '@/mock/recipe-editor.js'
import { SPICY_OPTIONS, SPICY_LEVELS, spicyMark } from '@/utils/spicy.js'
import { categoryArt, categoryArtActive } from '@/utils/category-art.js'
import { imgUrl, IMG_W } from '@/utils/image.js'
const userStore = useUserStore()
const canEdit = computed(() => userStore.isCook)
/**
 * 这一页当前编的是**咖啡**还是**美食**（由路由 `?type=coffee` 决定）
 *
 * 咖啡与菜品共用这一个编辑器 —— 表单、校验、抽屉、封面上传、保存链路全部同源，
 * 只有「几块区怎么摆」和「少数几处称呼」不同：
 *
 *   |          | 美食                          | 咖啡            |
 *   | 区       | ① 食材 ② 调料 ③ 一起慢慢做      | ① 原料 ② 一起慢慢做 |
 *   | 字段     | ingredients + seasonings       | ingredients（即「原料」）|
 *   | 物料分组 | ingredient / seasoning         | coffee          |
 *   | 分类     | 有（categories.type = food）    | **没有**（整格收掉） |
 *   | create   | dishes.type = 'food'           | dishes.type = 'coffee' |
 *
 * **不复制第二个页面**的理由见 pages/recipe/recipe.vue 的 createCoffee 注释（主包体积 + 口径唯一）。
 * ⚠️ 咖啡的「原料」**复用 `ingredients` 这个字段**（不新增字段），但**用自己的物料分组 `coffee`**
 *    （2026-09-23 新增，见 CLOUD_GROUP）：
 *    · 复用字段的理由：两边的结构完全一样（一组「物料 + 用量」），另立 `rawMaterials` 只会让
 *      校验、抽屉、保存映射、云端整组替换全都复制一份；
 *    · 分组必须分开的理由：**分组就是抽屉的候选池**。共用 `ingredient` 时咖啡的「原料」抽屉里
 *      列的是葱、小青菜这些美食食材 —— 内容错但不报错，是这里最难被发现的错法。
 */
const isCoffee = ref(false)
/**
 * 按类型切换的文案
 *
 * 咖啡页写「菜谱名称 / 保存菜谱」都不准确，但这些差异很小、散在模板里就是
 * 一堆三元判断。集中在这张表里，模板只读字段名；将来真出现第三种类型，也只需在这里补一条。
 *
 * ⚠️ 这张表**只装称呼**，不装业务规则：区数、分类有无、写库的 type 都跟着 `isCoffee` 走，
 *    与文案无关（文案改错只是读起来别扭，那几处改错是写错数据）。
 * ⚠️ 咖啡那一支**没有 `categoryLabel`** —— 咖啡没有「分类」这一格（2026-09-23），
 *    模板整块 `v-if="!isCoffee"` 收掉了，这里就不该留一个永远读不到的称呼。
 */
const kindText = computed(() => (isCoffee.value
  ? {
    nameLabel: '咖啡名称', namePlaceholder: '给这杯咖啡起个名字', descLabel: '咖啡描述',
    createLabel: '添加咖啡', saveLabel: '保存咖啡', editLabel: '编辑咖啡', publishLabel: '发布咖啡',
    discardHint: '未保存的内容会丢失，原来的咖啡仍会保留。'
  }
  : {
    nameLabel: '菜谱名称', namePlaceholder: '给这道菜起个名字', categoryLabel: '菜品分类', descLabel: '菜谱描述',
    createLabel: '添加菜谱', saveLabel: '保存菜谱', editLabel: '编辑菜谱', publishLabel: '发布菜品',
    discardHint: '未保存的内容会丢失，原来的菜谱仍会保留。'
  }))
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
/**
 * 浏览态展示的数据
 *
 * 初值是**空骨架**（blankRecipe），不再是演示菜谱 —— 取不到云端数据时页面就该是空的，
 * 由 loadFailed 决定显示「没找到」提示，而不是先摆一份别人的菜谱、等接口回来再换掉
 * （那会出现「蒜蓉小青菜」一闪而过，2026-09-21 改）。
 */
const saved = ref(blankRecipe()), draft = ref(null), editing = ref(false), saving = ref(false), attempted = ref(false)
const shown = computed(() => editing.value ? draft.value : saved.value)
const dirty = computed(() => editing.value && JSON.stringify(draft.value) !== JSON.stringify(saved.value))

/**
 * 云端菜谱是否**没拿到**（路由没带 id / 接口返回非 0 / 菜谱已被删除 / 请求抛错）
 *
 * 四种情况并成一个布尔：站在用户角度都是「这道菜看不了」，拆开只会让界面多几层无用的分支；
 * 真要排查，console 里那几条带接口名的日志足够定位。
 * ⚠️ 它同时是底栏的显示条件 —— 拿不到菜谱时不该还能编辑或发布。
 */
const loadFailed = ref(false)
/** 重试进行中：按钮禁用 + 换文案，防连点 */
const retrying = ref(false)
/** 路由带来的菜品 id：重试要用同一个 id 再请求一次 */
const routeId = ref('')

/* === 菜品封面 === */
/**
 * 封面图输出宽度
 *
 * 主图框 500rpx，最大机型（430pt 屏、DPR 3）约需 860 物理像素，取 960 留一点余量；
 * 同一个值也作为裁剪器的导出尺寸（见模板里 image-cropper 的 output-size）——
 * 落库的原图就是 960，页面再经 imgUrl 按需取尺寸，不会出现「先压缩再放大」。
 *
 * ⚠️ 这里曾经有一张 1.68MB 的本地兜底插画（`dishes/garlic-bok-choy-v1.png`），
 * 2026-09-21 按主人要求**删掉了**：封面改成必传（validateRecipe 拦截），
 * 没有封面就不画图，不留兜底。它是主包里最后一张大图。
 */
/**
 * 图片输出档位**全部取自 utils/image.js 的 IMG_W**，本页不另写一份数：
 * 菜谱列表页会在点开卡片时预取本页的封面（隐藏 `<image>`），
 * 只有两页拼出的 URL 逐字符相同，那次预取才会命中同一份图片缓存。
 * 各档位的像素换算依据见 IMG_W 的注释 —— 改显示尺寸时要回头重算。
 */
const HERO_ART_WIDTH = IMG_W.dishCover
const MATERIAL_ART_WIDTH = IMG_W.materialArt
const PICKER_ART_WIDTH = IMG_W.pickerArt
const FIELD_ART_WIDTH = IMG_W.fieldArt
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
// 链接不可用（历史上存过不可访问的地址）时不显示破图：**什么也不画**（不退兜底插画，
// 见模板里封面块的说明），编辑态下 heroSrc 变空、`.cover-blank` 会自动顶上来当添加入口
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
 * 页面的分区 key 是复数（ingredients / seasonings），而云端 materials.group 是单数
 * （ingredient / seasoning / coffee）—— 在这里做一次映射，不把两套命名混进模板。
 *
 * ⚠️ **必须按类型求值**（2026-09-23 起改成 computed）：美食与咖啡共用 `ingredients` 这个分区 key
 * （咖啡那边只是把标题换成「原料」），但两者要取的是**两池不同的物料**。
 * 写成固定常量的话，咖啡的「原料」抽屉会列出葱、小青菜这些美食食材 ——
 * **不报错、只是内容错**，与 `loadCategories` 里 type 传错是同一类静默错。
 * （咖啡没有调料区，所以它这一支**不给 `seasonings` 键**：万一某条路径把它打开了，
 * 空列表也比列出美食调料更诚实、更容易被发现。）
 */
const CLOUD_GROUP = computed(() => (isCoffee.value
  ? { ingredients: 'coffee' }
  : { ingredients: 'ingredient', seasonings: 'seasoning' }))

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
 * ⚠️ **咖啡恒为空数组**（咖啡没有分类，见 loadCategories 的说明）—— 分类名 / 分类图 /
 *    浏览态的分类徽标全部由它派生，它空着就等于整条分类链路对咖啡都不存在。
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
  // 选中态的动图（2026-09-23 加）：抽屉里被选中的那一格会从静态图切成动图，
  // 与菜谱列表页分类栏、点单页分类栏是同一套行为、同一份映射（utils/category-art.js）。
  // ⚠️ 两条硬约束：
  //   ① **不能过 imgUrl()** —— 它会追加 `format,webp`，把 GIF 动画静默压成一张静态图；
  //      所以这一项是**裸链接**（静态图那一项才需要配输出尺寸）。
  //   ② 云端 `categories.image` 一旦配了图，静态图就是用户自己传的照片；此时**不给选中态** ——
  //      拿内置动图去顶替用户的照片是错的替换（形状、内容都不同），不如两边都不动。
  const artActive = c.image ? '' : categoryArtActive(c.name)
  // 云端分类图也走 imgUrl：它是用户上传的图，原图尺寸远超抽屉里那 110rpx 的格子。
  // 本地素材（categoryArt 返回的 static 路径）会被 imgUrl 原样返回，两种来源共用这一行。
  // 注意 icon 的判断仍用**未处理的** art —— 命不中素材时 art 为空串，才轮到内置图标兜底。
  return { id: c.id, name: c.name, image: imgUrl(art, { w: PICKER_ART_WIDTH }), imageActive: artActive, icon: art ? '' : FALLBACK_CATEGORY_ICON }
}))

// 辣度档位（SPICY_OPTIONS / SPICY_LEVELS）与档位图案（spicyImage / spicyMark）都来自
// utils/spicy.js —— 与菜谱列表页、点单抽屉共用一份定义和一套素材，**本页不要另存映射**
// （2026-09-18 两页各存一份，扩档时「特辣」被吃成「不辣」且页面毫无报错）。
//
// 浏览态画的是**档位图案**（与编辑抽屉里那四格是同一套素材），不再是 Icon.vue 的单色辣椒
// 循环 N 根 —— 同一档辣度在列表、详情、抽屉里必须长得一样。

/**
 * 当前菜品要显示的档位图案
 *
 * 用 spicyMark（不是 spicyImage）：浏览态是「标记」语义，**「不辣」是默认状态、不挂图标**；
 * 未设置与脏值同样得到空串 → 模板一个 v-if 收掉。斜线辣椒只出现在「字段」语义的点单抽屉里。
 *
 * **咖啡恒为空串**（2026-09-22 起）：咖啡不显示辣度，编辑态里那一格也已收掉。
 * 收在这一层而不是只靠编辑态不显示 —— 将来给咖啡补上浏览态入口时，历史脏数据里若带着
 * `spicy: 'hot'`，也不会在页面上冒出一枚辣椒。同一行的分隔点跟着它一起收（模板里依赖它判断）。
 */
const spicyArt = computed(() => (isCoffee.value ? '' : spicyMark(shown.value && shown.value.spicy)))

/**
 * 当前菜品的分类（编辑态取 draft、浏览态取 saved）
 *
 * 从分类列表里查、而不把分类名一起塞进 saved —— 否则 draft 里没有这个字段，
 * dirty 比较（JSON.stringify 全等）会永远为真、导致每次进编辑态都算「有改动」。
 */
const currentCategory = computed(() => categoryOptions.value.find(o => o.id === (shown.value && shown.value.categoryId)) || null)
const currentCategoryName = computed(() => (currentCategory.value || {}).name || '')
// 与选择抽屉里那张是同一来源，但显示得更小（44rpx），所以单独一档尺寸；
// imgUrl('') 返回空串，模板的 v-if 会收掉它（原来的 `|| ''` 兜底并由 v-if 判空，行为一致）
const currentCategoryImage = computed(() => imgUrl((currentCategory.value || {}).image || '', { w: FIELD_ART_WIDTH }))
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

/**
 * 正文里的「物料区」清单
 *
 * 美食三步：食材 + 调料；咖啡两步：只有**原料**（复用 ingredients 这一块，只换标题）。
 * 步骤区不在这张表里（它结构不同：可增删、可排序、带序号），它的序号由 `sections.length + 1` 推出。
 *
 * ⚠️ 咖啡的原料**不能只改标题而把 seasonings 也留着**：那样页面会多出一块永远为空的
 *    「调料」区，而咖啡根本没有调料这个概念 —— 空区不是"零高度"，它会连着标题与
 *    添加按钮一起占掉几十 rpx（见模板里 .material-section 那段注释）。
 */
const sections = computed(() => (isCoffee.value
  ? [{ key: 'ingredients', title: '原料' }]
  : [{ key: 'ingredients', title: '食材' }, { key: 'seasonings', title: '调料' }]))

/**
 * 按 id 取物料的名称与图片
 *
 * 只查云端 materials —— 页面里所有 `item.id` 都是云端的 `materialId`，
 * 而原先那份本地演示物料（pantry）用的是 `greens` / `garlic` 这种本地字符串 id，
 * **两者永远不会匹配**，那条「本地兜底」分支从来就没生效过（2026-09-21 随演示数据一起删除）。
 * 查不到的只剩「物料被物理删除」一种情形（停用不返回不存在：materials-crud/list 不过滤 isActive，
 * 已停用的物料照常返回、所以引用它的菜品仍能正常渲染）。
 * 统一返回 { name, image, quantity }；quantity 恒为空串 —— materials 已移除「默认用量」字段，
 * 它只在 confirmPicker 里作为 draft 项的初始值占位。
 */
const lookup = id => {
  const cloud = cloudMaterialMap.value[id]
  if (cloud) return { name: cloud.name, image: cloud.image, quantity: '' }
  return { name: '食材', image: '', quantity: '' }
}

/**
 * 食材 / 调料卡片里那张小图的地址
 *
 * ⚠️ 这里原先直接把 `lookup(id).image` 丢给 `<image>` —— 那条链路拿的是**原图**：
 * 物料图是用户上传的 PNG，同空间实测原图 1.84MB（1927136B），而卡片只有 100×96rpx。
 * 一屏 10 个配料就是十几 MB —— 这是「图片多、加载慢」最主要的一处。
 * 经 imgUrl 按需输出后同一张图约 12KB（实测 w_160 + WebP = 12428B，**省 99.4%**）。
 *
 * 返回空串时模板的 v-if 会收掉它（与原来一致）。
 */
const materialArt = id => imgUrl(lookup(id).image, { w: MATERIAL_ART_WIDTH })

/**
 * 选择抽屉的四种用途
 *
 * 「食材 / 调料」是多选（一道菜可以有很多配料）且带搜索；「分类 / 辣度」是单选、
 * 选项少而固定，不需要搜索框 —— 这些差异全部收敛到这张表里，模板只读它，
 * 不再散落一堆 `picker === 'ingredients' ? … : …` 的三元判断。
 *
 * 2026-09-22：改成**按类型求值**（computed）—— 称呼要跟着类型走（咖啡那边不叫「食材」叫「原料」）。
 * 2026-09-23 ①：咖啡的「原料」抽屉改用**自己的物料分组 `coffee`**（见 CLOUD_GROUP），
 *    与美食「食材」抽屉**不再是同一条数据链路**了，只是文案结构仍然相同。
 * 2026-09-23 ②：**咖啡没有分类** → 分类抽屉只剩美食会打开，它的空态提示也不必再分类型。
 */
const PICKER_KINDS = computed(() => ({
  ingredients: isCoffee.value
    ? {
      noun: '原料', title: '挑一点原料', subtitle: '这杯咖啡用什么，都在这里',
      searchable: true, multiple: true,
      emptyTitle: '这里还没有可选的原料',
      emptyHint: '请先在云端的 materials 集合里添加，group 填 coffee'
    }
    : {
      noun: '食材', title: '挑一点食材', subtitle: '厨房的小伙伴，都在这里',
      searchable: true, multiple: true,
      emptyTitle: '这里还没有可选的食材',
      emptyHint: '请先在云端的 materials 集合里添加，group 填 ingredient'
    },
  // 咖啡页没有「调料」这一区，这个 kind 不会被打开；保留它是为了这张表结构完整，
  // 万一将来某条路径仍带着 seasonings 进来，抽屉也能正常显示而不是读到 undefined
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
    // 咖啡没有分类（2026-09-23）→ 这个抽屉只可能在美食页被打开，提示语不必再分类型。
    // 留着 coffee 那一支只会让下一个人以为"咖啡还有分类，只是没配"。
    emptyHint: '请先在云端的 categories 集合里添加，type 填 food'
  },
  spicy: {
    noun: '辣度', title: '这道菜有多辣', subtitle: '挑一档，做的时候照着来',
    searchable: false, multiple: false,
    emptyTitle: '', emptyHint: ''
  }
}))
/** 当前抽屉的配置（picker 为空时给个安全默认，避免模板读到 undefined） */
const pickerKind = computed(() => PICKER_KINDS.value[picker.value] || PICKER_KINDS.value.ingredients)

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
    .filter(m => m.group === CLOUD_GROUP.value[picker.value] && m.isActive !== false)
    // 同样走 imgUrl：抽屉格子只有 110rpx，而物料图是用户上传的原图。
    // 辣度那一支不处理 —— 它的 image 是本地 static 素材，imgUrl 会原样返回，没必要绕一圈
    .map(m => ({ id: m._id, name: m.name, image: imgUrl(m.image, { w: PICKER_ART_WIDTH }) }))
})

/**
 * 抽屉里实际渲染的选项
 *
 * 食材/调料按名称过滤（大小写不敏感、只在当前分组内）；分类与辣度不搜索、原样返回。
 * 选项统一为 { id, name, image } 三字段 —— 模板只消费这三项；
 * **分类选项多带一项 `imageActive`**（选中态的动图、裸链接，见 categoryOptions 的注释），
 * 只有分类有它 —— 模板据此决定「被选中的那一格要不要切成动图」。
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

// 列表区高度：由当前抽屉的选项总数与**列数**决定，最多三行 —— 搜索时不随结果的增减而变化。
// 数值与样式一一对应：.picker-item 的 height 与 .picker-grid 的 grid-auto-rows = 190rpx（辣度 176rpx）、
// .picker-grid 的 gap = 18rpx、上下 padding 合计 12rpx。改动样式需同步改这几个常量。
const PICKER_ROW_RPX = 190
const PICKER_ROW_SPICY_RPX = 176
const PICKER_GAP_RPX = 18
const PICKER_GRID_PAD_RPX = 12
const PICKER_MAX_ROWS = 3
/**
 * 每行几格
 *
 * 辣度是**恰好四档、语义上并列的一组**（不辣 → 特辣，顺序即高低），
 * 排成三列会让第四档单独掉到第二行，既断开序列又白占一行高度；
 * 四列并排才能一眼读完"从哪档到哪档"。食材/调料是数量不定的物料格子，
 * 保持三列（格子更宽，名称长一些也放得下）。
 */
const pickerCols = computed(() => (picker.value === 'spicy' ? 4 : 3))
/** 辣度格子更窄，行高跟着收一档（样式里 $picker-row-spicy 必须与此一致） */
const pickerRowRpx = computed(() => (picker.value === 'spicy' ? PICKER_ROW_SPICY_RPX : PICKER_ROW_RPX))
const pickerListHeight = computed(() => {
  const rows = Math.min(Math.max(Math.ceil(pickerAllOptions.value.length / pickerCols.value), 1), PICKER_MAX_ROWS)
  return rows * pickerRowRpx.value + (rows - 1) * PICKER_GAP_RPX + PICKER_GRID_PAD_RPX + 'rpx'
})
let leaveAfterDiscard = false, nextId = 0
/**
 * 分类抽屉的「静态图 → 选中时切成动图」
 *
 * ⚠️ **行为、理由与踩过的坑都写在 `composables/useArtSwap.js` 里，只写了一次**
 * （第三处调用方：菜谱列表页分类栏、点单页分类栏各有一处）。本页只交代「哪一格算被选中」。
 * 与两页分类栏的唯一差别是字段名：这里的静态图字段叫 `image`，动图随之叫 `imageActive`。
 *
 * 只有分类选项带 `imageActive`；食材 / 调料 / 辣度那三种抽屉没有这一项 →
 * 动图层根本不渲染（`canSwap` 恒假），行为与从前逐字一致。
 */
const { canSwap, isStaticDimmed, markLoaded, markFailed } = useArtSwap({
  isActive: (item) => selection.value.includes(item.id),
  resetOn: selection,
  activeKey: 'imageActive',
  tag: 'recipe-detail'
})
/**
 * 已成功加载的云端菜品 ID
 *
 * **只在详情接口真正返回菜品后才赋值** —— 它是「能不能把修改写回云端」的开关。
 * 取不到菜谱时（接口失败 / 已被删除）保持空串，同时 loadFailed 置真、整页走「没找到」提示态、
 * 底栏根本不出现 —— 所以「页面上有数据、却只是没连上云端」这个中间态**已经不存在了**，
 * save() 与 togglePublish() 里针对它的兜底分支只是防御，正常路径走不到。
 */
const cloudDishId = ref('')

/**
 * 这道菜**是否已发布到菜单**（云端 dishes 的 `isOnSale`）
 *
 * 「发布」就是把这一个字段置 true —— 点单页的菜单接口 `menu-list` 只返回 `isOnSale: true`
 * 的菜品，所以它是「是否出现在菜单里」的**唯一**开关，云端无需新增字段、也无需改 schema。
 *
 * ⚠️ 它刻意**不进 draft**：draft 是编辑器表单，而 `dirty` 是 draft 与 saved 的 JSON 全量比较 ——
 * 把 isOnSale 塞进 draft，会让「什么都没改」也被判成「有改动」（进编辑态就弹「要放弃修改吗」）。
 * 云端旧数据没有这个字段时按 true 处理（与 schema 的 defaultValue 一致）。
 */
const published = ref(false)
/** 发布请求锁：避免连点两次发出两个相反的请求 */
const publishing = ref(false)

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
 * 基础数据二：分类（**只有美食会查**）
 *
 * ⚠️ **咖啡没有分类（2026-09-23 主人定）** → 咖啡页**一次分类查询都不发**，`categories` 恒为空。
 *    这不是「顺手省一个请求」，而是把这条规则**收到数据层**：分类名、分类图、浏览态那枚分类徽标
 *    全部由 `categories` 派生，它空着 —— 历史数据里若带着 `categoryId` 也不会在页面上任何地方冒出来。
 *    （与辣度同一思路：只在模板上收掉那格，脏数据早晚会在某个新展示位冒出来。）
 *
 * 美食这一支是两步查询，**都不能省**：
 * 1. 先按 `type: 'food'` 查（正常路径，只取美食分类）；
 * 2. 结果为空时再不带 type 查一次全量，在页面侧按 `!c.type || c.type === 'food'` 筛 ——
 *    菜谱列表页对美食正是这么做的（它拿的是 dishes-crud/list 顺带返回的分类，同样靠这句兜底），
 *    **两页口径必须一致**，否则会出现「列表页有 6 个分类、编辑页抽屉却是空的」这种裂缝。
 *
 * 为什么两处都要打 warn：原先这里只有一句 `if (code === 0)`，接口异常时**完全静默** ——
 * 2026-09-20 排查「抽屉空」时，就是因为没有任何输出才绕了弯路。
 */
const loadCategories = async () => {
  // 咖啡没有分类：不发查询，并**显式清空**（切类型时这里可能还留着上一次的结果）
  if (isCoffee.value) { categories.value = []; return }
  const kind = 'food'
  try {
    const res = await uniCloud.callFunction({ name: 'app-service', data: { module: 'categories-crud', action: 'list', type: kind } })
    const result = res.result || {}
    if (result.code !== 0) console.warn(`[recipe-detail] 分类(type=${kind})查询失败`, result.code, result.message)
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
      .filter(c => !c.type || c.type === kind)
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

  // 新建态（mode=create）不传 id：这一趟只把物料与分类拉回来，没有菜谱要取
  if (!id) return
  try {
    const dishRes = await uniCloud.callFunction({ name: 'app-service', data: { module: 'dishes-crud', action: 'detail', _id: id } })
    const dishResult = dishRes.result || {}
    if (dishResult.code !== 0 || !dishResult.dish) {
      // 原先这里只是静默 return，页面于是继续显示那份演示数据 —— 用户点 A 看到 B。
      // 现在改成显式失败：数据置空 + 提示，并打一条日志（带接口返回的 code/message）便于排查
      console.warn('[recipe-detail] 菜谱详情没拿到', dishResult.code, dishResult.message || '（接口未返回 dish）')
      loadFailed.value = true
      return
    }
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
      // 咖啡恒为「不辣」（= 没有辣度这个概念），**不读云端值** —— 与 save 里的强制归零同一口径。
      // 两头都归零，是为了让「咖啡的 spicy 永远是 none」成为一条贯穿的规则：
      // 只在写库那一头归零的话，编辑态里 draft.spicy 仍可能是个 'hot'，将来任何一处
      // 忘了判断类型的新展示位都会把它画出来。
      spicy: isCoffee.value ? 'none' : (SPICY_LEVELS.includes(dish.spicy) ? dish.spicy : saved.value.spicy),
      ingredients: pick(dish.ingredients),
      seasonings: pick(dish.seasonings),
      // 步骤同样以云端为准。云端还没有这个字段时（旧数据、尚未录入步骤的菜谱）落回空数组，
      // 页面显示「还没有记录步骤」，而不是继续展示本地演示数据里的那三步
      steps: (Array.isArray(dish.steps) ? dish.steps : []).map(stepFromCloud)
    }
    cloudDishId.value = id
    // 发布状态：与 draft 无关，单独存（见 published 的说明）。
    // 旧数据没有这个字段时按「已发布」处理，与 schema 的 defaultValue:true 保持一致
    published.value = dish.isOnSale !== false
    // 成功标记放在最后清：中途任何一步提前 return（上面那两处）都算失败，标记原样保留
    loadFailed.value = false
  } catch (e) {
    console.error('[recipe-detail] 加载云端菜谱失败', e)
    loadFailed.value = true
  }
}

/**
 * 失败态里的「再试一次」
 *
 * 只重跑 loadCloudRecipe（物料与分类都在它里面，一并刷新），不动 draft / editing ——
 * 失败态下底栏是收掉的，本来也进不了编辑态。
 */
const retryLoad = async () => {
  if (retrying.value || !routeId.value) return
  retrying.value = true
  try {
    await loadCloudRecipe(routeId.value)
  } finally {
    retrying.value = false
  }
}

/**
 * 新建态（路由带 `mode=create`，来自菜谱列表页底部卡槽的两个入口）
 *
 * 两个入口共用这一态：**不带 type 建美食、带 `type=coffee` 建咖啡**（见 isCoffee 的说明）。
 * 与「编辑既有菜谱」共用同一份表单与校验，只有两处不同：
 * 1. 起点数据 —— 空骨架，既不取演示数据也不取本地缓存（缓存里是上一次编辑的残留）；
 * 2. 保存动作 —— 走 dishes-crud / create 而不是 update。
 * 创建成功后会记下返回的 _id 并把本态关掉：这一页随即变成「编辑既有菜谱」，
 * 用户接着改再保存走的就是 update，不会重复创建。
 */
const creating = ref(false)

onLoad(async options => {
  const route = options || {}
  /**
   * ⚠️ **必须放在任何一次接口调用之前**
   *
   * `isCoffee` 决定三件事：① 分类查询的 type（food / coffee）、② 正文的区数与标题
   * （原料+步骤 / 食材+调料+步骤）、③ 新建时写回云端的 `type`。
   * 它在路由参数里（`?type=coffee`，由菜谱页的「再添一杯咖啡」带上），
   * 晚一步定就会先按美食发一次分类请求 —— 抽屉里会闪一下美食分类再换掉。
   * 缺省是美食：不带 type 的入口（编辑既有菜谱那条路）行为与改动前完全一致。
   */
  isCoffee.value = route.type === 'coffee'
  routeId.value = route.id || ''
  // 新建：直接从空骨架进编辑态，跳过菜品详情请求
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
  /**
   * 正常进入只有这一条路：**必须带 ?id=**（菜谱列表页的 openRecipe 会带上）
   *
   * 原先这里还有两块兜底，2026-09-21 一并删除，各有各的理由：
   *   1. 「从 storage 恢复上次编辑的草稿」—— 它是**单键**共用的（所有菜谱一份），
   *      接口失败时打开另一道菜会看到上一次编辑留下的内容；
   *   2. 「拿不到云端就退回演示菜谱」—— 点 A 看到 B，比空白更糟：空白是「没有」，
   *      演示数据是「错的内容」，而且它看起来完全像是真的。
   * 现在没有 id 就直说拿不到（loadFailed），页面不再有任何「本机数据」兜底。
   */
  if (!routeId.value) {
    console.warn('[recipe-detail] 路由没有带 id，无法取菜谱')
    loadFailed.value = true
    return
  }
  await loadCloudRecipe(routeId.value)
})
const exitEditing = () => { editing.value = false; draft.value = null; picker.value = ''; attempted.value = false }
watch(canEdit, allowed => { if (!allowed) { exitEditing(); discardDialog.value = false } })
const startEditing = () => { if (!canEdit.value) return; draft.value = cloneRecipe(saved.value); attempted.value = false; editing.value = true }
const back = () => getCurrentPages().length > 1 ? uni.navigateBack() : uni.switchTab({ url: '/pages/recipe/recipe' })
/**
 * 「取消」按钮
 *
 * 新建态取消 = **直接离开页面**：云端还没有这道菜，退出编辑后只剩一个标题空白的空壳
 * （原先就是停在这个空壳上，既没内容也没入口）。有改动时先弹确认，确认后同样离开。
 */
const cancelEditing = () => {
  if (creating.value) {
    creating.value = false
    if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true }
    else back()
    return
  }
  leaveAfterDiscard = false
  if (dirty.value) discardDialog.value = true
  else exitEditing()
}
const requestBack = () => { if (picker.value) { picker.value = ''; return } if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true } else { exitEditing(); back() } }
/** 放弃修改：新建态同样直接离开（不留空壳），编辑态按 leaveAfterDiscard 决定去留 */
const discard = () => {
  discardDialog.value = false
  if (creating.value) { creating.value = false; back(); return }
  exitEditing()
  if (leaveAfterDiscard) back()
}
onBackPress(() => { if (picker.value) { picker.value = ''; return true } if (dirty.value) { leaveAfterDiscard = true; discardDialog.value = true; return true } return false })
const openPicker = kind => {
  if (!editing.value || !canEdit.value || !PICKER_KINDS.value[kind]) return
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
  const error = validateRecipe(draft.value, isCoffee.value ? 'coffee' : 'dish')
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
      // 辣度：只有四档之内才写库，脏值落回不辣。
      // **咖啡恒写 none** —— 咖啡态已经没有辣度入口，draft.spicy 正常就是 'none'；
      // 但编辑一条历史脏数据（spicy 被写成 hot）时，不强制归零就会把这个无意义的辣度一路带下去。
      spicy: isCoffee.value ? 'none' : (SPICY_LEVELS.includes(value.spicy) ? value.spicy : 'none'),
      ingredients: value.ingredients.map(materialToCloud),
      seasonings: value.seasonings.map(materialToCloud),
      // 步骤显式摘掉前端的 id（渲染标识，不进库）；顺序即数组顺序
      steps: value.steps.map(step => ({ title: step.title, description: step.description, tip: step.tip }))
    }

    // 配料（食材 / 调料）、名称与步骤写回云端 —— 这一步才是编辑真正生效的地方。
    // 云端对 ingredients / seasonings / steps 都是整组替换，所以增、删、改、步骤排序
    // 都由同一次提交表达。
    //
    // 原先这里是「云端 / 只落本机」两条路，第二条用来兜「详情接口没取到」那种情形
    // （把改动 uni.setStorageSync 留在本机）。2026-09-21 起那种中间态**不存在了**：
    // 取不到菜谱时整页走提示态、底栏收起，根本进不到编辑态。本机存档随之删除 ——
    // 保存只有「写云端成功」才算成功，失败就留在编辑态让用户重试，不做「看起来保存了」的假动作。
    // （`creating` 为假、`cloudDishId` 又为空属于理论不可达；真出现时云端会返回 400/404，
    //   按上面的失败分支提示重试即可。）
    const action = creating.value ? 'create' : 'update'
    // 新增必须带 type（云端校验必填）：**由当前类型决定** —— 美食页建 `food`、咖啡页建 `coffee`。
    // ⚠️ 这一处写死 'food' 会让咖啡页新建出来的记录变成美食（列表、菜单两处都跟着错），
    //    而页面本身不会报任何错，属于「静默写错数据」。
    // 新建的**默认不发布**：它先待在菜谱里，确认没问题再点底栏的「发布菜品」上到菜单。
    // isOnSale 写在 ...fields 之前，避免将来 fields 里意外出现同名字段把它盖掉
    const data = action === 'create'
      ? { module: 'dishes-crud', action, token: userStore.token, type: isCoffee.value ? 'coffee' : 'food', isOnSale: false, ...fields }
      : { module: 'dishes-crud', action, token: userStore.token, _id: cloudDishId.value, ...fields }
    const res = await uniCloud.callFunction({ name: 'app-service', data })
    const result = res.result || {}
    if (result.code !== 0) {
      // 云端失败就不算保存成功：留在编辑态，用户的修改还在，可以直接重试
      uni.showToast({ title: result.message || '保存到云端失败，请重试', icon: 'none' })
      return
    }
    let toast = isCoffee.value ? '咖啡已保存' : '菜谱已保存'
    if (action === 'create') {
      // 记下新菜品的 _id 并退出新建态：本页随即变成「编辑既有菜谱」，
      // 用户接着改再保存走的是 update，不会重复创建
      cloudDishId.value = result._id || ''
      creating.value = false
      // 新建时云端写的 isOnSale 就是 false，本地状态必须跟上 ——
      // 否则底栏会显示成「取消发布」，用户以为它已经在菜单里了
      published.value = false
      toast = isCoffee.value ? '咖啡已添加' : '菜谱已添加'
    }

    saved.value = value; exitEditing()
    uni.showToast({ title: toast, icon: 'none' })
  } catch { uni.showToast({ title: '保存失败，修改仍在，请重试', icon: 'none' }) }
  finally { saving.value = false }
}
/**
 * 发布到菜单 / 从菜单撤下
 *
 * 走云端**专用**的 `dishes-crud/toggleSale`（只写 isOnSale 与 updateTime），而不是 `update` ——
 * 后者是「编辑菜品」的整表 patch 入口，用它来切一个开关语义不对，也更容易被将来的字段改动牵连。
 * 注意 toggleSale 收的是**目标值**（`isOnSale: true/false`），不是"取反"。
 * 点单页的菜单在 onShow 重新拉取，所以发布后切到点单页即可看到（无需额外通知）。
 */
const togglePublish = async () => {
  if (!canEdit.value || editing.value || publishing.value) return
  // 没连上云端就没有可改的 _id：本地演示菜谱谈不上「发布」
  if (!cloudDishId.value) {
    uni.showToast({ title: '这道菜还没连上云端，先保存一次', icon: 'none' })
    return
  }
  const next = !published.value
  publishing.value = true
  try {
    const res = await uniCloud.callFunction({
      name: 'app-service',
      data: {
        module: 'dishes-crud', action: 'toggleSale', token: userStore.token,
        _id: cloudDishId.value,
        isOnSale: next
      }
    })
    const result = res.result || {}
    if (result.code !== 0) {
      uni.showToast({ title: result.message || '操作失败，请重试', icon: 'none' })
      return
    }
    published.value = next
    uni.showToast({ title: next ? '已发布，去菜单看看吧' : '已从菜单撤下', icon: 'none' })
  } catch (e) {
    console.error('[recipe-detail] 切换发布状态失败', e)
    uni.showToast({ title: '网络异常，请重试', icon: 'none' })
  } finally {
    publishing.value = false
  }
}
</script>

<style lang="scss" scoped>
// 菜谱详情标题的手绘字体（RecipeMaoken）。@font-face 已统一在 App.vue 里引一次、编进 app.wxss
// 全局生效 —— **页面侧不要再 @import scss/font-*.scss**，否则 base64 会被重复打进本页 wxss。
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
// 这里只有一种图：用户上传的云端封面（裁剪器按 1:1 导出），放进这个 500×500 的框里，
// 显示口径是 aspectFit + 透明底抠图。**2026-09-21 起没有兜底素材了**（封面必传），
// 所以「有没有封面」会带来布局位移 —— 无封面时由 .hero-blank 把框收窄，见下。
// margin-top 64rpx（32px）：导航改绝对定位后主图直接顶到内容区顶部 —— 实测盘子顶端距顶部仅
// 10.4px，与微信胶囊（占屏幕顶下方 47~83px）齐平、观感很挤。下移 28px 后盘子顶端约在屏幕
// y=85px，正好落在胶囊下方；留白仍远小于原来 nav 占的 135px，不会回到「上方大片空白」。
.hero { position:relative; height:520rpx; margin:64rpx 30rpx 6rpx; display:flex; justify-content:center; align-items:center; }
// 浏览态没有封面的框（历史数据 / 「本机体验菜谱」）：收窄成一条纯占位 —— 里面不留图、
// 也不给「添加封面」入口（点单的人不该看到编辑入口）。**这一条不能省**：`.nav` 是
// position:absolute 定位于页面顶部，没有这个框顶着，标题会钻到返回按钮底下。
// 210rpx 是推出来的最小值：nav 底边 = navTop(状态栏高 + 10px) + 72rpx 按钮，取最矮机型
// （状态栏 20px → 60rpx + 72rpx = 132rpx）也够；再算上最矮机型到最高机型（状态栏 59px）
// 的差值，210rpx 在所有机型上都留得住呼吸，且不至于像 520rpx 那样看着像图裂了。
.hero-blank { height:210rpx; }
.dish-art { position:relative; width:500rpx; height:500rpx; }
// 云存储封面的淡入（与菜谱列表页卡片同一套手法）：图片要走网络，直接出现会闪一下。
// 现在这一页只有这一种封面图（本地兜底素材 2026-09-21 已删），所以这个类恒生效。
.cover-img { opacity:0; transition:opacity $p2-dur-base $p2-ease; &.is-loaded { opacity:1; } }
// 编辑态且还没有封面：虚线占位（虚线描边 + 苔绿文字的语汇，同三个区的 .add-row），点了去选图。
// **不能拿什么素材顶上去充数** —— 用户会以为那就是这道菜的封面
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
.title { display:block; font-family:$p2-font-hand, $p2-font-fallback; font-size:$p2-fs-display; line-height:1.35; }
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
  // 系统字体：便签里装的是**用户自由输入**的一段话，子集永远覆盖不全 ——
  // 包内兜底子集 628 字、网络大子集 1480 字，对「菜名」这种三五字的短词能把覆盖率
  // 提到 94%，但一段几十字的便签仍会撞上没收录的字；撞上一个就出现
  // 「半个手写、半个系统」，比整句都用系统字体更碎。
  // 手写体只适合用在**短、且字表可枚举**的地方（标题、固定文案、三五字的菜名）。
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
// 辣度图案：与菜谱列表卡片、点单抽屉**同一套素材**（`static/images/recipes/spicy/*-v2.svg`），
// 由 utils/spicy.js 的 spicyMark() 给出；「不辣」是默认状态、整块不渲染。
//
// 尺寸：46rpx 是**三处展示位统一的值**（辣椒视觉高约 24rpx）。换算过程、以及
// 「别拿旧 Icon 的 size 直接当目标高」这条坑，都写在 utils/spicy.js 的注释里，改前先读。
// 注意这个方框也决定了 .meta 这一行的高度（46rpx，比原先 28rpx 的单色图标高一些）。
.spicy { width:46rpx; height:46rpx; flex-shrink:0; display:block; }
// 【2026-09-21 已删除】「本机体验菜谱」标签的样式（.demo-label）。
// 它标记的是「页面上是本地数据、只是没连上云端」那种中间态；现在取不到菜谱整页走 .load-failed
// 提示（见样式末尾），该中间态不再存在，标签、判断条件与这条样式一并移除。
// 分类 / 辣度的编辑入口：与名称输入框同形的**整行控件**，点它开抽屉去挑。
// 形制直接落在 .field 上（描边 + 手绘圆角 + 奶油底），本类只负责内容的两端对齐 ——
// 这样两行选择器与上方的名称输入框读起来是同一组表单。
.picker-field { display:flex; align-items:center; gap:14rpx; width:100%; text-align:left; }
.picker-field-art { width:44rpx; height:44rpx; flex-shrink:0; }
// 三根辣椒仍清晰可辨，使用与抽屉相同的完整图案。
.picker-field-spicy { width:76rpx; height:64rpx; }
// 图标走 Icon.vue（SVG mask + 继承 currentColor），颜色跟着控件的文字色走，不另设。
// 外面套一个和 .picker-field-art **等宽等高**的盒子（44rpx）：分类行是「素材 or 图标兜底」、
// 辣度行是素材，若两条前导图形宽度不同，下面一行的文字会横向错开几个像素。
.picker-field-icon { display:flex; align-items:center; justify-content:center; width:44rpx; height:44rpx; flex-shrink:0; }
.picker-field-value { flex:1; min-width:0; color:$p2-ink; }
.picker-field-value.is-empty { color:$p2-ink-soft; }
// ==== 下方三个区（食材 / 调料 / 步骤）整体缩一档 —— 2026-09-21 按主人要求 ====
// 目标：整体约 −12%，**图片多降一档**（它是视觉上最压的一处），
// 同时守住三条底线 ——
//   ① 正文段落（.description）不低于可读区间：只降 2rpx，不套用 $p2-fs-caption；
//   ② 触控尺寸不动（底栏按钮仍是 88rpx = 44pt，见 .ghost / .primary）；
//   ③ 能落到字号 token 档位的一律用 token，落不到的就手调并在此写明理由。
// 缩放对照（前 → 后）：区标题 36→32 ｜ 图片 120×116→100×96 ｜ 食材名 28→24（=$p2-fs-caption）
//   步骤名 32→30 ｜ 步骤正文 28→26 ｜ 小提醒 24→22 ｜ 添加按钮 28→24（=$p2-fs-caption）
// ⚠️ 步骤名与正文只降 2rpx 而不各降一档（32→28 / 28→24）：那样两者会落到相邻档、
//    且正文的 24rpx 就是「小提醒」的档位，正文与小提醒会挤成同一级，层级反而糊了。
//    保持「4rpx 字号差」比「各降一档」更重要。
.material-section { padding:22rpx 0 24rpx; border-top:2rpx dashed #e1d6c3; }
.section-head { display:flex; align-items:center; gap:12rpx; margin-bottom:17rpx; }
.number { display:flex; justify-content:center; align-items:center; width:34rpx; height:36rpx; font-size:20rpx; background:$p2-leaf-soft; border-radius:9rpx 12rpx 7rpx 11rpx; transform:rotate(-7deg); }
.seasonings { background:$p2-butter-soft; }.coral { background:$p2-coral-soft; }
.section-title { font-size:$p2-fs-title; font-weight:600; }
// 区标题（食材 / 调料 / 一起慢慢做）降一档。
// ⚠️ 用 `.section-head .section-title` 而不是直接改 `.section-title` —— 后者还被选择抽屉的标题
//    （.picker-heading 里的那个）共用，抽屉不在本次调整范围内，别把它一起带小。
//    只覆盖字号，字重仍由上面那条 `.section-title` 给。
.section-head .section-title { font-size:32rpx; }
// 横向滚动：scroll-view 内部的列表行必须用 inline-flex —— 容器宽度由内容决定，内容一多
// 就必然溢出容器、必然产生可滚动区域。块级 flex 的宽度恒等于父容器宽（内容再多它也不变宽），
// 其子项的溢出行不行要依赖基础库对 scroll-width 的实现，不可靠：官方文档横向滚动只给了
// 「scroll-x + enable-flex」与「white-space:nowrap + inline-block」两种写法，都没有块级 flex。
// 不加 white-space:nowrap：它会连带禁用食材名的自动换行，长名字会横溢到相邻卡片上。
// vertical-align:top 用于消除 inline 元素固有的基线间隙。
.material-scroll { width:100%; }.material-row { display:inline-flex; vertical-align:top; gap:16rpx; padding:10rpx 0 5rpx; }
// 卡片宽 140→118rpx、图框 120×116→**100×96rpx**（比其他元素多降约一档：
// 食材/调料图标是下方区域里视觉重量最大的一处，主人指的也是这里）。
// 图与卡的比例保持：图宽 100 对卡宽 118，左右各留 9rpx 呼吸，图片不会顶到相邻卡片。
.material { width:118rpx; flex-shrink:0; text-align:center; position:relative; }
// 图标不衬底色：去掉原来的浅色圆片（background:#f2efde + 不规则圆角），素材直接落在纸色底上。
.material-art { width:100rpx; height:96rpx; margin:0 auto 7rpx; image { width:100%; height:100%; } }
// 物料图缺失时的兜底：云端 `materials.image` 允许为空（schema 的 defaultValue 就是空串），
// 而空 src 的 `<image>` 在小程序里既画不出东西又会报警告 —— 走 v-if 换成一枚同尺寸的居中图标。
// 与选择抽屉里 `.picker-art-box` 的兜底同一手法（那里兜的是「分类名命不中素材」）。
// 撑满 100×96 的图位是为了不改变卡片高度。
.material-art-fallback { display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:$p2-ink-soft; }
// 卡片只保留「图标 + 名称」：浏览态与编辑态都不再出现用量。
// 数据结构里的 quantity 字段**保留不动** —— 它与云端 dishes.seasonings 一致、随接口读入，
// 将来要恢复用量展示或编辑时数据还在，不必迁移。
// 名称降到 $p2-fs-caption：它是「图标下的标签」，与分类行图标的标签同一个角色，不是正文段落。
.material-name { display:block; font-size:$p2-fs-caption; }
.remove { position:absolute; top:-8rpx; right:2rpx; width:48rpx; height:48rpx; display:flex; align-items:center; justify-content:center; background:#fae4d9; border-radius:50%; z-index:1; }
// 三个区共用的「添加」按钮：整行虚线长条（食材 / 调料 / 步骤同形，原 .add-material 那格方形的已撤掉）。
// 在食材与调料区里它落在横向卡片行的**下方、独占一行**，所以卡片行只装已配置的配料 ——
// 配料再多也不会把入口挤到看不见的地方，三个区的添加入口位置与形态就此一致。
// 上间距 26rpx；下间距交给容器（食材/调料区自带 padding-bottom:26rpx，步骤区后面是页脚），
// 原来的 margin-bottom:20rpx 只在编辑态生效，而编辑态它后面没有兄弟元素，去掉不会产生位移。
.add-row { width:100%; display:flex; align-items:center; justify-content:center; gap:12rpx; padding:22rpx 12rpx; border:2rpx dashed #a8b68b; border-radius:20rpx; color:#63784f; font-size:$p2-fs-caption; margin:24rpx 0 0; }
.empty { display:block; font-size:22rpx; color:$p2-ink-soft; padding:18rpx 0; }
.steps-heading { padding-top:24rpx; border-top:2rpx dashed #e1d6c3; }
.step { padding:22rpx 0 26rpx; border-bottom:2rpx dashed #e1d6c3; }
.step-top { display:flex; align-items:center; gap:14rpx; margin-bottom:13rpx; min-height:34rpx; }
.step-index { color:#7a895e; font-size:22rpx; letter-spacing:2rpx; }.dash { width:45rpx; height:3rpx; background:#c3cda8; border-radius:50%; }
// 步骤名 32→30rpx、说明 28→26rpx：**只降 2rpx 而不是各降一档**（理由见本段开头的说明），
// 目的是保住两级之间那 4rpx 的字号差 —— 层级靠字号差建立，差值没了就只剩字重能区分了。
.step-title { display:block; font-size:30rpx; font-weight:600; line-height:1.6; overflow-wrap:anywhere; }
.description { display:block; margin-top:11rpx; font-size:26rpx; color:$p2-ink-soft; line-height:1.9; white-space:pre-wrap; overflow-wrap:anywhere; }
.tip { display:flex; align-items:flex-start; gap:14rpx; background:#f7edca; border-radius:6rpx 18rpx 14rpx 17rpx; margin-top:20rpx; padding:18rpx; font-size:22rpx; line-height:1.8; white-space:pre-wrap; }.tip-label { display:block; font-weight:600; margin-bottom:4rpx; }
.end-note { display:flex; align-items:center; justify-content:center; gap:12rpx; font-size:21rpx; color:$p2-ink-soft; padding:40rpx 0; }
// === 取不到云端菜谱时的提示（2026-09-21 新增） ===
// 形态与菜谱列表页的空态（.empty-state / .empty-book / .reset-button）**同族**：
// 浅黄纸片圆 + 轻微旋转 + 手写体标题 + 浅绿底描边按钮。两页同属菜谱模块，
// 同类界面用同一套语汇，不该一个页面一个样。
// ⚠️ 文案分成两层、字体不同，改文案或字体前先读：
//   · `.failed-title` 走手写体 —— 「这道菜谱没有找到」8 个字已实测全部在子集内
//     （用 fontTools 读字体 cmap 逐个字符验过，不是估的）；
//   · `.failed-hint` 走**系统字体** —— 原先是因为说明句里的「删 / 掉 / 经 / 络 / 网 /
//     者 / 被 / 顺」都不在子集里，才退回系统字体；2026-09-21 这些字已随子集扩充
//     补入，**技术上可以换手写体了**，但当前刻意保持不变：说明句比标题长得多，
//     一长句手写体的可读性不如黑体，说明文字以「读得清」优先。
//     → 要不要换成手写体属设计取舍，改前先问一下主人。
//   · 按钮同理走系统字体（项目里所有按钮文案都是系统字体）。
.load-failed { display:flex; flex-direction:column; align-items:center; text-align:center; padding:30rpx 16rpx 70rpx; animation:appear 240ms $p2-ease backwards; }
// 手绘纸片圆：与列表页空态的 .empty-book 同形（140rpx / 纸片色 / −8° 轻旋）
.failed-art { display:flex; align-items:center; justify-content:center; width:140rpx; height:140rpx; border-radius:50%; background:$p2-butter-soft; color:$p2-ink-soft; margin-bottom:28rpx; transform:rotate(-8deg); }
.failed-title { display:block; font-family:$p2-font-hand, $p2-font-fallback; font-size:$p2-fs-title; line-height:1.4; }
.failed-hint { display:block; margin-top:10rpx; color:$p2-ink-soft; font-size:$p2-fs-caption; line-height:1.7; }
// 重试按钮：与列表页空态按钮（.reset-button）同一形态 —— 浅绿底 + 实棕描边 + 手绘圆角
.failed-retry { display:flex; align-items:center; justify-content:center; gap:10rpx; margin-top:30rpx; padding:20rpx 32rpx; background:$p2-leaf-soft; border:2rpx solid $p2-line; border-radius:18rpx; font-size:$p2-fs-body; }
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
// 辣度专用行高：它排四列、格子窄了一档（约 154rpx），保持 190 会显得瘦长、图上下空太多。
// **改这里要同步改 script 里的 PICKER_ROW_SPICY_RPX**。
$picker-row-spicy: 176rpx;
$picker-gap: 18rpx;
// 图案边长：三列抽屉用 110rpx，辣度那套四列（.cols-4）收到 94rpx 留呼吸。
// **只在这里写一次** —— 静态图层、选中态动图层、图标兜底层三种图案共用它，
// 改一处三处一起动。动图层居中用 `translate(-50%,-50%)` 而不是「负半个边长的 margin」，
// 正是为了不必在这里再写一份半值（见 .picker-art-moving）。
$picker-art: 110rpx;
$picker-art-spicy: 94rpx;
// 搜索框：复用菜谱页 .search-box 的二期输入框规范（奶油底 + 实棕描边 + 聚焦转珊瑚色）
.picker-search { display:flex; align-items:center; gap:14rpx; height:72rpx; padding:0 24rpx; margin-top:26rpx; color:$p2-ink-soft; background:$p2-surface; border:2rpx solid $p2-line; border-radius:20rpx 24rpx 19rpx 23rpx; transition:border-color $p2-dur-fast $p2-ease; &.is-focused { border-color:$p2-coral; } }
.picker-search-input { flex:1; min-width:0; height:64rpx; font-size:$p2-fs-control; color:$p2-ink; }
.picker-search-clear { display:flex; align-items:center; justify-content:center; width:56rpx; height:56rpx; color:$p2-ink-soft; }
.picker-scroll { max-height: $picker-row * 3 + $picker-gap * 2 + 12rpx; margin:22rpx 0 24rpx; }
// 选择器空态：materials 里还没有这个分组的物料时给出原因，避免看起来像功能坏了
.picker-blank { padding:44rpx 6rpx; text-align:center; color:$p2-ink-soft; font-size:$p2-fs-caption; animation: picker-pop $p2-dur-base $p2-ease backwards; text { display:block; line-height:1.9; } }
// 默认三列。辣度是**恰好四档、顺序即高低**的一组，排三列会让「特辣」单独掉到第二行，
// 既断了序列又多占一行高度 —— 所以给它开一个四列变体（列数由 script 的 pickerCols 决定，两处必须一致）。
// 四列时格子从 211rpx 收到约 154rpx，内宽只剩 120rpx，110rpx 的图案会贴到 padding 边上，
// 故把图案收到 94rpx（左右各留 13rpx 呼吸）；行高同步降到 $picker-row-spicy，维持接近方形的比例。
.picker-grid { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:$picker-row; gap:$picker-gap; padding:6rpx;
  &.cols-4 { grid-template-columns:repeat(4,1fr); grid-auto-rows:$picker-row-spicy;
    .picker-item { height:$picker-row-spicy; .picker-art { width:$picker-art-spicy; height:$picker-art-spicy; } .picker-art-box { height:$picker-art-spicy; } }
  }
}
// 入场动效：关键词一变，:key 里带了关键词 → 列表节点整体重建，卡片依次淡入上浮，
// 让「筛选」读起来是内容浮现、而不是硬切；配合固定高度的列表，抽屉在搜索全程不跳动。
// fill-mode 用 backwards 而不是 both/forwards —— 那两个会在动画结束后继续锁定 to 段的
// transform:none，把按下反馈（全局 button:active 的 scale(.96)）压掉；backwards 只在
// 延迟期间维持 from，动画一结束就把属性交还给常规样式。
.picker-item { box-sizing:border-box; height:$picker-row; position:relative; border:2rpx solid #e1d8c5; padding:15rpx; border-radius:20rpx; font-size:$p2-fs-body; background:$p2-surface; animation: picker-pop $p2-dur-base $p2-ease backwards; &.selected { background:#eaf0db; border-color:#8b9e6a; } }
// 图案本体 —— **静态图那一层**（被选中时另有一层动图压在上面，见 .picker-art-moving）。
// 尺寸由 $picker-art 唯一给出（辣度那套四列变体在 .cols-4 里收到 $picker-art-spicy）。
// transition 是给「选中时静态图让位给动图」那一次透明度切换用的：
// 两层是**逐像素对齐**的（GIF 的首帧就是照静态图渲染的），所以这一次切换本身看不见；
// 留个过渡只是不想在任何边角情形下硬切。
.picker-art { display:block; width:$picker-art; height:$picker-art; margin:auto; transition:opacity $p2-dur-fast $p2-ease; }
// 选中时把静态图收掉、露出下面的动图层。**只在「这一格确实配了动图」时才收**（条件写在模板里）——
// 否则一选中就变成空白格。
.picker-art.is-dim { opacity:0; }
// 动图层：绝对定位压在静态图之上，两级居中（50% + translate 自身一半）。
// 用 translate 而不是「负半个边长的 margin」，是为了**不依赖图案边长** ——
// 同一份规则在三列（110rpx）与辣度四列（94rpx）下都成立，将来改边长也不必回来改这里。
// ⚠️ 用**入场动画**而不是 opacity 过渡：这一层是选中时才新挂载的元素，没有"过渡的起点"可插值。
// ⚠️ 不写 fill-mode（默认 none）—— `forwards` / `both` 会锁死终态，把全局 button:active 的缩放压掉。
// `margin:0` 是**显式覆盖 `.picker-art` 的 `margin:auto`**：这一层是绝对定位的，
// 左右 auto 外边距在这里不参与居中（居中完全交给 translate），写出来只为免去"auto 会不会吃掉落差"的疑问。
.picker-art-moving { position:absolute; left:50%; top:50%; margin:0; transform:translate(-50%,-50%); animation:picker-art-swap-in $p2-dur-fast $p2-ease; }
@keyframes picker-art-swap-in { from { opacity:0; } to { opacity:1; } }
// 图案槽：**两种选项（素材图 / 内置图标）套的是同一层**，高度一致（$picker-art，四列变体同步收窄），
// 保证同一行里两种选项的格子等高 —— 图片是 display:block + margin:auto 居中，
// 图标是 inline-block 的组件，套一层 flex 盒子才稳。
// 2026-09-23 起它同时是**定位上下文**：被选中的那一格要把动图层绝对定位压在静态图上。
.picker-art-box { position:relative; display:flex; align-items:center; justify-content:center; height:$picker-art; }
@keyframes picker-pop { from { opacity:0; transform:translateY(16rpx) scale(.94); } to { opacity:1; transform:none; } }
.selection-dot { position:absolute; top:10rpx; right:10rpx; width:28rpx; height:28rpx; border:2rpx solid #a9b695; border-radius:50%; display:flex; align-items:center; justify-content:center; }.confirm { width:100%; }
@keyframes appear { from { opacity:0; transform:translateY(6rpx); } to { opacity:1; transform:translateY(0); } }
@keyframes slide-up { from { transform:translateY(100%); } to { transform:translateY(0); } }
@media (prefers-reduced-motion:reduce) { button { transition:none; }.picker-art { transition:none; }.editor,.sheet,.picker-item,.picker-blank,.picker-art-moving,.cover-progress,.load-failed { animation:none; } }
</style>
