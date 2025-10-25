# Story b37-18: Bug: Un bénévole ne peut pas lister les sites pour ouvrir une caisse

**Statut:** ✅ Terminé et Validé
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Critique

## 1. Contexte

Un bénévole qui a la permission d'accéder à la caisse (`caisse.access`) ne peut actuellement pas ouvrir de session. La raison est que la page d'ouverture de caisse doit d'abord lister les sites disponibles, mais l'endpoint `GET /v1/sites` est restreint aux rôles `admin` et `super-admin`, provoquant un échec pour le bénévole.

## 2. User Story (En tant que...)

En tant que **Bénévole** avec l'autorisation d'ouvrir une caisse, je veux **pouvoir voir la liste des sites**, afin de pouvoir sélectionner le site où j'ouvre ma session de caisse.

## 3. Critères d'Acceptation

1.  L'endpoint `GET /v1/sites` DOIT être rendu accessible aux utilisateurs ayant le rôle `user`.
2.  Le décorateur de permission pour la fonction `list_sites` dans le fichier `api/src/recyclic_api/api/api_v1/endpoints/sites.py` DOIT être modifié.
3.  Un bénévole avec la permission `caisse.access` DOIT maintenant pouvoir charger la page d'ouverture de caisse et voir la liste des sites.

## 4. Solution Technique Recommandée

-   **Fichier à modifier :** `api/src/recyclic_api/api/api_v1/endpoints/sites.py`.
-   **Fonction à modifier :** `list_sites`.
-   **Modification :** Changer le décorateur de permission.

**Code Actuel (Incorrect) :**
```python
current_user: User = Depends(require_role_strict([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
```

**Code Corrigé (Attendu) :**
```python
current_user: User = Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
```

## 5. Prérequis de Test

- Se connecter avec un compte **bénévole** (`usertest1`) qui est dans un groupe ayant la permission `caisse.access`.
- Naviguer vers la page `/caisse`, puis cliquer pour ouvrir une session.
- **Vérification :** La liste déroulante des sites doit maintenant se charger correctement.

## 6. Dev Agent Record

### ✅ Tâches Complétées
- [x] Modifier le décorateur de permission pour l'endpoint list_sites
- [x] Vérifier s'il y a d'autres endpoints de sites qui doivent être accessibles aux bénévoles
- [x] Tester la fonctionnalité avec un compte bénévole
- [x] Créer des tests pour valider les permissions

### 📁 Fichiers Modifiés
- `api/src/recyclic_api/api/api_v1/endpoints/sites.py` - Permission modifiée pour list_sites
- `api/tests/test_sites_user_permissions.py` - Tests ajoutés

### 🧪 Tests Ajoutés
- Test d'accès aux sites pour les utilisateurs USER
- Test de filtrage par statut actif
- Test de pagination
- Test de restriction des opérations d'administration

### 📝 Notes d'Implémentation
- **Modification** : Changement du décorateur de `[UserRole.ADMIN, UserRole.SUPER_ADMIN]` vers `[UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]`
- **Sécurité** : Les autres endpoints (création, modification, suppression) restent restreints aux admins
- **Fonctionnalité** : Les bénévoles peuvent maintenant lister les sites pour ouvrir une caisse
