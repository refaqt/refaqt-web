# 2026-11-16 — Both forms now save leads and send emails

**Role(s):** software, sales

## What happened

- Both forms on the website now post to one new Worker, `refaqt-forms`. It saves every message in
  a Cloudflare database in the EU, emails it to `contact@refaqt.com`, and sends the visitor a
  thank-you email with a copy of the message.
- Both forms have an optional Name field and one privacy sentence.
- The old plan (a spreadsheet file in a private GitHub repository) is removed.
- In Cloudflare: the database `refaqt-leads` (EU) is created. The Turnstile widget `REFAQT forms`
  already existed and is reused.
- This is on branch `claude/forms-d1-resend`, not yet merged into `test` or `main`.

## Decisions

- [Form messages go to a Cloudflare database and are answered by email](../decisions/2026-11-16_forms-in-d1-with-resend.md).

## Open Questions

- The privacy sentence needs a check by a lawyer. The site has no privacy page yet.
- The Turnstile widget still lists `refaqt.github.io`. Remove it when GitHub Pages is off.

## Next Steps

- The founder creates the Resend account, verifies `refaqt.com` there, and adds its three DNS
  records in Cloudflare.
- The founder connects the Worker to GitHub in Cloudflare and enters the two secret keys.
- After the merge into `test`: send one real message from `test.refaqt.com` and check both emails
  and the lead in the database.

<details>
<summary>Technical details</summary>

- `aqtuator/worker/` moved to `forms-worker/`. `wrangler.toml` replaced by `wrangler.jsonc`
  (D1 binding `DB`, database ID `373700fa-5103-485c-9df1-8d3759aad28e`, `preview_urls: false`).
- `migrations/0001_create_leads.sql`: tables `leads` and `form_hits`. Applied locally only; the
  deploy command applies it remotely.
- Resend: `POST https://api.resend.com/emails`, one call per email, `Idempotency-Key` per lead.
  Notification from `website@refaqt.com`, thank-you from `contact@refaqt.com`.
- Visitor text: HTML-escaped; a zero-width space after `.`, `@`, `:` and `/` stops mail programs
  from making links. The emails contain no `<a>` tags and no SVG.
- `node forms-worker/test.mjs`: all checks pass (node:sqlite with the real migration, fake Resend,
  fake Turnstile).
- Local run with `wrangler dev` 4.163.0, local D1 and the Turnstile test keys: both forms sent in
  Chromium (Playwright) and Firefox 160 (Puppeteer; Windows blocks the Playwright Firefox build).
  With outside hosts blocked, both forms show "The spam check could not load…".
- The AQTUATOR form now also starts when the variant list fails to load.

</details>
