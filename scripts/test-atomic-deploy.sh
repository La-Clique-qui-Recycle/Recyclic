#!/bin/bash

# Script de test pour le déploiement atomique
# Ce script simule des déploiements réussis et échoués pour valider le comportement

set -euo pipefail

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Configuration de test
TEST_VERSION="test-$(date +%s)"
TEST_COMPOSE_FILE="docker-compose.test.yml"
TEST_ENV_FILE=".env.test"

# Fonction pour créer un environnement de test
setup_test_environment() {
    log "Configuration de l'environnement de test..."
    
    # Créer un fichier docker-compose de test
    cat > "$TEST_COMPOSE_FILE" << 'EOF'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: recyclic_test
      POSTGRES_USER: recyclic
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recyclic"]
      interval: 5s
      timeout: 3s
      retries: 3
    networks:
      - recyclic-test-network

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
    networks:
      - recyclic-test-network

  api:
    image: recyclic-api:${API_IMAGE_TAG:-latest}
    environment:
      DATABASE_URL: postgresql://recyclic:test_password@postgres:5432/recyclic_test
      REDIS_URL: redis://redis:6379
      SECRET_KEY: test_secret_key
      ENVIRONMENT: test
    ports:
      - "8001:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - recyclic-test-network

  frontend:
    image: recyclic-frontend:${FRONTEND_IMAGE_TAG:-latest}
    ports:
      - "4445:80"
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s
    networks:
      - recyclic-test-network

networks:
  recyclic-test-network:
    driver: bridge
EOF

    # Créer un fichier d'environnement de test
    cat > "$TEST_ENV_FILE" << EOF
API_IMAGE_TAG=$TEST_VERSION
FRONTEND_IMAGE_TAG=$TEST_VERSION
POSTGRES_PASSWORD=test_password
SECRET_KEY=test_secret_key
EOF

    log_success "Environnement de test configuré"
}

# Fonction pour nettoyer l'environnement de test
cleanup_test_environment() {
    log "Nettoyage de l'environnement de test..."
    
    # Arrêter et supprimer les conteneurs de test
    docker-compose -f "$TEST_COMPOSE_FILE" down --remove-orphans || true
    
    # Supprimer les fichiers de test
    rm -f "$TEST_COMPOSE_FILE" "$TEST_ENV_FILE"
    
    # Supprimer les images de test
    docker rmi "recyclic-api:$TEST_VERSION" || true
    docker rmi "recyclic-frontend:$TEST_VERSION" || true
    
    log_success "Environnement de test nettoyé"
}

# Fonction pour créer une image de test valide
create_valid_test_image() {
    log "Création d'une image de test valide..."
    
    # Créer un Dockerfile minimal pour l'API de test
    cat > Dockerfile.test.api << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Installer curl pour les healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Créer un serveur HTTP simple pour simuler l'API
RUN echo '#!/usr/bin/env python3' > app.py && \
    echo 'import http.server' >> app.py && \
    echo 'import socketserver' >> app.py && \
    echo 'import json' >> app.py && \
    echo 'from urllib.parse import urlparse' >> app.py && \
    echo '' >> app.py && \
    echo 'class HealthHandler(http.server.BaseHTTPRequestHandler):' >> app.py && \
    echo '    def do_GET(self):' >> app.py && \
    echo '        if self.path == "/health":' >> app.py && \
    echo '            self.send_response(200)' >> app.py && \
    echo '            self.send_header("Content-type", "application/json")' >> app.py && \
    echo '            self.end_headers()' >> app.py && \
    echo '            self.wfile.write(b\'{"status": "healthy"}\')' >> app.py && \
    echo '        else:' >> app.py && \
    echo '            self.send_response(404)' >> app.py && \
    echo '            self.end_headers()' >> app.py && \
    echo '' >> app.py && \
    echo 'if __name__ == "__main__":' >> app.py && \
    echo '    with socketserver.TCPServer(("", 8000), HealthHandler) as httpd:' >> app.py && \
    echo '        print("Test API server running on port 8000")' >> app.py && \
    echo '        httpd.serve_forever()' >> app.py

RUN chmod +x app.py

EXPOSE 8000

CMD ["python3", "app.py"]
EOF

    # Créer un Dockerfile minimal pour le frontend de test
    cat > Dockerfile.test.frontend << 'EOF'
FROM nginx:alpine

# Créer une page HTML simple
RUN echo '<!DOCTYPE html><html><head><title>Test Frontend</title></head><body><h1>Test Frontend</h1></body></html>' > /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Construire les images de test
    docker build -f Dockerfile.test.api -t "recyclic-api:$TEST_VERSION" .
    docker build -f Dockerfile.test.frontend -t "recyclic-frontend:$TEST_VERSION" .
    
    # Nettoyer les Dockerfiles de test
    rm -f Dockerfile.test.api Dockerfile.test.frontend
    
    log_success "Images de test créées"
}

