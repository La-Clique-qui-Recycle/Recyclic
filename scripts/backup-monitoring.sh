#!/bin/bash

# Script de monitoring des sauvegardes PostgreSQL
# Auteur: James (Dev Agent)
# Date: 2025-01-27
# Description: Collecte métriques et monitoring des sauvegardes

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups"
METRICS_DIR="$PROJECT_ROOT/metrics"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/backup_monitoring_${TIMESTAMP}.log"
METRICS_FILE="$METRICS_DIR/backup_metrics.json"

# Créer les répertoires
mkdir -p "$METRICS_DIR"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    exit 1
}

# Collecter métriques de base
collect_basic_metrics() {
    log "Collecte des métriques de base..."

    local metrics=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "backup_directory": "$BACKUP_DIR",
  "total_backups": $(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f 2>/dev/null | wc -l | tr -d ' '),
  "total_size_bytes": $(du -sb "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0"),
  "available_space_bytes": $(df "$BACKUP_DIR" 2>/dev/null | tail -1 | awk '{print $4 * 1024}' || echo "0")
}
EOF
)

    echo "$metrics"
}

# Collecter métriques des dernières sauvegardes
collect_backup_metrics() {
    log "Collecte des métriques de sauvegarde..."

    local latest_backup=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- || echo "")

    if [ -z "$latest_backup" ]; then
        local backup_metrics='{"latest_backup": null, "backup_age_hours": null, "backup_size_bytes": null}'
    else
        local backup_age_seconds=$(( $(date +%s) - $(stat -c %Y "$latest_backup" 2>/dev/null || date +%s) ))
        local backup_age_hours=$(( backup_age_seconds / 3600 ))
        local backup_size=$(stat -c %s "$latest_backup" 2>/dev/null || echo "0")

        local backup_metrics=$(cat <<EOF
{
  "latest_backup": "$(basename "$latest_backup")",
  "backup_age_hours": $backup_age_hours,
  "backup_size_bytes": $backup_size,
  "backup_path": "$latest_backup"
}
EOF
)
    fi

    echo "$backup_metrics"
}

# Collecter métriques de rétention
collect_retention_metrics() {
    log "Collecte des métriques de rétention..."

    local daily_count=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -mtime -1 2>/dev/null | wc -l | tr -d ' ')
    local weekly_count=$(find "$BACKUP_DIR" -name "postgres_weekly_*.dump*" -type f -mtime -7 2>/dev/null | wc -l | tr -d ' ')
    local monthly_count=$(find "$BACKUP_DIR" -name "postgres_monthly_*.dump*" -type f -mtime -30 2>/dev/null | wc -l | tr -d ' ')

    local retention_metrics=$(cat <<EOF
{
  "daily_backups_last_24h": $daily_count,
  "weekly_backups_last_7d": $weekly_count,
  "monthly_backups_last_30d": $monthly_count,
  "old_backups_to_clean": $(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -mtime +7 2>/dev/null | wc -l | tr -d ' ')
}
EOF
)

    echo "$retention_metrics"
}

