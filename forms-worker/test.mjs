// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Tests for the form Worker.   node forms-worker/test.mjs
//
// The database is a real SQLite database in memory, made with the migration files, behind a
// small copy of the D1 interface. Resend and Turnstile are fake.
// With PREVIEW_DIR=<folder>, the test also writes the four emails (HTML and text) there.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import worker, { EMAIL, cleanName } from './src/index.js';
import { notifyEmail, thanksEmail } from './src/email.js';

const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// ---- A small D1 on top of node:sqlite ----
function makeD1() {
  const db = new DatabaseSync(':memory:');
  const dir = join(here, 'migrations');
  for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) db.exec(readFileSync(join(dir, f), 'utf8'));
  const exec = (sql, args) => {
    const st = db.prepare(sql);
    if (/^\s*SELECT/i.test(sql)) return { results: st.all(...args), success: true };
    st.run(...args);
    return { results: [], success: true };
  };
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    run: async () => exec(sql, args),
    all: async () => exec(sql, args),
    first: async () => exec(sql, args).results[0] ?? null,
  });
  return {
    raw: db,
    prepare: sql => stmt(sql),
    batch: async list => {
      db.exec('BEGIN');
      try { const out = list.map(s => exec(s.sql, s.args)); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

// ---- Fake Resend and Turnstile ----
let sent = [];
let resendStatus = 200;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
    return Response.json({ success: init.body.get('response') === 'good' && init.body.get('secret') === 'ts-secret' });
  }
  if (url === 'https://api.resend.com/emails') {
    assert.equal(init.headers.Authorization, 'Bearer re_test');
    sent.push({ key: init.headers['Idempotency-Key'], ...JSON.parse(init.body) });
    if (resendStatus !== 200) return Response.json({ name: 'application_error', message: 'down' }, { status: resendStatus });
    return Response.json({ id: 'email-' + sent.length });
  }
  throw new Error('unexpected url ' + url);
};

const vars = JSON.parse(readFileSync(join(here, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, '')).vars;
let env;
const fresh = () => { env = { ...vars, DB: makeD1(), RESEND_API_KEY: 're_test', TURNSTILE_SECRET: 'ts-secret' }; sent = []; resendStatus = 200; };
let ipCounter = 0;
const post = (data, { origin = 'https://refaqt.com', ip } = {}) => worker.fetch(new Request('https://refaqt-forms.example/', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip || `10.0.0.${++ipCounter}` },
  body: JSON.stringify({ token: 'good', ...data }),
}), env);
const leads = () => env.DB.raw.prepare('SELECT * FROM leads ORDER BY created_at').all();

// ---- Home page contact form: saved, two emails ----
fresh();
let r = await post({ form: 'home', name: 'Anna Peeters', email: 'anna@example.be', interest: 'partner', message: 'We sell machines in Ghent.\nSee https://evil.example/x and <b>bold</b> <script>alert(1)</script>' });
assert.equal(r.status, 200);
assert.deepEqual(await r.json(), { ok: true });
let rows = leads();
assert.equal(rows.length, 1);
assert.equal(rows[0].form, 'home');
assert.equal(rows[0].name, 'Anna Peeters');
assert.equal(rows[0].email, 'anna@example.be');
assert.equal(rows[0].interest, 'partner');
assert.equal(rows[0].origin, 'https://refaqt.com');
assert.equal(rows[0].mail_status, 'notify: sent; thanks: sent');
assert.equal(sent.length, 2);

const [notify, thanks] = sent;
assert.deepEqual(notify.to, ['contact@refaqt.com']);
assert.equal(notify.reply_to, 'anna@example.be', 'a reply to the notification goes to the visitor');
assert.equal(notify.from, 'REFAQT website <website@refaqt.com>');
assert.equal(notify.key, `${rows[0].id}-notify`);
assert.match(notify.subject, /^New contact message from Anna Peeters \(anna@example\.be\)$/);
assert.match(notify.html, /Become a partner \(build, sell or support\)/);
assert.match(notify.text, /Lead ID: [0-9a-f-]{36}/);

assert.deepEqual(thanks.to, ['anna@example.be']);
assert.equal(thanks.from, 'REFAQT <contact@refaqt.com>');
assert.equal(thanks.reply_to, 'contact@refaqt.com');
assert.equal(thanks.subject, 'Thank you for your message to REFAQT');
assert.match(thanks.html, /Hello Anna Peeters,/);
assert.match(thanks.html, /within one business day/);
assert.match(thanks.text, /^Hello Anna Peeters,/);
assert.match(thanks.text, /within one business day/);
assert.match(thanks.text, /> We sell machines in Ghent\./);

