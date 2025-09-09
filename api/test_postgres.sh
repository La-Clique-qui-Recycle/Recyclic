#!/bin/bash

# Script de test PostgreSQL/Redis pour WSL2 + Docker Desktop
# Usage: ./test_postgres.sh

set -e

echo "🚀 Démarrage des tests PostgreSQL/Redis pour Recyclic"
echo "=================================================="

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Démarrer PostgreSQL et Redis
echo "📦 Démarrage des services PostgreSQL et Redis..."
docker-compose up -d postgres redis

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier que les services sont accessibles
echo "🔍 Vérification de la connectivité..."
if ! docker-compose exec postgres pg_isready -U postgres; then
    echo "❌ PostgreSQL n'est pas prêt"
    exit 1
fi

if ! docker-compose exec redis redis-cli ping | grep -q PONG; then
    echo "❌ Redis n'est pas prêt"
    exit 1
fi

echo "✅ Services PostgreSQL et Redis prêts"

# Charger les variables d'environnement
echo "🔧 Configuration de l'environnement de test..."
export ENVIRONMENT=test_postgres
export TEST_DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/recyclic_test"
export REDIS_URL="redis://localhost:6379/1"

# Installer les dépendances si nécessaire
echo "📦 Installation des dépendances..."
pip install -e . > /dev/null 2>&1 || true
pip install -r requirements.txt > /dev/null 2>&1 || true

# Exécuter les tests de connectivité d'abord
echo "🧪 Exécution des tests de connectivité..."
python -m pytest tests/test_postgres_connectivity.py -v

# Exécuter tous les tests
echo "🧪 Exécution de la suite complète de tests..."
python -m pytest -v

echo "✅ Tests terminés avec succès!"
echo "=================================================="
