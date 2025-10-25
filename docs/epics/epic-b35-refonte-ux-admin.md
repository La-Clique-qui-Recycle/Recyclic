# Épopée b35: Refonte UX du Dashboard Admin

**PO:** Sarah
**Statut:** À faire

## 1. Objectif (Goal)

Transformer la page d'accueil de l'administration (`/admin`) d'un simple hub de liens statiques en un véritable "poste de pilotage" (dashboard) dynamique et intuitif. L'objectif est de réduire la charge cognitive, de prioriser les actions les plus fréquentes et de fournir aux administrateurs une vue d'ensemble efficace de l'état du système, en se basant sur la proposition de redesign de Sally (story `b34-p37`).

## 2. Périmètre et Stories Clés

Cette épopée sera découpée en plusieurs phases. La première phase se concentre sur la mise en place des fondations et de la vue "Admin".

### Phase 1 : Les Fondations et la Vue "Admin"

*   **b35-p1:** Mettre en place le layout du nouveau dashboard admin (structure des zones).
*   **b35-p2:** Créer un endpoint API unifié pour le dashboard.
*   **b35-p3:** Développer le widget "Utilisateurs Récents" avec assignation de groupe.

*(D'autres stories pour les widgets de statistiques, la vue Super-Admin, etc., seront ajoutées dans les phases ultérieures.)*

## 3. Critères de Succès de l'Épopée

L'épopée sera considérée comme un succès lorsque :
- La nouvelle page d'accueil `/admin` sera entièrement fonctionnelle et remplacera l'ancienne.
- L'interface sera différenciée pour les rôles `admin` et `super-admin`.
- Les points de friction majeurs identifiés par l'audit UX (notamment l'assignation des groupes) seront résolus.
- Les administrateurs disposeront d'une vue d'ensemble claire et actionnable dès leur connexion.
