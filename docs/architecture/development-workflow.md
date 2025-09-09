# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Install Node.js and npm
node --version  # v18+
npm --version   # v9+

# Install Python and pip
python --version  # 3.11+
pip --version

# Install Docker and Docker Compose
docker --version
docker-compose --version

# Install PostgreSQL client (optional)
psql --version
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/recyclic.git
cd recyclic

# Install all dependencies
npm install

# Copy environment templates
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/bot/.env.example apps/bot/.env

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d postgres redis

# Run database migrations
cd apps/api
alembic upgrade head
cd ../..

# Seed initial data (optional)
npm run seed
```

### Development Commands

```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:web

# Start backend only
npm run dev:api

# Start bot only
npm run dev:bot

# Run tests
npm run test           # All tests
npm run test:web       # Frontend tests only
npm run test:api       # Backend tests only
npm run test:e2e       # E2E tests only

# Lint and format
npm run lint           # Lint all code
npm run format         # Format all code

# Build for production
npm run build          # Build all apps
npm run build:web      # Build frontend only
npm run build:api      # Build backend only
```

## Environment Configuration

### Required Environment Variables

```bash
# Frontend (.env.local)
VITE_API_URL=http://localhost:8000
VITE_TELEGRAM_BOT_URL=https://t.me/YourRecyclicBot
VITE_ENVIRONMENT=development
VITE_SENTRY_DSN=your_sentry_dsn

# Backend (.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/recyclic
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Telegram Bot
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram

# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key_fallback
GROQ_API_KEY=your_groq_api_key_fallback

# External Integrations
GOOGLE_SHEETS_CREDENTIALS=path/to/service-account.json
INFOMANIAK_USERNAME=your_infomaniak_username
INFOMANIAK_PASSWORD=your_infomaniak_password

# Shared
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

---
