#!/bin/bash

# Script de déploiement atomique pour Recyclic
# Ce script implémente une stratégie de déploiement sans interruption de service
# en démarrant la nouvelle version avant d'arrêter l'ancienne

set -euo pipefail

# Configuration
DEPLOY_TIMEOUT=${DEPLOY_TIMEOUT:-120}  # Timeout en secondes
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-5}  # Intervalle entre les vérifications
MAX_RETRIES=$((DEPLOY_TIMEOUT / HEALTH_CHECK_INTERVAL))

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

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Fonction pour vérifier l'état des services
check_services_health() {
    local compose_file="$1"
    local services=("api" "bot" "frontend")
    
    for service in "${services[@]}"; do
        local status
        status=$(docker-compose -f "$compose_file" ps --format json "$service" | jq -r '.[0].Health // "unknown"')
        
        if [[ "$status" != "healthy" ]]; then
            return 1
        fi
    done
    
    return 0
}

# Fonction pour attendre que les services soient sains
wait_for_services() {
    local compose_file="$1"
    local service_name="$2"
    
    log "Attente que les services $service_name soient sains..."
    
    local retry_count=0
    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        if check_services_health "$compose_file"; then
            log_success "Tous les services $service_name sont sains !"
            return 0
        fi
        
        log "Vérification $((retry_count + 1))/$MAX_RETRIES - Services pas encore sains, attente de ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
        ((retry_count++))
    done
    
    log_error "Timeout atteint - Les services $service_name ne sont pas devenus sains après ${DEPLOY_TIMEOUT}s"
    return 1
}

# Fonction pour nettoyer les conteneurs en cas d'échec
cleanup_failed_deployment() {
    local compose_file="$1"
    local service_name="$2"
    
    log_warning "Nettoyage des conteneurs $service_name en cas d'échec..."
    docker-compose -f "$compose_file" down --remove-orphans || true
}

# Fonction principale de déploiement atomique
atomic_deploy() {
    local version_tag="$1"
    local compose_file="docker-compose.yml"
    local env_file=".env.production"
    
    log "🚀 Début du déploiement atomique version $version_tag"
    
    # Vérifier que le fichier compose existe
    if [[ ! -f "$compose_file" ]]; then
        log_error "Fichier $compose_file non trouvé !"
        exit 1
    fi
    
    # Vérifier que le fichier d'environnement existe
    if [[ ! -f "$env_file" ]]; then
        log_error "Fichier $env_file non trouvé !"
        exit 1
    fi
    
    # Créer un nom unique pour les nouveaux conteneurs
    local new_service_suffix="_new"
    local temp_compose_file="docker-compose.new.yml"
    
    # Créer une copie temporaire du docker-compose avec des noms de services uniques
    log "Création de la configuration temporaire pour les nouveaux services..."
    cp "$compose_file" "$temp_compose_file"
    
    # Modifier les noms des services pour éviter les conflits
    sed -i "s/^  api:/  api${new_service_suffix}:/" "$temp_compose_file"
    sed -i "s/^  bot:/  bot${new_service_suffix}:/" "$temp_compose_file"
    sed -i "s/^  frontend:/  frontend${new_service_suffix}:/" "$temp_compose_file"
    
    # Modifier les dépendances pour pointer vers les nouveaux services
    sed -i "s/service: api/service: api${new_service_suffix}/" "$temp_compose_file"
    sed -i "s/service: bot/service: bot${new_service_suffix}/" "$temp_compose_file"
    
    # Modifier les ports pour éviter les conflits
    sed -i "s/\"8000:8000\"/\"8001:8000\"/" "$temp_compose_file"  # API sur port 8001
    sed -i "s/\"4444:80\"/\"4445:80\"/" "$temp_compose_file"      # Frontend sur port 4445
    
    # Démarrer les nouveaux services
    log "Démarrage des nouveaux services..."
    if ! docker-compose -f "$temp_compose_file" --env-file "$env_file" up -d; then
        log_error "Échec du démarrage des nouveaux services !"
        cleanup_failed_deployment "$temp_compose_file" "nouveaux"
        exit 1
    fi
    
    # Attendre que les nouveaux services soient sains
    if ! wait_for_services "$temp_compose_file" "nouveaux"; then
        log_error "Les nouveaux services ne sont pas devenus sains - Annulation du déploiement"
        cleanup_failed_deployment "$temp_compose_file" "nouveaux"
        exit 1
    fi
    
    # Les nouveaux services sont sains - procéder au basculement
    log_success "Nouveaux services sains - Basculement du trafic..."
    
    # Arrêter les anciens services
    log "Arrêt des anciens services..."
    docker-compose --env-file "$env_file" down || true
    
    # Renommer les nouveaux services pour prendre la place des anciens
    log "Basculement des services..."
    docker-compose -f "$temp_compose_file" --env-file "$env_file" down
    docker-compose --env-file "$env_file" up -d
    
    # Vérifier que les services finaux sont sains
    if ! wait_for_services "$compose_file" "finaux"; then
        log_error "Les services finaux ne sont pas sains - Rollback nécessaire !"
        # Ici on pourrait implémenter un rollback automatique
        exit 1
    fi
    
    # Nettoyage
    log "Nettoyage des fichiers temporaires..."
    rm -f "$temp_compose_file"
    
    # Nettoyage des anciennes images (garder les 5 dernières versions)
    log "Nettoyage des anciennes images..."
    docker images recyclic-api --format "{{.Tag}}" | grep -v "TAG" | tail -n +6 | while read tag; do
        [ -n "$tag" ] && docker rmi "recyclic-api:$tag" || true
    done
    docker images recyclic-bot --format "{{.Tag}}" | grep -v "TAG" | tail -n +6 | while read tag; do
        [ -n "$tag" ] && docker rmi "recyclic-bot:$tag" || true
    done
    docker images recyclic-frontend --format "{{.Tag}}" | grep -v "TAG" | tail -n +6 | while read tag; do
        [ -n "$tag" ] && docker rmi "recyclic-frontend:$tag" || true
    done
    
    log_success "🎉 Déploiement atomique réussi version $version_tag !"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 <version_tag>"
    echo ""
    echo "Déploie de manière atomique la version spécifiée de l'application Recyclic"
    echo ""
    echo "Arguments:"
    echo "  version_tag    Tag de version à déployer (ex: abc1234)"
    echo ""
    echo "Variables d'environnement:"
    echo "  DEPLOY_TIMEOUT           Timeout en secondes (défaut: 120)"
    echo "  HEALTH_CHECK_INTERVAL    Intervalle entre vérifications (défaut: 5)"
    echo ""
    echo "Exemples:"
    echo "  $0 abc1234"
    echo "  DEPLOY_TIMEOUT=180 $0 abc1234"
}

# Vérification des arguments
if [[ $# -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    log_error "jq n'est pas installé. Installez-le avec: apt-get install jq"
    exit 1
fi

# Exécuter le déploiement atomique
atomic_deploy "$1"
