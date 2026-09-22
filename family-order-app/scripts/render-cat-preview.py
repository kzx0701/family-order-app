#!/usr/bin/env python3
"""把一批分类素材按**界面真实尺寸**并排渲染，供肉眼校验。

用法（需用装有 Pillow 的 python 跑）：
    python render-cat-preview.py <out.png> [放大倍数]
    SRC=<目录> NAMES=<文件名,逗号分隔> python render-cat-preview.py out.png 3
默认按 750rpx 设计稿 → 375pt 屏幕换算：1rpx = 0.5pt，分类图标 44rpx = 22pt。
默认放大 3 倍只是为了肉眼看得清，**校验的真实性来自 22pt 这个尺寸本身**。

2026-09-22 由 SVG 版（svglib）改为**位图版**（Pillow）：分类图标的新规范是位图
（PNG 静态图 + GIF 选中态动图），svglib 读不了 png/gif。
⚠️ 目录里若还有 `.svg`（现只剩 `all-v2.svg` 一张「全部」的图标），本脚本无法渲染，会跳过。

⚠️ **GIF 只取首帧** —— 本脚本是静态校验工具，动效只能真机看。
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('SRC', os.path.join(ROOT, 'static/images/recipes/categories'))
NAMES = os.environ.get('NAMES', 'heat-v2.png').split(',')

OUT = sys.argv[1]
SCALE = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0

SIZE = 22 * SCALE          # 图标在界面上的真实边长（pt），放大 SCALE 倍后作为像素
GAP = 12 * SCALE
PAD = int(10 * SCALE)
W = int(PAD * 2 + len(NAMES) * SIZE + (len(NAMES) - 1) * GAP)
H = int(PAD * 2 + SIZE)

# 奶油纸色底，与页面背景一致 —— 校验「素材在真实底色上是否看得见」
canvas = Image.new('RGB', (W, H), (0xFF, 0xF8, 0xE8))

x = float(PAD)
for name in NAMES:
    path = os.path.join(SRC, name)
    if not os.path.exists(path):
        print('跳过（文件不存在）:', name)
        continue
    if name.lower().endswith('.svg'):
        print('跳过（本脚本只处理位图）:', name)
        continue
    im = Image.open(path)
    if getattr(im, 'is_animated', False):
        im.seek(0)
    im = im.convert('RGBA').resize((int(SIZE), int(SIZE)), Image.LANCZOS)
    canvas.paste(im, (int(x), int(PAD)), im)
    # 内容包围盒 —— 直接看出「内容占画布多少」，这是比对不同素材的关键数字
    bbox = im.getbbox()
    print('  %-16s 内容 bbox=%s  占画布 %.0f%% × %.0f%%' % (
        name, bbox, (bbox[2] - bbox[0]) / SIZE * 100, (bbox[3] - bbox[1]) / SIZE * 100))
    x += SIZE + GAP

canvas.save(OUT)
print('wrote', OUT, canvas.size)
