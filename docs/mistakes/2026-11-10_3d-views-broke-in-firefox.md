# 2026-11-10 — 3D views broke in Firefox

## What happened

The three 3D views on the AQTUATOR CS page worked in Chrome, but not in Firefox. In Firefox, the
views showed the "could not load" message or stayed empty.

## Why it went wrong

The page tells the browser where to find three.js, the 3D library, with an import map (a short
list in the page head that links the name `three` to a file). In the page head, a hint to
preload `main.js` (`<link rel="modulepreload">`) came before that import map.

The web standard says: once the browser starts to load a module script, it must ignore any import
map that comes later. Firefox follows this rule. Chrome no longer does. So in Firefox, the name
`three` pointed nowhere, and the 3D code could not start. We only tested in Chrome, so we did not
see it.

## Prevention rule

- Put the import map near the top of the page head, before every module script and every
  `modulepreload` link.
- Test pages with 3D or other module scripts in Firefox too, not only in Chrome.

## Related

- [Log entry](../log/2026-11-10_3d-views-firefox.md)
- [3D views depended on a CDN, with no fallback](2026-11-10_3d-views-depended-on-cdn.md)
