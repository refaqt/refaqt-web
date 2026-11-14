# Machine pictures are built from the founder's sketches, one machine at a time

- **Date:** 2026-11-14
- **Status:** Accepted

Write this file in B2 English. Follow `.agents/rules/communication.md`. Keep official names, file paths, and numbers exact.

## Context

The home page picture showed four machines built from AQTUATOR CS stages. The founder found them
too conceptual: plain boxes, and axis layouts that the agent had chosen. On 13 and 14 November
2026 we rebuilt three of them together: the 5-axis milling machine (the concept of the Qarve
machine), a fibre laser cutter and a coordinate measuring machine (CMM). The lathe is not done
yet. This note keeps the way of working, so that the next session can go on the same way.

## Decision

We work in short rounds, one machine at a time:

1. **The founder gives the layout.** A hand sketch or a short written brief, with the main sizes.
   The agent does not invent the layout of the axes.
2. **The agent confirms the layout first.** Before it builds, it sends a short table: each axis,
   what it sits on, which way it moves, which stage length it uses, and what it carries. It asks
   only about things that change the build. If the sizes do not add up, it shows the sum and asks.
3. **The agent builds and renders that one machine.** It sends a full view and a close-up of the
   important part (spindle, laser head, probe). For hidden parts it makes an extra view, for
   example with the cradle tilted.
4. **The founder comments, the agent changes.** Each round ends with the images sent, a commit,
   a push, and a line in the log entry of that machine.
5. **When a machine is approved, copies are saved.** Pictures, sketches and a copy of the model go
   to `refaqt/refaqt-business` (`docs/marketing/`). Engineering concepts also go to the project's
   own repository (the mill went to `refaqt/qarve`, `docs/concept-renders/`).

What the founder asked for, and what stays the rule for the next machines:

- **Real sizes and real parts.** Stages have their true width (210 mm) and height (60 mm). Frames
  are 80 mm aluminium profiles between two 10 mm plates (100 mm walls). No part looks thin or
  floats. Things that hold the tool must look stiff.
- **One look for all machines.** Everything black anodised. The green REFAQT accent stays on rings,
  stripes and LED strips. Each machine stands on a black steel-tube stand with cover plates.
- **The same gantry where possible.** Two Y stages stand on their edge on the side walls, flush
  with the outside. The X stage is bolted to the front of a 160 mm beam between the Y carriages.
  Stage lengths are chosen to reach the wanted footprint.
- **Layout only from real products.** When the founder names a product (for example the xTool
  MetalFab), the agent copies the layout, never the look or the brand.
- **Nothing loads from outside.** Every script comes from this repository. See
  [Serve three.js from our own site](2026-11-10_self-host-three-js.md).

## Consequences

- The founder decides every layout, so the pictures show machines REFAQT could really build.
- Each machine costs several short rounds, but each round is small and easy to check.
- The model in `tools/render-machines.html` is the only source. The copies in other repositories
  are for reading, not for editing. How to work on the model: [architecture](../architecture.md),
  section "Machine pictures".
- The home page picture shows three machines until the lathe is rebuilt. Then it is rendered again
  with four.
