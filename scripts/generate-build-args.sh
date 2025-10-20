#!/bin/bash

# Script pour générer les arguments de build Docker
# Usage: source ./scripts/generate-build-args.sh

echo "🔧 Génération des arguments de build..."

# Obtenir les informations Git
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT_DATE=$(git log -1 --format=%ci 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Exporter les variables
export COMMIT_SHA
export BRANCH
export COMMIT_DATE
export BUILD_DATE

echo "✅ Arguments générés:"
echo "   COMMIT_SHA: $COMMIT_SHA"
echo "   BRANCH: $BRANCH"
echo "   COMMIT_DATE: $COMMIT_DATE"
echo "   BUILD_DATE: $BUILD_DATE"