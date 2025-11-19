# Story b37-16: Amélioration: Gérer dynamiquement les prix lors de la création de sous-catégories

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Amélioration / Feature

## 1. Contexte

La logique de gestion des prix des catégories doit être améliorée pour être plus intuitive. Actuellement, le système empêche la création d'une sous-catégorie si la catégorie parente a un prix. Le comportement souhaité est d'autoriser la création de la sous-catégorie et de supprimer automatiquement le prix du parent, le transformant ainsi en un simple "conteneur".

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, lorsque je crée une sous-catégorie pour une catégorie qui était auparavant vendable (et avait donc un prix), je veux que **le système supprime automatiquement le prix de la catégorie parente**, afin de maintenir la cohérence du système sans action manuelle de ma part.

## 3. Critères d'Acceptation

1.  La logique de la fonction `create_category` dans le service `CategoryService` DOIT être modifiée.
2.  La règle actuelle qui lève une erreur `422` si le parent a un prix DOIT être supprimée.
3.  À la place, si une nouvelle catégorie est créée avec un `parent_id`, le code DOIT vérifier si le parent a un `price` ou un `max_price`.
4.  Si le parent a un prix, ces deux champs (`price` et `max_price`) DOIVENT être mis à `NULL` dans la même transaction que la création de l'enfant.

## 4. Solution Technique Recommandée

-   **Fichier à modifier :** `api/src/recyclic_api/services/category_service.py`.
-   **Fonction à modifier :** `create_category`.
-   **Logique à modifier :**
    -   Supprimer le bloc `if parent.price is not None...` qui lève l'exception.
    -   Après avoir trouvé le `parent`, ajouter une nouvelle logique : `if parent.price is not None or parent.max_price is not None: parent.price = None; parent.max_price = None`.

## 5. Prérequis de Test

- Créer une catégorie "A" avec un prix (ex: 10€).
- Créer une nouvelle catégorie "B" et la définir comme un enfant de "A".
- **Vérification :** La création de "B" doit réussir.
- Consulter à nouveau la catégorie "A".
- **Vérification :** Le prix de "A" doit maintenant être `NULL` (vide).
