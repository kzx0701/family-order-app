#!/usr/bin/env python3
"""生成的白底 JPG → 透明底 PNG：边缘连通白色去背 + 内容裁剪居中 + 缩放到 256。

用法: python3 scripts/ingredient-postprocess.py <src.jpg> <dst.png> [输出尺寸=256] [内容占比=0.86]
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
WHITE_T = 235          # 近白阈值
# 内容占画布比例：食材 0.86；菜品 0.98（现有菜品图实测 content 宽占比 ≈0.98）
CONTENT_RATIO = float(sys.argv[4]) if len(sys.argv) > 4 else 0.86
OUT = int(sys.argv[3]) if len(sys.argv) > 3 else 256

img = Image.open(src).convert("RGB")
w, h = img.size
arr = np.asarray(img, dtype=np.uint8)

# 近白掩码
near_white = (arr.min(axis=2) >= WHITE_T).astype(np.uint8) * 255

# 从四周边界所有近白像素 BFS，标记与边缘连通的背景（内部白色高光保留）
bg = np.zeros((h, w), dtype=bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if near_white[y, x] and not bg[y, x]:
            bg[y, x] = True
            q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if near_white[y, x] and not bg[y, x]:
            bg[y, x] = True
            q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True
            q.append((ny, nx))

alpha = np.where(bg, 0, 255).astype(np.uint8)
alpha = np.asarray(Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(1.5)))

out = Image.fromarray(np.dstack([arr, alpha]), "RGBA")

# 按 alpha 裁剪内容
ys, xs = np.where(alpha > 8)
if len(xs) == 0:
    sys.exit("no content found")
content = out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
cw, ch = content.size

# 缩放到目标占比，居中贴到透明画布
scale = (OUT * CONTENT_RATIO) / max(cw, ch)
nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
content = content.resize((nw, nh), Image.LANCZOS)
canvas = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
canvas.paste(content, ((OUT - nw) // 2, (OUT - nh) // 2), content)
canvas.save(dst)
print(f"saved {dst} content={nw}x{nh}")
