# ♻️ Recyclic
**Outil de gestion pour ressourceries - POC en développement**  
⚠️ **Attention : Non Fonctionnel !**

## 🌱 Notre Mission
Digitaliser les processus des ressourceries pour réduire le temps administratif de 70% et assurer la conformité réglementaire Ecologic.

## ✨ Comment ça marche (Version Test)
1. **Bot Telegram** : Enregistrement vocal des dépôts avec classification IA automatique
2. **Interface caisse** : Vente simplifiée avec catégories EEE obligatoires  
3. **Exports automatisés** : Synchronisation vers Ecologic et partenaires

## 🚀 Démarrage (Dev)
```bash
docker-compose up
```

## Services
- API: http://localhost:4433
- Frontend: http://localhost:4444
- Bot: Mode polling

## 🏗️ Architecture
- **Stack** : React + FastAPI + PostgreSQL + Docker
- **IA** : LangChain + Gemini pour classification EEE
- **Déploiement** : Docker Compose sur VPS
- **Pattern** : PWA offline-first + Microservices légers

## 📚 Documentation
- **[Architecture complète](docs/architecture/)** - Vue d'ensemble technique
- **[PRD détaillé](docs/prd/)** - Spécifications produit et épics
- **[Stories de développement](docs/stories/)** - User stories et implémentation

## 🛠️ Développement
Ce projet est développé avec la **BMad Method** - une approche agile AI-driven qui combine des agents spécialisés pour chaque rôle (PM, Architect, Developer, QA) avec des workflows structurés.

**Méthodologie :**
- Documentation-first avec PRD et architecture détaillés
- Développement par épics et stories séquentielles
- Tests pyramidaux (Unit/Integration/E2E)
- Standards de code stricts (TypeScript/Python)

### Secrets Email (Brevo)

1. Copier `env.example` vers `api/.env` et renseigner:
   - `BREVO_API_KEY` (dev: placeholder possible)
   - `BREVO_WEBHOOK_SECRET` (laisser vide en dev → signature ignorée)
   - `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`

2. En production (après déploiement de l’API):
   - Créer un webhook Brevo vers `/api/v1/email/webhook`
   - Récupérer la “Signing key” (secret) et la mettre dans `BREVO_WEBHOOK_SECRET`
   - Activer les événements (delivered, bounce, spam…)

3. Vérification rapide (dev):
```bash
export PYTHONPATH=src
./venv/bin/python - << 'PY'
from fastapi.testclient import TestClient
from recyclic_api.main import app
client = TestClient(app)
print(client.get('/api/v1/email/health').json()['status'])
PY
```

## Équipe
La Clique Qui Recycle - Solution open source pour le secteur du réemploi

## 📄 Licence
MIT - Voir le fichier `LICENSE` pour plus de détails# Test change for rollback
