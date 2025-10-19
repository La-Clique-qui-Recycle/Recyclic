#!/usr/bin/env bash
set -euo pipefail

# Génère et exporte les variables d'environnement utilisées comme build args Docker
# Usage:
#   source ./scripts/generate-build-args.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT_DATE=$(git log -1 --format=%ci 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

export COMMIT_SHA
export BRANCH
export COMMIT_DATE
export BUILD_DATE

echo "Exported build args:"
echo "  COMMIT_SHA=$COMMIT_SHA"
echo "  BRANCH=$BRANCH"
echo "  COMMIT_DATE=$COMMIT_DATE"
echo "  BUILD_DATE=$BUILD_DATE"


