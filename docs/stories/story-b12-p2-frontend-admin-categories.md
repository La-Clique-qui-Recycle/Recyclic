# Story (Frontend): Mise à Jour de l'Interface d'Administration des Catégories

**ID:** STORY-B12-P2
**Titre:** Mise à Jour de l'Interface d'Administration des Catégories
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Super-Administrateur,  
**Je veux** que l'interface de gestion des catégories me permette de gérer la hiérarchie (catégories/sous-catégories) et les nouveaux champs (prix, info, image),  
**Afin de** pouvoir configurer précisément les données utilisées par les modules de Réception et de Caisse.

## Contexte

Cette story adapte l'interface d'administration existante pour la rendre compatible avec le nouveau modèle de données enrichi des catégories, développé dans la story `STORY-B12-P1`.

## Critères d'Acceptation

1.  Dans le formulaire de création/modification d'une catégorie, un nouveau champ "Catégorie Parente" (une liste déroulante des catégories existantes) est ajouté pour permettre de définir une catégorie comme sous-catégorie.
2.  Les champs de saisie pour `Prix Minimum`, `Prix Maximum`, `Info` et `URL de l'image` sont ajoutés au formulaire.
3.  **Logique Conditionnelle :** Les champs `Prix Minimum` et `Prix Maximum` sont désactivés (ou masqués) si aucune "Catégorie Parente" n'est sélectionnée. Ils ne deviennent actifs que lors de la création ou de la modification d'une sous-catégorie.
4.  L'affichage de la liste des catégories est amélioré pour montrer la hiérarchie (ex: avec une indentation pour les sous-catégories).

## Notes Techniques

-   **Dépendance :** Cette story dépend de la story `STORY-B12-P1`.
-   **Interface :** S'inspirer des systèmes de gestion de menus ou de dossiers pour afficher la hiérarchie de manière intuitive.

## Definition of Done

- [ ] L'interface permet de créer et de modifier des catégories avec un parent.
- [ ] L'interface permet de gérer les champs prix, info et image_url, en respectant la logique conditionnelle pour les prix.
- [ ] L'affichage de la liste montre clairement la hiérarchie.
- [ ] La story a été validée par le Product Owner.
