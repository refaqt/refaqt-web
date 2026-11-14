# Host the website on Cloudflare Pages, with draft, test and production versions

- **Date:** 2026-11-14
- **Status:** Accepted. The repository part is done. The Cloudflare account part is still to do.

Write this file in B2 English. Follow `.agents/rules/communication.md`. Keep official names, file paths, and numbers exact.

## Context

The site runs on GitHub Pages at `refaqt.github.io/refaqt-web/`. REFAQT wants it on `refaqt.com`,
at the lowest cost, with three versions: a draft to look at during work, a test version to review,
and the public version. Agents in the cloud build most of the site, so a person must be able to see
each draft without opening a pull request.

GitHub Pages gives one site per repository and cannot hide a test site behind a login. The forms
already use Cloudflare (the Worker and the Turnstile spam check).

## Decision

Use Cloudflare Pages, free plan, connected to this GitHub repository.

| Version | Branch | Address | Who can see it |
| --- | --- | --- | --- |
| Draft | any work branch | `<branch>.refaqt-web.pages.dev` | anyone with the link; search engines skip it |
| Test | `test` | `test.refaqt.com` | only people allowed by Cloudflare Access (a login page) |
| Production | `main` | `refaqt.com` and `www.refaqt.com` | everyone |

Work moves from a draft branch, through a pull request into `test`, and then from `test` into
`main`. Agents push after each finished change and give the draft link (rules 6 to 8 in
`.agents-local/rules/repo.md`).

## Consequences

- The cost is the yearly domain fee. Check the free plan limits (about 500 builds a month) on
  Cloudflare's pricing page from time to time.
- The DNS of `refaqt.com` moves to Cloudflare. The domain stays with its seller.
- Forms only work on the addresses in `ALLOWED_ORIGINS`, so not on draft links.
- Two places publish the site until `refaqt.com` is live. Then the GitHub Pages workflow is turned
  off.

## Setup in Cloudflare (a person does this once)

1. **DNS.** Add `refaqt.com` to the Cloudflare account that runs the Worker. Change the nameservers
   at the domain seller. If the domain has email, check that every mail record (MX and TXT) was
   copied, or email stops working.
2. **Pages project.** Workers & Pages → Create → Pages → Connect to Git → `refaqt/refaqt-web`.
   Project name `refaqt-web`. Production branch `main`. Framework preset: none. Build command
   `bash tools/build-site.sh`. Build output directory `_site`. Keep preview builds on for all
   branches.
3. **Branch `test`.** Create it from `main` on GitHub, if it is not there yet.
4. **Domains.** In the Pages project, Custom domains: add `refaqt.com` and `www.refaqt.com`. Add
   `test.refaqt.com` too, then in DNS change its CNAME record to `test.refaqt-web.pages.dev`, so it
   shows branch `test`.
5. **Login for test.** Zero Trust → Access → Applications → add a self-hosted app for
   `test.refaqt.com`. Allow only the team's email addresses.
6. **Forms.** Add `refaqt.com`, `www.refaqt.com` and `test.refaqt.com` to the Turnstile widget.
   Then run `npx wrangler deploy` in `aqtuator/worker/`, so the Worker accepts the new addresses.
7. **Check.** Open `refaqt.com`, `refaqt.com/aqtuator/` and `test.refaqt.com`. Send both forms
   once from `test.refaqt.com`.
8. **Old address.** When all of this works, turn off `.github/workflows/pages.yml` (delete it or
   remove the `push` trigger) and turn off GitHub Pages in the repository settings.

If the first build fails while it fetches `.agents/`: that folder is a link to the repository
`refaqt/refaqt-agents`. If that repository is private, Cloudflare cannot fetch it. The site does not
need the folder. Make that repository public, or ask an agent to find another fix.
