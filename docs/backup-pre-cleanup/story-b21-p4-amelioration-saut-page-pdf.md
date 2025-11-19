# Story (Raffinements): Amélioration de la Gestion des Sauts de Page dans l'Export PDF des Catégories

**ID:** STORY-B21-P4
**Titre:** Amélioration de la Gestion des Sauts de Page dans l'Export PDF des Catégories
**Epic:** Maintenance & Dette Technique
**Priorité:** P3 (Moyenne)

---

## Objectif

**En tant que** Développeur Backend,  
**Je veux** améliorer la logique de génération de l'export PDF des catégories pour qu'un groupe (catégorie parente + ses enfants) ne soit jamais coupé par un saut de page,  
**Afin de** garantir une lisibilité et une présentation professionnelles du document.

## Contexte

La fonctionnalité d'export PDF des catégories est fonctionnelle, mais elle présente un problème de mise en page : un titre de catégorie peut se retrouver en bas d'une page, tandis que ses sous-catégories commencent sur la page suivante. Cette story vise à corriger ce comportement.

## Critères d'Acceptation

1.  La logique de génération du PDF est modifiée pour implémenter une fonctionnalité de type "KeepTogether".
2.  Avant d'écrire une catégorie parente et ses sous-catégories, le script doit vérifier s'il y a suffisamment d'espace restant sur la page actuelle.
3.  S'il n'y a pas assez d'espace, un saut de page doit être inséré **avant** d'écrire le titre de la catégorie parente.
4.  Le comportement est validé avec un jeu de données qui force ce cas de figure.

## Notes Techniques

-   **Fichier à investiguer :** Le service backend qui utilise la bibliothèque `reportlab` pour générer le PDF (probablement dans `api/src/recyclic_api/services/`).
-   **Logique `reportlab` :** Il faudra probablement utiliser des `Flowables` comme `KeepTogether` ou calculer manuellement la hauteur des blocs avant de les dessiner.

## Definition of Done

- [ ] Les groupes de catégories ne sont plus coupés par les sauts de page dans l'export PDF.
- [ ] La story a été validée par le Product Owner.
