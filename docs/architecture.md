# Architecture

Short map of this repository. Update when the layout, start points, or main parts change.
Write this file in B2 English. Follow `.agents/rules/communication.md`.

## Purpose

The REFAQT website. The home page sits at the root. Each product has its own folder and its own
address under the site, for example `/aqtuator/`.

## Repository layout

| Path | Role |
| ---- | ---- |
| `index.html`, `assets/` | REFAQT home page (HTML, CSS, a small script for the contact form) |
| `tools/` | Render page and script for the home page images, built from the AQTUATOR CS model (not published). See [Machine pictures](#machine-pictures) |
| `aqtuator/index.html`, `aqtuator/assets/` | AQTUATOR CS product site (published) |
| `aqtuator/assets/vendor/three/` | Copy of three.js 0.160.0, the 3D library. Served from our own site, not from a CDN |
| `aqtuator/tools/` | Scripts that make the 3D model, the specifications and the images (not published) |
| `aqtuator/worker/` | Cloudflare Worker for both forms: AQTUATOR early access and the home page contact form (not published) |
| `.github/workflows/pages.yml` | Copies the public pages to `_site/` and deploys them to GitHub Pages |
| `docs/` | Log, decisions, mistakes, this file |
| `.agents/` | Shared agent kit, git submodule of `refaqt/refaqt-agents` |
| `.agents-local/` | Rules that belong only to this repository |
| `.claude/`, `.cursor/` | Start-up hook and adapters that fill `.agents/` and point at its rules |

## Data flow

1. A push to `main` starts `pages.yml`. It publishes the root page and `aqtuator/` only.
2. The early-access form on `/aqtuator/` and the contact form on the home page post to the same
   Worker. The Worker adds one row to a CSV file in the private repository `refaqt/refaqt-business`,
   one file per form.

## Machine pictures

The home page picture (`assets/img/machines.png`, `machines.webp`) and the share image
(`assets/img/og.png`) are drawn in a browser from `tools/render-machines.html`. The stages in
them are the real AQTUATOR CS model. The rest follows the founder's sketches. How we work with
the founder: [decision of 2026-11-14](decisions/2026-11-14_machine-pictures-from-founder-sketches.md).

### Files

| File | Role |
| ---- | ---- |
| `tools/render-machines.html` | The model. One function per machine: `mill()` (Qarve 5-axis mill), `laser()`, `cmm()`, and `lathe()` (old, not rebuilt yet). The `layout` list near the end places the machines in the home page picture |
| `tools/render_machines.cjs` | Opens the page in Chromium with Playwright and saves the pictures |
| `tools/vendor/three/RectAreaLightUniformsLib.js` | three.js 0.160.0 helper for the flat LED strip light (MIT licence). Only the tool uses it, so it is not in the published three.js folder |
| `docs/log/2026-11-13_realistic-*.md` | One log entry per machine: the agreed sizes and every round of changes |

### Draw the pictures

Start a web server in the root of the repository, then run the script:

```bash
python3 -m http.server 8765
```

```bash
node tools/render_machines.cjs
```

```bash
python3 -c "from PIL import Image; Image.open('assets/img/machines.png').save('assets/img/machines.webp', quality=86, method=6)"
```

To check one machine, set `ONLY` (writes `check-<name>.png` in the current folder). Options:
`CAM=x,y,z` (camera position), `TARGET=x,y,z` (the point the camera looks at), `TILT=1.4`
(mill only: the cradle angle in radians). Each machine has its own default camera in
`<name>.view`.

```bash
ONLY=laser CAM=0.75,1.5,1.05 TARGET=0,1.12,0.18 node tools/render_machines.cjs
```

### How the model is built

- Units are metres. Y is up, the front of a machine is +z. Each machine function returns one
  group with its floor at y = 0 (`userData.floor = true`). Heights in the machine body use
  `h(v)`: `v` metres above the machine bottom.
- `stage(parent, pos, offset, travel, up, len)`: one AQTUATOR CS stage. `pos` is the centre of
  the base bottom, `travel` and `up` are world directions, `offset` moves the carriage, `len` is
  the stage length. Any length works: `stretch()` makes the fixed parts longer or shorter at the
  middle, and the carriage keeps its real size. Travel = length − 220 mm.
- The carriage centre sits 10.4 mm off the base centre at `offset = 0`. So a carriage centre is
  `-0.0104 + offset` along the travel.
- Shared parts: `standFrame()` (black tube stand, with or without a door), `ledLight()` (one flat
  green light per LED strip), `plate()` (a flat plate with holes, from a 2D outline), `boltRing()`,
  `foot()`, `box()`, `cyl()`. Materials are in `MAT`; `MAT.black` is the black anodised finish.
- Mill, laser cutter and CMM share one gantry: Y stages on their edge on the side walls (flush
  outside), a 160 mm beam between the Y carriages, the X stage on its front, the Z stage upright
  on the X carriage.

### Copies in other repositories

These are copies for reading. Change the model here, then copy again.

- `refaqt/refaqt-business`: `docs/marketing/2026-11-13_5-axis-mill-renders/` and
  `docs/marketing/2026-11-13_laser-cutter-renders/`.
- `refaqt/qarve`: `docs/concept-renders/2026-11-13_5-axis-mill/` (the mill is the Qarve concept).

### Still open

- The lathe. It is still the old simple model and is left out of the home page picture. Rebuild
  it the same way, then put it back in `layout` and draw the pictures again with four machines.
- The CMM pictures are not copied to `refaqt/refaqt-business` yet.
