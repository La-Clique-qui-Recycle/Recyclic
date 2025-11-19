# Story (Refactoring): Refonte du Workflow de Saisie de la Caisse

**ID:** STORY-B15-P1
**Titre:** Refonte du Workflow de Saisie de la Caisse
**Epic:** Refonte du Workflow de Caisse V2
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Frontend,  
**Je veux** refondre l'assistant de saisie de la caisse pour l'aligner avec les nouvelles spécifications métier,  
**Afin de** fournir une expérience utilisateur plus précise, ergonomique et conforme aux besoins de la ressourcerie.

## Contexte

L'assistant de saisie actuel a été développé sur des spécifications incomplètes. Cette story vise à le refactoriser pour intégrer la gestion des sous-catégories, de la quantité, du poids, et pour corriger la logique de calcul du prix.

## Critères d'Acceptation

1.  **Affichage des Catégories :**
    -   La première étape de l'assistant n'affiche que les **catégories racines** (celles sans `parent_id`).
    -   L'ID de la catégorie n'est plus visible dans l'interface.

2.  **Étape "Quantité" :**
    -   Une nouvelle étape "Quantité" est ajoutée après la sélection de la sous-catégorie.
    -   Le pavé numérique pour la quantité inclut un bouton "Retour Arrière" (Backspace).

3.  **Étape "Poids" :**
    -   L'interface de saisie du poids est repensée : le pavé numérique est visible immédiatement.
    -   La liste des pesées multiples (si nécessaire) s'affiche dans une colonne dédiée à gauche.

4.  **Calcul du Prix :**
    -   La logique de calcul du prix est corrigée. Le prix final d'une ligne est maintenant calculé comme suit : `Prix de la sous-catégorie * Quantité`.

## Notes Techniques

-   **Workflow Cible :** `Catégorie` -> `Sous-catégorie` -> `Quantité` -> `Poids` -> `Prix`.
-   **Fichiers à modifier :** Principalement `frontend/src/components/business/SaleWizard.tsx` et les composants qu'il utilise.
-   L'agent DEV devra s'inspirer de l'ergonomie du module de Réception pour la saisie du poids.

## Definition of Done

- [x] Le workflow de saisie suit les 5 nouvelles étapes.
- [x] Les problèmes d'affichage des catégories, de saisie de la quantité et du poids sont corrigés.
- [x] La logique de calcul du prix est correcte.
- [ ] La story a été validée par le Product Owner.

## Dev Agent Record

### Tâches Implémentées

- [x] **Affichage des Catégories** - Modifié `CategorySelector.tsx` pour filtrer et afficher uniquement les catégories racines (sans `parent_id`) et masquer l'ID dans l'interface
- [x] **Étape Quantité** - Ajouté le bouton "Backspace" (⌫) dans le pavé numérique pour permettre la correction facile
- [x] **Interface de Saisie du Poids** - Refactorisé `MultipleWeightEntry.tsx` pour afficher le pavé numérique en permanence et organiser l'interface en deux colonnes
- [x] **Calcul du Prix** - Corrigé la logique de calcul dans `SaleWizard.tsx` : Prix final = Prix unitaire × Quantité
- [x] **Workflow Complet** - Implémenté le workflow : Catégorie → Sous-catégorie → Quantité → Poids → Prix

### Fichiers Modifiés

- `frontend/src/components/business/CategorySelector.tsx`
- `frontend/src/components/business/SaleWizard.tsx`
- `frontend/src/components/business/MultipleWeightEntry.tsx`

### Agent Model Used

James (Full Stack Developer) - Implémentation complète de la refonte du workflow de saisie de caisse

### Debug Log References

- Aucune erreur de linting introduite
- Tests existants passent (erreurs affichées sont pré-existantes)
- Interface plus ergonomique et conforme aux spécifications métier

### Completion Notes

- ✅ **Interface Catégories** : Filtrage des catégories racines et masquage de l'ID
- ✅ **Pavé Quantité** : Ajout du bouton Backspace pour correction facile
- ✅ **Interface Poids** : Pavé numérique permanent avec liste des pesées à gauche
- ✅ **Calcul Prix** : Logique corrigée (Prix unitaire × Quantité)
- ✅ **Workflow** : Ordre des étapes respecté et fonctionnel

### File List

- `frontend/src/components/business/CategorySelector.tsx` - Modifié pour filtrer catégories racines
- `frontend/src/components/business/SaleWizard.tsx` - Modifié pour calcul du prix et workflow
- `frontend/src/components/business/MultipleWeightEntry.tsx` - Refactorisé interface poids

### Change Log

- **2025-01-07** : Implémentation complète de la refonte du workflow de saisie de caisse
  - Filtrage des catégories racines dans CategorySelector
  - Ajout du bouton Backspace dans l'étape quantité
  - Refactorisation de l'interface de saisie du poids
  - Correction de la logique de calcul du prix
  - Validation du workflow complet

### Status

**Ready for Review** - Implémentation terminée et prête pour validation par le Product Owner
