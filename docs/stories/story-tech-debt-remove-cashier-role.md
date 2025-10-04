# Story (Dette Technique): Suppression Complète du Rôle 'cashier'

**ID:** STORY-TECH-DEBT-REMOVE-CASHIER
**Titre:** Suppression Complète du Rôle Utilisateur 'cashier'
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Critique)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** supprimer toutes les références au rôle déprécié `cashier` dans l'ensemble du projet (backend, frontend, base de données),
**Afin de** nettoyer la base de code, éliminer la confusion et prévenir les bugs futurs.

## Acceptance Criteria

1.  Le rôle `cashier` est supprimé de l'enum `UserRole` dans le modèle de données backend (`api/src/recyclic_api/models/user.py`).
2.  Une migration de base de données est créée pour supprimer la valeur `cashier` de l'enum en base de données et pour migrer les utilisateurs existants ayant ce rôle vers le rôle `user`.
3.  Le code frontend (ex: `ProtectedRoute.tsx`, `RoleSelector.tsx`) ne contient plus aucune référence logique ou de type au rôle `cashier`.
4.  Les tests qui référençaient le rôle `cashier` sont mis à jour ou supprimés.
5.  Les types générés (`frontend/src/generated/types.ts`) ne contiennent plus le rôle `CASHIER`.
6.  L'application reste entièrement fonctionnelle après la suppression.

## Tasks / Subtasks

**Phase 1 - Backend & Base de Données (Critique) :**
- [ ] **Modèle :** Supprimer `CASHIER = "cashier"` de l'enum `UserRole` dans `api/src/recyclic_api/models/user.py`.
- [ ] **Migration (Données) :** Créer un script de migration Alembic qui met à jour les utilisateurs existants : `UPDATE users SET role = 'user' WHERE role = 'cashier'`.
- [ ] **Migration (Schéma) :** Dans la même migration, modifier le type `ENUM` en base de données pour supprimer la valeur `cashier`.
- [ ] **Régénération :** Régénérer la spécification OpenAPI et les types frontend pour refléter la suppression du rôle.

**Phase 2 - Frontend :**
- [ ] **Nettoyage Logique :** Supprimer toutes les références au rôle `cashier` dans la logique des composants (ex: `ProtectedRoute.tsx`).
- [ ] **Nettoyage UI :** Supprimer l'option "Caissier" du composant `RoleSelector.tsx`.
- [ ] **Nettoyage Tests :** Mettre à jour ou supprimer tous les tests frontend qui utilisaient le rôle `cashier`.

**Phase 3 - Validation :**
- [ ] **Tests :** Exécuter l'intégralité des suites de tests backend et frontend pour s'assurer qu'aucune régression n'a été introduite.
- [ ] **Validation Manuelle :** Vérifier que l'application fonctionne correctement, notamment l'accès à la caisse et la gestion des utilisateurs.

## Dev Notes

-   **Rapport QA :** Cette story est basée sur le rapport de QA qui a identifié 66 fichiers contenant des références à `cashier`. Le plan de nettoyage est directement inspiré de ce rapport.
-   **Ordre d'Exécution :** Il est crucial de commencer par le backend et la migration de base de données. Le frontend ne doit être modifié qu'après la régénération des types.
-   **Risque :** Le risque principal est la migration des données. Elle doit être testée avec soin sur un environnement de développement avant d'être appliquée en production.

## Definition of Done

- [ ] Le rôle `cashier` n'existe plus dans le code (backend & frontend).
- [ ] Les données en base de données ont été migrées avec succès.
- [ ] Tous les tests passent.
- [ ] La story a été validée par un agent QA.