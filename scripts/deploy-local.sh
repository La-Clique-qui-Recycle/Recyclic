#!/usr/bin/env bash
set -euo pipefail
# Normaliser les fins de ligne si l'outil est présent (robustesse)
command -v dos2unix >/dev/null 2>&1 && dos2unix "$0" >/dev/null 2>&1 || true

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

bash ./scripts/prepare-build-meta.sh

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
  # Arrêter la stack existante (projet explicite)
  $COMPOSE_CMD -p recyclic-local --env-file .env --env-file .build-meta.env down || true
  docker rm -f recyclic-local-postgres recyclic-local-redis 2>/dev/null || true
  exec $COMPOSE_CMD -p recyclic-local --env-file .env --env-file .build-meta.env up -d --build --remove-orphans
else
  echo "❌ La commande '$COMPOSE_CMD' ne supporte pas --env-file. Merci d'installer docker compose v2 (recommandé)." >&2
  echo "   Alternative: renommer temporairement .env et sourcer .build-meta.env avant up." >&2
  exit 1
fi


