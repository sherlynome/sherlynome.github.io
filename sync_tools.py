#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把源工具同步到网站 tools/ 目录，并套上统一皮肤。

用法：python sync_tools.py
以后改了任何工具，跑一次这个脚本，再 git commit 就行。

皮肤机制：源文件一行不改，同步时在副本的 </head> 前插一行 <link href="_ui.css">。
这样工具本体保持原样（本地直接双击打开还是旧样子），发布到网站的版本统一外观。
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # 个人网站/
REPO = ROOT.parent                              # E:/我的编程/
TOOLS_DIR = ROOT / "tools"

# 源文件 -> 网站文件名
# 铁律：只有 已完成/ 里的工具才能上站（main() 里会强制校验）。
#       进行中/ 的工具无论做得多好，一律不上站。
MAPPING = {
    "已完成/吧唧工坊/吧唧图案工作室.html": "badge-pattern.html",
    "已完成/图案底图生成/条纹生成器.html": "stripe.html",
    "已完成/图案底图生成/棋盘格生成器.html": "checker.html",
    "已完成/图案底图生成/多形状底图生成器.html": "candy-shape.html",
    "已完成/图案底图生成/蕾丝底图生成器.html": "lace.html",
    "已完成/lo娘柄图/柄图排版工具.html": "lolita-print.html",
    "已完成/吧唧工坊/吧唧裁切.html": "badge-cut.html",
    "已完成/水印机/code.html": "watermark-v5.html",
    "已完成/水印机/sherly🌙的水印 · e版（大图自适应修复）.html": "watermark-e.html",
    "已完成/白猫咖啡馆/最终版本.html": "cat-cafe.html",
    "已完成/小小世界系列/兔子小岛.html": "rabbit-island.html",
    "已完成/小小世界系列/富士山樱花站台.html": "sakura-station.html",
    "已完成/eva驾驶员终端/one last kiss风格图片制作.html": "one-last-kiss.html",
    "已完成/eva驾驶员终端/eva海岸吧唧背景生成器.html": "eva-badge.html",
}

# 套皮肤的文件。没列出的保持原样：
#   eva-badge（深色终端，套浅色皮肤会毁气质）、
#   cat-cafe（游戏界面，自成一套）、
#   rabbit-island / sakura-station（全屏 3D 场景，只靠画布，没有控件层）
SKINNED = {
    "badge-pattern.html",
    "stripe.html",
    "checker.html",
    "candy-shape.html",
    "watermark-v5.html",
    "watermark-e.html",
    "one-last-kiss.html",
    "lace.html",
    "lolita-print.html",
    "badge-cut.html",
}

# 只在本地套皮肤、暂未上站的工具（源文件相对路径）。bake_skin.py 会一并处理。
# 没列出的在本地也保持原样：吧唧样机（WinXP 复古主题，套浅色皮肤会毁掉整套视觉）
BAKE_ONLY = [
    # 例如 "图案底图生成/xxx.html"：暂未上站、但本地要统一皮肤的
]

SKIN_TAG = '<link rel="stylesheet" href="_ui.css" data-sherly-ui="1">'

# 硬编码色值重映射：只在 <style> 里替换，不碰 <script>（脚本里多半是画布默认色，属于工具输出而非界面）
COLOR_MAP = {
    # 粉色系 → 浅蓝水色系（按明度对应）
    "#ffe9ef": "#F2FAFE", "#fff5f8": "#F8FCFE", "#fff5f7": "#F8FCFE",
    "#fff6f8": "#F8FCFE", "#fff0f5": "#F7FCFE", "#fff3f6": "#F7FCFE",
    "#fdeff3": "#F7FCFE", "#ffeff4": "#FBFDFF", "#ffe3eb": "#EAF5FB",
    "#ffe4ee": "#EAF6FC", "#ffe4ec": "#EAF6FC", "#fbdfe7": "#EAF6FC",
    "#ffc9dd": "#D6ECF6", "#ffc9da": "#D6ECF6", "#ffd6e0": "#D6ECF6",
    "#f3bccb": "#D6ECF6", "#f6dce3": "#D6ECF6", "#ffb7c5": "#A9DCEC",
    "#f2a6bc": "#A9DCEC", "#fbd9e2": "#E4F3FB", "#ff8fab": "#7FC6DE",
    "#ff8fb5": "#7FC6DE", "#fb7fb0": "#8FD0E6", "#f25697": "#5BADCB",
    "#e4577a": "#4E9FBC", "#e4567a": "#4E9FBC", "#e04070": "#3E8FAC",
    "#e13a82": "#3E8FAC",
    # 粉调文字 → 蓝灰文字
    "#5c3346": "#2C4A5C", "#5c3a44": "#2C4A5C", "#a4708a": "#6E90A3",
    "#b98b97": "#6E90A3",
    # 卡片底
    "#fffdfb": "#FFFFFF",
}


