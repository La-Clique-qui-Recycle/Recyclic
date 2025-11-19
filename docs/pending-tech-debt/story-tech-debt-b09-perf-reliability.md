---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.567795
original_path: docs/stories/story-tech-debt-b09-perf-reliability.md
---

# Story (Dette Technique): Amélioration Performance et Fiabilité de l'API Catégories

**ID:** STORY-TECH-DEBT-B09-PERF
**Titre:** Amélioration de la Performance et de la Fiabilité de l'API Catégories
**Epic:** Maintenance & Dette Technique
**Priorité:** P1 (Sanitisation) / P3 (Cache)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** améliorer la performance et la fiabilité de l'API de gestion des catégories,
**Afin de** réduire la charge sur la base de données et de garantir la propreté des données.

## Acceptance Criteria

1.  Une couche de cache est implémentée sur l'endpoint `GET /api/v1/categories` pour que les appels successifs ne touchent pas la base de données (pendant une durée définie).
2.  Les noms de catégories sont automatiquement "nettoyés" (sanitized) avant d'être sauvegardés : les espaces au début et à la fin sont supprimés.

## Tasks / Subtasks

- [ ] **Cache Backend :**
    - [ ] Intégrer une librairie de cache pour FastAPI (ex: `fastapi-cache2`).
    - [ ] Appliquer un décorateur de cache à l'endpoint `GET /api/v1/categories` avec une durée d'expiration raisonnable (ex: 5 minutes).
    - [ ] Ajouter un test pour vérifier que le cache fonctionne (un deuxième appel rapide doit être servi plus vite et ne pas interroger la base de données).
- [ ] **Sanitisation :**
    - [ ] Dans le service `category_service.py`, modifier les fonctions de création et de mise à jour pour appliquer une méthode `.strip()` sur le nom de la catégorie avant la sauvegarde.
    - [ ] Ajouter un test pour vérifier qu'une catégorie créée avec des espaces (ex: "  Ma Catégorie  ") est bien sauvegardée comme "Ma Catégorie".

## Dev Notes

-   Cette story est issue des recommandations de QA de la story `STORY-B09-P1`.
-   La mise en cache côté serveur est complémentaire à celle du client : elle protège l'API et la base de données, tandis que le cache client protège le réseau de l'utilisateur.

## Definition of Done

- [ ] Le cache backend est fonctionnel et testé.
- [ ] La sanitisation des noms est fonctionnelle et testée.
- [ ] La story a été validée par un agent QA.