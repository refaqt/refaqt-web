# 2026-11-16 — Form emails follow the light or dark theme of the reader

**Role(s):** software, marketing

## What happened

- The two form emails (the message to `contact@refaqt.com` and the thank-you email) were always
  dark. In a light mail program this looked out of place.
- Now the emails are light by default. When the mail program uses a dark theme and tells the email
  so, the email turns dark, with the logo for dark backgrounds.
- A second logo file, with dark letters, is added for the light version.
- Later the same day: in the Gmail app on a phone in dark mode, the logo had dark letters on a
  dark background. The Gmail app does not tell the email about dark mode and never changes
  pictures. Now the logo area keeps a white background in the Gmail app, so the logo stays
  readable. The rest of the email still turns dark there.

## Decisions

- Light is the default, because Gmail on the web does not tell an email about the theme. Gmail
  users with a light theme get the light email.

## Open Questions

- The new logo is made from the existing PNG: the light grey letters became dark grey. If the
  official SVG for light backgrounds looks different, export it to PNG and replace the file.

## Next Steps

- After the merge into `main`, deploy the form Worker again, so it sends the new emails. The new
  logo only shows after the site with `assets/img/refaqt-logo-on-light.png` is live on `refaqt.com`.

<details>
<summary>Technical details</summary>

- `forms-worker/src/email.js`: inline styles use the light colours. A
  `@media (prefers-color-scheme: dark)` block switches classes `c-bg`, `c-sf`, `c-box`, `c-tx`,
  `c-mu`, `c-fa` and swaps `logo-light` for `logo-dark`. `[data-ogsc]` swaps the logo in
  Outlook.com dark mode. `color-scheme` meta is now `light dark`.
- Works with the media query: Apple Mail, iOS Mail, Outlook for Mac and iOS, Thunderbird. Gmail web
  shows light. The Gmail apps change colours themselves in dark mode and keep the light logo.
- Logo area: white background image `assets/img/email-white.png` (setting `WHITE_BG_URL`). Gmail
  dark mode recolours background colours but not background images. The dark block removes the
  image. The Outlook.com logo swap is removed: Outlook.com now also keeps the white logo area.
- New setting `LOGO_ON_LIGHT_URL` in `forms-worker/wrangler.jsonc`. `LOGO_URL` stays the logo for
  dark backgrounds.
- `node forms-worker/test.mjs` passes. Previews checked in Chromium with light and dark
  colour scheme.

</details>
