# 2026-11-14 — Home page picture with the three rebuilt machines

**Role(s):** marketing, software

## What happened

- The founder approved the measuring machine (CMM). The lathe comes later.
- The home page picture now shows the three rebuilt machines in one group: the laser cutter, the
  Qarve 5-axis milling machine and the CMM. The share image for social media shows the same group.
  The lathe is left out until it is rebuilt.
- The screen-reader description of the picture now names the three machines. The footer still
  says that the machines are concepts in development.
- The way of working with the founder is written down as a decision, the model is explained in
  the architecture file, and the reusable solutions are in the patterns file. With these, a later
  session can go on with the lathe without this conversation.
- The three.js helper for the LED strip light moved from the published three.js folder to
  `tools/vendor/three/`, because only the render tool uses it. The public site stays 314 kB smaller.

## Decisions

- One group picture with three machines, not three separate pictures (founder's choice).

## Open Questions

- None at the moment.

## Next Steps

- Rebuild the lathe from the founder's sketch or brief. Then draw the home page picture again with
  four machines.
- Copy the CMM pictures to `refaqt/refaqt-business`, like the mill and the laser cutter.

<details>
<summary>Technical details</summary>

- Layout: `[[laser, -1.08, -0.2], [mill, 0, 0.3], [cmm, 1.08, -0.2]]` in
  `tools/render-machines.html`. Overview camera `2.7,3.2,5.9`, share-image camera `3.0,3.5,7.0`.
  The share image's 3D area is now 650 px wide.
- `assets/img/machines.png` is 1335 × 952 px.
- Checked in Chromium at 1440 px and 390 px wide: the WebP picture loads and the page shows no
  errors. Firefox is not installed in this environment, so it was not tested.
- Way of working: `docs/decisions/2026-11-14_machine-pictures-from-founder-sketches.md`.
  Model guide: `docs/architecture.md`, "Machine pictures". Patterns:
  `.agents-local/skills/patterns/SKILL.md`.

</details>
