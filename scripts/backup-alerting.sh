#!/bin/bash

# Script d'alerting pour le système de sauvegarde
# Auteur: James (Dev Agent)
# Date: 2025-01-27
# Description: Système d'alertes basé sur les métriques de sauvegarde

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
METRICS_DIR="$PROJECT_ROOT/metrics"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/backup_alerting_${TIMESTAMP}.log"

# Variables d'environnement (chargées depuis .env)
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Configuration d'alerting
ALERT_BACKUP_AGE_CRITICAL="${ALERT_BACKUP_AGE_CRITICAL:-25}"  # heures
ALERT_BACKUP_AGE_WARNING="${ALERT_BACKUP_AGE_WARNING:-6}"    # heures
ALERT_DISK_SPACE_CRITICAL="${ALERT_DISK_SPACE_CRITICAL:-1048576}"  # KB (1GB)
ALERT_DISK_SPACE_WARNING="${ALERT_DISK_SPACE_WARNING:-5242880}"    # KB (5GB)

# Variables de notification (héritées de backup.sh)
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
NOTIFICATION_TELEGRAM_TOKEN="${NOTIFICATION_TELEGRAM_TOKEN:-}"
NOTIFICATION_TELEGRAM_CHAT_ID="${NOTIFICATION_TELEGRAM_CHAT_ID:-}"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_notification() {
    local message="$1"
    local priority="${2:-normal}"  # normal, warning, critical

    log "Envoi notification ($priority): $message"

    # Déterminer l'émoji selon la priorité
    local emoji="ℹ️"
    case "$priority" in
        "warning") emoji="⚠️" ;;
        "critical") emoji="🚨" ;;
        "success") emoji="✅" ;;
    esac

    # Notification par email
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        local subject="[Recyclic Backup $priority] $(date '+%Y-%m-%d %H:%M')"
        echo "$message" | mail -s "$subject" "$NOTIFICATION_EMAIL" || log "Échec envoi email"
    fi

    # Notification Telegram
    if [ -n "$NOTIFICATION_TELEGRAM_TOKEN" ] && [ -n "$NOTIFICATION_TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${NOTIFICATION_TELEGRAM_TOKEN}/sendMessage" \
            -d "chat_id=${NOTIFICATION_TELEGRAM_CHAT_ID}" \
            -d "text=${emoji} [Recyclic Backup] $message" \
            -d "parse_mode=HTML" >/dev/null 2>&1 || log "Échec envoi Telegram"
    fi

    # Log dans syslog si disponible
    if command -v logger >/dev/null 2>&1; then
        logger -t "recyclic-backup" -p "user.$priority" "$message" || true
    fi
}

# Charger les métriques
load_metrics() {
    local metrics_file="$METRICS_DIR/backup_metrics.json"

    if [ ! -f "$metrics_file" ]; then
        log "Fichier métriques non trouvé: $metrics_file"
        return 1
    fi

    cat "$metrics_file"
}

# Vérifier l'âge des sauvegardes
check_backup_age() {
    log "Vérification de l'âge des sauvegardes..."

    local metrics="$1"
    local backup_age=$(echo "$metrics" | jq '.backup.backup_age_hours // 999' 2>/dev/null || echo "999")

    if [ "$backup_age" = "null" ] || [ "$backup_age" = "999" ]; then
        send_notification "❌ Aucune sauvegarde trouvée ! Vérification immédiate requise." "critical"
        return 1
    fi

    if [ "$backup_age" -gt "$ALERT_BACKUP_AGE_CRITICAL" ]; then
        send_notification "🚨 Sauvegarde CRITIQUE: Dernière sauvegarde il y a ${backup_age}h (seuil: ${ALERT_BACKUP_AGE_CRITICAL}h)" "critical"
    elif [ "$backup_age" -gt "$ALERT_BACKUP_AGE_WARNING" ]; then
        send_notification "⚠️ Sauvegarde WARNING: Dernière sauvegarde il y a ${backup_age}h (seuil: ${ALERT_BACKUP_AGE_WARNING}h)" "warning"
    else
        log "Âge des sauvegardes OK: ${backup_age}h"
    fi
}

# Vérifier l'espace disque
check_disk_space() {
    log "Vérification de l'espace disque..."

    local metrics="$1"
    local available_space=$(echo "$metrics" | jq '.basic.available_space_bytes // 0' 2>/dev/null || echo "0")
    local available_kb=$(( available_space / 1024 ))

    if [ "$available_kb" -lt "$ALERT_DISK_SPACE_CRITICAL" ]; then
        local available_gb=$(( available_kb / 1048576 ))
        send_notification "🚨 Disque CRITIQUE: ${available_gb}GB disponible pour les sauvegardes (seuil: ${ALERT_DISK_SPACE_CRITICAL}KB)" "critical"
    elif [ "$available_kb" -lt "$ALERT_DISK_SPACE_WARNING" ]; then
        local available_gb=$(( available_kb / 1048576 ))
        send_notification "⚠️ Disque WARNING: ${available_gb}GB disponible pour les sauvegardes (seuil: ${ALERT_DISK_SPACE_WARNING}KB)" "warning"
    else
        log "Espace disque OK: ${available_kb}KB disponible"
    fi
}

