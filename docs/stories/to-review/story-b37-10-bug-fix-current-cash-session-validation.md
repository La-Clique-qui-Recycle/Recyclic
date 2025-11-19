---
cleanup_status: uncertain
cleanup_destination: docs/stories/to-review/
cleanup_date: 2025-11-17T20:53:14.616575
original_path: docs/stories/story-b37-10-bug-fix-current-cash-session-validation.md
---

# Story b37-10: Bug: L'endpoint /v1/cash-sessions/current retourne une erreur 500

**Statut:** Prêt pour développement
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Bug / Backend
**Priorité:** Haute

## 1. Contexte

Lors du développement du widget de notifications, l'agent a découvert que l'endpoint `GET /v1/cash-sessions/current` retourne une erreur 500 si une session est ouverte. L'analyse a montré que le problème vient d'une erreur de validation Pydantic lors de l'appel à `CashSessionResponse.model_validate()`.

## 2. User Story (En tant que...)

En tant que **Développeur Frontend**, je veux que l'endpoint `/v1/cash-sessions/current` retourne les données de la session courante dans un format correct, ou `null` si aucune session n'est ouverte, sans provoquer d'erreur 500.

## 3. Critères d'Acceptation

1.  Dans le fichier `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`, la fonction `get_current_cash_session` DOIT être modifiée.
2.  L'appel explicite à `CashSessionResponse.model_validate(session)` DOIT être supprimé.
3.  La fonction DOIT retourner directement l'objet `session` de la base de données. FastAPI se chargera de la validation en utilisant le `response_model` de l'endpoint.
4.  L'appel à `GET /v1/cash-sessions/current` DOIT maintenant retourner un statut 200 avec les données de la session si elle existe, ou un statut 200 avec une réponse `null` si elle n'existe pas.

## 4. Solution Technique Recommandée

**Fichier à modifier :** `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`

**Fonction à modifier :** `get_current_cash_session`

**Code Actuel (Incorrect) :**
```python
@router.get("/current", response_model=Optional[CashSessionResponse])
async def get_current_cash_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashSessionService(db)
    session = service.get_open_session_by_operator(str(current_user.id))
    
    if not session:
        return None
    
    return CashSessionResponse.model_validate(session)
```

**Code Corrigé (Attendu) :**
```python
@router.get("/current", response_model=Optional[CashSessionResponse])
async def get_current_cash_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    service = CashSessionService(db)
    session = service.get_open_session_by_operator(str(current_user.id))
    
    return session
```

## 5. Prérequis de Test

- L'agent devra créer un test d'intégration pour cet endpoint.
- Le test devra vérifier que l'endpoint retourne bien un statut 200 et les données de la session lorsqu'une session est ouverte.
- Le test devra vérifier que l'endpoint retourne bien un statut 200 et `null` lorsqu'aucune session n'est ouverte.
