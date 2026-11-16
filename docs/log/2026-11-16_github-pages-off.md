# 2026-11-16 — Old GitHub Pages copy of the site turned off

**Role(s):** software, operations

## What happened

- The site now runs on `refaqt.com` through Cloudflare. The old copy at
  `refaqt.github.io/refaqt-web/` is no longer needed.
- The GitHub workflow that published that copy is removed on branch `claude/turn-off-github-pages`,
  not yet merged.
- The README, the agent rules and the architecture page no longer talk about GitHub Pages.

## Decisions

- None new. This is step 8 of the
  [decision of 2026-11-14](../decisions/2026-11-14_host-on-cloudflare.md).

## Open Questions

- None.

## Next Steps

- After the merge into `main`, a person turns off GitHub Pages in the repository settings
  (Settings → Pages). Then the old address stops working.
- Then remove `refaqt.github.io` from the Turnstile widget `REFAQT forms`.

<details>
<summary>Technical details</summary>

- Deleted `.github/workflows/pages.yml`. Removed `touch _site/.nojekyll` from `tools/build-site.sh`;
  that file only matters for GitHub Pages.
- `bash tools/build-site.sh` still builds `_site/` with `index.html`, `assets/` and `aqtuator/`.

</details>
