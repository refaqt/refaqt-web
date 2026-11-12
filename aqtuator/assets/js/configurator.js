// Travel configurator, specification tables and the printable spec sheet.
// All numbers come from assets/data/variants.json (tools/variants.py).

const SVG_NS = 'http://www.w3.org/2000/svg';
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const u = (v, unit) => `${v}<span class="unit">${unit}</span>`;

export async function loadVariants() {
  const res = await fetch(new URL('../data/variants.json', import.meta.url));
  return res.json();
}

// Top view of a stage, to scale (1 SVG unit = 1 mm).
export function drawingMarkup(v, { carriageId = '', maxL = v.length_mm } = {}) {
  const L = v.length_mm, W = 210, m = 46, ox = m + 10 + (maxL - L) / 2;
  const holes = [];
  const span = v.base_hole_span_mm, x0 = (L - span) / 2;
  for (let i = 0; i < v.base_holes_per_row; i++) {
    for (const y of [5, 205]) holes.push(`<circle class="dwg-hole" cx="${x0 + i * 80}" cy="${y}" r="2.75"/>`);
  }
  const c = L / 2, ch = [];
  for (const dx of [-100, -80, 80, 100]) for (const dy of [-80, 0, 80]) ch.push(`<circle class="dwg-chole" cx="${dx}" cy="${105 + dy}" r="2.5"/>`);
  const t = v.travel_mm;
  return `
  <defs>
    <linearGradient id="strip-grad" x1="0" x2="1"><stop offset="0" stop-color="#2c2f31"/><stop offset=".5" stop-color="#3a3e41"/><stop offset="1" stop-color="#2c2f31"/></linearGradient>
    <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker>
  </defs>
  <g transform="translate(${ox} ${m + 10})">
    <rect class="dwg-base" x="0" y="0" width="${L}" height="${W}" rx="3"/>
    <rect class="dwg-strip" x="1" y="12" width="${L - 2}" height="186" rx="2"/>
    <line class="dwg-rail" x1="11" y1="36" x2="${L - 11}" y2="36" opacity=".35"/>
    <line class="dwg-rail" x1="11" y1="174" x2="${L - 11}" y2="174" opacity=".35"/>
    ${holes.join('')}
    <g ${carriageId ? `id="${carriageId}"` : ''}>
      <g transform="translate(${c} 0)">
        <rect class="dwg-carriage" x="-105" y="1" width="210" height="208" rx="4"/>
        ${ch.join('')}
        <rect x="-75" y="30" width="150" height="150" fill="none" stroke="#c9ced2" stroke-opacity=".25" stroke-dasharray="4 4"/>
      </g>
    </g>
    <!-- travel -->
    <g style="color: var(--g1)">
      <line class="dwg-dim-travel" x1="${c - t / 2}" y1="-22" x2="${c + t / 2}" y2="-22" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text class="dwg-text dwg-text--travel" x="${c}" y="-32" text-anchor="middle">travel ${t}</text>
    </g>
    <!-- length -->
    <g style="color: var(--muted)">
      <line class="dwg-dim" x1="0" y1="${W + 8}" x2="0" y2="${W + 34}"/>
      <line class="dwg-dim" x1="${L}" y1="${W + 8}" x2="${L}" y2="${W + 34}"/>
      <line class="dwg-dim" x1="0" y1="${W + 26}" x2="${L}" y2="${W + 26}" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text class="dwg-text" x="${L / 2}" y="${W + 50}" text-anchor="middle">${L}</text>
      <line class="dwg-dim" x1="${L + 8}" y1="0" x2="${L + 34}" y2="0"/>
      <line class="dwg-dim" x1="${L + 8}" y1="${W}" x2="${L + 34}" y2="${W}"/>
      <line class="dwg-dim" x1="${L + 26}" y1="0" x2="${L + 26}" y2="${W}" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <text class="dwg-text" x="${L + 34}" y="${W / 2}" text-anchor="middle" transform="rotate(90 ${L + 34} ${W / 2})" dy="-2">210</text>
    </g>
  </g>`;
}

// Side view (looking across the travel), to scale. Base 40 mm high, carriage on top.
export function sideViewMarkup(v) {
  const L = v.length_mm, cx = L / 2;
  return `<svg viewBox="0 0 ${L + 112} 140" class="dwg-side">${ARROW_DEFS}
  <g transform="translate(56 40)">
    <rect class="dwg-base" x="0" y="20" width="${L}" height="40"/>
    <rect class="dwg-carriage" x="${cx - 105}" y="0" width="210" height="19.5"/>
    ${dimH(0, L, 60, 22, L)}
    ${dimH(cx - 105, cx + 105, 0, -14, 210)}
    ${dimV(0, 60, L, 22, 60)}
    ${dimV(20, 60, 0, -22, 40)}
  </g></svg>`;
}

