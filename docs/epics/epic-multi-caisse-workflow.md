# Epic: Finalisation de la Gestion Multi-Caisse

**ID:** EPIC-MULTI-CAISSE
**Titre:** Finalisation de la Gestion Multi-Caisse et Fiabilisation du Workflow
**Statut:** Défini

---

## 1. Objectif de l'Epic

Fournir un workflow robuste, standard et complet pour la gestion de plusieurs postes de caisse. L'objectif est de clarifier le processus d'ouverture de session, de fiabiliser la traçabilité comptable, et de corriger les bugs bloquants, en se basant sur les règles de l'art de la gestion de points de vente (POS).

## 2. Description

### Contexte Existant
L'implémentation actuelle du workflow d'ouverture de session de caisse est confuse et buguée. La sélection de l'opérateur n'est pas claire, des bugs d'interface empêchent la saisie correcte du fond de caisse, et une erreur réseau bloque l'ouverture de la session. De plus, le concept de "multi-caisse" est mentionné dans les exigences (`FR44`) mais sa conception n'a jamais été finalisée.

### Améliorations Proposées
Cet epic met en œuvre le design complet du workflow, qui se décompose comme suit :
1.  **Configuration des Postes :** Un admin peut définir des postes de caisse nommés (ex: "Caisse Principale").
2.  **Ouverture de Session :** L'écran d'ouverture demande à l'utilisateur de choisir le **Poste de Caisse** à ouvrir et l'**Opérateur** qui en est responsable.
3.  **Changement d'Opérateur :** Une fois la session ouverte, les utilisateurs peuvent changer l'opérateur actif sans fermer la session.

Ce workflow corrige les bugs existants et apporte la clarté qui manquait au processus.

## 3. Stories de l'Epic

Cet epic est composé des 4 stories suivantes :

1.  **Story 1 (Admin) :** Permettre aux admins de gérer les postes de caisse via une nouvelle interface dans le panneau d'administration.
2.  **Story 2 (UX/UI) :** Refondre l'écran d'ouverture de session pour intégrer la sélection du poste de caisse et corriger les bugs de saisie.
3.  **Story 3 (Backend/Tech) :** Adapter l'API pour supporter la gestion des postes de caisse et des sessions associées, et corriger l'erreur réseau.
4.  **Story 4 (UX/UI) :** Implémenter la fonctionnalité de changement d'opérateur au sein d'une session active.

## 4. Risques et Plan de Rollback

- **Risque Principal :** Régression sur le système de caisse. Étant donné l'état bugué actuel, le risque est considéré comme faible.
- **Mitigation :** Tests manuels complets du workflow d'ouverture et de vente après l'implémentation de chaque story.
- **Plan de Rollback :** Revert des commits liés à l'epic en cas de problème majeur.

## 5. Definition of Done (pour l'Epic)

- [ ] Les 4 stories sont terminées et validées.
- [ ] Un utilisateur peut configurer un poste de caisse, l'ouvrir, effectuer une vente, et le fermer.
- [ ] Le changement d'opérateur en cours de session est fonctionnel.
- [ ] La documentation (PRD, architecture) est mise à jour pour refléter le nouveau workflow détaillé.
