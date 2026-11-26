# 2026-11-26 — AQTUATOR Custom: a realistic 3D stage

**Role(s):** marketing, software

## What happened

- The founder found the first 3D view too blocky: no holes, screws or round edges, one block per
  rail, a green line on the carriage, and rails on top of the walls.
- The 3D view now starts from the real AQTUATOR CS model, with its seal strip. In the second step
  the seal strip, its rollers and hold-down magnets fade away, so you see the linear motor inside.
- Then, as before: ball screw with servo motor A, servo motor B, bigger rails, longer stage. The
  magnet stripes, the turning screw and the smooth changes stay.
- New parts: guide rails with ball grooves, counterbores and screws; cap screws in the carriage,
  the bearing blocks and the motor flange; a ball nut on a bracket; a support bearing and a fixed
  bearing block; an open motor adapter with a jaw coupling; two servo motors that look like common
  industrial motors (square flange, chamfered body, rear encoder cover, angled connectors, name
  plate). Motor A is silver with one connector; motor B is black, longer, with a brake and two
  connectors. No brand names.
- Six steps now instead of five. The still pictures were drawn again.

## Decisions

- Start from the CAD model, not from a new drawing. The base, carriage, guide blocks, magnet track,
  forcer and encoder are the real parts. They change size by moving vertices, so holes and
  chamfers keep their size.
- The rails are rebuilt in code, because a longer rail needs more screw holes.
- The ball screw axis sits low, in the magnet track pocket. So the motor hangs below the base.
  The view has no table, only a soft shadow, so this looks natural.

## Open Questions

- Firefox is not tested: it is not installed in the work container.
- The 3D view now loads the 2.4 MB model. Is that fine for a first visit on a phone?

## Next Steps

- The founder reviews the draft link.

<details>
<summary>Technical details</summary>

- `custom/assets/js/morph.js`: rewritten around `loadTemplate()`; `CUT` holds the cut planes per
  part, found where the part has no vertices. Blocks scale around their rail foot; rails move in
  by 17 mm × (size − 1) so bigger blocks stay clear of the walls.
- `custom/assets/js/parts.js`: new. Rail side walls are one strip mesh scaled along X; the top face
  with counterbores is rebuilt when the length or size changes. Screws are instanced meshes.
- The shaft is made once for the longest stage and cut at the support bearing with a clipping
  plane (shadows too).
- Check options: `mix` and `cam`/`target` in the address.
- Software rendering in the container runs at about 0.6 frames per second; that is the container,
  not the page. The AQTUATOR CS page uses the same model.

</details>
