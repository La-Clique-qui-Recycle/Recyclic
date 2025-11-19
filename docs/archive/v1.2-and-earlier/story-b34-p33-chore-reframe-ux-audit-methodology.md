# Story b34-p33: Chore: Recadrer l'agent UX sur la méthodologie d'audit

**Statut:** ✅ Terminé et Validé
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Tâche (Formation / Recadrage)
**Assignée à:** Sally (Agent UX Expert)
**Priorité:** Bloquant (avant toute autre tâche UX)

## 1. Contexte

Suite à l'annulation des stories `b34-p31` et `b34-p32`, il est apparu que l'audit UX initial de Sally (Phase 1 et 2) contenait des erreurs d'observation fondamentales. Des points de friction ont été identifiés sur la base d'une analyse statique ou d'une mauvaise interprétation de l'interface, plutôt que sur l'expérience utilisateur réelle.

Ceci compromet la fiabilité de l'audit et la pertinence des recommandations. Avant de poursuivre toute tâche UX, il est impératif de recadrer l'agent sur la méthodologie d'audit UX basée sur l'expérience réelle de l'utilisateur.

## 2. Objectif

**Recadrer l'agent UX sur une méthodologie d'audit rigoureuse et basée sur l'expérience utilisateur réelle**, en insistant sur l'observation visuelle, l'interaction et la preuve par l'image.

## 3. Méthodologie Impérative (Recadrage)

L'agent DOIT relire attentivement les instructions de la story `b34-p27` et les appliquer avec une rigueur accrue.

1.  **Observation Visuelle, Interaction et Empathie Utilisateur :**
    *   Pour chaque page et chaque parcours, l'agent DOIT interagir avec l'interface comme un utilisateur réel.
    *   L'analyse DOIT se baser sur ce qui est **visible à l'écran** et sur les **interactions possibles**, et non sur une interprétation du code.
    *   L'agent DOIT se mettre à la place d'un utilisateur qui découvre l'interface et anticiper l'action la plus probable dans le contexte métier, en notant si l'interface guide naturellement vers cette action.

2.  **Preuve par l'Image (Captures d'écran) :**
    *   Pour chaque point de friction identifié, l'agent DOIT inclure une **description détaillée de la capture d'écran** qui prouve l'existence du problème.
    *   Si l'agent ne peut pas fournir une capture d'écran (ou sa description), le point de friction n'est pas valide.

3.  **Analyse des Parcours (Ré-exécution) :**
    *   L'agent DOIT ré-exécuter les 3 parcours définis dans `b34-p27`.
    *   Pour chaque étape, l'agent DOIT décrire précisément ce qu'il voit et ce qu'il fait.

4.  **Rapport de Synthèse Révisé :**
    *   L'agent DOIT produire un nouveau rapport de synthèse (`_synthese-points-de-friction-revisée.md`) qui reflète cette nouvelle analyse.
    *   Ce rapport DOIT inclure des références aux captures d'écran (par leur description) pour chaque point de friction.

## 4. Critères d'Acceptation

- [ ] L'agent DOIT fournir un rapport de synthèse révisé qui identifie les points de friction de manière factuelle et prouvée par l'observation visuelle.
- [ ] Chaque point de friction DOIT être accompagné d'une description claire de la preuve visuelle (ex: "Sur la capture d'écran X, on voit que le bouton Y est absent").
- [ ] Le rapport DOIT être exempt de toute interprétation statique du code non vérifiée par l'expérience utilisateur.

## 5. Outils et Prérequis

- **Accès :** Utiliser le compte SuperAdmin (`superadmintest1` / `Test1234!`).
- **Outils :** Utiliser intensivement les DevTools pour comprendre le flux des données et la structure des composants, mais **toujours valider visuellement** l'impact sur l'interface.
