# UI/UX Specification: Module de Réception des Dépôts

**Version:** 1.0
**Date:** 2025-09-18
**Auteur:** Sally (UX Expert) & User
**Stories de Référence:** `story-fe-module-reception.md`

---

## 1. Introduction

Ce document définit l'expérience utilisateur (UX) et les spécifications de l'interface utilisateur (UI) pour le **Module de Réception des Dépôts**. Il sert de guide pour la conception et le développement d'une interface efficace, rapide et adaptée à un usage tactile.

---

## 2. Objectifs et Principes UX

- **Persona Cible :** Le Bénévole de la Réception (environnement de travail potentiellement salissant, besoin de rapidité et de simplicité).
- **Objectifs d'Utilisabilité :** Vitesse de saisie, tolérance aux erreurs, lisibilité maximale.
- **Principes de Conception :** "Touch First" (grandes zones cliquables), Un Écran = Une Tâche, Moins de Clics = Plus d'Impact.

---

## 3. Architecture de l'Information & Flux Utilisateurs

L'architecture est conçue pour être linéaire et guider l'utilisateur à travers un flux de travail optimisé.

### 3.1. Diagramme du Flux Principal

```mermaid
graph TD
    subgraph Module Réception
        A(Clic sur "Réception" dans le menu principal déclenche l'ouverture du poste en arrière-plan) --> B[Écran de Travail Principal];
        B -- Clic "Nouveau Ticket" --> C{Interface de Saisie du Ticket};        
        C -- Clic "Ajouter Ligne" --> D[Vue "Ajout de Ligne"];
        C -- Clic sur ligne existante --> D;
        D -- Valider --> C;
        C -- Clic "Clôturer Ticket" --> B;
        B -- Clic "Terminer ma session" --> E(Poste fermé, retour au dashboard principal);
    end
```

### 3.2. Description du Flux

1.  **Entrée & Ouverture de Poste :** L'entrée dans le module via le menu principal ouvre automatiquement une session de poste en arrière-plan.
2.  **Écran de Travail Principal :** Un écran simple propose de "Créer un nouveau ticket de dépôt".
3.  **Saisie du Ticket :** L'utilisateur peut ajouter, modifier ou supprimer des lignes (objets) et voir la liste se mettre à jour en temps réel.
4.  **Ajout/Modification de Ligne :** Une vue dédiée permet de sélectionner une catégorie, saisir un poids et des notes optionnelles.
5.  **Clôture :** L'utilisateur peut clôturer le ticket pour finaliser le dépôt, ou terminer sa session pour fermer le poste.

---

## 4. Wireframes & Layout

### 4.1. Écran de Travail Principal

- **Layout :** Très épuré. Un bandeau supérieur avec le nom de l'utilisateur et le bouton "Terminer ma session". Au centre, un grand bouton "Nouveau Ticket de Dépôt".

### 4.2. Écran de Saisie du Ticket (Layout Tablette / >900px)

- **Disposition :** Deux colonnes ("Master-Detail").
- **Colonne Gauche (60%) :** Liste des lignes du ticket, avec boutons "Modifier"/"Supprimer" sur chaque ligne. Le bouton "Clôturer le Ticket" est en bas.
- **Colonne Droite (40%) :** Zone de saisie permanente avec la grille des catégories, le champ poids (avec pavé numérique visible), le champ notes et le bouton "Ajouter l'objet".

### 4.3. Adaptation Mobile (< 900px)

- L'écran de saisie n'affiche que la liste des lignes.
- L'action "Ajouter" ou "Modifier" ouvre une **nouvelle vue en plein écran** contenant uniquement le formulaire de saisie.

---

## 5. Bibliothèque de Composants & Style

- **Bibliothèque :** Material-UI (MUI) pour React, pour la cohérence avec le reste du projet.
- **Style :** Les composants seront adaptés pour être "Touch-Friendly" (grandes tailles, larges espacements).
- **Palette de Couleurs :** Réutilisation de la palette validée (Primaire: `#86506F`, Fond: `#F7EFDF`, etc.).
- **Typographie :** Police 'Inter', avec des tailles de caractères augmentées pour une lisibilité maximale.
- **Icônes :** Material Icons.

---

## 6. Prochaines Étapes

1.  Revue de ce document par l'agent Master.
2.  Handoff aux développeurs Frontend pour implémentation.
