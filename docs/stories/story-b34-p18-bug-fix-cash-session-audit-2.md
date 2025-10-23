# Story b34-p18: Bug: Corriger TypeError sur la consultation de session de caisse

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Critique

## 1. Contexte

Après la correction du bug `b34-p16`, l'ouverture de session fonctionne, mais une nouvelle erreur 500 se produit lorsqu'on essaie de consulter une session de caisse existante. Le diagnostic (story `b34-p17`) a prouvé que les endpoints `GET /v1/cash-sessions/{id}` et `GET /v1/cash-sessions/current` retournent une erreur 500.

L'analyse du code révèle qu'il s'agit du même type de bug que le précédent : un `TypeError` dans une fonction d'audit.

## 2. Description du Bug

- **Action :** Le frontend tente de récupérer les données d'une session de caisse existante.
- **Comportement Observé :** L'API retourne une erreur 500.
- **Cause Racine :** Un `TypeError` se produit dans l'endpoint `GET /v1/cash-sessions/{id}`. Le code appelle la fonction d'audit `log_cash_session_access` avec un nom d'argument incorrect (`action`) qui n'est pas accepté par la fonction.

**Extrait du log d'erreur :**
```
File "/app/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py", line 390, in get_cash_session_detail
    log_cash_session_access(
TypeError: log_cash_session_access() got an unexpected keyword argument 'action'
```

## 3. Critères d'Acceptation

1.  La fonction `log_cash_session_access` DOIT être appelée sans l'argument `action` dans le fichier `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`.
2.  La consultation d'une session de caisse (via `GET /v1/cash-sessions/{id}` et `GET /v1/cash-sessions/current`) DOIT fonctionner sans provoquer d'erreur 500.
3.  L'ouverture et la reprise d'une session de caisse doivent être de nouveau pleinement fonctionnelles.

## 4. Solution Technique Détaillée

**Fichier à modifier :** `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`

Dans la fonction `get_cash_session_detail`, il y a deux appels à `log_cash_session_access` à corriger. Il faut simplement supprimer la ligne `action="view_details",`.

**Code Actuel (Incorrect) :**
```python
# Ligne ~390
log_cash_session_access(
    user_id=str(current_user.id),
    username=current_user.username or "Unknown",
    session_id=session_id,
    action="view_details", # <--- LIGNE À SUPPRIMER
    success=True
)
```

**Code Corrigé (Attendu) :**
```python
log_cash_session_access(
    user_id=str(current_user.id),
    username=current_user.username or "Unknown",
    session_id=session_id,
    success=True
)
```

**Note :** L'agent devra appliquer cette même suppression à l'appel similaire qui se trouve dans la gestion d'erreur `except Exception` de la même fonction (autour de la ligne 410).

## 5. Prérequis de Test

- **Compte de test :** Utiliser un compte `admin` ou `super admin`.
  - **Compte :** `admintest1` ou `superadmintest1`
  - **Mot de passe :** `Test1234!`
- **Action :** Se connecter, aller à la page "Caisse". S'il existe une session ouverte, cliquer sur "Reprendre". Si non, en ouvrir une.
- **Vérification :** L'opération doit réussir et l'utilisateur doit être redirigé vers l'interface de vente (`/cash-register/sale`) sans page blanche ni erreur.

## 6. Dev Agent Record

### Tasks / Subtasks Checkboxes
- [x] Examiner la signature de la fonction log_cash_session_access
- [x] Corriger les appels à log_cash_session_access en supprimant le paramètre action
- [x] Tester la consultation de session de caisse pour vérifier que le bug est corrigé
- [x] Mettre à jour la story avec les modifications apportées

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Signature de log_cash_session_access : user_id, username, session_id, success, db (pas de paramètre action)
- Correction des appels dans get_cash_session_detail (lignes ~364 et ~391)
- Tests réseau : Requêtes 791 et 792 maintenant en succès (200) au lieu d'erreurs 500

### Completion Notes List
- ✅ **Bug corrigé** : Suppression du paramètre `action` incorrect dans les appels à `log_cash_session_access`
- ✅ **Endpoints fonctionnels** : Les requêtes vers `/api/v1/cash-sessions/{id}` et `/api/v1/cash-sessions/current` retournent maintenant 200 au lieu de 500
- ✅ **Tests validés** : Capture réseau confirmant que les endpoints backend fonctionnent correctement
- ✅ **Aucune régression** : Pas d'erreurs de linting introduites

### File List
- `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py` - Correction des appels d'audit

### Change Log
- **2025-01-27** : Correction du TypeError dans les appels d'audit de consultation de session de caisse
  - Suppression du paramètre `action="view_details"` incorrect
  - Ajout du paramètre `db=db` manquant
  - Correction des deux appels dans la fonction `get_cash_session_detail`

### Status
Ready for Review
