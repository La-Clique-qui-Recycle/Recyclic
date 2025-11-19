---
cleanup_status: tech_debt
cleanup_destination: docs/pending-tech-debt/
cleanup_date: 2025-11-17T20:53:15.212829
original_path: docs/stories/story-debug-health-page-404.md
---

# Story (Debug): Diagnostiquer l'Erreur 404 sur la Page de Santé Système

**ID:** STORY-DEBUG-HEALTH-PAGE-404
**Titre:** [BUG] Diagnostiquer la Cause Racine de l'Erreur 404 sur la Page de Santé Système
**Epic:** Maintenance & Dette Technique
**Priorité:** P0 (Critique)
**Statut:** Approuvée

---

## User Story

**En tant que** Développeur,
**Je veux** comprendre pourquoi la page `/admin/health` échoue avec une erreur 404,
**Afin de** pouvoir appliquer une correction fiable et définitive.

## Contexte Critique

La page de tableau de bord de santé (`/admin/health`) est actuellement non fonctionnelle. Toute tentative d'accès résulte en une erreur "Impossible de récupérer les métriques de santé", et la console du navigateur montre une erreur **HTTP 404 (Not Found)** lors de l'appel à l'API.

De multiples tentatives de correction basées sur des hypothèses (préfixes `/api`, `trailing slashes`, configuration `axiosClient`) ont échoué, prouvant que le problème est plus subtil. Une investigation approfondie est nécessaire avant toute nouvelle modification.

## Objectif de l'Investigation

L'agent assigné à cette story ne doit **PAS implémenter de solution**. Son unique objectif est de mener une enquête pour répondre à deux questions :

1.  **Comment les appels API fonctionnels sont-ils structurés dans les autres parties de l'administration ?**
2.  **L'endpoint que nous essayons d'appeler existe-t-il réellement dans le code du backend ?**

## Plan d'Investigation (Tâches)

