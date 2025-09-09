# Tests Frontend - Recyclic

## Structure des Tests

```
src/test/
├── components/          # Tests des composants
│   ├── ui/             # Composants UI de base
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   ├── Modal.test.tsx
│   │   └── Header.test.tsx
│   └── business/       # Composants métier
├── pages/              # Tests des pages
│   ├── Registration.test.tsx
│   ├── CashRegister.test.tsx
│   ├── Dashboard.test.tsx
│   ├── Deposits.test.tsx
│   └── Reports.test.tsx
├── services/           # Tests des services
│   ├── api.test.ts
│   ├── auth.test.ts
│   └── sync.test.ts
├── hooks/              # Tests des hooks personnalisés
├── stores/             # Tests des stores Zustand
├── utils/              # Tests des utilitaires
│   └── validation.test.ts
├── integration/        # Tests d'intégration
│   └── registration-workflow.test.tsx
├── setup.ts           # Configuration des tests
├── test-utils.tsx     # Utilitaires de test
└── vitest.d.ts        # Types TypeScript pour Vitest
```

## Commandes de Test

### Exécuter tous les tests
```bash
npm test
```

### Exécuter les tests en mode watch
```bash
npm run test
```

### Exécuter les tests une seule fois
```bash
npm run test:run
```

### Exécuter les tests avec couverture
```bash
npm run test:coverage
```

### Exécuter les tests avec interface graphique
```bash
npm run test:ui
```

## Configuration

### Vitest
- **Fichier de config**: `vitest.config.js`
- **Environnement**: jsdom
- **Setup**: `src/test/setup.ts`
- **Couverture**: v8 avec seuils à 80%

### React Testing Library
- **Version**: 14.1.2
- **Extensions**: @testing-library/jest-dom
- **Utilitaires**: `src/test/test-utils.tsx`

## Standards de Test

### Structure des Tests
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test-utils'
import Component from '../Component'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })
})
```

### Mocks
- **API**: Mocké avec vi.mock()
- **Router**: Mocké avec react-router-dom
- **Icons**: Mocké avec lucide-react
- **Styled Components**: Mocké avec styled-components

### Couverture de Code
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Types de Tests

### 1. Tests Unitaires
- Composants individuels
- Hooks personnalisés
- Utilitaires
- Services

### 2. Tests d'Intégration
- Workflows complets
- Interactions entre composants
- Gestion d'état

### 3. Tests de Validation
- Validation des formulaires
- Messages d'erreur
- États de chargement

## Bonnes Pratiques

### 1. Nommage
- Descriptions claires et spécifiques
- Utilisation de `should` dans les descriptions
- Groupement logique avec `describe`

### 2. Organisation
- Un fichier de test par composant
- Tests groupés par fonctionnalité
- Setup et teardown appropriés

### 3. Assertions
- Utilisation des matchers appropriés
- Vérification des comportements, pas de l'implémentation
- Tests des cas d'erreur

### 4. Mocks
- Mock minimal nécessaire
- Réinitialisation entre les tests
- Vérification des appels de mocks

## Exemples

### Test de Composant
```typescript
describe('Button Component', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Test de Validation
```typescript
describe('validateRegistrationForm', () => {
  it('should validate required fields', () => {
    const data = { telegram_id: '', first_name: 'John' }
    const result = validateRegistrationForm(data)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'telegram_id',
      message: 'L\'ID Telegram est requis'
    })
  })
})
```

### Test d'Intégration
```typescript
describe('Registration Workflow', () => {
  it('should complete full registration flow', async () => {
    render(<Registration />)
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/prénom/i), { 
      target: { value: 'John' } 
    })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/succès/i)).toBeInTheDocument()
    })
  })
})
```

## Débogage

### Tests qui échouent
1. Vérifier les mocks
2. Vérifier les sélecteurs
3. Vérifier les assertions
4. Utiliser `screen.debug()` pour inspecter le DOM

### Performance
1. Éviter les tests lents
2. Utiliser `vi.useFakeTimers()` pour les timers
3. Nettoyer les mocks entre les tests

## Maintenance

### Mise à jour des tests
1. Suivre les changements de composants
2. Maintenir la couverture de code
3. Refactoriser les tests dupliqués
4. Ajouter des tests pour les nouveaux composants
