# Repository profile: refaqt-web

The REFAQT website. Static pages on GitHub Pages, later on `refaqt.com`.

## Facts

| Item | Value |
| --- | --- |
| Kind | Web, not hardware. No `doqs/` submodule. Route B of `.agents/INSTALL.md`. |
| Stack | Plain HTML, CSS and ES modules. No build step. |
| Deploy | `.github/workflows/pages.yml` on every push to `main`. |
| Address now | `https://refaqt.github.io/refaqt-web/` |
| Address later | `https://refaqt.com/` |
| Product pages | One folder per product. `aqtuator/` serves `/aqtuator/`. |

## Rules

1. Use relative links only (`assets/...`, `../`). The site lives under `/refaqt-web/` today and under
   `/` later. A link that starts with `/` breaks on one of the two.
2. Every new public folder needs a line in the copy step of `.github/workflows/pages.yml`. Tools,
   workers and docs stay out of the published site.
3. Numbers on product pages come from the hardware repository (for AQTUATOR: `refaqt/aqtuator`).
   Say where a number comes from, and mark design targets as targets.
4. Never put a token, a lead or other private data in this repository. Form data goes to the
   private `refaqt/refaqt-business` through the Worker in `aqtuator/worker/`.
5. Run `python3 -m http.server 8765` from the root and check the pages before you push.
