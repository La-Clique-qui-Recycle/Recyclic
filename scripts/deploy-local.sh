#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/prepare-build-meta.sh

echo "🚀 Déploiement local avec docker-compose.yml"

if docker-compose --help 2>/dev/null | grep -q "--env-file"; then
  exec docker-compose --env-file .env --env-file .build-meta.env up -d --build
else
  echo "ℹ️ docker-compose ne supporte pas --env-file; fallback via source .env + .build-meta.env"
  set -a
  [ -f .env ] && . ./.env || true
  [ -f .build-meta.env ] && . ./.build-meta.env || true
  set +a
  exec docker-compose up -d --build
fi


