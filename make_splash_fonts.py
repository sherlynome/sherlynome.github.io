#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""开场页用的两个字体：裁剪成只含用到的字，本地自托管。

Ma Shan Zheng（马善政毛笔体）整份 2.6MB，开场只用到十几个字，裁完只剩几十 KB。
Great Vibes（花体）本身就 42KB，直接复制过来。

两个都是 SIL Open Font License 1.1，允许商用、修改、子集化、再分发。

改完开场文案后跑一次：python make_splash_fonts.py
（新出现的字没被包含的话，浏览器会回退到系统字体）
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "fonts" / "_src"

MA_SRC = SRC / "MaShanZheng.woff2"
MA_OUT = ROOT / "fonts" / "mashanzheng-subset.woff2"

GV_SRC = SRC / "GreatVibes.woff2"
GV_OUT = ROOT / "fonts" / "greatvibes.woff2"

# 毛笔体只用在两处：启动页「轻触 启幕」、主字幕「循此苦旅，以达天际」。
# 后面那串是备用的意境字，以后改字幕不至于缺字（多留 80 个字才几 KB）。
MA_CHARS = (
    "轻触启幕循此苦旅以达天际，。"
    "星光夜风月雪花梦影归途远山海云雨心生命路行者无尽愿望沉浮"
    "灯烛晨昏雾霜露寒暖悲喜欢忧愁思念故人旧事回望止步停留程"
    "彼方此处永刹那瞬间"
)


def subset_ma() -> int:
    if not MA_SRC.exists():
        print(f"缺少源字体：{MA_SRC}")
        print("可从 https://cdn.jsdelivr.net/npm/@fontsource/ma-shan-zheng@5/files/ 下载")
        return 1

    text = "".join(dict.fromkeys(MA_CHARS))  # 去重保序
    tmp = ROOT / "fonts" / "_ma_chars.txt"
    tmp.write_text(text, encoding="utf-8")

    cmd = [
        sys.executable, "-m", "fontTools.subset", str(MA_SRC),
        f"--text-file={tmp}",
        f"--output-file={MA_OUT}",
        "--flavor=woff2",
        "--layout-features=*",
        "--no-hinting",
        "--desubroutinize",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    tmp.unlink(missing_ok=True)
    if r.returncode != 0:
        print(r.stdout, r.stderr)
        return 1

    kb = MA_OUT.stat().st_size / 1024
    print(f"✓ Ma Shan Zheng  {len(text)} 字 → {MA_OUT.name}  {kb:.1f} KB"
          f"（原 {MA_SRC.stat().st_size/1024/1024:.1f} MB）")
    return 0


def copy_gv() -> int:
    if not GV_SRC.exists():
        print(f"缺少源字体：{GV_SRC}")
        return 1
    shutil.copyfile(GV_SRC, GV_OUT)
    print(f"✓ Great Vibes     → {GV_OUT.name}  {GV_OUT.stat().st_size/1024:.1f} KB")
    return 0


def main() -> int:
    rc = subset_ma()
    rc |= copy_gv()
    return rc


if __name__ == "__main__":
    sys.exit(main())
