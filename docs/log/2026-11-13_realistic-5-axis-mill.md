# 2026-11-13 — 5-axis milling machine rebuilt from the founder's sketch

**Role(s):** marketing, software

## What happened

- The founder found the four machines in the home page picture too conceptual. We now rebuild
  them one at a time. The founder sends a sketch, I confirm the axes in a table, then I build
  and render the machine.
- The first machine is the 5-axis milling machine. It now follows the founder's sketch of
  13-11-2026: a stand of 600 x 800 mm, and a machine of 560 x 760 mm on rubber mounts.
- Axes: two CS-520 stages stand on their edge as the Y axis. A CS-220 stage is the bridge (X).
  A CS-220 stage stands upright inside a closed column (Z). A cradle turns between the side
  walls (A), with a rotary table on it (C).
- After the first render, the founder asked for these changes, and they are done:
  - The cradle is now a solid U-shaped trough with cut corners and round hubs, as in the sketch.
  - The gap under the Y stages is now just large enough for the cradle to turn. The A-axis
    rotary stage is large, and its top edge comes almost up to the Y stages.
  - The spindle is bolted under a solid ram that slides out of the column, so it looks rigid.
  - The stand is a frame of steel tubes with cover plates, not a closed cabinet.
  - The cable chains are gone. Cables run outward and behind the X axis, out of sight.
  - The stand is the chip tray: the base plate has a hole under the cradle.
- In a third round, the founder gave exact sizes with a front-view sketch:
  - Width: wall 100 | cradle side 20 | 10 | spindle 80 | X travel 220 | 10 | cradle side 20 |
    wall 100 = 560 mm.
  - Height: bottom 180 | 10 | cradle bottom 180 | work plate | cradle | 10 | Y stages.
  - Walls are 80 mm profiles between two 10 mm plates. The whole machine is black anodised.
  - The cradle sits at the front, in a cutout of the front wall. The A-axis rotary stage is
    210 mm across, and its edge is 20 mm from the front.
  - The gantry is a 160 mm beam with the X stage bolted to its front.
- In a fourth round: the C turning table is back on the cradle. The cradle bottom is 100 mm
  instead of 180 mm, so the whole machine is 80 mm lower. Slanted walls stiffen the cradle
  between its sides and its bottom. The front of the bottom part has slanted walls that follow
  the cradle with 10 mm space. A green LED strip lights the inside from the back plate, right
  under the Y axis.
- In a fifth round: the drive of the turning table sits inside the cradle bottom. The table
  lies on top, with its bottom flush with the top of the cradle. The cradle sides are 60 mm shorter, and the machine is 60 mm lower again. The stand
  (frame, cover plates and door) is now black too.
- In a sixth round: a large pocket under the cradle, with four slopes that lead the chips down
  to a hole into the chip bin in the stand. A 10 mm front plate has the opposite shape of the
  cradle, with 10 mm space, so the cradle moves through it and the plate fills the corners.
- The pictures, the sketches and a copy of the model are also stored in `refaqt/qarve` and in
  `refaqt/refaqt-business`.
- The 3D model only exists as the CS-220. A longer stage is now made by stretching the fixed
  parts of that model at the middle. The carriage stays the real one.

## Decisions

- The founder chose open machines (no covers), built one at a time from sketches.
- Width: 60 mm (Y stage on its edge) + 440 mm (X stage) + 60 mm (Y stage) = 560 mm.

## Open Questions

- The stand height (800 mm), the 500 mm wall height and the A-axis height (385 mm) are my
  choices. The founder has not confirmed them yet.

## Next Steps

- Change the mill after the founder's comments.
- Then the laser cutter, the lathe and the measuring machine, each from a sketch.
- The home page picture is not rendered again yet. The new mill is much taller than the other
  machines, so the layout of the picture must change at the end.
