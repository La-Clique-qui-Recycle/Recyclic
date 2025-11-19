# Story B34-P15 - Système de Navigation Basé sur les Permissions

## 📋 Informations Générales
- **Epic**: B34 - Refonte Dashboard et Sécurité
- **Priorité**: P15
- **Type**: Feature (Amélioration)
- **Status**: ✅ TERMINÉ
- **Date de création**: 2025-10-23
- **Développeur**: Claude Code

## 🎯 Objectif

Implémenter un système de navigation dynamique basé sur les permissions des groupes pour les bénévoles, tout en maintenant un accès complet pour les administrateurs.

## 📝 Description

### Contexte
Le système de permissions existe déjà (groupes, permissions, assignations) mais :
- Les administrateurs (role='admin') devaient avoir les permissions via des groupes comme les bénévoles
- Les boutons "Caisse" et "Réception" dans le header étaient affichés de manière fixe
- Pas de contrôle granulaire pour les bénévoles

### Besoin
1. Les ADMIN et SUPER_ADMIN doivent avoir automatiquement toutes les permissions
2. Les bénévoles (role='user') voient uniquement les boutons correspondant à leurs permissions
3. Si un bénévole a la permission `caisse.access` → bouton "Caisse" visible
4. Si un bénévole a la permission `reception.access` → bouton "Réception" visible
5. Renommer "Gestion des groupes (API Réel)" en "Gestion des groupes"

## ✅ Critères d'Acceptation

### 1. Backend - Permissions pour Admins
- [x] Les ADMIN et SUPER_ADMIN ont automatiquement toutes les permissions
- [x] La fonction `user_has_permission()` vérifie le rôle avant les groupes
- [x] La fonction `get_user_permissions()` retourne toutes les permissions pour les admins
- [x] Les bénévoles utilisent le système de groupes

### 2. Frontend - AuthStore
- [x] `hasPermission()` retourne `true` pour admin/super-admin
- [x] `hasCashAccess()` vérifie la permission `caisse.access` pour les bénévoles
- [x] `hasReceptionAccess()` créée et vérifie `reception.access` pour les bénévoles
- [x] Interfaces TypeScript mises à jour

### 3. Frontend - Header Navigation
- [x] Bouton "Caisse" affiché si `hasCashAccess()` retourne `true`
- [x] Bouton "Réception" affiché si `hasReceptionAccess()` retourne `true`
- [x] Admins voient toujours tous les boutons
- [x] Bénévoles sans permissions ne voient que "Tableau de bord"

### 4. Interface Admin
- [x] Titre "Gestion des Groupes (API Réel)" → "Gestion des Groupes"

## 🔧 Implémentation

### Fichiers Modifiés

#### 1. Backend - `api/src/recyclic_api/core/auth.py`

**Fonction `user_has_permission()` (ligne 294-296)**
```python
# Admins and Super-admins have all permissions
if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
    return True
```

**Fonction `get_user_permissions()` (ligne 364-370)**
```python
# Admins and Super-admins have all permissions
if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
    # Return all available permissions
    stmt = select(Permission)
    result = db.execute(stmt)
    all_permissions = result.scalars().all()
    return [perm.name for perm in all_permissions]
```

#### 2. Frontend - `frontend/src/stores/authStore.ts`

**Interface AuthState (ligne 44-49)**
```typescript
// Computed
isAdmin: () => boolean;
hasPermission: (permission: string) => boolean;
hasCashAccess: () => boolean;
hasReceptionAccess: () => boolean;
```

**Implémentation (ligne 206-227)**
```typescript
hasPermission: (permission: string) => {
  const { permissions, currentUser } = get();
  // Admins and Super-admins have all permissions
  if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') return true;
  return permissions.includes(permission);
},

hasCashAccess: () => {
  const { permissions, currentUser } = get();
  // Admins and Super-admins always have access
  if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') return true;
  // Volunteers need the permission
  return permissions.includes('caisse.access');
},

hasReceptionAccess: () => {
  const { permissions, currentUser } = get();
  // Admins and Super-admins always have access
  if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') return true;
  // Volunteers need the permission
  return permissions.includes('reception.access');
}
```

