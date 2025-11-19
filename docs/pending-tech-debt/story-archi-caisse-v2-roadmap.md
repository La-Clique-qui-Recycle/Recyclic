---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:13.617662
original_path: docs/stories/story-archi-caisse-v2-roadmap.md
---

# Story (Architecture): Définition de la Feuille de Route Finale pour la Caisse V2

**ID:** STORY-ARCHI-CAISSE-V2-ROADMAP
**Titre:** Définition de la Feuille de Route Finale pour la Caisse V2
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Critique)
**Statut:** Approuvée

---

## User Story

**En tant que** Scrum Master et Product Owner,
**Je veux** une analyse complète des stories des epics B12, B13 et B14, et une feuille de route unique et consolidée,
**Afin d'** éliminer toute ambiguïté, de prévenir les conflits et de garantir que le développement futur se base sur l'état actuel du code et la vision finale du produit.

## Contexte

Le développement a progressé rapidement, mais la planification a créé des conflits entre les epics B12 (terminé), B13 (terminé mais potentiellement en conflit) et B14 (défini mais maintenant obsolète dans sa forme actuelle). Il est impératif de réconcilier ces trois visions en une seule feuille de route avant de continuer.

## Acceptance Criteria

1.  Une analyse comparative détaillée des stories des epics B12, B13 et B14 est produite.
2.  Les fonctionnalités de B14 qui constituent de **vraies nouveautés** par rapport à l'état actuel (fin de B12 + B13) sont clairement identifiées.
3.  Une nouvelle suite de stories (l'epic "Caisse V2") est rédigée. Ces nouvelles stories doivent :
    -   Partir de la base de code **actuelle**.
    -   Intégrer les objectifs finaux de B14 de manière cohérente.
    -   Être séquentielles et sans double emploi.
4.  Les stories originales des epics B13 et B14 sont formellement marquées comme obsolètes et sont archivées.

## Tasks / Subtasks

- [ ] **Analyse d'Impact :**
    - [ ] Relire en détail les stories terminées : `B12 (P1 à P5)` et `B13-P1`.
    - [ ] Relire en détail les stories en attente : `B14 (P1 à P3)`.
    - [ ] Produire un document de synthèse qui liste les conflits, les redondances, et surtout les fonctionnalités de B14 qui restent à implémenter.
- [ ] **Définition de la Nouvelle Feuille de Route :**
    - [ ] Créer un nouvel epic "Caisse V2 - Workflow de Vente Avancé".
    - [ ] Rédiger de nouvelles stories claires et séquentielles qui décrivent comment faire **évoluer** le code existant pour atteindre les objectifs de B14 (ex: "Faire évoluer le Wizard de saisie pour gérer les pesées multiples", "Ajouter l'écran de finalisation au flux de vente", etc.).
- [ ] **Nettoyage du Backlog :**
    - [ ] Archiver les fichiers des stories des epics B13 et B14.
    - [ ] Mettre à jour le fichier `backlog.json` pour supprimer les anciennes références et ajouter les nouvelles.

## Dev Notes

-   Cette story est une tâche d'architecture et de planification, pas de développement de fonctionnalité.
-   Son livrable n'est pas du code, mais une nouvelle feuille de route claire et un backlog propre.
-   C'est la priorité absolue avant tout autre développement sur la caisse.

## Definition of Done

- [ ] La nouvelle feuille de route (epic "Caisse V2") est créée et validée.
- [ ] Le backlog est nettoyé des anciennes stories B13 et B14.
- [ ] La story a été validée par le Scrum Master et le Product Owner.