#!/bin/bash

# Script de Rollback pour Recyclic
# Usage: bash scripts/rollback.sh [version_tag]
# Si aucun tag n'est fourni, le script utilise la version précédente automatiquement

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Fonction de métriques
log_metrics() {
    local event="$1"
    local version="$2"
    local duration="$3"
    local status="$4"
    
    # Créer le répertoire de logs s'il n'existe pas
    mkdir -p logs
    
    # Enregistrer les métriques dans un fichier JSON
    cat >> logs/rollback-metrics.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "event": "$event",
  "version": "$version",
  "duration_seconds": "$duration",
  "status": "$status",
  "hostname": "$(hostname)",
  "user": "$(whoami)"
}
EOF
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet (où se trouve docker-compose.yml)"
    exit 1
fi

# Fonction pour obtenir la version actuellement déployée
get_current_version() {
    local current_tag=$(docker ps --format "table {{.Image}}" | grep recyclic-api | cut -d: -f2 | head -1)
    if [ -z "$current_tag" ]; then
        log_error "Impossible de déterminer la version actuellement déployée"
        exit 1
    fi
    echo "$current_tag"
}

# Fonction pour obtenir la version précédente
get_previous_version() {
    local current_version="$1"
    
    # Obtenir la liste des commits récents
    local commits=$(git log --oneline -10 --format="%h" 2>/dev/null || echo "")
    
    if [ -z "$commits" ]; then
        log_error "Impossible d'accéder à l'historique Git"
        exit 1
    fi
    
    # Vérifier que la version actuelle est valide
    if ! git rev-parse --verify "$current_version" >/dev/null 2>&1; then
        log_warning "Version actuelle $current_version non trouvée dans Git, utilisation de l'historique local"
    fi
    
    # Trouver le commit précédent (pas le commit actuel)
    local previous_commit=""
    for commit in $commits; do
        if [ "$commit" != "$current_version" ]; then
            previous_commit="$commit"
            break
        fi
    done
    
    if [ -z "$previous_commit" ]; then
        log_error "Aucune version précédente trouvée"
        exit 1
    fi
    
    echo "$previous_commit"
}

# Fonction pour vérifier qu'une version existe
check_version_exists() {
    local version="$1"
    local api_exists=$(docker images recyclic-api:$version --format "{{.Repository}}" 2>/dev/null || echo "")
    local bot_exists=$(docker images recyclic-bot:$version --format "{{.Repository}}" 2>/dev/null || echo "")
    local frontend_exists=$(docker images recyclic-frontend:$version --format "{{.Repository}}" 2>/dev/null || echo "")
    
    if [ -n "$api_exists" ] && [ -n "$bot_exists" ] && [ -n "$frontend_exists" ]; then
        return 0
    else
        return 1
    fi
}

# Fonction principale de rollback
rollback_to_version() {
    local target_version="$1"
    local start_time=$(date +%s)
    
    log "Démarrage du rollback vers la version $target_version"
    
    # Vérifier que la version cible existe
    if ! check_version_exists "$target_version"; then
        log_error "La version $target_version n'existe pas ou est incomplète"
        log "Images disponibles:"
        docker images | grep recyclic
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_metrics "rollback_failed" "$target_version" "$duration" "error"
        exit 1
    fi
    
    # Créer le fichier d'environnement pour le rollback
    log "Création du fichier d'environnement pour le rollback..."
    cat > .env.rollback << EOF
API_IMAGE_TAG=$target_version
BOT_IMAGE_TAG=$target_version
FRONTEND_IMAGE_TAG=$target_version
EOF
    
    # Arrêter les services actuels
    log "Arrêt des services actuels..."
    docker-compose --env-file .env.rollback down || true
    
    # Démarrer avec la version précédente
    log "Démarrage des services avec la version $target_version..."
    docker-compose --env-file .env.rollback up -d
    
    # Vérifier que les services sont bien démarrés
    sleep 5
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if docker-compose --env-file .env.rollback ps | grep -q "Up"; then
        log_success "Rollback réussi vers la version $target_version"
        log "Services en cours d'exécution:"
        docker-compose --env-file .env.rollback ps
        log_metrics "rollback_success" "$target_version" "$duration" "success"
    else
        log_error "Échec du rollback - les services ne sont pas démarrés correctement"
        log_metrics "rollback_failed" "$target_version" "$duration" "error"
        exit 1
    fi
    
    # Nettoyer le fichier temporaire
    rm -f .env.rollback
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [version_tag]"
    echo ""
    echo "Options:"
    echo "  version_tag    Version spécifique vers laquelle effectuer le rollback"
    echo "                 Si omis, utilise automatiquement la version précédente"
    echo ""
    echo "Exemples:"
    echo "  $0                    # Rollback vers la version précédente"
    echo "  $0 abc1234           # Rollback vers la version abc1234"
    echo ""
    echo "Versions disponibles:"
    docker images | grep recyclic | head -10
}

# Main
main() {
    log "=== Script de Rollback Recyclic ==="
    
    # Vérifier les arguments
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    # Si une version est spécifiée, l'utiliser
    if [ -n "$1" ]; then
        local target_version="$1"
        log "Version cible spécifiée: $target_version"
    else
        # Sinon, déterminer automatiquement la version précédente
        log "Détermination automatique de la version précédente..."
        local current_version=$(get_current_version)
        log "Version actuelle: $current_version"
        
        local target_version=$(get_previous_version "$current_version")
        log "Version précédente trouvée: $target_version"
    fi
    
    # Demander confirmation
    log_warning "ATTENTION: Cette opération va arrêter les services actuels et revenir à la version $target_version"
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Rollback annulé"
        exit 0
    fi
    
    # Effectuer le rollback
    rollback_to_version "$target_version"
    
    log_success "Rollback terminé avec succès!"
}

# Exécuter le script principal
main "$@"
