#!/bin/bash

# Test rapide du script de rollback
# Usage: bash scripts/test-rollback-quick.sh

set -e

echo "=== Test Rapide - Script de Rollback ==="

# Test 1: Vérification de l'aide
echo "Test 1: Affichage de l'aide"
if bash scripts/rollback.sh --help >/dev/null 2>&1; then
    echo "✅ Aide affichée correctement"
else
    echo "❌ Erreur lors de l'affichage de l'aide"
    exit 1
fi

# Test 2: Vérification des arguments invalides
echo "Test 2: Gestion des arguments invalides"
if ! bash scripts/rollback.sh --invalid-option >/dev/null 2>&1; then
    echo "✅ Arguments invalides gérés correctement"
else
    echo "❌ Les arguments invalides ne sont pas rejetés"
    exit 1
fi

# Test 3: Vérification du répertoire de travail
echo "Test 3: Vérification du répertoire de travail"
cd /tmp
if ! bash ../scripts/rollback.sh >/dev/null 2>&1; then
    echo "✅ Mauvais répertoire détecté correctement"
else
    echo "❌ Le mauvais répertoire n'est pas détecté"
    exit 1
fi
cd - >/dev/null

# Test 4: Vérification de la version inexistante
echo "Test 4: Gestion des versions inexistantes"
if ! bash scripts/rollback.sh nonexistent-version >/dev/null 2>&1; then
    echo "✅ Version inexistante gérée correctement"
else
    echo "❌ La version inexistante n'est pas rejetée"
    exit 1
fi

# Test 5: Vérification des métriques
echo "Test 5: Test des métriques"
mkdir -p logs
if bash -c 'source scripts/rollback.sh && log_metrics test_event test_version 10 success' >/dev/null 2>&1; then
    if [ -f logs/rollback-metrics.json ]; then
        echo "✅ Métriques enregistrées correctement"
    else
        echo "❌ Fichier de métriques non créé"
        exit 1
    fi
else
    echo "❌ Erreur lors de l'enregistrement des métriques"
    exit 1
fi

# Nettoyage
rm -rf logs/

echo
echo "✅ Tous les tests rapides sont passés !"
echo "Le script de rollback est fonctionnel."
