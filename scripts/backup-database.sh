#!/bin/bash
# Database Backup Script
# Usage: bash scripts/backup-database.sh [prod|staging]

set -euo pipefail

ENVIRONMENT=${1:-prod}
PROJECT_NAME="recyclic-${ENVIRONMENT}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/recyclic_${ENVIRONMENT}_${TIMESTAMP}.sql"

echo "🔄 Starting database backup for $ENVIRONMENT environment..."
echo "=================================================="

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if postgres container is running
echo ""
echo "1️⃣ Checking PostgreSQL container..."
POSTGRES_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null || echo "")

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not running for $PROJECT_NAME"
    echo "   Run: docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL container is running"

# Check postgres health
echo ""
echo "2️⃣ Checking PostgreSQL health..."
HEALTH_STATUS=$(docker inspect "$POSTGRES_CONTAINER" -f '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")

if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "⚠️  Warning: PostgreSQL health status is '$HEALTH_STATUS'"
    echo "   Continuing anyway, but backup may be incomplete..."
else
    echo "✅ PostgreSQL is healthy"
fi

# Perform backup
echo ""
echo "3️⃣ Creating backup..."
echo "   Database: recyclic"
echo "   Target: $BACKUP_FILE"

if docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U recyclic -d recyclic > "$BACKUP_FILE" 2>/dev/null; then
    echo "✅ Backup created successfully"
else
    echo "❌ Backup failed"
    exit 1
fi

# Verify backup
echo ""
echo "4️⃣ Verifying backup..."
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
BACKUP_LINES=$(wc -l < "$BACKUP_FILE" 2>/dev/null || echo "0")

if [ "$BACKUP_SIZE" -lt 1000 ]; then
    echo "❌ Backup file is suspiciously small ($BACKUP_SIZE bytes)"
    echo "   This might indicate an empty or corrupt backup"
    exit 1
fi

echo "✅ Backup verified"
echo "   Size: $BACKUP_SIZE bytes"
echo "   Lines: $BACKUP_LINES"

# Check backup content
echo ""
echo "5️⃣ Checking backup content..."
if grep -q "PostgreSQL database dump" "$BACKUP_FILE" && \
   grep -q "PostgreSQL database dump complete" "$BACKUP_FILE"; then
    echo "✅ Backup appears to be complete"
else
    echo "⚠️  Warning: Backup may be incomplete (missing header/footer)"
fi

# Calculate checksum
echo ""
echo "6️⃣ Calculating checksum..."
if command -v sha256sum > /dev/null 2>&1; then
    CHECKSUM=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
    echo "$CHECKSUM  $BACKUP_FILE" > "${BACKUP_FILE}.sha256"
    echo "✅ Checksum saved: ${BACKUP_FILE}.sha256"
    echo "   SHA256: $CHECKSUM"
elif command -v shasum > /dev/null 2>&1; then
    CHECKSUM=$(shasum -a 256 "$BACKUP_FILE" | awk '{print $1}')
    echo "$CHECKSUM  $BACKUP_FILE" > "${BACKUP_FILE}.sha256"
    echo "✅ Checksum saved: ${BACKUP_FILE}.sha256"
    echo "   SHA256: $CHECKSUM"
else
    echo "⚠️  No checksum tool available (sha256sum/shasum)"
fi

# Compress backup (optional)
echo ""
echo "7️⃣ Compressing backup..."
if command -v gzip > /dev/null 2>&1; then
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    echo "✅ Backup compressed: $BACKUP_FILE"
else
    echo "⚠️  gzip not available, backup not compressed"
fi

# List recent backups
echo ""
echo "8️⃣ Recent backups:"
ls -lh "$BACKUP_DIR" | tail -n 5 | sed 's/^/   /'

# Cleanup old backups (keep last 7 days)
echo ""
echo "9️⃣ Cleaning up old backups (keeping last 7 days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "recyclic_${ENVIRONMENT}_*.sql*" -mtime +7 -delete -print | wc -l || echo "0")
echo "   Deleted $DELETED_COUNT old backup(s)"

echo ""
echo "=================================================="
echo "✅ Backup complete!"
echo ""
echo "📁 Backup location: $BACKUP_FILE"
echo ""
echo "To restore this backup:"
echo "  docker compose -p $PROJECT_NAME -f $COMPOSE_FILE exec -T postgres \\"
echo "    psql -U recyclic -d recyclic < $BACKUP_FILE"
echo ""
echo "IMPORTANT: Test the backup restoration on staging before using in production!"
