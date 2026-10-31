/* ============================================================
   开场动画 · 循此苦旅，以达天际
   ------------------------------------------------------------
   播放策略：同一个浏览器会话只播一次（sessionStorage 记账）。
   想再看一次，在地址后面加 ?splash=1，例如：
       https://sherlynome.github.io/?splash=1
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('splash');
  if (!root) return;

  var KEY = 'splash:played';
  var forced = /[?&]splash=1\b/.test(location.search);

  function getFlag() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
  function setFlag() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }

  /* 播过了就直接拆掉，别挡着首页 */
  if (!forced && getFlag()) { root.remove(); return; }
  setFlag();

  document.body.classList.add('splash-lock');

  var $ = function (sel) { return root.querySelector(sel); };

  var audioPrompt = $('#audioPrompt'),
      stage = $('#stage'),
      blackout = $('#blackout'),
      curtainLeft = $('#curtainLeft'),
      curtainRight = $('#curtainRight'),
      topValance = $('#topValance'),
      glowPulse = $('#glowPulse'),
      caption = $('#caption'),
      speakEffect = $('#speakEffect'),
      skipBtn = $('#skipBtn'),
      audioIndicator = $('#audioIndicator'),
      catchHint = $('#catchHint');

  /* 场景层里的元素会被节日场景整块替换，所以不能一次性缓存，
     换完场景要重新抓一遍。中秋场景没有雨画布和幽灵容器，这里都是可空的。 */
  var rainCanvas = null, ctx = null, petalsContainer = null, ghostContainer = null;

  function refreshSceneRefs() {
    rainCanvas = $('#rainCanvas');
    ctx = rainCanvas ? rainCanvas.getContext('2d') : null;
    petalsContainer = $('#petals');
    ghostContainer = $('#ghostContainer');
  }
  refreshSceneRefs();

  var rainActive = false,
      timers = [],
      ambTimers = [],
      audioCtx = null,
      masterGain = null,
      killed = false;

  var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  /* ── 雨 ─────────────────────────────────────────────────── */
  function resizeCanvas() {
    if (!rainCanvas) return;
    rainCanvas.width = root.clientWidth;
    rainCanvas.height = root.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  var raindrops = [];
  for (var i = 0; i < (isMobile ? 120 : 200); i++) {
    raindrops.push({
      x: Math.random() * root.clientWidth,
      y: Math.random() * root.clientHeight,
      length: Math.random() * 16 + 8,
      speed: Math.random() * 6 + 4,
      opacity: Math.random() * .3 + .1,
      width: Math.random() * 1 + .4
    });
  }

  function drawRain() {
    if (!rainActive || killed || !ctx) return;
    ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    ctx.strokeStyle = 'rgba(255,180,210,.4)';
    ctx.lineCap = 'round';
    raindrops.forEach(function (d) {
      ctx.lineWidth = d.width;
      ctx.globalAlpha = d.opacity;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 2, d.y + d.length);
      ctx.stroke();
      d.y += d.speed;
      d.x -= 1;
      if (d.y > rainCanvas.height) { d.y = -d.length; d.x = Math.random() * (rainCanvas.width + 60); }
      if (d.x < -10) d.x = rainCanvas.width + 10;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawRain);
  }

  /* ── 节日专属场景 ───────────────────────────────────────── */
  /* 默认场景是西式城堡（写在 build.py 的 SPLASH 里，不在这里）。
     节日如果配了 scene 字段，就把城堡整块换成这里的画面。 */
  var SCENES = {
    /* 夜樱：一棵树 + 月亮 + 落花。
       树的画法来自「樱花系列设计储备 / 01-单体图 / 樱花树 单独.html」，
       原图是白底，这里去掉底、树干压暗、花冠加月色辉光，才立得住夜景。 */
    sakura: `
<div class="sk-sky"></div>
<div class="sk-stars"></div>
<div class="sk-halo"></div>
<div class="sk-moon"></div>
<div class="sk-cloud sc1"></div>
<div class="sk-cloud sc2"></div>

<div class="sk-scene">
  <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
    <defs>
      <radialGradient id="skSoft" cx="50%" cy="45%" r="52%">
        <stop offset="0%" stop-color="#FFF6FA" stop-opacity="1"/>
        <stop offset="68%" stop-color="#FCC4D9" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#F9BCD6" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="skInner" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#FFF1F7" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#F9BCD6" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="skPetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFF1F7"/><stop offset="100%" stop-color="#F9BCD6"/>
      </linearGradient>
      <radialGradient id="skShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFB7D5" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#FFB7D5" stop-opacity="0"/>
      </radialGradient>
      <g id="skFlower">
        <g fill="url(#skPetal)" stroke="#F2A9C4" stroke-width="0.5">
          <path d="M0 -8 C 3 -2, 3 -2, 8 0 C 3 2, 3 2, 0 8 C -3 2, -3 2, -8 0 C -3 -2, -3 -2, 0 -8 Z"/>
          <path d="M0 -8 C 3 -2, 3 -2, 8 0 C 3 2, 3 2, 0 8 C -3 2, -3 2, -8 0 C -3 -2, -3 -2, 0 -8 Z" transform="rotate(72)"/>
          <path d="M0 -8 C 3 -2, 3 -2, 8 0 C 3 2, 3 2, 0 8 C -3 2, -3 2, -8 0 C -3 -2, -3 -2, 0 -8 Z" transform="rotate(144)"/>
          <path d="M0 -8 C 3 -2, 3 -2, 8 0 C 3 2, 3 2, 0 8 C -3 2, -3 2, -8 0 C -3 -2, -3 -2, 0 -8 Z" transform="rotate(216)"/>
          <path d="M0 -8 C 3 -2, 3 -2, 8 0 C 3 2, 3 2, 0 8 C -3 2, -3 2, -8 0 C -3 -2, -3 -2, 0 -8 Z" transform="rotate(288)"/>
        </g>
        <circle r="1.8" fill="#F9BCD6"/>
      </g>
      <path id="skPetalPath" d="M0 -10 C 7 -6, 9 3, 3 7 C 1 9, -1 9, -3 7 C -9 3, -7 -6, 0 -10 Z"/>
    </defs>

    <!-- 地平线 -->
    <path d="M0,558 Q400,542 800,556 T1600,548 L1600,600 L0,600 Z" fill="#120E1E"/>
    <path d="M0,578 Q500,566 1000,576 T1600,572 L1600,600 L0,600 Z" fill="#0A0812"/>

    <!-- 落在地上的花瓣 -->
    <g fill="#F9BCD6" opacity=".5">
      <ellipse cx="1120" cy="572" rx="5" ry="3" transform="rotate(-18 1120 572)"/>
      <ellipse cx="1196" cy="582" rx="4.4" ry="2.6" transform="rotate(12 1196 582)"/>
      <ellipse cx="1360" cy="576" rx="4.8" ry="2.8" transform="rotate(-6 1360 576)"/>
      <ellipse cx="980" cy="584" rx="4.2" ry="2.5" transform="rotate(22 980 584)"/>
      <ellipse cx="1290" cy="590" rx="4" ry="2.4" transform="rotate(-14 1290 590)"/>
    </g>

    <!-- 树本体 -->
    <g transform="translate(818,0) scale(1.06)">
      <!-- 树下光晕 -->
      <ellipse cx="300" cy="520" rx="168" ry="24" fill="url(#skShadow)"/>

      <!-- 树干：S 形上升 + 双侧对称分枝 -->
      <g fill="none" stroke="#8A7358" stroke-linecap="round">
        <path stroke-width="14" d="M300 520 C 288 470, 312 430, 298 380 C 286 336, 314 300, 300 258"/>
        <path stroke-width="8" d="M294 400 C 260 380, 234 360, 214 332"/>
        <path stroke-width="8" d="M306 400 C 340 380, 366 360, 386 332"/>
        <path stroke-width="6" d="M299 330 C 268 310, 248 292, 236 268"/>
        <path stroke-width="6" d="M303 330 C 334 310, 354 292, 366 268"/>
        <path stroke-width="5" d="M301 282 C 280 262, 270 248, 266 232"/>
        <path stroke-width="5" d="M301 282 C 322 262, 332 248, 336 232"/>
      </g>

      <!-- 花冠：两层粉调叠加 -->
      <circle cx="300" cy="245" r="150" fill="url(#skSoft)"/>
      <circle cx="200" cy="300" r="75" fill="url(#skSoft)" opacity=".8"/>
      <circle cx="400" cy="300" r="75" fill="url(#skSoft)" opacity=".8"/>
      <circle cx="235" cy="240" r="62" fill="url(#skSoft)" opacity=".7"/>
      <circle cx="365" cy="240" r="62" fill="url(#skSoft)" opacity=".7"/>
      <circle cx="242" cy="320" r="48" fill="url(#skSoft)" opacity=".6"/>
      <circle cx="358" cy="320" r="48" fill="url(#skSoft)" opacity=".6"/>
      <circle cx="300" cy="250" r="100" fill="url(#skInner)"/>
      <circle cx="245" cy="290" r="52" fill="url(#skInner)" opacity=".8"/>
      <circle cx="355" cy="290" r="52" fill="url(#skInner)" opacity=".8"/>

      <!-- 细画的小花：放大后必须加密，否则花冠像一团发光的雾 -->
      <use href="#skFlower" transform="translate(262 218)"/>
      <use href="#skFlower" transform="translate(338 232) scale(0.85)"/>
      <use href="#skFlower" transform="translate(300 290) scale(0.9)"/>
      <use href="#skFlower" transform="translate(218 288) scale(0.8)"/>
      <use href="#skFlower" transform="translate(382 292) scale(0.8)"/>
      <use href="#skFlower" transform="translate(196 246) scale(0.72)"/>
      <use href="#skFlower" transform="translate(404 250) scale(0.72)"/>
      <use href="#skFlower" transform="translate(246 186) scale(0.76)"/>
      <use href="#skFlower" transform="translate(356 190) scale(0.76)"/>
      <use href="#skFlower" transform="translate(300 168) scale(0.7)"/>
      <use href="#skFlower" transform="translate(232 330) scale(0.68)"/>
      <use href="#skFlower" transform="translate(368 330) scale(0.68)"/>
      <use href="#skFlower" transform="translate(300 344) scale(0.72)"/>

      <!-- 树上摇曳的花瓣 -->
      <g fill="url(#skPetal)" opacity=".85">
        <g transform="translate(158 380)"><g class="skpetal" style="animation-duration:5s"><use href="#skPetalPath"/></g></g>
        <g transform="translate(452 330)"><g class="skpetal" style="animation-duration:5.6s;animation-delay:-1.2s"><use href="#skPetalPath"/></g></g>
        <g transform="translate(398 452) scale(0.85)"><g class="skpetal" style="animation-duration:6.4s;animation-delay:-2.5s"><use href="#skPetalPath"/></g></g>
        <g transform="translate(210 462) scale(0.9)"><g class="skpetal" style="animation-duration:7.2s;animation-delay:-0.8s"><use href="#skPetalPath"/></g></g>
        <g transform="translate(320 160) scale(0.8)"><g class="skpetal" style="animation-duration:8s;animation-delay:-4s"><use href="#skPetalPath"/></g></g>
      </g>
    </g>
  </svg>
</div>

<div class="sk-fog"></div>
<div class="petals" id="petals"></div>`
  };

  /* ── 四季场景 ─────────────────────────────────────────────
     移植自「樱花系列设计储备 / 02-交互版 / 四季.html」。
     原图是竖构图 900×1200 的浅色纸感插画，这里不改风格，
     只在横屏里居中显示、两侧用该季天空色补齐，诗句直接用原图自带的。 */
  var SS_NS = 'http://www.w3.org/2000/svg';
  function sel(t, a, p) {
    var e = document.createElementNS(SS_NS, t);
    for (var k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var SS_BR = [
    [452,1008, 448,920, 452,830, 42],
    [452,900,  390,840, 330,760, 18],
    [452,890,  530,830, 585,755, 18],
    [452,860,  420,800, 390,720, 13],
    [452,850,  490,790, 520,715, 13],
    [451,820,  448,760, 452,690, 14],
    [450,880,  400,845, 355,815, 9],
    [455,878,  510,842, 555,812, 9]
  ];
  var SS_REGIONS = [
    [300,600,130,110],[600,590,140,115],[450,470,120,130],[450,645,160,100],
    [560,705,105,75],[340,705,100,72],[660,540,75,65],[248,535,65,60],[455,555,95,85],
    [380,470,80,70],[540,460,80,70]
  ];

  function ssBranches(p) {
    SS_BR.forEach(function (b) {
      sel('path', { d: 'M' + b[0] + ' ' + b[1] + ' Q' + b[2] + ' ' + b[3] + ' ' + b[4] + ' ' + b[5],
        stroke: '#7a4a38', 'stroke-width': b[6], fill: 'none', 'stroke-linecap': 'round', opacity: .92 }, p);
    });
    sel('path', { d: 'M446 1000 Q443 940 446 880', stroke: '#96604a', 'stroke-width': 9,
      fill: 'none', 'stroke-linecap': 'round', opacity: .6 }, p);
    [438, 448, 458, 468].forEach(function (x) {
      sel('path', { d: 'M' + x + ' 1008 q' + rnd(-3, 3) + ' -10 ' + rnd(-5, 5) + ' -14',
        stroke: '#6da84e', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, p);
    });
  }

  function ssCluster(p, x, y, r, pal, light, sh) {
    var g = sel('g', {}, p);
    sel('circle', { cx: x, cy: y, r: r, fill: pick(pal), opacity: .72 }, g);
    var n = 4 + (Math.random() * 4 | 0);
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.28), d = r * rnd(.3, .65);
      sel('circle', { cx: x + Math.cos(a) * d, cy: y + Math.sin(a) * d * .8,
        r: r * rnd(.4, .62), fill: pick(light), opacity: .85 }, g);
    }
    if (sh && Math.random() < .35) sel('circle', { cx: x + rnd(-.4, .4) * r, cy: y + r * .5, r: r * .4, fill: sh, opacity: .35 }, g);
  }

  function ssBlossom(p, x, y, sc, col, core) {
    var g = sel('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + sc + ')', opacity: .9 }, p);
    for (var k = 0; k < 5; k++) {
      var a = k / 5 * 6.283 - Math.PI / 2;
      sel('ellipse', { cx: Math.cos(a) * 3.6, cy: Math.sin(a) * 3.6, rx: 2.9, ry: 2.2,
        transform: 'rotate(' + (k * 72) + ' ' + (Math.cos(a) * 3.6) + ' ' + (Math.sin(a) * 3.6) + ')', fill: col }, g);
    }
    sel('circle', { cx: 0, cy: 0, r: 1.4, fill: core }, g);
  }

  function ssCrown(p, pal, light, shade) {
    SS_REGIONS.forEach(function (R) {
      var cx = R[0], cy = R[1], rx = R[2], ry = R[3];
      var n = Math.round(rx * ry / 620);
      for (var i = 0; i < n; i++) {
        var a = rnd(0, 6.28), d = Math.sqrt(Math.random());
        ssCluster(p, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rnd(16, 34), pal, light, shade);
      }
    });
    for (var i = 0; i < 16; i++) {
      var a = rnd(0, 6.28);
      ssCluster(p, 460 + Math.cos(a) * rnd(160, 235), 570 + Math.sin(a) * rnd(115, 170), rnd(9, 17), pal, light, shade);
    }
    for (var j = 0; j < 12; j++) ssCluster(p, 452 + rnd(-90, 90), 730 + rnd(-40, 40), rnd(20, 32), pal, light, shade);
    [[300,660,125,34],[600,660,135,36],[450,705,155,32],[340,725,95,22],[560,735,100,24]].forEach(function (g) {
      sel('ellipse', { cx: g[0], cy: g[1], rx: g[2], ry: g[3], fill: shade, opacity: .4 }, p);
    });
  }

  function ssGround(p, c1, c2, c3, c4) {
    sel('ellipse', { cx: 450, cy: 1012, rx: 290, ry: 62, fill: c1, opacity: .8 }, p);
    sel('ellipse', { cx: 310, cy: 1000, rx: 140, ry: 42, fill: c2, opacity: .85 }, p);
    sel('ellipse', { cx: 580, cy: 1010, rx: 150, ry: 44, fill: c3, opacity: .85 }, p);
    sel('ellipse', { cx: 450, cy: 1030, rx: 170, ry: 40, fill: c4, opacity: .7 }, p);
  }

  function ssClouds(p, list) {
    list.forEach(function (c) {
      sel('ellipse', { cx: c[0], cy: c[1], rx: c[2], ry: c[3], fill: c[4], opacity: c[5], filter: 'url(#ssSoft)' }, p);
    });
  }

  function ssHills(p, c) {
    sel('path', { d: 'M0 800 Q180 720 360 780 Q560 840 900 750 L900 900 L0 900 Z',
      fill: c, opacity: .5, filter: 'url(#ssWet)' }, p);
  }

  function ssTitle(p, main, sub) {
    sel('text', { x: 450, y: 180, 'text-anchor': 'middle', fill: '#6b5a4a', 'font-size': '58',
      'font-family': '"Kaiti SC","STKaiti","MaShanZheng",serif', 'letter-spacing': '14' }, p).textContent = main;
    sel('text', { x: 450, y: 228, 'text-anchor': 'middle', fill: '#8a7a6a', 'font-size': '24',
      'font-family': '"Kaiti SC","STKaiti","MaShanZheng",serif', 'letter-spacing': '6' }, p).textContent = sub;
  }

  function ssFall(p, n, mk) {
    for (var i = 0; i < n; i++) {
      var x0 = rnd(60, 840), d = rnd(7, 15), y1 = rnd(250, 600), y2 = rnd(880, 1080);
      var e = mk();
      sel('animateTransform', { attributeName: 'transform', type: 'translate',
        values: x0 + ' ' + y1 + ';' + (x0 + rnd(-55, 55)) + ' ' + ((y1 + y2) / 2) + ';' + (x0 + rnd(-85, 85)) + ' ' + y2,
        dur: d + 's', repeatCount: 'indefinite', begin: (-rnd(0, d)) + 's' }, e);
      sel('animateTransform', { attributeName: 'transform', type: 'rotate',
        values: '0;' + rnd(-180, 180) + ';' + rnd(-360, 360), dur: d + 's', repeatCount: 'indefinite',
        begin: (-rnd(0, d)) + 's', additive: 'sum' }, e);
      sel('animate', { attributeName: 'opacity', values: '.85;.85;0', keyTimes: '0;.8;1',
        dur: d + 's', repeatCount: 'indefinite', begin: (-rnd(0, d)) + 's' }, e);
    }
  }
  function ssPetal(p) {
    return sel('path', { d: 'M0 -3 Q5 0 0 4 Q-5 0 0 -3', fill: pick(['#f7b3c5', '#fbd6df', '#f2a0b6']), opacity: .85 }, p);
  }
  function ssLeaf(p) {
    return sel('path', { d: 'M0 -4 Q5 0 0 5 Q-5 0 0 -4',
      fill: pick(['#d98243', '#c9653a', '#f0b86a', '#7cba62', '#5a9e58']), opacity: .85 }, p);
  }
  function ssSnow(p) {
    return sel('circle', { cx: 0, cy: 0, r: rnd(2, 3.6), fill: '#fff', opacity: .9 }, p);
  }

  /* 四季配色表：idx 0春 1夏 2秋 3冬 */
  var SS_PALETTE = [
    { bg:'#cfe4f4', sky:'url(#ssSkySp)', clouds:[[200,170,270,140,'#eaf4fb',.9],[120,330,220,120,'#f6fafc',.85],[720,80,210,110,'#d8ecf9',.75]],
      hill:'#a8c8b8', ground:['#8fc46a','#b6d97e','#6aae55','#4f9c5f'],
      crown:['#f2a0b6','#f4a9bd','#ee95ad','#f7b8c9'], light:['#f9c6d3','#fbd6df','#fce3ea'], shade:'#d67f9c',
      glow:'#f7c6d4', grass:['#4a9a45','#5fae52','#37845c'], name:'春', poem:'人面桃花相映红', fallN:20, fall:'petal' },
    { bg:'#b8dced', sky:'url(#ssSkySu)', clouds:[[250,150,280,130,'#f2fbf3',.9],[700,100,200,100,'#ffffff',.7]],
      hill:'#7ab894', ground:['#4f9c50','#7cba62','#3f8f4d','#357a45'],
      crown:['#5a9e58','#6bb06a','#4c8f52'], light:['#8cc58a','#a5d69c','#79b877'], shade:'#3f7a46',
      glow:'#9ccf8f', grass:['#3a8a42','#54a352','#2f7a50'], name:'夏', poem:'绿树阴浓夏日长', fallN:10, fall:'leaf' },
    { bg:'#f2d8ad', sky:'url(#ssSkyAu)', clouds:[[220,160,250,120,'#fbe8c8',.9],[700,90,190,100,'#f9ddb0',.8]],
      hill:'#c9a06a', ground:['#c98a4e','#d9a860','#b0713d','#96602f'],
      crown:['#d98243','#e09a4e','#c9653a'], light:['#f0b86a','#f2c982','#e8a35a'], shade:'#a84f2e',
      glow:'#e8a05e', grass:['#a86a35','#c08a4a','#8a5530'], name:'秋', poem:'霜叶红于二月花', fallN:24, fall:'leaf' },
    { bg:'#e2ebf3', sky:'url(#ssSkyWi)', clouds:[[220,160,250,120,'#eef4f9',.9],[700,100,200,100,'#e2ecf4',.8]],
      hill:'#c5d4e2', ground:['#e8eff5','#ffffff','#d5e2ec','#c2d3e0'],
      crown:['#e8eef4','#f4f8fb','#dde7ef'], light:['#ffffff','#f8fbfd'], shade:'#b8c8d8',
      glow:'#dfe9f2', grass:['#9db3a8','#9db3a8','#8fa79c'], name:'冬', poem:'千树万树梨花开', fallN:36, fall:'snow' }
  ];

  function buildSeason(layer, idx) {
    var svg = layer.querySelector('#ssSvg');
    if (!svg) return;
    var pal = SS_PALETTE[idx];
    var wrap = layer.querySelector('.ss-wrap');
    if (wrap) wrap.style.background = pal.bg;
    svg.innerHTML = '';

    /* 滤镜和天空渐变 */
    var defs = sel('defs', {}, svg);
    sel('filter', { id: 'ssSoft', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    sel('feGaussianBlur', { stdDeviation: '2.2' }, defs.lastChild);
    sel('filter', { id: 'ssWet', x: '-25%', y: '-25%', width: '150%', height: '150%' }, defs);
    var wet = defs.lastChild;
    sel('feGaussianBlur', { stdDeviation: '1.2', result: 'b' }, wet);
    sel('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.028', numOctaves: '3', seed: '11', result: 'n' }, wet);
    sel('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '14' }, wet);
    sel('radialGradient', { id: 'ssVig', cx: '50%', cy: '42%', r: '80%' }, defs);
    var vg = defs.lastChild;
    sel('stop', { offset: '65%', 'stop-color': '#000', 'stop-opacity': '0' }, vg);
    sel('stop', { offset: '100%', 'stop-color': '#8a6a5a', 'stop-opacity': '0.14' }, vg);

    var skies = [['ssSkySp','#bcd9f2','#e8f3fa'],['ssSkySu','#8ec9e8','#dff2e2'],
                 ['ssSkyAu','#f6d9a8','#fdf1dd'],['ssSkyWi','#d7e3ee','#f5f8fb']];
    skies.forEach(function (sk) {
      sel('linearGradient', { id: sk[0], x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
      var g = defs.lastChild;
      sel('stop', { offset: '0%', 'stop-color': sk[1] }, g);
      sel('stop', { offset: '100%', 'stop-color': sk[2] }, g);
    });

    sel('rect', { width: 900, height: 1200, fill: '#fdfbf7' }, svg);
    var layerG = sel('g', {}, svg);

    sel('rect', { width: 900, height: 900, fill: pal.sky, opacity: .9 }, layerG);
    ssClouds(layerG, pal.clouds);
    ssHills(layerG, pal.hill);
    ssGround(layerG, pal.ground[0], pal.ground[1], pal.ground[2], pal.ground[3]);
    ssBranches(layerG);

    var i, g;
    for (i = 0; i < 34; i++) {
      sel('path', { d: 'M' + rnd(200, 700) + ' ' + rnd(975, 1050) + ' q' + rnd(-2, 2) + ' -8 ' + rnd(-4, 4) + ' -' + rnd(10, 16),
        stroke: pick(pal.grass), 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round', opacity: .8 }, layerG);
    }

    var glow = sel('g', { filter: 'url(#ssSoft)' }, layerG);
    SS_REGIONS.forEach(function (R) {
      sel('ellipse', { cx: R[0], cy: R[1], rx: R[2] * 1.35, ry: R[3] * 1.3, fill: pal.glow, opacity: .42 }, glow);
    });

    var crown = sel('g', { filter: 'url(#ssSoft)' }, layerG);
    ssCrown(crown, pal.crown, pal.light, pal.shade);

    /* 树上细画的小花（春夏秋；冬天没有） */
    if (idx !== 3) {
      var fl = sel('g', {}, layerG);
      for (i = 0; i < 40; i++) {
        var R = SS_REGIONS[Math.random() * SS_REGIONS.length | 0];
        var x = R[0] + rnd(-R[2] * .8, R[2] * .8), y = R[1] + rnd(-R[3] * .8, R[3] * .8);
        if (y > 770 || y < 395) continue;
        ssBlossom(fl, x, y, rnd(.8, 1.6), idx === 0 ? pick(['#fff', '#feeef3', '#fde3ea']) : '#fff', '#f2c94c');
      }
    }

    /* 地上落下的花瓣/叶/雪 */
    var groundC = idx === 0 ? '#fbd6df' : (idx === 3 ? '#ffffff' : pick(pal.light));
    for (i = 0; i < 40; i++) {
      sel('circle', { cx: rnd(210, 690), cy: rnd(972, 1050), r: rnd(2, 4.5), fill: groundC, opacity: rnd(.5, .9) }, layerG);
    }

    ssFall(layerG, pal.fallN, function () {
      return pal.fall === 'petal' ? ssPetal(layerG) : (pal.fall === 'snow' ? ssSnow(layerG) : ssLeaf(layerG));
    });

    ssTitle(layerG, pal.name, pal.poem);

    /* 纸纹 + 暗角 */
    sel('rect', { width: 900, height: 1200, fill: 'url(#ssVig)' }, svg);
  }

  SCENES.season = {
    html: '<div class="ss-wrap"><svg id="ssSvg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid meet"></svg></div>',
    init: function (layer) {
      var m = new Date().getMonth() + 1;      /* 1-12 */
      var idx = m >= 3 && m <= 5 ? 0 : (m >= 6 && m <= 8 ? 1 : (m >= 9 && m <= 11 ? 2 : 3));
      /* 带 ?season=xxx 时按名字精确取，否则按月份 */
      var named = document.documentElement.getAttribute('data-season');
      if (named === 'spring') idx = 0;
      else if (named === 'summer') idx = 1;
      else if (named === 'autumn') idx = 2;
      else if (named === 'winter') idx = 3;
      buildSeason(layer, idx);
    }
  };

  function applyScene() {
    var f = window.__festival;

    /* 优先级：节日指定了 scene 就用节日的，否则退回季节，都没有就不动。
       注意 data-season 的值是 spring/summer/autumn/winter，
       而场景注册的键统一叫 season，这里要映射一下。 */
    var seasonName = document.documentElement.getAttribute('data-season');
    var key = (f && f.scene) || (seasonName ? 'season' : null);
    if (!key) return;

    var def = SCENES[key];
    if (!def) return;

    var layer = document.getElementById('sceneLayer');
    if (!layer) return;

    /* 场景有两种形态：纯 HTML 字符串，或者 {html, init}（init 用来现画） */
    if (typeof def === 'string') {
      layer.innerHTML = def;
    } else {
      layer.innerHTML = def.html;
      if (def.init) def.init(layer);
    }

    document.documentElement.setAttribute('data-scene', key);
    refreshSceneRefs();

    /* 场景里没有幽灵就别再提示「点一点小幽灵」 */
    if (!ghostContainer) {
      var ch = $('#catchHint');
      if (ch) ch.style.display = 'none';
    }
  }

  if (window.__festival) applyScene();
  document.addEventListener('festival-ready', applyScene);

  /* ── 小幽灵 ─────────────────────────────────────────────── */
  /* 身体 / 眼睛 / 嘴 / 腮红拆成零件，品种只拼装饰上去，
     不用每个都重抄一遍路径。 */
  var G_BODY = '<path d="M 40 135 Q 48 150 58 136 Q 68 150 78 136 Q 88 150 98 136 Q 108 150 118 136 Q 128 150 138 136 Q 148 150 158 135 L 158 92 Q 158 34 100 34 Q 42 34 42 92 Z" fill="#fff"/>';
  var G_EYES = '<ellipse cx="80" cy="92" rx="8" ry="10" fill="#1a1a1a"/><ellipse cx="120" cy="92" rx="8" ry="10" fill="#1a1a1a"/>';
  var G_MOUTH = '<ellipse cx="100" cy="110" rx="6" ry="7" fill="#1a1a1a"/>';
  var G_BLUSH = '<ellipse cx="64" cy="108" rx="11" ry="7" fill="#ffb6c8"/><ellipse cx="136" cy="108" rx="11" ry="7" fill="#ffb6c8"/>';

  function gsvg(inner) {
    return '<svg width="70" height="65" viewBox="0 0 200 180">' + inner + '</svg>';
  }

  var GHOST_SVGS = [
    /* 1 标准 */
    gsvg(G_BODY + G_EYES + G_MOUTH + G_BLUSH),

    /* 2 圆头（底边单独一层，显得更软） */
    gsvg('<ellipse cx="100" cy="95" rx="58" ry="56" fill="#fff"/><path d="M 44 132 Q 52 146 62 134 Q 72 146 82 134 Q 92 146 102 134 Q 112 146 122 134 Q 132 146 142 134 Q 152 146 156 132 L 156 95 Q 156 40 100 40 Q 44 40 44 95 Z" fill="#fff"/><ellipse cx="80" cy="95" rx="8" ry="10" fill="#1a1a1a"/><ellipse cx="120" cy="95" rx="8" ry="10" fill="#1a1a1a"/><ellipse cx="100" cy="115" rx="7" ry="8" fill="#1a1a1a"/><ellipse cx="64" cy="112" rx="11" ry="7" fill="#ffb6c8"/><ellipse cx="136" cy="112" rx="11" ry="7" fill="#ffb6c8"/>'),

    /* 3 眨眼 + 小星星 */
    gsvg('<g transform="rotate(-6 100 100)">' + G_BODY + '<path d="M 72 88 Q 78 82 84 88" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M 116 88 Q 122 82 128 88" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M 88 110 Q 100 120 112 110" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="106" rx="11" ry="7" fill="#ffb6c8"/><ellipse cx="140" cy="106" rx="11" ry="7" fill="#ffb6c8"/></g><path d="M 150 30 l 4 8 9 1 -6.5 6 2 9 -8.5 -4.5 -8.5 4.5 2 -9 -6.5 -6 9 -1 Z" fill="#ff5fa2"/>'),

    /* 4 戴蝴蝶结（呼应站点的 🎀） */
    gsvg('<path d="M 100 26 C 76 6, 58 16, 68 34 C 75 46, 92 38, 100 30 C 108 38, 125 46, 132 34 C 142 16, 124 6, 100 26 Z" fill="#ff5fa2" stroke="#ff8fb8" stroke-width="2"/><circle cx="100" cy="30" r="7" fill="#ff8fb8"/>' + G_BODY + G_EYES + G_MOUTH + G_BLUSH),

    /* 5 独眼 */
    gsvg(G_BODY + '<ellipse cx="100" cy="96" rx="16" ry="19" fill="#1a1a1a"/><circle cx="107" cy="89" r="5.5" fill="#fff"/><path d="M 91 122 Q 100 129 109 122" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="62" cy="112" rx="11" ry="7" fill="#ffb6c8"/><ellipse cx="138" cy="112" rx="11" ry="7" fill="#ffb6c8"/>'),

    /* 6 睡着 + Zz */
    gsvg(G_BODY + '<path d="M 70 92 Q 80 101 90 92" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M 110 92 Q 120 101 130 92" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="112" rx="5" ry="6" fill="#1a1a1a"/>' + G_BLUSH + '<path d="M 145 34 h 13 l -13 13 h 13" stroke="#ff8fb8" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M 166 16 h 9 l -9 9 h 9" stroke="#ff8fb8" stroke-width="3" fill="none" stroke-linejoin="round"/>'),

    /* 7 猫耳：粗描边 + round join 磨圆尖角；内耳要够深，浅粉压在白底上会糊成一片白 */
    gsvg('<path d="M 58 70 L 60 18 L 94 54 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M 66 62 L 68 30 L 85 53 Z" fill="#ff8fb8" stroke="#ff8fb8" stroke-width="2" stroke-linejoin="round"/><path d="M 142 70 L 140 18 L 106 54 Z" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round"/><path d="M 134 62 L 132 30 L 115 53 Z" fill="#ff8fb8" stroke="#ff8fb8" stroke-width="2" stroke-linejoin="round"/>' + G_BODY + G_EYES + G_MOUTH + G_BLUSH),

    /* 8 星星眼 */
    gsvg(G_BODY + '<path d="M 80 76 L 85 88 L 97 93 L 85 98 L 80 110 L 75 98 L 63 93 L 75 88 Z" fill="#1a1a1a"/><path d="M 120 76 L 125 88 L 137 93 L 125 98 L 120 110 L 115 98 L 103 93 L 115 88 Z" fill="#1a1a1a"/><path d="M 90 112 Q 100 119 110 112" stroke="#1a1a1a" stroke-width="4.5" fill="none" stroke-linecap="round"/>' + G_BLUSH)
  ];

  var ghosts = [], GHOST_COUNT = isMobile ? 4 : 6;

  function shuffled(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function createGhosts() {
    if (!ghostContainer) return false;          // 中秋这类场景没有幽灵容器
    if (!window.__festival) return false;       // 不是节日就别放幽灵，日常该安静点
    var pool = shuffled(GHOST_SVGS.slice());
    for (var i = 0; i < GHOST_COUNT; i++) {
      var g = document.createElement('div');
      g.className = 'ghost';
      g.innerHTML = pool[i % pool.length] + '<span class="excited">👻</span>';
      g.style.transform = 'scale(' + (.7 + Math.random() * .6) + ')';

      var x, y;
      do {
        x = Math.random() * 85 + 3;
        y = Math.random() * 55 + 8;
      } while (x > 35 && x < 60 && y > 40);

      g.style.left = x + '%';
      g.style.top = y + '%';
      g.dataset.baseX = x;
      g.dataset.baseY = y;

      startWander(g, i);
      g.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        dodgeGhost(this);
      });
      ghostContainer.appendChild(g);
      ghosts.push(g);
    }
    return true;
  }

  function startWander(g, idx) {
    var speed = 4 + Math.random() * 5;
    function move() {
      if (killed || !document.body.contains(g)) return;
      var x = Math.random() * 85 + 3;
      var y = Math.random() * 55 + 8;
      if (x > 35 && x < 60 && y > 40) y = Math.random() * 30 + 8;
      g.style.transition = 'left ' + speed + 's ease-in-out, top ' + speed + 's ease-in-out';
      g.style.left = x + '%';
      g.style.top = y + '%';
      g.dataset.baseX = x;
      g.dataset.baseY = y;
      g._wanderTimer = setTimeout(move, speed * 1000 + Math.random() * 2000);
    }
    g._wanderTimer = setTimeout(move, idx * 1500);
  }

  function dodgeGhost(g) {
    var dx = (Math.random() > .5 ? 1 : -1) * (60 + Math.random() * 80),
        dy = -(30 + Math.random() * 60),
        rot = (Math.random() - .5) * 30;
    g.style.setProperty('--dx', dx + 'px');
    g.style.setProperty('--dy', dy + 'px');
    g.style.setProperty('--rot', rot + 'deg');
    g.classList.add('dodge');
    playBoing();
    clearTimeout(g._dodgeTimer);
    g._dodgeTimer = setTimeout(function () {
      if (killed) return;
      g.classList.remove('dodge');
      g.style.transition = 'left 1.5s ease-in-out, top 1.5s ease-in-out';
      g.style.left = g.dataset.baseX + '%';
      g.style.top = g.dataset.baseY + '%';
    }, 700);
  }

  function dodgeAround(e) {
    var px = e.clientX, py = e.clientY;
    ghosts.forEach(function (g) {
      var r = g.getBoundingClientRect(),
          gx = r.left + r.width / 2,
          gy = r.top + r.height / 2;
      if (Math.hypot(px - gx, py - gy) < 120 && !g.classList.contains('dodge')) dodgeGhost(g);
    });
  }
  window.addEventListener('pointerdown', dodgeAround);

  /* ── 花瓣 ───────────────────────────────────────────────── */
  function createPetals() {
    if (reduceMotion || !petalsContainer) return;
    var n = isMobile ? 10 : 18;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--drift', ((Math.random() - .5) * 160) + 'px');
      p.style.animationDuration = (9 + Math.random() * 8) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      var s = 7 + Math.random() * 6;
      p.style.width = s + 'px';
      p.style.height = s + 'px';
      petalsContainer.appendChild(p);
    }
  }

  function triggerGlowPulse(t) {
    glowPulse.className = 'glow-pulse';
    void glowPulse.offsetWidth;
    glowPulse.classList.add(t || 'soft-1');
  }

  /* ── 音景（Web Audio 合成，没有音频文件） ───────────────── */
  function initAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      /* 必须先用 setValueAtTime 把起点钉在 0，只写 value=0 再 ramp 在某些浏览器里
         会把起点算成"上一次自动化事件的结束时间"，一上来就是一声闷响 */
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
      masterGain.gain.linearRampToValueAtTime(.38, audioCtx.currentTime + 2.5);
      return true;
    } catch (e) { return false; }
  }

  /* 已停用：原来那层持续 pad 是开场"wen wen wen"低频嗡声的来源，
     现在改由 SONGS 里的四首曲子承担铺底，这个函数保留但不再调用。 */
  function createAmbientPad() {
    if (!audioCtx) return;
    var padGain = audioCtx.createGain();
    padGain.gain.setValueAtTime(0, audioCtx.currentTime);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    /* 高通抬到 180Hz：这个频段以下在笔记本喇叭上听不出音高，只会糊成一片"嗡嗡"。
       原来还有个 130.81Hz(C3) 的根音，是"wen"声的主要来源，直接去掉。 */
    var hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 180;
    [196, 261.63, 392].forEach(function (f) {
      var o = audioCtx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(padGain);
      o.start();
    });
    var lfo = audioCtx.createOscillator(), lg = audioCtx.createGain();
    lfo.frequency.value = .15;
    lg.gain.value = .04;
    lfo.connect(lg);
    lg.connect(padGain.gain);
    lfo.start();
    padGain.connect(hp);
    hp.connect(filter);
    filter.connect(masterGain);
    padGain.gain.linearRampToValueAtTime(.055, audioCtx.currentTime + 5);
  }

  function noiseBuffer(seconds) {
    var len = Math.floor(audioCtx.sampleRate * seconds);
    var b = audioCtx.createBuffer(1, len, audioCtx.sampleRate),
        d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    /* 首尾各做 60ms 淡化。不做的话循环接缝处波形突变，
       每 loop 一次就"咔"一声，听起来像规律的低频嗡 */
    var fade = Math.floor(audioCtx.sampleRate * 0.06);
    for (var k = 0; k < fade; k++) {
      var r = k / fade;
      d[k] *= r;
      d[len - 1 - k] *= r;
    }
    return b;
  }

  function createWind() {
    if (!audioCtx) return;
    var s = audioCtx.createBufferSource();
    s.buffer = noiseBuffer(3);
    s.loop = true;
    var f = audioCtx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 350;
    var g = audioCtx.createGain();
    g.gain.value = 0;
    s.connect(f);
    f.connect(g);
    g.connect(masterGain);
    s.start();
    g.gain.linearRampToValueAtTime(.018, audioCtx.currentTime + 4);
    var lfo = audioCtx.createOscillator(), lg = audioCtx.createGain();
    lfo.frequency.value = .08;
    lg.gain.value = 150;
    lfo.connect(lg);
    lg.connect(f.frequency);
    lfo.start();
  }

  function createRainSound() {
    if (!audioCtx) return;
    var s = audioCtx.createBufferSource();
    s.buffer = noiseBuffer(2);
    s.loop = true;
    var f = audioCtx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1200;
    f.Q.value = .5;
    var g = audioCtx.createGain();
    g.gain.value = 0;
    s.connect(f);
    f.connect(g);
    g.connect(masterGain);
    s.start();
    g.gain.linearRampToValueAtTime(.035, audioCtx.currentTime + 3);
  }

  function playBell(baseFreq) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    [{ f: 1, g: .25, d: 4 }, { f: 2, g: .13, d: 3 }, { f: 2.4, g: .09, d: 2.5 }, { f: 3, g: .07, d: 2 }]
      .forEach(function (h) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = baseFreq * h.f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(h.g, t + .02);
        g.gain.exponentialRampToValueAtTime(.001, t + h.d);
        o.connect(g);
        g.connect(masterGain);
        o.start(t);
        o.stop(t + h.d);
      });
  }

  function playChime(freq) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    [[1, .16, 2], [2, .09, 1.5], [1.5, .07, 1.8]].forEach(function (h) {
      var o = audioCtx.createOscillator(), gn = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * h[0];
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(h[1], t + .005);
      gn.gain.exponentialRampToValueAtTime(.001, t + h[2]);
      o.connect(gn);
      gn.connect(masterGain);
      o.start(t);
      o.stop(t + h[2]);
    });
  }

  function playBoing() {
    if (!audioCtx || killed) return;
    var t = audioCtx.currentTime;
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, t);
    o.frequency.exponentialRampToValueAtTime(1000, t + .08);
    o.frequency.exponentialRampToValueAtTime(500, t + .18);
    g.gain.setValueAtTime(.12, t);
    g.gain.exponentialRampToValueAtTime(.001, t + .25);
    o.connect(g);
    g.connect(masterGain);
    o.start(t);
    o.stop(t + .3);
  }

  function playMagicBloom() {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(1600, t + 1.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.14, t + .3);
    g.gain.exponentialRampToValueAtTime(.001, t + 2);
    o.connect(g);
    g.connect(masterGain);
    o.start(t);
    o.stop(t + 2);
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      var oo = audioCtx.createOscillator(), gg = audioCtx.createGain();
      oo.type = 'sine';
      oo.frequency.value = f;
      gg.gain.setValueAtTime(0, t + .3);
      gg.gain.linearRampToValueAtTime(.07, t + .4 + i * .1);
      gg.gain.exponentialRampToValueAtTime(.001, t + 3);
      oo.connect(gg);
      gg.connect(masterGain);
      oo.start(t + .3);
      oo.stop(t + 3);
    });
  }

  function playCurtainSound() {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var b = noiseBuffer(4), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] *= .3;
    var s = audioCtx.createBufferSource();
    s.buffer = b;
    var f = audioCtx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 500;
    f.Q.value = 1;
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.035, t + .5);
    g.gain.exponentialRampToValueAtTime(.001, t + 4);
    s.connect(f);
    f.connect(g);
    g.connect(masterGain);
    s.start(t);
    s.stop(t + 4);
  }

  /* ── 四季配乐（MIDI 式音符序列，Web Audio 现场合成） ─────
     每首 16 拍，循环播放。音符格式 [音高, 起始拍, 时值拍, 力度]，
     音高用 MIDI 编号（60 = C4 / 中央 C）。 */
  var SONGS = [
    { /* 春 · 樱 —— C 大调五声，轻快上行 */
      bpm: 92, wave: 'triangle', vol: .55,
      notes: [
        [72,0,.5,.22],[76,.75,.5,.20],[79,1.5,.5,.22],[81,2,.5,.20],[79,2.5,.5,.18],
        [76,3,.5,.20],[74,3.5,.5,.17],[72,4,1,.22],[74,5,.5,.18],[76,5.5,.5,.20],
        [67,6,.5,.18],[72,6.5,.5,.20],[76,7,.5,.22],[74,7.5,.5,.18],
        [72,8,2,.22],
        [76,10,.5,.20],[79,10.5,.5,.22],[81,11,.5,.20],[84,11.5,.5,.22],
        [81,12,1,.20],[79,13,.5,.18],[76,13.5,.5,.20],
        [74,14,2,.20]
      ],
      bass: [[48,0,8,.05],[55,8,8,.05]]
    },
    { /* 夏 · 蝉 —— F 大调，慵懒的长音 */
      bpm: 76, wave: 'sine', vol: .5,
      notes: [
        [69,0,1,.20],[72,1,1,.21],[74,2,1,.20],[72,3,1,.19],
        [69,4,1.5,.20],[67,5.5,.5,.17],[65,6,2,.19],
        [69,8,1,.20],[72,9,1,.21],[77,10,1,.19],[74,11,1,.20],
        [72,12,2,.20],[69,14,2,.18]
      ],
      bass: [[53,0,8,.045],[60,8,8,.045]]
    },
    { /* 秋 · 落叶 —— A 小调，缓慢下行 */
      bpm: 64, wave: 'triangle', vol: .55,
      notes: [
        [72,0,1.5,.21],[71,1.5,.5,.17],[69,2,2,.22],
        [67,4,1.5,.19],[65,5.5,.5,.16],[64,6,2,.20],
        [62,8,1.5,.19],[64,9.5,.5,.17],[65,10,2,.20],
        [67,12,1.5,.19],[69,13.5,2.5,.20]
      ],
      bass: [[45,0,8,.05],[52,8,8,.05]]
    },
    { /* 冬 · 雪 —— 高音区，稀疏留白 */
      bpm: 56, wave: 'sine', vol: .5,
      notes: [
        [76,0,2,.17],[79,2,2,.16],[83,4,3,.18],
        [81,7,1,.15],[79,8,2,.17],[76,10,2,.16],
        [74,12,2,.15],[71,14,2,.16]
      ],
      bass: [[52,0,8,.045],[59,8,8,.045]]
    }
  ];

  var songTimer = null;

  function midiToFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /* 一个音：短促起音 + 指数衰减，听着像敲击类音色 */
  function tone(midi, t, dur, vel, wave) {
    if (!audioCtx || killed) return;
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.type = wave;
    o.frequency.value = midiToFreq(midi);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(dur, 0.12));
    o.connect(g);
    g.connect(masterGain);
    o.start(t);
    o.stop(t + dur + 0.06);
  }

  /* 低音垫：更长更软，压住整首的骨架 */
  function bassTone(midi, t, dur, vel) {
    if (!audioCtx || killed) return;
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = midiToFreq(midi);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + dur * 0.25);
    g.gain.linearRampToValueAtTime(vel * 0.7, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g);
    g.connect(masterGain);
    o.start(t);
    o.stop(t + dur + 0.06);
  }

  function playSong(idx) {
    if (!audioCtx) return;
    var song = SONGS[idx] || SONGS[0];
    var beat = 60 / song.bpm;
    var loopSec = beat * 16;

    function scheduleLoop() {
      if (killed || !audioCtx) return;
      var t0 = audioCtx.currentTime + 0.08;

      song.notes.forEach(function (n) {
        tone(n[0], t0 + n[1] * beat, n[2] * beat, n[3] * song.vol, song.wave);
      });
      (song.bass || []).forEach(function (b) {
        bassTone(b[0], t0 + b[1] * beat, b[2] * beat, b[3]);
      });

      /* 用 currentTime 重新取起点，不累积误差 */
      songTimer = setTimeout(scheduleLoop, loopSec * 1000 - 40);
    }
    scheduleLoop();
  }

  function seasonIndex() {
    var s = document.documentElement.getAttribute('data-season');
    return s === 'spring' ? 0 : s === 'summer' ? 1 : s === 'autumn' ? 2 : s === 'winter' ? 3 : -1;
  }

  /* ── 收尾：淡出并拆掉整个开场 ───────────────────────────── */
  function teardown() {
    if (killed) return;
    killed = true;

    timers.forEach(clearTimeout);
    timers = [];
    ambTimers.forEach(clearInterval);
    ambTimers = [];
    if (songTimer) { clearTimeout(songTimer); songTimer = null; }
    rainActive = false;
    ghosts.forEach(function (g) {
      clearTimeout(g._wanderTimer);
      clearTimeout(g._dodgeTimer);
    });
    window.removeEventListener('pointerdown', dodgeAround);
    window.removeEventListener('resize', resizeCanvas);
    document.removeEventListener('keydown', onKey);

    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
      masterGain = null;
    }

    document.body.classList.remove('splash-lock');
    root.classList.add('out');
    setTimeout(function () { root.remove(); }, 950);
  }

  /* ── 跳到终态 ───────────────────────────────────────────── */
  function skipToEnd() {
    if (killed) return;
    timers.forEach(clearTimeout);
    timers = [];

    blackout.classList.add('fade');
    curtainLeft.classList.add('open');
    curtainRight.classList.add('open');
    topValance.classList.add('open');
    stage.classList.add('zoom-in');
    caption.classList.add('show');
    catchHint.classList.add('show');
    skipBtn.classList.remove('show');
    audioIndicator.classList.add('show');
    triggerGlowPulse('bloom');
    createPetals();

    if (!rainActive) { rainActive = true; drawRain(); }

    setTimeout(teardown, 2600);
  }

  function onKey(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      skipToEnd();
    }
  }
  skipBtn.addEventListener('click', skipToEnd);
  document.addEventListener('keydown', onKey);

  /* ── 时间轴 ─────────────────────────────────────────────── */
  function startTimeline() {
    /* 配乐替换掉原来那个持续 pad（"wen" 声的来源）。
       节日场景没有 data-season，按当前月份挑一首，保证任何场景都有音乐。 */
    var si = seasonIndex();
    if (si < 0) {
      var mo = new Date().getMonth() + 1;
      si = mo >= 3 && mo <= 5 ? 0 : mo >= 6 && mo <= 8 ? 1 : mo >= 9 && mo <= 11 ? 2 : 3;
    }
    playSong(si);
    createWind();

    timers.push(setTimeout(function () {
      skipBtn.classList.add('show');
      audioIndicator.classList.add('show');
    }, 200));
    /* 钟声是"节日感"的，日常开场不放，只留环境和风 */
    var fest = !!window.__festival;
    timers.push(setTimeout(function () {
      blackout.classList.add('fade');
      if (fest) playBell(196);
    }, 1000));
    timers.push(setTimeout(function () { if (fest) playBell(261.63); }, 3000));
    var hasGhost = false;
    timers.push(setTimeout(function () { hasGhost = createGhosts() === true; }, 3500));
    timers.push(setTimeout(function () {
      curtainLeft.classList.add('open');
      curtainRight.classList.add('open');
      topValance.classList.add('open');
      playCurtainSound();
    }, 4000));
    timers.push(setTimeout(function () { triggerGlowPulse('soft-1'); }, 5500));
    timers.push(setTimeout(function () {
      /* 只有默认城堡场景才有雨；季节场景换成各季的特征音色 */
      if (rainCanvas) {
        rainActive = true;
        drawRain();
        createRainSound();
      }
      triggerGlowPulse('soft-2');
    }, 8000));
    /* 镜头推向城堡 */
    timers.push(setTimeout(function () { stage.classList.add('zoom-in'); }, 10500));
    /* 光圈 + 魔法音 */
    timers.push(setTimeout(function () {
      speakEffect.classList.add('burst');
      triggerGlowPulse('bloom');
      playMagicBloom();
    }, 12000));
    /* 字幕 */
    timers.push(setTimeout(function () {
      caption.classList.add('show');
      if (fest) playBell(329.63);
    }, 12500));
    /* 花瓣 + 提示 */
    timers.push(setTimeout(function () {
      createPetals();
      if (hasGhost) catchHint.classList.add('show');   // 没幽灵就别提示点幽灵
    }, 13500));
    /* 收尾：最后一声钟，停留两秒后交还首页 */
    timers.push(setTimeout(function () {
      if (fest) playChime(1568);
      skipBtn.classList.remove('show');
    }, 15000));
    timers.push(setTimeout(teardown, 17500));
  }

  /* 启动页：必须有一次用户点击才能起 AudioContext（浏览器自动播放策略） */
  audioPrompt.addEventListener('click', function () {
    audioPrompt.classList.add('fade');
    setTimeout(function () {
      audioPrompt.style.display = 'none';
      initAudio();
      setTimeout(startTimeline, 100);
    }, 1000);
  });
})();
