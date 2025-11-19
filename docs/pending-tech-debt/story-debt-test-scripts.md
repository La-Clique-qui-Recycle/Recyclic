---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.188512
original_path: docs/stories/story-debt-test-scripts.md
---

# Story: Amélioration Robustesse Scripts de Test

**ID :** DEBT-003  
**Type :** Dette Technique  
**Priorité :** Moyenne  
**Effort estimé :** 1-2 heures  
**Sprint :** Prochain cycle de maintenance  

## 📋 Description

Améliorer la robustesse des scripts de test pour éviter les erreurs de configuration des variables d'environnement.

## 🎯 Contexte

Le script `test_postgres.sh` ne charge pas toujours correctement les variables d'environnement, ce qui peut causer des erreurs lors de l'exécution automatique.

## ✅ Critères d'Acceptation

- [ ] Script charge automatiquement les bonnes variables d'environnement
- [ ] Validation des variables avant exécution des tests
- [ ] Messages d'erreur clairs en cas de problème
- [ ] Documentation mise à jour
- [ ] Tests de régression pour les scripts

## 🔧 Détails Techniques

### Améliorations à apporter :

1. **Chargement automatique des variables :**
```bash
# Charger depuis .env si disponible
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi
```

2. **Validation des variables :**
```bash
# Vérifier que les variables sont définies
if [ -z "$TEST_DATABASE_URL" ]; then
    echo "❌ TEST_DATABASE_URL not set"
    exit 1
fi
```

3. **Messages d'erreur clairs :**
```bash
# Fonction d'erreur
error_exit() {
    echo "❌ Error: $1" >&2
    exit 1
}
```

## 📚 Références

- [Bash Best Practices](https://google.github.io/styleguide/shellguide.html)
- [Environment Variables](https://docs.docker.com/compose/environment-variables/)

## 🧪 Tests

- [ ] Script fonctionne avec variables définies
- [ ] Script fonctionne avec fichier .env
- [ ] Script échoue proprement si variables manquantes
- [ ] Messages d'erreur clairs et utiles
- [ ] Tests de régression automatisés

## 📝 Notes

Cette amélioration réduit le risque d'erreurs lors de l'exécution automatique des tests et améliore l'expérience développeur.
