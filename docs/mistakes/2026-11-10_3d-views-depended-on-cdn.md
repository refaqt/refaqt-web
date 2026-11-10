# 2026-11-10 — 3D views depended on a CDN, with no fallback

## What happened

The three 3D views on the AQTUATOR CS page did not load for some visitors. The hero view showed only
its still image. The other two views showed a loading bar that never stopped. Nothing told the
visitor what went wrong.

## Why it went wrong

The page loaded three.js, the 3D library, from jsDelivr, a public CDN (content delivery network).
If a browser cannot reach jsDelivr, the 3D code cannot start. Ad blockers, privacy tools, company
networks and CDN outages all block it. Our own tests passed because our test browser could reach
jsDelivr. The code also had no error path, so the failure stayed silent.

## Prevention rule

- Serve every script the page needs from this site. Do not load code from a CDN.
- Every part that loads late (3D, data, forms) must show a clear message when it fails.
- To test a page, also block outside hosts in the test browser, and check that the page still works.

## Related

- [Decision: serve three.js from our own site](../decisions/2026-11-10_self-host-three-js.md)
- [Log entry](../log/2026-11-10_3d-views-self-hosted.md)
