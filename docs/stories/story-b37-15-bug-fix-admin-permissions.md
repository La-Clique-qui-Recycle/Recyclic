# Story b37-15: Bug: Les administrateurs n'ont pas les permissions d'édition nécessaires

**Statut:** Prêt pour développement
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Critique

## 1. Contexte

Le PO a identifié un problème de permission critique : les utilisateurs avec le rôle `admin` n'ont pas accès à des fonctions d'édition et de suppression de base (par exemple, sur les lignes de dépôt), qui semblent être réservées à tort au rôle `super-admin`. Cela empêche les administrateurs d'effectuer leurs tâches quotidiennes.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **avoir les mêmes droits d'édition et de suppression que les super-admins sur les fonctionnalités opérationnelles**, afin de pouvoir gérer efficacement l'application sans avoir besoin d'une élévation de privilèges non nécessaire.

## 3. Critères d'Acceptation

1.  Une revue complète des endpoints de l'API DOIT être effectuée pour identifier toutes les routes dont l'accès est restreint à `require_super_admin_role` ou `require_role_strict(UserRole.SUPER_ADMIN)`.
2.  Pour chaque endpoint identifié, une décision DOIT être prise pour déterminer si la restriction est justifiée (ex: actions très destructrices ou de configuration système) ou si elle doit être étendue au rôle `admin`.
3.  Tous les endpoints liés à des opérations de gestion courante (création, édition, suppression de catégories, de lignes de dépôt, etc.) DOIVENT être accessibles aux utilisateurs ayant le rôle `admin`.
4.  Le décorateur de permission pour ces endpoints DOIT être changé de `require_super_admin_role` à `require_admin_role` (ou l'équivalent qui inclut les deux rôles).

## 4. Solution Technique Recommandée

-   **Analyse :** L'agent devra utiliser une recherche globale dans le code (`grep` ou équivalent) pour trouver toutes les occurrences de `require_super_admin_role` et `require_role_strict(UserRole.SUPER_ADMIN)` dans le dossier `api/src/recyclic_api/api/api_v1/endpoints/`.
-   **Correction :** Pour chaque endpoint qui doit être accessible aux admins, remplacer le décorateur par `require_admin_role` ou `require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN])`.
-   **Fichiers probables à modifier :** `categories.py`, `reception.py`, etc.

## 5. Prérequis de Test

- Se connecter avec un compte `admin` (`admintest1`).
- Essayer d'effectuer des actions qui étaient auparavant bloquées (ex: supprimer une ligne de dépôt, modifier une catégorie).
- **Vérification :** Les actions doivent maintenant réussir.
- Se connecter avec un compte `user` (`usertest1`).
- **Vérification :** Les actions doivent toujours être bloquées pour les utilisateurs non-admin.
