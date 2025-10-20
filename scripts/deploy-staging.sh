#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/prepare-build-meta.sh

echo "🚀 Déploiement staging avec docker-compose.staging.yml"

if docker-compose --help 2>/dev/null | grep -q "--env-file"; then
  exec docker-compose -f docker-compose.staging.yml --env-file .env.staging --env-file .build-meta.env up -d --build
else
  echo "ℹ️ docker-compose ne supporte pas --env-file; fallback via source .env.staging + .build-meta.env"
  set -a
  [ -f .env.staging ] && . ./.env.staging || true
  [ -f .build-meta.env ] && . ./.build-meta.env || true
  set +a
  exec docker-compose -f docker-compose.staging.yml up -d --build
fi


