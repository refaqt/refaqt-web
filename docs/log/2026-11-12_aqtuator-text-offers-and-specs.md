# 2026-11-12 — AQTUATOR CS page: new text, two offers and corrected numbers

**Role(s):** marketing, sales, software

## What happened

- The hero now says "Direct drive. Sub-micron. Open-source." The text under it says that the
  stage is only 60 mm high, that the design is open hardware, and that REFAQT sells stages,
  parts and licences.
- A new section comes right after the hero. It shows the two things a customer can buy:
  assembled stages and parts, and a commercial licence. The commercial licence lets a customer
  build the design into a product without publishing their own design.
- The early-access form has a new field, "I want to": buy stages or parts, build it myself, or
  get a commercial licence. The buttons on the page fill it in. The form backend stores it as a
  new column.
- Numbers changed to match the hardware design:
  - Speed: 2 m/s (was 3 m/s).
  - Force: 181 N continuous and 512 N peak, from the MK21 motor data (was 180 N and 500 N).
  - Accuracy without mapping: ±15 µm per metre of travel, but never better than ±5 µm. Each
    travel now has its own value, from ±5 µm (CS-220) to ±9 µm (CS-600).
  - End stops: four elastomer dampers (ACE TUBUS TA17-7), not hydraulic dampers.
- The page no longer mentions the slot seal, the requirement codes (STG-xx) or SysML in the
  specifications. The open-hardware section no longer lists the simulations.
- "Cool and safe by design" is now "Thermally stable". It says that the water cooling keeps the
  temperature stable and that the base is one solid block of aluminium.
- 3D views: the end stops are black. In the inside view, the selected part lights up in REFAQT
  blue. The hero image and the social image are rendered again.
- The printed spec sheet now has a 3D picture, a top view, a side view and an end view. The
  three drawings share one scale and show the main dimensions.

## Decisions

- "OEM licence" is now called "commercial licence", because any customer can need it, not only
  machine builders.

## Open Questions

- The form is still not connected. Connecting it needs a Cloudflare account, a GitHub token and a
  spam-check key. Only a REFAQT owner can create these. The steps are in
  [`aqtuator/worker/README.md`](../../aqtuator/worker/README.md).
- The hardware requirement for speed (`STG-09` in `refaqt/aqtuator`) still says 3 m/s. The site
  now says 2 m/s.
- The 3D picture on the spec sheet always shows the 220 mm build. Longer stages have no 3D model
  yet.
- The page was tested in Chromium only. Firefox was not available in the test setup.

## Next Steps

- Set up the form backend, then put its address and key in `aqtuator/assets/js/config.js`.
- Update `STG-09` in `refaqt/aqtuator` to 2 m/s, or tell the website team which value is right.

<details>
<summary>Technical notes</summary>

- Numbers: `aqtuator/tools/variants.py` makes `aqtuator/assets/data/variants.json`. Sources:
  `stoq` `maxwell/mk2-mover` (MK21: 181 N, 512 N for 1 s) and `ace/ta-damper` (TA17-7, 9 J each
  in an emergency).
- Worker: new field `interest` (`buy`, `diy`, `licence`). CSV header is now
  `timestamp,email,interest,variant,message,country,user_agent`. `node aqtuator/worker/test.mjs`
  passes.
- `aqtuator/tools/export_glb.py` now gives the dampers the `rubber` material. The viewer also sets
  it by part name, so the current model file did not need a new export.

</details>