// Visitor text is escaped and never becomes a link or HTML.
for (const m of [notify, thanks]) {
  assert.ok(!m.html.includes('<script>'), 'no script tag');
  assert.ok(!m.html.includes('<b>bold'), 'no visitor HTML');
  assert.match(m.html, /&lt;script&gt;alert\(1\)&lt;\/​script&gt;/);
  assert.ok(!/<a[\s>]/i.test(m.html), 'the emails have no links at all');
  assert.ok(!m.html.includes('https://evil.example'), 'the visitor web address is broken up in HTML');
  assert.ok(!m.text.includes('https://evil.example'), 'the visitor web address is broken up in text');
  assert.ok(!m.html.includes('anna@example.be'), 'the visitor email address is not a mailto link');
  assert.ok(!/<svg/i.test(m.html), 'no SVG');
  assert.match(m.html, /src="https:\/\/refaqt\.com\/assets\/img\/email-header-light\.png"/);
  assert.match(m.html, /src="https:\/\/refaqt\.com\/assets\/img\/email-header-dark\.png"/);
}

// ---- AQTUATOR form (also the default), no name ----
r = await post({ email: 'bob@example.com', interest: 'buy', variant: 'CS-360', message: 'Two stages, 5 kg payload.' });
assert.equal(r.status, 200);
rows = leads();
assert.equal(rows[1].form, 'aqtuator');
assert.equal(rows[1].variant, 'CS-360');
assert.equal(rows[1].name, '');
const [notify2, thanks2] = sent.slice(2);
assert.match(notify2.subject, /^New early-access request from bob@example\.com$/);
assert.equal(thanks2.subject, 'Thank you for your interest in AQTUATOR CS');
assert.match(thanks2.html, />Hello,</);
assert.match(thanks2.html, /CS-360/);
assert.match(thanks2.html, /Buy stages or parts/);
assert.match(thanks2.text, /Travel: CS-360/);

// ---- Bad input is refused, and nothing is saved or sent ----
fresh();
const bad = [
  [{ email: 'nope', message: 'x' }, 400, 'invalid email'],
  [{ email: 'a,b@example.com', message: 'x' }, 400, 'invalid email'],
  [{ email: 'a@example.com>', message: 'x' }, 400, 'invalid email'],
  [{ email: 'a@b.co', message: '' }, 400, 'message missing or too long'],
  [{ email: 'a@b.co', message: 'x'.repeat(2001) }, 400, 'message missing or too long'],
  [{ email: 'a@b.co', variant: 'CS-999', message: 'x' }, 400, 'invalid variant'],
  [{ email: 'a@b.co', interest: 'other', message: 'x' }, 400, 'invalid interest'],
  [{ email: 'a@b.co', name: 'Visit www.spam.example', message: 'x' }, 400, 'invalid name'],
  [{ email: 'a@b.co', name: 'see https://x.example', message: 'x' }, 400, 'invalid name'],
  [{ email: 'a@b.co', name: 'x'.repeat(101), message: 'x' }, 400, 'invalid name'],
  [{ form: 'home', email: 'e@f.be', interest: 'buy', message: 'x' }, 400, 'invalid interest'],
  [{ form: 'home', email: 'e@f.be', variant: 'CS-220', message: 'x' }, 400, 'invalid variant'],
  [{ form: 'shop', email: 'e@f.be', message: 'x' }, 400, 'invalid form'],
  [{ form: 'toString', email: 'e@f.be', message: 'x' }, 400, 'invalid form'],
  [{ email: 'a@b.co', message: 'x', token: '' }, 403, 'spam check failed'],
  [{ email: 'a@b.co', message: 'x', token: 'bad' }, 403, 'spam check failed'],
];
for (const [data, status, error] of bad) {
  r = await post(data);
  assert.equal(r.status, status, JSON.stringify(data));
  assert.equal((await r.json()).error, error);
}
assert.equal((await post({ email: 'a@b.co', message: 'x' }, { origin: 'https://evil.example' })).status, 403);
assert.equal((await post({ email: 'a@b.co', message: 'x' }, { origin: 'https://refaqt.github.io' })).status, 403, 'the old GitHub Pages address is no longer allowed');
assert.equal((await post({ email: 'a@b.co', message: 'x' }, { origin: '' })).status, 403);
for (const o of ['https://refaqt.com', 'https://www.refaqt.com', 'https://test.refaqt.com']) {
  r = await worker.fetch(new Request('https://x/', { method: 'OPTIONS', headers: { Origin: o } }), env);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), o);
}
assert.equal(leads().length, 0);
assert.equal(sent.length, 0);

