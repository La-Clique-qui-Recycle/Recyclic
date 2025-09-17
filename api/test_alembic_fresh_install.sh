#!/bin/bash

echo "🧪 Test d'installation fraîche avec Alembic..."

# Créer une base de données de test
echo "Création de la base de données de test..."
docker-compose exec -T postgres psql -U recyclic -c "DROP DATABASE IF EXISTS recyclic_test;"
docker-compose exec -T postgres psql -U recyclic -c "CREATE DATABASE recyclic_test;"

# Appliquer toutes les migrations sur la base de test
echo "Application des migrations sur la base de test..."
DATABASE_URL="postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test" alembic upgrade head

# Vérifier que toutes les tables existent
echo "Vérification des tables créées..."
docker-compose exec -T postgres psql -U recyclic -d recyclic_test -c "\dt"

# Vérifier l'état des migrations
echo "Vérification de l'état des migrations..."
DATABASE_URL="postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic_test" alembic current

echo "✅ Test terminé!"
