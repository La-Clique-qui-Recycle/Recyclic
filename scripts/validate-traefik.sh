#!/bin/bash
# Traefik Configuration Validation Script
# Usage: bash scripts/validate-traefik.sh [prod|staging]

set -euo pipefail

ENVIRONMENT=${1:-prod}
PROJECT_NAME="recyclic-${ENVIRONMENT}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

if [ "$ENVIRONMENT" == "prod" ]; then
    EXPECTED_HOST="recyclic.jarvos.eu"
elif [ "$ENVIRONMENT" == "staging" ]; then
    EXPECTED_HOST="devrecyclic.jarvos.eu"
else
    echo "❌ Invalid environment: $ENVIRONMENT (use 'prod' or 'staging')"
    exit 1
fi

echo "🔍 Validating Traefik configuration for $ENVIRONMENT environment..."
echo "=================================================="

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Check if containers are running
echo ""
echo "1️⃣ Checking running containers..."
RUNNING_CONTAINERS=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps --services --filter "status=running" 2>/dev/null || echo "")

if [ -z "$RUNNING_CONTAINERS" ]; then
    echo "❌ No containers running for $PROJECT_NAME"
    echo "   Run: docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d"
    exit 1
fi

echo "✅ Found running containers:"
echo "$RUNNING_CONTAINERS" | sed 's/^/   - /'

# Check Traefik network
echo ""
echo "2️⃣ Checking Traefik network..."
if ! docker network inspect traefik-public > /dev/null 2>&1; then
    echo "❌ Traefik network 'traefik-public' not found"
    echo "   Run: docker network create traefik-public"
    exit 1
fi
echo "✅ Traefik network exists"

# Check if containers are connected to traefik-public
echo ""
echo "3️⃣ Checking network connections..."
NETWORK_CONTAINERS=$(docker network inspect traefik-public -f '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")

if [[ ! "$NETWORK_CONTAINERS" =~ "$PROJECT_NAME" ]]; then
    echo "⚠️  Warning: No $PROJECT_NAME containers found on traefik-public network"
else
    echo "✅ Containers connected to traefik-public:"
    echo "$NETWORK_CONTAINERS" | tr ' ' '\n' | grep "$PROJECT_NAME" | sed 's/^/   - /'
fi

# Check Traefik labels
echo ""
echo "4️⃣ Checking Traefik labels..."

check_service_labels() {
    local service=$1
    local container_name="${PROJECT_NAME}-${service}-1"

    echo ""
    echo "   Checking $service..."

    # Get container ID
    CONTAINER_ID=$(docker ps -qf "name=${container_name}" 2>/dev/null || echo "")

    if [ -z "$CONTAINER_ID" ]; then
        echo "   ⚠️  Container not found: $container_name"
        return
    fi

    # Check traefik.enable
    TRAEFIK_ENABLED=$(docker inspect "$CONTAINER_ID" -f '{{index .Config.Labels "traefik.enable"}}' 2>/dev/null || echo "")
    if [ "$TRAEFIK_ENABLED" != "true" ]; then
        echo "   ❌ traefik.enable is not set to 'true'"
        return
    fi

    # Check router rule for expected host
    ROUTER_RULE=$(docker inspect "$CONTAINER_ID" -f '{{range $key, $value := .Config.Labels}}{{if contains $key "traefik.http.routers"}}{{if contains $key ".rule"}}{{$value}}{{end}}{{end}}{{end}}' 2>/dev/null || echo "")

    if [[ ! "$ROUTER_RULE" =~ "$EXPECTED_HOST" ]]; then
        echo "   ❌ Router rule does not contain expected host: $EXPECTED_HOST"
        echo "      Found: $ROUTER_RULE"
        return
    fi

    echo "   ✅ Traefik labels valid for $service"
    echo "      Host: $EXPECTED_HOST"
}

# Check API labels
check_service_labels "api"

# Check Frontend labels
check_service_labels "frontend"

# Check healthchecks
echo ""
echo "5️⃣ Checking service healthchecks..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
    jq -r '.[] | "\(.Service): \(.Health)"' | while read -r line; do
    SERVICE=$(echo "$line" | cut -d: -f1)
    HEALTH=$(echo "$line" | cut -d: -f2 | xargs)

    if [ "$HEALTH" == "healthy" ]; then
        echo "   ✅ $SERVICE: healthy"
    elif [ "$HEALTH" == "null" ] || [ -z "$HEALTH" ]; then
        echo "   ⚠️  $SERVICE: no healthcheck defined"
    else
        echo "   ❌ $SERVICE: $HEALTH"
    fi
done

# Test actual connectivity (if curl is available)
echo ""
echo "6️⃣ Testing endpoints..."

test_endpoint() {
    local url=$1
    local description=$2

    if command -v curl > /dev/null 2>&1; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

        if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
            echo "   ✅ $description - HTTP $HTTP_CODE"
        elif [ "$HTTP_CODE" == "000" ]; then
            echo "   ⚠️  $description - Connection failed (network issue or service not exposed)"
        else
            echo "   ❌ $description - HTTP $HTTP_CODE"
        fi
    else
        echo "   ⚠️  curl not available, skipping endpoint tests"
    fi
}

test_endpoint "https://${EXPECTED_HOST}/api/health" "API Health"
test_endpoint "https://${EXPECTED_HOST}/" "Frontend"

echo ""
echo "=================================================="
echo "✅ Traefik validation complete for $ENVIRONMENT"
echo ""
echo "Next steps:"
echo "  - Verify DNS points to this server"
echo "  - Check Traefik dashboard for router/service status"
echo "  - Test from external network with proper Host header"
