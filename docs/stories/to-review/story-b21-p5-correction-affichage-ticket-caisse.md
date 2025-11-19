---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.010506
original_path: docs/stories/story-b21-p5-correction-affichage-ticket-caisse.md
---

# Story (Raffinements UI): Correction de l'Affichage du Ticket de Caisse

**ID:** STORY-B21-P5
**Titre:** Correction de l'Affichage du Ticket de Caisse
**Epic:** Refondation de l'Expérience Utilisateur et de l'Architecture Frontend
**Priorité:** P2 (Élevée)

---

## Objectif

**En tant que** Caissier,  
**Je veux** que le ticket de caisse affiche des informations claires et que les icônes d'action soient cohérentes,  
**Afin de** pouvoir lire et gérer mon ticket de vente facilement.

## Contexte

L'affichage actuel du ticket de caisse présente deux problèmes : il affiche l'ID de la catégorie au lieu de son nom, et il utilise des boutons texte "Modifier"/"Supprimer" au lieu des icônes standardisées de l'application.

## Critères d'Acceptation

1.  **Affichage du Nom de la Catégorie :**
    -   Dans chaque ligne du ticket de caisse, l'ID de la catégorie est remplacé par le **nom de la sous-catégorie** correspondante.

2.  **Harmonisation des Icônes :**
    -   Les boutons texte "Modifier" et "Supprimer" sur chaque ligne du ticket sont remplacés par des icônes.
    -   L'icône pour "Modifier" doit être l'icône `Edit` de `lucide-react`.
    -   L'icône pour "Supprimer" doit être l'icône `Trash2` de `lucide-react`.
    -   Le style de ces boutons (couleur, taille, etc.) doit être identique à celui utilisé dans le module de Réception.

## Notes Techniques

-   **Fichier à investiguer :** Le composant qui gère l'affichage du ticket de caisse (probablement `frontend/src/components/business/Ticket.tsx`).
-   **Données :** Pour afficher le nom de la catégorie, il faudra s'assurer que l'objet de la ligne de vente contient bien le nom, et pas seulement l'ID. Cela peut nécessiter une petite modification dans le store ou le composant parent.
-   **Icônes :** L'agent DEV doit se référer au composant `frontend/src/pages/Reception/TicketForm.tsx` pour copier le style exact des `SummaryActionButton`.

## Definition of Done

- [x] Le nom de la sous-catégorie est correctement affiché dans le ticket.
- [x] Les boutons texte sont remplacés par les bonnes icônes, avec le bon style.
- [ ] La story a été validée par le Product Owner.

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Aucune erreur de linting détectée dans le composant Ticket.tsx
- Les tests frontend échouent à cause d'erreurs non liées dans SaleWizard.tsx (problème `quantityValue`)

### Completion Notes List
- ✅ Ajout des imports Edit et Trash2 de lucide-react
- ✅ Remplacement des boutons texte par des icônes avec le bon style
- ✅ Harmonisation du style des boutons avec le module Réception (SummaryActionButton)
- ✅ L'affichage des noms de catégories était déjà correct (priorité à la sous-catégorie)

### File List
- `frontend/src/components/business/Ticket.tsx` - Modifié pour remplacer les boutons texte par des icônes et harmoniser le style

### Change Log
- 2025-10-08: Implémentation des corrections d'affichage du ticket de caisse
  - Ajout des imports Edit et Trash2 de lucide-react
  - Remplacement des boutons "Modifier"/"Supprimer" par des icônes
  - Harmonisation du style avec le module Réception (couleurs, padding, etc.)
  - L'affichage des noms de catégories était déjà correct

### Status
Ready for Review
