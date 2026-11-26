// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// AQTUATOR Custom page: navigation background, the year, the contact form and the 3D view.
// The form is the one of the home page. The 3D view loads on its own, so the page and the form
// still work when the 3D view cannot start.
import { initForm } from '../../../assets/js/form.js';

const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
document.getElementById('year').textContent = new Date().getFullYear();
initForm();

// --- 3D view
const box = document.getElementById('morph');
const msg = box.querySelector('.morph__msg');
const dots = [...document.querySelectorAll('.steps button')];
const cards = [...document.querySelectorAll('.change')];

function showStep(i) {
  dots.forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
  cards.forEach(c => c.classList.toggle('is-active', Number(c.dataset.step) === i));
}

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

if (!webgl()) {
  msg.textContent = 'Your browser cannot show the 3D view. The picture shows one of the example stages.';
} else {
  // The 3D model (about 2.4 MB) loads first; the still picture and a loading bar show meanwhile.
  import('./morph.js').then(({ initMorph }) => initMorph(box, { onStep: showStep })).then(view => {
    dots.forEach((d, i) => d.addEventListener('click', () => view.goTo(i)));
    box.classList.add('is-ready');
  }).catch(err => {
    box.classList.add('is-failed');
    console.error('3D view', err);
    msg.textContent = 'The 3D view could not load. The picture shows one of the example stages.';
  });
}

// Buttons in the offers choose the matching line in the form.
document.querySelectorAll('[data-interest]').forEach(a => a.addEventListener('click', () => {
  document.getElementById('f-interest').value = a.dataset.interest;
}));
