#!/bin/bash
# Script pour rebuilder l'API avec la version correcte

echo "🔍 Récupération de la version depuis package.json..."
export APP_VERSION=$(./scripts/get-version.sh)
export COMMIT_SHA=$(git rev-parse --short HEAD)
export BRANCH=$(git rev-parse --abbrev-ref HEAD)
export COMMIT_DATE=$(git log -1 --format=%ci)
export BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📦 Version détectée: $APP_VERSION"
echo "🔗 Commit SHA: $COMMIT_SHA"
echo "🌿 Branche: $BRANCH"

echo "🔨 Rebuild de l'API avec la version $APP_VERSION..."
docker-compose build api

echo "🚀 Redémarrage de l'API..."
docker-compose up -d api

echo "⏳ Attente du démarrage de l'API..."
sleep 5

echo "🧪 Test de l'endpoint version..."
curl -s http://localhost:8000/v1/health/version | jq . || curl -s http://localhost:8000/v1/health/version

echo "✅ Terminé !"
