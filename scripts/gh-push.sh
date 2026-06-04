#!/usr/bin/env bash
# gh-push.sh — Re-sync Replit main branch to GitHub
# Usage: bash scripts/gh-push.sh
# Requires: GITHUB_TOKEN env var set in Replit secrets
set -euo pipefail

REMOTE_URL="https://${GITHUB_TOKEN:?GITHUB_TOKEN env var must be set}@github.com/JBlizzard-sketch/nairobi-events-marketplace.git"

# Ensure the github remote is configured
if git remote get-url github &>/dev/null; then
  git remote set-url github "$REMOTE_URL"
else
  git remote add github "$REMOTE_URL"
fi

echo "→ Pushing main to GitHub..."
git push github main

echo "✅ Pushed to https://github.com/JBlizzard-sketch/nairobi-events-marketplace"
