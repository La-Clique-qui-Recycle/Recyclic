---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.048258
original_path: docs/stories/story-b23-p1-bug-alignement-footer-poids.md
---

# Story (Bug): Correction du Layout Cassé de la Saisie de Poids

**ID:** STORY-B23-P1
**Titre:** Correction du Layout Cassé de la Saisie de Poids
**Epic:** Refondation de l'Expérience Utilisateur et de l'Architecture Frontend
**Priorité:** P1 (Critique)

---

## Objectif

**En tant que** Développeur Frontend,  
**Je veux** refactoriser complètement le composant de saisie de poids pour que son layout soit stable, fonctionnel et aligné,  
**Afin de** résoudre le bug critique qui rend l'interface de caisse inutilisable.

## Contexte

Le rapport d'audit initial (`docs/qa/rapport-probleme-alignment-footer-poids.md`) a identifié un problème d'alignement du footer. Une nouvelle analyse (capture d'écran du 2025-10-09) montre que la situation est encore plus grave : le layout est complètement cassé, avec des éléments qui se superposent au reste du contenu, rendant la page inutilisable.

**Impact :** L'interface de saisie de la caisse est inutilisable. C'est un bug bloquant.

## Critères d'Acceptation

1.  **Refactoring du Composant `MultipleWeightEntry.tsx` :**
    -   Le composant est refactorisé en suivant l'**Option A** du rapport d'audit : une structure `flex-direction: column` avec une zone de liste scrollable (`flex: 1`) et un footer qui se positionne en bas (`margin-top: auto`).
    -   L'agent DEV doit s'inspirer de la structure du composant `Ticket.tsx` qui implémente déjà ce comportement.

2.  **Comportement Visuel Final :**
    -   Le footer contenant les boutons "Valider le poids total" et "Ajouter cette pesée" reste **fixe** en bas de sa colonne, sans jamais se superposer au contenu au-dessus.
    -   Il est visuellement aligné horizontalement avec le bouton "Finaliser la vente" du ticket.

3.  **Tests de Non-Régression :**
    -   La suite de tests pour ce composant est mise à jour pour vérifier que la position verticale du footer ne change pas après l'ajout de plusieurs pesées.

## Instructions pour l'Agent DEV

1.  **Utiliser l'outil `chrome-devtool` pour reproduire le bug.**
2.  **URL :** `http://localhost:4444/cash-register/sale`
3.  **Identifiants de connexion :**
    -   Utilisateur : `admintest`
    -   Mot de passe : `PassTest!1`

## Références

-   **Rapport de Bug (Source de Vérité) :** `docs/qa/rapport-probleme-alignment-footer-poids.md`
-   **Composant de Référence :** `frontend/src/components/business/Ticket.tsx`

## Definition of Done

- [ ] Le layout de la saisie de poids est stable, fonctionnel et correctement aligné.
- [ ] Le comportement est validé par des tests automatisés.
- [ ] La story a été validée par le Product Owner.
