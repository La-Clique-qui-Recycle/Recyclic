"""
Tests unitaires pour les endpoints de réinitialisation de mot de passe
Story auth.E - Gestion du Mot de Passe Oublié
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import timedelta

from recyclic_api.main import app
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password, create_password_reset_token, verify_reset_token

# Import the deprecated alias only for the compatibility tests
from recyclic_api.core.security import create_reset_token


class TestAuthPasswordResetEndpoints:
    """Tests d'intégration pour les endpoints de réinitialisation de mot de passe"""

    def test_forgot_password_success_existing_user(self, client, db_session: Session):
        """Test de demande de réinitialisation réussie avec un utilisateur existant"""

        # Créer un utilisateur de test
        test_user = User(
            username="password_reset_user",
            email="test@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Demander la réinitialisation
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Si un compte est associé à cet email" in data["message"]

    def test_forgot_password_nonexistent_user(self, client, db_session: Session):
        """Test de demande de réinitialisation avec un email inexistant"""

        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )

        # Même réponse pour éviter l'énumération d'emails
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Si un compte est associé à cet email" in data["message"]

    def test_forgot_password_inactive_user(self, client: TestClient, db_session: Session):
        """Test de demande de réinitialisation avec un utilisateur inactif"""

        # Créer un utilisateur inactif
        inactive_user = User(
            username="inactive_user",
            email="inactive@example.com",
            hashed_password=hash_password("password123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=False
        )
        db_session.add(inactive_user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "inactive@example.com"}
        )

        # Même réponse pour la sécurité
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_forgot_password_validation_missing_email(self, client: TestClient):
        """Test de validation avec email manquant"""

        response = client.post(
            "/api/v1/auth/forgot-password",
            json={}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_forgot_password_validation_invalid_email_format(self, client: TestClient):
        """Test de validation avec format d'email invalide"""

        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "invalid-email-format"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_reset_password_success_valid_token(self, client: TestClient, db_session: Session):
        """Test de réinitialisation réussie avec un token valide"""

        # Créer un utilisateur de test
        test_user = User(
            username="reset_user",
            email="reset@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Générer un token de réinitialisation valide
        reset_token = create_password_reset_token(str(test_user.id))

        # Réinitialiser le mot de passe
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewPassword123!"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "réinitialisé avec succès" in data["message"]

        # Vérifier que le mot de passe a été modifié en base
        db_session.refresh(test_user)
        from recyclic_api.core.security import verify_password
        assert verify_password("NewPassword123!", test_user.hashed_password)

    def test_reset_password_invalid_token(self, client: TestClient):
        """Test de réinitialisation avec un token invalide"""

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "invalid.token.here",
                "new_password": "NewPassword123!"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Token invalide" in data["detail"]

    def test_reset_password_expired_token(self, client: TestClient, db_session: Session):
        """Test de réinitialisation avec un token expiré"""

        # Créer un utilisateur de test
        test_user = User(
            username="expired_token_user",
            email="expired@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Générer un token expiré (expiration immédiate)
        from datetime import timedelta
        expired_token = create_password_reset_token(str(test_user.id), timedelta(seconds=-1))

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": expired_token,
                "new_password": "NewPassword123!"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Token invalide ou expiré" in data["detail"]

    def test_reset_password_wrong_scope_token(self, client: TestClient, db_session: Session):
        """Test de réinitialisation avec un token ayant un mauvais scope"""

        # Créer un utilisateur de test
        test_user = User(
            username="wrong_scope_user",
            email="scope@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Générer un token d'accès normal (pas de reset)
        from recyclic_api.core.security import create_access_token
        access_token = create_access_token({"sub": str(test_user.id)})

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": access_token,
                "new_password": "NewPassword123!"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Token invalide pour cette opération" in data["detail"]

    def test_reset_password_nonexistent_user(self, client: TestClient):
        """Test de réinitialisation avec un token pour un utilisateur inexistant"""

        # Générer un token pour un ID d'utilisateur inexistant
        fake_user_id = "99999999-9999-9999-9999-999999999999"
        reset_token = create_password_reset_token(fake_user_id)

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewPassword123!"
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "Utilisateur introuvable" in data["detail"]

    def test_reset_password_inactive_user(self, client: TestClient, db_session: Session):
        """Test de réinitialisation pour un utilisateur inactif"""

        # Créer un utilisateur inactif
        inactive_user = User(
            username="inactive_reset_user",
            email="inactive_reset@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=False
        )
        db_session.add(inactive_user)
        db_session.commit()
        db_session.refresh(inactive_user)

        # Générer un token valide pour cet utilisateur
        reset_token = create_password_reset_token(str(inactive_user.id))

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewPassword123!"
            }
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "Utilisateur introuvable ou inactif" in data["detail"]

    def test_reset_password_validation_missing_token(self, client: TestClient):
        """Test de validation avec token manquant"""

        response = client.post(
            "/api/v1/auth/reset-password",
            json={"new_password": "NewPassword123!"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_reset_password_validation_missing_password(self, client: TestClient):
        """Test de validation avec nouveau mot de passe manquant"""

        response = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "some.token.here"}
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_reset_password_validation_short_password(self, client: TestClient, db_session: Session):
        """Test de validation avec un mot de passe trop court"""

        # Créer un utilisateur de test
        test_user = User(
            username="short_pass_user",
            email="short@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        reset_token = create_password_reset_token(str(test_user.id))

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "short"
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert "Mot de passe invalide" in data["detail"]

    def test_reset_password_validation_weak_password(self, client: TestClient, db_session: Session):
        """Test de validation avec un mot de passe faible (sans majuscule)"""

        # Créer un utilisateur de test
        test_user = User(
            username="weak_pass_user",
            email="weak@example.com",
            hashed_password=hash_password("oldpassword123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        reset_token = create_password_reset_token(str(test_user.id))

        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "weakpassword123"
            }
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        assert "Mot de passe invalide" in data["detail"]
        assert "majuscule" in data["detail"]

    def test_token_security_functions(self, db_session: Session):
        """Test des fonctions de sécurité de création et vérification de tokens"""
        # Créer un utilisateur de test
        test_user = User(
            username="token_security_user",
            email="security@example.com",
            hashed_password=hash_password("password123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

        # Test de création et vérification de token
        token = create_password_reset_token(str(test_user.id))
        assert isinstance(token, str)
        assert len(token) > 0

        # Vérification du token
        verified_user_id = verify_reset_token(token)
        assert verified_user_id == str(test_user.id)

    def test_rate_limiting_forgot_password(self, client: TestClient, db_session: Session):
        """Test du rate limiting sur l'endpoint forgot-password"""
        # Note: Ce test pourrait être plus complexe selon la configuration du rate limiting
        # Pour l'instant, on vérifie juste que l'endpoint fonctionne normalement

        test_user = User(
            username="rate_limit_user",
            email="ratelimit@example.com",
            hashed_password=hash_password("password123"),
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            is_active=True
        )
        db_session.add(test_user)
        db_session.commit()

        # Premier appel - devrait fonctionner
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "ratelimit@example.com"}
        )
        assert response.status_code == 200


class TestResetTokenAliasCompatibility:
    """Tests unitaires pour l'alias create_reset_token (backward compatibility)"""

    def test_alias_creates_valid_token(self):
        """Test que l'alias create_reset_token crée un token valide identique à create_password_reset_token"""
        user_id = "test-user-123"

        # Créer un token via l'alias
        token_from_alias = create_reset_token(user_id)

        # Vérifier que le token est une chaîne non vide
        assert isinstance(token_from_alias, str)
        assert len(token_from_alias) > 0

        # Vérifier que le token peut être vérifié
        verified_user_id = verify_reset_token(token_from_alias)
        assert verified_user_id == user_id

    def test_alias_respects_expiration_delta(self):
        """Test que l'alias respecte le paramètre expires_delta"""
        user_id = "test-user-456"
        custom_expiration = timedelta(minutes=5)

        # Créer un token avec expiration personnalisée via l'alias
        token_from_alias = create_reset_token(user_id, expires_delta=custom_expiration)

        # Vérifier que le token est valide
        assert isinstance(token_from_alias, str)
        assert len(token_from_alias) > 0

        # Vérifier que le token peut être vérifié
        verified_user_id = verify_reset_token(token_from_alias)
        assert verified_user_id == user_id

    def test_alias_behaves_identically_to_original(self):
        """Test que l'alias produit des tokens équivalents à la fonction originale"""
        user_id = "test-user-789"

        # Créer des tokens avec les deux fonctions
        token_from_alias = create_reset_token(user_id)
        token_from_original = create_password_reset_token(user_id)

        # Les tokens seront différents (timestamps différents) mais les deux doivent être valides
        verified_from_alias = verify_reset_token(token_from_alias)
        verified_from_original = verify_reset_token(token_from_original)

        # Les deux doivent retourner le même user_id
        assert verified_from_alias == user_id
        assert verified_from_original == user_id