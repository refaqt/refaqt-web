# Architecture

Short map of this repository. Update when the layout, start points, or main parts change.
Write this file in B2 English. Follow `.agents/rules/communication.md`.

## Purpose

The REFAQT website. The home page sits at the root. Each product has its own folder and its own
address under the site, for example `/aqtuator/`.

## Repository layout

| Path | Role |
| ---- | ---- |
| `index.html`, `assets/` | REFAQT home page |
| `aqtuator/index.html`, `aqtuator/assets/` | AQTUATOR CS product site (published) |
| `aqtuator/assets/vendor/three/` | Copy of three.js 0.160.0, the 3D library. Served from our own site, not from a CDN |
| `aqtuator/tools/` | Scripts that make the 3D model, the specifications and the images (not published) |
| `aqtuator/worker/` | Cloudflare Worker for the early-access form (not published) |
| `.github/workflows/pages.yml` | Copies the public pages to `_site/` and deploys them to GitHub Pages |
| `docs/` | Log, decisions, mistakes, this file |
| `.agents/` | Shared agent kit, git submodule of `refaqt/refaqt-agents` |
| `.agents-local/` | Rules that belong only to this repository |
| `.claude/`, `.cursor/` | Start-up hook and adapters that fill `.agents/` and point at its rules |

## Data flow

1. A push to `main` starts `pages.yml`. It publishes the root page and `aqtuator/` only.
2. The early-access form on `/aqtuator/` posts to the Worker. The Worker adds one row to a CSV file
   in the private repository `refaqt/refaqt-business`.
