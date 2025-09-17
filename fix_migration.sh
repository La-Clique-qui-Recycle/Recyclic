#!/bin/bash

echo "🔧 Correction de l'état des migrations..."

# Mettre à jour l'état de la base de données
echo "Mise à jour de l'état de la base de données..."
docker-compose exec -T postgres psql -U recyclic -d recyclic -c "UPDATE alembic_version SET version_num = 'afbbc7f0e804';"

# Vérifier l'état
echo "Vérification de l'état..."
docker-compose exec -T postgres psql -U recyclic -d recyclic -c "SELECT version_num FROM alembic_version;"

# Vérifier que la table cash_sessions existe
echo "Vérification de la table cash_sessions..."
docker-compose exec -T postgres psql -U recyclic -d recyclic -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'cash_sessions';"

echo "✅ Correction terminée!"
