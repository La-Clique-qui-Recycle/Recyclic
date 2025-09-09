# ♻️ Recyclic
**Outil de gestion pour ressourceries - POC en développement**

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

## Équipe
La Clique Qui Recycle - Solution open source pour le secteur du réemploi

## 📄 Licence
MIT - Voir le fichier `LICENSE` pour plus de détails