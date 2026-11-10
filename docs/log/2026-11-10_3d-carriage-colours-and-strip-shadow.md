# 2026-11-10 — 3D model: new carriage colours, no stray seal strip shadow

**Role(s):** software, marketing

## What happened

- The carriage top is now black anodised, like the base. Before, it was clear (silver).
- The carriage bottom is now green anodised. Before, it was black.
- When the carriage moved, a shadow of the seal strip showed on the floor past the end of the
  base. The 3D view uses a moving copy of the strip, cut to the carriage length. The cut worked
  for the strip itself, but not for its shadow. Now the shadow is cut too.
- The hero image and the social image are rendered again with the new colours.

## Decisions

- The 3D view picks the colour of the base and the carriage by part name. So the new colours
  work with the current model file. The export script uses the same colours for the next export.

## Open Questions

- None.

## Next Steps

- None.
