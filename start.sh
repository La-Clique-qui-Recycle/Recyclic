#!/bin/bash

# Script de démarrage pour Recyclic
echo "🚀 Démarrage de Recyclic..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env à partir de env.example..."
    cp env.example .env
    echo "⚠️  Veuillez configurer les variables d'environnement dans le fichier .env"
fi

# Construire et démarrer les services
echo "🔨 Construction des images Docker..."
docker-compose build

echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérifier le statut des services
echo "🔍 Vérification du statut des services..."
docker-compose ps

# Tester l'API
echo "🧪 Test de l'API..."
sleep 5
curl -f http://localhost:4433/health || echo "⚠️  L'API n'est pas encore prête"

echo ""
echo "✅ Recyclic est démarré !"
echo ""
echo "🌐 Services disponibles :"
echo "   • API: http://localhost:4433"
echo "   • Documentation: http://localhost:4433/docs"
echo "   • Frontend: http://localhost:4444"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo ""
echo "📚 Commandes utiles :"
echo "   • Voir les logs: docker-compose logs -f"
echo "   • Arrêter: docker-compose down"
echo "   • Redémarrer: docker-compose restart"
