---
story_id: tech-debt.remove-reset-token-alias
epic_id: maintenance
title: "Story Tech-Debt: Suppression de l'alias create_reset_token déprécié"
status: Draft
priority: P3 (Low)
---

# Story (Dette Technique): Suppression de l'alias create_reset_token

**ID:** STORY-TECH-DEBT-REMOVE-RESET-TOKEN-ALIAS
**Titre:** Suppression de l'alias create_reset_token déprécié
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Basse)
**Statut:** Draft

---

## User Story

**En tant que** Développeur,
**Je veux** supprimer l'alias déprécié `create_reset_token()` du module de sécurité,
**Afin de** maintenir un code propre avec un seul nom canonique pour la création de tokens de réinitialisation de mot de passe.

## Contexte

La story [STORY-TECH-DEBT-AUTH-TESTS-ALIGNMENT](./story-tech-debt-auth-tests-alignment.md) a introduit un alias `create_reset_token()` pour résoudre des problèmes d'import dans les tests. Cet alias a été marqué comme **DEPRECATED** et tous les tests internes ont été migrés vers le nom canonique `create_password_reset_token()`.

L'alias reste actuellement pour assurer la compatibilité avec d'éventuelles dépendances externes, mais devrait être supprimé une fois qu'aucun code externe ne l'utilise.

## Acceptance Criteria

1. Aucun code du projet (backend, frontend, bot) n'utilise `create_reset_token()`
2. L'alias `create_reset_token()` est supprimé de `api/src/recyclic_api/core/security.py`
3. Les 3 tests de compatibilité dans `TestResetTokenAliasCompatibility` sont supprimés
4. Tous les tests d'authentification continuent de passer (55+ tests)
5. Un grep dans tout le projet confirme qu'aucune référence à `create_reset_token` ne subsiste

## Tasks / Subtasks

- [ ] **Audit du code:**
    - [ ] Grepper tout le projet pour trouver les usages de `create_reset_token`
    - [ ] Vérifier le backend (`api/`)
    - [ ] Vérifier le bot (`bot/`) si applicable
    - [ ] Vérifier tout autre service
- [ ] **Suppression:**
    - [ ] Supprimer la fonction alias de `api/src/recyclic_api/core/security.py`
    - [ ] Supprimer la classe `TestResetTokenAliasCompatibility` de `api/tests/test_auth_password_reset.py`
    - [ ] Supprimer l'import de l'alias dans les tests
- [ ] **Validation:**
    - [ ] Exécuter tous les tests d'authentification
    - [ ] Exécuter la suite de tests complète
    - [ ] Vérifier qu'aucun grep ne trouve `create_reset_token`

## Dev Notes

**Prérequis:**
- Cette story ne peut être exécutée que lorsqu'on est **certain** qu'aucun code externe (scripts, outils internes, documentation externe) n'utilise l'alias.
- Si des dépendances externes existent, elles doivent être migrées d'abord.

**Commande d'audit:**
```bash
# Rechercher tous les usages dans le projet
grep -r "create_reset_token" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" api/ bot/ frontend/ docs/
```

**Impact:**
- Risque: FAIBLE (alias documenté comme déprécié depuis story STORY-TECH-DEBT-AUTH-TESTS-ALIGNMENT)
- Bénéfice: Code plus propre, un seul nom canonique

## Definition of Done

- [ ] L'alias `create_reset_token()` n'existe plus dans le code source
- [ ] Tous les tests passent (55+ tests d'authentification)
- [ ] Aucune référence à `create_reset_token` dans le projet (vérifié par grep)
- [ ] La story a été validée par un agent QA

---

## Références

- **Story parent:** [STORY-TECH-DEBT-AUTH-TESTS-ALIGNMENT](./story-tech-debt-auth-tests-alignment.md)
- **QA Gate parent:** [tech-debt.auth-tests-alignment.yml](../qa/gates/tech-debt.auth-tests-alignment.yml)
- **Fichier source:** [api/src/recyclic_api/core/security.py](../../api/src/recyclic_api/core/security.py#L143-L157)

---

## Notes de Planification

**Quand exécuter cette story:**
- Après plusieurs sprints (3-6 mois recommandés)
- Quand on est confiant qu'aucun code externe ne dépend de l'alias
- Pendant une période de maintenance ou de nettoyage de dette technique

**Effort estimé:** XS (< 1h) - Simple suppression + validation
