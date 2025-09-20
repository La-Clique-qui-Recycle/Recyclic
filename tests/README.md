# Tests Recyclic - Vue d'Ensemble

## 📋 Structure des Tests

```
tests/
├── api/                    # Tests Backend (FastAPI)
│   ├── tests/             # Tests unitaires et d'intégration
│   ├── conftest.py        # Configuration pytest
│   ├── pytest.ini        # Configuration pytest
│   └── README.md          # Guide détaillé des tests backend
├── bot/                   # Tests Bot Telegram
└── frontend/              # Tests Frontend (React)
```

## 🚀 Exécution Rapide

### Tests Backend
```bash
cd api
docker-compose run --rm api-tests
```

### Tests Frontend
```bash
cd frontend
npm test
```

### Tests Bot
```bash
cd bot
python -m pytest
```

## 📊 Statut Global

- **Backend :** 78% de succès (35/45 tests)
- **Frontend :** À vérifier
- **Bot :** À vérifier

## 🔧 Configuration

Chaque composant a sa propre configuration de test :
- **Backend :** PostgreSQL + Redis + Docker
- **Frontend :** Jest + React Testing Library
- **Bot :** pytest + mocks

## 📚 Documentation

- **Backend :** `api/tests/README.md`
- **Stabilisation :** `api/TESTS_STABILIZATION_GUIDE.md`
- **Story :** `docs/stories/story-debt-stabilize-tests.md`

## 🆘 Problèmes Connus

### Backend
- 5 tests échouent (fixtures manquantes) - **Mineur**
- Solution documentée dans `api/tests/README.md`

### Frontend & Bot
- À évaluer

## 👥 Pour les Agents

1. **Consulter** le README spécifique du composant
2. **Exécuter** les tests avec les commandes documentées
3. **Corriger** les problèmes identifiés
4. **Documenter** les nouvelles corrections
