---
story_id: email.sender-secrets
epic_id: auth-refactoring
title: "Paramétrage expéditeur par environnement + rotation de secrets"
status: Done
parent: tech-debt.email
---

### User Story

En tant qu’équipe sécurité/ops,
Je veux standardiser l’expéditeur par environnement et documenter la rotation de `BREVO_API_KEY`,
Afin de réduire les risques et faciliter l’exploitation.

### Critères d'Acceptation

1. Variables: `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS` chargées via config et utilisées par défaut.
2. Documentation “runbook” de rotation `BREVO_API_KEY` (étapes, vérifs, rollback).
3. Tests unitaires: fallback défaut + override custom.

### Tâches

- Étendre `config.py` pour exposer `EMAIL_FROM_*`.
- Adapter `EmailService.send_email` pour consommer ces valeurs.
- Ajouter tests d’injection expéditeur et MAJ README/dev-notes.

### Notes

Estimation: S (~0.5 j) — M si rotation automatisée

---

### QA Results

Gate: PASS

Raisons:
- Paramètres expéditeur par environnement pris en compte; runbook de rotation documenté.
- Tests unitaires pour fallback et override OK.

Evidence:
- Config `EMAIL_FROM_*` chargée et utilisée par défaut.

Reviewer: Quinn
Date: 2025-09-17

---

## Dev Agent Record

### Tasks
- [x] Étendre config.py pour EMAIL_FROM_NAME et EMAIL_FROM_ADDRESS
- [x] Adapter EmailService.send_email pour utiliser les valeurs de configuration
- [x] Créer documentation complète de rotation (runbook)
- [x] Ajouter tests unitaires pour fallback et override
- [x] Mettre à jour tests existants

### File List
- `api/src/recyclic_api/core/config.py` - Configuration EMAIL_FROM_*
- `api/src/recyclic_api/core/email_service.py` - Service utilisant la configuration
- `docs/runbooks/brevo-api-key-rotation.md` - Runbook complet de rotation
- `api/tests/test_email_service.py` - Tests de configuration (13 tests)

### Completion Notes
- **Configuration par environnement :**
  - Variables `EMAIL_FROM_NAME` et `EMAIL_FROM_ADDRESS` configurables
  - Valeurs par défaut : "Recyclic" et "noreply@recyclic.fr"
  - Override possible par paramètres de fonction

- **Runbook de rotation sécurisée :**
  - Procédure complète en 5 phases (Préparation → Déploiement → Validation → Nettoyage)
  - Tests de validation automatisés
  - Procédure de rollback d'urgence
  - Surveillance et métriques post-déploiement
  - Troubleshooting et contacts d'urgence

- **Tests robustes :**
  - Test fallback configuration par défaut
  - Test override complet des paramètres
  - Test override partiel (mix config/override)
  - Validation des valeurs de configuration

- **Sécurité opérationnelle :**
  - Documentation des étapes de vérification
  - Commandes de surveillance automatisées
  - Gestion des erreurs et alertes
  - Historique des rotations

### Change Log
- 2025-09-17: Configuration expéditeur par environnement et runbook de rotation

### Status
Completed

