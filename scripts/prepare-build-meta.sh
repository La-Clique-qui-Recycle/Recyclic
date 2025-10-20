#!/usr/bin/env bash
set -euo pipefail

# prepare-build-meta.sh
# Collecte les métadonnées de build (version, SHA, branche, dates) et les écrit dans .build-meta.env

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
META_FILE="$ROOT_DIR/.build-meta.env"
PACKAGE_JSON="$ROOT_DIR/frontend/package.json"

if ! command -v git >/dev/null 2>&1; then
  echo "❌ Git n'est pas disponible dans l'environnement. Abandon." >&2
  exit 1
fi

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "❌ Fichier introuvable: $PACKAGE_JSON" >&2
  exit 1
fi

# Lecture de la version depuis package.json sans dépendance à jq
if command -v node >/dev/null 2>&1; then
  APP_VERSION=$(node -p "require('$PACKAGE_JSON').version" 2>/dev/null)
elif command -v python3 >/dev/null 2>&1; then
  APP_VERSION=$(python3 -c "import json,sys;print(json.load(open('$PACKAGE_JSON'))['version'])")
else
  echo "❌ Ni node ni python3 disponibles pour lire package.json" >&2
  exit 1
fi

COMMIT_SHA=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_DATE=$(git log -1 --format=%cI)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

{
  echo "APP_VERSION=$APP_VERSION"
  echo "COMMIT_SHA=$COMMIT_SHA"
  echo "BRANCH=$BRANCH"
  echo "COMMIT_DATE=$COMMIT_DATE"
  echo "BUILD_DATE=$BUILD_DATE"
} > "$META_FILE"

echo "✅ Métadonnées écrites dans $META_FILE"
echo "   APP_VERSION=$APP_VERSION"
echo "   COMMIT_SHA=$COMMIT_SHA"


