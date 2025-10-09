# UI/UX Refactor Specification: Optimisation de l'Interface de Caisse

**Version:** 2.0
**Date:** 2025-10-08
**Auteur:** Sally (UX Expert)
**Contexte:** Ce document finalise la refonte de l'interface de caisse (`/cash-register/sale`) en se basant sur une analyse approfondie du workflow existant et des captures d'écran plein écran. L'objectif est de résoudre les problèmes de layout tout en préservant la logique métier et l'efficacité de la saisie rapide.

---

## 1. Principe Directeur : Préservation du Workflow, Refonte du Contenant

**CRITIQUE :** Cette refonte est **visuelle et structurelle, PAS logique**. Toute la logique métier existante doit être conservée :

-   Le **workflow séquentiel** (Catégorie -> Sous-catégorie -> Poids -> Quantité -> Prix).
-   Le **focus automatique** sur les champs de saisie à chaque étape.
-   Les **raccourcis clavier** (`Entrée` pour valider, `+` pour ajouter une pesée).
-   La logique d'**addition des pesées** pour un même article.

L'objectif est de transposer ce workflow dans une interface plus cohérente, compacte et adaptable.

---

## 2. Layout Général : Mode "Kiosque" Plein Écran

1.  **Suppression du Header Principal :** Le header vert de l'application doit être supprimé/masqué dans la vue de la caisse.
2.  **Header de Session :** Le remplacer par une barre de session fine et discrète en haut de l'écran, contenant le nom du caissier et le bouton "Fermer la Caisse".
3.  **Adaptation à la Hauteur :** L'ensemble de l'interface doit s'adapter dynamiquement à la hauteur de la fenêtre du navigateur pour éliminer tout besoin de scroll.

---

## 3. Structure de la Vue de Saisie

La vue de saisie (après la sélection de la catégorie/sous-catégorie) est standardisée sur un layout à 2 colonnes.

### 3.1. Colonne de Gauche : Le Pavé Numérique Unifié

-   **Composant Unique :** Créer un seul composant `Numpad` qui sera réutilisé pour toutes les étapes de saisie numérique (Poids, Quantité, Prix).
-   **Design :** Le pavé doit avoir un design unique et cohérent (ex: 12 touches carrées : 0-9, point, et une touche "Effacer").
-   **Position :** Il est **fixe** dans la colonne de gauche. Sa taille s'adapte à la hauteur de l'écran.

### 3.2. Colonne de Droite : La Zone d'Action Contextuelle

Cette colonne affiche dynamiquement le contenu de l'étape en cours. Sa structure est la même, mais ses éléments varient.

-   **Structure (de haut en bas) :**
    1.  **Titre de l'Étape** (ex: "Saisir le Poids").
    2.  **Champ d'Affichage** de la valeur saisie.
    3.  **Zone d'Information Contextuelle** (flexible en hauteur pour l'adaptation verticale).
    4.  **Boutons d'Action Spécifiques** (si nécessaire).
    5.  **Bouton de Validation Principal** (toujours en bas de la colonne).

-   **Contenu par Étape :**

    -   **Étape "POIDS" :**
        -   *Zone d'info :* Affiche la liste des pesées additionnées.
        -   *Bouton d'action :* Affiche le bouton **`+ Ajouter une pesée`**.
        -   *Bouton de validation :* "Valider le poids total".

    -   **Étape "QUANTITÉ" :**
        -   *Zone d'info :* Affiche le pré-calcul `quantité x prix`.
        -   *Bouton d'action :* Aucun.
        -   *Bouton de validation :* "Valider la quantité".

    -   **Étape "PRIX" :**
        -   *Zone d'info :* Peut afficher un rappel de la fourchette de prix.
        -   *Bouton d'action :* Aucun.
        -   *Bouton de validation :* "Valider le prix".

---

## 4. Instructions Finales pour le Développement

1.  **Priorité 1 :** Isoler la logique métier existante de sa présentation visuelle.
2.  **Créer le composant `Numpad` réutilisable.**
3.  **Créer un composant `SaisieEtape`** qui prend en paramètre le type d'étape (`'poids'`, `'quantite'`, `'prix'`) et affiche dynamiquement le contenu de la colonne de droite.
4.  **Refondre la page de caisse** pour utiliser ce nouveau layout à 2 colonnes, en supprimant le header et en assurant l'adaptation verticale.
5.  **Vérifier** que tous les raccourcis clavier et le focus automatique fonctionnent comme avant.
