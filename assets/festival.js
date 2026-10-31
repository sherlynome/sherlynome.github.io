/* ============================================================
   节日皮肤 · 运行时
   ------------------------------------------------------------
   读 assets/festivals.json，按今天是不是节日自动换肤：
     · 全站配色   —— 覆盖 html 上的 CSS 变量
     · 开场动画   —— 换帷幕/月亮/光晕颜色 + 字幕文案

   数据是纯 JSON，加节日不用改这个文件。
   农历节日（春节/七夕/中秋）靠浏览器原生 Intl 换算，不用维护公历日期表。
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var DAY = 86400000;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ── 颜色工具 ───────────────────────────────────────────── */
  function parseHex(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }

  /* k < 1 压暗、k > 1 提亮。深色底上用等比缩放比转 HSL 更稳，不会偏色。 */
  function shade(hex, k) {
    var c = parseHex(hex);
    return '#' + c.map(function (v) {
      return ('0' + Math.max(0, Math.min(255, Math.round(v * k))).toString(16)).slice(-2);
    }).join('');
  }

  function rgbTriple(hex) { return parseHex(hex).join(','); }

  /* ── 农历 ───────────────────────────────────────────────── */
  function lunarOf(date) {
    try {
      var parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        month: 'numeric', day: 'numeric'
      }).formatToParts(date);
      var m = parts.find(function (p) { return p.type === 'month'; });
      var d = parts.find(function (p) { return p.type === 'day'; });
      if (!m || !d) return null;
      /* 闰月的 value 可能带后缀，parseInt 取数字部分即可：闰月不过节，影响可忽略 */
      return { m: parseInt(m.value, 10), d: parseInt(d.value, 10) };
    } catch (e) { return null; }
  }

  /* 返回「今天离这个节日的最近距离（天）」，不匹配返回 null。
     注意不能拿 -1 当哨兵值——节日如果正好在昨天，合法结果就是 -1。 */
  function distanceTo(f, today) {
    var lead = f.lead || 0, after = f.after || 0;
    var lunarTarget = null, solarTarget = null;

    if (f.lunar) lunarTarget = String(f.lunar).split('-').map(Number);
    else if (f.date) solarTarget = String(f.date);

    var best = null;
    for (var off = -after; off <= lead; off++) {
      var d = new Date(today.getTime() + off * DAY);
      var hit = false;

      if (lunarTarget) {
        var lm = lunarOf(d);
        if (lm && lm.m === lunarTarget[0] && lm.d === lunarTarget[1]) hit = true;
      } else if (solarTarget) {
        if (pad(d.getMonth() + 1) + '-' + pad(d.getDate()) === solarTarget) hit = true;
      }

      if (hit && (best === null || Math.abs(off) < Math.abs(best))) best = off;
    }
    return best;
  }

  /* ── 应用皮肤 ───────────────────────────────────────────── */
  function applySite(c) {
    root.style.setProperty('--pink', c.accent);
    root.style.setProperty('--pink-2', c.accent2);
    root.style.setProperty('--pink-3', c.accent3);
    root.style.setProperty('--pink-deep', c.deep);
    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--panel', shade(c.bg, 1.9));
    root.style.setProperty('--panel-2', shade(c.bg, 2.6));
    /* 站点里还有几处写死的 rgba(255,61,127,…) 光晕，靠这个变量统一改 */
    root.style.setProperty('--pink-rgb', rgbTriple(c.accent));
  }

  function applySplash(el, c, sp) {
    if (!el) return;
    var set = function (k, v) { el.style.setProperty(k, v); };

    set('--s-pink', c.accent);
    set('--s-pink-light', c.accent2);
    set('--s-gold', c.accent3);
    set('--s-bg', c.bg);

    set('--s-pink-rgb', rgbTriple(c.accent));
    set('--s-pink-light-rgb', rgbTriple(c.accent2));
    set('--s-cur-rgb', rgbTriple(c.curtain));
    set('--s-moon-1-rgb', rgbTriple(c.accent3));

    /* 帷幕五档：以 curtain 为中间调，往两侧压暗 */
    set('--s-cur-3', c.curtain);
    set('--s-cur-2', shade(c.curtain, 0.62));
    set('--s-cur-1', shade(c.curtain, 0.26));
    set('--s-cur-4', shade(c.curtain, 0.78));
    set('--s-cur-5', shade(c.curtain, 0.42));

    /* 月亮：内亮外暗 */
    set('--s-moon-1', c.accent3);
    set('--s-moon-2', c.accent2);
    set('--s-moon-3', c.accent);
    set('--s-moon-4', shade(c.accent, 0.58));

    /* 字幕文案 */
    if (sp && sp.cn) {
      var cn = el.querySelector('.caption-cn');
      if (cn) cn.textContent = sp.cn;
    }
    if (sp && sp.en) {
      var en = el.querySelector('.caption-en');
      if (en) en.textContent = sp.en;
    }
  }

  /* ── 主流程 ─────────────────────────────────────────────── */
  function init(data) {
    if (!data || !data.festivals) return;

    var today = new Date();
    today.setHours(12, 0, 0, 0);   /* 定在正午，绕开夏令时/时区边界 */

    var list = data.festivals.slice();

    /* 生日是可选项，month/day 为 0 表示没启用 */
    var b = data.birthday;
    if (b && b.month > 0 && b.day > 0) {
      list.push({
        id: 'birthday', name: b.name, lead: 1, after: 1,
        date: pad(b.month) + '-' + pad(b.day),
        colors: b.colors, splash: b.splash
      });
    }

    var picked = null, bestDist = Infinity;
    list.forEach(function (f) {
      if (!f.colors) return;
      var d = distanceTo(f, today);
      if (d !== null && Math.abs(d) < bestDist) { bestDist = Math.abs(d); picked = f; }
    });

    /* 调试/预览用：?festival=midautumn 可以强制套任意节日皮肤，不看日期 */
    var forced = /[?&]festival=([a-z]+)/i.exec(location.search);
    if (forced) {
      var want = null;
      list.forEach(function (f) { if (f.id === forced[1]) want = f; });
      if (want) picked = want;
    }

    if (!picked) return;   /* 非节日：保持默认皮肤 */

    root.setAttribute('data-festival', picked.id);
    window.__festival = picked;

    applySite(picked.colors);
    applySplash(document.getElementById('splash'), picked.colors, picked.splash);

    try {
      console.info('%c🎉 节日皮肤：' + picked.name + '（' + picked.id + '）',
        'color:' + picked.colors.accent + ';font-weight:bold');
    } catch (e) {}

    /* 首页开场如果比 fetch 晚完成初始化，这里再兜一次 */
    document.dispatchEvent(new CustomEvent('festival-ready', { detail: picked }));
  }

  function load() {
    if (!window.fetch) return;
    fetch('assets/festivals.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(init)
      .catch(function () { /* 拿不到就用默认皮肤，不影响站点 */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
