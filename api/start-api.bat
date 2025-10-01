@echo off
cd /d "%~dp0src"

set SECRET_KEY=your-super-secret-key-here-change-in-production
set DATABASE_URL=postgresql://recyclic:recyclic_secure_password_2024@localhost:5432/recyclic
set REDIS_URL=redis://localhost:6379
set ENVIRONMENT=development

echo Starting Recyclic API...
python -m uvicorn recyclic_api.main:app --reload --host 0.0.0.0 --port 8000