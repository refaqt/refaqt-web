// Early-access form. Posts JSON to the Worker in aqtuator/worker/, which appends a row
// to a CSV file in a private repository. The site itself never sees a token.
import { CONFIG } from './config.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export function initForm(variants) {
  const form = document.getElementById('lead-form');
  const status = document.getElementById('form-status');
  const sel = document.getElementById('f-variant');
  const btn = form.querySelector('button[type=submit]');
  for (const v of variants) sel.insertAdjacentHTML('beforeend', `<option value="${v.model}">${v.model} · ${v.travel_mm} mm travel</option>`);

  // Buttons elsewhere on the page can preselect what the visitor wants.
  const interest = document.getElementById('f-interest');
  document.querySelectorAll('a[data-interest]').forEach(a => a.addEventListener('click', () => { interest.value = a.dataset.interest; }));

  let widget = null;
  if (CONFIG.turnstileSiteKey) {
    window.onTurnstileLoad = () => {
      widget = window.turnstile.render('#turnstile', { sitekey: CONFIG.turnstileSiteKey, theme: 'dark', appearance: 'interaction-only' });
    };
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    s.async = true; s.defer = true;
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
    if (!message) { say('Please tell us a little about your application.', 'error'); form.message.focus(); return; }
    if (!CONFIG.formEndpoint) { say('The form is not connected yet. Please try again soon.', 'error'); return; }

    const token = widget !== null ? window.turnstile.getResponse(widget) : '';
    if (CONFIG.turnstileSiteKey && !token) { say('Please wait a second for the spam check, then send again.', 'error'); return; }

    btn.disabled = true;
    say('Sending…');
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, interest: form.interest.value, variant: form.variant.value, message, website: form.website.value, token }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || `HTTP ${res.status}`);
      form.classList.add('is-done');
      say('Thank you. You are on the list, and we will reply in person soon.', 'ok');
    } catch (err) {
      say(`Sorry, that did not work (${err.message}). Please try again.`, 'error');
      if (widget !== null) window.turnstile.reset(widget);
    } finally {
      btn.disabled = false;
    }
  });
}
