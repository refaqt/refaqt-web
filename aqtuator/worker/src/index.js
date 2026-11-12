// Cloudflare Worker: stores AQTUATOR CS early-access requests and REFAQT home page messages.
//
// The website posts { form, email, interest, variant, message, website, token } as JSON.
// "form" is "aqtuator" (the default) or "home". Each form has its own CSV file.
// The Worker checks the input and the Turnstile token, then appends one row
// to a CSV file in a PRIVATE GitHub repository and commits it to main.
// Email addresses never go into the public site repository or a commit message.
//
// Settings (wrangler.toml [vars]):  GITHUB_REPO, GITHUB_BRANCH, CSV_PATH, HOME_CSV_PATH, ALLOWED_ORIGINS
// Secrets (wrangler secret put):    GITHUB_TOKEN, TURNSTILE_SECRET (optional)

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// One entry per form on the site.
const FORMS = {
  aqtuator: {
    header: 'timestamp,email,interest,variant,message,country,user_agent\n',
    // What the visitor wants: buy stages or parts, build it themselves, or a commercial licence.
    interests: new Set(['', 'buy', 'diy', 'licence']),
    variants: new Set(['', 'CS-220', 'CS-280', 'CS-360', 'CS-440', 'CS-520', 'CS-600']),
    path: env => env.CSV_PATH || 'leads/aqtuator-cs.csv',
    commit: 'Add AQTUATOR CS early-access request',
    committer: 'AQTUATOR web form',
  },
  home: {
    header: 'timestamp,email,interest,message,country,user_agent\n',
    // Contribute to the designs, become a partner, custom engineering, a commercial licence, or something else.
    interests: new Set(['', 'contribute', 'partner', 'engineering', 'licence', 'other']),
    variants: new Set(['']),
    path: env => env.HOME_CSV_PATH || 'leads/refaqt-home.csv',
    commit: 'Add REFAQT home page message',
    committer: 'REFAQT web form',
  },
};

export default {
  async fetch(request, env) {
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
    if (allowed.length && !allowed.includes(origin)) return reply(403, { ok: false, error: 'origin not allowed' });

    let data;
    try { data = await request.json(); } catch { return reply(400, { ok: false, error: 'bad request' }); }
    const formName = String(data.form || 'aqtuator').trim();
    const form = Object.hasOwn(FORMS, formName) ? FORMS[formName] : null;
    if (!form) return reply(400, { ok: false, error: 'invalid form' });
    const email = String(data.email || '').trim();
    const interest = String(data.interest || '').trim();
    const variant = String(data.variant || '').trim();
    const message = String(data.message || '').trim();

    // Honeypot: bots fill the hidden "website" field. Pretend it worked.
    if (data.website) return reply(200, { ok: true });
    if (!EMAIL.test(email) || email.length > 254) return reply(400, { ok: false, error: 'invalid email' });
    if (!form.interests.has(interest)) return reply(400, { ok: false, error: 'invalid interest' });
    if (!form.variants.has(variant)) return reply(400, { ok: false, error: 'invalid variant' });
    if (!message || message.length > 2000) return reply(400, { ok: false, error: 'message missing or too long' });

    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET, data.token, request.headers.get('CF-Connecting-IP'));
      if (!ok) return reply(403, { ok: false, error: 'spam check failed' });
    }

    const cells = formName === 'home'
      ? [new Date().toISOString(), email, interest, message]
      : [new Date().toISOString(), email, interest, variant, message];
    cells.push(request.cf?.country || '', (request.headers.get('User-Agent') || '').slice(0, 200));
    const row = cells.map(csvCell).join(',') + '\n';

    try {
      await appendRow(env, row, form);
    } catch (err) {
      console.error('append failed', err.message);
      return reply(502, { ok: false, error: 'could not store the request' });
    }
    return reply(200, { ok: true });
  },
};

// One CSV cell: quoted, quotes doubled, line breaks kept inside the quotes.
// A leading = + - @ is escaped so a spreadsheet does not run it as a formula.
export function csvCell(value) {
  let s = String(value).replace(/\r\n?/g, '\n');
  if (/^[=+\-@\t]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = await res.json().catch(() => ({}));
  return out.success === true;
}

const b64encode = s => { const bytes = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin); };
const b64decode = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), c => c.charCodeAt(0)));

// Read the file, add the row, write it back. GitHub refuses the write (409)
// when someone else changed the file in between; then read again and retry.
export async function appendRow(env, row, form = FORMS.aqtuator, attempts = 4) {
  const repo = env.GITHUB_REPO, branch = env.GITHUB_BRANCH || 'main', file = form.path(env);
  const HEADER = form.header;
  const api = `https://api.github.com/repos/${repo}/contents/${file.split('/').map(encodeURIComponent).join('/')}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'refaqt-web-leads',
  };
  for (let i = 0; i < attempts; i++) {
    const get = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
    let sha, text = HEADER;
    if (get.status === 200) {
      const f = await get.json();
      sha = f.sha;
      text = b64decode(f.content || '');
      if (!text) text = HEADER;
      if (!text.endsWith('\n')) text += '\n';
    } else if (get.status !== 404) {
      throw new Error(`GitHub read ${get.status}`);
    }
    const put = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: form.commit,
        content: b64encode(text + row),
        branch,
        ...(sha ? { sha } : {}),
        committer: { name: form.committer, email: 'noreply@refaqt.com' },
      }),
    });
    if (put.ok) return;
    if (put.status !== 409 && put.status !== 422) throw new Error(`GitHub write ${put.status}`);
    await new Promise(r => setTimeout(r, 200 * (i + 1) + Math.random() * 300));
  }
  throw new Error('GitHub write conflict');
}
