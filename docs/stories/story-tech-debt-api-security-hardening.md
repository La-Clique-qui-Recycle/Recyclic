# Story (Dette Technique): Sécurisation et Traçabilité des Endpoints Critiques

**ID:** STORY-TECH-DEBT-API-SECURITY-HARDENING
**Titre:** Sécurisation et Traçabilité des Endpoints Critiques (Catégories & Ventes)
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Rate Limiting) / P2 (Audit Log)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** renforcer la sécurité des endpoints API critiques et tracer les modifications,
**Afin de** prévenir les abus et de maintenir un historique des changements sur les catégories et les ventes.

## Acceptance Criteria

1.  Un rate limiting est appliqué sur les endpoints de modification des catégories (`POST`, `PUT`, `DELETE`).
2.  Un rate limiting est appliqué sur l'endpoint de création de vente (`POST /api/v1/sales`).
3.  Un système de log simple enregistre les modifications sur les catégories.
4.  Un système de log simple enregistre la création des ventes.

## Tasks / Subtasks

- [ ] **Rate Limiting :**
    - [ ] Intégrer une librairie de rate limiting pour FastAPI (ex: `slowapi`).
    - [ ] Appliquer une limite raisonnable (ex: 10 requêtes par minute par IP) sur les endpoints de modification de l'API Catégories.
    - [ ] Appliquer une limite raisonnable sur l'endpoint de création de vente (`POST /api/v1/sales`).
    - [ ] Ajouter des tests pour vérifier que les limites de taux déclenchent bien une erreur HTTP 429 "Too Many Requests" pour les deux ensembles d'endpoints.
- [ ] **Audit Log :**
    - [ ] Créer un logger Python dédié à l'audit.
    - [ ] Dans `category_service.py`, logguer les modifications de catégories (création, màj, suppression).
    - [ ] Dans le service des ventes, logguer la finalisation d'une vente, en incluant l'ID de l'opérateur et le montant total.

## Dev Notes

-   Cette story consolide les recommandations de sécurité des epics B09 et B12.
-   Le rate limiting est une mesure de sécurité fondamentale pour les API publiques.
-   L'audit log peut être simple au début (log dans un fichier) et être amélioré plus tard (table en base de données) si le besoin se présente.

## Definition of Done

- [ ] Le rate limiting est fonctionnel et testé sur les endpoints des catégories et des ventes.
- [ ] Les actions de modification (catégories) et de création (ventes) sont logguées.
- [ ] La story a été validée par un agent QA.