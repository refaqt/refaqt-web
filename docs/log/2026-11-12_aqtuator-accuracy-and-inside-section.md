# 2026-11-12 — AQTUATOR CS page: one accuracy value and a cleaner inside section

**Role(s):** marketing, software

## What happened

- Accuracy without mapping is now ±15 µm for every travel. Before, it went from ±5 µm to
  ±9 µm, depending on the length. The page text, the specifications, the printed spec sheet and
  the data file all show the new value.
- The inside section has a new heading: "Take a look inside." When a part is selected, its number
  and its name turn REFAQT blue.
- The Configure panel no longer shows rail length and encoder length. It now shows the stationary
  mass. This is the mass of the parts that do not move: base, rails, magnet track and seal strip.
  It goes from 6.6 kg (CS-220) to 12.8 kg (CS-600).
- The specifications table no longer shows guide rail length, magnet track and encoder measuring
  length. The accuracy row moved out of that table, because the value no longer changes with
  travel. It is still in the accuracy group below the table.

## Decisions

- Accuracy is one fixed value, so the "per travel" table no longer lists it.

## Open Questions

- The stationary mass for travels other than 220 mm is an estimate, scaled from the 220 mm CAD
  model.
- The page was tested in Chromium only.

## Next Steps

- Replace the estimated masses with weighed values when the first stages are built.
