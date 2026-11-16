// Early-access form. Posts JSON to the form Worker in forms-worker/ with form: 'aqtuator'.
// The Worker saves the request in a private database and sends two emails: one to
// contact@refaqt.com and a thank-you email to the visitor. The site never sees a secret key.
import { CONFIG } from './config.js';

// The same check as in forms-worker/src/index.js.
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

// Short answers from the Worker, in words for the visitor.
const ERRORS = {
  'too many messages': 'You sent several messages in a short time. Please wait an hour, or email us at contact@refaqt.com.',
  'spam check failed': 'The spam check did not work. Please try again.',
  'invalid name': 'Please write only your name in the name field, without a web address.',
  'invalid email': 'Please enter a valid email address.',
};

export function initForm(variants) {
  const form = document.getElementById('lead-form');
  const status = document.getElementById('form-status');
  const sel = document.getElementById('f-variant');
  const btn = form.querySelector('button[type=submit]');
  for (const v of variants) sel.insertAdjacentHTML('beforeend', `<option value="${v.model}">${v.model} · ${v.travel_mm} mm travel</option>`);

  // Buttons elsewhere on the page can preselect what the visitor wants.
  const interest = document.getElementById('f-interest');
  document.querySelectorAll('a[data-interest]').forEach(a => a.addEventListener('click', () => { interest.value = a.dataset.interest; }));

  const say = (msg, kind = '') => { status.textContent = msg; status.className = 'form__status' + (kind ? ` is-${kind}` : ''); };

  let widget = null;
  if (CONFIG.turnstileSiteKey) {
    window.onTurnstileLoad = () => {
      widget = window.turnstile.render('#turnstile', { sitekey: CONFIG.turnstileSiteKey, theme: 'dark', appearance: 'interaction-only' });
    };
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    s.async = true; s.defer = true;
    s.onerror = () => say('The spam check could not load. Please allow challenges.cloudflare.com, or email us at contact@refaqt.com.', 'error');
    document.head.appendChild(s);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = form.elements.name.value.trim(); // form.name is the form's own name, not the field
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    form.email.setAttribute('aria-invalid', String(!EMAIL.test(email)));
    form.message.setAttribute('aria-invalid', String(!message));
    if (!EMAIL.test(email)) { say('Please enter a valid email address.', 'error'); form.email.focus(); return; }
    if (!message) { say('Please tell us a little about your application.', 'error'); form.message.focus(); return; }
    if (!CONFIG.formEndpoint) { say('The form is not connected yet. Please email us at contact@refaqt.com.', 'error'); return; }

    const token = widget !== null ? window.turnstile.getResponse(widget) : '';
    if (CONFIG.turnstileSiteKey && !token) { say('Please wait a second for the spam check, then send again.', 'error'); return; }

    btn.disabled = true;
    say('Sending…');
    try {
      let res;
      try {
        res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: 'aqtuator', name, email, interest: form.interest.value, variant: form.variant.value, message, website: form.website.value, token }),
        });
      } catch {
        throw new Error('Your browser could not reach our server. Please try again, or email us at contact@refaqt.com.');
      }
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(ERRORS[out.error] || `Sorry, that did not work (${out.error || `HTTP ${res.status}`}). Please try again, or email us at contact@refaqt.com.`);
      form.classList.add('is-done');
      say('Thank you. You are on the list, and we sent you a copy by email. We do our best to reply within one business day.', 'ok');
    } catch (err) {
      say(err.message, 'error');
      if (widget !== null) window.turnstile.reset(widget);
    } finally {
      btn.disabled = false;
    }
  });
}
