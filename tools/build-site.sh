#!/usr/bin/env bash
# Copies the public pages into _site/. Nothing else is published.
# Used by Cloudflare (build command: bash tools/build-site.sh; settings in wrangler.jsonc)
# and by .github/workflows/pages.yml.
# Tools, workers, docs and agent files stay out of the site.
# A new public folder needs a line here.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf _site
mkdir -p _site/aqtuator
cp -r index.html assets _site/
cp -r aqtuator/index.html aqtuator/assets _site/aqtuator/
touch _site/.nojekyll

echo "Site files are in _site/"
