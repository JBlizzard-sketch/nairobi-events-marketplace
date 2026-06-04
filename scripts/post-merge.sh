#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push

# Sync to GitHub — best-effort (skipped if GITHUB_TOKEN is not set)
if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "→ Syncing to GitHub..."
  bash "$(dirname "$0")/gh-push.sh" || echo "⚠️  GitHub sync failed — continuing anyway."
else
  echo "ℹ️  GITHUB_TOKEN not set — skipping GitHub sync."
fi
