# Test Design – STORY-B13-P3-SESSION-MANAGER

## Scope
- KPIs `stats/summary` (CA, nb ventes, poids, dons, nb sessions)
- Filtres combinés (date_from/date_to, site_id, operator_id, search)
- Permissions (admin-only sur stats/détail/export)
- Navigation et export CSV

## Suites
- Unit/Integration Backend: `api/tests/test_cash_sessions_*.py`
- Frontend: `frontend/src/test/pages/SessionManager.test.tsx`

## E2E Minimal (à faire ultérieurement)
- Charger liste avec filtres combinés et naviguer vers détail
- Vérifier export CSV lien présent


