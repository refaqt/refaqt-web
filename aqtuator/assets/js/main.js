import { loadVariants, initConfigurator } from './configurator.js';
import { initForm } from './form.js';

const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 900px)');

// --- nav background after scrolling
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 20);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
$('#year').textContent = new Date().getFullYear();

// --- reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.section__head, .pillar, .app, .config, .table-wrap, .spec-group, .xy__copy, .open, .cta').forEach(el => { el.classList.add('reveal'); io.observe(el); });

// --- data-driven parts
loadVariants().then(data => {
  initConfigurator(data);
  initForm(data.variants);
}).catch(err => console.error('variants', err));

// --- 3D viewers (loaded lazily; the page works without WebGL)
function webgl() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
function whenNear(el, fn) {
  const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: '600px' });
  o.observe(el);
}

if (webgl()) {
  import('./viewer.js').then(({ Viewer }) => {
    // Hero
    const heroEl = $('#hero-viewer');
    const hero = new Viewer(heroEl, { camera: [0.6, 0.34, 0.6], target: [0, 0.025, 0] });
    hero.load().catch(e => console.error(e));
    const runChip = document.querySelector('[data-action=run]');
    runChip.classList.toggle('is-active', hero.running);
    runChip.setAttribute('aria-pressed', hero.running);
    document.querySelectorAll('.viewer__controls .chip').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.action;
      const set = (name, on) => { const x = document.querySelector(`[data-action=${name}]`); x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); };
      if (a === 'run') { const on = !hero.running; hero.setRunning(on); set('run', on); if (on) { hero.setExplode(0); set('explode', false); } }
      if (a === 'explode') { const on = hero.explodeTarget === 0; hero.setExplode(on ? 1 : 0); set('explode', on); if (on) { hero.setRunning(false); set('run', false); } }
      if (a === 'reset') hero.reset();
    }));

    // Inside: scroll takes the stage apart, part by part.
    const insideEl = $('#inside-viewer');
    whenNear(insideEl, () => {
      const v = new Viewer(insideEl, { controls: false, running: false, autoRotate: false, camera: [0.6, 0.46, 0.74], target: [0, 0.1, 0], pixelRatio: 1.5 });
      v.load().then(() => setupInside(v)).catch(e => console.error(e));
    });

    // XY
    const xyEl = $('#xy-viewer');
    whenNear(xyEl, () => {
      const v = new Viewer(xyEl, { camera: [0.62, 0.5, 0.62], target: [0, 0.05, 0], xy: true, pixelRatio: 1.5 });
      v.controls.minDistance = 0.4;
      v.load().catch(e => console.error(e));
    });
  });
}

function setupInside(v) {
  const items = [...document.querySelectorAll('#parts-list li')];
  const bar = $('#explode-progress');
  const labelsEl = $('#inside-labels');
  const cats = [...new Set(items.map(li => li.dataset.part))];
  const labels = Object.fromEntries(cats.map(c => {
    const el = document.createElement('span');
    el.className = 'label';
    el.textContent = items.find(li => li.dataset.part === c).querySelector('b').textContent;
    labelsEl.appendChild(el);
    return [c, el];
  }));
  const home = v.camera.position.clone();
  let active = -1, progress = 0;

  function update() {
    const list = $('#parts-list').getBoundingClientRect();
    const mid = innerHeight * 0.55;
    progress = Math.min(1, Math.max(0, (mid - list.top) / list.height));
    const idx = Math.min(items.length - 1, Math.floor(progress * items.length));
    const inView = list.top < innerHeight && list.bottom > 0;
    const explode = Math.min(1, Math.max(0, (mid - list.top + 40) / (list.height * 0.22)));
    v.setExplode(inView ? explode : 0);
    bar.style.width = `${progress * 100}%`;
    if (idx !== active) {
      active = idx;
      items.forEach((li, i) => li.classList.toggle('is-active', i === idx));
      v.stages[0]?.highlight(progress > 0 ? items[idx].dataset.part : null);
    }
    // Swing the camera a little as you scroll.
    const ang = (reduced ? 0 : progress * 0.9) - 0.15;
    const r = Math.hypot(home.x, home.z);
    v.camera.position.set(Math.sin(Math.atan2(home.x, home.z) + ang) * r, home.y, Math.cos(Math.atan2(home.x, home.z) + ang) * r);
    v.camera.lookAt(0, 0.04 + 0.1 * v.explode, 0);
    v._tick();
  }
  v.onFrame = () => {
    if (mobile.matches) return;
    const show = v.explode > 0.6;
    for (const [c, el] of Object.entries(labels)) {
      const p = v.project(c);
      if (!p) continue;
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - 18).toFixed(1)}px) translate(-50%, -100%)`;
      const on = items[active]?.dataset.part === c;
      el.classList.toggle('is-on', show && on);
      el.classList.toggle('is-active', on);
    }
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}
