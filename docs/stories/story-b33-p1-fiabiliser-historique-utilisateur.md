# Story b33-p1: Fiabiliser l'Historique Utilisateur

**Statut:** Prêt pour développement
**Épopée:** [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md)
**PO:** Sarah

## 1. Contexte

L'investigation initiale a révélé que l'onglet "Historique" dans les détails d'un utilisateur en mode admin n'affiche pas de données réelles. Il utilise un service frontend qui retourne des données simulées (`mock data`), ce qui rend la fonctionnalité inutile et trompeuse. Le backend, cependant, dispose d'un service et d'un point d'API complets et fonctionnels pour fournir ces informations.

Cette story a pour but de corriger ce bug en connectant l'interface utilisateur à la source de données réelle.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, je veux **consulter l'historique d'activité réel et précis** d'un utilisateur afin de pouvoir suivre ses actions, diagnostiquer des problèmes ou comprendre son parcours sur la plateforme.

## 3. Critères d'acceptation

1.  La fonction `getUserHistory` dans `frontend/src/services/adminService.ts` DOIT être modifiée.
2.  Elle NE DOIT PLUS retourner de données simulées.
3.  Elle DOIT appeler le point d'API backend `GET /v1/admin/users/{user_id}/history` en utilisant le client API généré.
4.  Les filtres (par date, type d'événement) de l'interface utilisateur DOIVENT être correctement passés à l'appel API.
5.  La pagination (chargement de plus d'événements) DOIT fonctionner comme prévu.
6.  Les données retournées par l'API (description de l'événement, date, métadonnées) DOIVENT être correctement affichées dans la timeline de l'historique.
7.  En cas d'erreur lors de l'appel API, un message clair DOIT être affiché à l'utilisateur.

## 4. Prérequis de Test

Pour valider cette story, des comptes de test avec différents niveaux de privilèges sont nécessaires.

- **Mot de passe commun :** `Test1234!`
- **Compte Admin :** `admintest1` (Nécessaire pour accéder à `/admin/users`)

*(Note: La pertinence de chaque compte dépend des critères d'acceptation spécifiques à la story.)*

## 5. Conseils pour l'Agent DEV

- **Contexte Général :** Cette story fait partie de l'Épique [b33: Refonte IAM](../epics/epic-b33-iam-refonte.md). Il est conseillé de lire le document de l'Épique pour comprendre la vision d'ensemble.
- **Conseil Spécifique :** Le point d'API `GET /v1/admin/users/{user_id}/history` est déjà fonctionnel et documenté dans OpenAPI. Le travail est purement côté frontend. Concentrez-vous sur la modification de `adminService.ts`.

## 6. Notes Techniques

-   **Fichier clé à modifier :** `frontend/src/services/adminService.ts`
-   **Composant React impacté :** `frontend/src/components/business/UserHistoryTab.tsx`
-   **Endpoint API à utiliser :** `GET /v1/admin/users/{user_id}/history`
-   Le service `UserHistoryService` du backend est la source de vérité et semble complet. Aucune modification backend n'est prévue pour cette story.
-   Il faudra s'assurer que le mapping entre les types de données de l'API (`UserHistoryResponse`, `ActivityEvent`) et les types du store frontend (`HistoryEvent`) est correct.
