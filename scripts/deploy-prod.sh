#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/prepare-build-meta.sh

echo "🚀 Déploiement production avec docker-compose.prod.yml"

if docker-compose --help 2>/dev/null | grep -q "--env-file"; then
  exec docker-compose -f docker-compose.prod.yml --env-file .env.production --env-file .build-meta.env up -d --build
else
  echo "ℹ️ docker-compose ne supporte pas --env-file; fallback via source .env.production + .build-meta.env"
  set -a
  [ -f .env.production ] && . ./.env.production || true
  [ -f .build-meta.env ] && . ./.build-meta.env || true
  set +a
  exec docker-compose -f docker-compose.prod.yml up -d --build
fi


