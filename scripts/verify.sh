#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"

bash scripts/check-runtime-artifacts.sh
npm ci
bash scripts/lint-changed.sh
npm run check:ui-architecture
npm run typecheck
npm run test --if-present
npm run build
