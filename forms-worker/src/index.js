// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Cloudflare Worker "refaqt-forms": the backend for both forms on the website.
//
// The website posts { form, name, email, interest, variant, message, website, token } as JSON.
// "form" is "home" (contact form on the home page) or "aqtuator" (AQTUATOR CS early access;
// also the default when "form" is missing).
//
// For each message the Worker:
//   1. checks the input, the hidden "website" field (a trap for robots) and the Turnstile token;
//   2. checks the limit per visitor (per IP address per hour, per email address per day);
//   3. saves the lead in the D1 database refaqt-leads (table "leads");
//   4. sends an email to contact@refaqt.com, with the visitor as reply address;
//   5. sends a thank-you email to the visitor.
// Emails go through Resend (resend.com). The lead is saved before the emails go out, so a
// problem with email never loses a lead.
//
// Settings: wrangler.jsonc ("vars"). Secrets: RESEND_API_KEY, TURNSTILE_SECRET.
// Database binding: DB. Tables: migrations/0001_create_leads.sql.

import { notifyEmail, thanksEmail } from './email.js';

// The same check as in the two form.js files on the site.
export const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

// One entry per form on the site: the allowed values of "I want to" and "Travel".
const FORMS = {
  aqtuator: {
    interests: new Set(['', 'buy', 'diy', 'licence']),
    variants: new Set(['', 'CS-220', 'CS-280', 'CS-360', 'CS-440', 'CS-520', 'CS-600']),
  },
  home: {
    interests: new Set(['', 'contribute', 'partner', 'engineering', 'licence', 'other']),
    variants: new Set(['']),
  },
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const RESEND_API = 'https://api.resend.com/emails';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { ok: false, error: 'method not allowed' });
    if (!allowed.includes(origin)) return reply(403, { ok: false, error: 'origin not allowed' });

    let data;
    try { data = await request.json(); } catch { return reply(400, { ok: false, error: 'bad request' }); }
    if (!data || typeof data !== 'object') return reply(400, { ok: false, error: 'bad request' });

    const formName = String(data.form || 'aqtuator').trim();
    const form = Object.hasOwn(FORMS, formName) ? FORMS[formName] : null;
    if (!form) return reply(400, { ok: false, error: 'invalid form' });

    const name = cleanName(data.name);
    const email = String(data.email || '').trim();
    const interest = String(data.interest || '').trim();
    const variant = String(data.variant || '').trim();
    const message = cleanMessage(data.message);

    // Trap for robots: people never see the "website" field. Pretend it worked.
    if (data.website) return reply(200, { ok: true });
    if (!EMAIL.test(email) || email.length > 254) return reply(400, { ok: false, error: 'invalid email' });
    if (name === null) return reply(400, { ok: false, error: 'invalid name' });
    if (!form.interests.has(interest)) return reply(400, { ok: false, error: 'invalid interest' });
    if (!form.variants.has(variant)) return reply(400, { ok: false, error: 'invalid variant' });
    if (!message || message.length > 2000) return reply(400, { ok: false, error: 'message missing or too long' });

    // The spam check is required. Without the secret, the Worker refuses every message.
    if (!env.TURNSTILE_SECRET) {
      console.error('TURNSTILE_SECRET is not set');
      return reply(503, { ok: false, error: 'form not set up' });
    }
    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!(await verifyTurnstile(env.TURNSTILE_SECRET, data.token, ip))) return reply(403, { ok: false, error: 'spam check failed' });

    const now = Date.now();
    const ipKey = 'ip:' + await hash(ip || 'unknown');
    const emailKey = 'email:' + await hash(email.toLowerCase());
    const perIp = Number(env.LIMIT_PER_IP_PER_HOUR || 5);
    const perEmail = Number(env.LIMIT_PER_EMAIL_PER_DAY || 3);

    const lead = {
      id: crypto.randomUUID(),
      created_at: new Date(now).toISOString(),
      form: formName,
      name,
      email,
      interest,
      variant,
      message,
      country: String(request.cf?.country || ''),
      user_agent: (request.headers.get('User-Agent') || '').slice(0, 200),
      origin,
    };

    try {
      const count = 'SELECT COUNT(*) AS n FROM form_hits WHERE key = ? AND at > ?';
      const [byIp, byEmail] = await env.DB.batch([
        env.DB.prepare(count).bind(ipKey, now - HOUR),
        env.DB.prepare(count).bind(emailKey, now - DAY),
      ]);
      if (byIp.results[0].n >= perIp || byEmail.results[0].n >= perEmail) {
        return reply(429, { ok: false, error: 'too many messages' });
      }
      await env.DB.batch([
        env.DB.prepare('DELETE FROM form_hits WHERE at < ?').bind(now - DAY),
        env.DB.prepare('INSERT INTO form_hits (key, at) VALUES (?, ?), (?, ?)').bind(ipKey, now, emailKey, now),
        env.DB.prepare(`INSERT INTO leads (id, created_at, form, name, email, interest, variant, message, country, user_agent, origin)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(lead.id, lead.created_at, lead.form, lead.name, lead.email, lead.interest, lead.variant, lead.message, lead.country, lead.user_agent, lead.origin),
      ]);
    } catch (err) {
      console.error('database error', err.message);
      return reply(502, { ok: false, error: 'could not store the message' });
    }

    // The lead is safe now. Send both emails, then note the result in the lead.
    const status = await sendEmails(env, lead);
    try {
      await env.DB.prepare('UPDATE leads SET mail_status = ? WHERE id = ?').bind(status, lead.id).run();
    } catch (err) {
      console.error('could not save the mail status', err.message);
    }
    return reply(200, { ok: true });
  },
};

// Optional name: one line, at most 100 characters. Returns null when it looks like spam
// (a web address or an email address), because the name goes into the thank-you email.
export function cleanName(value) {
  const s = String(value ?? '').replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length > 100) return null;
  if (/:\/\/|www\.|@|[<>]/i.test(s)) return null;
  return s;
}

// Message: keep line breaks and tabs, drop other control characters.
export function cleanMessage(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '')
    .trim();
}

async function hash(value) {
  const bytes = new TextEncoder().encode('refaqt-forms:' + value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(secret, token, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await res.json().catch(() => ({}));
    return out.success === true;
  } catch (err) {
    console.error('turnstile error', err.message);
    return false;
  }
}

// Send both emails through Resend. Returns a short status for the lead, for example
// "notify: sent; thanks: sent". Never throws.
export async function sendEmails(env, lead) {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return 'not sent: RESEND_API_KEY is not set';
  }
  const notify = notifyEmail(lead, env);
  const thanks = thanksEmail(lead, env);
  const a = await sendOne(env, `${lead.id}-notify`, {
    from: env.NOTIFY_FROM || 'REFAQT website <website@refaqt.com>',
    to: [env.CONTACT_TO || 'contact@refaqt.com'],
    reply_to: lead.email,
    ...notify,
  });
  const b = await sendOne(env, `${lead.id}-thanks`, {
    from: env.THANKS_FROM || 'REFAQT <contact@refaqt.com>',
    to: [lead.email],
    reply_to: env.THANKS_REPLY_TO || 'contact@refaqt.com',
    ...thanks,
  });
  return `notify: ${a}; thanks: ${b}`;
}

async function sendOne(env, key, email) {
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        // Resend sends the same email only once for the same key, also when we retry.
        'Idempotency-Key': key,
      },
      body: JSON.stringify(email),
    });
    if (res.ok) return 'sent';
    const out = await res.json().catch(() => ({}));
    console.error('resend error', res.status, out.name || '', out.message || '');
    return `failed ${res.status} ${String(out.name || '').slice(0, 60)}`.trim();
  } catch (err) {
    console.error('resend error', err.message);
    return 'failed: network';
  }
}
