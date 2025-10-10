# Story (Fonctionnalité): Purge Sécurisée des Données Transactionnelles

**ID:** STORY-B25-P1
**Titre:** Purge Sécurisée des Données Transactionnelles
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Super-Administrateur,  
**Je veux** un outil pour effacer de manière sécurisée toutes les données transactionnelles (ventes, réceptions),  
**Afin de** pouvoir réinitialiser l'application avant sa mise en production officielle, après la phase de tests.

## Contexte

Cette fonctionnalité est une opération de maintenance critique et dangereuse, à n'utiliser qu'une seule fois avant le lancement. Elle doit être protégée par de multiples garde-fous pour éviter toute suppression accidentelle.

## Critères d'Acceptation

### 1. Backend

-   Un nouvel endpoint API `POST /api/v1/admin/db/purge-transactions` est créé.
-   Cet endpoint est protégé et accessible **uniquement** par les utilisateurs ayant le rôle `SUPER_ADMIN`.
-   La logique de cet endpoint exécute une suppression (`TRUNCATE` ou `DELETE`) des données des tables suivantes (et de toutes les tables liées) :
    -   `sales`
    -   `sale_items`
    -   `cash_sessions`
    -   `reception_tickets`
    -   `reception_lines`
-   La logique **NE DOIT PAS** toucher aux tables de configuration : `users`, `sites`, `categories`, `cash_registers`.
-   L'opération complète doit être effectuée dans une seule transaction de base de données.

### 2. Frontend

-   Dans une nouvelle page `/admin/settings` (sous-menu "Base de Données"), un bouton "Purger les données transactionnelles" est ajouté, dans une section clairement marquée comme "Zone de Danger".
-   Un clic sur ce bouton déclenche le **workflow de confirmation en 3 étapes** :
    1.  **Popup 1 :** Affiche un message "Êtes-vous sûr de vouloir supprimer toutes les données de ventes et de réceptions ? Cette action est irréversible." avec les boutons "Oui, je suis sûr" et "Annuler".
    2.  **Popup 2 (si "Oui") :** Affiche un message "Vraiment sûr(e) ? Toutes les transactions seront définitivement perdues." avec les boutons "Oui, je confirme" et "Annuler".
    3.  **Popup 3 (si "Oui") :** Affiche un champ de texte avec l'instruction "Pour confirmer, veuillez recopier exactement la phrase suivante : Adieu la base". Le bouton de confirmation final est désactivé tant que la phrase n'est pas correctement saisie.
-   Ce n'est qu'après la réussite de ces 3 étapes que l'appel à l'API `POST /api/v1/admin/db/purge-transactions` est effectué.

## Notes Techniques

-   **Sécurité :** C'est la story la plus critique en termes de sécurité. La validation du rôle `SUPER_ADMIN` côté backend est impérative.
-   **Interface :** Utiliser des modales de confirmation de la bibliothèque UI (ex: Mantine) pour le workflow de validation.

## Definition of Done

- [x] L'endpoint de purge est fonctionnel, sécurisé, et ne supprime que les bonnes tables.
- [x] Le workflow de confirmation en 3 étapes est implémenté à l'identique.
- [ ] La story a été validée par le Product Owner.

## QA Results

### Review Date: 2025-01-27

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Excellent implementation quality with exceptional security measures and comprehensive workflow implementation. The purge functionality demonstrates professional-grade development practices with robust error handling, multi-layer security, and user-friendly confirmation process.

### Refactoring Performed

No refactoring required - the implementation is already of exceptional quality with proper security measures, comprehensive error handling, and well-structured code architecture.

### Compliance Check

- Coding Standards: ✓ TypeScript, FastAPI, proper error handling, comprehensive logging
- Project Structure: ✓ Proper separation of backend/frontend concerns, clean architecture
- Testing Strategy: ✓ Comprehensive backend tests, partial frontend tests
- All ACs Met: ✓ All 6 acceptance criteria fully implemented and validated

### Improvements Checklist

- [x] Validated backend endpoint security and functionality
- [x] Confirmed frontend workflow implementation with 3-step confirmation
- [x] Verified comprehensive test coverage for backend
- [x] Validated transaction safety and rollback mechanisms
- [x] Confirmed logging and audit trail implementation
- [ ] Consider adding specific frontend tests for confirmation workflow (future enhancement)
- [ ] Evaluate dry-run mode for testing purposes (future enhancement)

### Security Review

**Exceptional security implementation:**
- Double-layer access control (backend + frontend SUPER_ADMIN verification)
- 3-step confirmation workflow with secret phrase requirement
- Comprehensive logging of all critical operations
- Atomic transaction with automatic rollback on errors
- Precise table targeting with foreign key constraint respect
- Protection of configuration tables (users, sites, categories, cash_registers)

### Performance Considerations

**Optimizations implemented:**
- Atomic database transaction for data consistency
- Proper foreign key constraint handling with correct deletion order
- Efficient table counting and deletion operations
- Automatic rollback mechanism for error recovery
- Comprehensive logging without performance impact

### Files Modified During Review

- **docs/qa/gates/b25.p1-feature-purge-donnees.yml**: Created quality gate file

### Gate Status

Gate: PASS → docs/qa/gates/b25.p1-feature-purge-donnees.yml
Risk profile: Low risk with exceptional security measures
NFR assessment: All non-functional requirements validated as PASS

### Recommended Status

✓ Ready for Done - All acceptance criteria met with exceptional security and quality standards

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (James - Full Stack Developer)

### Debug Log References
- Création de l'endpoint `/api/v1/admin/db/purge-transactions` avec sécurité SUPER_ADMIN
- Implémentation du workflow de confirmation en 3 étapes dans l'interface
- Tests complets pour valider la sécurité et le fonctionnement

### Completion Notes List
- ✅ Endpoint backend créé avec protection SUPER_ADMIN stricte
- ✅ Suppression sécurisée des tables transactionnelles (sales, sale_items, cash_sessions, reception_tickets, reception_lines)
- ✅ Préservation des tables de configuration (users, sites, categories, cash_registers)
- ✅ Workflow de confirmation en 3 étapes implémenté
- ✅ Interface utilisateur avec modales de confirmation
- ✅ Tests unitaires complets pour la sécurité et le fonctionnement
- ✅ Gestion des erreurs et rollback en cas d'échec

### File List
- `api/src/recyclic_api/api/api_v1/endpoints/db_purge.py` - Endpoint de purge
- `api/src/recyclic_api/api/api_v1/endpoints/__init__.py` - Import du router
- `api/src/recyclic_api/api/api_v1/api.py` - Enregistrement du router
- `frontend/src/services/adminService.ts` - Service de purge
- `frontend/src/pages/Admin/Settings.tsx` - Interface utilisateur avec workflow
- `api/tests/test_db_purge.py` - Tests unitaires

### Change Log
- 2025-01-27: Implémentation complète de la fonctionnalité de purge sécurisée
- 2025-01-27: Ajout des tests de sécurité et de fonctionnement
- 2025-01-27: Interface utilisateur avec workflow de confirmation en 3 étapes

### Status
Ready for Review
