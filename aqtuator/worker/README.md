# Early-access form backend

A Cloudflare Worker. The website posts the form to it. The Worker checks the
input, checks the Turnstile spam token, and appends one row to
`leads/aqtuator-cs.csv` on `main` of the **private** repository
`refaqt/refaqt-business`. Each request is one commit.

The site repository is public, so it never holds a token or a lead.

CSV columns: `timestamp,email,interest,variant,message,country,user_agent`.
`interest` is what the visitor wants: `buy` (stages or parts), `diy` (build it
themselves) or `licence` (a commercial licence).

## Set up (once, about 15 minutes)

1. **GitHub token.** GitHub → Settings → Developer settings → Fine-grained
   tokens → Generate new token.
   - Resource owner: `refaqt`
   - Repository access: only `refaqt/refaqt-business`
   - Permissions: Contents → Read and write (nothing else)
   - If `main` of `refaqt-business` is protected, allow this token (or its
     user) to push, or the commit fails.
2. **Turnstile** (free spam check). Cloudflare dashboard → Turnstile → Add
   widget, domain `refaqt.github.io`. You get a site key (public) and a secret
   key.
3. **Deploy the Worker.** In this folder:

   ```bash
   npx wrangler login
   ```

   ```bash
   npx wrangler secret put GITHUB_TOKEN
   ```

   ```bash
   npx wrangler secret put TURNSTILE_SECRET
   ```

   ```bash
   npx wrangler deploy
   ```

   Wrangler prints the Worker URL, for example
   `https://aqtuator-leads.<subdomain>.workers.dev`.
4. **Connect the site.** Put the Worker URL and the Turnstile site key in
   `aqtuator/assets/js/config.js`, commit and push to `main`.

## Test

```bash
node aqtuator/worker/test.mjs
```

The test uses a fake GitHub API. It checks the CSV escaping (quotes, line
breaks, spreadsheet formulas), the conflict retry, and the input checks.

To test against the real repository, add `http://localhost:8765` to
`ALLOWED_ORIGINS`, run `npx wrangler dev`, set `formEndpoint` to the local
URL, and send the form from `python3 -m http.server 8765`.

## Limits

- The GitHub contents API reads files up to 1 MB. That is about 3000 leads.
  Before that, move the file (for example to `leads/aqtuator-cs-2027.csv`
  by changing `CSV_PATH`).
- The free Cloudflare plan allows 100 000 requests per day.
