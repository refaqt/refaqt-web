# 2026-11-20 — Proposal: AQTUATOR Custom page

**Role(s):** marketing, business-dev, software

## What happened

- A new page at `/custom/` presents AQTUATOR Custom. This is the new service from the business
  note [complete stages for component makers and distributors](https://github.com/refaqt/aqtuator-business/blob/main/docs/business-dev/2026-11-19_component-maker-stage-partnerships.md).
  The page is a proposal for the founder to review. It is not on the live site yet.
- The page speaks to makers and distributors of motion parts first. Lower on the page it shows
  what their customers can buy: a complete stage from REFAQT (standard or adapted), or a
  commercial licence that lets them keep their own machine design closed.
- The top of the page has a 3D view without labels. One example stage changes step by step: the
  linear motor becomes a ball screw with a rotary servo motor, then the servo motor changes, then
  the guides, then the size. The cards under "What we change" light up with the matching step.
  Five small buttons under the view let a visitor pick a step.
- The home page has a second product card and menu and footer links. The AQTUATOR CS page links to
  the new page under "What you can buy".

## Decisions

- Name and address: AQTUATOR Custom at `/custom/` (chosen by the founder).
- The 3D stage is a simple example built in code, not the CAD model. The sizes are examples. The
  page says so under the view and in the footer.
- The contact form is the home page form. The Worker needs no change: the choices use the
  existing interest values (partner, engineering, licence, other). The lead email shows the page.

## Open Questions

- The page does not name partners, prices or dates. Should it name a first partner once one
  agrees?
- The business idea is not tested yet. Should the page go live now, or only after the first
  partner talks?

## Next Steps

- The founder reviews the draft link and the wording.
- After approval: merge into `test`, check the form on `test.refaqt.com`, then into `main`.

<details>
<summary>Technical details</summary>

- New: `custom/index.html`, `custom/assets/css/custom.css` (adds to `../assets/css/style.css`),
  `custom/assets/js/main.js` (form from `../../../assets/js/form.js`, 3D loaded with a dynamic
  import), `custom/assets/js/morph.js` (three.js stage, five states, smooth change of every size),
  `custom/assets/img/morph-still.webp` and `og.png`, `custom/tools/render_still.cjs` (not published).
- three.js comes from `aqtuator/assets/vendor/three/` through the import map, which is the first
  thing in the page head. No second copy.
- If WebGL or the script fails, the still picture stays and a short message shows (checked with
  three.js blocked). With reduced motion, nothing moves; the buttons still switch steps.
- `?step=N&still=1` freezes the view on one step, for the still pictures.
- `tools/build-site.sh` copies `custom/` to `_site/custom/`.
- Checked in Chromium at 1280 px and 390 px wide: no page errors except the spam check on
  localhost, no side scroll. Firefox was not available in the test container.

</details>
