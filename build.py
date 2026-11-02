#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""生成整站 HTML。

改内容 → 改这个文件 → python build.py，所有页面重写一遍。
样式在 assets/site.css，交互在 assets/site.js，工具/作品数据在 assets/*.json。
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
GH = "https://github.com/sherlynome"
GH_REPO = "https://github.com/sherlynome/sherlynome.github.io"

TABS = [
    ("nav.html", "导航"),
    ("index.html", "主页"),
    ("tools.html", "工具"),
    ("blog.html", "博客"),
    ("notes.html", "动态"),
    ("works.html", "作品集"),
    ("repo.html", "仓库"),
    ("links.html", "友链"),
    ("guest.html", "留言"),
    ("about.html", "关于"),
]

# ── 动态（短句，随手记） ───────────────────────────────────
NOTES = [
    dict(date="2026.11.01", cat="站点", title="整站换成地雷系：黑底 × 荧光粉",
         text="之前那套浅蓝水色全推翻。底压到近黑，粉色只留一处亮点；字换成字由棒棒体，看着更像我自己发出去的东西。",
         read="1 分钟", link=""),
    dict(date="2026.11.01", cat="工具", title="白猫咖啡馆：窗帘挪到猫咪身后",
         text="原来窗帘压在猫头上。把窗户整层沉到猫咪后面，场景面板改成浮层卡片，顺手把窗帘上的云朵换成 SVG 画的。",
         read="1 分钟", link="tools/cat-cafe.html"),
    dict(date="2026.10.31", cat="上新", title="工具墙扩到 14 个",
         text="新增蕾丝底图生成器、Lo 娘柄图排版、吧唧裁切。每个工具都配了 1:1 封面和站内说明，点「怎么用」就能看。",
         read="1 分钟", link="tools.html"),
    dict(date="2026.10.30", cat="站点", title="把所有工具的界面统一了",
         text="以前每个工具各写各的样式，按钮圆角都不一样。现在共用一份皮肤：调色板、字体、控件尺寸都走同一套变量。",
         read="1 分钟", link=""),
    dict(date="2026.10.25", cat="站点", title="站上线了",
         text="工具越攒越多，散在硬盘里自己也找不到。干脆摆成一个站，至少知道每个是干嘛的。",
         read="1 分钟", link=""),
]

# ── 博客（长文，先把坑位留着） ─────────────────────────────
BLOGS = []   # dict(date, title, text, read, link)

# ── 友链 ───────────────────────────────────────────────────
# 照 dict(href=..., icon=..., title=..., desc=...) 的格式往里写，加几条都行，
# 页面和导航页的「常去的地方」会自动跟着变；清空则显示空状态。
LINKS = [
    dict(href="https://lolitalibrary.com/", icon="📖", title="Lo研社 · Lolita图书馆",
         desc="Lolita 服饰与文化研习社 · 查裙子查资料"),
]

FOOTER = """
<div class="foot-strip"></div>
<footer>
  <div class="wrap row">
    <div>© 2026 <b>雪莉露 🌙</b> · 随便逛，随便用</div>
    <div>建站于 <b>GitHub Pages</b> · 不收集任何数据</div>
  </div>
</footer>
"""

MASK = """
<div class="mask" id="mask">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-name">
    <button class="x" id="m-close" aria-label="关闭">✕</button>
    <div class="m-top">
      <img id="m-img" alt="">
      <div><h4 id="m-name"></h4><div class="m-cat" id="m-cat"></div></div>
    </div>
    <p class="m-intro" id="m-intro"></p>
    <div class="m-h">HOW TO</div>
    <ol id="m-steps"></ol>
    <div class="m-tip" id="m-tip"></div>
    <div class="m-actions"><a class="go" id="m-go" target="_blank" rel="noopener">打开工具 →</a></div>
  </div>
</div>
"""


def tabbar(slug: str) -> str:
    items = "\n".join(
        '    <a class="tab%s" href="%s">%s</a>' % (" on" if s == slug else "", s, n)
        for s, n in TABS
    )
    return """
<div class="tabbar">
  <div class="row">
%s
  </div>
  <div class="band"></div>
</div>
""" % items


def nav(n_tools: int) -> str:
    return """
<nav class="nav">
  <a class="brand" href="index.html"><i>🎀</i>雪莉露<i class="jp">の</i><em>部屋</em></a>
  <div class="links">
    <a href="%s" target="_blank" rel="noopener">GitHub ↗</a>
    <span class="cnt"><b>%d</b> TOOLS</span>
  </div>
</nav>
""" % (GH, n_tools)


def layout(slug, title, desc, body, script="", head=""):
    n_tools = len(json.loads((ROOT / "assets/tools.json").read_text(encoding="utf-8")))
    return """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0A0709">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='88'>🎀</text></svg>">
<link rel="stylesheet" href="assets/site.css">
{head}
</head>
<body>
{nav}{tabs}
{body}
{footer}{mask}
<script src="assets/festival.js"></script>
<script src="assets/site.js"></script>
{script}
</body>
</html>
""".format(title=title, desc=desc, head=head, nav=nav(n_tools), tabs=tabbar(slug),
           body=body, footer=FOOTER, mask=MASK, script=script)


def page_head(k, h1, sub, kao=""):
    k_ = '<div class="kao">%s</div>' % kao if kao else ""
    return """
<header class="page-head">
  <div class="wrap">
    <div class="sec-k">%s</div>
    <h1>%s</h1>
    <p>%s</p>
    %s
  </div>
</header>
""" % (k, h1, sub, k_)


def note_rows(notes, limit=None):
    rows = []
    for n in (notes[:limit] if limit else notes):
        tag = 'a' if n["link"] else 'div'
        attrs = ' href="%s"' % n["link"] if n["link"] else ""
        target = ' target="_blank" rel="noopener"' if n["link"].startswith("http") else ""
        rows.append("""
    <%s class="post"%s%s>
      <time>%s</time>
      <div>
        <h3>%s</h3>
        <p>%s</p>
        <div class="p-meta"><span class="p-cat">%s</span><span>%s</span></div>
      </div>
      <span class="p-go">%s</span>
    </%s>""" % (tag, attrs, target, n["date"], n["title"], n["text"],
                n["cat"], n["read"], "→" if n["link"] else "·", tag))
    return "\n".join(rows)


def link_cards(links):
    out = []
    for l in links:
        out.append("""
      <a class="lk" href="%s" target="_blank" rel="noopener">
        <span class="ico">%s</span>
        <div><h4>%s</h4><p>%s</p></div>
        <span class="go">→</span>
      </a>""" % (l["href"], l["icon"], l["title"], l["desc"]))
    out.append("""
      <span class="lk empty">
        <span class="ico">♡</span>
        <div><h4>这里空着</h4><p>想换友链就来小红书找我，把我加进你的站</p></div>
      </span>""")
    return "\n".join(out)


# ============================================================
# 各页内容
# ============================================================

# ── 首页开场（循此苦旅，以达天际） ─────────────────────────
# 样式在 assets/splash.css，逻辑在 assets/splash.js。
# 整个场景挂在 #splash 里，z-index 9999 盖住顶栏和标签栏，播完自动拆掉。
# 同一会话只播一次；想重看：index.html?splash=1
SPLASH = """
<div id="splash">
  <div class="audio-prompt" id="audioPrompt">
    <!-- 启幕页上方的图形：节日是幽灵，日常按当前季节换成樱/叶/枫/雪 -->
    <div class="prompt-mark pm-ghost">
      <svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
        <path d="M 40 135 Q 48 150 58 136 Q 68 150 78 136 Q 88 150 98 136 Q 108 150 118 136 Q 128 150 138 136 Q 148 150 158 135 L 158 92 Q 158 34 100 34 Q 42 34 42 92 Z" fill="#fff"/>
        <ellipse cx="80" cy="92" rx="8" ry="10" fill="#1a1a1a"/>
        <ellipse cx="120" cy="92" rx="8" ry="10" fill="#1a1a1a"/>
        <ellipse cx="100" cy="110" rx="6" ry="7" fill="#1a1a1a"/>
        <ellipse cx="64" cy="108" rx="11" ry="7" fill="#ffb6c8"/>
        <ellipse cx="136" cy="108" rx="11" ry="7" fill="#ffb6c8"/>
      </svg>
    </div>

    <div class="prompt-mark pm-spring">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g fill="#FFB7D5">
          <ellipse cx="50" cy="27" rx="15" ry="21"/>
          <ellipse cx="50" cy="27" rx="15" ry="21" transform="rotate(72 50 50)"/>
          <ellipse cx="50" cy="27" rx="15" ry="21" transform="rotate(144 50 50)"/>
          <ellipse cx="50" cy="27" rx="15" ry="21" transform="rotate(216 50 50)"/>
          <ellipse cx="50" cy="27" rx="15" ry="21" transform="rotate(288 50 50)"/>
        </g>
        <g fill="#FF7FB5" opacity=".55">
          <circle cx="50" cy="36" r="2.6"/><circle cx="63" cy="43" r="2.6"/><circle cx="58" cy="58" r="2.6"/>
          <circle cx="42" cy="58" r="2.6"/><circle cx="37" cy="43" r="2.6"/>
        </g>
        <circle cx="50" cy="50" r="6.5" fill="#FFF0F6"/>
      </svg>
    </div>

    <div class="prompt-mark pm-summer">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 C78 32, 80 66, 50 90 C20 66, 22 32, 50 10 Z" fill="#7FBF6A"/>
        <path d="M50 88 L50 26" stroke="#4A8A42" stroke-width="2.6" stroke-linecap="round"/>
        <g stroke="#4A8A42" stroke-width="1.8" stroke-linecap="round" opacity=".75">
          <path d="M50 44 L34 36"/><path d="M50 44 L66 36"/>
          <path d="M50 58 L32 50"/><path d="M50 58 L68 50"/>
          <path d="M50 72 L36 66"/><path d="M50 72 L64 66"/>
        </g>
      </svg>
    </div>

    <div class="prompt-mark pm-autumn">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 86 C35 84, 21 68, 23 48 C25 32, 38 22, 50 35 C62 22, 75 32, 77 48 C79 68, 65 84, 50 86 Z"
              fill="#E8A04E"/>
        <g stroke="#B85F2E" stroke-width="1.7" stroke-linecap="round" opacity=".65">
          <path d="M50 82 L34 54"/><path d="M50 82 L43 48"/>
          <path d="M50 82 L57 48"/><path d="M50 82 L66 54"/>
        </g>
        <path d="M50 86 L50 96" stroke="#B85F2E" stroke-width="2.6" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="prompt-mark pm-winter">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#CFE3F5" stroke-width="3.2" stroke-linecap="round" fill="none">
          <g>
            <path d="M50 12 L50 88"/>
            <path d="M50 28 L41 20"/><path d="M50 28 L59 20"/>
            <path d="M50 72 L41 80"/><path d="M50 72 L59 80"/>
          </g>
          <g transform="rotate(60 50 50)">
            <path d="M50 12 L50 88"/>
            <path d="M50 28 L41 20"/><path d="M50 28 L59 20"/>
            <path d="M50 72 L41 80"/><path d="M50 72 L59 80"/>
          </g>
          <g transform="rotate(120 50 50)">
            <path d="M50 12 L50 88"/>
            <path d="M50 28 L41 20"/><path d="M50 28 L59 20"/>
            <path d="M50 72 L41 80"/><path d="M50 72 L59 80"/>
          </g>
        </g>
      </svg>
    </div>
    <div class="prompt-text">轻触 启幕</div>
    <div class="prompt-sub">A mystical journey awaits</div>
  </div>

  <div class="stage" id="stage">
    <div class="blackout" id="blackout"></div>

    <!-- 场景层：天空/月亮/城堡/雨都在这里面。
         节日配了 scene 的话，splash.js 会把整层换掉，
         换成完全不同的画面（比如中秋的中式庭院），不只是换个颜色 -->
    <div id="sceneLayer">
    <div class="sky"></div>
    <div class="stars"></div>
    <div class="moon"></div>
    <div id="ghostContainer"></div>

    <div class="castle-wrap">
      <svg class="castle" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sCastleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#241030"/><stop offset="100%" stop-color="#0f0510"/>
          </linearGradient>
          <radialGradient id="sWindowGlow" cx="50%" cy="50%" r="50%">
            <stop class="gs-a" offset="0%" stop-color="#ff8fb8"/><stop class="gs-b" offset="60%" stop-color="#ff5fa2"/><stop class="gs-c" offset="100%" stop-color="#8b0a3a"/>
          </radialGradient>
          <radialGradient id="sDoorGlow" cx="50%" cy="60%" r="50%">
            <stop class="gs-a" offset="0%" stop-color="#ff8fb8"/><stop class="gs-c" offset="100%" stop-color="#5c0011"/>
          </radialGradient>
        </defs>
        <path d="M 0 520 L 150 470 L 350 500 L 550 460 L 800 490 L 1050 455 L 1300 490 L 1600 460 L 1600 600 L 0 600 Z" fill="#0d0518" opacity=".7"/>
        <g fill="url(#sCastleGrad)">
          <rect x="220" y="380" width="70" height="220" rx="8"/><path d="M 215 380 Q 255 280 295 380 Z"/>
          <rect x="100" y="430" width="55" height="170" rx="8"/><path d="M 95 430 Q 127 350 160 430 Z"/>
          <rect x="380" y="420" width="440" height="180" rx="10"/>
          <rect x="400" y="410" width="30" height="18" rx="4"/><rect x="460" y="410" width="30" height="18" rx="4"/><rect x="520" y="410" width="30" height="18" rx="4"/><rect x="650" y="410" width="30" height="18" rx="4"/><rect x="710" y="410" width="30" height="18" rx="4"/><rect x="770" y="410" width="30" height="18" rx="4"/>
          <rect x="570" y="220" width="100" height="380" rx="10"/><path d="M 565 220 Q 620 110 675 220 Z"/><circle cx="620" cy="130" r="10"/>
          <rect x="730" y="340" width="80" height="260" rx="8"/><path d="M 725 340 Q 770 240 815 340 Z"/>
          <rect x="880" y="400" width="440" height="200" rx="10"/>
          <rect x="900" y="390" width="30" height="18" rx="4"/><rect x="960" y="390" width="30" height="18" rx="4"/><rect x="1020" y="390" width="30" height="18" rx="4"/><rect x="1150" y="390" width="30" height="18" rx="4"/><rect x="1210" y="390" width="30" height="18" rx="4"/><rect x="1270" y="390" width="30" height="18" rx="4"/>
          <rect x="1360" y="360" width="80" height="240" rx="8"/><path d="M 1355 360 Q 1400 260 1445 360 Z"/>
          <rect x="1470" y="420" width="60" height="180" rx="8"/><path d="M 1465 420 Q 1500 340 1535 420 Z"/>
        </g>
        <g>
          <rect class="castle-window" x="600" y="300" width="40" height="50" fill="url(#sWindowGlow)" rx="20"/>
          <rect class="castle-window" x="600" y="390" width="40" height="50" fill="url(#sWindowGlow)" rx="20" style="animation-delay:.8s"/>
          <rect class="castle-window" x="255" y="430" width="30" height="40" fill="url(#sWindowGlow)" rx="15" style="animation-delay:.4s"/>
          <rect class="castle-window" x="755" y="420" width="30" height="40" fill="url(#sWindowGlow)" rx="15" style="animation-delay:1.2s"/>
          <rect class="castle-window" x="1385" y="420" width="30" height="40" fill="url(#sWindowGlow)" rx="15" style="animation-delay:.6s"/>
          <rect class="castle-window" x="120" y="470" width="24" height="32" fill="url(#sWindowGlow)" rx="12" style="animation-delay:1.5s"/>
          <rect class="castle-window" x="1485" y="470" width="24" height="32" fill="url(#sWindowGlow)" rx="12" style="animation-delay:1s"/>
          <circle class="castle-window" cx="620" cy="260" r="16" fill="url(#sWindowGlow)" style="animation-delay:.2s"/>
        </g>
        <path d="M 560 600 L 560 510 Q 620 460 680 510 L 680 600 Z" fill="url(#sDoorGlow)"/>
        <path class="door-inner" d="M 580 600 L 580 520 Q 620 488 660 520 L 660 600 Z" fill="#ff5fa2" opacity=".6"/>
        <rect x="545" y="590" width="150" height="12" rx="6" fill="#1a0a20"/>
      </svg>
    </div>

    <div class="fog"></div>
    <canvas class="rain" id="rainCanvas"></canvas>
    <div class="petals" id="petals"></div>
    </div><!-- /sceneLayer -->

    <div class="glow-pulse" id="glowPulse"></div>
    <div class="speak-effect" id="speakEffect"></div>

    <div class="caption" id="caption">
      <div class="caption-cn">循此苦旅，以达天际</div>
      <div class="caption-divider"></div>
      <div class="caption-en">Through this bitter journey, to reach the sky</div>
    </div>

    <div class="curtain left" id="curtainLeft">
      <div class="curtain-bg"></div><div class="curtain-texture"></div><div class="curtain-tassels"></div>
    </div>
    <div class="curtain right" id="curtainRight">
      <div class="curtain-bg"></div><div class="curtain-texture"></div><div class="curtain-tassels"></div>
    </div>
    <div class="top-valance" id="topValance"></div>
  </div>

  <div class="audio-indicator" id="audioIndicator">
    <div class="audio-bars"><div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div><div class="audio-bar"></div></div>
    <span>音景中</span>
  </div>
  <div class="catch-hint" id="catchHint">👻 点一点小幽灵试试~</div>
  <button class="skip-btn" id="skipBtn">跳过开场 →</button>
</div>
<noscript><style>#splash{display:none!important}</style></noscript>
"""

SPLASH_HEAD = '<link rel="stylesheet" href="assets/splash.css">'


HERO = """
<header class="hero" id="top">
  <div class="hero-bg" aria-hidden="true">
    <div class="glow"></div>
    <div class="lines"></div>
    <div class="veil"></div>
  </div>
  <div class="wrap hero-in">
    <div class="eyebrow">SHERLY'S LITTLE ROOM</div>
    <h1>雪莉露<i class="jp">の</i><span class="hl">部屋</span><span class="bow">🎀</span></h1>
    <p class="lead">6 年编导，二次元博主，Lo 娘。<br>
      会建模、画画、也写点代码——做图做素材，工具越攒越多，就摆到这里。<br>
      <b>用得上就拿去用。</b></p>
    <div class="hero-meta">
      <a class="pill" href="works.html"><b id="n-works">0</b>件作品</a>
      <a class="pill" href="tools.html"><b>16</b>个工具</a>
      <a class="pill" href="notes.html"><b>5</b>条动态</a>
    </div>
    <p class="kao">(｡･ω･｡)ﾉ 全部离线可用，不登录，不看广告</p>
  </div>
  <a class="scroll" href="#works-preview">SCROLL<span></span></a>
</header>
"""

BODY_INDEX = SPLASH + HERO + """
<section class="sec" id="works-preview">
  <div class="wrap">
    <div class="sec-head">
      <div class="sec-k">01 / WORKS</div>
      <h2>最近的作品</h2>
      <span class="sub">建模 · 插画 · 设计，做完的都放这</span>
    </div>
    <div class="workgrid" id="home-works"></div>
    <div class="notes-foot"><a class="msgbtn" href="works.html">看全部作品 →</a></div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="sec-k">02 / TOOLS</div>
      <h2>顺手做的小工具</h2>
      <span class="sub">点开即用，不用下载</span>
    </div>
    <div class="grid" id="home-tools"></div>
    <div class="notes-foot"><a class="msgbtn" href="tools.html">16 个全在这 →</a></div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="sec-k">03 / NOTES</div>
      <h2>最近在折腾什么</h2>
      <span class="sub">改了工具、动了站，随手记一笔</span>
    </div>
    <div class="feed">%s</div>
    <div class="notes-foot"><a class="msgbtn" href="notes.html">全部动态 →</a></div>
  </div>
</section>
""" % note_rows(NOTES, 3)

SCRIPT_INDEX = """
<script src="assets/splash.js"></script>
<script>
(async () => {
  try {
    const works = await getJSON('assets/works.json');
    const grid = $('#home-works');
    const items = works.items.slice(0, 4);
    items.forEach(w => grid.appendChild(workCard(w)));
    $('#n-works').textContent = works.items.filter(w => !w.demo).length || works.items.length;
    if (!items.length) grid.innerHTML = '<div class="empty-state"><div class="big">✦</div><h3>还没有作品</h3><p>传上去就会出现在这。</p></div>';
  } catch (e) { console.warn(e); }

  try {
    const tools = await getJSON('assets/tools.json');
    const grid = $('#home-tools');
    tools.slice(0, 6).forEach((t, i) => grid.appendChild(toolCard(t, i)));
  } catch (e) { console.warn(e); }
})();
</script>
"""

BODY_NAV = page_head("NAVIGATION", "导航", "整站的地图。想找什么，从这里进。", "(´▽`ʃ♡ƪ) 一共 9 个页面，别走丢") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="navgrid">
      <a class="navcard" href="index.html"><div class="no">01</div><h3>主页</h3><p>最新作品、工具和动态的入口</p><span class="arrow">→</span></a>
      <a class="navcard" href="blog.html"><div class="no">02</div><h3>博客</h3><p>长文：教程、拆解、踩过的坑</p><span class="arrow">→</span></a>
      <a class="navcard" href="notes.html"><div class="no">03</div><h3>动态</h3><p>短句：今天改了什么、在折腾什么</p><span class="arrow">→</span></a>
      <a class="navcard" href="works.html"><div class="no">04</div><h3>作品集</h3><p>建模 / 插画 / 设计，点开看大图</p><span class="arrow">→</span></a>
      <a class="navcard" href="repo.html"><div class="no">05</div><h3>仓库</h3><p>GitHub 上的源码，随便抄</p><span class="arrow">→</span></a>
      <a class="navcard" href="links.html"><div class="no">06</div><h3>友链</h3><p>常逛的几个站</p><span class="arrow">→</span></a>
      <a class="navcard" href="guest.html"><div class="no">07</div><h3>留言</h3><p>说点什么，用 GitHub 账号登</p><span class="arrow">→</span></a>
      <a class="navcard" href="about.html"><div class="no">08</div><h3>关于</h3><p>我是谁，这站怎么搭的</p><span class="arrow">→</span></a>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="sec-k">OUTSIDE</div>
      <h2>常去的地方</h2>
    </div>
    <div class="linkgrid">%s</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <div class="sec-k">TOOLS</div>
      <h2>16 个工具</h2>
      <span class="sub">全部纯前端，点开就用</span>
    </div>
    <div class="grid" id="toolgrid"></div>
  </div>
</section>
""" % link_cards(LINKS)

SCRIPT_NAV = """
<script>
(async () => {
  const tools = await getJSON('assets/tools.json');
  const grid = $('#toolgrid');
  tools.forEach((t, i) => grid.appendChild(toolCard(t, i)));
})();
</script>
"""

BODY_TOOLS = page_head("TOOLS", "工具", "顺手做的小工具，点开就用。", "（｡·ω·｡）全部离线可用，不登录，不看广告") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="filters" id="tfilter"></div>
    <div class="grid" id="toolgrid"></div>
    <div class="notes-foot"><span>用得上就拿去用 ✦</span></div>
  </div>
</section>
"""

SCRIPT_TOOLS = """
<script>
(async () => {
  const tools = await getJSON('assets/tools.json');
  const grid = $('#toolgrid');
  const bar = $('#tfilter');
  const seen = {};
  const cats = [{ f: 'all', n: '全部' }];
  tools.forEach(t => { if (!seen[t.cat]) { seen[t.cat] = 1; cats.push({ f: t.cat, n: t.catName }); } });
  cats.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'chip' + (i === 0 ? ' on' : '');
    b.dataset.f = c.f; b.textContent = c.n;
    bar.appendChild(b);
  });
  function paint(f) {
    grid.innerHTML = '';
    if (!tools.length) {
      grid.innerHTML = '<div class="empty-state"><div class="big">✦</div><h3>还没有工具</h3><p>回头再来逛。</p></div>';
      return;
    }
    (f === 'all' ? tools : tools.filter(t => t.cat === f))
      .forEach((t, i) => grid.appendChild(toolCard(t, i)));
  }
  paint('all');
  bindFilters(bar, paint);
})();
</script>
"""

BODY_WORKS = page_head("WORKS", "作品集", "建模、插画、设计。做完的都在这，点开看大图。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="filters" id="wfilter">
      <button class="chip on" data-f="all">全部</button>
      <button class="chip" data-f="model">建模</button>
      <button class="chip" data-f="draw">插画</button>
      <button class="chip" data-f="design">设计</button>
    </div>
    <div class="workgrid" id="workgrid"></div>
    <div class="notes-foot"><span id="wnote">还在整理，慢慢往里放 ✦</span></div>
  </div>
</section>
"""

SCRIPT_WORKS = """
<script>
let ALL = [];
function paint(cat) {
  const grid = $('#workgrid');
  grid.innerHTML = '';
  const list = ALL.filter(w => cat === 'all' || w.cat === cat);
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><div class="big">✦</div><h3>这一类还没有东西</h3><p>换个分类看看，或者等我慢慢放。</p></div>';
    return;
  }
  list.forEach(w => grid.appendChild(workCard(w)));
}
(async () => {
  try {
    const data = await getJSON('assets/works.json');
    ALL = data.items || [];
    paint('all');
    const demo = ALL.filter(w => w.demo).length;
    if (demo) $('#wnote').textContent = '带「示例」角标的 ' + demo + ' 张是占位图，换成你的作品后就会消失 ✦';
  } catch (e) {
    $('#workgrid').innerHTML = '<div class="empty-state"><div class="big">✦</div><h3>读不到作品数据</h3><p>assets/works.json 没取到。</p></div>';
  }
})();
bindFilters($('#wfilter'), paint);
</script>
"""

BODY_BLOG = page_head("BLOG", "博客", "长一点的东西：教程、拆解、踩过的坑。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="empty-state">
      <div class="big">✎</div>
      <h3>第一篇还没写</h3>
      <p>短句都在「动态」里。<br>等我想好第一篇写什么，这里就热闹了。</p>
    </div>
  </div>
</section>
"""

BODY_NOTES = page_head("NOTES", "动态", "改了工具、动了站，随手记一笔。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="feed">%s</div>
    <div class="notes-foot"><span>这里会慢慢攒起来 ✦</span></div>
  </div>
</section>
""" % note_rows(NOTES)

BODY_REPO = page_head("REPOSITORY", "仓库", "源码全在 GitHub 上，随便看、随便抄。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="repogrid" id="repos"></div>
    <div class="notes-foot"><a class="msgbtn" href="%s" target="_blank" rel="noopener">去 GitHub 看全部 →</a></div>
  </div>
</section>
""" % GH

SCRIPT_REPO = """
<script>
(async () => {
  const box = $('#repos');
  try {
    const res = await fetch('https://api.github.com/users/sherlynome/repos?sort=updated&per_page=30');
    if (!res.ok) throw new Error(res.status);
    const list = (await res.json()).filter(r => !r.fork);
    if (!list.length) throw new Error('empty');
    box.innerHTML = list.map(r => `
      <a class="repo" href="${r.html_url}" target="_blank" rel="noopener">
        <h3><span>◈</span>${r.name}</h3>
        <p>${r.description || '还没写简介'}</p>
        <div class="foot">
          <span>${r.language || '—'}</span>
          <span>★ <b>${r.stargazers_count}</b></span>
          <span>${(r.updated_at || '').slice(0, 10)} 更新</span>
        </div>
      </a>`).join('');
  } catch (e) {
    box.innerHTML = `
      <a class="repo" href="%s" target="_blank" rel="noopener">
        <h3><span>◈</span>sherlynome.github.io</h3>
        <p>这个站本身的源码。其余仓库在 GitHub 主页。</p>
        <div class="foot"><span>直接去 GitHub →</span></div>
      </a>`;
  }
})();
</script>
""" % GH

BODY_LINKS = page_head("LINKS", "友链", "常逛的站，都是自己一块一块搭出来的。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="linkgrid">%s</div>
  </div>
</section>
""" % link_cards(LINKS)

# ── 留言板（giscus） ───────────────────────────────────────
# repo-id 可以直接从 REST API 拿：
#   curl -s https://api.github.com/repos/sherlynome/sherlynome.github.io | grep node_id
# category-id 必须在仓库开启 Discussions、装好 giscus app 之后，
#   到 https://giscus.app/zh-CN 填仓库名，页面底部生成的 <script> 里复制。
GISCUS_REPO = "sherlynome/sherlynome.github.io"
GISCUS_REPO_ID = "R_kgDOVeTqPg"
GISCUS_CATEGORY = "留言板"
GISCUS_CATEGORY_ID = "DIC_kwDOVeTqPs4DKGUD"

# giscus 只认公开可访问的 CSS URL，所以主题必须走线上地址（改完要等 Pages 部署）
GISCUS_THEME = "https://sherlynome.github.io/assets/giscus.css"

GISCUS_PLACEHOLDER = """
        <div class="empty-state" style="border:none;background:none;">
          <div class="big">♡</div>
          <h3>留言板还没接线</h3>
          <p>要把仓库的 Discussions 打开、装上 giscus 才生效。<br>
             在那之前，微信/小红书私信我，或者去 GitHub 开 issue。</p>
        </div>"""

GISCUS_SCRIPT = """
        <script src="https://giscus.app/client.js"
                data-repo="%s"
                data-repo-id="%s"
                data-category="%s"
                data-category-id="%s"
                data-mapping="pathname"
                data-strict="0"
                data-reactions-enabled="1"
                data-emit-metadata="0"
                data-input-position="bottom"
                data-theme="%s"
                data-lang="zh-CN"
                data-loading="lazy"
                crossorigin="anonymous"
                async>
        </script>""" % (GISCUS_REPO, GISCUS_REPO_ID, GISCUS_CATEGORY, GISCUS_CATEGORY_ID, GISCUS_THEME)

# 没填 category-id 就保持占位，不会把半个 giscus 吐到页面上
GISCUS_INNER = GISCUS_SCRIPT if GISCUS_CATEGORY_ID else GISCUS_PLACEHOLDER

BODY_GUEST = page_head("GUESTBOOK", "留言", "说点什么，工具哪里难用、想要什么新的，都行。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="giscus-wrap">
      <div class="giscus" id="giscus-box">%s
      </div>
    </div>
    <p class="guest-hint">留言要先用 GitHub 账号登录（免费注册，不用会写代码）。<br>
      没有也不想注册的话，<a href="about.html">微信／小红书私信我</a>，一样看得到。</p>
    <div class="guest-actions">
      <a class="msgbtn" href="%s/issues/new" target="_blank" rel="noopener">在 GitHub 开 issue →</a>
      <a class="msgbtn" href="about.html">怎么找我？</a>
    </div>
  </div>
</section>
""" % (GISCUS_INNER, GH_REPO)

BODY_ABOUT = page_head("ABOUT", "关于", "做图做素材的人，顺手写点工具。") + """
<section class="sec" style="padding-top:0">
  <div class="wrap">
    <div class="about">
      <p>6 年编导，二次元博主，Lo 娘。平时做笔记、做图、做素材，市面上顺手的工具没几个，就干脆自己写。</p>
      <p>会的东西挺杂：<b>建模、插画、排版、剪片子</b>，代码是后来为了做工具硬学的——所以这里的工具都长得很朴素，但每个都解决过我自己一个具体的问题。</p>
      <p>这个站是纯静态的，托管在 GitHub Pages：<b>没有后台、没有数据库、不收集任何数据</b>。工具全在浏览器里跑，图片不上传服务器。</p>
      <p class="kao">(｡･ω･｡)ﾉ 想换友链、想要新工具、发现 bug，都可以找我</p>
      <div class="guest-actions">
        <a class="msgbtn" href="guest.html">去留言 →</a>
        <a class="msgbtn" href="%s" target="_blank" rel="noopener">GitHub ↗</a>
      </div>
    </div>
  </div>
</section>
""" % GH


PAGES = [
    ("nav.html", "导航 · 雪莉露の部屋", "整站地图：主页、博客、动态、作品集、仓库、友链、留言、关于。", BODY_NAV, SCRIPT_NAV),
    ("index.html", "雪莉露の部屋 · 做图、做素材、写小工具", "sherly 的个人站：建模、插画、设计作品，以及十几个纯前端的网页小工具。", BODY_INDEX, SCRIPT_INDEX),
    ("tools.html", "工具 · 雪莉露の部屋", "顺手做的小工具，点开即用，全部离线可用。", BODY_TOOLS, SCRIPT_TOOLS),
    ("blog.html", "博客 · 雪莉露の部屋", "长文：工具教程、拆解、踩过的坑。", BODY_BLOG, ""),
    ("notes.html", "动态 · 雪莉露の部屋", "随手记：改了工具、动了站。", BODY_NOTES, ""),
    ("works.html", "作品集 · 雪莉露の部屋", "建模、插画、设计作品集。", BODY_WORKS, SCRIPT_WORKS),
    ("repo.html", "仓库 · 雪莉露の部屋", "GitHub 上的源码仓库。", BODY_REPO, SCRIPT_REPO),
    ("links.html", "友链 · 雪莉露の部屋", "常逛的几个个人站。", BODY_LINKS, ""),
    ("guest.html", "留言 · 雪莉露の部屋", "留言板。", BODY_GUEST, ""),
    ("about.html", "关于 · 雪莉露の部屋", "关于 sherly 和这个站。", BODY_ABOUT, ""),
]


def main():
    for slug, title, desc, body, script in PAGES:
        # 开场样式只在首页引，别让其他页面多下一份 CSS
        head = SPLASH_HEAD if slug == "index.html" else ""
        html = layout(slug, title, desc, body, script, head)
        (ROOT / slug).write_text(html, encoding="utf-8")
        print("  ✓ %-12s %5d 字符" % (slug, len(html)))
    print("\n生成完成：%d 页" % len(PAGES))


if __name__ == "__main__":
    main()
