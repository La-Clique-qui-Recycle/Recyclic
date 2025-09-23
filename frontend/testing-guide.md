# Frontend Testing Guide (Vitest + React Testing Library)

## 📜 Stratégie Architecturale
Ce guide est spécifique au frontend. Pour les principes généraux de test (Mocks, Fixtures, E2E) qui s'appliquent à tout le projet, veuillez consulter la charte principale.

-> [Consulter la Charte de Stratégie de Test](../../docs/testing-strategy.md)

Objectif: fournir un cadre clair, stable et reproductible pour écrire des tests frontend sans flaky, compatible React 18, Mantine, Zustand, jsdom, et nos conventions de projet.

## 1. Environnement & Configuration

- Runner: Vitest
- Lib: @testing-library/react, @testing-library/user-event
- Setup global: `src/test/setup.ts`
- Config vitest: `vitest.config.js`

Commandes utiles:

```bash
# Lancer tous les tests
npx vitest run

# Lancer un fichier
npx vitest run src/test/hooks/useAuth.test.ts

# Mode watch
npx vitest
```

## 2. Règles Globales (React 18)

- Toujours encapsuler les interactions dans `act(async () => { ... })` quand un effet ou setState est impliqué.
- Préférer `await waitFor(() => { assertions })` pour observer les re-renders plutôt que des artifices (setTimeout, micro/macro-tâches).
- Éviter les sélecteurs fragiles: préférer `getByRole`, `getByLabelText`, `getByTestId` (avec data-testid) selon le contexte.
- Les hooks retournent leurs actions; ne pas appeler des actions hors du hook de test.

## 3. Mocks & Setup (appris de notre stabilisation)

- `react-router-dom`: mocké dans `setup.ts` (MemoryRouter, useNavigate mocké, etc.).
- `@mantine/core`, `@mantine/notifications`, `@mantine/dates`: mocks cohérents pour rendre testables les composants (Portal, Modal, Select, Table, etc.).
- Icônes (`lucide-react`, `@tabler/icons-react`): mocks légers avec `data-testid` pour les sélecteurs.
- `styled-components`: mock minimal conservant les tags (`div`, `table`, etc.) pour éviter les erreurs (ex: `styled.table`).
- `axios`: mocké via `vi.mock('axios')` dans `setup.ts` pour les tests qui n’injectent pas leur propre mock. Les tests d’API spécifiques doivent contrôler leur propre mock explicitement.
- Stubs jsdom: `URL.createObjectURL`, `HTMLAnchorElement.click`, `matchMedia`, `ResizeObserver`, `scrollIntoView`.

## 4. Patterns Fiables par Type de Test

### 4.1 Hooks (ex: useAuth)

Mauvais (flaky):
```ts
await act(async () => {
  result.current.login(user)
  // setTimeout ou Promise.resolve pour forcer
})
rerender()
expect(result.current.user).toEqual(user)
```

Bon (stable):
```ts
await act(async () => {
  const res = await result.current.login(user)
  expect(res?.success).toBe(true)
})
await waitFor(() => {
  expect(result.current.user).toEqual(user)
  expect(result.current.isAuthenticated).toBe(true)
})
```

Notes:
- Ne pas compter sur des macro/micro-tâches artificielles.
- Utiliser `waitFor` pour observer l’état après `act`.
- Isoler les mocks entre tests: utiliser `vi.resetAllMocks()` en `afterEach()` (et reconfigurer les valeurs minimales en `beforeEach`).

### 4.2 Pages/Composants (Mantine)

- Préférer des `data-testid` explicites sur les éléments interactifs et ambigus (plusieurs occurrences possibles).
- Pour `Modal`, `Portal`, `Table` (Mantine), s’appuyer sur les mocks fournis en setup; cibler `role="dialog"`, `data-testid`.
- Préférer `userEvent` pour les interactions utilisateur; utiliser `await` et `waitFor` pour les effets.

### 4.3 Intégration (workflows)

- Éviter `getByText` ambigu; utiliser `getAllByText` avec index si nécessaire ou `getByTestId`.
- Encadrer les transitions asynchrones avec `await waitFor`.

## 5. Checklists Anti-Flaky

- [ ] Encadrer toute action changeant l’état par `act(async () => { ... })`.
- [ ] Observer les changements avec `waitFor` (pas de setTimeout/Promise.resolve).
- [ ] Réinitialiser les mocks entre tests: `vi.resetAllMocks()` dans `afterEach`.
- [ ] Re-stubber les méthodes nécessaires en `beforeEach` (ex: `localStorage.getItem.mockReturnValue(null)`).
- [ ] Préférer des sélecteurs robustes (`role`, `label`, `testid`).
- [ ] Injecter des `data-testid` sur les éléments ambigus.
- [ ] Les tests d’API contrôlent leurs mocks axios localement (éviter les fuites d’état de setup global).

## 6. Pièges Rencontrés & Résolutions

- Problème: deux tests `useAuth` ne voyaient pas l’état mis à jour malgré setState synchrone.
  - Cause: fuite de mock (implémentation `localStorage.setItem` modifiée par un test précédent) + lecture d’instantané avant re-render.
  - Fix: `vi.resetAllMocks()` en `afterEach()`, `waitFor` après `act`, et assertions sur la réponse de l’action.

- Problème: Sélecteurs ambigus (`getByText`, `getByDisplayValue`).
  - Fix: `getByTestId` dédiés, `getAllByText(...)[0]` quand plusieurs occurrences sont attendues, ou selectors accessibles (`role`, `label`).

- Problème: Composants Mantine et Portals.
  - Fix: mocks cohérents dans `setup.ts` (Modal, Portal, Table, Select) + stubs jsdom.

- Problème: Icônes/Styled-components qui cassent le render.
  - Fix: mocks simples avec `data-testid`, mapping des tags manquants (`table`, etc.).

## 7. Bonnes Pratiques d’Écriture de Tests

- Noms explicites: `should <action> <expected>`.
- Arrange-Act-Assert structuré.
- Pas d’assertions à l’intérieur de `waitFor` qui ne peuvent jamais devenir vraies (éviter les conditions immuables).
- Nettoyage de state global entre tests (mocks, localStorage si altéré).
- Garder les tests rapides: isoler le réseau derrière des mocks.

## 8. Exemple Référence (useAuth)

```ts
it('should handle multiple login attempts', async () => {
  const { result } = renderHook(() => useAuth())

  await act(async () => {
    const r1 = await result.current.login(user1)
    expect(r1?.success).toBe(true)
  })
  await waitFor(() => expect(result.current.user).toEqual(user1))

  await act(async () => {
    const r2 = await result.current.login(user2)
    expect(r2?.success).toBe(true)
  })
  await waitFor(() => expect(result.current.user).toEqual(user2))
})
```

## 9. Maintenance & Évolution

- Tout nouveau composant complexe Mantine: ajouter les attributs `data-testid` sur les contrôles clés.
- Toute nouvelle dépendance UI: ajouter un mock minimal en `setup.ts`.
- Lorsqu’un test devient flaky: vérifier en priorité (1) isolation des mocks, (2) sélecteurs, (3) usage d’`act`+`waitFor`.

## 10. Références

- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Vitest: https://vitest.dev/
- React 18 `act`: https://react.dev/reference/test-utils/act
