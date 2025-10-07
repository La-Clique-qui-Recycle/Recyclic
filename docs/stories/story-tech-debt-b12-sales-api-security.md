# Story (Dette Technique): Sécurisation de l'API des Ventes

**ID:** STORY-TECH-DEBT-B12-SALES-API
**Titre:** Sécurisation de l'API des Ventes (Rate Limiting & Audit)
**Epic:** Maintenance & Dette Technique
**Priorité:** P2 (Moyenne)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** renforcer la sécurité de l'endpoint de création de vente et tracer son utilisation,
**Afin de** prévenir les abus et de maintenir un historique des ventes créées.

## Acceptance Criteria

1.  Un rate limiting est appliqué sur l'endpoint de création de vente (`POST /api/v1/sales`).
2.  Un système de log simple enregistre chaque création de vente réussie.

## Tasks / Subtasks

- [ ] **Rate Limiting :**
    - [ ] Appliquer une limite raisonnable (ex: 20 requêtes par minute par IP) sur l'endpoint `POST /api/v1/sales` en utilisant la librairie déjà en place.
    - [ ] Ajouter un test pour vérifier que la limite de taux déclenche bien une erreur HTTP 429 "Too Many Requests".
- [ ] **Audit Log :**
    - [ ] Dans le service des ventes, après la création réussie d'une vente, ajouter une ligne de log contenant l'ID de l'opérateur, l'ID de la vente et le montant total.

## Dev Notes

-   Cette story est issue des recommandations de QA de la story `STORY-B12-P5`.
-   Elle peut être réalisée en s'inspirant du travail qui sera fait sur la story `story-tech-debt-b09-security-audit.md`.

## Definition of Done

- [ ] Le rate limiting est fonctionnel et testé sur l'endpoint des ventes.
- [ ] La création des ventes est logguée.
- [ ] La story a été validée par un agent QA.