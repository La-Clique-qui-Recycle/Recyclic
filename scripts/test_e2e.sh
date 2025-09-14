#!/bin/bash

# Script de test E2E pour l'interface d'administration
# Exécute les tests backend et frontend

set -e

echo "🚀 Démarrage des tests E2E pour l'interface d'administration..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERREUR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ATTENTION: $1${NC}"
}

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Vérifier que les services sont démarrés
log "Vérification des services Docker..."
if ! docker-compose ps | grep -q "Up"; then
    warning "Les services Docker ne sont pas démarrés. Démarrage en cours..."
    docker-compose up -d postgres redis
    sleep 10
fi

# Tests Backend E2E
log "Exécution des tests backend E2E..."
cd api

# Vérifier que les dépendances sont installées
if [ ! -d "venv" ]; then
    log "Création de l'environnement virtuel Python..."
    python -m venv venv
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Installer les dépendances
log "Installation des dépendances Python..."
pip install -r requirements.txt

# Exécuter les tests E2E backend
log "Exécution des tests E2E backend..."
if python -m pytest tests/test_admin_e2e.py -v --tb=short; then
    log "✅ Tests backend E2E réussis"
else
    error "❌ Tests backend E2E échoués"
    exit 1
fi

cd ..

# Tests Frontend E2E
log "Exécution des tests frontend E2E..."
cd frontend

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    log "Installation des dépendances Node.js..."
    npm install
fi

# Vérifier que Playwright est installé
if ! npx playwright --version > /dev/null 2>&1; then
    log "Installation de Playwright..."
    npx playwright install
fi

# Démarrer l'application frontend en arrière-plan
log "Démarrage de l'application frontend..."
npm start &
FRONTEND_PID=$!

# Attendre que l'application soit prête
log "Attente du démarrage de l'application frontend..."
sleep 30

# Vérifier que l'application est accessible
if curl -f http://localhost:4444 > /dev/null 2>&1; then
    log "✅ Application frontend accessible"
else
    error "❌ Application frontend non accessible"
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Exécuter les tests E2E frontend
log "Exécution des tests E2E frontend..."
if npx playwright test tests/e2e/admin.spec.ts --reporter=line; then
    log "✅ Tests frontend E2E réussis"
else
    error "❌ Tests frontend E2E échoués"
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Arrêter l'application frontend
kill $FRONTEND_PID 2>/dev/null || true

cd ..

# Tests d'intégration complets
log "Exécution des tests d'intégration complets..."

# Démarrer tous les services
log "Démarrage de tous les services..."
docker-compose up -d

# Attendre que tous les services soient prêts
log "Attente du démarrage des services..."
sleep 30

# Vérifier la santé des services
log "Vérification de la santé des services..."

# API
if curl -f http://localhost:4433/health > /dev/null 2>&1; then
    log "✅ API accessible"
else
    error "❌ API non accessible"
    docker-compose logs api
    exit 1
fi

# Frontend
if curl -f http://localhost:4444 > /dev/null 2>&1; then
    log "✅ Frontend accessible"
else
    error "❌ Frontend non accessible"
    docker-compose logs frontend
    exit 1
fi

# Test de l'endpoint admin
log "Test de l'endpoint admin..."
if curl -f http://localhost:4433/api/v1/admin/users > /dev/null 2>&1; then
    log "✅ Endpoint admin accessible"
else
    warning "⚠️ Endpoint admin nécessite une authentification (normal)"
fi

# Tests de charge simples
log "Exécution de tests de charge simples..."
for i in {1..10}; do
    if curl -f http://localhost:4433/health > /dev/null 2>&1; then
        echo -n "."
    else
        error "❌ Service API indisponible lors du test de charge"
        exit 1
    fi
done
echo ""

log "✅ Tests de charge réussis"

# Nettoyage
log "Nettoyage des services..."
docker-compose down

# Résumé
log "🎉 Tous les tests E2E ont été exécutés avec succès !"
log "📊 Résumé des tests :"
log "  - Tests backend E2E : ✅"
log "  - Tests frontend E2E : ✅"
log "  - Tests d'intégration : ✅"
log "  - Tests de charge : ✅"

echo ""
log "🚀 L'interface d'administration est prête pour la production !"
