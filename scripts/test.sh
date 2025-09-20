#!/bin/bash
# Script de test simplifié pour l'API Recyclic
# Usage: ./scripts/test.sh [pytest arguments...]

set -e

echo "🚀 Démarrage des tests API..."

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Construire et démarrer les services nécessaires
echo "🔨 Construction des images..."
docker-compose build api-tests

# Exécuter les tests avec les arguments passés
echo "🧪 Exécution des tests..."
docker-compose run --rm api-tests "$@"

echo "✅ Tests terminés"