def _to_aqua(match) -> str:
    """把粉/红色按明度映射到浅蓝水色系；非粉红原样返回。"""
    import colorsys
    import re as _re
    txt = match.group(0)
    is_rgba = txt.lower().startswith("rgba")
    if is_rgba:
        nums = [float(x) for x in _re.findall(r"[\d.]+", txt)[:4]]
        r, g, b = (v / 255 for v in nums[:3])
        alpha = nums[3] if len(nums) > 3 else 1.0
    else:
        h = txt.lstrip("#")
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
        alpha = None
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    hue = hh * 360
    # 只处理粉/红色（色相 320°~25°），低饱和的灰不动
    if not ((hue < 25 or hue > 320) and s > 0.08):
        return txt
    # 目标：色相 196°（水蓝），明度保持不变，饱和度压到 0.45 以内
    nr, ng, nb = colorsys.hls_to_rgb(196 / 360, l, min(s, 0.45))
    if is_rgba:
        return f"rgba({round(nr*255)}, {round(ng*255)}, {round(nb*255)}, {alpha:g})"
    return "#{:02x}{:02x}{:02x}".format(round(nr * 255), round(ng * 255), round(nb * 255))


def _remap_in_styles(html: str) -> str:
    """只替换 <style> 块内的硬编码颜色（粉→水蓝）。<script> 里多半是画布默认色，属于作品内容。"""
    import re
    def fix(m):
        block = m.group(0)
        for old, new in COLOR_MAP.items():
            block = re.sub(old, new, block, flags=re.I)
        block = re.sub(r"#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)", _to_aqua, block)
        return block
    return re.sub(r"<style[^>]*>.*?</style>", fix, html, flags=re.S | re.I)


def defer_google_fonts(html: str) -> str:
    """把 fonts.googleapis.com 的样式表改成非阻塞加载。

    国内访问 Google Fonts 大概率超时，而样式表是渲染阻塞资源，会白屏几秒。
    改成 media="print" + onload 切换，先用回退字体渲染，加载成功再换。
    """
    import re
    def fix(m):
        tag = m.group(0)
        if "media=" in tag or "onload=" in tag:
            return tag
        return tag[:-1] + ' media="print" onload="this.media=\'all\'">'
    return re.sub(r'<link[^>]*fonts\.googleapis\.com[^>]*>', fix, html)


def apply_skin(path: Path) -> bool:
    """网站副本：剥离源文件里烧进去的内联皮肤，改走外链 _ui.css（网页不必背 base64）。"""
    import re
    html = path.read_text(encoding="utf-8")
    changed = False
    # 1. 剥掉 bake_skin.py 内联进源文件的皮肤块
    stripped = re.sub(r'<style[^>]*data-sherly-ui="1"[^>]*>.*?</style>\s*', "", html, flags=re.S | re.I)
    if stripped != html:
        html, changed = stripped, True
    # 2. 没有外链则插入
    if 'href="_ui.css"' not in html:
        if "</head>" in html.lower():
            html = _remap_in_styles(html)
            idx = html.lower().rindex("</head>")
            html = html[:idx] + SKIN_TAG + "\n" + html[idx:]
            changed = True
        else:
            print(f"    ! {path.name} 没有 </head>，跳过皮肤")
            return False
    deferred = defer_google_fonts(html)
    if deferred != html:
        html, changed = deferred, True
    if changed:
        path.write_text(html, encoding="utf-8")
    return changed


DONE_DIR = "已完成"


def _guard(src_rel: str) -> bool:
    """上站守门：源文件必须位于 已完成/ 下。"""
    if not src_rel.startswith(DONE_DIR + "/"):
        print(f"  ✗ 拒绝上站 {src_rel}（不在 {DONE_DIR}/ 内；进行中的工具一律不上站）")
        return False
    return True


def main():
    TOOLS_DIR.mkdir(exist_ok=True)
    ok, miss, skinned = 0, [], 0
    for src_rel, dst_name in MAPPING.items():
        if not _guard(src_rel):
            miss.append(src_rel)
            continue
        src = REPO / src_rel
        if not src.exists():
            miss.append(src_rel)
            continue
        dst = TOOLS_DIR / dst_name
        shutil.copy2(src, dst)
        ok += 1
        mark = ""
        if dst_name in SKINNED and apply_skin(dst):
            skinned += 1
            mark = "  + 皮肤"
        print(f"  ✓ {dst_name:<24} ← {src_rel}{mark}")
    print(f"\n同步完成：{ok} 个（套皮肤 {skinned} 个）")
    if miss:
        print("缺失源文件：")
        for m in miss:
            print("  ✗ " + m)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
