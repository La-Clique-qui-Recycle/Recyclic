# Story b34-p16: Bug: Corriger TypeError lors de l'audit d'ouverture de caisse

**Statut:** Prêt pour développement
**Épopée:** [b34: Rattrapage et Sécurisation](./../epics/epic-b34-rattrapage-securisation.md)
**PO:** Sarah
**Type:** Bug
**Priorité:** Critique

## 1. Contexte

Suite au déploiement de la branche `fix/b34-stabilize-frontend-build` en staging, une erreur 500 "Internal Server Error" se produit lors de la tentative d'ouverture d'une nouvelle session de caisse. L'analyse des logs backend a révélé la cause exacte du problème.

## 2. Description du Bug

- **Action :** Un utilisateur avec les droits essaie d'ouvrir une nouvelle session de caisse.
- **Comportement Observé :** L'API retourne une erreur 500.
- **Cause Racine :** Un `TypeError` se produit dans l'endpoint `POST /v1/cash-sessions/`. Le code appelle la fonction d'audit `log_cash_session_opening` avec des noms d'arguments incorrects (`operator_id`, `operator_username`, `initial_amount`) qui ne correspondent pas à la signature de la fonction (`user_id`, `username`, `opening_amount`).

**Extrait du log d'erreur :**
```
File "/app/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py", line 152, in create_cash_session
    log_cash_session_opening(
TypeError: log_cash_session_opening() got an unexpected keyword argument 'operator_id'
```

## 3. Critères d'Acceptation

1.  La fonction `log_cash_session_opening` DOIT être appelée avec les bons noms d'arguments dans le fichier `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`.
2.  L'ouverture d'une session de caisse DOIT de nouveau fonctionner sans provoquer d'erreur 500.
3.  Un enregistrement d'audit pour l'ouverture de la session DOIT être correctement créé dans la base de données.

## 4. Solution Technique Détaillée

**Fichier à modifier :** `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`

Dans la fonction `create_cash_session`, il y a deux appels à `log_cash_session_opening` à corriger.

**Exemple de correction (pour l'appel en cas de succès) :**

**Code Actuel (Incorrect) :**
```python
log_cash_session_opening(
    operator_id=current_user.id,
    operator_username=current_user.username or "Unknown",
    session_id=str(cash_session.id),
    initial_amount=session_data.initial_amount,
    success=True
)
```

**Code Corrigé (Attendu) :**
```python
log_cash_session_opening(
    user_id=str(current_user.id),
    username=current_user.username or "Unknown",
    session_id=str(cash_session.id),
    opening_amount=session_data.initial_amount,
    success=True
)
```

**Note :** L'agent devra appliquer une correction similaire à l'autre appel de `log_cash_session_opening` qui se trouve dans la gestion d'erreur `except ValueError` de la même fonction.

## 5. Prérequis de Test

- **Compte de test :** Utiliser un compte `admin` ou `super admin` pour avoir les droits d'accès à la caisse.
  - **Compte :** `admintest1` ou `superadmintest1`
  - **Mot de passe :** `Test1234!`
- **Action :** Se connecter, aller à la page "Caisse", et tenter d'ouvrir une nouvelle session.
- **Vérification :** L'opération doit réussir et l'utilisateur doit être redirigé vers l'interface de vente.

## 6. Dev Agent Record

### Tasks / Subtasks Checkboxes
- [x] Corriger les appels à `log_cash_session_opening` avec les bons noms de paramètres
- [x] Corriger les appels à `log_cash_session_closing` avec les bons noms de paramètres  
- [x] Ajouter le paramètre `db=db` manquant dans tous les appels d'audit
- [x] Vérifier qu'aucune erreur de linting n'est introduite

### Agent Model Used
Claude Sonnet 4 (via Cursor)

### Debug Log References
- Correction des appels d'audit dans `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`
- Signature correcte de `log_cash_session_opening`: `user_id`, `username`, `session_id`, `opening_amount`, `success`, `db`
- Signature correcte de `log_cash_session_closing`: `user_id`, `username`, `session_id`, `closing_amount`, `success`, `db`

### Completion Notes List
- ✅ **Bug corrigé** : Tous les appels à `log_cash_session_opening` utilisent maintenant les bons paramètres
- ✅ **Cohérence** : Tous les appels à `log_cash_session_closing` ont été corrigés également
- ✅ **Paramètre manquant** : Ajout du paramètre `db=db` dans tous les appels d'audit
- ✅ **Aucune régression** : Pas d'erreurs de linting introduites

### File List
- `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py` - Correction des appels d'audit

### Change Log
- **2025-01-27** : Correction du TypeError dans les appels d'audit d'ouverture de caisse
  - Changement des paramètres `operator_id` → `user_id`
  - Changement des paramètres `operator_username` → `username`  
  - Changement des paramètres `initial_amount` → `opening_amount`
  - Changement des paramètres `final_amount` → `closing_amount`
  - Ajout du paramètre `db=db` manquant

### Status
Ready for Review
