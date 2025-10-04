---
story_id: debt.atomic-deployment
epic_id: tech-debt
title: "Rendre le script de déploiement atomique"
priority: Medium
status: Ready for Review
---

### Story de Dette Technique

**Titre :** `story-tech-debt-atomic-deployment`

**Description :**
As a DevOps/Operator,
I want to make the deployment script atomic,
so that a failed production deployment does not cause a complete service outage.

**Contexte :**
Le script de déploiement actuel dans `.github/workflows/deploy.yaml` arrête les anciens conteneurs (`docker-compose down`) avant de démarrer les nouveaux (`docker-compose up`). Si le démarrage de la nouvelle version échoue (ex: image corrompue, erreur de configuration), l'application restera complètement hors ligne jusqu'à une intervention manuelle.

### Critères d'Acceptation

1.  Le script de déploiement est modifié pour adopter une stratégie plus sûre.
2.  La nouvelle version de l'application est démarrée **avant** que l'ancienne ne soit arrêtée.
3.  Le script attend que les nouveaux conteneurs soient dans un état "healthy" (en se basant sur les `healthchecks` de Docker Compose) avant de basculer le trafic.
4.  Si les nouveaux conteneurs n'atteignent pas l'état "healthy" après un certain temps, le script annule le déploiement, arrête les nouveaux conteneurs, et laisse l'ancienne version en place.

---

### Tasks / Subtasks

---

### Validation Finale du Scrum Master (2025-09-18)

**Statut :** Done

**Vérification :** Le travail est d'une qualité exceptionnelle. Le nouveau script de déploiement atomique est robuste, testé, et correctement intégré dans la pipeline CI/CD. La dette technique est résolue.

---

1.  **Analyser le script de déploiement existant :** ✅
    -   [x] Examiner l'étape "Deploy to production" dans `.github/workflows/deploy.yaml`.

2.  **Implémenter la nouvelle stratégie de déploiement :** ✅
    -   [x] Modifier le script pour qu'il lance la nouvelle version avec `docker-compose up -d --no-recreate` (ou une technique similaire qui ne recrée pas les services qui n'ont pas changé).
    -   [x] Ajouter une boucle ou une commande qui attend que les health checks des nouveaux services passent (ex: en inspectant le résultat de `docker-compose ps`).

3.  **Gérer la bascule et le nettoyage :** ✅
    -   [x] Une fois les nouveaux services sains, modifier la configuration du reverse proxy (si applicable) pour pointer vers les nouveaux conteneurs.
    -   [x] Arrêter et supprimer les anciens conteneurs.

4.  **Implémenter le rollback automatique :** ✅
    -   [x] Si les nouveaux services n'atteignent pas l'état "healthy" dans un délai défini (ex: 2 minutes), le script doit exécuter `docker-compose stop` sur les nouveaux services et les supprimer, en laissant l'ancienne version intacte.

5.  **Tester la nouvelle procédure :** ✅
    -   [x] Simuler un déploiement réussi et un déploiement échoué (ex: avec une image Docker intentionnellement cassée) pour valider le comportement du script dans les deux cas.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4

### Debug Log References
- Création du script principal : `scripts/atomic-deploy.sh`
- Création du script de test : `scripts/test-atomic-deploy.sh`
- Tests unitaires : `tests/test_atomic_deploy_simple.py`
- Modification du workflow : `.github/workflows/deploy.yaml`

### Completion Notes List
- ✅ Script de déploiement atomique implémenté avec gestion complète des erreurs
- ✅ Stratégie de déploiement sans interruption : nouveaux services lancés avant arrêt des anciens
- ✅ Vérification des healthchecks avant basculement du trafic
- ✅ Rollback automatique en cas d'échec des nouveaux services
- ✅ Script de test complet pour validation des scénarios réussis/échoués
- ✅ Tests unitaires pour validation de la syntaxe et des fonctionnalités
- ✅ Workflow GitHub Actions mis à jour pour utiliser le déploiement atomique

### File List
- `scripts/atomic-deploy.sh` - Script principal de déploiement atomique
- `scripts/test-atomic-deploy.sh` - Script de test pour validation
- `tests/test_atomic_deploy_simple.py` - Tests unitaires
- `.github/workflows/deploy.yaml` - Workflow modifié

### Change Log
- **2025-01-27**: Implémentation complète du déploiement atomique
  - Création du script principal avec gestion d'erreurs robuste
  - Implémentation de la stratégie de déploiement sans interruption
  - Ajout des vérifications de healthcheck et rollback automatique
  - Création de tests complets et validation de l'implémentation

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Excellent** - L'implémentation du déploiement atomique est de très haute qualité. Le code est bien structuré, robuste et suit les meilleures pratiques de développement. La gestion d'erreurs est complète avec des mécanismes de rollback automatique.

### Refactoring Performed

Aucun refactoring nécessaire - Le code est déjà optimisé et suit les standards.

### Compliance Check

- **Coding Standards**: ✅ **PASS** - Scripts bash suivent les conventions (set -euo pipefail, fonctions modulaires, gestion d'erreurs)
- **Project Structure**: ✅ **PASS** - Fichiers placés dans les répertoires appropriés (scripts/, tests/, docs/)
- **Testing Strategy**: ✅ **PASS** - Tests unitaires et d'intégration complets avec couverture appropriée
- **All ACs Met**: ✅ **PASS** - Tous les critères d'acceptation sont implémentés et testés

### Improvements Checklist

- [x] Script de déploiement atomique implémenté avec gestion complète des erreurs
- [x] Stratégie de déploiement sans interruption : nouveaux services lancés avant arrêt des anciens
- [x] Vérification des healthchecks avant basculement du trafic
- [x] Rollback automatique en cas d'échec des nouveaux services
- [x] Script de test complet pour validation des scénarios réussis/échoués
- [x] Tests unitaires pour validation de la syntaxe et des fonctionnalités
- [x] Workflow GitHub Actions mis à jour pour utiliser le déploiement atomique
- [x] Documentation complète avec guide d'utilisation

### Security Review

**PASS** - Aucun problème de sécurité identifié. Les scripts utilisent des pratiques sécurisées :
- Validation des fichiers d'entrée
- Gestion sécurisée des variables d'environnement
- Nettoyage automatique des fichiers temporaires
- Utilisation de `set -euo pipefail` pour la robustesse

### Performance Considerations

**PASS** - Performance optimisée :
- Timeout configurable (défaut 120s)
- Vérifications de santé optimisées (5s d'intervalle)
- Nettoyage automatique des anciennes images
- Ports temporaires pour éviter les conflits

### Files Modified During Review

Aucun fichier modifié pendant la review - L'implémentation est déjà de qualité production.

### Gate Status

**Gate: PASS** → docs/qa/gates/debt.atomic-deployment-atomic-deployment.yml
**Risk profile**: docs/qa/assessments/debt.atomic-deployment-risk-20250127.md
**NFR assessment**: docs/qa/assessments/debt.atomic-deployment-nfr-20250127.md

### Recommended Status

✅ **Ready for Done** - L'implémentation est complète, testée et prête pour la production.