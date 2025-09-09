#!/usr/bin/env bash
set -euo pipefail

# Wrapper script for Recyclic CLI to avoid quoting issues
# Usage: ./scripts/cli.sh create-super-admin 123456789 "John Doe"

docker-compose run --rm api python src/cli.py "$@"
