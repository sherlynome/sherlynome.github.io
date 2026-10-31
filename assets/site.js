/* ============================================================
   sherly 个人站 · 共用脚本
   工具卡 / 作品卡 / 灯箱 / 动态条目。页面只负责取数据、塞容器。
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

async function getJSON(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return res.json();
}

const escHTML = s => String(s).replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

/* ── 工具卡 ───────────────────────────────────────────────── */
function toolCard(t, i) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = 'tools/' + t.file;
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML = `
    <div class="thumb">
      <img src="${t.thumb}" alt="${escHTML(t.name)}" loading="lazy">
      <span class="idx">${String(i + 1).padStart(2, '0')}</span>
    </div>
    <div class="body">
      <h3>${escHTML(t.name)}</h3>
      <p>${escHTML(t.tag)}</p>
      <div class="foot">
        <span class="tag ${t.cat}">${escHTML(t.catName)}</span>
        <button class="how" type="button">怎么用</button>
      </div>
    </div>`;
  a.querySelector('.how').addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    openHow(t);
  });
  return a;
}

/* ── 作品卡 ───────────────────────────────────────────────── */
function workCard(w) {
  const el = document.createElement(w.href ? 'a' : 'div');
  el.className = 'work';
  if (w.href) { el.href = w.href; el.target = '_blank'; el.rel = 'noopener'; }
  el.innerHTML = `
    <div class="cov"><img src="${w.cover}" alt="${escHTML(w.title)}" loading="lazy"></div>
    ${w.demo ? '<span class="demo">示例</span>' : ''}
    <div class="meta">
      <h3>${escHTML(w.title)}</h3>
      <span class="cat">${escHTML(w.catName || w.cat || '')}</span>
    </div>`;
  el.addEventListener('click', e => {
    if (w.href) return;
    e.preventDefault();
    lightbox(w.cover, w.title + (w.desc ? ' · ' + w.desc : ''));
  });
  return el;
}

/* ── 灯箱 ─────────────────────────────────────────────────── */
const lightbox = (() => {
  let box, pic, cap;
  function ensure() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<button class="lb-x" aria-label="关闭">✕</button><img alt=""><div class="lb-cap"></div>';
    document.body.appendChild(box);
    pic = box.querySelector('img');
    cap = box.querySelector('.lb-cap');
    box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lb-x')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  function open(src, text) {
    ensure();
    pic.src = src;
    cap.textContent = text || '';
    box.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!box) return;
    box.classList.remove('on');
    document.body.style.overflow = '';
  }
  return open;
})();

/* ── 工具说明弹窗 ─────────────────────────────────────────── */
function openHow(t) {
  const mask = $('#mask');
  if (!mask) { window.open('tools/' + t.file, '_blank'); return; }
  $('#m-img').src = t.thumb;
  $('#m-name').textContent = t.name;
  $('#m-cat').textContent = t.catName;
  $('#m-intro').textContent = t.intro;
  const ol = $('#m-steps');
  ol.innerHTML = '';
  t.steps.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    ol.appendChild(li);
  });
  const tip = $('#m-tip');
  if (t.tip) { tip.textContent = t.tip; tip.style.display = ''; }
  else { tip.style.display = 'none'; }
  $('#m-go').href = 'tools/' + t.file;
  mask.classList.add('on');
  document.body.style.overflow = 'hidden';
}

document.addEventListener('click', e => {
  const mask = $('#mask');
  if (!mask) return;
  if (e.target === mask || e.target.id === 'm-close') {
    mask.classList.remove('on');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', e => {
  const mask = $('#mask');
  if (e.key === 'Escape' && mask && mask.classList.contains('on')) {
    mask.classList.remove('on');
    document.body.style.overflow = '';
  }
});

/* ── 筛选按钮 ─────────────────────────────────────────────── */
function bindFilters(bar, onPick) {
  if (!bar) return;
  bar.addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    $$('.chip', bar).forEach(c => c.classList.remove('on'));
    btn.classList.add('on');
    onPick(btn.dataset.f);
  });
}
