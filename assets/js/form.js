// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Contact form. Posts JSON to the Worker in aqtuator/worker/ with form: 'home'.
// The Worker appends a row to a CSV file in a private repository. The site never sees a token.
import { CONFIG } from './config.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export function initForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const btn = form.querySelector('button[type=submit]');

  let widget = null;
  if (CONFIG.turnstileSiteKey) {
    window.onTurnstileLoad = () => {
      widget = window.turnstile.render('#turnstile', { sitekey: CONFIG.turnstileSiteKey, theme: 'dark', appearance: 'interaction-only' });
    };
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    s.async = true; s.defer = true;
    s.onerror = () => say('The spam check could not load. Please allow challenges.cloudflare.com, or email us.', 'error');
    document.head.appendChild(s);
  }

  const say = (msg, kind = '') => { status.textContent = msg; status.className = 'form__status' + (kind ? ` is-${kind}` : ''); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    form.email.setAttribute('aria-invalid', String(!EMAIL.test(email)));
    form.message.setAttribute('aria-invalid', String(!message));
    if (!EMAIL.test(email)) { say('Please enter a valid email address.', 'error'); form.email.focus(); return; }
    if (!message) { say('Please write a short message.', 'error'); form.message.focus(); return; }
    if (!CONFIG.formEndpoint) { say('The form is not connected yet. Please try again soon.', 'error'); return; }

    const token = widget !== null ? window.turnstile.getResponse(widget) : '';
    if (CONFIG.turnstileSiteKey && !token) { say('Please wait a second for the spam check, then send again.', 'error'); return; }

    btn.disabled = true;
    say('Sending…');
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: 'home', email, interest: form.interest.value, message, website: form.website.value, token }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || `HTTP ${res.status}`);
      form.classList.add('is-done');
      say('Thank you. We received your message and will reply in person soon.', 'ok');
    } catch (err) {
      say(`Sorry, that did not work (${err.message}). Please try again.`, 'error');
      if (widget !== null) window.turnstile.reset(widget);
    } finally {
      btn.disabled = false;
    }
  });
}
