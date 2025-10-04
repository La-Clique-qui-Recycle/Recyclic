# Story (Frontend): Implémentation de l'Assistant de Saisie de la Caisse

**ID:** STORY-B12-P3
**Titre:** Implémentation de l'Assistant de Saisie de la Caisse
**Epic:** Refonte Complète du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Frontend,  
**Je veux** implémenter le nouveau workflow de saisie en plusieurs étapes (l'"assistant") pour le module de Caisse,  
**Afin de** fournir une expérience utilisateur guidée, ergonomique et conforme aux nouvelles spécifications.

## Contexte

Cette story est le cœur de la refonte du module de Caisse. Elle crée l'enchaînement des différentes pages de saisie et intègre les améliorations d'ergonomie que nous avons définies.

## Critères d'Acceptation

1.  Un nouveau composant "assistant" est créé pour gérer la navigation entre les 5 étapes : `Catégorie` -> `Sous-catégorie` -> `Quantité` -> `Poids` -> `Prix`.
2.  Un **fil d'Ariane cliquable** est affiché en haut de chaque étape (à partir de l'étape 2) pour permettre à l'utilisateur de revenir en arrière et de corriger une sélection précédente.
3.  **Étape "Poids" :** L'interface de saisie du poids est implémentée conformément à la vision "fluide" :
    -   Un champ principal pour le poids total.
    -   Un bouton `+ Ajouter un poids unitaire` pour passer en mode détaillé.
    -   Une liste des poids unitaires avec des boutons **Modifier** et **Supprimer** sur chaque ligne.
4.  **Étape "Prix" :** L'interface implémente la logique de prix conditionnelle :
    -   Si la sous-catégorie sélectionnée a un `prix_mini` et un `prix_maxi` identiques, le champ de prix est pré-rempli et non-modifiable.
    -   Si la sous-catégorie a une plage de prix, le champ est modifiable, avec une validation pour s'assurer que le prix entré est bien dans la plage.
5.  L'aspect visuel (couleurs, polices, espacements) et le comportement responsive s'inspirent fortement des standards déjà établis dans le module de Réception (`TicketForm.tsx`).

## Notes Techniques

-   **Dépendances :** Cette story dépend de `STORY-B12-P1` et `STORY-B12-P2` pour les données de catégories.
-   **Gestion d'État :** L'utilisation d'un store (Zustand) ou d'un `Context` React est fortement recommandée pour gérer l'état de la saisie à travers les différentes étapes de l'assistant.
-   **Références de Style :** L'agent DEV doit analyser le fichier `frontend/src/pages/Reception/TicketForm.tsx` pour réutiliser les `styled-components` et la logique de layout responsive.

## Definition of Done

- [ ] L'assistant de saisie en 5 étapes est fonctionnel.
- [ ] Le fil d'Ariane cliquable est implémenté.
- [ ] La saisie de poids améliorée est fonctionnelle.
- [ ] La logique de prix conditionnelle est implémentée.
- [ ] Le design est cohérent avec le module de Réception.
- [ ] La story a été validée par le Product Owner.
