# Story b37-14: Feature: Rendre les prix obligatoires pour les catégories sans enfants

**Statut:** ❌ Annulée - La prémisse de rendre les prix obligatoires était incorrecte.

## 1. Contexte

Cette story visait à rendre les prix obligatoires pour les catégories sans enfants. Cependant, le PO a clarifié que l'objectif est la flexibilité et non l'obligation. De plus, un problème plus critique de permissions a été identifié pour le rôle "admin". Cette story est donc annulée au profit d'une nouvelle story axée sur la correction des permissions.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, lorsque je crée ou modifie une catégorie, je veux **être obligé de définir un prix si cette catégorie n'a pas d'enfants**, afin d'éviter les erreurs de vente et de garantir que tous les articles vendables ont un prix.

## 3. Critères d'Acceptation

1.  Les endpoints de création (`POST /categories`) et de mise à jour (`PUT /categories/{id}`) DOIVENT être modifiés.
2.  Lors de la création ou de la mise à jour d'une catégorie, si la catégorie n'a **pas** de `parent_id` (c'est une catégorie racine) ou si elle n'a **pas** d'enfants, alors les champs `price` et `max_price` DOIVENT être obligatoires.
3.  Si un prix est manquant dans ce cas, l'API DOIT retourner une erreur `422 Unprocessable Entity` avec un message clair (ex: "Le prix est obligatoire pour une catégorie sans enfants").
4.  L'interface de création/modification de catégorie DOIT refléter cette logique en rendant les champs de prix visuellement obligatoires lorsque c'est nécessaire.

## 4. Solution Technique Recommandée

-   **Backend (Service) :** Dans `CategoryService`, dans les méthodes `create_category` et `update_category`, ajouter une logique de validation avant de commiter en base de données.
    -   Vérifier si la catégorie a des enfants (`db.query(Category).filter(Category.parent_id == category.id).first()`).
    -   Si non, vérifier que `category_data.price` et `category_data.max_price` ne sont pas `None`.
-   **Frontend :** Dans le formulaire de création/modification de catégorie, ajouter une logique conditionnelle pour rendre les champs de prix obligatoires (`required`) en fonction de la structure de la catégorie.

## 5. Prérequis de Test

- Essayer de créer une nouvelle catégorie racine sans enfants et sans prix.
- **Vérification :** L'API doit retourner une erreur 422.
- Créer une catégorie avec un prix.
- **Vérification :** La création doit réussir.
- Essayer de modifier une catégorie existante pour lui enlever son prix alors qu'elle n'a pas d'enfants.
- **Vérification :** L'API doit retourner une erreur 422.
