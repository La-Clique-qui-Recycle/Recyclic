# Story: TECH-DEBT - Robustesse de l'API Réception

**User Story**
En tant que mainteneur du système,
Je veux que l'API de réception soit plus robuste et gère mieux les cas limites,
Afin de prévenir les erreurs inattendues et d'améliorer la fiabilité globale.

**Contexte**

Lors de la revue de la story `story-be-api-postes-tickets.md`, l'agent QA a validé la fonctionnalité de base mais a recommandé plusieurs améliorations pour renforcer l'API.

**Critères d'Acceptation / Tâches**

1.  **Gestion des Erreurs d'Auth :**
    *   Différencier clairement les réponses `401 Unauthorized` (non authentifié) et `403 Forbidden` (authentifié mais pas les droits).

2.  **Gestion des Cas Limites :**
    *   S'assurer qu'un code d'erreur clair (ex: `404 Not Found`) est retourné si on essaie d'agir sur un `poste_id` ou `ticket_id` qui n'existe pas ou qui est déjà fermé.

3.  **Gestion de la Concurrence :**
    *   Implémenter un mécanisme de verrouillage (optimiste ou pessimiste) pour empêcher les conditions de course, notamment si deux utilisateurs essaient de fermer le même poste simultanément.

4.  **Documentation :**
    *   Mettre à jour la documentation OpenAPI (Swagger/Redoc) pour tous les nouveaux endpoints de réception, en détaillant les modèles de données et les codes de retour possibles.

5.  **Validations au niveau de la Base de Données :**
    *   Ajouter des contraintes (`CHECK`) ou des règles au niveau de la base de données pour renforcer l'intégrité des données (ex: un ticket ne peut pas avoir un `closed_at` antérieur à son `created_at`).

**Priorité :** Moyenne (à traiter après le MVP initial).
