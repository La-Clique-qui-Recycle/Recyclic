# Story (Feature): Connecter le Tableau de Bord Principal aux KPIs Existants

**ID:** STORY-FEAT-MAIN-DASHBOARD
**Titre:** Connecter le Tableau de Bord Principal aux KPIs de Vente et de Réception
**Epic:** Améliorations des Workflows
**Priorité:** P1 (Élevée)
**Statut:** Approuvée

---

## User Story

**En tant qu'** Utilisateur,
**Je veux** que la page d'accueil affiche des indicateurs clés réels et pertinents sur l'activité de la ressourcerie,
**Afin d'** avoir une vision d'ensemble immédiate des flux entrants et sortants.

## Contexte

Actuellement, la page d'accueil (`Dashboard.jsx`) affiche 4 cartes avec des données statiques à zéro. Cependant, l'API expose déjà des endpoints de statistiques pour les ventes et la réception. Cette story a pour but de connecter la page d'accueil à ces données réelles pour la transformer en un véritable tableau de bord.

## Acceptance Criteria

1.  Les cartes statiques de la page `Dashboard.jsx` sont supprimées.
2.  Un filtre de plage de dates est ajouté en haut de la page.
3.  Une section "Ventes (Sorties)" est créée et affiche au moins 3 KPIs issus de l'endpoint `GET /api/v1/cash-sessions/stats/summary` : Chiffre d'Affaires, Total des Dons, et Poids Vendu.
4.  Une section "Réception (Entrées)" est créée et affiche au moins 2 KPIs issus de l'endpoint `GET /api/v1/stats/reception/summary` : Poids Reçu et Articles Reçus.
5.  Les données affichées sont mises à jour en fonction de la plage de dates sélectionnée.
6.  Des états de chargement sont visibles pendant la récupération des données.

## Tasks / Subtasks

- [ ] **Backend (Vérification) :**
    - [ ] S'assurer que les endpoints `GET /api/v1/cash-sessions/stats/summary` et `GET /api/v1/stats/reception/summary` sont accessibles publiquement ou avec un rôle utilisateur de base.
- [ ] **Frontend (`Dashboard.jsx`) :**
    - [ ] Supprimer les 4 composants `StatCard` existants.
    - [ ] Ajouter un composant de sélection de plage de dates (ex: de la librairie Mantine).
    - [ ] Créer un état pour gérer la plage de dates sélectionnée.
    - [ ] Implémenter la logique d'appel à l'API pour `cash-sessions/stats/summary` :
        -   Utiliser `react-query` ou un `useEffect` pour déclencher l'appel.
        -   Passer la plage de dates en paramètres.
        -   Afficher les 3 KPIs (Ventes, Dons, Poids Vendu) dans de nouveaux composants `StatCard`.
    - [ ] Implémenter la logique d'appel à l'API pour `reception/stats/summary` :
        -   Déclencher l'appel en même temps que le précédent.
        -   Passer la plage de dates en paramètres.
        -   Afficher les 2 KPIs (Poids Reçu, Articles Reçus) dans de nouveaux composants `StatCard`.
    - [ ] Gérer les états de chargement et d'erreur pour les deux appels API.

## Dev Notes

-   Cette story a un excellent retour sur investissement car elle réutilise des endpoints backend déjà existants pour transformer une page factice en une fonctionnalité de grande valeur.
-   L'utilisation de `Promise.all` pour lancer les deux appels API en parallèle est une bonne pratique pour optimiser le temps de chargement.

## Definition of Done

- [ ] La page d'accueil affiche des KPIs réels et filtrables pour les ventes et la réception.
- [ ] Les anciennes cartes statiques ont disparu.
- [ ] La story a été validée par un agent QA.