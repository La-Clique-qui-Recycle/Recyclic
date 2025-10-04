# Story (Dette Technique): Sécurisation et Traçabilité de l'API Catégories

**ID:** STORY-TECH-DEBT-B09-SECURITY
**Titre:** Sécurisation et Traçabilité de l'API Catégories
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Rate Limiting) / P2 (Audit Log)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** renforcer la sécurité de l'API Catégories et tracer les modifications,
**Afin de** prévenir les abus et de maintenir un historique des changements.

## Acceptance Criteria

1.  Un rate limiting est appliqué sur les endpoints de modification (`POST`, `PUT`, `DELETE`) pour empêcher les appels multiples rapides depuis une même IP.
2.  Un système de log simple enregistre chaque création, modification ou suppression de catégorie (ex: "L'utilisateur X a modifié la catégorie Y").

## Tasks / Subtasks

- [ ] **Rate Limiting :**
    - [ ] Intégrer une librairie de rate limiting pour FastAPI (ex: `slowapi`).
    - [ ] Appliquer une limite raisonnable (ex: 10 requêtes par minute par IP) sur les endpoints `POST`, `PUT`, `DELETE` de l'API Catégories.
    - [ ] Ajouter un test pour vérifier qu'un grand nombre d'appels rapides résulte bien en une erreur HTTP 429 "Too Many Requests".
- [ ] **Audit Log :**
    - [ ] Créer un logger Python dédié à l'audit.
    - [ ] Dans le service `category_service.py`, après chaque opération de modification réussie, ajouter une ligne de log contenant l'ID de l'utilisateur, l'action effectuée et l'ID de la catégorie concernée.
    - [ ] S'assurer que ces logs sont écrits dans un fichier séparé ou facilement filtrables.

## Dev Notes

-   Cette story est issue des recommandations de QA de la story `STORY-B09-P1`.
-   Le rate limiting est une mesure de sécurité fondamentale pour les API publiques.
-   L'audit log peut être simple au début (log dans un fichier) et être amélioré plus tard (table en base de données) si le besoin se présente.

## Definition of Done

- [ ] Le rate limiting est fonctionnel et testé.
- [ ] Les actions de modification sont logguées.
- [ ] La story a été validée par un agent QA.