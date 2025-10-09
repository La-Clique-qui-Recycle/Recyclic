# UI/UX Refactor Specification: Module d'Import CSV

**Version:** 1.0
**Date:** 2025-10-08
**Auteur:** Sally (UX Expert)

---

## 1. Objectif

Ce document détaille les modifications nécessaires pour améliorer l'ergonomie, la clarté et la cohérence du module d'import CSV, en se basant sur l'analyse des captures d'écran fournies.

---

## 2. Recommandations Générales

- **Cohérence des Styles :** Standardiser tous les boutons, espacements et titres pour qu'ils correspondent au guide de style du projet (palette de couleurs, typographie).
- **Feedback Visuel :** Utiliser systématiquement des couleurs (badges, fonds de ligne) pour indiquer les statuts (succès, erreur, en cours).

---

## 3. Recommandations par Page

### 3.1. Page d'Historique (`/admin/imports/history`)

- **Layout :**
    - Aligner le titre "Historique des imports" à gauche et le bouton **"Importer un nouveau fichier"** à droite, sur la même ligne.
- **Tableau :**
    - **Colonne "Statut" :** Remplacer le texte par des composants "Badge" colorés :
        - `Terminé` : Badge vert.
        - `En erreur` : Badge rouge.
        - `En cours` : Badge bleu.
- **Composants :**
    - Appliquer le style de bouton primaire du projet au bouton "Importer un nouveau fichier".

### 3.2. Page de Nouvel Import (`/admin/imports/new`)

- **Refactorisation en Wizard (Assistant) en 3 Étapes :** L'objectif est de ne montrer à l'utilisateur que ce qui est nécessaire à chaque étape.

    - **Étape 1 : Upload**
        - Afficher **uniquement** le composant d'upload de fichier.

    - **Étape 2 : Mapping des Colonnes**
        - S'affiche **après** le succès de l'upload, en remplaçant le composant d'upload.
        - Le système doit tenter de pré-remplir le mapping.
        - Afficher un bouton "Valider le mapping et continuer".

    - **Étape 3 : Confirmation**
        - Afficher un résumé de l'action (nom du fichier, mapping).
        - Afficher le bouton final **"Lancer l'import"**.

### 3.3. Page de Détails d'un Import (`/admin/imports/.../details`)

- **Layout :**
    - Ajouter un **panneau de résumé** en haut de la page avec les statistiques clés :
        - `Total de lignes`
        - `Lignes en succès`
        - `Lignes en erreur`
- **Tableau de Logs :**
    - **Color-Coding :** Appliquer un fond de couleur aux lignes du tableau pour identifier leur statut :
        - Succès : Fond vert pâle (`#E8F5E9`).
        - Erreur : Fond rouge pâle (`#FFEBEE`).
- **Actions :**
    - Ajouter une section "Actions".
    - Si des erreurs existent, afficher un bouton **"Télécharger les lignes en erreur"** qui génère un CSV contenant uniquement les lignes qui ont échoué, pour faciliter leur correction.
