# Test Design — STORY-B13-P3 Session Manager

ID: STORY-B13-P3-SESSION-MANAGER
Epic: Améliorations des Workflows
Gate Decision: CONCERNS (en cours de consolidation)
Reviewer: Quinn (Test Architect & Quality Advisor)
Date: 2025-10-16

## 1. Portée
- Frontend: `SessionManager.tsx`, routage admin, cartes KPIs, filtres, tableau, actions (détail, CSV)
- Backend: `GET /api/v1/cash-sessions`, `GET /api/v1/cash-sessions/stats/summary`, export CSV par session

## 2. Hypothèses
- Permissions: accès restreint ADMIN/SUPER_ADMIN.
- Données de test disponibles couvrant multiples opérateurs, sites, périodes.
- Export CSV stable et idempotent.

## 3. Couverture des critères d’acceptation
- AC1 Page unique: TD-B13-P3-UI-ROUTE
- AC2 5 KPIs: TD-B13-P3-KPI-SUMMARY
- AC3 Filtres avancés: TD-B13-P3-FILTERS-BASIC, TD-B13-P3-FILTERS-COMBINED
- AC4 Tableau sessions: TD-B13-P3-TABLE-COLUMNS
- AC5 Actions ligne: TD-B13-P3-ROW-ACTIONS-DETAIL, TD-B13-P3-ROW-ACTIONS-CSV

## 4. Scénarios Given-When-Then

### TD-B13-P3-UI-ROUTE
Given un admin connecté
When il navigue vers /admin/session-manager (ou route équivalente)
Then la page « Gestionnaire de Sessions » s’affiche et les liens Rapports/Détails y pointent

### TD-B13-P3-KPI-SUMMARY
Given un dataset avec ventes, dons et poids
When la page charge les KPIs via stats/summary (site_id, période)
Then 5 cartes affichent: CA total, nb ventes, poids total, dons totaux, nb sessions

### TD-B13-P3-FILTERS-BASIC
Given un admin sur la page
When il filtre par plage de dates OU opérateur OU recherche
Then la liste des sessions se met à jour en conséquence et les KPIs reflètent le filtre

### TD-B13-P3-FILTERS-COMBINED
Given un admin sur la page
When il applique simultanément dateFrom/dateTo + operatorId + search
Then la liste et les KPIs reflètent tous les filtres (intersection) et la pagination reste cohérente

### TD-B13-P3-TABLE-COLUMNS
Given des sessions retournées
When le tableau s’affiche
Then les colonnes incluent statut (pastille), date d’ouverture, opérateur, total ventes, total dons, écart de caisse

### TD-B13-P3-ROW-ACTIONS-DETAIL
Given une session listée
When l’admin clique la ligne ou « Voir Détail »
Then il est redirigé vers /admin/cash-sessions/{id} et le détail est visible

### TD-B13-P3-ROW-ACTIONS-CSV
Given une session listée
When l’admin clique « Télécharger CSV »
Then le téléchargement démarre, le fichier contient des entêtes/valeurs attendues, statut HTTP 200

### TD-B13-P3-PERMISSIONS-NEGATIVE (BACKEND/UI)
Given un utilisateur non-admin
When il tente d’accéder à la page, la liste, le détail ou l’export
Then l’accès est refusé (401/403 côté API, redirection/erreur côté UI)

### TD-B13-P3-PERF-SMOKE
Given un dataset volumineux indexé
When un filtre typique est appliqué
Then temps de réponse liste < 500ms p95 et rendu UI acceptable

## 5. Données de test minimales
- 2 sites, 3 opérateurs, 50+ sessions, répartition sur 90 jours
- Sessions avec et sans dons, écarts de caisse variés

## 6. Oracles et validations CSV
- Encodage UTF-8, séparateur standard, en-têtes stables
- Totaux par session concordants avec KPIs agrégés

## 7. Automatisation (cibles)
- Backend: tests d’intégration filtres combinés + permissions négatives
- Frontend: tests RTL pour filtres/affichages, e2e pour navigation et CSV


