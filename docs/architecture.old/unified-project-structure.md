# Unified Project Structure

```plaintext
recyclic/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml            # Tests, lint, build
│       └── deploy.yaml        # Deployment automation
├── apps/                      # Application packages
│   ├── web/                   # Frontend PWA application
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   │   ├── ui/        # Base UI components
│   │   │   │   ├── business/  # Business logic components
│   │   │   │   └── layout/    # Layout components
│   │   │   ├── pages/         # Page components/routes
│   │   │   │   ├── CashRegister/
│   │   │   │   ├── Dashboard/
│   │   │   │   └── Admin/
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useOffline.ts
│   │   │   │   └── useCashSession.ts
│   │   │   ├── services/      # API client services
│   │   │   │   ├── api.ts     # Base API client
│   │   │   │   ├── auth.ts    # Auth service
│   │   │   │   ├── cash.ts    # Cash operations
│   │   │   │   └── sync.ts    # Sync service
│   │   │   ├── stores/        # Zustand state stores
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── cashStore.ts
│   │   │   │   └── offlineStore.ts
│   │   │   ├── styles/        # Global styles/themes
│   │   │   │   ├── globals.css
│   │   │   │   └── mantine-theme.ts
│   │   │   └── utils/         # Frontend utilities
│   │   │       ├── constants.ts
│   │   │       ├── formatting.ts
│   │   │       └── validation.ts
│   │   ├── public/            # Static assets
│   │   │   ├── manifest.json  # PWA manifest
│   │   │   ├── sw.js          # Service Worker
│   │   │   └── icons/         # PWA icons
│   │   ├── tests/             # Frontend tests
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   ├── vite.config.ts     # Vite configuration
│   │   ├── tailwind.config.js # Tailwind configuration
│   │   └── package.json
│   ├── api/                   # Backend FastAPI application
│   │   ├── src/
│   │   │   ├── api/           # API routes/controllers
│   │   │   │   ├── v1/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── deposits.py
│   │   │   │   │   ├── sales.py
│   │   │   │   │   ├── cash.py
│   │   │   │   │   ├── users.py
│   │   │   │   │   └── exports.py
│   │   │   │   └── deps.py    # Route dependencies
│   │   │   ├── services/      # Business logic services
│   │   │   │   ├── ai_service.py
│   │   │   │   ├── telegram_service.py
│   │   │   │   ├── sync_service.py
│   │   │   │   └── export_service.py
│   │   │   ├── models/        # SQLAlchemy models
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py
│   │   │   │   ├── deposit.py
│   │   │   │   ├── sale.py
│   │   │   │   └── cash_session.py
│   │   │   ├── schemas/       # Pydantic schemas
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py
│   │   │   │   ├── deposit.py
│   │   │   │   └── sale.py
│   │   │   ├── core/          # Core configuration
│   │   │   │   ├── config.py
│   │   │   │   ├── database.py
│   │   │   │   ├── security.py
│   │   │   │   └── exceptions.py
│   │   │   ├── utils/         # Backend utilities
│   │   │   │   ├── audio.py
│   │   │   │   ├── validation.py
│   │   │   │   └── formatting.py
│   │   │   └── main.py        # FastAPI app entry
│   │   ├── tests/             # Backend tests
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   └── models/
│   │   ├── requirements.txt   # Python dependencies
│   │   ├── alembic.ini       # DB migrations config
│   │   └── package.json      # For npm scripts
│   └── bot/                  # Telegram Bot application  
│       ├── src/
│       │   ├── handlers/     # Telegram message handlers
│       │   │   ├── depot.py  # /depot command handler
│       │   │   ├── auth.py   # Authentication handler
│       │   │   └── admin.py  # Admin commands
│       │   ├── services/     # Bot-specific services
│       │   │   ├── ai_client.py
│       │   │   └── api_client.py
│       │   ├── utils/        # Bot utilities
│       │   │   ├── audio.py  # Audio processing
│       │   │   └── keyboards.py # Inline keyboards
│       │   └── main.py       # Bot entry point
│       ├── tests/            # Bot tests
│       ├── requirements.txt
│       └── package.json
├── packages/                 # Shared packages
│   ├── shared/               # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   │   ├── user.ts
│   │   │   │   ├── deposit.ts
│   │   │   │   ├── sale.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants/    # Shared constants
│   │   │   │   ├── eee-categories.ts
│   │   │   │   └── api-endpoints.ts
│   │   │   ├── utils/        # Shared utilities
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   └── date.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/                   # Shared UI components
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── Modal/
│   │   └── package.json
│   └── config/               # Shared configuration
│       ├── eslint/
│       │   └── .eslintrc.js
│       ├── typescript/
│       │   └── tsconfig.json
│       └── jest/
│           └── jest.config.js
├── infrastructure/           # Infrastructure as Code
│   ├── docker/
│   │   ├── Dockerfile.api    # FastAPI container
│   │   ├── Dockerfile.bot    # Bot container
│   │   ├── Dockerfile.web    # PWA container
│   │   └── nginx.conf        # Nginx configuration
│   ├── docker-compose.yml    # Local development
│   ├── docker-compose.prod.yml # Production
│   └── scripts/
│       ├── backup.sh         # Database backup
│       ├── restore.sh        # Database restore
│       └── deploy.sh         # Deployment script
├── scripts/                  # Build/deploy scripts
│   ├── build.sh             # Build all apps
│   ├── test.sh              # Run all tests
│   ├── lint.sh              # Lint all code
│   └── dev.sh               # Start development
├── docs/                    # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   ├── architecture.md
│   └── deployment.md
├── .env.example             # Environment template
├── .gitignore
├── package.json             # Root package.json (workspaces)
├── tsconfig.json            # Root TypeScript config
└── README.md
```

---
