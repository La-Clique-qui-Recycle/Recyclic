# 8. Intégration dans l'Arborescence Source

### Structure Projet Existante (Référence)

```
recyclic/
├── api/                          # FastAPI Backend
│   ├── src/recyclic_api/
│   │   ├── api/api_v1/api.py     # Routes principales
│   │   ├── core/config.py        # Configuration
│   │   ├── models/               # Modèles SQLAlchemy
│   │   └── services/             # Logique métier
├── frontend/                     # React PWA
│   ├── src/
│   │   ├── components/           # Composants UI
│   │   ├── stores/               # Zustand stores
│   │   ├── pages/                # Pages principales
│   │   └── generated/api.ts      # API client généré
├── docker-compose.yml            # Orchestration
└── docs/                         # Documentation
```

### Nouvelles Additions Structure

```
recyclic/
├── api/
│   ├── src/recyclic_api/
│   │   ├── models/
│   │   │   ├── preset_button.py           # Nouveau modèle
│   │   │   └── category_enhancements.py   # Extensions catégories
│   │   └── services/
│   │       ├── category_management.py     # Service catégories étendu
│   │       ├── preset_management.py       # Nouveau service presets
│   │       └── session_state.py           # Service états session
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── categories/
│   │   │   │   ├── EnhancedCategorySelector.tsx    # Nouveau
│   │   │   │   └── CategoryDisplayManager.tsx       # Nouveau
│   │   │   ├── presets/
│   │   │   │   ├── PresetButtonGrid.tsx             # Nouveau
│   │   │   │   └── PriceCalculator.tsx               # Nouveau
│   │   │   ├── tickets/
│   │   │   │   └── TicketScroller.tsx                # Nouveau
│   │   │   └── ui/
│   │   │       └── StepIndicator.tsx                 # Nouveau
│   │   ├── stores/
│   │   │   ├── categoryStore.ts             # Extension existant
│   │   │   ├── presetStore.ts               # Nouveau
│   │   │   └── sessionStateStore.ts         # Nouveau
│   │   └── utils/
│   │       ├── keyboardShortcuts.ts         # Nouveau
│   │       └── scrollManager.ts             # Nouveau
```

### Guidelines d'Intégration

- **File Naming:** camelCase pour composants, PascalCase pour classes
- **Folder Organization:** Groupement logique par fonctionnalité (categories/, presets/, tickets/)
- **Import/Export Patterns:** Exports nommés, imports absolus depuis src/
- **Consistency:** Patterns Mantine et Zustand existants strictement respectés

---
