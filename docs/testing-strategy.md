# Charte de Stratégie de Test - Projet Recyclic

## 1. Principes Fondamentaux
- **Pyramide des Tests** : Prioriser les tests unitaires, puis intégration, puis E2E.
- **Isolation** : Les tests ne doivent pas dépendre les uns des autres.
- **Reproductibilité** : Un test doit toujours produire le même résultat dans le même environnement.

## 2. Matrice de Décision des Patterns de Test
| Type de Test / Objectif | Pattern Recommandé | Quand l'utiliser | Modules Exemples |
|---|---|---|---|
| **Logique métier pure (Services)** | Mocks Purs | Isoler la logique des dépendances externes (DB, API tierces). | `auth_service.py`, `telegram_service.py` |
| **Endpoints CRUD & Contraintes DB** | Fixtures-DB | Valider la sérialisation, les contraintes de la DB et le flux HTTP. | `cash_registers_endpoint.py` |
| **Workflows Complexes (Admin)** | Mocks & Overrides | Tester des workflows avec de multiples étapes sans la lourdeur d'une DB complète. | `admin_pending_endpoints.py` |
| **Workflows Critiques de Bout en Bout** | Tests E2E | Valider un parcours utilisateur complet (ex: Inscription -> Approbation -> Première connexion). | `test_full_user_journey.py` |

## 3. Standards pour l'Écriture des Tests
- **Convention de Nommage** : `test_[fonction]_[condition]_[comportement_attendu]`.
- **Structure AAA** : Toujours structurer les tests en `Arrange`, `Act`, `Assert`.
- **Fixtures** : Utiliser les fixtures de `conftest.py` autant que possible. Créer des fixtures locales pour des cas spécifiques.

### 3.1. Sémantique des Codes d'Erreur d'Authentification (401 vs 403)

Dans les tests d'authentification et d'autorisation, il est crucial de respecter la sémantique HTTP standard :

- **401 Unauthorized** : L'utilisateur n'est pas authentifié (aucun token fourni ou token invalide)
- **403 Forbidden** : L'utilisateur est authentifié mais n'a pas les permissions suffisantes

#### Exemples Pytest

```python
def test_admin_endpoint_requires_authentication(client):
    """Test qu'un endpoint admin retourne 401 sans authentification."""
    response = client.get("/api/v1/admin/users/")
    assert response.status_code == 401

def test_admin_endpoint_requires_admin_role(client, db_session):
    """Test qu'un endpoint admin retourne 403 avec un utilisateur non-admin."""
    # Créer un utilisateur avec rôle 'USER'
    user = User(username="user@test.com", role=UserRole.USER, status=UserStatus.ACTIVE)
    db_session.add(user)
    db_session.commit()

    # Générer un token valide pour cet utilisateur
    access_token = create_access_token(data={"sub": str(user.id)})
    client.headers["Authorization"] = f"Bearer {access_token}"

    response = client.get("/api/v1/admin/users/")
    assert response.status_code == 403

def test_admin_endpoint_success_with_admin_role(admin_client):
    """Test qu'un endpoint admin fonctionne avec un administrateur."""
    response = admin_client.get("/api/v1/admin/users/")
    assert response.status_code == 200
```

**Note importante** : Utiliser la fixture `admin_client` pour les tests nécessitant des privilèges administrateur, et tester explicitement les cas 401/403 pour garantir la sécurité.

## 4. Séparation des Tests de Performance

### 4.1. Marquage des Tests de Performance

Les tests de performance doivent être marqués avec `@pytest.mark.performance` pour permettre leur exécution séparée :

```python
@pytest.mark.performance
class TestLoginPerformance:
    """Tests de performance pour l'endpoint de connexion."""

    def test_login_response_time_under_load(self):
        # Test avec charge élevée
        pass

@pytest.mark.performance
def test_large_dataset_query_performance(self):
    """Test de performance avec un gros dataset."""
    # Test avec 100+ éléments
    pass
```

### 4.2. Exécution des Tests

- **Tests rapides (CI rapide)** : `pytest -m "not performance"`
- **Tests complets** : `pytest` (inclut tous les tests)
- **Tests de performance uniquement** : `pytest -m performance`

### 4.3. Configuration CI

La pipeline CI est configurée avec deux étapes :
- **test-fast** : Exécution rapide excluant les tests de performance (pour PRs et développement)
- **test-complete** : Exécution complète incluant les tests de performance (pour le déploiement main)

### 4.4. Gestion du Rate Limiting

Le rate limiting est automatiquement désactivé en environnement de test via les variables :
- `PYTEST_CURRENT_TEST`
- `TESTING=true`
- `ENVIRONMENT=test`

## 5. Gestion de la Dette Technique des Tests
- Tout nouveau code doit suivre cette charte.
- Le code existant non-conforme doit faire l'objet d'une story de dette technique.
