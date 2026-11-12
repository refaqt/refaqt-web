# refaqt-web

The REFAQT website. One repository holds every page of the site.

| Page | Folder | Now (GitHub Pages) | Later |
| --- | --- | --- | --- |
| REFAQT home | `/` | <https://refaqt.github.io/refaqt-web/> | <https://refaqt.com/> |
| AQTUATOR CS | [`aqtuator/`](aqtuator/) | <https://refaqt.github.io/refaqt-web/aqtuator/> | <https://refaqt.com/aqtuator/> |

The site runs on GitHub Pages first. It moves to `refaqt.com` later (see
[Move to refaqt.com](#move-to-refaqtcom)).

This repository used to be called `aqtuator-web`. GitHub does not redirect the
old Pages address `refaqt.github.io/aqtuator-web/`.

## What is here

| Path | What |
| --- | --- |
| `index.html`, `assets/` | The REFAQT home page. Plain HTML, CSS and one small script for the contact form. No build step. |
| `tools/` | Makes the home page images from the AQTUATOR CS model: `node tools/render_machines.cjs` (with the local server running). Not published. |
| `aqtuator/` | The AQTUATOR CS product site, with its tools and the form backend for both pages. See [`aqtuator/README.md`](aqtuator/README.md). |
| `.github/workflows/pages.yml` | Deploys the site on every push to `main`. Only the public pages are published. |
| `docs/` | Activity log, decisions, mistakes and the architecture overview. |
| `.agents/` | Shared agent rules and skills ([refaqt/refaqt-agents](https://github.com/refaqt/refaqt-agents)), a git submodule. |
| `AGENTS.md`, `CLAUDE.md` | Start page for AI agents. |

## Run locally

From the repository root:

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765> (home) or <http://localhost:8765/aqtuator/>.

## Clone with the agent kit

```bash
git clone --recurse-submodules https://github.com/refaqt/refaqt-web.git
```

In a clone that already exists, fill `.agents/` once:

```bash
bash setup-agents.sh
```

## Add a page

Put each product in its own folder, with its own `index.html` and `assets/`.
Use relative links only (`assets/...`, never `/assets/...`). Then add the folder
to the copy step in `.github/workflows/pages.yml`.

## Move to refaqt.com

Do this only when the site is ready.

1. Settings → Pages → Custom domain: `refaqt.com`. GitHub writes the domain
   setting for you; with GitHub Actions deploys, no `CNAME` file is needed.
2. At the domain registrar, point `refaqt.com` to GitHub Pages (four `A`
   records, and a `CNAME` record for `www` to `refaqt.github.io`). The GitHub
   Pages documentation lists the current addresses.
3. Tick **Enforce HTTPS** once the certificate is ready.
4. Add `https://refaqt.com` to `ALLOWED_ORIGINS` in
   `aqtuator/worker/wrangler.toml`, and add `refaqt.com` to the Turnstile
   widget. Otherwise the early-access form stops working.

## Licences

Copyright © 2025–2026 Refaqt (BE 0804.145.539) and contributors. Contributions are accepted
under the [Refaqt Contributor Licence Agreement](https://github.com/refaqt/.github/blob/main/CLA.md).

The site (code, text and images) is licensed under the Creative Commons
Attribution-ShareAlike 4.0 International licence (CC BY-SA 4.0). See [`LICENSE`](LICENSE).
Until 10 November 2026 the site was published under CC0 1.0. Copies taken before that date
stay under CC0.

The AQTUATOR model and renders come from the AQTUATOR hardware design (CERN-OHL-S-2.0).
Third-party code in `aqtuator/assets/vendor/` keeps its own licence.

"Refaqt" and "AQTUATOR", and their logos, are trademarks of Refaqt (BE 0804.145.539). The
licences above do not cover them.
