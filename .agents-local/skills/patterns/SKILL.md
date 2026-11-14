---
name: patterns
description: >-
  Reusable patterns that belong only to refaqt-web, mostly for the machine pictures in
  tools/render-machines.html. Read before you change that page or add a machine.
---

# refaqt-web patterns

Write entries in B2 English. Follow `.agents/rules/communication.md`. Format and upkeep:
`.agents/skills/maintain-patterns/SKILL.md`. Background: `docs/architecture.md`, section
"Machine pictures".

## A stage of any length
**When to use:** A machine needs an AQTUATOR CS stage longer or shorter than the CS-220 model.
**Pattern:**
```js
// root = centre of the base bottom; travel and up are world directions; len in metres.
stage(m, [sx * 0.38, Yc, 0], offY, [0, 0, 1], [-sx, 0, 0], 1.14);   // Y stage on its edge
const zY = -0.0104 + offY;                                          // its carriage centre
```
**Gotchas:** The 3D model only exists as the CS-220 (440 mm). `stretch()` moves the fixed parts at
the middle; the carriage keeps its size, so travel = length − 220 mm. The carriage centre is
10.4 mm off the base centre at offset 0. Never scale the stage group: that also scales the carriage.
**Last used:** 2026-11-13, laser cutter (Y 1140 mm, X 640 mm, Z 300 mm).

## A machine on a stand
**When to use:** You add or change a machine function.
**Pattern:**
```js
const m = new THREE.Group(); m.userData.floor = true;     // floor at y = 0
const CT = 0.8, FT = 0.045, T = 0.05;                      // stand top, feet, tube size
const MB = CT + 0.02, h = (v) => MB + v;                   // machine bottom on rubber mounts
standFrame(m, 0.8, 1.2, CT, FT, T, false);                 // black tube stand, no door
fn.view = { cam: 'x,y,z', target: 'x,y,z' };               // default camera for ONLY=fn
```
**Gotchas:** Write every height in the body as `h(v)`, so a change of the stand or the body
height moves everything at once. Add the function to `machines` (and to `layout` for the home page).
**Last used:** 2026-11-13, CMM.

## An LED strip that glows as one band
**When to use:** A green LED strip must light the inside of a machine.
**Pattern:**
```js
box(m, 0.004, 0.012, 0.95, MAT.led, sx * 0.278, WT - 0.012, 0);          // the strip you see
ledLight(m, 0.95, [sx * 0.274, WT - 0.012, 0], [0, WT - 0.35, 0]);        // its light
```
**Gotchas:** Do not use a row of point lights: each one makes its own round spot, and the founder
rejected that. `ledLight()` uses `RectAreaLight`, which needs `RectAreaLightUniformsLib`
(stored in `tools/vendor/three/`, mapped in the import map of the render page). It casts no shadow.
**Last used:** 2026-11-13, CMM and mill.

## Check a hidden part with an extra view
**When to use:** A part you changed is hidden in the normal views (a pocket under the cradle,
the inside of a bed).
**Pattern:**
```bash
ONLY=mill TILT=1.4 CAM=0.25,2.1,1.55 node tools/render_machines.cjs
ONLY=cmm CAM=0.3,1.42,0.75 TARGET=0.03,1.1,0.2 node tools/render_machines.cjs
```
**Gotchas:** Look at every render yourself before you send it. A camera inside a wall shows only
black. Rename `check-<name>.png` before the next render, or it is overwritten.
**Last used:** 2026-11-13, mill chip pocket and CMM probe.

## A real hole in a solid part
**When to use:** A part needs a pocket or a bore that must look like a hole, not a painted spot.
**Pattern:**
```js
plate(m, outline, [holePoints], depth, MAT.part, topY);                  // top with the hole
const w = mesh(new THREE.CylinderGeometry(r, r, depth, 64, 1, true), MAT.partInside); // BackSide wall
cyl(m, r, 0.0006, MAT.partFloor, 'y', x, topY - depth + 0.0003, z, r, 64);            // floor
```
**Gotchas:** Without the inside wall, the hole looks as if the part is hollow. Use a steel with a
low `envMapIntensity` for parts, so their faces get different shades and the shape reads well.
**Last used:** 2026-11-13, CMM part.
