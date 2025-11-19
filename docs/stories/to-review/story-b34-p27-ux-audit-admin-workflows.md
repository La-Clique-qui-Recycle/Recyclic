---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.521072
original_path: docs/stories/story-b34-p27-ux-audit-admin-workflows.md
---

# Story b34-p27: Audit UX - Analyse des parcours admin et points de friction

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Tâche (Audit UX - Phase 2)
**Assignée à:** Sally (Agent UX Expert)
**Dépendance :** Doit être réalisée après la story `b34-p25`.

## 1. Contexte

**Note de Contexte Importante :** Le workflow d'approbation des utilisateurs (statuts "en attente", "approuvé", etc.) a été intentionnellement masqué de l'interface via la story `b34-p26`. Cet audit ne doit donc **pas** prendre en compte ce parcours obsolète.

La phase 1 de l'audit (`b34-p25`) a permis de réaliser un état des lieux visuel de la section admin. Cette deuxième phase vise à aller plus en profondeur en analysant les parcours utilisateurs (workflows) pour identifier les problèmes d'ergonomie et d'efficacité qui ne sont pas visibles au premier coup d'œil.

## 2. Mission (Phase 2 - Analyse)

L'objectif est d'**analyser en profondeur les parcours utilisateurs clés** de la section admin pour identifier et documenter les **points de friction** concrets.

## 3. Méthodologie Impérative

### Tâche Préliminaire : Mise à Jour de l'Audit Existant

Avant de commencer l'analyse des parcours, l'agent DOIT d'abord mettre à jour le fichier d'audit `docs/audits/full-site-ux-20251024/admin/users.md`.

1.  Ajouter une section `## Mise à Jour Post-b34-p26` à la fin du fichier.
2.  Dans cette section, noter que les éléments d'interface liés au workflow d'approbation (bouton "Demandes en attente", filtres et colonne de statut) ont été supprimés et que les observations initiales à ce sujet ne sont plus d'actualité.

### Analyse des Parcours

1.  **Sélection des Parcours :** L'agent DOIT analyser les 3 parcours suivants, qui représentent des tâches administratives courantes et critiques.

2.  **Documentation par Parcours :** Pour chaque parcours, l'agent DOIT créer un nouveau fichier Markdown dans le dossier `docs/audits/full-site-ux-20251024/admin/parcours/` (dossier à créer).
    *   Exemple de nom de fichier : `parcours-validation-utilisateur.md`.

3.  **Analyse Détaillée :** Dans chaque fichier, l'agent DOIT :
    *   Décrire l'objectif du parcours (ex: "Valider un nouvel utilisateur et lui assigner un groupe").
    *   Lister chaque action effectuée (clic, saisie, etc.) de manière séquentielle.
    *   Pour chaque action, identifier et décrire les **points de friction** en utilisant des catégories claires :
        *   **Effort Cognitif :** "Je dois réfléchir pour savoir où cliquer."
        *   **Nombre de Clics :** "Cette action nécessite 4 clics alors qu'un seul pourrait suffire."
        *   **Clarté du Feedback :** "Le message de succès est ambigu."
        *   **Rupture de Contexte :** "Je suis obligé de naviguer vers une autre page pour trouver une information nécessaire ici."

## 4. Parcours Utilisateurs à Analyser

### Parcours 1 : Gestion d'un Nouvel Utilisateur
*   **Objectif :** Trouver un utilisateur récemment inscrit, l'assigner au groupe "Équipe Caisse", et vérifier que ses permissions sont correctes.
*   **Points de départ :** Page `/admin/users`.

### Parcours 2 : Suivi d'une Session de Caisse
*   **Objectif :** Trouver la dernière session de caisse clôturée, vérifier s'il y a un écart de trésorerie, et consulter le rapport associé.
*   **Points de départ :** Page d'accueil `/admin`.

### Parcours 3 : Analyse des Données de Réception
*   **Objectif :** Utiliser le dashboard principal pour visualiser les statistiques de réception pour le mois dernier, puis pour une semaine spécifique.
*   **Points de départ :** Page d'accueil `/`.

## 5. Livrable Final

1.  **Trois Fichiers d'Analyse :** Un fichier `.md` détaillé pour chacun des trois parcours.
2.  **Rapport de Synthèse :** Un fichier `_synthese-points-de-friction.md` dans le dossier `admin/` qui liste les **10 principaux points de friction** identifiés au total, classés par ordre de sévérité (du plus bloquant au plus simplement agaçant).

## 6. Outils et Prérequis

- **Accès :** Utiliser le compte SuperAdmin (`superadmintest1` / `Test1234!`).
- **Outils :** Utiliser intensivement les DevTools pour comprendre le flux des données et la structure des composants.
