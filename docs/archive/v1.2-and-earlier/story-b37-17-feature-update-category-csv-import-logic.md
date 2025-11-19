# Story b37-17: Amélioration: Mettre à jour la logique d'import CSV des catégories

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Amélioration / Feature
**Dépendance :** `b37-16`

## 1. Contexte

Suite à la clarification des règles de gestion des prix pour les catégories (story `b37-16`), il est impératif de mettre à jour la logique d'import CSV pour qu'elle respecte ces mêmes règles. Actuellement, le service d'import a une logique inverse qui empêche la cohérence des données.

## 2. User Story (En tant que...)

En tant qu'**Administrateur**, lorsque j'importe un fichier CSV de catégories, je veux que **le système valide le fichier en respectant les nouvelles règles de gestion des prix**, afin de garantir la cohérence des données, que je fasse une modification manuelle ou un import en masse.

## 3. Critères d'Acceptation

La logique du `CategoryImportService` DOIT être modifiée pour respecter les règles suivantes :

1.  **Phase d'Analyse (`analyze`) :**
    *   La règle qui génère une erreur si un prix est fourni pour une catégorie racine DOIT être supprimée.
    *   L'analyse DOIT maintenant vérifier qu'une catégorie dans le fichier n'a pas à la fois un prix ET des enfants.
    *   Si une catégorie a un prix et qu'une autre ligne la définit comme parente, l'analyse DOIT générer un **avertissement** (pas une erreur bloquante) indiquant que le prix du parent sera supprimé.

2.  **Phase d'Exécution (`execute`) :**
    *   La logique d'import DOIT implémenter la **suppression automatique du prix d'un parent** lorsqu'un enfant lui est assigné, comme défini dans la story `b37-16`.

## 4. Solution Technique Recommandée

-   **Fichier à modifier :** `api/src/recyclic_api/services/category_import_service.py`.
-   **Fonction `analyze` :** Réécrire la logique de validation pour correspondre aux nouvelles règles.
-   **Fonction `execute` :** Après avoir assigné un `parent_id` à une sous-catégorie, vérifier si le parent a un prix. Si oui, le mettre à `NULL`.

## 5. Prérequis de Test

- Préparer un fichier CSV de test qui inclut le cas suivant :
    - Une catégorie parente "A" avec un prix, et une autre ligne qui définit une catégorie "B" comme enfant de "A".
- Lancer l'analyse de ce fichier.
- **Vérification :** L'analyse doit réussir et afficher un avertissement pour le cas où le prix du parent sera supprimé.
- Exécuter l'import.
- **Vérification :** La catégorie parente "A" doit avoir vu son prix supprimé au profit de son nouvel enfant "B".

## 6. Dev Agent Record

### ✅ Tâches Complétées
- [x] Supprimer la règle qui empêche les prix sur les catégories racines dans la phase d'analyse
- [x] Ajouter une logique d'avertissement pour les cas où le prix du parent sera supprimé
- [x] Implémenter la suppression automatique des prix du parent dans la phase d'exécution
- [x] Ajouter la gestion des prix sur les catégories racines (correction du bug d'import)
- [x] Tester la fonctionnalité avec des cas de test

### 📁 Fichiers Modifiés
- `api/src/recyclic_api/services/category_import_service.py` - Logique d'import mise à jour
- `api/tests/test_category_import_price_logic.py` - Tests ajoutés

### 🧪 Tests Ajoutés
- Test d'import CSV avec conflit de prix parent/enfant
- Test d'import CSV avec prix sur catégories racines
- Test de scénario mixte avec plusieurs catégories

### 📝 Notes d'Implémentation
- **Phase d'Analyse** : Suppression de la règle bloquante, ajout d'avertissements
- **Phase d'Exécution** : Suppression automatique des prix du parent + gestion des prix sur racines
- **Correction** : Ajout de la logique manquante pour importer les prix sur les catégories racines
- **Cohérence** : Alignement avec les règles de la story B37-16
