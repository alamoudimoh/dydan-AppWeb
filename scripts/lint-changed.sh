#!/usr/bin/env bash
set -euo pipefail

base=${VERIFY_BASE_SHA:-origin/develop}
if [[ "$base" =~ ^0+$ ]] || ! git rev-parse --verify "$base^{commit}" >/dev/null 2>&1; then
  base=HEAD
fi

mapfile -t files < <(
  {
    git diff --name-only --diff-filter=ACMR "$base" -- '*.js' '*.jsx' '*.ts' '*.tsx'
    git diff --name-only --diff-filter=ACMR -- '*.js' '*.jsx' '*.ts' '*.tsx'
  } | sort -u | while read -r file; do
    [[ -f "$file" ]] && printf '%s\n' "$file"
  done
)

if (( ${#files[@]} == 0 )); then
  echo "No changed frontend source files to lint."
  exit 0
fi

npx eslint "${files[@]}"
npx prettier -c "${files[@]}"
