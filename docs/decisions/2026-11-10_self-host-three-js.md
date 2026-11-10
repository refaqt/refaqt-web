# Serve three.js from our own site

- **Date:** 2026-11-10
- **Status:** Accepted

Write this file in B2 English. Follow `.agents/rules/communication.md`. Keep official names, file paths, and numbers exact.

## Context

The three 3D views on the AQTUATOR CS page use three.js, a 3D library for web pages. The page loaded
three.js from jsDelivr, a public CDN (content delivery network). When a visitor's browser cannot
reach jsDelivr, all three views fail. Ad blockers, privacy tools, company networks and CDN outages
can all cause this.

We looked at `opendrone.be`. It also uses three.js (version r185). It does not use a CDN. A build
tool (Vite) packs three.js into the site's own files. The 3D code loads only when it is needed, and
the page shows normal content if 3D fails.

## Decision

- Copy the exact three.js 0.160.0 files that the page needs into `aqtuator/assets/vendor/three/`.
  The import map in `aqtuator/index.html` points there.
- Do not add a build tool. The site has no build step, and the copied files work without one.
- Stay on version 0.160.0. A newer version can change light and colour, so it needs its own check.
- When a 3D view cannot start, it shows a short message instead of a loading bar that never ends.

## Consequences

- The 3D views work for every visitor who can open the page itself.
- The site holds about 870 kB of extra files. GitHub Pages compresses them when it sends them.
- To update three.js, copy the new files from the `three` npm package into the same folder, with
  the same layout. Check all three views before you push.
