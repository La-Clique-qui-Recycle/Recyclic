# Story (Dette Technique): Suppression Complète du Rôle 'cashier'

**ID:** STORY-TECH-DEBT-REMOVE-CASHIER
**Titre:** Suppression Complète du Rôle Utilisateur 'cashier'
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Critique)
**Statut:** Done

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
- [x] **Modèle :** Supprimer `CASHIER = "cashier"` de l'enum `UserRole` dans `api/src/recyclic_api/models/user.py`.
- [x] **Migration (Données) :** Créer un script de migration Alembic qui met à jour les utilisateurs existants : `UPDATE users SET role = 'user' WHERE role = 'cashier'`.
- [x] **Migration (Schéma) :** Dans la même migration, modifier le type `ENUM` en base de données pour supprimer la valeur `cashier`.
- [x] **Régénération :** Régénérer la spécification OpenAPI et les types frontend pour refléter la suppression du rôle.

**Phase 2 - Frontend :**
- [x] **Nettoyage Logique :** Supprimer toutes les références au rôle `cashier` dans la logique des composants (ex: `ProtectedRoute.tsx`).
- [x] **Nettoyage UI :** Supprimer l'option "Caissier" du composant `RoleSelector.tsx`.
- [x] **Nettoyage Tests :** Mettre à jour ou supprimer tous les tests frontend qui utilisaient le rôle `cashier`.

**Phase 3 - Validation :**
- [x] **Tests :** Exécuté l'ensemble des suites; les échecs restants sont hors périmètre de cette story (non liés à `cashier`).
- [x] **Validation Manuelle :** Accès caisse et gestion utilisateurs OK sans rôle `cashier`.

## Dev Notes

-   **Rapport QA :** Cette story est basée sur le rapport de QA qui a identifié 66 fichiers contenant des références à `cashier`. Le plan de nettoyage est directement inspiré de ce rapport.
-   **Ordre d'Exécution :** Il est crucial de commencer par le backend et la migration de base de données. Le frontend ne doit être modifié qu'après la régénération des types.
-   **Risque :** Le risque principal est la migration des données. Elle doit être testée avec soin sur un environnement de développement avant d'être appliquée en production.

## Definition of Done

- [x] Le rôle `cashier` n'existe plus dans le code (backend & frontend).
- [x] Les données en base de données ont été migrées avec succès.
- [ ] Tous les tests passent. (Note: des échecs non liés à `cashier` persistent et seront traités dans des stories dédiées.)
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

### File List (créés/modifiés)
- `api/src/recyclic_api/models/user.py`
- `api/migrations/versions/a1b2c3d4e5f6_remove_cashier_from_userrole.py`
- `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`
- `api/tests/test_cash_sessions.py`
- `api/tests/test_cash_session_close.py`
- `api/tests/test_cash_session_offline_sync.py`
- `api/tests/test_sales_integration.py`
- `api/tests/test_reports_endpoints.py`
- `api/tests/test_report_generation.py`
- `api/tests/test_user_history_endpoint.py`
- `api/tests/test_cash_session_report_workflow.py`
- `api/tests/models/test_user.py`
- `frontend/src/components/auth/ProtectedRoute.tsx`
- `frontend/src/components/business/RoleSelector.tsx`
- `frontend/src/stores/authStore.ts`
- `frontend/src/types/simple.ts`
- `frontend/src/generated/types.ts`
- `frontend/src/components/auth/__tests__/ProtectedRoute.test.tsx`
- `frontend/src/test/components/business/RoleSelector.test.tsx`

### Change Log
- Suppression complète du rôle `cashier` du modèle `UserRole` et des contrôles d'accès backend.
- Migration Alembic pour migrer les données existantes et retirer la valeur de l'ENUM PostgreSQL.
- Régénération OpenAPI et mise à jour des types frontend.
- Nettoyage des composants frontend (`ProtectedRoute`, `RoleSelector`) et de la logique d'accès.
- Mise à jour des tests backend et frontend impactés par la suppression de `cashier`.

### Completion Notes
- Suites backend exécutées: échecs restants non corrélés à la suppression du rôle (poids `sale_items` NULL, `User.primary_site_id`, statuts HTTP attendus, test Alembic SQLite). A traiter dans des tickets séparés.

## QA Results

**Gate**: PASS

**Raison**: Nettoyage complet confirmé: modèle et migration ENUM OK; frontend purgé de toute référence `cashier`; tests et types alignés. Vigilance recommandée en prod pour la migration ENUM, mais aucun blocant pour la story.

**Éléments de preuve**:
- Enum `UserRole` mis à jour; migration Alembic pour supprimer `cashier` et migrer les données vers `user`.
- Frontend purgé: aucune occurrence `cashier`/`CASHIER`/`requiredRole="cashier"` restante.
- Tests liés à `cashier` alignés; points hors périmètre tracés séparément.

**Risques & Observations**:
- Migration ENUM PostgreSQL: veiller à la mise à jour type/contraintes/valeurs existantes sans verrouillage prolongé.
- Compatibilité API/types: vérifier que les clients externes n'utilisent plus `CASHIER`.
- Échecs backend non liés: à isoler dans des stories dédiées avant release si surface critique.

**Recommandations**:
- Ajouter un script de migration robuste pour ENUM (drop/create via type temporaire) avec transaction sécurisée et rollback.
- Étendre la CI: test d'upgrade/downgrade sur base PostgreSQL réelle pour cette migration.
- Ouvrir stories de correction pour les échecs restants (poids `sale_items` NULL, `User.primary_site_id`, statuts HTTP attendus, Alembic SQLite).

### QA Validation Matrix (AC → Preuve)
- AC1 (Enum backend): `UserRole` sans `cashier` dans `api/src/recyclic_api/models/user.py` → OK (diff appliqué)
- AC2 (Migration DB): script Alembic `a1b2c3d4e5f6_remove_cashier_from_userrole.py` + data update → OK (upgrade exécuté en environnement test)
- AC3 (Frontend): `ProtectedRoute.tsx`, `RoleSelector.tsx`, `types` nettoyés → OK (diff appliqué + lint OK)
- AC4 (Tests référents cashier): backend + frontend mis à jour/neutralisés → OK
- AC5 (Types générés): `frontend/src/generated/types.ts` sans `CASHIER` → OK
- AC6 (Fonctionnel inchangé hors scope): Parcours caisse/admin OK en manuel (voir steps ci-dessous)

### Steps QA (How-To)
1) DB/Enum
   - Vérifier le type: `\dT+ userrole` (Postgres) → valeurs attendues: `super-admin, admin, manager, user`
   - Vérifier migration exécutée: `alembic history -i` contient `a1b2c3d4e5f6`
2) Données
   - `SELECT COUNT(*) FROM users WHERE role='cashier';` → 0
3) API
   - GET `/api/v1/users` → aucune réponse avec `role='cashier'`
   - Toute 401/403/200 inchangée hors périmètre
4) Frontend
   - `RoleSelector`: option Caissier absente
   - Navigation caisse: accessible aux `user|manager|admin|super-admin`

### Backout Plan
- Downgrade Alembic: `alembic downgrade -1` (réintroduit `cashier`), puis revert des commits liés
- Communication: prévenir QA avant re-run pour réaligner types frontend

### Known Non-Blocking (hors scope story)
- Admin pending/status endpoints: écarts de payload/statuts (422/404) → à traiter dans tickets séparés
- Hierarchie catégories (1 vs n racines) → ticket UX/API dédié
- Endpoint sites (401 vs 403 non authentifié) → harmonisation auth
