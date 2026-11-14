# 2026-11-14 — The REFAQT logo on the AQTUATOR CS page goes to the home page

**Role(s):** marketing, software

## What happened

- On the AQTUATOR CS page, a click on the REFAQT logo at the top now opens the REFAQT home page.
  Before, it only scrolled back to the top of the same page.
- The product name "AQTUATOR CS" next to the logo still scrolls back to the top of the page.
- On the home page, the logo still scrolls to the top, because the visitor is already home.

## Decisions

- The logo and the product name are now two separate links. The logo means "REFAQT", so it leads
  to the REFAQT home page. The product name means "this product", so it stays on the page.

## Open Questions

- None at the moment.

## Next Steps

- Every new product page needs the same header: logo to `../`, product name to `#top`.

<details>
<summary>Technical details</summary>

- `aqtuator/index.html`: the header `a.brand` is now `div.brand` with `a.brand__home` (`href="../"`)
  and `a.brand__product` (`href="#top"`).
- `aqtuator/assets/css/style.css`: `.brand a` has no underline; the logo image and the product
  name are `display: block`, so the layout looks the same as before.
- Checked in Chromium at 1440 px and 390 px wide: the header looks the same, the logo link points
  to the site root, and the product name scrolls to `#top`. On a narrow screen the product name
  is still hidden and the logo still works.

</details>
