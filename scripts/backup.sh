#!/bin/bash

# Script de sauvegarde automatisée de la base de données Recyclic
# Auteur: James (Dev Agent)
# Date: 2025-01-27
# Description: Sauvegarde PostgreSQL avec compression et envoi vers stockage externe

set -euo pipefail  # Arrêt en cas d'erreur, variables non définies, erreurs de pipe

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="recyclic_backup_${TIMESTAMP}.dump"
LOG_FILE="$LOG_DIR/backup_${TIMESTAMP}.log"

# Variables d'environnement (chargées depuis .env)
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Configuration par défaut
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-recyclic}"
POSTGRES_USER="${POSTGRES_USER:-recyclic}"

# Configuration stockage externe
BACKUP_REMOTE_HOST="${BACKUP_REMOTE_HOST:-}"
BACKUP_REMOTE_USER="${BACKUP_REMOTE_USER:-}"
BACKUP_REMOTE_PATH="${BACKUP_REMOTE_PATH:-/backups/recyclic}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Notification (optionnelle)
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
NOTIFICATION_TELEGRAM_TOKEN="${NOTIFICATION_TELEGRAM_TOKEN:-}"
NOTIFICATION_TELEGRAM_CHAT_ID="${NOTIFICATION_TELEGRAM_CHAT_ID:-}"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    exit 1
}

send_notification() {
    local message="$1"
    local is_error="${2:-false}"
    
    # Notification par email (si configurée)
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        local subject="[Recyclic Backup] $(if [ "$is_error" = "true" ]; then echo "ÉCHEC"; else echo "SUCCÈS"; fi)"
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL" || true
    fi
    
    # Notification Telegram (si configurée)
    if [ -n "$NOTIFICATION_TELEGRAM_TOKEN" ] && [ -n "$NOTIFICATION_TELEGRAM_CHAT_ID" ]; then
        local emoji="✅"
        if [ "$is_error" = "true" ]; then
            emoji="❌"
        fi
        
        curl -s -X POST "https://api.telegram.org/bot${NOTIFICATION_TELEGRAM_TOKEN}/sendMessage" \
            -d "chat_id=${NOTIFICATION_TELEGRAM_CHAT_ID}" \
            -d "text=${emoji} [Recyclic Backup] $message" \
            -d "parse_mode=HTML" >/dev/null 2>&1 || true
    fi
}

# Vérifications préliminaires
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier que pg_dump est disponible
    if ! command -v pg_dump >/dev/null 2>&1; then
        error "pg_dump n'est pas installé ou n'est pas dans le PATH"
    fi
    
    # Vérifier que les répertoires existent
    mkdir -p "$LOG_DIR" "$BACKUP_DIR"
    
    # Vérifier les variables d'environnement critiques
    if [ -z "$POSTGRES_PASSWORD" ]; then
        error "POSTGRES_PASSWORD n'est pas défini"
    fi
    
    # Vérifier la connexion à la base de données
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --schema-only --no-password >/dev/null 2>&1; then
        error "Impossible de se connecter à la base de données PostgreSQL"
    fi
    
    log "Prérequis validés"
}

# Créer la sauvegarde locale
create_backup() {
    log "Création de la sauvegarde locale..."
    
    local backup_path="$BACKUP_DIR/$BACKUP_FILE"
    
    # Créer le dump avec compression
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        --host="$POSTGRES_HOST" \
        --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --format=custom \
        --compress=9 \
        --verbose \
        --no-password \
        --file="$backup_path" 2>>"$LOG_FILE"; then
        
        log "Sauvegarde locale créée: $backup_path"
        
        # Vérifier la taille du fichier
        local file_size=$(du -h "$backup_path" | cut -f1)
        log "Taille de la sauvegarde: $file_size"
        
        echo "$backup_path"
    else
        error "Échec de la création de la sauvegarde locale"
    fi
}

# Envoyer vers le stockage externe
upload_to_remote() {
    local backup_path="$1"
    
    if [ -z "$BACKUP_REMOTE_HOST" ] || [ -z "$BACKUP_REMOTE_USER" ]; then
        log "Stockage externe non configuré, sauvegarde locale uniquement"
        return 0
    fi
    
    log "Envoi vers le stockage externe..."
    
    # Créer le répertoire distant si nécessaire
    ssh -o StrictHostKeyChecking=no "$BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST" "mkdir -p $BACKUP_REMOTE_PATH" || {
        log "WARNING: Impossible de créer le répertoire distant"
    }
    
    # Envoyer le fichier
    if scp -o StrictHostKeyChecking=no "$backup_path" "$BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST:$BACKUP_REMOTE_PATH/"; then
        log "Sauvegarde envoyée avec succès vers $BACKUP_REMOTE_HOST:$BACKUP_REMOTE_PATH/"
        
        # Nettoyer les anciennes sauvegardes sur le serveur distant
        cleanup_remote_backups
    else
        error "Échec de l'envoi vers le stockage externe"
    fi
}

# Nettoyer les anciennes sauvegardes sur le serveur distant
cleanup_remote_backups() {
    if [ -z "$BACKUP_REMOTE_HOST" ] || [ -z "$BACKUP_REMOTE_USER" ]; then
        return 0
    fi
    
    log "Nettoyage des anciennes sauvegardes (rétention: $BACKUP_RETENTION_DAYS jours)..."
    
    ssh -o StrictHostKeyChecking=no "$BACKUP_REMOTE_USER@$BACKUP_REMOTE_HOST" \
        "find $BACKUP_REMOTE_PATH -name 'recyclic_backup_*.dump' -type f -mtime +$BACKUP_RETENTION_DAYS -delete" || {
        log "WARNING: Impossible de nettoyer les anciennes sauvegardes distantes"
    }
    
    log "Nettoyage des sauvegardes distantes terminé"
}

# Nettoyer les anciennes sauvegardes locales
cleanup_local_backups() {
    log "Nettoyage des anciennes sauvegardes locales (rétention: $BACKUP_RETENTION_DAYS jours)..."
    
    find "$BACKUP_DIR" -name "recyclic_backup_*.dump" -type f -mtime +$BACKUP_RETENTION_DAYS -delete || {
        log "WARNING: Impossible de nettoyer les anciennes sauvegardes locales"
    }
    
    log "Nettoyage des sauvegardes locales terminé"
}

# Fonction principale
main() {
    log "=== Début de la sauvegarde automatisée Recyclic ==="
    
    # Vérifications
    check_prerequisites
    
    # Créer la sauvegarde
    local backup_path
    backup_path=$(create_backup)
    
    # Envoyer vers le stockage externe
    upload_to_remote "$backup_path"
    
    # Nettoyer les anciennes sauvegardes
    cleanup_local_backups
    
    # Notification de succès
    local file_size=$(du -h "$backup_path" | cut -f1)
    local success_message="Sauvegarde réussie - Fichier: $(basename "$backup_path") - Taille: $file_size"
    log "$success_message"
    send_notification "$success_message" false
    
    log "=== Sauvegarde terminée avec succès ==="
}

# Gestion des erreurs
trap 'error "Script interrompu par une erreur"' ERR

# Exécution
main "$@"

