#!/usr/bin/env bash
# ============================================================
# git-push.sh — Commit and push all changes to GitHub
# Usage: bash scripts/git-push.sh [optional commit message]
# ============================================================
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

GH_TOKEN="${GITHUB_TOKEN:-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}"
GH_USER="JBlizzard-sketch"
REPO="nairobi-events-marketplace"
REMOTE_URL="https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO}.git"

# Ensure remote is set with auth token
git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"

# Commit message: argument or auto-generated from timestamp
if [ -n "$1" ]; then
  MSG="$1"
else
  MSG="chore: auto-push $(date '+%Y-%m-%d %H:%M') UTC"
fi

git add -A

# Only commit if there are staged changes
if git diff --cached --quiet; then
  echo "Nothing to commit — working tree clean."
else
  git commit -m "$MSG"
  echo "Committed: $MSG"
fi

# Push (create branch if needed)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
git push -u origin "$BRANCH"
echo "Pushed to GitHub: https://github.com/${GH_USER}/${REPO}/tree/${BRANCH}"
