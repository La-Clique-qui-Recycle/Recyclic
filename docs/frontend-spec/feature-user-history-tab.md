# UI/UX Specification: Onglet Historique Utilisateur

**Version:** 1.0
**Date:** 2025-09-18
**Auteur:** Sally (UX Expert)
**Contexte:** Ce document détaille le design de l'onglet "Historique" qui fait partie de la vue "Master-Detail" de la gestion des utilisateurs.

---

## 1. Objectif

Créer une interface claire et filtrable qui présente une chronologie complète de toutes les actions et événements significatifs d'un utilisateur, comme défini dans le brief.

---

## 2. Layout Général de l'Onglet

L'onglet sera structuré en trois zones distinctes :

1.  **Zone de Filtres (en haut) :** Une barre d'outils pour affiner la recherche.
2.  **Zone de Contenu (au centre) :** La liste chronologique des événements.
3.  **Zone de Pagination (en bas) :** Pour naviguer dans les longs historiques.

---

## 3. Design Détaillé

### 3.1. Zone de Filtres

La barre de filtres contiendra les éléments suivants, de gauche à droite :

- **Sélecteur de Période :** Deux champs de date ("Début" et "Fin") avec un calendrier pour choisir une plage.
- **Menu Déroulant "Type d'Événement" :** Permet de sélectionner un ou plusieurs types d'événements à afficher (ex: ADMINISTRATION, VENTE, DÉPÔT...). Une option "Tous les types" sera sélectionnée par défaut.
- **Bouton "Appliquer les filtres" :** Un bouton primaire pour lancer la recherche avec les critères sélectionnés.

### 3.2. Zone de Contenu (Liste des Événements)

La liste sera présentée comme une chronologie verticale. Chaque ligne représentera un événement et sera conçue pour être très lisible.

**Design d'une Ligne d'Événement :**

Chaque ligne aura la structure suivante :

`[Icône] [Date et Heure] - [TYPE EN MAJUSCULES] : [Description de l'événement]`

- **Icône :** Une icône distincte sera associée à chaque type d'événement pour une identification visuelle immédiate (ex: une icône de cadenas pour ADMINISTRATION, un caddie pour VENTE, un camion pour DÉPÔT).
- **Date et Heure :** Format court (ex: `18/09/25 14:32`).
- **Type :** Le type d'événement en majuscules et avec un code couleur discret pour renforcer la distinction visuelle.
- **Description :** La description de l'événement avec les données clés, comme demandé dans le brief.

**Exemples Visuels (conceptuels) :**

- Icon(ADMIN) `18/09/25 10:15` - **ADMINISTRATION** : Rôle changé de 'user' à 'admin' par **admin_user**.
- Icon(VENTE) `17/09/25 16:45` - **VENTE** : Vente #V123 enregistrée (3 articles, 15.50€).
- Icon(DÉPÔT) `17/09/25 09:22` - **DÉPÔT** : Dépôt #D456 créé via Telegram.

### 3.3. Zone de Pagination

- Des contrôles de pagination standards seront affichés en bas à droite de la liste si le nombre d'événements dépasse la taille d'une page (ex: 25 événements).
- Affichera le numéro de la page actuelle et des boutons "Précédent" / "Suivant".

---

## 4. Rationale du Design

- **Lisibilité :** L'utilisation d'icônes, de codes couleurs et d'une typographie claire permet de scanner la liste très rapidement pour trouver une information.
- **Contrôle Utilisateur :** La zone de filtres dédiée en haut de l'onglet donne à l'administrateur un contrôle total et explicite sur les données affichées.
- **Standard et Intuitif :** La disposition (filtres en haut, contenu au milieu, pagination en bas) est un standard du web que les utilisateurs comprendront instantanément.
