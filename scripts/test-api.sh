#!/bin/bash
# Script pour exécuter les tests API directement dans le conteneur
# Usage: ./scripts/test-api.sh [pytest arguments...]

set -e

echo "🧪 Exécution des tests API dans le conteneur..."

# Vérifier que les services sont démarrés
if ! docker-compose ps api-tests | grep -q "Up"; then
    echo "⚠️  Service api-tests non démarré. Démarrage des services nécessaires..."
    docker-compose up -d postgres redis api-tests
    echo "⏳ Attente du démarrage des services..."
    sleep 10
fi

# Exécuter les tests dans le conteneur existant
echo "🧪 Exécution des tests..."
docker-compose exec api-tests python -m pytest "$@"

echo "✅ Tests terminés"
