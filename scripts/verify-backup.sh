#!/bin/bash

# Script de vérification de l'intégrité des sauvegardes PostgreSQL
# Auteur: James (Dev Agent)
# Date: 2025-01-27
# Description: Vérifie l'intégrité des fichiers de sauvegarde et teste la restauration

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/backup_verification_${TIMESTAMP}.log"

# Variables d'environnement (chargées depuis .env)
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Configuration par défaut
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-recyclic}"
POSTGRES_USER="${POSTGRES_USER:-recyclic}"

# Variables pour les notifications
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
NOTIFICATION_TELEGRAM_TOKEN="${NOTIFICATION_TELEGRAM_TOKEN:-}"
NOTIFICATION_TELEGRAM_CHAT_ID="${NOTIFICATION_TELEGRAM_CHAT_ID:-}"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    send_notification "❌ Échec vérification sauvegarde: $1" true
    exit 1
}

warning() {
    log "WARNING: $1"
    send_notification "⚠️ Avertissement vérification sauvegarde: $1" false
}

success() {
    log "SUCCESS: $1"
}

send_notification() {
    local message="$1"
    local is_error="${2:-false}"

    # Notification par email (si configurée)
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        local subject="[Recyclic Backup Verification] $(if [ "$is_error" = "true" ]; then echo "ÉCHEC"; else echo "INFO"; fi)"
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL" || true
    fi

    # Notification Telegram (si configurée)
    if [ -n "$NOTIFICATION_TELEGRAM_TOKEN" ] && [ -n "$NOTIFICATION_TELEGRAM_CHAT_ID" ]; then
        local emoji="✅"
        if [ "$is_error" = "true" ]; then
            emoji="❌"
        elif [ "$is_error" = "false" ]; then
            emoji="⚠️"
        fi

        curl -s -X POST "https://api.telegram.org/bot${NOTIFICATION_TELEGRAM_TOKEN}/sendMessage" \
            -d "chat_id=${NOTIFICATION_TELEGRAM_CHAT_ID}" \
            -d "text=${emoji} [Recyclic Backup Verification] $message" \
            -d "parse_mode=HTML" >/dev/null 2>&1 || true
    fi
}

# Vérifications préliminaires
check_prerequisites() {
    log "Vérification des prérequis..."

    # Vérifier que pg_restore est disponible
    if ! command -v pg_restore >/dev/null 2>&1; then
        error "pg_restore n'est pas installé ou n'est pas dans le PATH"
    fi

    # Vérifier que les répertoires existent
    mkdir -p "$LOG_DIR"

    if [ ! -d "$BACKUP_DIR" ]; then
        warning "Répertoire de sauvegardes $BACKUP_DIR n'existe pas"
        return 0
    fi

    # Vérifier les variables d'environnement critiques
    if [ -z "${POSTGRES_PASSWORD:-}" ]; then
        error "POSTGRES_PASSWORD n'est pas défini"
    fi

    log "Prérequis validés"
}

# Lister les sauvegardes disponibles
list_backups() {
    log "Listing des sauvegardes disponibles..."

    local backup_files=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -mtime -1 2>/dev/null || true)

    if [ -z "$backup_files" ]; then
        warning "Aucune sauvegarde récente trouvée (dernières 24h)"
        return 1
    fi

    log "Sauvegardes trouvées:"
    echo "$backup_files" | while read -r file; do
        local file_size=$(du -h "$file" | cut -f1)
        local file_date=$(stat -c %y "$file" 2>/dev/null || stat -f %Sm -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || echo "unknown")
        log "  - $(basename "$file") (${file_size}) - ${file_date}"
    done

    echo "$backup_files"
}

# Vérifier l'intégrité d'un fichier de sauvegarde
verify_backup_integrity() {
    local backup_file="$1"
    local filename=$(basename "$backup_file")

    log "Vérification de l'intégrité: $filename"

    # Vérifier que le fichier existe et n'est pas vide
    if [ ! -f "$backup_file" ]; then
        error "Fichier de sauvegarde $backup_file n'existe pas"
        return 1
    fi

    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
    if [ "$file_size" -lt 1000 ]; then
        error "Fichier de sauvegarde $filename est trop petit (${file_size} bytes)"
        return 1
    fi

    # Tester l'intégrité avec pg_restore --list
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --list "$backup_file" >/dev/null 2>&1; then
        success "Intégrité du fichier $filename validée"
        return 0
    else
        error "Fichier de sauvegarde $filename corrompu ou invalide"
        return 1
    fi
}