# Vérifier l'état de santé
check_health_status() {
    log "Vérification de l'état de santé..."

    local health_issues=0
    local health_messages=()

    # Vérifier l'existence du répertoire de sauvegarde
    if [ ! -d "$BACKUP_DIR" ]; then
        health_messages+=("Répertoire de sauvegarde manquant: $BACKUP_DIR")
        ((health_issues++))
    fi

    # Vérifier les permissions d'écriture
    if [ -d "$BACKUP_DIR" ] && [ ! -w "$BACKUP_DIR" ]; then
        health_messages+=("Permissions d'écriture manquantes sur $BACKUP_DIR")
        ((health_issues++))
    fi

    # Vérifier l'espace disque (alerte si < 1GB disponible)
    local available_space=$(df "$BACKUP_DIR" 2>/dev/null | tail -1 | awk '{print $4}' || echo "0")
    if [ "$available_space" -lt 1048576 ]; then  # 1GB en KB
        health_messages+=("Espace disque faible: ${available_space}KB disponible")
        ((health_issues++))
    fi

    # Vérifier la fraîcheur des sauvegardes (alerte si > 25h sans sauvegarde)
    local latest_backup_age=$(find "$BACKUP_DIR" -name "postgres_backup_*.dump*" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | xargs -I {} date -d "@{}" +%s 2>/dev/null || echo "0")
    local current_time=$(date +%s)
    local age_hours=$(( (current_time - latest_backup_age) / 3600 ))

    if [ $age_hours -gt 25 ]; then
        health_messages+=("Dernière sauvegarde trop ancienne: ${age_hours}h")
        ((health_issues++))
    fi

    # Construire l'objet health
    local health_messages_json="[]"
    if [ ${#health_messages[@]} -gt 0 ]; then
        health_messages_json="["
        for msg in "${health_messages[@]}"; do
            health_messages_json+="\"$msg\","
        done
        health_messages_json="${health_messages_json%,}]"
    fi

    local health_status=$(cat <<EOF
{
  "health_status": "$(if [ $health_issues -eq 0 ]; then echo "healthy"; else echo "unhealthy"; fi)",
  "health_issues_count": $health_issues,
  "health_messages": $health_messages_json,
  "last_check": "$(date -Iseconds)"
}
EOF
)

    echo "$health_status"
}

# Générer le rapport métriques complet
generate_metrics_report() {
    local basic_metrics="$1"
    local backup_metrics="$2"
    local retention_metrics="$3"
    local health_status="$4"

    log "Génération du rapport métriques..."

    local full_report=$(cat <<EOF
{
  "metadata": {
    "generated_at": "$(date -Iseconds)",
    "generator": "backup-monitoring.sh",
    "version": "1.0"
  },
  "basic": $basic_metrics,
  "backup": $backup_metrics,
  "retention": $retention_metrics,
  "health": $health_status
}
EOF
)

    echo "$full_report" > "$METRICS_FILE"
    log "Rapport métriques sauvegardé: $METRICS_FILE"

    # Formater pour affichage
    echo "$full_report" | jq . 2>/dev/null || echo "$full_report"
}

# Envoyer métriques vers monitoring externe (optionnel)
send_to_monitoring() {
    local metrics_file="$1"

    # Exemple: envoi vers un endpoint de monitoring
    if [ -n "${MONITORING_ENDPOINT:-}" ]; then
        log "Envoi des métriques vers $MONITORING_ENDPOINT"
        curl -s -X POST "$MONITORING_ENDPOINT" \
            -H "Content-Type: application/json" \
            -d @"$metrics_file" || log "Échec de l'envoi des métriques"
    fi

    # Exemple: métriques Prometheus (format texte)
    if [ -n "${PROMETHEUS_METRICS_FILE:-}" ]; then
        log "Génération des métriques Prometheus..."

        local prom_file="${PROMETHEUS_METRICS_FILE}"
        mkdir -p "$(dirname "$prom_file")"

        cat > "$prom_file" << EOF
# HELP backup_total_backups Total number of backup files
# TYPE backup_total_backups gauge
backup_total_backups $(jq '.basic.total_backups' "$metrics_file" 2>/dev/null || echo "0")

# HELP backup_total_size_bytes Total size of all backups in bytes
# TYPE backup_total_size_bytes gauge
backup_total_size_bytes $(jq '.basic.total_size_bytes' "$metrics_file" 2>/dev/null || echo "0")

# HELP backup_available_space_bytes Available space in backup directory
# TYPE backup_available_space_bytes gauge
backup_available_space_bytes $(jq '.basic.available_space_bytes' "$metrics_file" 2>/dev/null || echo "0")

# HELP backup_age_hours Age of latest backup in hours
# TYPE backup_age_hours gauge
backup_age_hours $(jq '.backup.backup_age_hours // 999' "$metrics_file" 2>/dev/null || echo "999")

# HELP backup_health_status Health status (0=healthy, 1=unhealthy)
# TYPE backup_health_status gauge
backup_health_status $(jq 'if .health.health_status == "healthy" then 0 else 1 end' "$metrics_file" 2>/dev/null || echo "1")
EOF

        log "Métriques Prometheus générées: $prom_file"
    fi
}

# Fonction principale
main() {
    log "=== Début du monitoring des sauvegardes ==="

    # Collecter toutes les métriques
    local basic_metrics=$(collect_basic_metrics)
    local backup_metrics=$(collect_backup_metrics)
    local retention_metrics=$(collect_retention_metrics)
    local health_status=$(check_health_status)

    # Générer le rapport
    generate_metrics_report "$basic_metrics" "$backup_metrics" "$retention_metrics" "$health_status"

    # Envoyer vers monitoring externe
    send_to_monitoring "$METRICS_FILE"

    log "=== Monitoring terminé ==="
}

# Gestion des erreurs
trap 'error "Script interrompu par une erreur"' ERR

# Exécution
main "$@"
