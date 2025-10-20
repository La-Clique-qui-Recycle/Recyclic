#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/prepare-build-meta.sh

echo "🚀 Déploiement staging avec docker-compose.staging.yml"

# Déterminer la commande docker compose disponible
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "❌ Ni 'docker compose' ni 'docker-compose' n'est disponible sur ce système." >&2
  exit 1
fi

# Vérifier le support de --env-file (utiliser -- pour éviter l'option grep)
if $COMPOSE_CMD --help 2>/dev/null | grep -q -- "--env-file"; then
  # Arrêter la stack existante sans supprimer les volumes
  $COMPOSE_CMD -f docker-compose.staging.yml --env-file .env.staging --env-file .build-meta.env down || true
  exec $COMPOSE_CMD -f docker-compose.staging.yml --env-file .env.staging --env-file .build-meta.env up -d --build
else
  echo "❌ La commande '$COMPOSE_CMD' ne supporte pas --env-file. Merci d'installer docker compose v2 (recommandé)." >&2
  echo "   Commande alternative manuelle (si .env.staging renommé temporairement en .env) :" >&2
  echo "   1) mv .env .env.bak && cp .env.staging .env" >&2
  echo "   2) set -a; . ./.build-meta.env; set +a" >&2
  echo "   3) $COMPOSE_CMD -f docker-compose.staging.yml up -d --build" >&2
  echo "   4) mv .env.bak .env" >&2
  exit 1
fi