# Vérifier la santé générale
check_health_status() {
    log "Vérification de l'état de santé..."

    local metrics="$1"
    local health_status=$(echo "$metrics" | jq -r '.health.health_status // "unknown"' 2>/dev/null || echo "unknown")

    case "$health_status" in
        "healthy")
            log "État de santé: OK"
            ;;
        "unhealthy")
            local issues_count=$(echo "$metrics" | jq '.health.health_issues_count // 0' 2>/dev/null || echo "0")
            local issues=$(echo "$metrics" | jq -r '.health.health_messages // [] | join("; ")' 2>/dev/null || echo "Issues détectées")

            send_notification "🚨 Santé sauvegardes CRITIQUE: $issues_count problème(s) - $issues" "critical"
            ;;
        *)
            send_notification "⚠️ Impossible de déterminer l'état de santé des sauvegardes" "warning"
            ;;
    esac
}

# Vérifier les métriques de rétention
check_retention_metrics() {
    log "Vérification des métriques de rétention..."

    local metrics="$1"
    local old_backups=$(echo "$metrics" | jq '.retention.old_backups_to_clean // 0' 2>/dev/null || echo "0")

    if [ "$old_backups" -gt 10 ]; then
        send_notification "⚠️ Nettoyage requis: $old_backups anciennes sauvegardes à supprimer" "warning"
    elif [ "$old_backups" -gt 20 ]; then
        send_notification "🚨 Nettoyage CRITIQUE: $old_backups anciennes sauvegardes accumulées" "critical"
    else
        log "Rétention OK: $old_backups sauvegardes à nettoyer"
    fi
}

# Générer un rapport d'alertes
generate_alert_report() {
    local metrics="$1"

    log "Génération du rapport d'alertes..."

    local report_file="$LOG_DIR/backup_alert_report_$(date +%Y%m%d).txt"

    {
        echo "=== RAPPORT D'ALERTES SAUVEGARDES ==="
        echo "Date: $(date)"
        echo ""

        echo "MÉTRIQUES CLÉS:"
        echo "- Dernière sauvegarde: $(echo "$metrics" | jq -r '.backup.latest_backup // "Aucune"' 2>/dev/null)"
        echo "- Âge: $(echo "$metrics" | jq '.backup.backup_age_hours // "N/A"' 2>/dev/null)h"
        echo "- Espace disponible: $(echo "$metrics" | jq '(.basic.available_space_bytes // 0) / 1024 / 1024' 2>/dev/null | xargs printf "%.1f")GB"
        echo "- État santé: $(echo "$metrics" | jq -r '.health.health_status // "Unknown"' 2>/dev/null)"
        echo ""

        echo "SEUILS CONFIGURÉS:"
        echo "- Âge critique: ${ALERT_BACKUP_AGE_CRITICAL}h"
        echo "- Âge warning: ${ALERT_BACKUP_AGE_WARNING}h"
        echo "- Disque critique: ${ALERT_DISK_SPACE_CRITICAL}KB"
        echo "- Disque warning: ${ALERT_DISK_SPACE_WARNING}KB"
        echo ""

        echo "DERNIÈRES VÉRIFICATIONS:"
        echo "- Métriques: $METRICS_DIR/backup_metrics.json"
        echo "- Logs: $LOG_FILE"
    } > "$report_file"

    log "Rapport généré: $report_file"
}

# Test des notifications (optionnel)
test_notifications() {
    log "Test des notifications..."

    send_notification "🧪 Test notification: Système d'alertes fonctionnel" "normal"
    sleep 1
    send_notification "✅ Test réussi: Alertes configurées correctement" "success"
}

# Fonction principale
main() {
    log "=== Début du système d'alerting sauvegardes ==="

    # Traiter les arguments
    case "${1:-}" in
        "test")
            test_notifications
            exit 0
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [test]"
            echo "  test: Tester le système de notifications"
            echo "  (sans argument): Exécuter les vérifications d'alertes"
            exit 0
            ;;
    esac

    # Charger les métriques
    local metrics
    if ! metrics=$(load_metrics); then
        send_notification "❌ Impossible de charger les métriques pour les alertes" "critical"
        exit 1
    fi

    # Exécuter toutes les vérifications
    check_backup_age "$metrics"
    check_disk_space "$metrics"
    check_health_status "$metrics"
    check_retention_metrics "$metrics"

    # Générer le rapport
    generate_alert_report "$metrics"

    log "=== Système d'alerting terminé ==="
}

# Gestion des erreurs
trap 'error "Script interrompu par une erreur"' ERR

# Exécution
main "$@"
