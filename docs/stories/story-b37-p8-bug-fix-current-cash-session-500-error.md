# Story b37-p8: Bug: L'endpoint /v1/cash-sessions/current retourne une erreur 500

**Statut:** Prêt pour développement
**Épopée:** [b37: Refonte UX du Dashboard Admin](./epic-b37-refonte-ux-admin.md)
**PO:** Sarah
**Type:** Bug / Backend
**Priorité:** Haute

## 1. Contexte

Lors du développement du widget de notifications, l'agent a découvert que l'endpoint `GET /v1/cash-sessions/current` retourne une erreur 500 si aucune session n'est ouverte ou si une autre erreur se produit, au lieu de retourner une réponse propre.

## 2. User Story (En tant que...)

En tant que **Développeur Frontend**, je veux que l'endpoint `/v1/cash-sessions/current` retourne une réponse prévisible (comme `null` ou un code d'erreur HTTP approprié) au lieu d'un crash 500, afin de pouvoir gérer les erreurs proprement dans l'interface.

## 3. Critères d'Acceptation

1.  Dans le fichier `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`, la fonction `get_current_cash_session` DOIT être modifiée.
2.  L'appel au service `service.get_open_session_by_operator` DOIT être enveloppé dans un bloc `try...except`.
3.  En cas d'erreur, l'endpoint DOIT retourner une réponse HTTP appropriée (ex: 500 avec un message d'erreur clair) au lieu de crasher.
4.  Si aucune session n'est trouvée, l'endpoint DOIT continuer de retourner `null` avec un statut 200.

## 4. Solution Technique Recommandée

**Fichier à modifier :** `api/src/recyclic_api/api/api_v1/endpoints/cash_sessions.py`

**Fonction à modifier :** `get_current_cash_session`

**Exemple de Logique Corrigée :**
```python
async def get_current_cash_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role_strict([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    try:
        service = CashSessionService(db)
        session = service.get_open_session_by_operator(str(current_user.id))
        
        if not session:
            return None
        
        return CashSessionResponse.model_validate(session)
    except Exception as e:
        # Log de l'erreur
        logger.error(f"Erreur lors de la récupération de la session courante: {e}")
        # Retourner une réponse d'erreur propre
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors de la récupération de la session courante"
        )
```

## 5. Prérequis de Test

- L'agent devra créer un test d'intégration pour ce cas d'erreur.
- Le test devra simuler une erreur dans le service et vérifier que l'endpoint retourne bien un statut 500 avec le message d'erreur attendu, et non un crash.
