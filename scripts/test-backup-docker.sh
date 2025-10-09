#!/bin/bash

# Script de test pour la sauvegarde automatisée avec Docker
# Auteur: Quinn (Test Architect)
# Date: 2025-01-27

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_BACKUP_DIR="$PROJECT_ROOT/test_backups"
TEST_LOG="$PROJECT_ROOT/logs/backup_test_docker_$(date +%Y%m%d_%H%M%S).log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$TEST_LOG"
}

# Vérifications préliminaires
check_prerequisites() {
    log "Vérification des prérequis pour le test de sauvegarde Docker..."
    
    # Vérifier que Docker est en cours d'exécution
    if ! docker info >/dev/null 2>&1; then
        error "Docker n'est pas en cours d'exécution"
    fi
    
    # Vérifier que les services Recyclic sont démarrés
    if ! docker-compose ps | grep -q "Up"; then
        error "Les services Recyclic ne sont pas démarrés"
    fi
    
    # Vérifier que PostgreSQL est accessible
    if ! docker-compose exec -T postgres pg_isready -U recyclic >/dev/null 2>&1; then
        error "PostgreSQL n'est pas accessible"
    fi
    
    # Créer le répertoire de test
    mkdir -p "$TEST_BACKUP_DIR"
    
    success "Prérequis validés"
}

# Test de connexion à la base de données
test_database_connection() {
    log "Test de connexion à la base de données..."
    
    if docker-compose exec -T postgres psql -U recyclic -d recyclic -c "SELECT 1;" >/dev/null 2>&1; then
        success "Connexion à la base de données réussie"
    else
        error "Impossible de se connecter à la base de données"
    fi
}

# Test de création de sauvegarde avec Docker
test_backup_creation() {
    log "Test de création de sauvegarde avec Docker..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="recyclic_backup_${timestamp}.dump"
    local backup_path="/tmp/${backup_file}"
    
    # Créer la sauvegarde dans le conteneur
    if docker-compose exec -T postgres pg_dump \
        --username=recyclic \
        --dbname=recyclic \
        --format=custom \
        --compress=9 \
        --verbose \
        --no-password \
        --file="$backup_path"; then
        
        success "Sauvegarde créée dans le conteneur"
        
        # Copier la sauvegarde vers l'hôte
        if docker cp "$(docker-compose ps -q postgres):$backup_path" "$TEST_BACKUP_DIR/$backup_file"; then
            success "Sauvegarde copiée vers l'hôte"
            
            # Vérifier la taille
            local file_size=$(du -h "$TEST_BACKUP_DIR/$backup_file" | cut -f1)
            log "Taille de la sauvegarde: $file_size"
            
            # Vérifier l'intégrité
            if docker-compose exec -T postgres pg_restore --list /dev/stdin < "$TEST_BACKUP_DIR/$backup_file" >/dev/null 2>&1; then
                success "Intégrité de la sauvegarde validée"
            else
                error "Sauvegarde corrompue"
            fi
            
            echo "$TEST_BACKUP_DIR/$backup_file"
        else
            error "Impossible de copier la sauvegarde vers l'hôte"
        fi
    else
        error "Échec de la création de la sauvegarde"
    fi
}

# Test de restauration
test_restore() {
    log "Test de restauration de la sauvegarde..."
    
    # Trouver la sauvegarde la plus récente
    local latest_backup=$(find "$TEST_BACKUP_DIR" -name "recyclic_backup_*.dump" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_backup" ]; then
        error "Aucune sauvegarde trouvée pour le test de restauration"
    fi
    
    log "Sauvegarde utilisée pour le test: $latest_backup"
    
    # Créer une base de données de test
    docker-compose exec -T postgres createdb -U recyclic recyclic_test_restore || {
        warn "Base de données de test existe déjà, suppression..."
        docker-compose exec -T postgres dropdb -U recyclic recyclic_test_restore
        docker-compose exec -T postgres createdb -U recyclic recyclic_test_restore
    }
    
    # Copier la sauvegarde dans le conteneur
    local backup_filename=$(basename "$latest_backup")
    docker cp "$latest_backup" "$(docker-compose ps -q postgres):/tmp/$backup_filename"
    
    # Restaurer dans la base de test
    if docker-compose exec -T postgres pg_restore \
        -U recyclic \
        -d recyclic_test_restore \
        --verbose \
        --no-owner \
        --no-privileges \
        "/tmp/$backup_filename"; then
        
        success "Restauration réussie"
        
        # Vérifier que les données sont présentes
        local table_count=$(docker-compose exec -T postgres psql -U recyclic -d recyclic_test_restore -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
        
        if [ "$table_count" -gt 0 ]; then
            success "Tables restaurées: $table_count"
        else
            warn "Aucune table trouvée après restauration"
        fi
        
        # Nettoyer la base de test
        docker-compose exec -T postgres dropdb -U recyclic recyclic_test_restore
        success "Base de données de test nettoyée"
        
    else
        error "Échec de la restauration"
    fi
}

# Test des notifications (simulation)
test_notifications() {
    log "Test des notifications..."
    
    # Simuler une notification de succès
    if [ -n "${NOTIFICATION_TELEGRAM_TOKEN:-}" ] && [ -n "${NOTIFICATION_TELEGRAM_CHAT_ID:-}" ]; then
        curl -s -X POST "https://api.telegram.org/bot${NOTIFICATION_TELEGRAM_TOKEN}/sendMessage" \
            -d "chat_id=${NOTIFICATION_TELEGRAM_CHAT_ID}" \
            -d "text=🧪 [TEST DOCKER] Sauvegarde Recyclic testée avec succès" \
            -d "parse_mode=HTML" >/dev/null 2>&1 && {
            success "Notification de test envoyée"
        } || {
            warn "Impossible d'envoyer la notification de test"
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
    
    # Nettoyer les fichiers temporaires dans le conteneur
    docker-compose exec -T postgres rm -f /tmp/recyclic_backup_*.dump /tmp/test_backup.dump
    
    # Garder les logs pour analyse
    log "Logs de test conservés dans: $TEST_LOG"
}

# Fonction principale
main() {
    log "=== DÉBUT DU TEST DE SAUVEGARDE RECYCLIC (DOCKER) ==="
    
    check_prerequisites
    test_database_connection
    test_backup_creation
    test_restore
    test_notifications
    cleanup
    
    log "=== TEST TERMINÉ AVEC SUCCÈS ==="
    success "Tous les tests de sauvegarde Docker ont réussi"
    log "📁 Logs disponibles dans: $TEST_LOG"
}

# Gestion des erreurs
trap 'error "Test interrompu par une erreur"' ERR

# Exécution
main "$@"
