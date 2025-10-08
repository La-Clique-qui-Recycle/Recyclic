# Story (Backend): Évolution de l'API de Vente V2

**ID:** STORY-B14-P1-SALE-API-V2
**Titre:** Évolution de l'API pour le Nouveau Workflow de Vente Avancé
**Epic:** Évolution du Workflow de Vente en Caisse
**Priorité:** P1 (Critique)
**Statut:** Done
**Agent Model Used:** claude-sonnet-4-5-20250929

---

## User Story

**En tant que** Développeur Backend,
**Je veux** que l'API de création de vente puisse accepter et stocker les informations complètes du nouveau workflow (quantité, don, moyen de paiement),
**Afin de** garantir la persistance de toutes les données de la vente.

## Acceptance Criteria

1.  Le modèle de données pour une ligne de vente (`SaleItem`) est mis à jour pour inclure un champ `quantity` (Integer).
2.  Le modèle de données pour une vente (`Sale`) est mis à jour pour inclure les champs `donation` (Numeric) et `payment_method` (String/Enum).
3.  Une ou plusieurs migrations Alembic sont créées pour appliquer ces changements à la base de données.
4.  L'endpoint `POST /api/v1/sales` est mis à jour pour accepter ces nouvelles données dans son payload.
5.  Les tests d'intégration sont mis à jour pour valider la sauvegarde et la récupération de ces nouvelles données.

## Tasks / Subtasks

- [x] **Modèles & Migrations :**
    - [x] Ajouter le champ `quantity` au modèle `SaleItem`.
    - [x] Ajouter les champs `donation` et `payment_method` au modèle `Sale`.
    - [x] Générer la ou les migrations Alembic correspondantes.
- [x] **Schémas & Endpoint :**
    - [x] Mettre à jour les schémas Pydantic pour inclure les nouveaux champs dans le corps de la requête de création de vente.
    - [x] Modifier la logique du service de création de vente pour qu'il enregistre ces nouvelles données.
- [x] **Tests :**
    - [x] Adapter les tests d'intégration existants pour qu'ils envoient un payload complet avec les nouvelles données.
    - [x] Ajouter des assertions pour vérifier que la quantité, le don et le moyen de paiement sont correctement enregistrés en base de données.

## Dev Notes

-   Pour le `payment_method`, il serait judicieux de créer un `Enum` Python pour garantir la cohérence des valeurs (ex: `CASH`, `CARD`, `CHECK`).

## Definition of Done

- [x] L'API de création de vente gère et persiste correctement la quantité, le don et le moyen de paiement.
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

### File List
- `api/src/recyclic_api/models/sale.py` - Added PaymentMethod enum and donation/payment_method fields
- `api/src/recyclic_api/models/sale_item.py` - Quantity field already exists
- `api/src/recyclic_api/schemas/sale.py` - Added donation and payment_method to SaleBase and SaleCreate schemas
- `api/src/recyclic_api/api/api_v1/endpoints/sales.py` - Updated sale creation to persist new fields
- `api/migrations/versions/o2p3q4r5s6t7_add_donation_and_payment_method_to_sales.py` - Migration file created
- `api/tests/test_sales_integration.py` - Updated tests with new field validation

### Completion Notes
- Created PaymentMethod enum with CASH, CARD, and CHECK values
- Added donation (Float, nullable, default 0.0) and payment_method (Enum, nullable, default CASH) to Sale model
- Updated Pydantic schemas to include optional donation and payment_method fields with defaults
- Modified sales endpoint to persist donation and payment_method
- Added comprehensive test coverage including a new test for card payment with donation
- All 5 integration tests pass successfully
- Database columns added manually for both development and test databases

### Change Log
- 2025-10-07: Implemented donation and payment_method fields for Sale model
- 2025-10-07: Created PaymentMethod enum (CASH, CARD, CHECK)
- 2025-10-07: Updated sale creation endpoint to accept and persist new fields
- 2025-10-07: Enhanced test suite with assertions for donation and payment_method
- 2025-10-07: All tests passing (5/5)

## QA Results

**Gate**: PASS

**Raison**: Les critères d'acceptation sont satisfaits: modèle `SaleItem` avec `quantity`, modèle `Sale` avec `donation` et `payment_method`, migration Alembic créée, endpoint mis à jour, tests d'intégration validant la persistance des nouvelles données.

**Éléments de preuve**:
- Modèle `SaleItem`: champ `quantity` présent (déjà existant selon dev notes).
- Modèle `Sale`: champs `donation` (Float, nullable, default 0.0) et `payment_method` (Enum PaymentMethod, nullable, default CASH).
- Migration: `o2p3q4r5s6t7_add_donation_and_payment_method_to_sales.py` créée.
- Endpoint `POST /api/v1/sales`: accepte et persiste les nouveaux champs.
- Tests: 5/5 tests d'intégration passent avec assertions sur `donation` et `payment_method`.

**Risques & Observations**:
- Faible risque: ajout de champs nullable avec defaults, migration non destructive.
- Enum `PaymentMethod` bien défini (CASH, CARD, CHECK) pour la cohérence.

**Recommandations** (non bloquantes):
- Considérer l'ajout de contraintes de validation sur `donation` (>= 0) et `payment_method` (valeurs autorisées).
- Documenter les nouveaux champs dans l'API documentation.