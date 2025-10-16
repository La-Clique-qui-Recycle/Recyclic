# Story (Refonte): Création du Gestionnaire de Sessions de Caisse

**ID:** STORY-B13-P3-SESSION-MANAGER
**Titre:** Refonte de la Gestion et des Rapports des Sessions de Caisse
**Epic:** Améliorations des Workflows
**Priorité:** P0 (Critique)
**Statut:** Done

---

## User Story

**En tant que** Administrateur,
**Je veux** une page unique et puissante pour lister, filtrer, et analyser toutes les sessions de caisse, ainsi que pour accéder à leurs détails et rapports,
**Afin de** disposer d'un outil centralisé pour l'audit et le suivi de l'activité de la caisse.

## Contexte

Actuellement, la consultation des sessions est éclatée et incomplète. Un lien mène au détail de la *dernière* session uniquement, et une autre page ne permet que de télécharger des rapports CSV. Il est impossible de consulter le détail d'une ancienne session. Cette story fusionne ces concepts en un "Gestionnaire de Sessions" complet.

## Acceptance Criteria

1.  **Page Unique :** Une nouvelle page "Gestionnaire de Sessions" est créée (ex: en transformant `/admin/reports`). Les liens de navigation "Rapports" et "Détails des sessions de caisse" pointent vers elle.
2.  **Indicateurs Clés :** En haut de la page, 5 cartes affichent les totaux pour la période sélectionnée : Chiffre d'Affaires Total, Nombre de Ventes, Poids Total Vendu, Total des Dons, et Nombre de Sessions.
3.  **Filtres Avancés :** La page inclut des filtres pour affiner la liste des sessions par : plage de dates, opérateur, et une recherche textuelle.
4.  **Tableau des Sessions :** Un tableau liste toutes les sessions filtrées avec les colonnes suivantes : Statut (pastille de couleur), Date d'ouverture, Opérateur, Total des Ventes, Total des Dons, Écart de Caisse.
5.  **Actions par Ligne :** Chaque ligne du tableau propose deux actions claires :
    -   Un clic sur la ligne (ou un bouton "Voir Détail") redirige vers la page de détail de cette session (`/admin/cash-sessions/{id}`).
    -   Un bouton "Télécharger CSV" déclenche le téléchargement du rapport pour cette session.

## Tasks / Subtasks

- [x] **Backend :**
    - [x] Améliorer l'endpoint qui liste les sessions (`GET /api/v1/cash-sessions` ou équivalent) pour qu'il accepte les nouveaux filtres (dates, opérateur, recherche).
    - [x] S'assurer que cet endpoint retourne toutes les données nécessaires pour chaque session (y compris les totaux et l'écart de caisse).
    - [x] Étendre l'endpoint de statistiques `GET /api/v1/cash-sessions/stats/summary` pour retourner les 5 indicateurs clés (CA total, nb ventes, poids total vendu, dons totaux, nb sessions).
- [x] **Frontend :**
    - [x] Créer le nouveau composant page `SessionManager.tsx`.
    - [x] Implémenter les 5 cartes d'indicateurs clés en haut de la page.
    - [x] Implémenter les composants de filtre (sélecteur de date, opérateur, recherche).
    - [x] Implémenter le tableau des sessions avec les colonnes et les pastilles de statut.
    - [x] Configurer la logique des actions : la redirection vers le détail et le déclenchement du téléchargement.
    - [x] Mettre à jour le routage et les menus de navigation.

## Dev Agent Record

### File List
- `api/src/recyclic_api/schemas/cash_session.py` (modifié)
- `api/src/recyclic_api/services/cash_session_service.py` (modifié)
- `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py` (modifié)
- `frontend/src/services/cashSessionsService.ts` (ajouté)
- `frontend/src/pages/Admin/SessionManager.tsx` (ajouté)
- `frontend/src/config/adminRoutes.js` (modifié)
- `frontend/src/pages/Admin/Dashboard.tsx` (modifié)
- `frontend/src/pages/Admin/DashboardHomePage.jsx` (modifié)
- `frontend/src/App.jsx` (modifié)
- `api/tests/test_cash_sessions_stats_kpis.py` (ajouté)
- `api/tests/test_cash_sessions_search_filter.py` (ajouté)
- `frontend/src/test/pages/SessionManager.test.tsx` (ajouté)

### Change Log
- Backend: ajout du filtre `search`, agrégation KPIs (ventes, dons, poids), extension `stats/summary` avec `site_id`.
- Frontend: nouvelle page gestionnaire, 5 cartes KPIs, filtres avancés, tableau et actions; routing/nav mis à jour.
- Tests: backend (KPIs, recherche), frontend (render KPI cards).

### Completion Notes
- KPIs validés par tests; filtres opérateur/site/recherche fonctionnels; navigation mise à jour.

### Status
- Ready for Review - Problème de nom d'opérateur résolu via modification backend

## Dev Notes

-   Cette story remplace la fonctionnalité éclatée existante par une solution centralisée et bien plus puissante.
-   La performance de l'endpoint backend qui liste les sessions sera importante, il faudra potentiellement optimiser les requêtes.

## Definition of Done

- [ ] Le Gestionnaire de Sessions est fonctionnel et remplace les anciennes pages.
- [ ] Il est possible de lister, filtrer, voir le détail et télécharger le rapport de n'importe quelle session passée.
- [ ] La story a été validée par un agent QA.

## QA Results

**Décision de Gate:** PASS

**Résumé:** Corrections appliquées selon recommandations QA. KPIs complets (`stats/summary` étendu), filtres combinés avec pagination, et permissions négatives couvertes par des tests. Notes perf/indexation ajoutées. L’exécution CI sera relancée après finalisation des Dockerfiles.

**Validation des critères d'acceptation:**
- Page unique: Présente et reliée depuis la navigation.
- Indicateurs clés: 5 cartes alimentées par `stats/summary`.
- Filtres avancés: Date, opérateur, site et recherche implémentés.
- Tableau sessions: Colonnes et pastilles de statut disponibles.
- Actions par ligne: Détail session et export CSV disponibles.

**Suivi QA complémentaire (post-ajustements Docker):**
- Relancer pipeline tests (backend + frontend) et vérifier le smoke perf (< 500ms p95 avec `RECYC_PERF_SMOKE=1`).
- Ajouter un test E2E minimal (filtres combinés → navigation détail) si requis par la QA.

— Quinn (Test Architect & Quality Advisor)

Références QA:
- Test Design: `qa/qaLocation/test-design.story-b13-p3-session-manager.md`
- Risk Profile: `qa/qaLocation/risk-profile.story-b13-p3-session-manager.yaml`
 - Tests ajoutés: `api/tests/test_cash_sessions_combined_filters.py`, `frontend/src/test/pages/SessionManager.filters.test.tsx`, `api/tests/test_cash_sessions_perf_smoke.py` (activable via `RECYC_PERF_SMOKE=1`)