#### 3. Frontend - `frontend/src/components/Header.jsx`

**Récupération des permissions (ligne 60-65)**
```javascript
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const currentUser = useAuthStore((s) => s.currentUser);
const logout = useAuthStore((s) => s.logout);
const isAdmin = useAuthStore((s) => s.isAdmin());
const hasCashAccess = useAuthStore((s) => s.hasCashAccess());
const hasReceptionAccess = useAuthStore((s) => s.hasReceptionAccess());
```

**Construction du menu (ligne 74-87)**
```javascript
// Vue minimale par défaut
const navItems = [
  { path: '/', label: 'Tableau de bord', icon: Home }
];

// Caisse - visible si l'utilisateur a la permission
if (hasCashAccess) {
  navItems.splice(1, 0, { path: '/caisse', label: 'Caisse', icon: Calculator });
}

// Réception - visible si l'utilisateur a la permission
if (hasReceptionAccess) {
  navItems.push({ path: '/reception', label: 'Réception', icon: Receipt });
}
```

#### 4. Frontend - `frontend/src/pages/Admin/GroupsReal.tsx`

**Titre de la page (ligne 290)**
```typescript
<Title order={2}>Gestion des Groupes</Title>
```

## 🧪 Tests

### Scénario 1 - Admin/SuperAdmin
1. ✅ Se connecter avec compte admin
2. ✅ Vérifier que les boutons "Caisse" et "Réception" sont visibles
3. ✅ Accéder aux routes `/caisse` et `/reception` sans erreur
4. ✅ Vérifier l'accès au dashboard unifié avec statistiques et graphiques

### Scénario 2 - Bénévole AVEC permission Caisse
1. ✅ Créer un groupe "Équipe Caisse" dans `/admin/groups`
2. ✅ Assigner la permission `caisse.access`
3. ✅ Assigner un utilisateur bénévole au groupe
4. ✅ Se connecter avec le compte bénévole
5. ✅ Vérifier que le bouton "Caisse" est visible
6. ✅ Vérifier que le bouton "Réception" n'est PAS visible
7. ✅ Accéder à `/caisse` sans erreur

### Scénario 3 - Bénévole AVEC permission Réception
1. ✅ Créer un groupe "Équipe Réception"
2. ✅ Assigner la permission `reception.access`
3. ✅ Assigner un utilisateur bénévole au groupe
4. ✅ Se connecter avec le compte bénévole
5. ✅ Vérifier que le bouton "Réception" est visible
6. ✅ Vérifier que le bouton "Caisse" n'est PAS visible
7. ✅ Accéder à `/reception` sans erreur

### Scénario 4 - Bénévole SANS permissions
1. ✅ Se connecter avec compte bénévole sans groupe
2. ✅ Vérifier qu'aucun bouton "Caisse" ou "Réception" n'est visible
3. ✅ Seul "Tableau de bord" doit être présent
4. ✅ Tentative d'accès direct à `/caisse` → redirection
5. ✅ Tentative d'accès direct à `/reception` → redirection

### Scénario 5 - Bénévole avec LES DEUX permissions
1. ✅ Créer un groupe "Équipe Polyvalente"
2. ✅ Assigner `caisse.access` ET `reception.access`
3. ✅ Assigner un utilisateur bénévole au groupe
4. ✅ Se connecter avec le compte bénévole
5. ✅ Vérifier que les DEUX boutons sont visibles
6. ✅ Accéder aux deux routes sans erreur

## 📊 Permissions Disponibles

| Permission | Description | Impact |
|-----------|-------------|--------|
| `caisse.access` | Accès à la caisse | Affiche le bouton "Caisse" dans le header |
| `reception.access` | Accès à la réception | Affiche le bouton "Réception" dans le header |
| `admin.users.manage` | Gestion des utilisateurs | Accessible uniquement aux admins |
| `admin.groups.manage` | Gestion des groupes | Accessible uniquement aux admins |
| `reports.view` | Consultation des rapports | Futur usage |
| `reports.export` | Export des rapports | Futur usage |

## 🔐 Matrice des Rôles et Permissions

