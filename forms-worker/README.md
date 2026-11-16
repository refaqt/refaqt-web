# Form backend: the Worker `refaqt-forms`

Both forms on the website post to this Cloudflare Worker: the contact form on the home page and the
AQTUATOR CS early-access form. Address: `https://refaqt-forms.refaqt.workers.dev`.

For each message, the Worker:

1. checks the input, a hidden field that only robots fill in, and the Turnstile spam check;
2. checks the limit per visitor: at most 5 messages per IP address per hour, and at most 3
   messages per email address per day (settings `LIMIT_PER_IP_PER_HOUR`, `LIMIT_PER_EMAIL_PER_DAY`);
3. saves the lead in the D1 database `refaqt-leads` (EU jurisdiction);
4. sends an email to `contact@refaqt.com`. Its reply address is the visitor, so "Reply" in Gmail
   goes to the visitor;
5. sends a thank-you email to the visitor, from `REFAQT <contact@refaqt.com>`, with a copy of the
   message.

The lead is saved before the emails go out. If Resend has a problem, the lead is still there, and
the column `mail_status` says what went wrong.

The site repository is public. It never holds a secret key or a lead.

## Files

| File | Role |
| --- | --- |
| `src/index.js` | The Worker: checks, limits, database, sending |
| `src/email.js` | The two emails, as HTML and as plain text |
| `migrations/` | The database tables. One numbered file per change. Never edit a file after it ran |
| `wrangler.jsonc` | Settings: name, database, allowed sites, senders, limits |
| `test.mjs` | Tests with a real SQLite database, a fake Resend and a fake Turnstile |

## What is stored

Table `leads`, one row per message: `id`, `created_at`, `form` (`home` or `aqtuator`), `name`,
`email`, `interest`, `variant`, `message`, `country`, `user_agent`, `origin`, `mail_status`.

Table `form_hits` holds the counters for the limits. It keeps only a hash of the IP address and of
the email address, never the address itself. Rows older than one day are deleted with each new
message.

## Set up (once)

These are done: the D1 database `refaqt-leads` (EU) with ID `373700fa-5103-485c-9df1-8d3759aad28e`,
and the Turnstile widget `REFAQT forms` with site key `0x4AAAAAAGDLVuIOMJ3Koqir`.

1. **Resend.** Create an account at resend.com. Domains → Add domain → `refaqt.com`, region
   **Ireland (eu-west-1)**. Resend shows three DNS records (an `MX` and a `TXT` on `send`, and a
   `TXT` on `resend._domainkey`). Add them in Cloudflare → `refaqt.com` → DNS → Records. They do
   not touch the Google Workspace records on `refaqt.com` itself. Then press Verify in Resend.
2. **Resend key.** API Keys → Create. Permission "Sending access", domain `refaqt.com`.
3. **Worker.** Workers & Pages → Create → Import a repository → `refaqt/refaqt-web`.
   - Project name: `refaqt-forms`
   - Root directory: `forms-worker`
   - Build command: empty
   - Deploy command: `npx wrangler d1 migrations apply refaqt-leads --remote && npx wrangler deploy`
   - After the first deploy, in Settings → Build: production branch `main`, builds for other
     branches off. In Settings → Domains & Routes: preview URLs off.
4. **Secrets.** Settings → Variables and Secrets → Add, type **Secret**:
   - `RESEND_API_KEY`: the key from step 2.
   - `TURNSTILE_SECRET`: Cloudflare → Turnstile → `REFAQT forms` → Settings → secret key.

   Without `TURNSTILE_SECRET` the Worker refuses every message. Without `RESEND_API_KEY` it saves
   leads but sends no email.

The Worker address and the Turnstile site key are already in `assets/js/config.js` and
`aqtuator/assets/js/config.js`.

## See and export the leads

Cloudflare dashboard → Storage & databases → D1 → `refaqt-leads` → Console. Run for example:

```sql
SELECT created_at, form, name, email, interest, variant, message, mail_status FROM leads ORDER BY created_at DESC;
```

The table view in the same page shows rows too. To get a file, run this from a computer with
Wrangler signed in:

```bash
npx wrangler d1 export refaqt-leads --remote --table leads --output leads.sql
```

Or as JSON, which a spreadsheet can open:

```bash
npx wrangler d1 execute refaqt-leads --remote --json --command "SELECT * FROM leads ORDER BY created_at" > leads.json
```

Never commit an export. Leads are private data.

## Test

```bash
node forms-worker/test.mjs
```

The test builds a database from `migrations/`, sends both forms, and checks the emails (sender,
reply address, escaping, no links), the bad-input answers, the limits, and what happens when
Resend fails. With `PREVIEW_DIR=<folder>` it also writes the four emails as HTML and text files.

To try the forms on your own computer: run `npx wrangler d1 migrations apply refaqt-leads --local`,
then `npx wrangler dev --var ALLOWED_ORIGINS:http://localhost:8765 --var TURNSTILE_SECRET:1x0000000000000000000000000000000AA`
in this folder. Serve a copy of the site where both `config.js` files use
`http://localhost:8787` and the Turnstile test site key `1x00000000000000000000AA`. Do not commit
those test values.

## Limits

- Resend free plan (checked 2026-11-16): 3,000 emails per month and 100 per day. Each message
  sends two emails, so at most 50 messages per day.
- Cloudflare Workers free plan: 100,000 requests per day. D1 free plan: 5 GB in total.
