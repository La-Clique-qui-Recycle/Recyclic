# Story b34-p32: Bug: Le sélecteur de catégories est inutilisable

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug / Amélioration UX
**Priorité:** Critique

## 1. Contexte

L'audit UX de Sally (`b34-p27`) a identifié comme point de friction critique le menu déroulant de sélection des catégories, notamment dans l'interface de réception. Avec plus de 100 options, il est impossible pour un utilisateur de trouver rapidement la catégorie qu'il cherche, ce qui rend le composant inutilisable en pratique.

## 2. User Story (En tant que...)

En tant qu'**Utilisateur**, lorsque je dois sélectionner une catégorie dans une longue liste, je veux **pouvoir rechercher et filtrer les options directement dans le menu déroulant**, afin de trouver rapidement et efficacement la catégorie dont j'ai besoin.

## 3. Critères d'Acceptation

1.  Tous les menus déroulants de sélection de catégorie (`Select` ou `MultiSelect` de la librairie Mantine) qui contiennent une longue liste DOIVENT être modifiés.
2.  La propriété `searchable` de ces composants DOIT être activée.
3.  Un texte d'aide (`placeholder` ou `description`) DOIT indiquer à l'utilisateur qu'il peut taper pour rechercher (ex: "Tapez pour rechercher une catégorie...").
4.  La modification DOIT être appliquée au minimum sur le formulaire de création de ligne de dépôt (`TicketForm.tsx`) et sur tout autre endroit où un sélecteur de catégorie est utilisé.

## 4. Solution Technique Recommandée

-   **Composants à identifier :** L'agent devra identifier tous les composants de l'application qui utilisent un `Select` ou `MultiSelect` pour les catégories.
-   **Composant principal :** `frontend/src/pages/Reception/TicketForm.tsx` est le premier candidat.
-   **Modification :** Pour chaque composant identifié, ajouter la prop `searchable` au composant Mantine. Exemple :
    ```jsx
    <Select
      label="Catégorie"
      placeholder="Tapez pour rechercher..."
      searchable
      data={...}
      {...}
    />
    ```

## 5. Prérequis de Test

- Se connecter avec un compte ayant accès à la réception (`reception.access`).
- Aller sur la page de création/modification d'un ticket de dépôt.
- **Vérification :**
    - Cliquer sur le menu déroulant des catégories.
    - Un champ de recherche doit être présent.
    - Taper quelques lettres (ex: "pla") doit filtrer la liste pour n'afficher que les catégories correspondantes (ex: "Plastiques").
