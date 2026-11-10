# AQTUATOR CS site

Product website for **AQTUATOR CS**, the compact linear-motor stage from
[`refaqt/aqtuator`](https://github.com/refaqt/aqtuator/tree/main/modules/compact-stage).

Live at <https://refaqt.github.io/refaqt-web/aqtuator/> (GitHub Pages). Later at
<https://refaqt.com/aqtuator/>. This folder is part of the REFAQT website; see
the [root README](../README.md).

All paths below start in this folder (`aqtuator/`).

## What is here

| Path | What |
| --- | --- |
| `index.html`, `assets/css/`, `assets/js/` | The site. Plain HTML, CSS and ES modules. No build step. three.js comes from jsDelivr (pinned to 0.160.0). |
| `assets/models/aqtuator-cs.glb` | The 3D model, exported from the real FreeCAD assembly. |
| `assets/data/variants.json` | Specifications of the six travels. The configurator and the tables read it. |
| `assets/img/` | Logo, favicon, hero poster and social image (rendered from the model). |
| `tools/` | Scripts that make the model, the data and the images. |
| `worker/` | Cloudflare Worker for the early-access form. See [`worker/README.md`](worker/README.md). |

## Run locally

From the root of `refaqt-web`:

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765/aqtuator/>.

## Update the model, the data or the images

You need a clone of `refaqt/aqtuator` with its CAD (Git LFS) and the `stoq`
submodule, and FreeCAD 1.1 (`freecadcmd`). Without the Fasteners workbench the
screws are left out; that is fine for the site.

1. Export the assembly (run in the `aqtuator` clone):

   ```bash
   freecadcmd /path/to/refaqt-web/aqtuator/tools/export_glb.py modules/compact-stage/cad/assemblies/compact-stage/compact-stage.FCStd /tmp/stage-raw.glb /path/to/refaqt-web/aqtuator/tools/stage-info.json
   ```

2. Compress it (meshopt, about 15 MB to 2.4 MB):

   ```bash
   npx @gltf-transform/cli@4.1.1 optimize /tmp/stage-raw.glb assets/models/aqtuator-cs.glb --compress meshopt --simplify false --join false --instance false --flatten false --palette false
   ```

3. Make the specifications:

   ```bash
   python3 tools/variants.py
   ```

4. Render the hero poster and the social image (needs Playwright, and the
   local server from above):

   ```bash
   node tools/render_stills.cjs
   ```

## Where the numbers come from

- Accuracy, speed, force and load: requirements `STG-01` to `STG-15` in
  `modules/compact-stage/architecture/compact-stage.sysml`. They are **design
  targets**, and the site says so.
- Length per travel: `STG-03` (length = travel + 340 mm − 2 × height), which
  gives 440 mm for the 220 mm build in the CAD.
- Rail length, magnet track, encoder length, base screws and mass: scaled from
  the 220 mm CAD model by `tools/variants.py`. Check them when a longer stage is
  drawn.

## Go live

The workflow in the repository root deploys this folder with the rest of the
site. The one step left for this page: set up the form backend, see
[`worker/README.md`](worker/README.md).

## Licences

Site code: see [`LICENSE`](LICENSE). The model and the renders come from the
AQTUATOR hardware design (CERN-OHL-S-2.0). REFAQT and AQTUATOR are trademarks
of REFAQT.
