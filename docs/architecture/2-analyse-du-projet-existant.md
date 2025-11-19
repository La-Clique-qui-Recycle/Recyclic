# 2. Analyse du Projet Existant

### État Actuel du Projet RecyClique

- **Primary Purpose:** Plateforme de gestion complète pour ressourceries avec digitalisation du workflow collecte-vente
- **Current Tech Stack:** React/TypeScript + FastAPI/Python + PostgreSQL + Redis + Docker
- **Architecture Style:** Microservices léger avec PWA offline-first et séparation claire des responsabilités
- **Deployment Method:** Docker Compose avec reverse proxy Nginx et volumes persistants
- **Current Limitations:** Interface caisse avec navigation difficile, saisie répétitive, feedback visuel insuffisant, absence de boutons prédéfinis

### Documentation Disponible

- ✅ **Tech Stack Documentation** : Architecture brownfield complète avec analyse détaillée
- ✅ **PRD v1.3.0** : 8 stories détaillées avec exigences fonctionnelles et non-fonctionnelles
- ✅ **Coding Standards** : Standards définis dans les règles du projet (.cursor/rules/)
- ✅ **API Documentation** : Structure d'API visible dans le code source FastAPI
- ✅ **Testing Infrastructure** : Suite de tests complète avec comptes de test dédiés
- ❌ **UX/UI Guidelines** : À développer lors de la refonte (nécessaire pour v1.3.0)
- ✅ **External API Documentation** : Pipeline Gemini pour classification (actuellement désactivé)
- ✅ **Technical Debt Documentation** : Bot Telegram désactivé identifié comme dette technique

### Contraintes Identifiées

- **PWA Offline-First** : Interface tactile obligatoire avec fonctionnement hors-réseau
- **Conditions d'Usage** : Tablettes en extérieur avec réseau variable et luminosité changeante
- **Workflow 3-Modes** : Processus strict Entrée/Sortie/Vente à respecter absolument
- **Conformité Réglementaire** : Exports Ecologic obligatoires avec traçabilité complète
- **Formation Utilisateur** : Interface intuitive pour utilisateurs non-techniques
- **Performance Mobile** : Optimisations spécifiques pour tablettes tactiles
- **Migration Auth** : Passage complexe de Telegram vers email/password

---