| Rôle | Permissions | Accès Caisse | Accès Réception | Accès Admin |
|------|-------------|--------------|-----------------|-------------|
| **super-admin** | Toutes automatiquement | ✅ Oui | ✅ Oui | ✅ Oui |
| **admin** | Toutes automatiquement | ✅ Oui | ✅ Oui | ✅ Oui |
| **user** (bénévole) | Via groupes | ⚙️ Si permission | ⚙️ Si permission | ❌ Non |

## 📈 Améliorations Apportées

### Avant
- ❌ Admins devaient être dans des groupes pour avoir des permissions
- ❌ Boutons "Caisse" et "Réception" affichés de manière fixe pour tous
- ❌ Pas de contrôle granulaire pour les bénévoles
- ❌ Confusion avec le titre "API Réel"

### Après
- ✅ Admins ont automatiquement toutes les permissions
- ✅ Boutons affichés dynamiquement selon les permissions
- ✅ Contrôle granulaire via groupes pour les bénévoles
- ✅ Interface claire avec titre "Gestion des Groupes"
- ✅ Système cohérent et scalable

## 💡 Notes Techniques

### Rechargement des Permissions
Les permissions sont chargées lors du login via `/v1/users/me/permissions`. Pour mettre à jour les permissions d'un utilisateur :
1. Modifier les groupes de l'utilisateur dans `/admin/groups`
2. L'utilisateur doit se **déconnecter et se reconnecter**
3. Les nouvelles permissions seront chargées et stockées dans le localStorage

### Architecture du Système

```
┌─────────────────────────────────────────────────────────┐
│                    Base de Données                      │
├─────────────────────────────────────────────────────────┤
│  users ←→ user_groups ←→ groups ←→ group_permissions   │
│                                    ↓                     │
│                              permissions                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                    │
├─────────────────────────────────────────────────────────┤
│  • user_has_permission(user, permission_name)           │
│  • get_user_permissions(user) → List[str]               │
│  • require_permission(permission_name) [Dependency]     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              API Endpoint: GET /v1/users/me/permissions │
├─────────────────────────────────────────────────────────┤
│  Returns: { "permissions": ["caisse.access", ...] }     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                Frontend (Zustand Store)                 │
├─────────────────────────────────────────────────────────┤
│  State:                                                  │
│  • permissions: string[]                                │
│                                                          │
│  Methods:                                                │
│  • hasPermission(permission: string): boolean           │
│  • hasCashAccess(): boolean                             │
│  • hasReceptionAccess(): boolean                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   Header Component                      │
├─────────────────────────────────────────────────────────┤
│  if (hasCashAccess) → Afficher bouton "Caisse"          │
│  if (hasReceptionAccess) → Afficher bouton "Réception"  │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Relation avec Autres Stories

### Dépendances
- **B34-P1** - Audit des permissions (infrastructure de base)
- **B34-P12** - Dashboard unifié (permissions pour voir les stats)
- **B34-P14** - Graphiques de réception (permissions pour voir les graphiques)

### Impact
- Améliore la sécurité globale de l'application
- Prépare le terrain pour des permissions plus granulaires futures
- Facilite la gestion des équipes et des rôles

## ✅ Validation Finale

- [x] Backend corrigé (admins ont toutes les permissions)
- [x] Frontend corrigé (vérifications basées sur permissions)
- [x] Header mis à jour (affichage conditionnel)
- [x] Interface admin renommée
- [x] API redémarrée
- [x] Tests manuels effectués
- [x] Documentation mise à jour

## 🎉 Résultat

Le système de navigation est maintenant entièrement basé sur les permissions, offrant :
- **Sécurité** : Contrôle d'accès granulaire pour les bénévoles
- **Flexibilité** : Gestion facile des équipes via l'interface `/admin/groups`
- **Simplicité** : Accès automatique pour les administrateurs
- **Évolutivité** : Facilement extensible avec de nouvelles permissions

---

**Story complétée le**: 2025-10-23
**Temps estimé**: 45 minutes
**Temps réel**: ~30 minutes
**Complexité**: Faible ✅
