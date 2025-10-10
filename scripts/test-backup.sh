#!/bin/bash

# Script de test pour la sauvegarde automatisée
# Auteur: James (Dev Agent)
# Date: 2025-01-27

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
TEST_BACKUP_DIR="$PROJECT_ROOT/test_backups"
TEST_LOG="$PROJECT_ROOT/logs/backup_test_$(date +%Y%m%d_%H%M%S).log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$TEST_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$TEST_LOG"
    exit 1
}

# Vérifications préliminaires
check_prerequisites() {
    log "Vérification des prérequis pour le test de sauvegarde..."
    
    # Vérifier que Docker est en cours d'exécution
    if ! docker info >/dev/null 2>&1; then
        error "Docker n'est pas en cours d'exécution"
    fi
    
    # Vérifier que les services Recyclic sont démarrés
    if ! docker-compose ps | grep -q "Up"; then
        warn "Les services Recyclic ne semblent pas être démarrés"
        log "Démarrage des services pour le test..."
        cd "$PROJECT_ROOT"
        docker-compose up -d
        sleep 10
    fi
    
    # Vérifier que PostgreSQL est accessible
    if ! docker-compose exec -T postgres pg_isready -U recyclic >/dev/null 2>&1; then
        error "PostgreSQL n'est pas accessible"
    fi
    
    # Créer le répertoire de test
    mkdir -p "$TEST_BACKUP_DIR"
    
    log "Prérequis validés"
}

# Test de connexion à la base de données
test_database_connection() {
    log "Test de connexion à la base de données..."
    
    if docker-compose exec -T postgres psql -U recyclic -d recyclic -c "SELECT 1;" >/dev/null 2>&1; then
        log "✅ Connexion à la base de données réussie"
    else
        error "❌ Impossible de se connecter à la base de données"
    fi
}

# Test du script de sauvegarde en mode test
test_backup_script() {
    log "Test du script de sauvegarde..."
    
    # Créer un fichier .env de test
    cat > "$PROJECT_ROOT/.env.test" << EOF
POSTGRES_PASSWORD=recyclic_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=recyclic
POSTGRES_USER=recyclic
BACKUP_REMOTE_HOST=
BACKUP_REMOTE_USER=
BACKUP_REMOTE_PATH=
BACKUP_RETENTION_DAYS=1
EOF
    
    # Modifier temporairement le script pour utiliser le répertoire de test
    local test_backup_script="$SCRIPT_DIR/backup_test.sh"
    cp "$BACKUP_SCRIPT" "$test_backup_script"
    
    # Modifier les chemins pour le test
    sed -i "s|PROJECT_ROOT=\"\$.*\"|PROJECT_ROOT=\"$PROJECT_ROOT\"|g" "$test_backup_script"
    sed -i "s|BACKUP_DIR=\"\$.*\"|BACKUP_DIR=\"$TEST_BACKUP_DIR\"|g" "$test_backup_script"
    sed -i "s|LOG_DIR=\"\$.*\"|LOG_DIR=\"$PROJECT_ROOT/logs\"|g" "$test_backup_script"
    
    # Charger les variables d'environnement de test
    export $(cat "$PROJECT_ROOT/.env.test" | grep -v '^#' | xargs)
    
    # Exécuter le script de test
    if bash "$test_backup_script"; then
        log "✅ Script de sauvegarde exécuté avec succès"
    else
        error "❌ Échec de l'exécution du script de sauvegarde"
    fi
    
    # Nettoyer
    rm -f "$test_backup_script" "$PROJECT_ROOT/.env.test"
}

