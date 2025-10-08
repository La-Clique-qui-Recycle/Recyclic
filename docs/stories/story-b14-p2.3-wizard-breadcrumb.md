# Story (Frontend): Implémentation du Fil d'Ariane de Saisie

**ID:** STORY-B14-P2.3-WIZARD-BREADCRUMB
**Titre:** Implémentation du Fil d'Ariane pour l'Assistant de Saisie
**Epic:** Évolution du Workflow de Vente en Caisse
**Priorité:** P2 (Élevée)
**Statut:** Done

---

## User Story

**En tant que** Caissier,
**Je veux** voir un résumé de l'article que je suis en train de saisir à chaque étape de l'assistant,
**Afin de** ne pas perdre le fil et de vérifier les informations avant de valider.

## Acceptance Criteria

1.  Un composant de type "fil d'Ariane" ou "ligne de ticket temporaire" est affiché en permanence pendant les étapes de l'assistant de saisie.
2.  Ce composant se met à jour à chaque étape pour afficher les informations déjà saisies (ex: "Catégorie > Sous-catégorie", puis "..., Qté: 3", puis "..., Poids: 1.2kg", etc.).

## Tasks / Subtasks

- [x] **Création du Composant :**
    - [x] Créer un nouveau composant `StagingItem.tsx` (ou `WizardBreadcrumb.tsx`).
- [x] **Props et Affichage :**
    - [x] Ce composant doit accepter en props les données de l'article en cours de saisie (catégorie, quantité, poids, etc.).
    - [x] Il doit afficher ces informations de manière claire et concise.
- [x] **Intégration :**
    - [x] Intégrer ce composant dans le `SaleWizard.tsx`.
    - [x] Lui passer les données de l'état actuel de l'assistant à chaque re-render.

## Dev Notes

-   **Dépendance :** Cette story dépend de la fin de `STORY-B14-P2.2`.
-   Ce composant est principalement un composant d'affichage ("dumb component"), sa logique est simple.

## Definition of Done

- [x] Le fil d'Ariane est visible et se met à jour correctement à chaque étape du wizard.
- [ ] La story a été validée par un agent QA.

---

## Dev Agent Record

### Agent Model Used
- dev (James) — Full Stack Developer 💻

### Completion Notes
- Implémentation du composant `StagingItem` affichant: catégorie, sous-catégorie, quantité, poids (2 décimales), prix (2 décimales) avec séparateurs.
- Intégration dans `SaleWizard` avec calcul mémoïsé des props à partir de l’état courant.
- Couverture de tests: unitaires pour `StagingItem` (formatage/affichages) et intégration dans `SaleWizard` (mise à jour du breadcrumb à chaque étape, reset après completion, logique de saut de prix si prix fixe).

### File List
- frontend/src/components/business/StagingItem.tsx (ajout)
- frontend/src/components/business/SaleWizard.tsx (édition: intégration `StagingItem` + mapping des données)
- frontend/src/components/business/StagingItem.test.tsx (ajout)
- frontend/src/components/business/SaleWizard.test.tsx (édition: cas d’intégration breadcrumb)

### Change Log
- Ajout du composant `StagingItem` et de ses tests unitaires.
- Intégration du composant dans `SaleWizard` avec `useMemo` pour construire les données.
- Ajout/MAJ des tests d’intégration pour vérifier les mises à jour du fil d’Ariane à chaque étape et le reset.

### Debug Log References
- Exécution Vitest ciblée: 36 tests passés (13 `StagingItem`, 23 `SaleWizard`).

### Status
- Ready for Review

## QA Results

**Relecteur QA:** Quinn (Test Architect & Quality Advisor)

**Date de revue:** 2025-10-07

**Décision de gate:** PASS

**Confiance:** ÉLEVÉE

**Type de revue:** frontend_feature

### Validation des critères d’acceptation
1. Fil d’Ariane/ligne de ticket affiché en continu: composant `StagingItem` intégré dans `SaleWizard`.
2. Mise à jour à chaque étape avec données saisies: props dérivées via `useMemo`, tests d’intégration confirment mises à jour et reset.

### Couverture de tests (déclarative)
- 13 tests unitaires `StagingItem` (formatage quantité/poids/prix, libellés, séparateurs)
- 23 tests `SaleWizard` couvrant intégration du breadcrumb, updates par étape et reset

### Risques et points d’attention
- Accessibilité: rôles ARIA/annonces pour lecteurs d’écran, ordre tab, focus non bloquant.
- Internationalisation: cohérence formats (2 décimales, séparateurs espace/virgule) et unités.
- Performance: recalcul mémoïsé OK; vérifier re-renders inutiles si état global change souvent.

### NFR rapides
- Maintenabilité: composant d’affichage isolé, dépendances minimes.
- Observabilité: envisager trace d’événements UX (changement étape, reset breadcrumb) si utile produit.

### Recommandations (non bloquantes)
- Ajouter tests d’accessibilité (axe-core/aria-live si nécessaire).
- Centraliser formateurs (quantité/poids/prix) pour éviter divergence avec autres écrans.
- Un test E2E happy path pour vérifier rendu cohérent du breadcrumb sur tout le flux.

— Gate: PASS (critères satisfaits, risques résiduels mineurs)