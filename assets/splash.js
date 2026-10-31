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
      catchHint = $('#catchHint'),
      rainCanvas = $('#rainCanvas'),
      ctx = rainCanvas.getContext('2d'),
      petalsContainer = $('#petals'),
      ghostContainer = $('#ghostContainer');

  var rainActive = false,
      timers = [],
      audioCtx = null,
      masterGain = null,
      killed = false;

  var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  /* ── 雨 ─────────────────────────────────────────────────── */
  function resizeCanvas() {
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
    if (!rainActive || killed) return;
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
    if (reduceMotion) return;
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
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
      masterGain.gain.linearRampToValueAtTime(.45, audioCtx.currentTime + 3);
      return true;
    } catch (e) { return false; }
  }

  function createAmbientPad() {
    if (!audioCtx) return;
    var padGain = audioCtx.createGain();
    padGain.gain.value = 0;
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    [110, 164.81, 220].forEach(function (f, i) {
      var o = audioCtx.createOscillator();
      o.type = i ? 'triangle' : 'sine';
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
    padGain.connect(filter);
    filter.connect(masterGain);
    padGain.gain.linearRampToValueAtTime(.12, audioCtx.currentTime + 5);
  }

  function noiseBuffer(seconds) {
    var b = audioCtx.createBuffer(1, audioCtx.sampleRate * seconds, audioCtx.sampleRate),
        d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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
    g.gain.linearRampToValueAtTime(.05, audioCtx.currentTime + 4);
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

  /* ── 收尾：淡出并拆掉整个开场 ───────────────────────────── */
  function teardown() {
    if (killed) return;
    killed = true;

    timers.forEach(clearTimeout);
    timers = [];
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
    createAmbientPad();
    createWind();

    timers.push(setTimeout(function () {
      skipBtn.classList.add('show');
      audioIndicator.classList.add('show');
    }, 200));
    timers.push(setTimeout(function () {
      blackout.classList.add('fade');
      playBell(196);
    }, 1000));
    timers.push(setTimeout(function () { playBell(261.63); }, 3000));
    timers.push(setTimeout(createGhosts, 3500));
    timers.push(setTimeout(function () {
      curtainLeft.classList.add('open');
      curtainRight.classList.add('open');
      topValance.classList.add('open');
      playCurtainSound();
    }, 4000));
    timers.push(setTimeout(function () { triggerGlowPulse('soft-1'); }, 5500));
    timers.push(setTimeout(function () {
      rainActive = true;
      drawRain();
      createRainSound();
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
      playBell(329.63);
    }, 12500));
    /* 花瓣 + 提示 */
    timers.push(setTimeout(function () {
      createPetals();
      catchHint.classList.add('show');
    }, 13500));
    /* 收尾：最后一声钟，停留两秒后交还首页 */
    timers.push(setTimeout(function () {
      playChime(1568);
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
