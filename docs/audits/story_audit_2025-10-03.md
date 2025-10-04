# Audit des Stories - 3 Octobre 2025

Ce document est un état des lieux de l'ensemble des stories présentes dans le répertoire `docs/stories` à la date du 3 octobre 2025.

## En Cours (In Progress)

Stories du Batch 10, identifiées comme étant en cours de développement.

- `story-b10-p3-ui-amelioration-interface-vente.md`
- `story-b10-p2-bug-finalisation-fermeture-caisse.md`
- `story-b10-p1-logique-poids-caisse.md`

## À Faire (To Do)

Stories prêtes pour le développement futur, incluant le batch B11 et des tâches de fond.

- `story-b11-p2-feature-export-manuel-db.md`
- `story-b11-p1-infra-sauvegarde-automatisee.md`
- `story-b10-p4-changement-operateur-caisse.md`
- `story-tech-debt-remove-cashier-role.md`
- `story-future-copilotkit-integration.md`
- `story-tech-debt-ia-performance-metrics.md`
- `story-tech-debt-load-testing.md`
- `story-tech-debt-reception-module-hardening.md`
- `story-tech-debt-stats-optimization.md`
- `story-tech-debt-atomic-deployment.md`
- `story-tech-debt-backend-ergonomie-improvements.md`
- `story-b06-p4-1-archi-strategie-synchronisation.md` (et les 3 stories suivantes de ce batch)

## Terminées (Done)

La majorité des stories sont terminées. Elles sont marquées comme "Done", "Terminé" ou ont un statut "PASS" de la QA. Ceci inclut la plupart des bugs et des stories des batches B01 à B09.

**Exemples :**
- `story-b09-p3-refactoring-categories-dynamiques.md`
- `story-b09-p2-frontend-admin-categories.md`
- `story-b09-p1-backend-api-categories.md`
- `story-b08-p2-dev-interaction-saisie-poids.md`
- `story-b05-p3-frontend-rapports-details-export.md`
- `bug-5.1.1-migration-db-enum-conflict.md`
- `story-1.1-infrastructure-technique.md`
- `story-3.1-creation-super-admin-roles.md`
- *(et de nombreuses autres)*

## Douteuses (Doubtful)

Cette catégorie regroupe les fichiers qui nécessitent une clarification. Ils peuvent être des doublons, des notes temporaires, ou des stories dont le statut final est incertain.

### Fichiers de Notes et Résumés
- **`3.2-resume-prompt-dev-agent.md`**
  - **Raison :** Un résumé pour un agent de développement, pas une story. Devrait être archivé ou supprimé.

### Problèmes de QA ou Action Utilisateur Requise
- **`bug-bot-telegram-token-config.md`**
  - **Raison :** Le statut QA est "CONCERNS" car une action manuelle de l'utilisateur était requise. Le statut final est inconnu.
- **`story-infra-frontend-https-dev.md`**
  - **Raison :** Le statut QA est "CONCERNS" car la documentation finale n'a pas été complétée.

### Doublons Potentiels et Fichiers Obsolètes
- **`story-1-1-infrastructure-technique.md`**
- **`story-1-1-risk-design-analysis.md`**
- **`story-1-1-validation-report.md`**
- **`story-1.1-infrastructure-technique.md`** (marquée "Done")
  - **Raison :** Les trois premiers fichiers semblent être des documents de planification pour la story `1.1` qui est terminée. Ils pourraient être archivés.

### Stories sans Statut Clair
- `story-b02-p2-admin-gestion-postes-caisse.md`
- `story-b02-p3-ux-ouverture-session.md`
- `story-b02-p4-ux-switch-operator.md`
- `story-b04-p1-historique-tickets-reception.md`
- `story-b04-p2-securite-suppression-tickets.md`
  - **Raison :** Ces fichiers n'ont pas de statut de complétion clair ("Done", "Terminé") ni de section QA. Leur état final est incertain et mériterait d'être vérifié.
