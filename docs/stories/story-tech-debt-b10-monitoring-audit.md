# Story (Dette Technique): Monitoring et Audit du Module Caisse

**ID:** STORY-TECH-DEBT-B10-MONITORING
**Titre:** Implémentation du Monitoring et de l'Audit pour le Module Caisse
**Epic:** Maintenance & Dette Technique
**Priorité:** P2 (Moyenne)
**Statut:** Approuvée

---

## User Story

**En tant que** Administrateur Système,
**Je veux** avoir une meilleure visibilité sur l'utilisation et la stabilité du module de caisse,
**Afin de** pouvoir diagnostiquer les problèmes plus rapidement et de comprendre comment les fonctionnalités sont utilisées.

## Acceptance Criteria

1.  Les actions critiques (finalisation de vente, changement d'opérateur) sont logguées de manière structurée.
2.  Des métriques sur l'utilisation des fonctionnalités (ex: taux de succès des ventes, utilisation du mode PIN) sont collectées.
3.  (Optionnel) Une fonctionnalité de verrouillage automatique après une période d'inactivité est implémentée.

## Tasks / Subtasks

- [ ] **Logs d'Audit :**
    - [ ] Côté backend, dans les services concernés, ajouter des logs structurés pour les événements suivants : `sale_finalized`, `operator_changed`, `pin_auth_success`, `pin_auth_failure`.
    - [ ] Chaque log doit contenir des informations contextuelles (ID utilisateur, ID session de caisse, timestamp).
- [ ] **Collecte de Métriques :**
    - [ ] Mettre en place un système de collecte de métriques simple (ex: via un service comme Prometheus ou un logging structuré analysable).
    - [ ] Incrémenter des compteurs pour les événements loggués ci-dessus.
- [ ] **Verrouillage Automatique (Optionnel) :**
    - [ ] Côté frontend, implémenter un timer qui détecte l'inactivité de l'utilisateur sur la page de caisse.
    - [ ] Après une durée configurable (ex: 5 minutes), déclencher automatiquement l'action de verrouillage de l'opérateur.

## Dev Notes

-   Cette story consolide les recommandations de monitoring des stories `STORY-B10-P2` et `STORY-B10-P4`.
-   L'implémentation peut commencer de manière simple (logs dans des fichiers) et être connectée à des outils de visualisation (Kibana, Grafana) plus tard.
-   Le verrouillage automatique est une fonctionnalité de sécurité et d'ergonomie importante dans un environnement multi-utilisateurs.

## Definition of Done

- [ ] Les événements critiques de la caisse sont loggués.
- [ ] Des métriques de base sont collectées.
- [ ] La story a été validée par un agent QA.