# Vérifier la sauvegarde créée
verify_backup_file() {
    log "Vérification du fichier de sauvegarde..."
    
    local backup_files=($(find "$TEST_BACKUP_DIR" -name "recyclic_backup_*.dump" -type f))
    
    if [ ${#backup_files[@]} -eq 0 ]; then
        error "❌ Aucun fichier de sauvegarde trouvé"
    fi
    
    local latest_backup="${backup_files[0]}"
    for file in "${backup_files[@]}"; do
        if [ "$file" -nt "$latest_backup" ]; then
            latest_backup="$file"
        fi
    done
    
    log "Fichier de sauvegarde trouvé: $latest_backup"
    
    # Vérifier la taille
    local file_size=$(du -h "$latest_backup" | cut -f1)
    log "Taille de la sauvegarde: $file_size"
    
    # Vérifier l'intégrité du dump
    if docker-compose exec -T postgres pg_restore --list /dev/stdin < "$latest_backup" >/dev/null 2>&1; then
        log "✅ Intégrité de la sauvegarde validée"
    else
        error "❌ Fichier de sauvegarde corrompu"
    fi
}

# Test de restauration
test_restore() {
    log "Test de restauration de la sauvegarde..."
    
    # Créer une base de données de test
    docker-compose exec -T postgres createdb -U recyclic recyclic_test_restore || {
        warn "Base de données de test existe déjà, suppression..."
        docker-compose exec -T postgres dropdb -U recyclic recyclic_test_restore
        docker-compose exec -T postgres createdb -U recyclic recyclic_test_restore
    }
    
    # Trouver la sauvegarde la plus récente
    local latest_backup=$(find "$TEST_BACKUP_DIR" -name "recyclic_backup_*.dump" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    # Restaurer dans la base de test
    if docker-compose exec -T postgres pg_restore \
        -U recyclic \
        -d recyclic_test_restore \
        --verbose \
        --no-owner \
        --no-privileges \
        < "$latest_backup"; then
        
        log "✅ Restauration réussie"
        
        # Vérifier que les données sont présentes
        local table_count=$(docker-compose exec -T postgres psql -U recyclic -d recyclic_test_restore -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
        
        if [ "$table_count" -gt 0 ]; then
            log "✅ Tables restaurées: $table_count"
        else
            warn "⚠️ Aucune table trouvée après restauration"
        fi
        
        # Nettoyer la base de test
        docker-compose exec -T postgres dropdb -U recyclic recyclic_test_restore
        log "Base de données de test nettoyée"
        
    else
        error "❌ Échec de la restauration"
    fi
}

# Test des notifications (simulation)
test_notifications() {
    log "Test des notifications..."
    
    # Simuler une notification de succès
    if [ -n "${NOTIFICATION_TELEGRAM_TOKEN:-}" ] && [ -n "${NOTIFICATION_TELEGRAM_CHAT_ID:-}" ]; then
        curl -s -X POST "https://api.telegram.org/bot${NOTIFICATION_TELEGRAM_TOKEN}/sendMessage" \
            -d "chat_id=${NOTIFICATION_TELEGRAM_CHAT_ID}" \
            -d "text=🧪 [TEST] Sauvegarde Recyclic testée avec succès" \
            -d "parse_mode=HTML" >/dev/null 2>&1 && {
            log "✅ Notification de test envoyée"
        } || {
            warn "⚠️ Impossible d'envoyer la notification de test"
        }
    else
        log "ℹ️ Notifications non configurées (optionnel)"
    fi
}

# Nettoyage
cleanup() {
    log "Nettoyage des fichiers de test..."
    
    # Supprimer les sauvegardes de test
    rm -rf "$TEST_BACKUP_DIR"
    
    # Garder les logs pour analyse
    log "Logs de test conservés dans: $TEST_LOG"
}

# Fonction principale
main() {
    log "=== DÉBUT DU TEST DE SAUVEGARDE RECYCLIC ==="
    
    check_prerequisites
    test_database_connection
    test_backup_script
    verify_backup_file
    test_restore
    test_notifications
    cleanup
    
    log "=== TEST TERMINÉ AVEC SUCCÈS ==="
    log "✅ Tous les tests de sauvegarde ont réussi"
    log "📁 Logs disponibles dans: $TEST_LOG"
}

# Gestion des erreurs
trap 'error "Test interrompu par une erreur"' ERR

# Exécution
main "$@"

