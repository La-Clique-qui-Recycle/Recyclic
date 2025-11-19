# Story (Dette Technique): Correction des Tests admin_pending_endpoints

**ID:** STORY-TECH-DEBT-ADMIN-PENDING-TESTS
**Titre:** Correction des Tests admin_pending_endpoints suite à la stabilisation de l'authentification
**Epic:** Maintenance & Dette Technique
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Développeur,  
**Je veux** que les tests `admin_pending_endpoints` passent avec succès,  
**Afin de** rétablir la fiabilité de la suite de tests et de garantir la qualité des fonctionnalités d'administration des utilisateurs.

## Contexte

Suite à la stabilisation des tests backend (story `b03-p1`), 13 tests dans `admin_pending_endpoints` sont en échec. Cela est dû au changement de la dépendance d'authentification de `require_admin_role_strict()` à `require_admin_role()`, qui nécessite une adaptation des mocks utilisés dans ces tests.

## Critères d'Acceptation

1.  Tous les tests dans `api/tests/test_admin_pending_endpoints.py` passent avec succès.
2.  Les mocks d'authentification sont adaptés pour être compatibles avec la fonction `require_admin_role()`.
3.  Aucune régression n'est introduite dans les fonctionnalités d'administration des utilisateurs.

## Notes Techniques

-   L'agent DEV devra analyser `api/tests/test_admin_pending_endpoints.py` pour identifier les mocks d'authentification à adapter.
-   Il est probable que les `dependency_overrides` doivent être ajustés pour simuler correctement un utilisateur avec le rôle `ADMIN` ou `SUPER_ADMIN` pour la nouvelle fonction `require_admin_role()`.

## Definition of Done

- [ ] Tous les tests `admin_pending_endpoints` passent.
- [ ] Les mocks sont correctement adaptés.
- [ ] La story a été validée par le Product Owner.
