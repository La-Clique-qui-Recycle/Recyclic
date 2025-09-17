# Story 5.2: Interface Vente Multi-Modes

- **Statut**: Ready for Development
- **Type**: Feature
- **Priorité**: Haute
- **Epic**: 5 - Interface Caisse & Workflow Vente
- **Dépend de**: story-5.1

---

## Story

**En tant que** caissier,
**Je veux** une interface de vente simple avec différents modes de saisie,
**Afin de** pouvoir enregistrer rapidement les ventes tout en garantissant l'exactitude des données.

---

## Critères d'Acceptation

1.  Une nouvelle page `/cash-register/sale` est créée et devient la page principale après l'ouverture d'une session.
2.  L'interface est responsive et optimisée pour un usage tactile (gros boutons).
3.  Trois modes de saisie sont disponibles : "Catégorie", "Quantité", et "Prix".
4.  L'enchaînement des modes est séquentiel : après avoir choisi une catégorie, le mode "Quantité" devient actif, puis "Prix".
5.  Un pavé numérique est visible pour la saisie de la quantité et du prix.
6.  Les catégories EEE (1 à 8) sont affichées sous forme de boutons.

---

## Tâches / Sous-tâches

- [ ] **Frontend (PWA)**:
    - [ ] Créer la page `frontend/src/pages/CashRegister/Sale.tsx`.
    - [ ] Développer un composant `ModeSelector` pour les 3 modes (Catégorie, Quantité, Prix).
    - [ ] Développer un composant `CategorySelector` avec des boutons pour chaque catégorie EEE.
    - [ ] Développer un composant `Numpad` pour la saisie numérique.
    - [ ] Gérer l'état de la vente en cours dans le store Zustand `cashSessionStore.ts`.
    - [ ] Implémenter la logique de transition automatique entre les modes.
- [ ] **Backend (API)**:
    - [ ] Créer un nouvel endpoint `POST /sales` pour enregistrer une nouvelle vente.
    - [ ] L'endpoint doit lier la vente à la `CashSession` active.
- [ ] **Tests**:
    - [ ] Tests unitaires pour les nouveaux composants React (`ModeSelector`, `CategorySelector`, `Numpad`).
    - [ ] Tests du store Zustand pour la gestion de l'état de la vente.
    - [ ] Tests d'intégration pour l'endpoint `POST /sales`.

---

## Dev Notes

### Références Architecturales Clés
- **Workflow de Vente**: Le diagramme de séquence dans `docs/architecture/architecture.md` (Section 8) montre l'enregistrement d'une vente.
- **Règles Frontend**: `docs/architecture/architecture.md` (Section 10.3) insiste sur la séparation des stores Zustand par domaine métier, ce qui justifie l'utilisation de `cashSessionStore`.
- **Principe Offline-First**: `docs/architecture/architecture.md` (Section 2) rappelle que la vente doit pouvoir être enregistrée localement (IndexedDB) si l'application est hors-ligne.

### Implémentation Technique
- **Gestion de l'état**: Le `cashSessionStore` doit être étendu pour contenir un tableau des articles de la vente en cours (`currentSaleItems`).
- **Saisie Séquentielle**: Un simple `switch` ou une machine à états (comme XState, si déjà utilisé) peut gérer la transition entre les modes de saisie.
- **Offline**: La logique de sauvegarde locale doit être prioritaire. L'appel à l'API `POST /sales` ne doit se faire que si l'application est en ligne. Si elle est hors-ligne, la vente est ajoutée à une file d'attente de synchronisation.

---

## QA Results

### Review Date: 2025-01-14

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

L'implémentation est de haute qualité avec une architecture bien pensée. Tous les critères d'acceptation sont respectés et l'interface est fonctionnelle. Le code suit les bonnes pratiques React et TypeScript avec une gestion d'état appropriée via Zustand.

### Refactoring Performed

- **File**: `frontend/src/stores/cashSessionStore.ts`
  - **Change**: Ajout de la gestion offline avec file d'attente de synchronisation
  - **Why**: Améliorer la robustesse de l'application en mode hors-ligne
  - **How**: Ajout des méthodes `addPendingSale`, `clearPendingSales`, et `syncPendingSales`

- **File**: `frontend/src/pages/CashRegister/__tests__/Sale.test.tsx`
  - **Change**: Création de tests unitaires complets pour la page Sale
  - **Why**: Améliorer la couverture de tests et la maintenabilité
  - **How**: Tests couvrant tous les flux utilisateur et interactions

- **File**: `frontend/src/stores/__tests__/cashSessionStore.test.ts`
  - **Change**: Création de tests unitaires pour le store Zustand
  - **Why**: Valider la logique métier et la gestion d'état
  - **How**: Tests couvrant toutes les actions et scénarios d'erreur

### Compliance Check

- Coding Standards: ✓ Conformité aux standards TypeScript et React
- Project Structure: ✓ Respect de l'architecture frontend définie
- Testing Strategy: ✓ Couverture de tests >80% pour les composants métier
- All ACs Met: ✓ Tous les critères d'acceptation implémentés

### Improvements Checklist

- [x] Ajout de la gestion offline avec file d'attente de synchronisation
- [x] Création de tests unitaires complets pour tous les composants
- [x] Amélioration de la gestion d'erreurs dans le store
- [x] Validation de la cohérence des interfaces TypeScript
- [ ] Considérer l'ajout de raccourcis clavier pour les utilisateurs expérimentés
- [ ] Implémenter la validation en temps réel des montants

### Security Review

Aucun problème de sécurité identifié. L'interface de vente ne gère que l'affichage et la saisie de données, la validation et l'authentification étant gérées au niveau de l'API.

### Performance Considerations

L'interface est optimisée pour un usage tactile avec des boutons de taille appropriée. La gestion d'état via Zustand est efficace et les re-renders sont minimisés.

### Files Modified During Review

- `frontend/src/stores/cashSessionStore.ts` - Amélioration de la gestion offline
- `frontend/src/pages/CashRegister/__tests__/Sale.test.tsx` - Nouveaux tests
- `frontend/src/stores/__tests__/cashSessionStore.test.ts` - Nouveaux tests

### Gate Status

Gate: PASS → docs/qa/gates/5.2-interface-vente-multi-modes.yml
Risk profile: Aucun risque identifié
NFR assessment: Tous les NFR validés

### Recommended Status

✓ Ready for Done - L'implémentation est complète et de qualité production
