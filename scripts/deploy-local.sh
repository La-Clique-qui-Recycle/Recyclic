#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/prepare-build-meta.sh

echo "🚀 Déploiement local avec docker-compose.yml"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "❌ Ni 'docker compose' ni 'docker-compose' n'est disponible sur ce système." >&2
  exit 1
fi

if $COMPOSE_CMD --help 2>/dev/null | grep -q -- "--env-file"; then
  exec $COMPOSE_CMD --env-file .env --env-file .build-meta.env up -d --build
else
  echo "❌ La commande '$COMPOSE_CMD' ne supporte pas --env-file. Merci d'installer docker compose v2 (recommandé)." >&2
  echo "   Alternative: renommer temporairement .env et sourcer .build-meta.env avant up." >&2
  exit 1
fi


