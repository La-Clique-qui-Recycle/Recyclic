---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:13.919866
original_path: docs/stories/story-b21-p3-raffinements-layout-caisse.md
---

# Story (Raffinements UI): Raffinements du Layout de la Caisse

**ID:** STORY-B21-P3
**Titre:** Raffinements du Layout de la Caisse
**Epic:** Refondation de l'Expérience Utilisateur et de l'Architecture Frontend
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Caissier,  
**Je veux** une interface de saisie encore plus épurée et un pavé numérique mieux dimensionné,  
**Afin de** me concentrer sur l'essentiel et d'améliorer mon confort d'utilisation.

## Contexte

Suite aux premières optimisations, nous continuons d'affiner l'interface de la caisse pour la rendre aussi efficace que possible. Cette story se concentre sur la suppression d'éléments superflus et le redimensionnement du pavé numérique.

## Critères d'Acceptation

1.  **Suppression d'Éléments :**
    -   La section "Vente en cours" et l'espace blanc qui l'entoure sont complètement supprimés de l'interface de saisie de la caisse.
    -   La ligne de titre "Sélectionner la catégorie EEE" est supprimée.

2.  **Ajustement du Pavé Numérique (Poids) :**
    -   La largeur du pavé numérique est augmentée pour mieux occuper l'espace horizontal disponible.
    -   La hauteur du pavé numérique est ajustée pour être plus compacte, tout en conservant des zones de clic confortables.

## Notes Techniques

-   **Fichiers à modifier :** Principalement `frontend/src/components/business/SaleWizard.tsx` et les `styled-components` associés.
-   L'agent DEV devra ajuster les styles CSS (probablement les `padding`, `margin`, et `grid-template-columns`) pour accomplir ces changements.

## Definition of Done

- [x] Les éléments superflus ("Vente en cours", titre des catégories) ont été supprimés.
- [x] Le pavé numérique du poids a été redimensionné conformément à la demande.
- [ ] La story a été validée par le Product Owner.

### Dev Agent Record
- Agent Model Used: dev (James)

#### Tasks / Subtasks Checkboxes
- [x] Supprimer section "Vente en cours" et espace associé dans caisse
- [x] Supprimer la ligne de titre "Sélectionner la catégorie EEE"
- [x] Agrandir la largeur du pavé numérique du poids
- [x] Compacter la hauteur du pavé numérique tout en gardant des zones confortables

#### File List
- frontend/src/components/business/SaleWizard.tsx (suppression du titre de catégorie, retrait de `StagingItem`)
- frontend/src/components/business/MultipleWeightEntry.tsx (ajustements largeur/hauteur du numpad)

#### Change Log
- UI Caisse: épuration de l'interface (retrait éléments non essentiels) et ergonomie du pavé numérique améliorée (largeur accrue, hauteur compacte).

#### Debug Log References
- N/A

#### Completion Notes
- Ajustements CSS via styled-components, sans impact logique.
