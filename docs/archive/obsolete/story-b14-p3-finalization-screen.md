# Story (Frontend): Implémentation de l'Écran de Finalisation de Vente

**ID:** STORY-B14-P3-FINALIZATION-SCREEN
**Titre:** Implémentation de l'Écran de Finalisation de Vente (Don, Paiement, Monnaie)
**Epic:** Évolution du Workflow de Vente en Caisse
**Priorité:** P1 (Critique)
**Statut:** Done

---

## User Story

**En tant que** Caissier,
**Je veux** un écran de finalisation de vente qui me permet d'enregistrer un don, de choisir un moyen de paiement et de calculer la monnaie à rendre,
**Afin de** pouvoir clôturer une vente de manière complète et professionnelle.

## Acceptance Criteria

1.  Après avoir cliqué sur "Finaliser la vente", un nouvel écran (ou une modale) s'affiche.
2.  Cet écran contient un champ pour saisir un montant de "Don".
3.  Il contient un sélecteur pour le "Moyen de Paiement" (Espèces, Carte, Chèque).
4.  Si "Espèces" est sélectionné, un champ "Montant Donné" apparaît.
5.  Quand un montant est entré dans ce champ, le montant de la "Monnaie à rendre" est calculé et affiché automatiquement.
6.  La validation de cet écran envoie toutes les informations (y compris le don et le moyen de paiement) à l'API.

## Tasks / Subtasks

- [x] **Création du Composant :**
    - [x] Créer un nouveau composant `FinalizationScreen.tsx`.
    - [x] Ajouter les champs pour le don, le sélecteur de moyen de paiement, et le champ conditionnel pour le montant donné.
- [x] **Logique de Calcul :**
    - [x] Implémenter la logique pour calculer la monnaie à rendre : `Monnaie = Montant Donné - (Total Ticket + Don)`.
- [x] **Intégration :**
    - [x] Modifier la page `Sale.tsx` pour afficher ce nouvel écran après le clic sur "Finaliser la vente".
    - [x] Mettre à jour la fonction de soumission de la vente pour inclure les nouvelles données.

## Note pour les Tests (MCP DevTool)

- Pour tester manuellement l'interface, utilisez les identifiants suivants :
- **Utilisateur :** `admintest`
- **Mot de passe :** `AdminTest1!`

## Definition of Done

- [x] L'écran de finalisation est fonctionnel, y compris le calcul de la monnaie.
- [x] Les données de don et de moyen de paiement sont prêtes à être envoyées à l'API.
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

### Agent Model Used
- dev (James) — Full Stack Developer 💻

### Completion Notes
- Ajout du composant `FinalizationScreen` (don, moyen de paiement: espèces/carte/chèque, champ conditionnel Montant donné, calcul automatique de la monnaie).
- Intégration dans `Sale.tsx` (ouverture via bouton "Finaliser la vente", validation renvoyant les données de finalisation).
- Extension de `useCashSessionStore.submitSale(items, finalization)` pour transmettre `donation`, `payment_method`, `cash_given`, `change`.
- Tests: unitaires pour `FinalizationScreen` (5) et intégration `Sale.finalization` (2) OK.

### File List
- frontend/src/components/business/FinalizationScreen.tsx (ajout)
- frontend/src/components/business/FinalizationScreen.test.tsx (ajout)
- frontend/src/pages/CashRegister/Sale.tsx (édition: intégration écran de finalisation)
- frontend/src/pages/CashRegister/__tests__/Sale.finalization.test.tsx (ajout)
- frontend/src/stores/cashSessionStore.ts (édition: extension payload de vente)
- frontend/src/test/setup.ts (édition: mock global `window.alert`)

### Change Log
- Création du composant d'écran de finalisation avec logique de monnaie.
- Intégration dans le flux de vente et extension du store pour inclure les métadonnées de paiement.
- Ajout de tests unitaires et d'intégration.

### Debug Log References
- Vitest ciblé: 7 tests passés pour la feature (5 + 2).

### Status
- Ready for Review

## QA Results

**Relecteur QA:** Quinn (Test Architect & Quality Advisor)

**Date de revue:** 2025-10-07

**Décision de gate:** PASS

**Confiance:** ÉLEVÉE

**Type de revue:** frontend_feature

### Validation des critères d’acceptation
1. Écran/modal de finalisation après clic: implémenté dans `Sale.tsx` et testé.
2. Champ Don: présent et pris en compte dans le calcul.
3. Sélecteur Moyen de Paiement: espèces/carte/chèque disponibles.
4. Champ conditionnel "Montant Donné" pour espèces: affiché correctement.
5. Calcul automatique de la monnaie: `Monnaie = Montant Donné - (Total + Don)` confirmé par tests.
6. Soumission incluant don et moyen de paiement à l’API: payload étendu via store confirmé par tests.

### Couverture de tests (déclarative)
- 5 tests unitaires `FinalizationScreen` (affichages/conditions/calcul monnaie)
- 2 tests d’intégration `Sale.finalization` (workflow et payload)

### Risques et points d’attention
- Validation numérique/arrondis des montants (don, donné, monnaie) — définir précision (ex: 2 décimales) et stratégie d’arrondi.
- Accessibilité: navigation clavier dans l’écran/modale, labels explicites.
- UX: messages d’erreur/retours utilisateur pour montants insuffisants ou formats invalides.

### NFR rapides
- Performance: calcul trivial, risque faible.
- Maintenabilité: logique localisée; veiller à centraliser helpers monétaires pour cohérence.
- Observabilité: envisager journalisation d’événements (choix moyen paiement, calcul monnaie) si nécessaire.

### Recommandations (non bloquantes)
- Centraliser les fonctions de format/arrondi monétaire (util partagé) et ajouter tests dédiés.
- Ajouter tests d’accessibilité/a11y (axe-core, focus trap si modale).
- Ajouter un test E2E couvrant un paiement espèces avec monnaie et un paiement carte sans monnaie.

— Gate: PASS (critères satisfaits, risques résiduels mineurs maîtrisables)