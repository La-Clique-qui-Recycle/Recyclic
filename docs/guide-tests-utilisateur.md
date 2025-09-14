# 🧪 Guide de Tests Utilisateur - Interface Admin

## 📋 **Prérequis**

✅ Stories terminées : 3.1, 3.2, Tech Debt Frontend Tests, Tech Debt API Codegen
✅ Docker Desktop installé et démarré
✅ Node.js et Python installés

---

## 🚀 **Étape 1 : Démarrage de l'Application**

### **1.1 Terminal 1 - Backend API**
```bash
# Aller dans le dossier racine projet (IMPORTANT!)
cd "D:\Users\Strophe\Documents\°IA\La Clique Qui Recycle\Recyclic"

# Démarrer SEULEMENT la base de données depuis la racine
docker-compose up -d

# Attendre 10 secondes que PostgreSQL démarre
# Puis aller dans le dossier API et démarrer l'API en local
cd api
python -m uvicorn recyclic_api.main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Vérification :** http://localhost:8000/docs doit afficher l'interface Swagger

### **1.2 Terminal 2 - Frontend**
```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances si pas fait
npm install

# Démarrer le frontend
npm run dev
```

**✅ Vérification :** http://localhost:5173 doit afficher l'application

---

## 👨‍💼 **Étape 2 : Créer le Super-Admin**

### **2.1 Terminal 3 - CLI Admin**
```bash
# Depuis le dossier racine, aller dans API
cd "D:\Users\Strophe\Documents\°IA\La Clique Qui Recycle\Recyclic\api"

# Créer le super-admin
python -m recyclic_api.cli create-super-admin --telegram-id 123456789 --full-name "Admin Test"
```

**✅ Résultat attendu :**
```
✅ Super-admin créé avec succès !
- ID Telegram: 123456789
- Nom: Admin Test
- Rôle: super-admin
- Statut: approved
```

---

## 🔐 **Étape 3 : Test de Connexion Admin**

### **3.1 Ouvrir l'Interface**
1. Aller sur http://localhost:5173
2. Cliquer sur "Connexion Admin" ou aller à `/admin`

### **3.2 Se Connecter**
- **Telegram ID :** `123456789`
- **Mot de passe :** Laisser vide si pas configuré
- Cliquer "Se connecter"

**✅ Résultat attendu :** Redirection vers dashboard admin

---

## 👥 **Étape 4 : Test Gestion Utilisateurs**

### **4.1 Accéder à la Liste**
1. Dans le dashboard admin
2. Cliquer sur "Gestion des Utilisateurs"
3. Aller à l'URL `/admin/users`

**✅ Résultat attendu :**
- Table Mantine avec colonnes : Nom, Rôle, Statut, Actions
- Au moins 1 utilisateur (le super-admin)

### **4.2 Test Modification Rôle**
1. Trouver un utilisateur avec rôle "user"
2. Cliquer sur le dropdown "Rôle"
3. Sélectionner "admin"
4. Confirmer la modification

**✅ Résultat attendu :**
- Modal de confirmation apparaît
- Après confirmation : notification de succès
- Rôle mis à jour dans la table

---

## 🔒 **Étape 5 : Test Sécurité & Permissions**

### **5.1 Test Protection Endpoints**
1. Ouvrir DevTools (F12)
2. Onglet Network
3. Modifier un rôle utilisateur
4. Observer les requêtes API

**✅ Résultat attendu :**
- Requête PUT vers `/api/v1/admin/users/{id}/role`
- Status 200 (succès)
- Header Authorization avec token JWT

### **5.2 Test Hiérarchie Rôles**
1. Se connecter avec un utilisateur "user" normal
2. Essayer d'accéder à `/admin/users`

**✅ Résultat attendu :**
- Erreur 403 Forbidden
- Redirection vers page non autorisée

---

## 🧪 **Étape 6 : Test Technique API Codegen**

### **6.1 Vérifier Types Générés**
```bash
cd frontend

# Régénérer les types API
npm run codegen

# Vérifier les fichiers générés
ls src/generated/
```

**✅ Résultat attendu :**
- `types.ts` : Interfaces UserResponse, AdminUser, etc.
- `api.ts` : Client API avec AdminApi, UsersApi
- `index.ts` : Exports consolidés

### **6.2 Test Cohérence Frontend/Backend**
1. Modifier un utilisateur depuis l'interface
2. Vérifier dans Swagger http://localhost:8000/docs
3. Utiliser GET `/api/v1/admin/users` dans Swagger

**✅ Résultat attendu :** Données identiques interface ↔ API

---

## ✅ **Étape 7 : Test Suite Automatisée**

### **7.1 Tests Frontend**
```bash
cd frontend

# Lancer tous les tests
npm test

# Tests spécifiques admin
npm test -- src/test/pages/Admin/
```

**✅ Résultat attendu :** Tous tests passent (100+ tests)

### **7.2 Tests API**
```bash
cd api

# Tests endpoints admin
python -m pytest tests/api/test_admin.py -v

# Tests modèle utilisateur
python -m pytest tests/models/test_user.py -v
```

**✅ Résultat attendu :** Tous tests API passent

---

## 🐛 **Dépannage**

### **Problèmes Courants**

**🔴 Erreur 500 API :**
- Vérifier Docker PostgreSQL : `docker ps`
- Redémarrer : `docker-compose restart`

**🔴 Frontend ne charge pas :**
- Vérifier port 5173 libre
- Relancer : `npm run dev`

**🔴 Utilisateur non trouvé :**
- Vérifier création super-admin
- Check base données : `docker exec -it recyclic-postgres-1 psql -U recyclic_user -d recyclic_db`

**🔴 Types TypeScript erreurs :**
- Régénérer : `npm run codegen`
- Restart IDE TypeScript server

---

## 📊 **Résumé Tests Validés**

- ✅ **Démarrage application** (Backend + Frontend)
- ✅ **Création super-admin** via CLI
- ✅ **Connexion interface admin**
- ✅ **Liste utilisateurs** avec interface Mantine
- ✅ **Modification rôles** avec confirmations
- ✅ **Sécurité endpoints** (JWT + permissions)
- ✅ **Types API auto-générés** cohérents
- ✅ **Suite tests automatisée** complète

## 🎯 **Statut Final**

Si tous ces tests passent ✅ :
- Stories 3.1, 3.2 et tech debt = **Production Ready**
- Prêt pour Story 3.3 (après rollback procedure)
- Interface admin fonctionnelle et sécurisée

**🚀 Félicitations ! L'interface d'administration Recyclic est opérationnelle !**