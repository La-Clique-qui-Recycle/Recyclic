#!/bin/bash

# Script pour générer les informations de build
# Usage: ./scripts/generate-build-info.sh

set -e

# Répertoire du projet
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_INFO_FILE="$PROJECT_DIR/frontend/public/build-info.json"

# Récupérer les informations
VERSION=$(node -p "require('$PROJECT_DIR/frontend/package.json').version")
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_DATE=$(git log -1 --format=%ci 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Créer le répertoire public s'il n'existe pas
mkdir -p "$(dirname "$BUILD_INFO_FILE")"

# Créer le fichier build-info.json
cat > "$BUILD_INFO_FILE" << EOF
{
  "version": "$VERSION",
  "commitSha": "$COMMIT_SHA",
  "commitDate": "$COMMIT_DATE",
  "buildDate": "$BUILD_DATE",
  "branch": "$BRANCH"
}
EOF

echo "✅ Build info généré: $BUILD_INFO_FILE"
echo "📋 Contenu:"
cat "$BUILD_INFO_FILE"