// The trap for robots says "ok" but saves and sends nothing.
r = await post({ email: 'a@b.co', message: 'x', website: 'spam' });
assert.equal(r.status, 200);
assert.equal(leads().length, 0);
assert.equal(sent.length, 0);

// Without the Turnstile secret, the Worker refuses every message.
delete env.TURNSTILE_SECRET;
assert.equal((await post({ email: 'a@b.co', message: 'x' })).status, 503);
assert.equal(leads().length, 0);

// ---- Limits per visitor ----
fresh();
for (let i = 0; i < 5; i++) assert.equal((await post({ email: `p${i}@example.com`, message: 'hi' }, { ip: '1.2.3.4' })).status, 200);
r = await post({ email: 'p9@example.com', message: 'hi' }, { ip: '1.2.3.4' });
assert.equal(r.status, 429, 'the sixth message from one IP address in one hour is refused');
assert.equal((await r.json()).error, 'too many messages');
assert.equal((await post({ email: 'p9@example.com', message: 'hi' }, { ip: '5.6.7.8' })).status, 200, 'another IP address still works');
for (let i = 0; i < 2; i++) assert.equal((await post({ email: 'Victim@Example.com', message: 'hi' })).status, 200);
assert.equal((await post({ email: 'victim@example.com', message: 'hi' })).status, 200);
assert.equal((await post({ email: 'victim@example.com', message: 'hi' })).status, 429, 'the fourth email to one address in one day is refused');
assert.equal(leads().length, 9);
// No IP address or email address is stored in the counters.
const hits = env.DB.raw.prepare('SELECT key FROM form_hits').all().map(h => h.key).join(' ');
assert.ok(!hits.includes('1.2.3.4') && !hits.toLowerCase().includes('victim'));
// Counters older than one day are deleted with the next message.
env.DB.raw.prepare('UPDATE form_hits SET at = at - ?').run(2 * 24 * 3600_000);
assert.equal((await post({ email: 'victim@example.com', message: 'hi' })).status, 200);
assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM form_hits').get().n, 2);

// ---- Email problems never lose a lead ----
fresh();
resendStatus = 500;
r = await post({ form: 'home', email: 'c@example.com', interest: 'other', message: 'Resend is down.' });
assert.equal(r.status, 200);
assert.equal(leads()[0].mail_status, 'notify: failed 500 application_error; thanks: failed 500 application_error');
fresh();
delete env.RESEND_API_KEY;
r = await post({ form: 'home', email: 'd@example.com', interest: 'other', message: 'No key yet.' });
assert.equal(r.status, 200);
assert.equal(leads()[0].mail_status, 'not sent: RESEND_API_KEY is not set');

// ---- Small helpers ----
assert.equal(cleanName('  Anna\n  Peeters '), 'Anna Peeters');
assert.equal(cleanName(undefined), '');
assert.ok(EMAIL.test('first.last+tag@sub.example.co.uk'));
assert.ok(!EMAIL.test('a@b'));

// ---- Preview files for the screenshots ----
if (process.env.PREVIEW_DIR) {
  const dir = process.env.PREVIEW_DIR;
  mkdirSync(dir, { recursive: true });
  const sample = {
    id: '6f1c2a9e-3b7d-4c55-9a51-2f0e8d4b7c10', created_at: '2026-11-16T10:30:00.000Z', country: 'BE', origin: 'https://refaqt.com', user_agent: '',
  };
  const home = { ...sample, form: 'home', name: 'Anna Peeters', email: 'anna@example.be', interest: 'partner', variant: '', message: 'Hello REFAQT,\n\nWe build and sell small CNC machines in Ghent. We would like to offer your modules to our customers. Can we talk next week?\n\nOur site: www.example.be <b>not bold</b>' };
  const aq = { ...sample, form: 'aqtuator', name: '', email: 'bob@example.com', interest: 'buy', variant: 'CS-360', message: 'Two stages for a camera slider, 5 kg payload, about 200 mm/s.' };
  const files = { 'home-notify': notifyEmail(home, vars), 'home-thanks': thanksEmail(home, vars), 'aqtuator-notify': notifyEmail(aq, vars), 'aqtuator-thanks': thanksEmail(aq, vars) };
  for (const [name, m] of Object.entries(files)) {
    writeFileSync(join(dir, `${name}.html`), m.html);
    writeFileSync(join(dir, `${name}.txt`), `Subject: ${m.subject}\n\n${m.text}`);
  }
  console.log('previews written to', dir);
}

console.log('form worker tests passed');