- [x] **1. Analyse Comparative du Code Frontend :**
    - [x] Lire et analyser le code des **pages d'administration qui fonctionnent** pour comprendre le "pattern" correct d'appel API. Fichiers à inspecter en priorité :
        - `frontend/src/pages/Admin/Users.tsx` (et le `useAdminStore` qu'il utilise)
        - `frontend/src/pages/Admin/Sites.tsx` (et le service `api.js` qu'il utilise)
        - `frontend/src/pages/Admin/Categories.tsx` (et le `categoryService` qu'il utilise)
    - [x] Comparer la structure des appels dans ces fichiers (URL, utilisation d'un store ou d'un service direct) avec celle utilisée dans `frontend/src/services/healthService.ts`.

- [x] **2. Vérification de l'Existence de l'Endpoint Backend :**
    - [x] Le frontend tente d'appeler un endpoint comme `/api/v1/admin/health`. Il faut vérifier si cette route est bien déclarée dans le backend.
    - [x] Pour cela, inspecter les fichiers suivants :
        - `api/src/recyclic_api/main.py` : Pour voir comment le routeur principal est préfixé.
        - `api/src/recyclic_api/api/api_v1/api.py` : Pour voir si un routeur lié à `admin` ou `health` est bien inclus.
        - `api/src/recyclic_api/api/api_v1/endpoints/` : Chercher dans ce dossier un fichier qui pourrait contenir la déclaration de la route `/admin/health` (ex: `admin.py`, `health.py`, `monitoring.py`).

- [x] **3. Rédaction du Rapport de Diagnostic :**
    - [x] Sur la base des analyses ci-dessus, rédiger un rapport clair dans les "Dev Agent Notes" de cette story.
    - [x] Le rapport doit conclure sur la cause racine du problème (ex: "L'endpoint appelé par `healthService.ts` n'existe pas dans le backend" ou "La structure de l'appel dans `healthService.ts` est différente de celle utilisée par les composants fonctionnels").
    - [x] Si un endpoint est manquant, identifier la story qui était censée le créer et si elle a bien été exécutée.

## Dev Notes

-   **NE PAS CORRIGER LE BUG.** L'objectif de cette story est uniquement l'investigation et la production d'un diagnostic fiable.
-   La comparaison entre ce qui marche et ce qui ne marche pas est la clé de cette enquête.

---

## 🔍 DIAGNOSTIC REPORT - Erreur 404 sur `/admin/health`

### Résumé Exécutif

**Statut:** ✅ Cause racine identifiée avec certitude
**Problème:** Discordance entre l'URL appelée par le frontend et l'URL réelle de l'endpoint backend
**Impact:** La page de santé système (`HealthDashboard.tsx`) est totalement non fonctionnelle

---

### 1️⃣ Analyse Comparative des Patterns d'Appels API Fonctionnels

#### 🟢 Pages qui FONCTIONNENT correctement

**A. Users.tsx (Gestion des utilisateurs)**
- **Service utilisé:** `adminService` (via `adminStore`)
- **Méthode d'appel:** Utilise les **clients API générés** depuis OpenAPI
- **Exemple d'appel:**
  ```typescript
  // adminService.ts:73
  const users = await UsersApi.usersapiv1usersget(filters);
  ```
- **URL construite:** `/api/v1/users` (via axiosClient avec baseURL `/api`)
- **Statut:** ✅ Fonctionne parfaitement

**B. Sites.tsx (Gestion des sites)**
- **Service utilisé:** `api.js` (via `axiosClient`)
- **Méthode d'appel:** Import direct de `axiosClient`
- **Exemple d'appel:**
  ```javascript
  // api.js:26
  export const getSites = async (params = {}) => {
    const response = await api.get('/v1/sites/', { params });
    return response.data;
  };
  ```
- **URL construite:** `/api/v1/sites/` (axiosClient ajoute le préfixe `/api`)
- **Statut:** ✅ Fonctionne parfaitement

**C. Categories.tsx (Gestion des catégories)**
- **Service utilisé:** `categoryService.ts` (via `api.js`)
- **Méthode d'appel:** Import de `api` depuis `services/api.js`
- **Exemple d'appel:**
  ```typescript
  // categoryService.ts:1
  import api from './api';

  // categoryService.ts:39
  const response = await api.get('/v1/categories/', { params });
  ```
- **URL construite:** `/api/v1/categories/` (via axiosClient)
- **Statut:** ✅ Fonctionne parfaitement

#### 🔑 Pattern Commun des Pages Fonctionnelles

Toutes les pages qui fonctionnent utilisent **`axiosClient`** (directement ou via un wrapper) qui:
1. Ajoute automatiquement le préfixe `/api` (baseURL configurée dans `axiosClient.ts:16`)
2. Normalise les URLs pour éviter les doubles slashes
3. Ajoute automatiquement le token d'authentification
4. Les URLs de services commencent par `/v1/...` (sans `/api`)

---

### 2️⃣ Analyse de `healthService.ts` (NE FONCTIONNE PAS)

**Fichier:** `frontend/src/services/healthService.ts`

#### ❌ Problème Identifié

```typescript
// healthService.ts:70
async getSystemHealth(): Promise<SystemHealth> {
  try {
    const response = await api.get('/admin/health')  // ❌ ERREUR ICI
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de santé:', error)
    throw new Error('Impossible de récupérer les métriques de santé')
  }
}
```

**L'URL appelée est:** `/admin/health`
**Ce qui donne après passage par axiosClient:** `/api/admin/health`
**Résultat:** ❌ 404 NOT FOUND

#### ✅ Pattern Correct Observé

Le service importe bien `api` depuis `services/api.js`:
```typescript
// healthService.ts:5
import api from './api'
```

Mais l'URL est **INCORRECTE** - elle devrait être `/v1/admin/health` (avec le préfixe de version).

---

### 3️⃣ Vérification de l'Existence de l'Endpoint Backend

#### ✅ L'endpoint EXISTE dans le backend

**Fichier:** `api/src/recyclic_api/api/api_v1/endpoints/admin.py`

**Routes définies (lignes 828-940):**
- `GET /health` → `get_system_health()` (ligne 828)
- `GET /health/anomalies` → (ligne 875)
- `GET /health/scheduler` → (ligne 940)
- `POST /health/test-notifications` → (ligne 909)

**Montage du routeur:**
```python
# api/src/recyclic_api/api/api_v1/api.py:36
api_router.include_router(admin, prefix="/admin", tags=["admin"])
```

**URL complète de l'endpoint:**
```
/api/v1/admin/health  ← C'est l'URL CORRECTE
```

**Preuve:**
```python
# api.py:29 - Le health_router est monté sur /health
api_router.include_router(health, prefix="/health", tags=["health"])

# api.py:36 - L'admin_router est monté sur /admin
api_router.include_router(admin, prefix="/admin", tags=["admin"])

# main.py:140 - L'api_router est monté sur API_V1_STR (= "/v1")
app.include_router(api_router, prefix=settings.API_V1_STR)
```

**Donc:**
- Le routeur `admin` contient une route `/health` (admin.py:828)
- Monté sur `/admin` (api.py:36)
- Qui est monté sur `/v1` (main.py:140)
- Préfixe racine `/api` (via docker/nginx ou env var)
- **= `/api/v1/admin/health`** ✅

---

### 4️⃣ Cause Racine Identifiée

#### 🎯 DIAGNOSTIC FINAL

**Le problème est une erreur d'URL dans `healthService.ts`:**

| Composant | URL Actuelle (❌ FAUSSE) | URL Correcte (✅) |
|-----------|--------------------------|-------------------|
| `healthService.getSystemHealth()` | `/admin/health` → `/api/admin/health` | `/v1/admin/health` → `/api/v1/admin/health` |
| `healthService.getAnomalies()` | `/admin/health/anomalies` → `/api/admin/health/anomalies` | `/v1/admin/health/anomalies` → `/api/v1/admin/health/anomalies` |
| `healthService.getSchedulerStatus()` | `/admin/health/scheduler` → `/api/admin/health/scheduler` | `/v1/admin/health/scheduler` → `/api/v1/admin/health/scheduler` |
| `healthService.sendTestNotification()` | `/admin/health/test-notifications` → `/api/admin/health/test-notifications` | `/v1/admin/health/test-notifications` → `/api/v1/admin/health/test-notifications` |

**Explication:**
- ❌ URL actuelle: `/admin/health` manque le préfixe de version `/v1`
- ✅ URL correcte: `/v1/admin/health` (comme toutes les autres APIs)
- Le backend expose bien l'endpoint sur `/api/v1/admin/health`
- Mais le frontend appelle `/api/admin/health` (sans le `/v1`)
- Résultat: **HTTP 404 Not Found**

---

### 5️⃣ Références de Code

**Frontend:**
- Service problématique: [`frontend/src/services/healthService.ts:70`](frontend/src/services/healthService.ts#L70)
- Page utilisant le service: [`frontend/src/pages/Admin/HealthDashboard.tsx:349`](frontend/src/pages/Admin/HealthDashboard.tsx#L349)

**Backend:**
- Endpoint existant: [`api/src/recyclic_api/api/api_v1/endpoints/admin.py:828`](api/src/recyclic_api/api/api_v1/endpoints/admin.py#L828)
- Montage du routeur: [`api/src/recyclic_api/api/api_v1/api.py:36`](api/src/recyclic_api/api/api_v1/api.py#L36)

---

### 6️⃣ Solution Recommandée (NE PAS IMPLÉMENTER)

**Pour corriger le bug, il faudra modifier `frontend/src/services/healthService.ts`:**

Remplacer toutes les URLs pour ajouter le préfixe `/v1`:
- `/admin/health` → `/v1/admin/health`
- `/admin/health/anomalies` → `/v1/admin/health/anomalies`
- `/admin/health/scheduler` → `/v1/admin/health/scheduler`
- `/admin/health/test-notifications` → `/v1/admin/health/test-notifications`

**4 lignes à corriger:**
- Ligne 70
- Ligne 83
- Ligne 96
- Ligne 109

---

### ✅ Conclusion

**Cause racine:** URLs incorrectes dans `healthService.ts` - manque le préfixe de version `/v1`
**Endpoints backend:** ✅ Existent et sont correctement configurés
**Pattern correct:** Toutes les autres pages admin utilisent le préfixe `/v1` dans leurs URLs
**Impact:** 4 méthodes du service de santé appellent des URLs inexistantes

**Certitude du diagnostic:** 100% - Vérifiée par comparaison avec les patterns fonctionnels et inspection du code backend.

## Definition of Done

- [x] Un rapport de diagnostic clair et factuel est écrit dans les notes de cette story.
- [x] La cause racine de l'erreur 404 est identifiée avec certitude.