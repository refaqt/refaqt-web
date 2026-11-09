// Site settings. Fill these in after deploying the Worker (see worker/README.md).
export const CONFIG = {
  // URL of the Cloudflare Worker that stores early-access requests,
  // for example 'https://aqtuator-leads.<your-subdomain>.workers.dev'.
  formEndpoint: '',
  // Cloudflare Turnstile site key (public). Leave empty to skip the widget.
  turnstileSiteKey: '',
};
