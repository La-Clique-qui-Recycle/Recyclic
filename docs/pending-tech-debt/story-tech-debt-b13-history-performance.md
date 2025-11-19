---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.786773
original_path: docs/stories/story-tech-debt-b13-history-performance.md
---

# Story (Dette Technique): Amélioration de la Performance de l'Historique des Sessions

**ID:** STORY-TECH-DEBT-B13-HISTORY-PERF
**Titre:** Amélioration de la Performance de l'Historique des Sessions de Caisse
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Basse)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** optimiser le chargement et l'affichage de l'historique des sessions de caisse,
**Afin de** garantir une expérience utilisateur fluide même avec un grand volume de données.

## Acceptance Criteria

1.  L'API qui retourne les détails d'une session (`GET /api/v1/cash-sessions/{id}`) utilise la pagination pour la liste des ventes.
2.  L'interface de la page `CashSessionDetail.tsx` implémente un mécanisme de chargement progressif (infinite scroll) ou des boutons de pagination pour naviguer dans le journal des ventes.
3.  (Optionnel) Un cache côté serveur (ex: Redis) est mis en place sur les endpoints de l'historique pour accélérer les requêtes fréquentes.

## Tasks / Subtasks

- [ ] **Backend (Pagination) :**
    - [ ] Modifier l'endpoint `GET /api/v1/cash-sessions/{id}` pour qu'il accepte des paramètres de pagination (ex: `page`, `size`).
    - [ ] Adapter la requête en base de données pour qu'elle n'utilise `LIMIT` et `OFFSET` que pour récupérer une partie des ventes.
- [ ] **Frontend (Pagination) :**
    - [ ] Modifier la page `CashSessionDetail.tsx` pour gérer la pagination.
    - [ ] Ajouter des boutons "Suivant"/"Précédent" ou un système de défilement infini pour charger les pages de ventes suivantes.
- [ ] **Backend (Cache - Optionnel) :**
    - [ ] Intégrer Redis au projet.
    - [ ] Mettre en place une stratégie de cache sur les endpoints `GET /api/v1/cash-sessions` et `GET /api/v1/cash-sessions/{id}`.

## Dev Notes

-   Cette story est issue des recommandations de QA de la story `STORY-B13-P2`.
-   La pagination est l'amélioration la plus importante. Le cache Redis est une optimisation supplémentaire qui peut être faite si le gain de performance est jugé nécessaire.

## Definition of Done

- [ ] La pagination est fonctionnelle sur le journal des ventes.
- [ ] La story a été validée par un agent QA.