# Fonction pour créer une image de test défaillante
create_failing_test_image() {
    log "Création d'une image de test défaillante..."
    
    # Créer un Dockerfile qui échoue au démarrage
    cat > Dockerfile.test.failing << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Créer un script qui échoue immédiatement
RUN echo '#!/usr/bin/env python3' > app.py && \
    echo 'import sys' >> app.py && \
    echo 'print("This service will fail")' >> app.py && \
    echo 'sys.exit(1)' >> app.py

RUN chmod +x app.py

EXPOSE 8000

CMD ["python3", "app.py"]
EOF

    # Construire l'image défaillante
    docker build -f Dockerfile.test.failing -t "recyclic-api:$TEST_VERSION" .
    
    # Nettoyer le Dockerfile de test
    rm -f Dockerfile.test.failing
    
    log_success "Image de test défaillante créée"
}

# Fonction pour tester un déploiement réussi
test_successful_deployment() {
    log "🧪 Test de déploiement réussi..."
    
    create_valid_test_image
    setup_test_environment
    
    # Modifier le script atomic-deploy pour utiliser les fichiers de test
    sed "s/docker-compose.yml/$TEST_COMPOSE_FILE/g" scripts/atomic-deploy.sh > scripts/atomic-deploy.test.sh
    sed -i "s/.env.production/$TEST_ENV_FILE/g" scripts/atomic-deploy.test.sh
    chmod +x scripts/atomic-deploy.test.sh
    
    # Exécuter le déploiement atomique
    if ./scripts/atomic-deploy.test.sh "$TEST_VERSION"; then
        log_success "Test de déploiement réussi - PASSED"
        return 0
    else
        log_error "Test de déploiement réussi - FAILED"
        return 1
    fi
}

# Fonction pour tester un déploiement échoué
test_failing_deployment() {
    log "🧪 Test de déploiement échoué..."
    
    create_failing_test_image
    setup_test_environment
    
    # Modifier le script atomic-deploy pour utiliser les fichiers de test
    sed "s/docker-compose.yml/$TEST_COMPOSE_FILE/g" scripts/atomic-deploy.sh > scripts/atomic-deploy.test.sh
    sed -i "s/.env.production/$TEST_ENV_FILE/g" scripts/atomic-deploy.test.sh
    chmod +x scripts/atomic-deploy.test.sh
    
    # Exécuter le déploiement atomique (doit échouer)
    if ./scripts/atomic-deploy.test.sh "$TEST_VERSION"; then
        log_error "Test de déploiement échoué - FAILED (devrait échouer mais a réussi)"
        return 1
    else
        log_success "Test de déploiement échoué - PASSED (a échoué comme attendu)"
        return 0
    fi
}

# Fonction principale
main() {
    log "🚀 Début des tests de déploiement atomique"
    
    local test_results=()
    
    # Test 1: Déploiement réussi
    if test_successful_deployment; then
        test_results+=("✅ Déploiement réussi")
    else
        test_results+=("❌ Déploiement réussi")
    fi
    
    cleanup_test_environment
    
    # Test 2: Déploiement échoué
    if test_failing_deployment; then
        test_results+=("✅ Déploiement échoué")
    else
        test_results+=("❌ Déploiement échoué")
    fi
    
    cleanup_test_environment
    
    # Nettoyer le script de test
    rm -f scripts/atomic-deploy.test.sh
    
    # Afficher les résultats
    log "📊 Résultats des tests:"
    for result in "${test_results[@]}"; do
        echo "  $result"
    done
    
    # Vérifier si tous les tests ont réussi
    local failed_tests=0
    for result in "${test_results[@]}"; do
        if [[ "$result" == *"❌"* ]]; then
            ((failed_tests++))
        fi
    done
    
    if [[ $failed_tests -eq 0 ]]; then
        log_success "🎉 Tous les tests ont réussi !"
        exit 0
    else
        log_error "💥 $failed_tests test(s) ont échoué"
        exit 1
    fi
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Teste le script de déploiement atomique avec des scénarios réussis et échoués"
    echo ""
    echo "Options:"
    echo "  -h, --help    Afficher cette aide"
    echo "  --success     Tester seulement le déploiement réussi"
    echo "  --failure     Tester seulement le déploiement échoué"
    echo ""
    echo "Variables d'environnement:"
    echo "  DEPLOY_TIMEOUT           Timeout en secondes (défaut: 120)"
    echo "  HEALTH_CHECK_INTERVAL    Intervalle entre vérifications (défaut: 5)"
}

# Gestion des arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --success)
        log "🧪 Test de déploiement réussi uniquement"
        create_valid_test_image
        setup_test_environment
        test_successful_deployment
        cleanup_test_environment
        ;;
    --failure)
        log "🧪 Test de déploiement échoué uniquement"
        create_failing_test_image
        setup_test_environment
        test_failing_deployment
        cleanup_test_environment
        ;;
    "")
        main
        ;;
    *)
        log_error "Option inconnue: $1"
        show_help
        exit 1
        ;;
esac
