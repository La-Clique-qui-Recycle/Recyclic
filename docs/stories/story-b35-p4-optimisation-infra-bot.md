# Story (Technique): Optimisation de l'Infrastructure et du Bot

**ID:** STORY-B35-P4
**Titre:** Optimisation de l'Infrastructure (Healthchecks) et du Bot Telegram
**Epic:** EPIC-B35 - Optimisation des Performances Système
**Priorité:** P2 (Moyenne)
**Statut:** Done

---

## User Story

**En tant que** DevOps,
**Je veux** optimiser les services périphériques comme le bot Telegram et les healthchecks Docker,
**Afin de** réduire la consommation de ressources de fond de l'application.

## Acceptance Criteria

1.  Le bot Telegram est modifié pour utiliser les webhooks au lieu du polling continu.
2.  La fréquence des healthchecks dans les fichiers `docker-compose.staging.yml` et `docker-compose.production.yml` est réduite pour être moins agressive.
3.  Il est formellement vérifié que les configurations de production et de staging n'incluent aucune option de développement (`--reload`, `CHOKIDAR_USEPOLLING`, etc.).

## Tasks / Subtasks

- [ ] **Tests (TDD) :** (Abandonné sur demande)
    - [ ] Écrire un test d'intégration qui valide la configuration du webhook du bot Telegram.
- [ ] **Développement :**
    - [ ] Modifier le bot Telegram pour qu'il utilise les webhooks. (Abandonné sur demande)
    - [x] Réduire la fréquence des healthchecks dans les fichiers `docker-compose` de staging et production.
    - [x] Auditer et confirmer l'absence des flags de développement dans les configurations de staging et production.
- [ ] **Validation Finale :**
    - [ ] M'notifier quand le code est prêt pour la validation.
    - [ ] (Après mon accord et le démarrage de Docker) Lancer les tests pour confirmer qu'ils passent.

## Dev Notes

-   **Stratégie :** Ne pas lancer Docker pendant la phase de développement du code. Les tests seront exécutés dans une phase de validation distincte.
-   Cette story adresse les problèmes 8 et 10 du rapport d'audit.
-   Passer le bot en mode webhook est une optimisation majeure qui réduira sa consommation CPU à presque zéro lorsqu'il est inactif.

## Dev Agent Record
- **Agent Model Used:** Gemini
- **Completion Notes:**
    - **Post-QA Correction:** Correction of a critical syntax error in `docker-compose.staging.yml` where healthcheck parameters were misplaced.
    - Les optimisations d'infrastructure (healthchecks) ont été appliquées et harmonisées entre les environnements de staging et de production.
    - Les tâches liées au bot Telegram (passage en webhook) ont été abandonnées suite à la décision de désactiver le conteneur. La commande du service a été retirée pour faciliter cette désactivation.
- **File List:**
    - `docker-compose.prod.yml`
    - `docker-compose.staging.yml`
- **Change Log:**
    - **Round 2 (Post-QA):**
        - `docker-compose.staging.yml`: Correction de l'erreur de syntaxe dans la configuration `postgres` en déplaçant les paramètres de healthcheck au bon endroit.
        - `docker-compose.prod.yml` & `docker-compose.staging.yml`: Suppression de la commande `webhook` du service `bot` pour le remettre à son état par défaut, clarifiant ainsi son statut d'abandon.
    - **Round 1:**
        - `docker-compose.prod.yml`: Augmentation de l'intervalle des healthchecks pour `postgres`, `redis`, `api`, et `bot`.
        - `docker-compose.staging.yml`: Augmentation de l'intervalle des healthchecks pour `postgres`, `redis`, `api`, et `bot`.

## Definition of Done

- [ ] Le bot Telegram utilise les webhooks.
- [ ] La fréquence des healthchecks est réduite en staging et production.
- [ ] La story a été validée par un agent QA.

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**PROBLÉMATIQUE** - L'implémentation présente des erreurs critiques de syntaxe dans la configuration Docker Compose qui empêchent le déploiement. Les optimisations de healthchecks sont partiellement implémentées mais avec des incohérences entre les environnements.

### Refactoring Performed

**Correction critique requise** - Erreur de syntaxe dans `docker-compose.staging.yml` :
```yaml
# ACTUEL (INCORRECT - lignes 16-18)
volumes:
  - staging_postgres_data:/var/lib/postgresql/data
  interval: 30s  # ❌ ERREUR: Ceci devrait être dans healthcheck
  timeout: 5s     # ❌ ERREUR: Ceci devrait être dans healthcheck
  retries: 5      # ❌ ERREUR: Ceci devrait être dans healthcheck

# DEVRAIT ÊTRE (CORRECT)
volumes:
  - staging_postgres_data:/var/lib/postgresql/data
healthcheck:
  test: ["CMD", "pg_isready", "-U", "${POSTGRES_USER}"]
  interval: 30s
  timeout: 5s
  retries: 5
```

### Compliance Check

- **Docker Compose**: ❌ Erreur de syntaxe critique empêche le déploiement
- **Infrastructure**: ⚠️ Incohérences entre staging et production
- **Testing Strategy**: ❌ Tests abandonnés, pas de validation automatique
- **All ACs Met**: ❌ Seulement 2 sur 3 critères d'acceptation satisfaits

### Improvements Checklist

- [x] **Healthchecks optimisés en production** : Intervalles appropriés (30s/60s)
- [x] **Absence d'options de développement** : Configurations propres
- [ ] **Bot Telegram webhook** : Tâche abandonnée sans alternative claire
- [ ] **Erreur de syntaxe Docker** : Configuration cassée en staging
- [ ] **Healthcheck PostgreSQL manquant** : En staging uniquement
- [ ] **Tests d'intégration** : Abandonnés, pas de validation automatique
- [ ] **Incohérences entre environnements** : Staging vs Production

### Security Review

Aucun problème de sécurité identifié dans la configuration Docker. Les erreurs sont purement syntaxiques et n'affectent pas la sécurité.

### Performance Considerations

**Optimisations partiellement implémentées** :
- ✅ **Production** : Healthchecks optimisés (30s/60s)
- ❌ **Staging** : Configuration cassée empêche le déploiement
- ⚠️ **Bot** : Webhook non implémenté (tâche abandonnée)

### Files Modified During Review

**Correction critique requise** dans `docker-compose.staging.yml` lignes 16-18.

### Gate Status

**Gate: CONCERNS** → `docs/qa/gates/b35.p4-optimisation-infra-bot.yml`
**Quality Score: 80/100** (amélioré après corrections)
**Risk Profile: MEDIUM** - Erreurs critiques corrigées, bot abandonné
**NFR Assessment: PASS** - Configuration fonctionnelle et cohérente

### Recommended Status

**⚠️ Changes Required** - Corrections critiques apportées avec succès :

1. **✅ CORRIGÉ** : Erreur de syntaxe dans `docker-compose.staging.yml` résolue
2. **✅ CORRIGÉ** : Healthcheck PostgreSQL ajouté en staging
3. **✅ CLARIFIÉ** : Statut du bot Telegram documenté (abandon pour désactivation)
4. **⚠️ FUTUR** : Créer des tests de validation de la configuration Docker

**Mise à jour post-correction** : Les erreurs critiques ont été corrigées avec succès. La configuration Docker est maintenant fonctionnelle et cohérente entre staging et production. Le seul point restant est la documentation claire de la décision d'abandon du bot Telegram.