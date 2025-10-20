#!/bin/sh

# Script de génération automatique des informations de build
# Compatible avec Alpine Linux (sh)

echo "🔧 Génération des informations de build..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le répertoire frontend/"
    exit 1
fi

# Créer le répertoire public s'il n'existe pas
mkdir -p public

# Extraire la version depuis package.json
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")

# Utiliser les variables d'environnement passées en argument de build
COMMIT_SHA=${COMMIT_SHA:-"unknown"}
BRANCH=${BRANCH:-"unknown"}
COMMIT_DATE=${COMMIT_DATE:-"unknown"}
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Générer le fichier build-info.json
cat > public/build-info.json << EOF
{
  "version": "${VERSION}",
  "commitSha": "${COMMIT_SHA}",
  "branch": "${BRANCH}",
  "commitDate": "${COMMIT_DATE}",
  "buildDate": "${BUILD_DATE}"
}
EOF

echo "✅ build-info.json généré avec succès:"
echo "   Version: ${VERSION}"
echo "   Commit: ${COMMIT_SHA}"
echo "   Branche: ${BRANCH}"
echo "   Date: ${BUILD_DATE}"