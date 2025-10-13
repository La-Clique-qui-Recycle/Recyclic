"""
Tests pour les endpoints de paramètres de session (Story B27-P1)
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.models.setting import Setting


class TestSessionSettingsEndpoints:
    """Tests pour les endpoints GET/PUT /api/v1/admin/settings/session"""

    def test_get_session_settings_success_as_super_admin(
        self, 
        super_admin_client: TestClient,
        db_session: Session
    ):
        """Teste qu'un super-admin peut récupérer les paramètres de session."""
        # Arrange - Créer un paramètre de session en base
        setting = Setting(
            key="token_expiration_minutes",
            value="720"  # 12 heures
        )
        db_session.add(setting)
        db_session.commit()

        # Act
        response = super_admin_client.get("/api/v1/admin/settings/session")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["token_expiration_minutes"] == 720

    def test_get_session_settings_default_value(
        self, 
        super_admin_client: TestClient,
        db_session: Session
    ):
        """Teste que la valeur par défaut (480) est retournée si aucun paramètre n'existe."""
        # Act
        response = super_admin_client.get("/api/v1/admin/settings/session")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["token_expiration_minutes"] == 480

    def test_update_session_settings_success(
        self, 
        super_admin_client: TestClient,
        db_session: Session
    ):
        """Teste qu'un super-admin peut mettre à jour les paramètres de session."""
        # Arrange
        payload = {"token_expiration_minutes": 1440}  # 24 heures

        # Act
        response = super_admin_client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["token_expiration_minutes"] == 1440

        # Vérifier que la valeur est bien sauvegardée en base
        setting = db_session.query(Setting).filter(
            Setting.key == "token_expiration_minutes"
        ).first()
        assert setting is not None
        assert setting.value == "1440"

    def test_update_session_settings_validation_negative_value(
        self, 
        super_admin_client: TestClient
    ):
        """Teste que la validation rejette les valeurs négatives."""
        # Arrange
        payload = {"token_expiration_minutes": -1}

        # Act
        response = super_admin_client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 400
        assert "positive" in response.json()["detail"].lower()

    def test_update_session_settings_validation_too_large_value(
        self, 
        super_admin_client: TestClient
    ):
        """Teste que la validation rejette les valeurs trop grandes."""
        # Arrange
        payload = {"token_expiration_minutes": 10081}  # Plus de 7 jours

        # Act
        response = super_admin_client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 400
        assert "7 jours" in response.json()["detail"]

    def test_get_session_settings_requires_authentication(
        self, 
        client: TestClient
    ):
        """Teste que l'endpoint nécessite une authentification."""
        # Act
        response = client.get("/api/v1/admin/settings/session")

        # Assert
        assert response.status_code == 401

    def test_get_session_settings_requires_super_admin_role(
        self, 
        admin_client: TestClient
    ):
        """Teste que l'endpoint nécessite le rôle SUPER_ADMIN."""
        # Act
        response = admin_client.get("/api/v1/admin/settings/session")

        # Assert
        assert response.status_code == 403

    def test_update_session_settings_requires_authentication(
        self, 
        client: TestClient
    ):
        """Teste que l'endpoint de mise à jour nécessite une authentification."""
        # Arrange
        payload = {"token_expiration_minutes": 480}

        # Act
        response = client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 401

    def test_update_session_settings_requires_super_admin_role(
        self, 
        admin_client: TestClient
    ):
        """Teste que l'endpoint de mise à jour nécessite le rôle SUPER_ADMIN."""
        # Arrange
        payload = {"token_expiration_minutes": 480}

        # Act
        response = admin_client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 403

    def test_update_session_settings_missing_field(
        self, 
        super_admin_client: TestClient
    ):
        """Teste que l'endpoint rejette les requêtes sans le champ requis."""
        # Arrange
        payload = {}  # Champ manquant

        # Act
        response = super_admin_client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 422  # Validation error

    def test_update_session_settings_invalid_field_type(
        self, 
        super_admin_client: TestClient
    ):
        """Teste que l'endpoint rejette les types invalides."""
        # Arrange
        payload = {"token_expiration_minutes": "not_a_number"}

        # Act
        response = super_admin_client.put("/api/v1/admin/settings/session", json=payload)

        # Assert
        assert response.status_code == 422  # Validation error
