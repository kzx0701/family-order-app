# Lottie 动画资源目录

本目录存放小程序使用的 Lottie 动画 JSON 文件。

## 需要的动画资源

| 文件名 | 用途 | 建议尺寸 | 是否循环 |
|--------|------|----------|----------|
| `success.json` | 下单成功页庆祝动画 | 300x300 | 否（播放一次后停留末帧） |
| `home-decoration.json` | 首页装饰插画动画 | 200x200 | 是 |
| `cart-fly.json` | 加购飞入动效（可选，亦可用 CSS 实现） | 80x80 | 否 |
| `loading.json` | 加载态动画 | 120x120 | 是 |
| `empty.json` | 空状态插画动画 | 200x200 | 是 |

## 资源获取方式

1. 从 [LottieFiles](https://lottiefiles.com/) 搜索"celebration"、"success"、"food"、"coffee"等关键词，下载免费授权的 JSON 文件
2. 或使用 Adobe After Effects + Bodymovin 插件自行导出
3. 风格要求：与项目"趣味可爱"调性一致，配色优先使用咖啡棕系 / 美食绿系

## 使用方式

参考 `utils/lottie.js`，在页面中：

```vue
<canvas type="2d" id="success-canvas" class="lottie-canvas"></canvas>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { loadLottieOnReady } from '@/utils/lottie.js'
import successAnim from '@/static/lottie/success.json'

onLoad(() => {
  loadLottieOnReady('success-canvas', successAnim, { loop: false, autoplay: true })
})
</script>
```

## 体积优化

- 单个 Lottie JSON 建议控制在 50KB 以内
- 过大可使用 [lottie 压缩工具](https://lottiefiles.com/optimize-lottie)
- 资源会随小程序包一起发布，注意总体积不超过微信小程序主包限制（2MB）
