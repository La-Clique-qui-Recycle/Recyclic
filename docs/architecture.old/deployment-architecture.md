# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Nginx static serving via Docker
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** Nginx with gzip compression

**Backend Deployment:**
- **Platform:** Docker containers sur VPS
- **Build Command:** `docker build -f infrastructure/docker/Dockerfile.api`
- **Deployment Method:** Docker Compose avec rolling updates

## CI/CD Pipeline

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          npm ci
          cd apps/api && pip install -r requirements.txt
      
      - name: Lint code
        run: npm run lint
      
      - name: Run tests
        run: |
          npm run test
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t recyclic-api -f infrastructure/docker/Dockerfile.api .
          docker build -t recyclic-bot -f infrastructure/docker/Dockerfile.bot .
          docker build -t recyclic-web -f infrastructure/docker/Dockerfile.web .
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/recyclic
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d --build
            docker system prune -f
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:8000 | Local development |
| Staging | https://staging.recyclic.fr | https://api-staging.recyclic.fr | Pre-production testing |
| Production | https://recyclic.fr | https://api.recyclic.fr | Live environment |

---
