# 2026-11-14 — Repository ready for Cloudflare Pages: draft, test and production

**Role(s):** software, operations

## What happened

- The repository can now be published on Cloudflare Pages. One small script collects the public
  pages. Cloudflare and the old GitHub Pages deploy both use it, so the two cannot differ.
- Agents now have a rule: after each finished change, push the work and give the draft link.
  A person can look at every draft without a pull request.
- The form service now accepts messages from `refaqt.com`, `www.refaqt.com` and `test.refaqt.com`.
  This only takes effect after the next `npx wrangler deploy`.
- The setup steps for the Cloudflare account are in the
  [decision of 2026-11-14](../decisions/2026-11-14_host-on-cloudflare.md).

## Decisions

- Host on Cloudflare Pages, free plan. Branch `main` is production, branch `test` is the review
  version behind a login, every other branch is a draft.
- Draft links are not added to the form service. Forms are tested on `test.refaqt.com`.

## Open Questions

- Is `refaqt/refaqt-agents` public? If not, the first Cloudflare build may fail when it fetches
  `.agents/`.

## Next Steps

- A person does the Cloudflare setup (DNS, Pages project, domains, login, Turnstile, Worker deploy).
- When `refaqt.com` works, turn off the GitHub Pages workflow.

<details>
<summary>Technical details</summary>

- New `tools/build-site.sh`: copies `index.html`, `assets/`, `aqtuator/index.html` and
  `aqtuator/assets/` to `_site/`. `_site/` is in `.gitignore`.
- `.github/workflows/pages.yml` now runs that script instead of its own copy step.
- `aqtuator/worker/wrangler.toml`: `ALLOWED_ORIGINS` gains the three new addresses.
- Agent rule: rules 6 to 8 in `.agents-local/rules/repo.md`, with a short copy in `CLAUDE.md` and a
  line in `AGENTS.md`.
- Draft link format from the Cloudflare preview docs: branch name in lower case, other characters
  become `-`.
- Checked: the script builds `_site/` with only the public files.

</details>