# Tester la restauration partielle (dry-run)
test_restore_dry_run() {
    local backup_file="$1"
    local filename=$(basename "$backup_file")

    log "Test de restauration (dry-run): $filename"

    # Créer un répertoire temporaire pour le test
    local temp_dir=$(mktemp -d)
    local temp_db="test_restore_$(date +%s)"

    # Créer une base temporaire pour le test
    if PGPASSWORD="$POSTGRES_PASSWORD" createdb \
        --host="$POSTGRES_HOST" \
        --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" \
        "$temp_db" 2>/dev/null; then

        # Tester la restauration
        if PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
            --host="$POSTGRES_HOST" \
            --port="$POSTGRES_PORT" \
            --username="$POSTGRES_USER" \
            --dbname="$temp_db" \
            --no-password \
            --verbose \
            --clean \
            --if-exists \
            "$backup_file" >/dev/null 2>&1; then

            success "Restauration dry-run réussie pour $filename"

            # Supprimer la base de test
            PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
                --host="$POSTGRES_HOST" \
                --port="$POSTGRES_PORT" \
                --username="$POSTGRES_USER" \
                "$temp_db" 2>/dev/null || true

            return 0
        else
            error "Échec du test de restauration pour $filename"
            # Supprimer la base de test même en cas d'erreur
            PGPASSWORD="$POSTGRES_PASSWORD" dropdb \
                --host="$POSTGRES_HOST" \
                --port="$POSTGRES_PORT" \
                --username="$POSTGRES_USER" \
                "$temp_db" 2>/dev/null || true
            return 1
        fi
    else
        warning "Impossible de créer une base de test pour $filename (peut-être en environnement Docker)"
        return 0
    fi

    # Nettoyer
    rm -rf "$temp_dir"
}

# Vérifier les métriques de performance
check_backup_metrics() {
    log "Vérification des métriques de sauvegarde..."

    # Taille totale des sauvegardes
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
    log "Taille totale des sauvegardes: $total_size"

    # Nombre de sauvegardes
    local backup_count=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f 2>/dev/null | wc -l | tr -d ' ')
    log "Nombre total de sauvegardes: $backup_count"

    # Dernière sauvegarde
    local latest_backup=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "$latest_backup" ]; then
        local latest_age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest_backup" 2>/dev/null || date +%s)) / 3600 ))
        log "Dernière sauvegarde: $(basename "$latest_backup") (il y a ${latest_age_hours}h)"
    else
        warning "Aucune sauvegarde trouvée"
    fi

    # Vérifier l'espace disque disponible
    local available_space=$(df -h "$BACKUP_DIR" 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")
    log "Espace disque disponible: $available_space"
}

# Générer un rapport de santé
generate_health_report() {
    log "Génération du rapport de santé..."

    local report_file="$LOG_DIR/backup_health_report_$(date +%Y%m%d).txt"

    {
        echo "=== RAPPORT DE SANTÉ DES SAUVEGARDES ==="
        echo "Date: $(date)"
        echo ""
        echo "MÉTRIQUES:"
        echo "- Taille totale: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "N/A")"
        echo "- Nombre de sauvegardes: $(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f 2>/dev/null | wc -l | tr -d ' ')"
        echo "- Dernière sauvegarde: $(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- | xargs basename 2>/dev/null || echo "Aucune")"
        echo ""
        echo "STATUT: $(if [ $? -eq 0 ]; then echo "✅ SAIN"; else echo "❌ PROBLÈMES DÉTECTÉS"; fi)"
        echo ""
        echo "Voir le log détaillé: $LOG_FILE"
    } > "$report_file"

    log "Rapport généré: $report_file"
}

# Fonction principale
main() {
    log "=== Début de la vérification des sauvegardes PostgreSQL ==="

    # Vérifications préliminaires
    check_prerequisites

    # Lister les sauvegardes
    local backup_files
    backup_files=$(list_backups)

    if [ -z "$backup_files" ]; then
        warning "Aucune sauvegarde à vérifier"
        send_notification "⚠️ Aucune sauvegarde récente trouvée pour vérification" false
        return 0
    fi

    local verification_errors=0
    local total_backups=0

    # Vérifier chaque sauvegarde
    echo "$backup_files" | while read -r backup_file; do
        if [ -n "$backup_file" ]; then
            ((total_backups++))
            log "Vérification de la sauvegarde $total_backups: $(basename "$backup_file")"

            if verify_backup_integrity "$backup_file"; then
                # Tester la restauration (optionnel, peut être lent)
                if [ "${TEST_RESTORE:-false}" = "true" ]; then
                    test_restore_dry_run "$backup_file" || ((verification_errors++))
                fi
            else
                ((verification_errors++))
            fi
        fi
    done

    # Vérifier les métriques
    check_backup_metrics

    # Générer le rapport
    generate_health_report

    # Résumé final
    log "=== Vérification terminée ==="
    log "Total sauvegardes vérifiées: $total_backups"
    log "Erreurs détectées: $verification_errors"

    if [ $verification_errors -eq 0 ]; then
        success "Toutes les sauvegardes sont saines"
        send_notification "✅ Vérification sauvegardes réussie - $total_backups sauvegardes saines" false
    else
        error "$verification_errors erreur(s) détectée(s) dans les sauvegardes"
    fi
}

# Gestion des erreurs
trap 'error "Script interrompu par une erreur"' ERR

# Exécution
main "$@"
