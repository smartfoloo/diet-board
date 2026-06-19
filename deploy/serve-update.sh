#!/usr/bin/env bash
# Option 1 deploy (self-hosted Linux as a pure consumer).
#
# GitHub Actions (daily-build.yml) is the "brain": it fetches new bills, calls Gemini to
# generate summaries, and commits the refreshed caches (data/ai.json + data/content) back
# to main. This box never generates or commits anything — it just mirrors origin/main,
# rebuilds the static site, and lets nginx serve build/. Run it from cron.
#
# Requirements on the server: git, Node 22 + npm (matches the CI runner).
set -euo pipefail

REPO="${REPO:-/srv/diet-board}"   # where the repo is checked out
BRANCH="${BRANCH:-main}"

cd "$REPO"

# Mirror the remote exactly. This checkout is read-only (the bot owns the data), so a hard
# reset is intentional — it discards any accidental local change and avoids merge prompts.
git fetch --quiet origin "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci --no-audit --no-fund

# Fold the latest SMRI data + the bot-committed ai.json/content caches into bills.json.
# (No GEMINI_API_KEY here on purpose — summaries are already generated and committed.)
npm run data

# Static build → ./build. BASE_PATH is left unset so the site is served at the domain root
# (the CI build sets BASE_PATH for the GitHub Pages sub-path; here we want root).
npm run build

echo "deploy ok: $(git rev-parse --short HEAD) built $(date -u +%FT%TZ)"
