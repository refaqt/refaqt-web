# 2026-11-10 — Repository renamed to refaqt-web

**Role(s):** software, marketing

## What happened

- The repository `aqtuator-web` was renamed to `refaqt-web`. It now holds the whole REFAQT website.
- After the rename, `refaqt.github.io/aqtuator-web/` showed a GitHub 404 page. GitHub does not
  redirect Pages addresses after a rename. The site lives at `refaqt.github.io/refaqt-web/` now.
- The AQTUATOR CS site moved into the folder `aqtuator/`, with its tools and its form Worker.
- A first, simple REFAQT home page is at the root. It links to AQTUATOR CS.
- The deploy workflow now publishes the home page and `aqtuator/`, and nothing else.
- The shared agent kit (`refaqt/refaqt-agents`) is now a submodule at `.agents/`, with the start-up
  hook, `CLAUDE.md`, `AGENTS.md`, the pull request template, and the `docs/` log folders.

## Decisions

- One repository for the whole site, one folder per product. See
  [the decision record](../decisions/2026-11-10_one-repo-for-the-refaqt-site.md).

## Open Questions

- What should the REFAQT home page say beyond the product list?
- When does the site move to `refaqt.com`?

## Next Steps

- Check that the site works at `refaqt.github.io/refaqt-web/` and `/aqtuator/` after the merge.
- Connect `refaqt.com` when the site is ready (steps in the root `README.md`).
