# Story b35-p2: Créer un endpoint API unifié pour le dashboard

**Statut:** ❌ Annulée - Non nécessaire pour la Phase 1

## 1. Contexte

Cette story visait à créer un endpoint API unifié pour le nouveau dashboard admin. Cependant, une analyse des endpoints existants a montré que les données nécessaires pour les widgets de la Phase 1 (statistiques du jour, utilisateurs récents) peuvent être obtenues en utilisant des endpoints existants.

Pour accélérer le développement, la décision a été prise de réutiliser les endpoints existants pour la Phase 1 et de reconsidérer la création d'un endpoint unifié dans une phase ultérieure si les performances le justifient.

## 2. User Story (En tant que...)

En tant que **Développeur Frontend**, je veux **disposer d'un seul endpoint API qui me fournit toutes les données agrégées nécessaires pour le dashboard admin**, afin de construire une interface rapide, réactive, et facile à maintenir.

## 3. Critères d'Acceptation

1.  Un nouvel endpoint `GET /v1/admin/dashboard-summary` DOIT être créé.
2.  Cet endpoint DOIT être accessible uniquement aux utilisateurs ayant le rôle `admin` ou `super-admin`.
3.  La réponse de cet endpoint DOIT être un objet JSON contenant au minimum les informations suivantes pour la journée en cours :
    *   `daily_revenue`: Le chiffre d'affaires total du jour.
    *   `daily_weight_received`: Le poids total reçu pour la journée.
    *   `daily_tickets_created`: Le nombre total de tickets de dépôt créés.
    *   `open_cash_sessions_count`: Le nombre de sessions de caisse actuellement ouvertes.
4.  Les calculs effectués par cet endpoint DOIVENT être optimisés pour être aussi rapides que possible (éviter les N+1 queries).

## 4. Solution Technique Recommandée

-   **Fichier à créer/modifier :** Un nouveau service, par exemple `AdminDashboardService`, pourrait être créé pour contenir la logique métier.
-   L'endpoint serait ajouté dans un fichier approprié, comme `api/src/recyclic_api/api/api_v1/endpoints/admin.py`.
-   **Logique de service :** Le service devra interroger les modèles `CashSession`, `TicketDepot`, etc., en filtrant par la date du jour (`today`) pour agréger les données.
-   **Schéma de réponse :** Un nouveau schéma Pydantic devra être créé pour définir la structure de la réponse.

## 5. Prérequis de Test

-   L'agent devra créer un test d'intégration pour ce nouvel endpoint.
-   Le test devra vérifier que l'endpoint est bien protégé par une authentification admin.
-   Le test devra vérifier que la structure de la réponse est correcte et que les types de données sont les bons.
