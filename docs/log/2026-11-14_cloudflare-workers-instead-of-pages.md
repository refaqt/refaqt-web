# 2026-11-14 — Website moves to Cloudflare Workers instead of Cloudflare Pages

**Role(s):** software, operations

## What happened

- The domain `refaqt.com` now uses Cloudflare for its DNS. The founder changed the nameservers at
  Easyhost.
- When the founder started to create the site, Cloudflare showed Pages as "legacy" and offered
  Workers first. We switched to Workers, the newer way to host a site on Cloudflare.
- The repository now has the Cloudflare settings for this: one production site (branch `main`) and
  one test site (branch `test`). Every other branch still gets a draft link, but the link has a new
  form.
- The agent rule and the setup steps are updated to match.

## Decisions

- Use Workers with static files. Why and the setup steps:
  [decision of 2026-11-14](../decisions/2026-11-14_host-on-cloudflare.md).

## Open Questions

- None. The workers.dev name of the account is now `refaqt` (it was the founder's personal name),
  so draft links end in `refaqt.workers.dev`.

## Next Steps

- The founder creates the two Workers and connects the domains.
- Then the form Worker, the login on the test site, and turning off the old GitHub Pages copy.

<details>
<summary>Technical details</summary>

- New `wrangler.jsonc` at the root: publishes `_site/` as static files, `auto-trailing-slash`
  so `/aqtuator/` works, preview links on. `env.test` deploys a second Worker `refaqt-web-test`.
- Checked with Wrangler 4.162.0: `wrangler deploy --dry-run` passes for both production and
  `--env test` (50 files). `wrangler dev` serves `/` and `/aqtuator/` (200), sends `/aqtuator` to
  `/aqtuator/`, and gives 404 for `tools/` and `aqtuator/worker/`.
- Draft link form: `<branch>-refaqt-web.refaqt.workers.dev`, from the Cloudflare changelog on
  Workers preview links (2025-07-23 and 2025-08-08).
- Decision file renamed from `2026-11-14_host-on-cloudflare-pages.md` to
  `2026-11-14_host-on-cloudflare.md`; links updated. `.wrangler/` is in `.gitignore`.

</details>
