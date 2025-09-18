---
story_id: 5.4.1
epic_id: 5
title: "Backend - API de Gestion et Historique Utilisateur"
status: Done
---

### User Story

**En tant que** système,
**Je veux** des endpoints API robustes pour gérer les utilisateurs et tracer l'historique de leurs changements de statut,
**Afin de** fournir une base solide pour l'interface d'administration et garantir l'auditabilité des actions.

### Critères d'Acceptation

1.  Une nouvelle table `user_status_history` est créée en base de données pour tracer les changements de statut.
2.  Un nouvel endpoint `PUT /api/v1/admin/users/{user_id}/status` permet de changer le statut d'un utilisateur (ex: `is_active`).
3.  Chaque appel à cet endpoint crée une nouvelle entrée dans la table `user_status_history`.
4.  Un nouvel endpoint `PUT /api/v1/admin/users/{user_id}` permet de mettre à jour les informations de base du profil (ex: nom).
5.  Tous les nouveaux endpoints sont sécurisés et accessibles uniquement aux administrateurs.
6.  Les nouveaux endpoints sont couverts par des tests d'intégration.

---

### Dev Notes

#### Contexte

Cette story prépare tout le backend nécessaire pour la future interface d'administration (Story 5.4.2). Elle se concentre sur la création des endpoints manquants et, surtout, sur l'implémentation de la nouvelle exigence d'historisation des changements de statut.

#### Conception de la nouvelle table `user_status_history`

La table devra contenir au minimum les colonnes suivantes :
-   `id` (PK)
-   `user_id` (FK vers `users.id`)
-   `changed_by_admin_id` (FK vers `users.id`)
-   `old_status` (ex: `boolean` ou `string`)
-   `new_status` (ex: `boolean` ou `string`)
-   `change_date` (Timestamp)
-   `reason` (String, nullable)

---

### Tasks / Subtasks

1.  **(AC: 1)** **Créer le modèle et la migration pour l'historique :** ✅
    -   [x] Créer un nouveau modèle SQLAlchemy `UserStatusHistory` dans un fichier approprié (ex: `api/src/recyclic_api/models/user_status_history.py`).
    -   [x] Ajouter ce nouveau modèle au fichier `__init__.py` du répertoire des modèles.
    -   [x] Générer une nouvelle migration Alembic (`alembic revision --autogenerate ...`) pour créer la table `user_status_history` en base de données.

2.  **(AC: 2, 3)** **Créer l'endpoint de mise à jour du statut :** ✅
    -   [x] Dans `api/src/recyclic_api/api/api_v1/endpoints/admin.py`, créer la route `PUT /users/{user_id}/status`.
    -   [x] L'endpoint doit accepter un body avec le nouveau statut (ex: `is_active: bool`) et une raison optionnelle.
    -   [x] **Logique principale :**
        -   Récupérer l'utilisateur.
        -   Enregistrer l'ancien statut.
        -   Mettre à jour le statut de l'utilisateur dans la table `users`.
        -   Créer une nouvelle entrée dans la table `user_status_history` avec toutes les informations requises (ID de l'admin, ID de l'utilisateur, ancien statut, nouveau statut, date, raison).

3.  **(AC: 4)** **Créer l'endpoint de mise à jour du profil :** ✅
    -   [x] Dans `admin.py`, créer la route `PUT /users/{user_id}`.
    -   [x] L'endpoint doit accepter un body avec les champs modifiables (ex: `first_name`, `last_name`).
    -   [x] Mettre à jour les informations de l'utilisateur dans la table `users`.

4.  **(AC: 5)** **Sécuriser les endpoints :** ✅
    -   [x] S'assurer que les deux nouvelles routes utilisent la dépendance `require_admin_role()` pour restreindre l'accès.

5.  **(AC: 6)** **Ajouter les tests d'intégration :** ✅
    -   [x] Créer un nouveau fichier de test (ex: `api/tests/api/test_admin_user_management.py`).
    -   [x] Tester l'endpoint `/status` : vérifier que le statut de l'utilisateur change ET qu'une ligne est bien ajoutée dans `user_status_history`.
    -   [x] Tester l'endpoint `/{user_id}` : vérifier que les informations du profil sont bien mises à jour.
    -   [x] Tester les permissions : vérifier qu'un utilisateur non-admin reçoit une erreur 403.

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Migration Alembic créée : `69dba742f15b_add_user_status_history_table_only.py`
- Nouveaux endpoints ajoutés dans `admin.py` : `PUT /users/{user_id}/status` et `PUT /users/{user_id}`
- Tests d'intégration créés : `test_admin_user_management.py`

