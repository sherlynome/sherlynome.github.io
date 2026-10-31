#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把统一皮肤「烧」进源工具文件（E:/我的编程/各主题目录），让本地双击打开也统一。

与 sync_tools.py 的分工：
- bake_skin.py  → 改源文件：内联皮肤 + base64 内嵌字体（单文件自包含，拷到哪都能用）
- sync_tools.py → 生成网站副本：剥掉内联皮肤，改成引用 tools/_ui.css（网页不必背 137KB base64）

用法：
  python bake_skin.py           # 全部套皮工具
  python bake_skin.py stripe    # 只处理名字里含 stripe 的（调试用）

可回滚：源文件在 E:/我的编程 的 git 仓库里，git checkout 即可还原。
"""
import base64
import io
import re
import sys
from pathlib import Path

from fontTools import subset as ft_subset
from fontTools.ttLib import TTFont

from sync_tools import BAKE_ONLY, COLOR_MAP, MAPPING, REPO, SKINNED, _remap_in_styles

ROOT = Path(__file__).resolve().parent
SRC_TTF = ROOT / "fonts" / "_src" / "ZCOOLKuaiLe-Regular.ttf"
SKIN_CSS = ROOT / "tools" / "_ui.css"
MARK_ATTR = 'data-sherly-ui="1"'

# 颜文字/符号兜底字符 + 常用标点数字（工具里可能出现但正文没写的字）
EXTRA = (
    "｡･ωﾉヽ●´∀`•✧◝⁰▿◜๑̀́ㅂوᵕ٩ˊᗜˋ♡✿˚⋆゜・♪★☆♥→←↑↓※…—·"
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "，。、；：？！“”‘’（）《》【】—…·"
)


def build_font_data(html: str) -> str:
    """按该文件实际用字裁剪字体，返回 base64 字符串。"""
    chars = "".join(sorted(set(html) | set(EXTRA)))
    chars = "".join(c for c in chars if c.isprintable() and not c.isspace())
    font = TTFont(str(SRC_TTF))
    opts = ft_subset.Options()
    opts.layout_features = ["*"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.flavor = "woff2"
    subsetter = ft_subset.Subsetter(options=opts)
    subsetter.populate(text=chars)
    subsetter.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def build_skin(css: str, b64: str) -> str:
    """把 _ui.css 里的字体外链换成 base64。"""
    css = re.sub(
        r'src:url\("\.\./fonts/kuaile-subset\.woff2"\) format\("woff2"\);',
        f'src:url(data:font/woff2;base64,{b64}) format("woff2");',
        css,
    )
    return f'<style {MARK_ATTR} id="sherly-ui">\n{css}\n</style>\n'


def bake(path: Path) -> str:
    html = path.read_text(encoding="utf-8")
    # 1. 先把旧的皮肤块剥掉（便于重复执行）
    html = re.sub(r'<style[^>]*data-sherly-ui="1"[^>]*>.*?</style>\s*', "", html, flags=re.S | re.I)
    # 2. 硬编码粉色 → 水蓝（只动 <style>）
    html = _remap_in_styles(html)
    # 3. 生成该文件专属字体子集并内联皮肤
    b64 = build_font_data(html)
    skin = build_skin(SKIN_CSS.read_text(encoding="utf-8"), b64)
    # 4. 插到 </head> 前（皮肤必须在工具自身样式之后才能覆盖）
    idx = html.lower().rindex("</head>")
    html = html[:idx] + skin + html[idx:]
    path.write_text(html, encoding="utf-8")
    return f"{len(b64) * 3 // 4 // 1024} KB 字体 / 文件 {path.stat().st_size // 1024} KB"


def main():
    keyword = sys.argv[1] if len(sys.argv) > 1 else ""
    # 上站工具（按网站名）+ 只本地套皮的源文件
    targets = [(s, d) for s, d in MAPPING.items() if d in SKINNED]
    targets += [(s, Path(s).stem) for s in BAKE_ONLY]
    total = 0
    for src_rel, dst_name in targets:
        if keyword and keyword not in dst_name:
            continue
        path = REPO / src_rel
        if not path.exists():
            print(f"  ✗ 缺文件 {src_rel}")
            continue
        info = bake(path)
        total += 1
        print(f"  ✓ {src_rel}\n      {info}")
    print(f"\n烧录完成：{total} 个源文件")
    return 0


if __name__ == "__main__":
    sys.exit(main())
