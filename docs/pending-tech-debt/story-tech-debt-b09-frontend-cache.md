---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.533758
original_path: docs/stories/story-tech-debt-b09-frontend-cache.md
---

# Story (Dette Technique): Amélioration du Cache Frontend des Catégories

**ID:** STORY-TECH-DEBT-B09-FRONTEND
**Titre:** Amélioration de la Stratégie de Cache Frontend pour les Catégories
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Basse)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** améliorer la stratégie de cache du store des catégories,
**Afin d'** optimiser la réactivité de l'interface et de fournir des données à jour de manière plus intelligente.

## Acceptance Criteria

1.  Des métriques simples (nombre de cache hits/misses) sont ajoutées au store Zustand pour pouvoir monitorer l'efficacité du cache.
2.  Une stratégie de préchargement (prefetching) est implémentée : les catégories sont chargées en arrière-plan dès que l'utilisateur se connecte, avant même qu'il n'accède à un module qui les utilise.

## Tasks / Subtasks

- [ ] **Métriques de Cache :**
    - [ ] Dans le store `categoryStore.ts`, ajouter des compteurs pour les `hits` (données servies depuis le cache) et les `misses` (données récupérées via l'API).
    - [ ] Afficher ces métriques dans la console en mode développement pour faciliter le monitoring.
- [ ] **Préchargement (Prefetching) :**
    - [ ] Identifier un composant de haut niveau qui est monté juste après la connexion de l'utilisateur (ex: le layout principal de l'application).
    - [ ] Dans un `useEffect` de ce composant, appeler la fonction `fetchCategories` du store pour déclencher le chargement des catégories en arrière-plan.
    - [ ] S'assurer que cet appel ne bloque pas l'interface utilisateur.
- [ ] **Tests :** Mettre à jour les tests du store pour vérifier que les compteurs de métriques sont bien incrémentés.

## Dev Notes

-   Cette story est issue des recommandations de QA de la story `STORY-B09-P3`.
-   Le préchargement améliorera l'expérience perçue par l'utilisateur : lorsqu'il arrivera sur les modules de Caisse ou de Réception, les données seront déjà disponibles, rendant l'affichage instantané.

## Definition of Done

- [ ] Les métriques de cache sont implémentées.
- [ ] Le préchargement des catégories est fonctionnel.
- [ ] La story a été validée par un agent QA.