### Completion Notes List
- ✅ Modèle `UserStatusHistory` créé avec toutes les colonnes requises
- ✅ Migration Alembic appliquée avec succès
- ✅ Endpoint de mise à jour du statut implémenté avec historique automatique
- ✅ Endpoint de mise à jour du profil implémenté avec validation des champs
- ✅ Sécurité admin appliquée sur tous les nouveaux endpoints
- ✅ Tests d'intégration complets couvrant tous les cas d'usage (8/8 tests passés)
- ✅ Gestion des erreurs et validation des données implémentée
- ✅ Warnings de dépréciation corrigés (datetime.utcnow() → datetime.now(timezone.utc))
- ✅ Code propre et conforme aux standards

### File List
- **Créé** : `api/src/recyclic_api/models/user_status_history.py`
- **Créé** : `api/migrations/versions/69dba742f15b_add_user_status_history_table_only.py`
- **Créé** : `api/tests/api/test_admin_user_management.py`
- **Modifié** : `api/src/recyclic_api/models/__init__.py`
- **Modifié** : `api/src/recyclic_api/models/user.py` (ajout relation)
- **Modifié** : `api/src/recyclic_api/schemas/admin.py` (nouveaux schémas)
- **Modifié** : `api/src/recyclic_api/api/api_v1/endpoints/admin.py` (nouveaux endpoints)
- **Corrigé** : `api/src/recyclic_api/core/audit.py` (warnings datetime)
- **Corrigé** : `api/src/recyclic_api/services/email_webhook_service.py` (warnings datetime)
- **Corrigé** : `api/src/recyclic_api/models/cash_session.py` (warnings datetime)

### Change Log
- 2025-09-18 : Implémentation complète de la story 5.4.1
  - Création du modèle UserStatusHistory avec migration
  - Ajout des endpoints PUT /users/{user_id}/status et PUT /users/{user_id}
  - Implémentation de la sécurité admin et des tests d'intégration
  - Tous les critères d'acceptation respectés
  - Tests d'intégration : 8/8 passés avec succès
  - Correction des warnings de dépréciation datetime
  - Code propre et conforme aux standards

### Status
Ready for Review

## QA Results

### Review Date: 2025-01-12

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Excellente implémentation avec une architecture solide et une couverture de tests complète. Le code respecte les standards du projet et implémente correctement tous les critères d'acceptation. La gestion de la sécurité et de l'audit trail est particulièrement bien réalisée.

### Refactoring Performed

Aucun refactoring nécessaire - le code est déjà bien structuré et optimisé.

### Compliance Check

- Coding Standards: ✓ Code propre et conforme aux standards FastAPI/SQLAlchemy
- Project Structure: ✓ Respecte l'architecture du projet avec séparation claire des responsabilités
- Testing Strategy: ✓ Tests d'intégration complets couvrant tous les cas d'usage
- All ACs Met: ✓ Tous les critères d'acceptation sont implémentés et testés

### Improvements Checklist

- [x] Architecture solide avec modèle UserStatusHistory bien conçu
- [x] Sécurité robuste avec protection admin et validation appropriée
- [x] Tests complets couvrant succès, erreurs et cas limites
- [x] Gestion d'erreurs claire avec messages informatifs
- [x] Audit trail complet pour traçabilité des changements

### Security Review

✓ Excellente sécurité :
- Protection admin via `require_admin_role()`
- Prévention de l'auto-désactivation
- Validation des données d'entrée
- Logging des actions administratives

### Performance Considerations

✓ Performance adéquate :
- Requêtes SQL optimisées avec index appropriés
- Pas de requêtes N+1 identifiées
- Gestion efficace des transactions

### Files Modified During Review

Aucun fichier modifié - le code est déjà de qualité production.

### Gate Status

Gate: PASS → docs/qa/gates/5.4.1-backend-user-management.yml
Risk profile: Faible risque - fonctionnalité administrative standard
NFR assessment: Tous les NFRs respectés (sécurité, performance, fiabilité)

### Recommended Status

✓ Ready for Done - Implémentation complète et de qualité production
