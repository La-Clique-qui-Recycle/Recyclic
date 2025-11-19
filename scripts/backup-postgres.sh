#!/bin/bash

# Script de sauvegarde PostgreSQL automatisé pour Recyclic
# Auteur: James (Dev Agent)
# Date: 2025-01-27
# Description: Sauvegarde PostgreSQL avec compression, chiffrement et rétention

set -euo pipefail  # Arrêt en cas d'erreur, variables non définies, erreurs de pipe

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="postgres_backup_${TIMESTAMP}.dump"
LOG_FILE="$LOG_DIR/backup_postgres_${TIMESTAMP}.log"

# Variables d'environnement (chargées depuis .env)
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Configuration par défaut
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-recyclic}"
POSTGRES_USER="${POSTGRES_USER:-recyclic}"

# Configuration backup
BACKUP_COMPRESSION="${BACKUP_COMPRESSION:-true}"
BACKUP_ENCRYPTION="${BACKUP_ENCRYPTION:-false}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
RETENTION_DAILY="${RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-12}"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    exit 1
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
    if [ -z "${POSTGRES_PASSWORD:-}" ]; then
        error "POSTGRES_PASSWORD n'est pas défini"
    fi

    # Vérifier la connexion à la base de données
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --host="$POSTGRES_HOST" --port="$POSTGRES_PORT" --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --schema-only --no-password >/dev/null 2>&1; then
        error "Impossible de se connecter à la base de données PostgreSQL"
    fi

    log "Prérequis validés"
}

# Créer la sauvegarde PostgreSQL
create_postgres_backup() {
    log "Création de la sauvegarde PostgreSQL..."

    local backup_path="$BACKUP_DIR/$BACKUP_FILE"

    # Commande pg_dump de base
    local pg_dump_cmd="PGPASSWORD=\"$POSTGRES_PASSWORD\" pg_dump"
    pg_dump_cmd="$pg_dump_cmd --host=\"$POSTGRES_HOST\""
    pg_dump_cmd="$pg_dump_cmd --port=\"$POSTGRES_PORT\""
    pg_dump_cmd="$pg_dump_cmd --username=\"$POSTGRES_USER\""
    pg_dump_cmd="$pg_dump_cmd --dbname=\"$POSTGRES_DB\""
    pg_dump_cmd="$pg_dump_cmd --format=custom"
    pg_dump_cmd="$pg_dump_cmd --compress=9"
    pg_dump_cmd="$pg_dump_cmd --verbose"
    pg_dump_cmd="$pg_dump_cmd --no-password"
    pg_dump_cmd="$pg_dump_cmd --file=\"$backup_path\""

    # Exécuter la sauvegarde
    if eval "$pg_dump_cmd" 2>>"$LOG_FILE"; then
        log "Sauvegarde PostgreSQL créée: $backup_path"

        # Vérifier la taille du fichier
        local file_size=$(du -h "$backup_path" | cut -f1)
        log "Taille de la sauvegarde: $file_size"

        echo "$backup_path"
    else
        error "Échec de la création de la sauvegarde PostgreSQL"
    fi
}

# Chiffrer la sauvegarde (optionnel)
encrypt_backup() {
    local backup_path="$1"

    if [ "$BACKUP_ENCRYPTION" != "true" ] || [ -z "$BACKUP_ENCRYPTION_KEY" ]; then
        log "Chiffrement non configuré, sauvegarde non chiffrée"
        echo "$backup_path"
        return 0
    fi

    log "Chiffrement de la sauvegarde..."

    local encrypted_path="${backup_path}.enc"

    if openssl enc -aes-256-cbc -salt -in "$backup_path" -out "$encrypted_path" -k "$BACKUP_ENCRYPTION_KEY" 2>>"$LOG_FILE"; then
        # Supprimer le fichier non chiffré
        rm "$backup_path"
        log "Sauvegarde chiffrée: $encrypted_path"
        echo "$encrypted_path"
    else
        error "Échec du chiffrement de la sauvegarde"
    fi
}

# Compression supplémentaire (optionnel)
compress_backup() {
    local backup_path="$1"

    if [ "$BACKUP_COMPRESSION" != "true" ]; then
        log "Compression désactivée"
        echo "$backup_path"
        return 0
    fi

    # Vérifier si le fichier n'est pas déjà compressé (.gz)
    if [[ "$backup_path" == *.gz ]]; then
        log "Fichier déjà compressé"
        echo "$backup_path"
        return 0
    fi

    log "Compression de la sauvegarde..."

    local compressed_path="${backup_path}.gz"

    if gzip -9 "$backup_path" 2>>"$LOG_FILE"; then
        log "Sauvegarde compressée: $compressed_path"
        echo "$compressed_path"
    else
        error "Échec de la compression de la sauvegarde"
    fi
}

# Appliquer la politique de rétention
apply_retention_policy() {
    log "Application de la politique de rétention..."

    # Rétention quotidienne (7 jours)
    find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -mtime +$RETENTION_DAILY -delete 2>/dev/null || true

    # Créer des sauvegardes hebdomadaires (tous les dimanches)
    if [ "$(date +%u)" = "7" ]; then
        log "Création de la sauvegarde hebdomadaire..."
        local latest_backup=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -mtime -1 | head -1)
        if [ -n "$latest_backup" ]; then
            local weekly_backup="${BACKUP_DIR}/postgres_weekly_$(date +%Y%m%d).dump"
            cp "$latest_backup" "$weekly_backup"
            log "Sauvegarde hebdomadaire créée: $weekly_backup"
        fi
    fi

    # Nettoyer les sauvegardes hebdomadaires anciennes
    find "$BACKUP_DIR" -name "postgres_weekly_*.dump*" -type f -mtime +$((RETENTION_WEEKLY * 7)) -delete 2>/dev/null || true

    # Créer des sauvegardes mensuelles (le 1er du mois)
    if [ "$(date +%d)" = "01" ]; then
        log "Création de la sauvegarde mensuelle..."
        local latest_backup=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -mtime -1 | head -1)
        if [ -n "$latest_backup" ]; then
            local monthly_backup="${BACKUP_DIR}/postgres_monthly_$(date +%Y%m).dump"
            cp "$latest_backup" "$monthly_backup"
            log "Sauvegarde mensuelle créée: $monthly_backup"
        fi
    fi

    # Nettoyer les sauvegardes mensuelles anciennes
    find "$BACKUP_DIR" -name "postgres_monthly_*.dump*" -type f -mtime +$((RETENTION_MONTHLY * 31)) -delete 2>/dev/null || true

    log "Politique de rétention appliquée"
}

# Fonction principale
main() {
    log "=== Début de la sauvegarde PostgreSQL Recyclic ==="

    # Vérifications
    check_prerequisites

    # Créer la sauvegarde
    local backup_path
    backup_path=$(create_postgres_backup)

    # Chiffrer si configuré
    backup_path=$(encrypt_backup "$backup_path")

    # Compresser si configuré
    backup_path=$(compress_backup "$backup_path")

    # Appliquer la rétention
    apply_retention_policy

    # Résumé final
    local final_size=$(du -h "$backup_path" | cut -f1)
    log "=== Sauvegarde PostgreSQL terminée avec succès ==="
    log "Fichier final: $(basename "$backup_path")"
    log "Taille: $final_size"
    log "Emplacement: $backup_path"
}

# Gestion des erreurs
trap 'error "Script interrompu par une erreur"' ERR

# Exécution
main "$@"