// End view (looking along the travel), to scale.
export function endViewMarkup() {
  const W = 210;
  return `<svg viewBox="0 0 ${W + 112} 140" class="dwg-end">${ARROW_DEFS}
  <g transform="translate(56 40)">
    <rect class="dwg-base" x="0" y="20" width="${W}" height="40"/>
    <rect class="dwg-carriage" x="1" y="0" width="208" height="19.5"/>
    ${dimH(0, W, 60, 22, W)}
    ${dimV(0, 60, W, 22, 60)}
  </g></svg>`;
}

// Dimension lines: horizontal from x1 to x2 at height y, offset d; vertical likewise.
function dimH(x1, x2, y, d, label) {
  const yy = y + d, ty = d > 0 ? yy + 14 : yy - 6;
  return `<g class="dwg-dimg"><line class="dwg-dim" x1="${x1}" y1="${y}" x2="${x1}" y2="${yy + Math.sign(d) * 4}"/><line class="dwg-dim" x1="${x2}" y1="${y}" x2="${x2}" y2="${yy + Math.sign(d) * 4}"/>
    <line class="dwg-dim" x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}" marker-start="url(#arr2)" marker-end="url(#arr2)"/>
    <text class="dwg-text" x="${(x1 + x2) / 2}" y="${ty}" text-anchor="middle">${label}</text></g>`;
}
function dimV(y1, y2, x, d, label) {
  const xx = x + d, tx = d > 0 ? xx + 6 : xx - 6;
  return `<g class="dwg-dimg"><line class="dwg-dim" x1="${x}" y1="${y1}" x2="${xx + Math.sign(d) * 4}" y2="${y1}"/><line class="dwg-dim" x1="${x}" y1="${y2}" x2="${xx + Math.sign(d) * 4}" y2="${y2}"/>
    <line class="dwg-dim" x1="${xx}" y1="${y1}" x2="${xx}" y2="${y2}" marker-start="url(#arr2)" marker-end="url(#arr2)"/>
    <text class="dwg-text" x="${tx}" y="${(y1 + y2) / 2 + 4}" text-anchor="${d > 0 ? 'start' : 'end'}">${label}</text></g>`;
}
const ARROW_DEFS = '<defs><marker id="arr2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>';

export function viewBoxFor(v, maxL) {
  const m = 46;
  return `0 0 ${maxL + 2 * m + 20} ${210 + 2 * m + 50}`;
}

function variantRows(v) {
  const segs = Object.entries(v.magnet_track_segments).map(([len, n]) => `${n}×${len}`).join(' + ');
  return [
    ['Travel', u(v.travel_mm, 'mm')],
    ['Positioning accuracy, no mapping', u(`±${fmt(v.accuracy_um, 1)}`, 'µm')],
    ['Overall length', u(v.length_mm, 'mm')],
    ['Width × height', u('210 × 60', 'mm')],
    ['Total mass (est.)', u(fmt(v.total_mass_kg, 1), 'kg')],
    ['Moving mass (est.)', u(fmt(v.moving_mass_kg, 1), 'kg')],
    ['Base screws (M5)', `${v.base_screws}`],
    ['Guide rail length', u(v.rail_length_mm, 'mm')],
    ['Magnet track', `${u(v.magnet_track_mm, 'mm')}<br><small style="color:var(--faint)">${segs}</small>`],
    ['Encoder measuring length', u(v.encoder_measuring_length_mm, 'mm')],
  ];
}

