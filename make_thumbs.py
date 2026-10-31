#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""给站上每个工具做一张 1:1 封面（卡片图标用）。

为什么不是直接裁方图：工具栏里有一半是「先上传图片」的空状态，硬裁出来一片白，
14 张摆在一起会一半精致一半惨白。所以统一成「截图装进浅色底卡」的成品封面：
后台截图 → 圆角 + 细描边 + 柔投影 → 贴在按分类配色的渐变底上 → 520×520 JPEG。

需要先在本目录跑静态服务：python -m http.server 8765 --bind 127.0.0.1
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "thumbs"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
BASE = "http://127.0.0.1:8765/tools/"

SHOT_W, SHOT_H = 1280, 800
CANVAS = 520
IMG_W = 480
RADIUS = 14
QUALITY = 86

# 名字 -> 分类（决定封面底色）
TOOLS = {
    "badge-pattern": "pattern",
    "stripe": "pattern",
    "checker": "pattern",
    "candy-shape": "pattern",
    "lace": "pattern",
    "lolita-print": "pattern",
    "badge-cut": "pattern",
    "watermark-v5": "water",
    "watermark-e": "water",
    "cat-cafe": "scene",
    "rabbit-island": "scene",
    "sakura-station": "scene",
    "one-last-kiss": "ani",
    "eva-badge": "ani",
}

# 部分工具首屏是「先上传图片」的空状态，居中放大一点才看得出内容
ZOOM = {
    "one-last-kiss": 1.2,
    "watermark-e": 1.45,
    "watermark-v5": 1.25,
    "lolita-print": 1.1,
}

# 与站点同源的浅色渐变（top, bottom）
PALETTE = {
    "pattern": ((233, 246, 252), (247, 252, 255)),
    "water":   ((236, 248, 250), (250, 253, 255)),
    "scene":   ((252, 246, 235), (253, 252, 250)),
    "ani":     ((240, 242, 252), (251, 251, 255)),
}


def shoot(name: str, tmp: Path) -> Image.Image:
    raw = tmp / f"{name}.png"
    cmd = [
        EDGE, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--virtual-time-budget=9000",
        f"--user-data-dir={tmp / ('prof-' + name)}",
        f"--window-size={SHOT_W},{SHOT_H}", f"--screenshot={raw}",
        BASE + name + ".html",
    ]
    subprocess.run(cmd, capture_output=True, timeout=120)
    if not raw.exists():
        raise RuntimeError(f"截图失败：{name}")
    return Image.open(raw).convert("RGB")


def vertical_gradient(size: int, top, bottom) -> Image.Image:
    g = Image.new("RGB", (size, size))
    d = ImageDraw.Draw(g)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)], fill=tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g


def rounded_mask(size, radius) -> Image.Image:
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def compose(shot: Image.Image, cat: str, name: str = "") -> Image.Image:
    top, bottom = PALETTE[cat]
    cover = vertical_gradient(CANVAS, top, bottom).convert("RGB")

    z = ZOOM.get(name, 1.0)
    if z > 1.0:
        cw, ch = round(shot.width / z), round(shot.height / z)
        left, top_ = (shot.width - cw) // 2, (shot.height - ch) // 2
        shot = shot.crop((left, top_, left + cw, top_ + ch))

    ratio = IMG_W / shot.width
    img = shot.resize((IMG_W, round(shot.height * ratio)), Image.LANCZOS)
    x = (CANVAS - img.width) // 2
    y = (CANVAS - img.height) // 2

    # 投影
    shadow = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [x + 3, y + 6, x + img.width + 3, y + img.height + 10],
        radius=RADIUS, fill=(120, 165, 190, 78),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    cover = Image.alpha_composite(cover.convert("RGBA"), shadow).convert("RGB")

    # 圆角截图 + 极细描边
    mask = rounded_mask(img.size, RADIUS)
    cover.paste(img, (x, y), mask)
    d = ImageDraw.Draw(cover)
    d.rounded_rectangle([x, y, x + img.width - 1, y + img.height - 1],
                        radius=RADIUS, outline=(206, 226, 238))
    return cover


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        for name, cat in TOOLS.items():
            if only and only not in name:
                continue
            cover = compose(shoot(name, tmp), cat, name)
            dst = OUT / f"{name}.jpg"
            cover.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
            print(f"  ✓ {name:<16} {dst.stat().st_size // 1024} KB")
    print(f"\n完成，输出目录 {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
