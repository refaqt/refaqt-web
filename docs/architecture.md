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
| `custom/index.html`, `custom/assets/` | AQTUATOR Custom service page (published). Uses the home page styles and form, and the three.js copy and the 3D model in `aqtuator/`. See [AQTUATOR Custom page](#aqtuator-custom-page) |
| `custom/tools/` | Script that draws the still pictures of the AQTUATOR Custom page (not published) |
| `forms-worker/` | Cloudflare Worker `refaqt-forms` for both forms: the home page contact form and AQTUATOR early access (not published) |
| `tools/build-site.sh` | Copies the public pages to `_site/`. Cloudflare and the GitHub workflow both run it |
| `wrangler.jsonc` | Cloudflare settings for the website: which folder to publish, and the production and test Workers |
| `docs/` | Log, decisions, mistakes, this file |
| `.agents/` | Shared agent kit, git submodule of `refaqt/refaqt-agents` |
| `.agents-local/` | Rules that belong only to this repository |
| `.claude/`, `.cursor/` | Start-up hook and adapters that fill `.agents/` and point at its rules |

## Data flow

1. Cloudflare builds every push to every branch with `tools/build-site.sh` and `wrangler.jsonc`. Only the root page,
   `aqtuator/` and `custom/` are published. Branch `main` is `refaqt.com`, branch `test` is
   `test.refaqt.com` (login needed), and every other branch gets a draft link
   `<branch>-refaqt-web.refaqt.workers.dev`. Why and how: [decision of 2026-11-14](decisions/2026-11-14_host-on-cloudflare.md).
2. The early-access form on `/aqtuator/` and the contact form on the home page post to the same
   Worker, `refaqt-forms`. The Worker saves each message in the Cloudflare D1 database
   `refaqt-leads` (EU), and sends two emails through Resend: one to `contact@refaqt.com` and a
   thank-you email to the visitor. Why: [decision of 2026-11-16](decisions/2026-11-16_forms-in-d1-with-resend.md).
   How to set it up and read the leads: `forms-worker/README.md`.

## AQTUATOR Custom page

The page at `/custom/` shows the real AQTUATOR CS model in 3D, and changes it step by step: the
seal strip goes, the linear motor becomes a ball screw with servo motor A, motor B comes in, the
rails and blocks grow from size 15 to size 20, and the stage gets longer. Each step is one line in
`STATES` in `custom/assets/js/morph.js`.

- The CAD parts come from `aqtuator/assets/models/aqtuator-cs.glb`, loaded with `loadTemplate()`
  from `aqtuator/assets/js/viewer.js`. They change size by moving vertices past cut planes, never
  by scaling, so holes and chamfers keep their size. The planes (`CUT` in `morph.js`) sit where the
  part has no vertices.
- The guide blocks are scaled as a whole around their rail foot.
- Parts that are not in the CAD model are built in code in `custom/assets/js/parts.js`: the guide
  rails with ball grooves and counterbores, cap screws, the ball screw (a real thread groove, so
  you see it turn), nut, bearing blocks, coupling and two generic servo motors.
- Check options: `?step=N&still=1` (one step, no motion), `&mix=0.5` (half way from step N-1),
  `&cam=x,y,z&target=x,y,z` (fixed camera for close views).

Draw the still pictures again after a change of the model (web server running in the root):

```bash
node custom/tools/render_still.cjs
```

```bash
python3 -c "from PIL import Image; Image.open('custom/assets/img/morph-still.png').save('custom/assets/img/morph-still.webp', quality=86, method=6)"
```

```bash
rm custom/assets/img/morph-still.png
```

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
