# One repository for the whole REFAQT website

- **Date:** 2026-11-10
- **Status:** Accepted

Write this file in B2 English. Follow `.agents/rules/communication.md`. Keep official names, file paths, and numbers exact.

## Context

The repository `aqtuator-web` held only the AQTUATOR CS product page. REFAQT owns `refaqt.com` and
wants one website for the company and all its products.

## Decision

- Rename the repository to `refaqt-web`. It holds the whole REFAQT website.
- The home page sits at the root. Each product gets its own folder. AQTUATOR CS is in `aqtuator/`,
  so it will live at `refaqt.com/aqtuator/`.
- Build and test everything on GitHub Pages first (`refaqt.github.io/refaqt-web/`). Connect
  `refaqt.com` only when the site is ready.
- All links stay relative, so the same files work under `/refaqt-web/` and under `/`.

## Consequences

- The old address `refaqt.github.io/aqtuator-web/` stops working. GitHub does not redirect it.
- When `refaqt.com` goes live, the Worker must accept the new origin (`ALLOWED_ORIGINS`) and the
  Turnstile widget must list the new domain.
- A new product page means a new folder and one new line in `.github/workflows/pages.yml`.
