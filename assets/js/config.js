// SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
// SPDX-License-Identifier: CC-BY-SA-4.0
// Site settings for the home page. Use the same values as aqtuator/assets/js/config.js
// (see aqtuator/worker/README.md). The same Worker stores both forms, each in its own file.
export const CONFIG = {
  // URL of the Cloudflare Worker, for example 'https://aqtuator-leads.<your-subdomain>.workers.dev'.
  formEndpoint: '',
  // Cloudflare Turnstile site key (public). Leave empty to skip the widget.
  turnstileSiteKey: '',
};
