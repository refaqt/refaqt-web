# 2026-11-10 — 3D views now work in Firefox

**Role(s):** software

## What happened

- The 3D views on the AQTUATOR CS page did not work in Firefox. Chrome was fine.
- The cause: in the page head, a preload hint for a script came before the import map, the list
  that tells the browser where three.js is. Firefox then ignores the import map, as the web
  standard says. See [the mistake note](../mistakes/2026-11-10_3d-views-broke-in-firefox.md).
- The import map now sits at the top of the page head, before any script.
- In Chrome, with all outside hosts blocked, all three views still load.

## Decisions

- None.

## Open Questions

- None.

## Next Steps

- Firefox could not be installed in the test setup. After the merge, open the page in Firefox
  and check all three views.
