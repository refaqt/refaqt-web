# 2026-11-13 — Measuring machine (CMM) rebuilt from the founder's brief

**Role(s):** marketing, software

## What happened

- The third machine of the home page picture is a measuring machine (CMM). It has the same layout
  as the laser cutter: an 800 × 1200 mm stand with a closed black front, a 760 × 1160 mm body
  with 100 mm black walls, two Y stages of 1140 mm and a 640 mm X stage on a 160 mm beam.
- The body is 500 mm high. The work bed is a black granite block, and its top is 300 mm under the
  bottom of the X axis. The front and back walls stop at the granite top.
- The Z stage is 520 mm long, for 300 mm of travel. Its bottom is flush with the bottom of the
  X axis.
- A slender arm on the Z carriage carries a touch probe with a ruby ball. At the lowest Z
  position the ball reaches the granite top, and at the highest it reaches the X axis bottom. In
  the picture the ball touches the top of a machined steel part with a step and a round pocket.

- After the first render, the founder asked for three changes, and they are done: the granite
  is black, the Z axis has a closed black column like the mill's (the arm slides out of its
  bottom), and green LED strips on the inside of both side walls, right under the Y axes,
  light the part.

- The part had a flat dark spot. It is now a real round pocket, 32 mm wide and 20 mm deep, with
  its own wall and floor, so the block reads as solid. The part's steel reflects less room light,
  so its right sides are darker and the shape is easier to see.
- The first strip light was made of separate point lights, so it showed as round spots. Each
  LED strip, also the one in the mill, is now one flat light as long as the strip. For this,
  the file `RectAreaLightUniformsLib.js` from three.js 0.160.0 (MIT licence) is now stored with
  the other three.js files in `aqtuator/assets/vendor/three/addons/lights/`.

## Decisions

- The arm is 40 × 40 mm and light grey, like the ceramic arms of many measuring machines.

## Open Questions

- None at the moment.

## Next Steps

- Change the measuring machine after the founder's comments. Then the lathe.
