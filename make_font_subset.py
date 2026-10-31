#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把站酷快乐体（SIL OFL 1.1，可免费商用）按 index.html 实际用字裁剪成 woff2。

为什么要裁剪：整字体 1.5MB，页面只用到几百个字。子集化后 ~80KB，
本地自托管、不依赖 CDN、国内打开不卡。

改完页面文字后跑一次：python make_font_subset.py
（新出现的字如果没被包含，浏览器会回退到系统字体——所以改完要重跑）
"""
import io
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC_TTF = ROOT / "fonts" / "_src" / "ZCOOLKuaiLe-Regular.ttf"
OUT_WOFF2 = ROOT / "fonts" / "kuaile-subset.woff2"
# 首页 + 套了皮肤的工具页（工具里的按钮/标签文案也要在子集里，否则会回退系统字体）
PAGES = ["index.html"] + [f"tools/{p.name}" for p in sorted((ROOT / "tools").glob("*.html"))]

# 颜文字用到的字符（字体里没有的会自动回退系统字体，这里只是保证页面上不会缺字）
EXTRA = (
    "｡･ωﾉヽ●´∀`•✧◝⁰▿◜๑̀́ㅂوᵕ٩ˊᗜˋ♡✿˚⋆゜・♪★☆♥→←↑↓※…—·"
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "，。、；：？！“”‘’（）《》【】—…·"
)


def collect_chars() -> str:
    chars = set(EXTRA)
    for name in PAGES:
        p = ROOT / name
        if p.exists():
            chars |= set(p.read_text(encoding="utf-8"))
    # 去掉空白与不可见字符
    return "".join(sorted(c for c in chars if c.isprintable() and not c.isspace()))


def main() -> int:
    if not SRC_TTF.exists():
        print(f"缺少源字体：{SRC_TTF}")
        print("下载：https://github.com/google/fonts/raw/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf")
        return 1

    text = collect_chars()
    OUT_WOFF2.parent.mkdir(parents=True, exist_ok=True)
    tmp_txt = ROOT / "fonts" / "_subset_chars.txt"
    tmp_txt.write_text(text, encoding="utf-8")

    cmd = [
        sys.executable, "-m", "fontTools.subset", str(SRC_TTF),
        f"--text-file={tmp_txt}",
        f"--output-file={OUT_WOFF2}",
        "--flavor=woff2",
        "--layout-features=*",
        "--no-hinting",
        "--desubroutinize",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    tmp_txt.unlink(missing_ok=True)
    if r.returncode != 0:
        print(r.stdout, r.stderr)
        return 1

    kb = OUT_WOFF2.stat().st_size / 1024
    print(f"✓ {len(text)} 个字符 → {OUT_WOFF2.name}  {kb:.1f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
