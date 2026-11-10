# 2026-11-10 — 3D views now load without a CDN

**Role(s):** software

## What happened

- The 3D views on the AQTUATOR CS page failed for visitors who cannot reach jsDelivr, the public
  CDN that served three.js. A test browser with jsDelivr blocked showed the same failure: no 3D at
  all, and no message.
- three.js 0.160.0 is now copied into the site, in `aqtuator/assets/vendor/three/`. The page no
  longer needs any CDN for 3D.
- A 3D view that cannot start now says so, instead of showing a loading bar for ever.
- `refaqt.com/aqtuator/` still shows the old REFAQT website, not this site. The domain does not
  point to GitHub Pages yet. This is a separate step.

## Decisions

- Serve three.js from our own site, like `opendrone.be` does. See
  [the decision record](../decisions/2026-11-10_self-host-three-js.md).

## Open Questions

- Should the site move to a newer three.js version later? It needs a visual check of all three views.

## Next Steps

- After the merge, open `refaqt.github.io/refaqt-web/aqtuator/` with an ad blocker on, and check
  all three views.
