// Tests for the Worker with a fake GitHub API.   node worker/test.mjs
import assert from 'node:assert/strict';
import worker, { csvCell } from './src/index.js';

const env = { GITHUB_REPO: 'refaqt/refaqt-business', GITHUB_BRANCH: 'main', CSV_PATH: 'leads/aqtuator-cs.csv', ALLOWED_ORIGINS: 'https://refaqt.github.io', GITHUB_TOKEN: 'test' };
let file = null, sha = 0, conflicts = 0, puts = [];

globalThis.fetch = async (url, init = {}) => {
  if (!String(url).startsWith('https://api.github.com/repos/refaqt/refaqt-business/contents/leads/aqtuator-cs.csv')) throw new Error('unexpected url ' + url);
  if (!init.method || init.method === 'GET') {
    if (file === null) return new Response('{}', { status: 404 });
    return Response.json({ sha: String(sha), content: Buffer.from(file).toString('base64') });
  }
  const body = JSON.parse(init.body);
  puts.push(body);
  if (conflicts > 0) { conflicts--; sha++; return new Response('{}', { status: 409 }); }
  if (file !== null && body.sha !== String(sha)) return new Response('{}', { status: 409 });
  file = Buffer.from(body.content, 'base64').toString('utf8');
  sha++;
  return Response.json({});
};

const post = (data, origin = 'https://refaqt.github.io') => worker.fetch(new Request('https://w.example/', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), env);

// creates the file with a header
let r = await post({ email: 'a@b.co', variant: 'CS-360', message: 'Hello "world"\nline 2' });
assert.equal(r.status, 200);
assert.match(file, /^timestamp,email,variant,message,country,user_agent\n/);
assert.match(file, /"a@b\.co","CS-360","Hello ""world""\nline 2"/);
assert.ok(!puts[0].message.includes('a@b.co'), 'email must not be in the commit message');

// appends, and survives a conflict
conflicts = 1;
r = await post({ email: 'c@d.io', variant: '', message: '=HYPERLINK("x")' });
assert.equal(r.status, 200);
assert.equal(file.split('\n').filter(l => l.startsWith('"20')).length, 2);
assert.match(file, /"'=HYPERLINK\(""x""\)"/);

// rejects bad input
assert.equal((await post({ email: 'nope', message: 'x' })).status, 400);
assert.equal((await post({ email: 'a@b.co', message: '' })).status, 400);
assert.equal((await post({ email: 'a@b.co', message: 'x'.repeat(2001) })).status, 400);
assert.equal((await post({ email: 'a@b.co', variant: 'CS-999', message: 'x' })).status, 400);
assert.equal((await post({ email: 'a@b.co', message: 'x' }, 'https://evil.example')).status, 403);

// honeypot: says ok, stores nothing
const before = file;
assert.equal((await post({ email: 'a@b.co', message: 'x', website: 'spam' })).status, 200);
assert.equal(file, before);

// Turnstile on: missing token is refused
assert.equal((await worker.fetch(new Request('https://w.example/', { method: 'POST', headers: { Origin: 'https://refaqt.github.io' }, body: JSON.stringify({ email: 'a@b.co', message: 'x' }) }), { ...env, TURNSTILE_SECRET: 's' })).status, 403);

assert.equal(csvCell('-1'), `"'-1"`);
console.log('worker tests passed');
