#!/bin/bash

# Script de configuration du cron job pour la sauvegarde PostgreSQL
# Auteur: James (Dev Agent)
# Date: 2025-01-27

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-postgres.sh"
CRON_JOB_FILE="/tmp/recyclic_postgres_backup_cron"

# Configuration du cron job
BACKUP_TIME="${BACKUP_TIME:-2}"  # 2h du matin par défaut
BACKUP_MINUTE="${BACKUP_MINUTE:-0}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    log "ERROR: $1"
    exit 1
}

# Vérifier que le script de sauvegarde existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    error "Le script de sauvegarde $BACKUP_SCRIPT n'existe pas"
fi

# Rendre le script exécutable
if [ ! -x "$BACKUP_SCRIPT" ]; then
    log "Rendre le script de sauvegarde exécutable..."
    chmod +x "$BACKUP_SCRIPT" || {
        log "WARNING: Impossible de rendre le script exécutable (environnement Windows?)"
    }
fi

# Créer le cron job avec les variables d'environnement
cat > "$CRON_JOB_FILE" << EOF
# Sauvegarde PostgreSQL automatisée Recyclic - Exécution quotidienne à ${BACKUP_TIME}h${BACKUP_MINUTE}
# Créé le $(date) par James (Dev Agent)
${BACKUP_MINUTE} ${BACKUP_TIME} * * * cd $PROJECT_ROOT && $BACKUP_SCRIPT >> $PROJECT_ROOT/logs/backup_postgres_cron.log 2>&1
EOF

log "Cron job créé:"
cat "$CRON_JOB_FILE"

# Installer le cron job
log "Installation du cron job..."
if crontab -l 2>/dev/null | grep -q "recyclic_postgres_backup"; then
    log "Un cron job PostgreSQL existe déjà. Suppression de l'ancien..."
    crontab -l 2>/dev/null | grep -v "recyclic_postgres_backup" | crontab -
fi

# Ajouter le nouveau cron job
(crontab -l 2>/dev/null; cat "$CRON_JOB_FILE") | crontab -

# Vérifier l'installation
log "Vérification de l'installation du cron job..."
if crontab -l | grep -q "recyclic_postgres_backup"; then
    log "✅ Cron job PostgreSQL installé avec succès"
    log "La sauvegarde s'exécutera tous les jours à ${BACKUP_TIME}h${BACKUP_MINUTE}"
else
    error "Échec de l'installation du cron job PostgreSQL"
fi

# Nettoyer le fichier temporaire
rm -f "$CRON_JOB_FILE"

log "Configuration terminée. Vérifiez les logs dans $PROJECT_ROOT/logs/backup_postgres_cron.log"
