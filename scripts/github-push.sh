#!/usr/bin/env bash
# ============================================================
# github-push.sh — Push repo contents to GitHub via API
# Reads GITHUB_TOKEN from environment
# Usage: bash scripts/github-push.sh [commit message]
# ============================================================
set -euo pipefail

GH_USER="JBlizzard-sketch"
REPO="nairobi-events-marketplace"
BRANCH="main"
API="https://api.github.com"
TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN env var must be set}"
MSG="${1:-chore: auto-push $(date '+%Y-%m-%d %H:%M UTC')}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

auth_header() {
  echo "Authorization: Bearer $TOKEN"
}

# ── Get current branch HEAD SHA ───────────────────────────────────────────────
echo "→ Getting HEAD SHA for $BRANCH..."
HEAD_SHA=$(curl -sf \
  -H "$(auth_header)" \
  -H "Accept: application/vnd.github+json" \
  "$API/repos/$GH_USER/$REPO/git/ref/heads/$BRANCH" \
  | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$HEAD_SHA" ]; then
  echo "Branch $BRANCH not found — creating initial commit via API..."
  # For initial push, just upload README to bootstrap
  README_B64=$(base64 -w0 "$REPO_ROOT/README.md")
  RESULT=$(curl -sf -X PUT \
    -H "$(auth_header)" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "$API/repos/$GH_USER/$REPO/contents/README.md" \
    -d "{\"message\":\"$MSG\",\"content\":\"$README_B64\"}")
  echo "✓ Initial commit created."
  HEAD_SHA=$(echo "$RESULT" | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

# ── Build file tree ───────────────────────────────────────────────────────────
echo "→ Building file tree..."

# Files to include (relative to repo root)
INCLUDE_PATTERNS=(
  "README.md"
  "replit.md"
  "package.json"
  "pnpm-workspace.yaml"
  "tsconfig.json"
  "tsconfig.base.json"
  "lib/**"
  "artifacts/api-server/**"
  "scripts/**"
)

TREE_JSON="["
FIRST=true

push_file() {
  local filepath="$1"
  local rel="${filepath#$REPO_ROOT/}"

  # Skip node_modules, dist, .replit-artifact, pnpm-lock
  case "$rel" in
    *node_modules*|*/dist/*|*/.replit-artifact/*|pnpm-lock.yaml|*.tsbuildinfo) return ;;
  esac

  if [ ! -f "$filepath" ]; then return; fi

  local b64
  b64=$(base64 -w0 "$filepath")

  # Create blob
  local blob_sha
  blob_sha=$(curl -sf -X POST \
    -H "$(auth_header)" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "$API/repos/$GH_USER/$REPO/git/blobs" \
    -d "{\"content\":\"$b64\",\"encoding\":\"base64\"}" \
    | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$blob_sha" ]; then
    if [ "$FIRST" = true ]; then FIRST=false; else TREE_JSON+=","; fi
    TREE_JSON+="{\"path\":\"$rel\",\"mode\":\"100644\",\"type\":\"blob\",\"sha\":\"$blob_sha\"}"
    echo "  ✓ $rel"
  fi
}

cd "$REPO_ROOT"

# Collect all matching files
for f in README.md replit.md package.json pnpm-workspace.yaml tsconfig.json tsconfig.base.json; do
  [ -f "$f" ] && push_file "$REPO_ROOT/$f"
done

# Walk lib and artifacts/api-server and scripts
for dir in lib artifacts/api-server scripts; do
  if [ -d "$REPO_ROOT/$dir" ]; then
    while IFS= read -r -d '' filepath; do
      push_file "$filepath"
    done < <(find "$REPO_ROOT/$dir" -type f -print0)
  fi
done

TREE_JSON+="]"

# ── Create tree ───────────────────────────────────────────────────────────────
echo "→ Creating Git tree..."
TREE_SHA=$(curl -sf -X POST \
  -H "$(auth_header)" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  "$API/repos/$GH_USER/$REPO/git/trees" \
  -d "{\"base_tree\":\"$HEAD_SHA\",\"tree\":$TREE_JSON}" \
  | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "  Tree SHA: $TREE_SHA"

# ── Create commit ─────────────────────────────────────────────────────────────
echo "→ Creating commit: $MSG"
COMMIT_SHA=$(curl -sf -X POST \
  -H "$(auth_header)" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  "$API/repos/$GH_USER/$REPO/git/commits" \
  -d "{\"message\":\"$MSG\",\"tree\":\"$TREE_SHA\",\"parents\":[\"$HEAD_SHA\"]}" \
  | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "  Commit SHA: $COMMIT_SHA"

# ── Update branch ref ─────────────────────────────────────────────────────────
echo "→ Updating $BRANCH to $COMMIT_SHA..."
curl -sf -X PATCH \
  -H "$(auth_header)" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  "$API/repos/$GH_USER/$REPO/git/refs/heads/$BRANCH" \
  -d "{\"sha\":\"$COMMIT_SHA\",\"force\":false}" > /dev/null

echo ""
echo "✅ Pushed to https://github.com/$GH_USER/$REPO/tree/$BRANCH"
echo "   Commit: $MSG"
