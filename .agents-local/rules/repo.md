# Repository profile: refaqt-web

The REFAQT website. Static pages on Cloudflare (Workers with static files), at
`refaqt.com`. GitHub Pages serves the old
address until `refaqt.com` is live.

## Facts

| Item | Value |
| --- | --- |
| Kind | Web, not hardware. No `doqs/` submodule. Route B of `.agents/INSTALL.md`. |
| Stack | Plain HTML, CSS and ES modules. No build step. |
| Build | `bash tools/build-site.sh` copies the public pages to `_site/`. |
| Host | Cloudflare Workers with static files. Settings: `wrangler.jsonc`. Two Workers: `refaqt-web` (production) and `refaqt-web-test` (test). Cloudflare builds every push. |
| Production | Branch `main` → `https://refaqt.com/` |
| Test (for review) | Branch `test` → `https://test.refaqt.com/` (login needed) |
| Draft | Any other branch → `https://<branch>-refaqt-web.<account>.workers.dev/` |
| Old address | `https://refaqt.github.io/refaqt-web/` (`.github/workflows/pages.yml`), until `refaqt.com` is live |
| Product pages | One folder per product. `aqtuator/` serves `/aqtuator/`. |

## Rules

1. Use relative links only (`assets/...`, `../`). The site lives under `/refaqt-web/` today and under
   `/` later. A link that starts with `/` breaks on one of the two.
2. Every new public folder needs a line in `tools/build-site.sh`. Tools, workers and docs stay out
   of the published site.
3. Numbers on product pages come from the hardware repository (for AQTUATOR: `refaqt/aqtuator`).
   Say where a number comes from, and mark design targets as targets.
4. Never put a token, a lead or other private data in this repository. Form data goes to the
   private `refaqt/refaqt-business` through the Worker in `aqtuator/worker/`.
5. Run `python3 -m http.server 8765` from the root and check the pages before you push.
6. Work on your own branch. Never push to `main` or `test` yourself. A pull request goes into
   `test`. After review on `test.refaqt.com`, a person merges `test` into `main`.
7. **Push after each finished change, and give the draft link.** When a change is done and checked
   (rule 5), commit it and push your branch. Do not wait for the end of the task. In your reply,
   give the draft link: `https://<branch>-refaqt-web.<account>.workers.dev/`. Build `<branch>` from the branch
   name: lower case, and every character that is not a letter or a digit becomes `-`. Example:
   `claude/new-page` gives `https://claude-new-page-refaqt-web.<account>.workers.dev/`.
   `<account>` is the workers.dev name of the REFAQT Cloudflare account (not known yet; until then,
   take the link from the Cloudflare check). Add the page path
   when you changed one page, for example `.../aqtuator/`. Say that the link updates about one
   minute after the push. Cloudflare shortens a branch name that makes the link too long. If you can read the checks on
   the commit in GitHub, give the exact link from the Cloudflare check instead.
8. Forms do not work on draft links. The Worker only accepts the addresses in `ALLOWED_ORIGINS`.
   Test forms on `test.refaqt.com`.
