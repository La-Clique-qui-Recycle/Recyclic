#!/bin/bash

# Tests automatisés pour le script de rollback
# Usage: bash tests/test_rollback.sh

set -e

# Couleurs pour les logs de test
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs de tests
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Fonction de logging des tests
test_log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

test_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

test_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Fonction pour exécuter un test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_exit_code="${3:-0}"
    
    ((TOTAL_TESTS++))
    test_log "Running: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        local actual_exit_code=$?
        if [ "$actual_exit_code" -eq "$expected_exit_code" ]; then
            test_pass "$test_name"
        else
            test_fail "$test_name (expected exit code $expected_exit_code, got $actual_exit_code)"
        fi
    else
        local actual_exit_code=$?
        if [ "$actual_exit_code" -eq "$expected_exit_code" ]; then
            test_pass "$test_name"
        else
            test_fail "$test_name (expected exit code $expected_exit_code, got $actual_exit_code)"
        fi
    fi
}

# Fonction pour nettoyer après les tests
cleanup() {
    test_log "Cleaning up test environment..."
    
    # Arrêter et supprimer les conteneurs de test
    docker-compose down >/dev/null 2>&1 || true
    
    # Supprimer les images de test
    docker rmi recyclic-api:test-v1 recyclic-api:test-v2 >/dev/null 2>&1 || true
    docker rmi recyclic-bot:test-v1 recyclic-bot:test-v2 >/dev/null 2>&1 || true
    docker rmi recyclic-frontend:test-v1 recyclic-frontend:test-v2 >/dev/null 2>&1 || true
    
    # Supprimer les fichiers temporaires
    rm -f .env.test .env.rollback
    rm -rf logs/
    
    test_log "Cleanup completed"
}

# Fonction pour créer un environnement de test
setup_test_environment() {
    test_log "Setting up test environment..."
    
    # Créer des images de test
    docker build -t recyclic-api:test-v1 -f api/Dockerfile . >/dev/null 2>&1
    docker build -t recyclic-bot:test-v1 -f bot/Dockerfile . >/dev/null 2>&1
    docker build -t recyclic-frontend:test-v1 -f frontend/Dockerfile . >/dev/null 2>&1
    
    docker build -t recyclic-api:test-v2 -f api/Dockerfile . >/dev/null 2>&1
    docker build -t recyclic-bot:test-v2 -f bot/Dockerfile . >/dev/null 2>&1
    docker build -t recyclic-frontend:test-v2 -f frontend/Dockerfile . >/dev/null 2>&1
    
    # Créer un fichier .env de test
    cat > .env.test << EOF
API_IMAGE_TAG=test-v2
BOT_IMAGE_TAG=test-v2
FRONTEND_IMAGE_TAG=test-v2
POSTGRES_PASSWORD=testpass
SECRET_KEY=test-secret
TELEGRAM_BOT_TOKEN=test-token
ADMIN_TELEGRAM_IDS=123456789
EOF
    
    test_log "Test environment ready"
}

# Tests principaux
echo "=== Tests Automatisés - Script de Rollback ==="
echo

# Configuration du trap pour le nettoyage
trap cleanup EXIT

# Test 1: Vérification de l'aide
run_test "Help display" "bash scripts/rollback.sh --help" 0

# Test 2: Vérification des arguments invalides
run_test "Invalid arguments" "bash scripts/rollback.sh --invalid-option" 1

# Test 3: Vérification du répertoire de travail
cd /tmp
run_test "Wrong directory detection" "bash ../scripts/rollback.sh" 1
cd - >/dev/null

# Test 4: Vérification de la version inexistante
run_test "Non-existent version" "bash scripts/rollback.sh nonexistent-version" 1

# Test 5: Vérification de la fonction de métriques
run_test "Metrics logging" "
    mkdir -p logs
    bash -c 'source scripts/rollback.sh && log_metrics test_event test_version 10 success'
    [ -f logs/rollback-metrics.json ]
" 0

# Test 6: Vérification de la détection de version actuelle
setup_test_environment

# Démarrer les services avec test-v2
docker-compose --env-file .env.test up -d >/dev/null 2>&1
sleep 10

run_test "Current version detection" "
    bash -c 'source scripts/rollback.sh && get_current_version' | grep -q 'test-v2'
" 0

# Test 7: Vérification de la détection de version précédente
run_test "Previous version detection" "
    bash -c 'source scripts/rollback.sh && get_previous_version test-v2' | grep -q 'test-v1'
" 0

# Test 8: Vérification de l'existence des images
run_test "Image existence check" "
    bash -c 'source scripts/rollback.sh && check_version_exists test-v1'
" 0

# Test 9: Vérification de l'inexistence des images
run_test "Non-existent image check" "
    bash -c 'source scripts/rollback.sh && check_version_exists nonexistent-version'
" 1

# Test 10: Test de rollback simulé (sans confirmation)
run_test "Rollback simulation" "
    echo 'n' | bash scripts/rollback.sh test-v1 | grep -q 'Rollback annulé'
" 0

# Test 11: Vérification des métriques après rollback
run_test "Metrics after rollback" "
    echo 'y' | timeout 30 bash scripts/rollback.sh test-v1 >/dev/null 2>&1 || true
    [ -f logs/rollback-metrics.json ]
" 0

# Test 12: Vérification de la structure des métriques
run_test "Metrics structure validation" "
    [ -f logs/rollback-metrics.json ] && 
    grep -q 'timestamp' logs/rollback-metrics.json &&
    grep -q 'event' logs/rollback-metrics.json &&
    grep -q 'version' logs/rollback-metrics.json
" 0

# Nettoyage final
cleanup

# Résumé des tests
echo
echo "=== Résumé des Tests ==="
echo "Total des tests: $TOTAL_TESTS"
echo "Tests réussis: $TESTS_PASSED"
echo "Tests échoués: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    exit 0
else
    echo -e "${RED}❌ $TESTS_FAILED test(s) ont échoué${NC}"
    exit 1
fi