export function initConfigurator(data, { onSelect } = {}) {
  const vs = data.variants;
  const maxL = Math.max(...vs.map(v => v.length_mm));
  const range = document.getElementById('travel');
  const ticks = document.getElementById('travel-ticks-labels');
  const valueEl = document.getElementById('cfg-travel');
  const specsEl = document.getElementById('cfg-specs');
  const svg = document.getElementById('drawing');
  const req = document.getElementById('cfg-request');
  const printBtn = document.getElementById('cfg-print');
  const table = document.getElementById('spec-variants');
  const common = document.getElementById('spec-common');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let anim;

  ticks.innerHTML = vs.map((v, i) => `<button type="button" data-i="${i}">${v.travel_mm}</button>`).join('');
  ticks.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { range.value = b.dataset.i; select(+b.dataset.i); } });

  // --- variant table
  const rows = vs.map(variantRows);
  table.innerHTML += `<thead><tr><th scope="col">Model</th>${vs.map((v, i) => `<th scope="col" data-i="${i}">${v.model}</th>`).join('')}</tr></thead>
    <tbody>${rows[0].map((r, ri) => `<tr><th scope="row">${r[0]}</th>${rows.map((rr, i) => `<td data-i="${i}">${rr[ri][1]}</td>`).join('')}</tr>`).join('')}</tbody>`;

  // --- common specs, grouped
  const groups = {};
  for (const c of data.common) (groups[c.group] ||= []).push(c);
  common.innerHTML = Object.entries(groups).map(([g, items]) => `
    <div class="spec-group"><h3>${g}</h3>${items.map(c => `
      <div class="spec-row"><span>${c.label}</span><b>${c.unit ? u(c.value, c.unit) : c.value}</b></div>`).join('')}
    </div>`).join('');

  function select(i, first = false) {
    const v = vs[i];
    range.setAttribute('aria-valuetext', `${v.travel_mm} mm`);
    range.style.setProperty('--fill', `${(i / (vs.length - 1)) * 100}%`);
    valueEl.textContent = v.travel_mm;
    ticks.querySelectorAll('button').forEach((b, j) => b.classList.toggle('is-active', j === i));
    specsEl.innerHTML = [
      ['Model', v.model],
      ['Length', u(v.length_mm, 'mm')],
      ['Accuracy, no mapping', u(`±${fmt(v.accuracy_um, 1)}`, 'µm')],
      ['Mass (est.)', u(fmt(v.total_mass_kg, 1), 'kg')],
      ['Base screws', `${v.base_screws} × M5`],
      ['Rail length', u(v.rail_length_mm, 'mm')],
      ['Encoder length', u(v.encoder_measuring_length_mm, 'mm')],
    ].map(([k, val]) => `<div><dt>${k}</dt><dd class="${first ? '' : 'flash'}">${val}</dd></div>`).join('');
    svg.setAttribute('viewBox', viewBoxFor(v, maxL));
    svg.innerHTML = `<title id="drawing-title">Top view of ${v.model}: ${v.length_mm} mm long, ${v.travel_mm} mm travel</title>` + drawingMarkup(v, { carriageId: 'dwg-carriage', maxL });
    anim?.cancel();
    const car = svg.querySelector('#dwg-carriage');
    if (car && !reduced) {
      anim = car.animate([
        { transform: `translateX(${-v.travel_mm / 2}px)` },
        { transform: `translateX(${v.travel_mm / 2}px)` },
      ], { duration: 1400 + v.travel_mm * 4, direction: 'alternate', iterations: Infinity, easing: 'cubic-bezier(.45,0,.55,1)' });
    }
    req.textContent = `Request ${v.model}`;
    req.dataset.variant = v.model;
    table.querySelectorAll('[data-i]').forEach(c => c.classList.toggle('is-sel', +c.dataset.i === i));
    current = v;
    onSelect?.(v);
  }
  let current;
  range.addEventListener('input', () => select(+range.value));
  req.addEventListener('click', () => {
    const sel = document.getElementById('f-variant');
    if (sel) sel.value = current.model;
    const interest = document.getElementById('f-interest');
    if (interest) interest.value = 'buy';
  });
  printBtn.addEventListener('click', () => { buildSheet(current, data); window.print(); });
  select(0, true);
}

function buildSheet(v, data) {
  const sheet = document.getElementById('sheet');
  const rows = variantRows(v);
  sheet.innerHTML = `
    <img class="sheet__logo" src="assets/img/refaqt-logo.png" alt="REFAQT">
    <h1>AQTUATOR ${v.model}</h1>
    <p class="sheet__sub">Linear-motor stage · ${v.travel_mm} mm travel · ${v.length_mm} × 210 × 60 mm</p>
    <figure class="sheet__3d"><img src="assets/img/hero.png" alt="3D view of the stage"><figcaption>3D view. The picture shows CS-220. Longer travels have a longer base.</figcaption></figure>
    <!-- The columns follow the drawing widths, so the three views share one scale. -->
    <div class="sheet__views" style="grid-template-columns: ${v.length_mm + 112}fr 322fr">
      <figure class="sheet__top"><svg viewBox="${viewBoxFor(v, v.length_mm)}">${drawingMarkup(v)}</svg><figcaption>Top view. Base holes: M5 clearance on the 80 mm grid.</figcaption></figure>
      <figure class="sheet__side">${sideViewMarkup(v)}<figcaption>Side view</figcaption></figure>
      <figure class="sheet__end">${endViewMarkup()}<figcaption>End view</figcaption></figure>
    </div>
    <p class="sheet__dims">All dimensions in mm. The views share one scale.</p>
    <h2>This model</h2>
    <table><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table>
    <h2>All models</h2>
    <table><tbody>${data.common.map(c => `<tr><th>${c.label}</th><td>${c.value} ${c.unit}</td></tr>`).join('')}</tbody></table>
    <p class="sheet__note">${data.status} Positioning accuracy without mapping: ±15 µm per metre of travel, but never better than ±5 µm. Mass, rail, magnet-track and encoder lengths for travels other than 220 mm are estimates, scaled from the 220 mm design. Open design files: github.com/refaqt/aqtuator · ${location.href.split('#')[0]}</p>`;
}
