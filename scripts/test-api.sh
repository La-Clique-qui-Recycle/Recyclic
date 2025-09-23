#!/bin/bash
# Script pour exécuter les tests API dans un conteneur éphémère
# Usage: ./scripts/test-api.sh [pytest arguments...]

set -euo pipefail

echo "🧪 Exécution des tests API..."

# Démarrer les dépendances nécessaires
echo "🔧 Vérification des services de base (postgres, redis)..."
docker-compose up -d postgres redis
echo "⏳ Attente du démarrage des services..."
sleep 8

# Lancer les tests via un conteneur one-off pour éviter l'état 'exited'
PYTEST_ARGS="$*"
if [ "${PYTEST_SKIP_MIGRATIONS:-}" = "1" ]; then
  echo "🧪 Lancement de pytest (migrations SKIPPED) dans un conteneur éphémère api-tests..."
  docker-compose run --rm \
    -e TEST_DATABASE_URL=postgresql://recyclic:${POSTGRES_PASSWORD}@postgres:5432/recyclic_test \
    -e PYTEST_ARGS="$PYTEST_ARGS" \
    api-tests bash -lc "python -m pytest $PYTEST_ARGS"
else
  echo "🧪 Lancement de migrations + pytest dans un conteneur éphémère api-tests..."
  docker-compose run --rm \
    -e TEST_DATABASE_URL=postgresql://recyclic:${POSTGRES_PASSWORD}@postgres:5432/recyclic_test \
    -e PYTEST_ARGS="$PYTEST_ARGS" \
    api-tests bash -lc "alembic upgrade head && python -m pytest $PYTEST_ARGS"
fi

echo "✅ Tests terminés"
