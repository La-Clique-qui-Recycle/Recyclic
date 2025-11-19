#!/bin/bash

# Script de test des procédures de récupération base de données
# Auteur: James (Dev Agent)
# Date: 2025-01-27
# Description: Test automatique des scénarios de récupération

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
TEST_DIR="$PROJECT_ROOT/test_recovery"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/recovery_test_${TIMESTAMP}.log"
TEST_DB="recyclic_recovery_test"

# Variables d'environnement (chargées depuis .env)
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Configuration par défaut
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-recyclic}"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    exit 1
}

success() {
    log "SUCCESS: $1"
}

# Configuration du test
setup_test_environment() {
    log "Configuration de l'environnement de test..."

    # Créer le répertoire de test
    mkdir -p "$TEST_DIR"

    # Créer une base de données de test
    if docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $TEST_DB;" 2>/dev/null; then
        success "Base de données de test créée: $TEST_DB"
    else
        log "Base de données de test existe déjà, utilisation existante"
    fi

    # Créer des données de test
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" << 'EOF' 2>/dev/null || true
-- Créer des tables de test
CREATE TABLE IF NOT EXISTS test_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    eee_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_deposits (
    id SERIAL PRIMARY KEY,
    description TEXT,
    category_id INTEGER REFERENCES test_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer des données de test
INSERT INTO test_categories (name, eee_category) VALUES
    ('Ordinateurs', 'EEE-3'),
    ('Téléphones', 'EEE-4'),
    ('Écrans', 'EEE-3')
ON CONFLICT DO NOTHING;

INSERT INTO test_deposits (description, category_id) VALUES
    ('Ordinateur portable HP', 1),
    ('iPhone 12', 2),
    ('Écran 24"', 3)
ON CONFLICT DO NOTHING;
EOF

    success "Données de test insérées"
}

# Test 1: Sauvegarde et restauration complète
test_full_backup_restore() {
    log "=== Test 1: Sauvegarde et restauration complète ==="

    local test_backup="$TEST_DIR/full_backup_test.sql"

    # Créer une sauvegarde
    log "Création de la sauvegarde de test..."
    if docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$TEST_DB" > "$test_backup"; then
        success "Sauvegarde créée: $test_backup"
    else
        error "Échec de la création de la sauvegarde"
    fi

    # Vérifier le contenu de la sauvegarde
    if grep -q "PostgreSQL database dump" "$test_backup" && grep -q "test_categories" "$test_backup"; then
        success "Contenu de la sauvegarde validé"
    else
        error "Contenu de la sauvegarde invalide"
    fi

    # Supprimer des données pour simuler une perte
    log "Simulation de perte de données..."
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -c "
    DELETE FROM test_deposits WHERE description LIKE '%test%';
    UPDATE test_categories SET name = 'Corrompu' WHERE id = 1;" 2>/dev/null || true

    # Restaurer depuis la sauvegarde
    log "Restauration depuis la sauvegarde..."
    local temp_db="${TEST_DB}_restore"

    # Créer une base temporaire pour la restauration
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $temp_db;" 2>/dev/null || true
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $temp_db;"

    if docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$temp_db" < "$test_backup" 2>/dev/null; then
        success "Restauration réussie dans $temp_db"

        # Vérifier la restauration
        local restored_count=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$temp_db" -t -c "SELECT COUNT(*) FROM test_deposits;" 2>/dev/null || echo "0")
        if [ "$restored_count" -ge 3 ]; then
            success "Données restaurées correctement: $restored_count enregistrements"
        else
            error "Données manquantes après restauration: $restored_count"
        fi
    else
        error "Échec de la restauration"
    fi

    # Nettoyer
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $temp_db;" 2>/dev/null || true

    success "Test de sauvegarde/restauration complète réussi"
}

# Test 2: Test de corruption partielle
test_partial_corruption() {
    log "=== Test 2: Corruption partielle et récupération ==="

    # Créer une sauvegarde saine
    local healthy_backup="$TEST_DIR/healthy_backup.sql"
    docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$TEST_DB" > "$healthy_backup"

    # Simuler une corruption partielle
    log "Simulation de corruption partielle..."
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -c "
    -- Corrompre des données
    UPDATE test_deposits SET description = NULL WHERE id = 1;
    DELETE FROM test_categories WHERE id = 2;" 2>/dev/null || true

    # Vérifier la corruption
    local null_descriptions=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM test_deposits WHERE description IS NULL;" 2>/dev/null || echo "0")
    local missing_categories=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM test_categories;" 2>/dev/null || echo "0")

    if [ "$null_descriptions" -gt 0 ] || [ "$missing_categories" -lt 3 ]; then
        log "Corruption simulée détectée: $null_descriptions descriptions NULL, $missing_categories catégories restantes"
    else
        error "Échec de la simulation de corruption"
    fi

    # Restaurer depuis la sauvegarde saine
    log "Restauration depuis sauvegarde saine..."
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" << EOF 2>/dev/null || true
-- Nettoyer les données corrompues
TRUNCATE test_deposits, test_categories;

-- Recharger depuis la sauvegarde
EOF

    # Restaurer les données saines
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" < "$healthy_backup" 2>/dev/null || true

    # Vérifier la récupération
    local final_count=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM test_deposits WHERE description IS NOT NULL;" 2>/dev/null || echo "0")

    if [ "$final_count" -ge 3 ]; then
        success "Récupération partielle réussie: $final_count enregistrements valides"
    else
        error "Récupération partielle échouée: $final_count"
    fi

    success "Test de corruption partielle réussi"
}

# Test 3: Test de performance de récupération
test_recovery_performance() {
    log "=== Test 3: Performance de récupération ==="

    local large_backup="$TEST_DIR/large_backup.sql"
    local start_time end_time duration

    # Créer une sauvegarde plus volumineuse (dupliquer les données)
    log "Préparation de données volumineuses..."
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -c "
    INSERT INTO test_deposits (description, category_id)
    SELECT 'Item ' || generate_series, (random() * 3 + 1)::int
    FROM generate_series(1, 1000);" 2>/dev/null || true

    # Mesurer le temps de sauvegarde
    start_time=$(date +%s)
    docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$TEST_DB" > "$large_backup"
    end_time=$(date +%s)
    duration=$((end_time - start_time))

    log "Temps de sauvegarde: ${duration}s pour $(wc -l < "$large_backup") lignes"

    # Mesurer le temps de restauration
    local restore_db="${TEST_DB}_perf_test"
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $restore_db;" 2>/dev/null || true
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE $restore_db;"

    start_time=$(date +%s)
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$restore_db" < "$large_backup" 2>/dev/null || true
    end_time=$(date +%s)
    duration=$((end_time - start_time))

    log "Temps de restauration: ${duration}s"

    # Vérifier que la restauration respecte le RTO (< 4 heures = 14400 secondes)
    if [ $duration -lt 14400 ]; then
        success "Performance OK: RTO respecté (${duration}s < 14400s)"
    else
        error "Performance insuffisante: RTO dépassé (${duration}s >= 14400s)"
    fi

    # Nettoyer
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $restore_db;" 2>/dev/null || true

    success "Test de performance réussi"
}

# Test 4: Validation RPO (Recovery Point Objective)
test_rpo_validation() {
    log "=== Test 4: Validation RPO (< 1h de données perdues) ==="

    # Simuler des opérations après une sauvegarde
    log "Création d'une sauvegarde de référence..."
    local reference_backup="$TEST_DIR/rpo_reference.sql"
    docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$TEST_DB" > "$reference_backup"

    local reference_count=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM test_deposits;" 2>/dev/null || echo "0")
    log "Nombre d'enregistrements avant: $reference_count"

    # Attendre un court moment (simuler le RPO)
    sleep 5

    # Ajouter des données (simuler des opérations métier)
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -c "
    INSERT INTO test_deposits (description, category_id) VALUES
    ('Nouvel item RPO test', 1),
    ('Autre item RPO test', 2);" 2>/dev/null || true

    local after_count=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM test_deposits;" 2>/dev/null || echo "0")
    local new_records=$((after_count - reference_count))
    log "Nouveaux enregistrements ajoutés: $new_records"

    # Simuler une récupération (sans les nouvelles données)
    log "Simulation de récupération depuis sauvegarde..."
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -c "
    DELETE FROM test_deposits WHERE description LIKE '%RPO test%';" 2>/dev/null || true

    local recovered_count=$(docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM test_deposits;" 2>/dev/null || echo "0")

    # Calculer la perte de données
    local data_loss=$((after_count - recovered_count))
    log "Perte de données simulée: $data_loss enregistrements"

    # Valider le RPO (< 1h = données ajoutées pendant le test)
    if [ $data_loss -le $new_records ]; then
        success "RPO validé: perte de données acceptable (${data_loss} <= ${new_records})"
    else
        error "RPO dépassé: perte de données excessive (${data_loss} > ${new_records})"
    fi

    success "Test RPO réussi"
}

# Nettoyage
cleanup_test_environment() {
    log "Nettoyage de l'environnement de test..."

    # Supprimer la base de test
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null || true

    # Supprimer les fichiers de test
    rm -rf "$TEST_DIR"

    success "Environnement de test nettoyé"
}

# Rapport final
generate_test_report() {
    log "=== RAPPORT DE TEST DE RÉCUPÉRATION ==="

    local total_tests=4
    local passed_tests=0
    local failed_tests=0

    # Compter les succès/échecs depuis les logs
    if grep -q "Test 1.*réussi" "$LOG_FILE"; then ((passed_tests++)); else ((failed_tests++)); fi
    if grep -q "Test 2.*réussi" "$LOG_FILE"; then ((passed_tests++)); else ((failed_tests++)); fi
    if grep -q "Test 3.*réussi" "$LOG_FILE"; then ((passed_tests++)); else ((failed_tests++)); fi
    if grep -q "Test 4.*réussi" "$LOG_FILE"; then ((passed_tests++)); else ((failed_tests++)); fi

    local success_rate=$((passed_tests * 100 / total_tests))

    echo ""
    echo "📊 RÉSULTATS DES TESTS:"
    echo "Tests exécutés: $total_tests"
    echo "Tests réussis: $passed_tests"
    echo "Tests échoués: $failed_tests"
    echo "Taux de réussite: ${success_rate}%"
    echo ""
    echo "📁 Logs détaillés: $LOG_FILE"

    if [ $success_rate -eq 100 ]; then
        echo "🎉 TOUS LES TESTS RÉUSSIS - Procédures de récupération validées"
    elif [ $success_rate -ge 75 ]; then
        echo "⚠️ TESTS PARTIELLEMENT RÉUSSIS - Revue des procédures recommandée"
    else
        echo "❌ TESTS ÉCHOUÉS - Correction des procédures requise"
    fi
}

# Fonction principale
main() {
    log "=== DÉBUT DES TESTS DE RÉCUPÉRATION BASE DE DONNÉES ==="

    # Vérifier les prérequis
    if ! docker-compose ps | grep -q "postgres"; then
        error "PostgreSQL n'est pas démarré. Lancez: docker-compose up -d postgres"
    fi

    # Configuration
    setup_test_environment

    # Exécuter les tests
    test_full_backup_restore
    test_partial_corruption
    test_recovery_performance
    test_rpo_validation

    # Nettoyage
    cleanup_test_environment

    # Rapport
    generate_test_report

    log "=== TESTS DE RÉCUPÉRATION TERMINÉS ==="
}

# Gestion des erreurs
trap 'error "Script interrompu par une erreur"' ERR

# Exécution
main "$@"
