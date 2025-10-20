#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/prepare-build-meta.sh

echo "🚀 Déploiement production avec docker-compose.prod.yml"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "❌ Ni 'docker compose' ni 'docker-compose' n'est disponible sur ce système." >&2
  exit 1
fi

if $COMPOSE_CMD --help 2>/dev/null | grep -q -- "--env-file"; then
  exec $COMPOSE_CMD -f docker-compose.prod.yml --env-file .env.production --env-file .build-meta.env up -d --build
else
  echo "❌ La commande '$COMPOSE_CMD' ne supporte pas --env-file. Merci d'installer docker compose v2 (recommandé)." >&2
  echo "   Commande alternative manuelle (si .env.production renommé temporairement en .env) :" >&2
  echo "   1) mv .env .env.bak && cp .env.production .env" >&2
  echo "   2) set -a; . ./.build-meta.env; set +a" >&2
  echo "   3) $COMPOSE_CMD -f docker-compose.prod.yml up -d --build" >&2
  echo "   4) mv .env.bak .env" >&2
  exit 1
fi


