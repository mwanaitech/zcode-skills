#!/bin/bash
# Batch symlink a skill into multiple profiles
# Usage: bash templates/batch-symlink-profiles.sh <profile> <slug1> [slug2 ...]
#   --subdir <dir>   : optional subdirectory inside skills/
#
# Example:
#   bash templates/batch-symlink-profiles.sh image-processor ls-gm-img
#   bash templates/batch-symlink-profiles.sh code-reviewer code-review-senior --subdir software-development

set -euo pipefail

SOURCE_BASE="$HOME/.hermes/skills"
DEST_BASE="$HOME/.hermes/profiles"

profile=""
skills=()
subdir=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --subdir)
      subdir="$2"
      shift 2
      ;;
    *)
      if [[ -z "$profile" ]]; then
        profile="$1"
      else
        skills+=("$1")
      fi
      shift
      ;;
  esac
done

if [[ -z "$profile" ]] || [[ ${#skills[@]} -eq 0 ]]; then
  echo "Usage: $0 <profile> <slug1> [slug2 ...] [--subdir <dir>]"
  exit 1
fi

DEST_DIR="$DEST_BASE/$profile/skills"
[[ -n "$subdir" ]] && DEST_DIR="$DEST_DIR/$subdir"
mkdir -p "$DEST_DIR"

for slug in "${skills[@]}"; do
  SRC="$SOURCE_BASE/$slug"
  [[ -n "$subdir" ]] && SRC="$SOURCE_BASE/$subdir/$slug"

  if [[ ! -d "$SRC" ]]; then
    echo "✗ $slug — source not found: $SRC"
    continue
  fi

  ln -sfn "$SRC" "$DEST_DIR/$slug" && echo "✓ $slug → $DEST_DIR/$slug"
done
