# Form messages go to a Cloudflare database and are answered by email

- **Date:** 2026-11-16
- **Status:** Accepted. The code is done. The Resend account, its DNS records, the Worker in
  Cloudflare and its two secret keys are still to do (see `forms-worker/README.md`).

Write this file in B2 English. Follow `.agents/rules/communication.md`.

## Context

The website has two forms: the contact form on the home page and the AQTUATOR CS early-access form.
Neither worked. The planned backend saved each message as a row in a spreadsheet file (CSV) in the
private repository `refaqt/refaqt-business`, through a GitHub key. It was never set up. It also had
weak points: the GitHub key could change the whole business repository, every message was a new
commit, and nobody got an alert when a message came in.

## Decision

One Cloudflare Worker, `refaqt-forms` (folder `forms-worker/`), serves both forms.

- **Storage:** the Cloudflare D1 database `refaqt-leads`, with EU jurisdiction (the data stays in
  the EU). The table layout is in `forms-worker/migrations/`.
- **Email:** Resend, a paid-per-use email service with a free plan, region Ireland (eu-west-1).
  Every message sends an email to `contact@refaqt.com` with the visitor as reply address, and a
  thank-you email to the visitor in the REFAQT house style, with a copy of their message.
- **Spam and abuse:** the Turnstile spam check is required, a hidden field catches simple robots,
  and there is a limit per visitor: 5 messages per IP address per hour, 3 per email address per day.
  The limit matters because the thank-you email goes to any address that someone types in. Visitor
  text in the emails is escaped and can never become a link.
- **Optional name:** both forms ask for an optional name, so the thank-you email can say
  "Hello Anna". A name that holds a web address or an email address is refused.
- The Worker is a Cloudflare application connected to GitHub, like the website: branch `main`
  deploys it, and the deploy also applies new database changes.

We chose Resend over Cloudflare's own email sending because the founder asked for Resend. Cloudflare
Email Sending is an option to look at again later, since it would remove one outside service.

## Consequences

- The GitHub key, the CSV code and the link to `refaqt/refaqt-business` are gone from this repository.
- Leads are read in the Cloudflare dashboard (D1 → `refaqt-leads` → Console), or exported with
  Wrangler. Steps: `forms-worker/README.md`.
- Resend free plan (checked 2026-11-16): 3,000 emails per month, 100 per day. That is 50 messages
  per day, because each message sends two emails.
- Resend needs three new DNS records on `send` and `resend._domainkey`. The Google Workspace mail
  records stay as they are.
- A short privacy sentence sits under each form. A lawyer must check it, and the site should get a
  privacy page.
