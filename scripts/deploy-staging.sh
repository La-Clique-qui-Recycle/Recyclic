#!/bin/bash
set -euo pipefail

# Script de déploiement automatique pour VPS STAGING
# Usage: ./scripts/deploy-staging.sh

echo "🚀 Déploiement STAGING automatique..."

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.staging.yml" ]; then
    echo "❌ Erreur: docker-compose.staging.yml non trouvé. Assurez-vous d'être dans le répertoire du projet."
    exit 1
fi

# Récupérer les dernières modifications
echo "📥 Récupération des dernières modifications..."
git fetch --all --tags
git checkout staging
git pull --ff-only

# Générer les variables COMMIT_* pour cette session
echo "🔧 Génération des arguments de build..."
source ./scripts/generate-build-args.sh

echo "✅ Arguments générés:"
echo "   COMMIT_SHA: $COMMIT_SHA"
echo "   BRANCH: $BRANCH"
echo "   COMMIT_DATE: $COMMIT_DATE"
echo "   BUILD_DATE: $BUILD_DATE"

# Builder et déployer
echo "🏗️  Build du frontend staging..."
docker-compose -f docker-compose.staging.yml build frontend

echo "🚀 Déploiement staging..."
docker-compose -f docker-compose.staging.yml up -d frontend

# Vérification
echo "🔍 Vérification du déploiement..."
sleep 5

# Vérifier que les conteneurs sont en cours d'exécution
echo "📊 État des conteneurs:"
docker-compose -f docker-compose.staging.yml ps

# Tester l'API de version
echo "🧪 Test de l'API de version:"
if curl -s http://localhost:4444/build-info.json | jq .; then
    echo "✅ API de version accessible"
else
    echo "⚠️  API de version non accessible (vérifiez le port et l'état des conteneurs)"
fi

echo "🎉 Déploiement STAGING terminé avec succès !"
echo "   Interface: http://votre-vps-ip:4444"
echo "   Version: $COMMIT_SHA"
