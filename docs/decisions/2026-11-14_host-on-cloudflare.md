# Host the website on Cloudflare, with draft, test and production versions

- **Date:** 2026-11-14
- **Status:** Accepted. The repository part is done. The Cloudflare account part is in progress.

Write this file in B2 English. Follow `.agents/rules/communication.md`. Keep official names, file paths, and numbers exact.

## Context

The site runs on GitHub Pages at `refaqt.github.io/refaqt-web/`. REFAQT wants it on `refaqt.com`,
at the lowest cost, with three versions: a draft to look at during work, a test version to review,
and the public version. Agents in the cloud build most of the site, so a person must be able to see
each draft without opening a pull request.

GitHub Pages gives one site per repository and cannot hide a test site behind a login. The forms
already use Cloudflare (the Worker and the Turnstile spam check).

## Decision

Use Cloudflare, free plan, connected to this GitHub repository. The site runs as a Worker with
static files (the files from `tools/build-site.sh`). Settings are in `wrangler.jsonc`.

The first plan was Cloudflare Pages. During setup, Cloudflare showed Pages as "legacy" and offered
Workers first. New Cloudflare features go to Workers, so we chose Workers on the same day.

| Version | Branch | Worker | Address | Who can see it |
| --- | --- | --- | --- | --- |
| Draft | any work branch | `refaqt-web` (preview) | `<branch>-refaqt-web.refaqt.workers.dev` | anyone with the link |
| Test | `test` | `refaqt-web-test` | `test.refaqt.com` | only people allowed by Cloudflare Access (a login page) |
| Production | `main` | `refaqt-web` | `refaqt.com` and `www.refaqt.com` | everyone |

Work moves from a draft branch, through a pull request into `test`, and then from `test` into
`main`. Agents push after each finished change and give the draft link (rules 6 to 8 in
`.agents-local/rules/repo.md`).

The test version needs its own Worker, because a draft link cannot get its own domain name.

## Consequences

- The cost is the yearly domain fee. Static files are free on the Workers free plan. Check the
  build limits on Cloudflare's pricing page from time to time.
- The DNS of `refaqt.com` is on Cloudflare. The domain stays with its seller (Register.eu, through
  Easyhost).
- Forms only work on the addresses in `ALLOWED_ORIGINS`, so not on draft links.
- Two places publish the site until `refaqt.com` is live. Then the GitHub Pages workflow is turned
  off.

## Setup in Cloudflare (a person does this once)

Menu names in Cloudflare change from time to time. Use the quick search (Ctrl + K) if a menu is
not where this list says.

1. **DNS.** Done on 2026-11-14. `refaqt.com` uses the Cloudflare nameservers. If the domain has
   email, check that every mail record (MX and TXT) is in Cloudflare's DNS records.
2. **Production Worker.** Workers & Pages → Create → Continue with GitHub → `refaqt/refaqt-web`.
   Project name `refaqt-web`. Build command `bash tools/build-site.sh`. Deploy command
   `npx wrangler deploy`. Preview command `npx wrangler versions upload`. Deploy. Then, in the
   Worker's Settings → Build, check that the production branch is `main` and that builds for
   other branches are on (these give the draft links).
3. **Test Worker.** The same again, with project name `refaqt-web-test` and deploy command
   `npx wrangler deploy --env test`. In Settings → Build, set the production branch to `test` and
   turn off builds for other branches.
4. **Domains.** In Worker `refaqt-web`, Settings → Domains & Routes → Add → Custom domain: add
   `refaqt.com`, then `www.refaqt.com`. In Worker `refaqt-web-test`, add `test.refaqt.com`. If
   Cloudflare says a DNS record already exists for the name, delete that old record in DNS →
   Records (it points to the old Easyhost web space), then add the domain again. Do not delete
   mail records.
5. **Login for test.** Zero Trust → Access → Applications → add a self-hosted app for
   `test.refaqt.com`. Allow only the team's email addresses.
6. **Forms.** Set up the form Worker: see `aqtuator/worker/README.md`. Add `refaqt.com`,
   `www.refaqt.com` and `test.refaqt.com` to the Turnstile widget. Put the Worker address and the
   Turnstile site key in the two `config.js` files.
7. **Check.** Open `refaqt.com`, `refaqt.com/aqtuator/` and `test.refaqt.com`. Send both forms
   once from `test.refaqt.com`.
8. **Old address.** When all of this works, turn off `.github/workflows/pages.yml` (delete it or
   remove the `push` trigger) and turn off GitHub Pages in the repository settings.

If a build fails while it fetches `.agents/`: that folder is a link to the repository
`refaqt/refaqt-agents`. If that repository is private, Cloudflare cannot fetch it. The site does not
need the folder. Make that repository public, or ask an agent to find another fix.
