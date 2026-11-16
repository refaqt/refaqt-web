# refaqt-web

The REFAQT website. One repository holds every page of the site.

| Page | Folder | Address |
| --- | --- | --- |
| REFAQT home | `/` | <https://refaqt.com/> |
| AQTUATOR CS | [`aqtuator/`](aqtuator/) | <https://refaqt.com/aqtuator/> |

The site runs on Cloudflare (Workers with static files). Branch `main` is
`refaqt.com`, branch `test` is `test.refaqt.com` (login needed), and every other
branch gets a draft link. Why and how: [decision of 2026-11-14](docs/decisions/2026-11-14_host-on-cloudflare.md).

The old copies on GitHub Pages (`refaqt.github.io/refaqt-web/` and, before the
rename, `refaqt.github.io/aqtuator-web/`) are turned off.

## What is here

| Path | What |
| --- | --- |
| `index.html`, `assets/` | The REFAQT home page. Plain HTML, CSS and one small script for the contact form. No build step. |
| `tools/` | Makes the home page images from the AQTUATOR CS model: `node tools/render_machines.cjs` (with the local server running). Not published. |
| `aqtuator/` | The AQTUATOR CS product site and its tools. See [`aqtuator/README.md`](aqtuator/README.md). |
| `forms-worker/` | The backend for both forms (Cloudflare Worker `refaqt-forms`). See [`forms-worker/README.md`](forms-worker/README.md). |
| `tools/build-site.sh`, `wrangler.jsonc` | Build and Cloudflare settings. Only the public pages are published. |
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
to the copy step in `tools/build-site.sh`.

The forms only work on the addresses in `ALLOWED_ORIGINS` in
`forms-worker/wrangler.jsonc`. See `forms-worker/README.md`.

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
