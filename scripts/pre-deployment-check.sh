#!/bin/bash
# Pre-Deployment Validation Checklist
# Usage: bash scripts/pre-deployment-check.sh [prod|staging]

set -euo pipefail

ENVIRONMENT=${1:-prod}
PROJECT_NAME="recyclic-${ENVIRONMENT}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE=".env.${ENVIRONMENT}"

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo "🔍 Pre-Deployment Validation for $ENVIRONMENT"
echo "=================================================="
echo ""

# Helper functions
pass() {
    echo "   ✅ $1"
    ((CHECKS_PASSED++))
}

fail() {
    echo "   ❌ $1"
    ((CHECKS_FAILED++))
}

warn() {
    echo "   ⚠️  $1"
    ((CHECKS_WARNING++))
}

# Check 1: Compose file exists and is valid
echo "1️⃣ Docker Compose Configuration"
if [ -f "$COMPOSE_FILE" ]; then
    pass "Compose file exists: $COMPOSE_FILE"

    if docker compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
        pass "Compose file syntax is valid"
    else
        fail "Compose file has syntax errors"
        docker compose -f "$COMPOSE_FILE" config 2>&1 | head -10 | sed 's/^/      /'
    fi
else
    fail "Compose file not found: $COMPOSE_FILE"
fi

# Check 2: Environment file
echo ""
echo "2️⃣ Environment Configuration"
if [ -f "$ENV_FILE" ]; then
    pass "Environment file exists: $ENV_FILE"

    # Check for critical variables
    CRITICAL_VARS=("POSTGRES_PASSWORD" "SECRET_KEY" "TELEGRAM_BOT_TOKEN")
    for var in "${CRITICAL_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE" && ! grep -q "^${var}=<" "$ENV_FILE"; then
            pass "$var is set"
        else
            fail "$var is missing or uses template placeholder"
        fi
    done

    # Check for placeholder values
    if grep -q "<.*>" "$ENV_FILE"; then
        warn "Environment file contains placeholder values (<...>)"
        grep "<.*>" "$ENV_FILE" | sed 's/^/      /'
    fi
else
    fail "Environment file not found: $ENV_FILE"
fi

# Check 3: Docker daemon
echo ""
echo "3️⃣ Docker Environment"
if docker info > /dev/null 2>&1; then
    pass "Docker daemon is running"

    # Check Docker Compose version
    COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
    if [[ "$COMPOSE_VERSION" != "unknown" ]]; then
        pass "Docker Compose version: $COMPOSE_VERSION"
    else
        warn "Cannot determine Docker Compose version"
    fi
else
    fail "Docker daemon is not running or not accessible"
fi

# Check 4: Traefik network
echo ""
echo "4️⃣ Traefik Configuration"
if docker network inspect traefik-public > /dev/null 2>&1; then
    pass "Traefik network exists"

    # Check if Traefik is running
    if docker ps --filter "name=traefik" --format "{{.Names}}" | grep -q traefik; then
        pass "Traefik container is running"
    else
        fail "Traefik container is not running"
    fi
else
    fail "Traefik network 'traefik-public' not found"
fi

# Check 5: Disk space
echo ""
echo "5️⃣ System Resources"
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -gt 5 ]; then
    pass "Available disk space: ${AVAILABLE_SPACE}GB"
else
    warn "Low disk space: ${AVAILABLE_SPACE}GB (recommend at least 5GB)"
fi

# Check 6: Existing containers
echo ""
echo "6️⃣ Existing Deployment"
EXISTING_CONTAINERS=$(docker ps -a --filter "name=${PROJECT_NAME}" --format "{{.Names}}" 2>/dev/null || echo "")
if [ -z "$EXISTING_CONTAINERS" ]; then
    pass "No existing containers found (clean deployment)"
else
    warn "Existing containers found (will be replaced):"
    echo "$EXISTING_CONTAINERS" | sed 's/^/      - /'
fi

# Check 7: Volumes
echo ""
echo "7️⃣ Data Volumes"
if [ "$ENVIRONMENT" == "prod" ]; then
    VOLUME_NAME="prod_postgres_data"
elif [ "$ENVIRONMENT" == "staging" ]; then
    VOLUME_NAME="staging_postgres_data"
fi

if docker volume inspect "$VOLUME_NAME" > /dev/null 2>&1; then
    warn "Volume $VOLUME_NAME already exists (data will be preserved)"
else
    pass "Volume $VOLUME_NAME does not exist (new deployment)"
fi

# Check 8: DNS resolution
echo ""
echo "8️⃣ DNS Configuration"
if [ "$ENVIRONMENT" == "prod" ]; then
    DOMAIN="recyclic.jarvos.eu"
elif [ "$ENVIRONMENT" == "staging" ]; then
    DOMAIN="devrecyclic.jarvos.eu"
fi

if command -v host > /dev/null 2>&1; then
    if host "$DOMAIN" > /dev/null 2>&1; then
        IP=$(host "$DOMAIN" | grep "has address" | awk '{print $4}' | head -1)
        pass "DNS resolves: $DOMAIN → $IP"
    else
        fail "DNS does not resolve: $DOMAIN"
    fi
elif command -v nslookup > /dev/null 2>&1; then
    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        pass "DNS resolves: $DOMAIN"
    else
        fail "DNS does not resolve: $DOMAIN"
    fi
else
    warn "No DNS tools available (host/nslookup)"
fi

# Check 9: Backup
echo ""
echo "9️⃣ Backup Status"
LATEST_BACKUP=$(ls -t backups/recyclic_${ENVIRONMENT}_*.sql* 2>/dev/null | head -1 || echo "")
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -f%m "$LATEST_BACKUP" 2>/dev/null || stat -c%Y "$LATEST_BACKUP" 2>/dev/null || echo "0")) / 3600 ))
    if [ "$BACKUP_AGE" -lt 24 ]; then
        pass "Recent backup found: $LATEST_BACKUP (${BACKUP_AGE}h old)"
    else
        warn "Latest backup is ${BACKUP_AGE}h old: $LATEST_BACKUP"
        warn "Consider creating a fresh backup before deployment"
    fi
else
    fail "No backup found for $ENVIRONMENT"
    fail "Run: bash scripts/backup-database.sh $ENVIRONMENT"
fi

# Check 10: Port conflicts
echo ""
echo "🔟 Port Availability"
if [ "$ENVIRONMENT" != "dev" ]; then
    # Production and staging don't expose ports directly (Traefik handles it)
    pass "No port conflicts (using Traefik)"
else
    # Check common dev ports
    for port in 4444 8000 5432 6379; do
        if lsof -Pi :$port -sTCP:LISTEN -t > /dev/null 2>&1; then
            warn "Port $port is already in use"
        else
            pass "Port $port is available"
        fi
    done
fi

# Summary
echo ""
echo "=================================================="
echo "📊 Validation Summary"
echo "=================================================="
echo "   ✅ Passed:   $CHECKS_PASSED"
echo "   ⚠️  Warnings: $CHECKS_WARNING"
echo "   ❌ Failed:   $CHECKS_FAILED"
echo ""

if [ "$CHECKS_FAILED" -gt 0 ]; then
    echo "❌ Deployment validation FAILED"
    echo "   Fix the failed checks before proceeding"
    exit 1
elif [ "$CHECKS_WARNING" -gt 0 ]; then
    echo "⚠️  Deployment validation passed with WARNINGS"
    echo "   Review warnings and proceed with caution"
    exit 0
else
    echo "✅ Deployment validation PASSED"
    echo "   System is ready for deployment"
    exit 0
fi
