"""
Tests pour l'endpoint d'export de base de données (Story B11-P2)
Pattern: Mocks & Overrides (évite d'exécuter pg_dump réel en test)
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import create_access_token
from tests.factories import UserFactory


class TestDatabaseExportEndpoint:
    """Tests pour l'endpoint POST /api/v1/admin/db/export"""

    @patch('recyclic_api.api.api_v1.endpoints.db_export.FileResponse')
    @patch('recyclic_api.api.api_v1.endpoints.db_export.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_export.os.path.exists')
    def test_export_database_success_as_super_admin(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        mock_file_response: Mock,
        super_admin_client: TestClient
    ):
        """Teste qu'un super-admin peut exporter la base de données avec succès."""
        # Arrange
        # Mock pg_dump successful execution
        mock_subprocess.return_value = MagicMock(returncode=0, stderr="")
        mock_exists.return_value = True

        # Mock FileResponse pour éviter l'erreur de fichier inexistant
        from fastapi.responses import Response
        mock_file_response.return_value = Response(
            content=b"SQL content",
            media_type="application/sql",
            headers={"content-disposition": "attachment; filename=recyclic_db_export_test.sql"}
        )

        # Act
        response = super_admin_client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 200
        assert "recyclic_db_export_" in str(mock_file_response.call_args)
        assert mock_subprocess.called

    def test_export_database_requires_authentication(self, client: TestClient):
        """Teste que l'endpoint nécessite une authentification."""
        # Act
        response = client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 401

    def test_export_database_requires_super_admin_role(
        self,
        admin_client: TestClient
    ):
        """Teste que l'endpoint nécessite le rôle SUPER_ADMIN (ADMIN n'est pas suffisant)."""
        # Act
        response = admin_client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 403
        assert "super-administrateur" in response.json()["detail"].lower()

    def test_export_database_regular_user_denied(
        self,
        client: TestClient,
        db_session: Session
    ):
        """Teste qu'un utilisateur régulier ne peut pas exporter."""
        # Arrange
        user = UserFactory(role=UserRole.USER, status=UserStatus.ACTIVE)
        db_session.commit()

        access_token = create_access_token(data={"sub": str(user.id)})
        client.headers = {"Authorization": f"Bearer {access_token}"}

        # Act
        response = client.post("/api/v1/admin/db/export")

        # Assert
        # require_super_admin_role() retourne 401 pour les non-super-admins même s'ils sont authentifiés
        assert response.status_code == 401

    @patch('recyclic_api.api.api_v1.endpoints.db_export.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_export.os.path.exists')
    def test_export_database_pg_dump_failure_returns_500(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que l'échec de pg_dump retourne une erreur 500."""
        # Arrange
        # Mock pg_dump failed execution
        mock_subprocess.return_value = MagicMock(
            returncode=1,
            stderr="pg_dump: error: connection failed"
        )

        # Act
        response = super_admin_client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 500
        assert "Database export failed" in response.json()["detail"]

    @patch('recyclic_api.api.api_v1.endpoints.db_export.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_export.os.path.exists')
    def test_export_database_file_not_created_returns_500(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que l'absence de fichier créé retourne une erreur 500."""
        # Arrange
        # Mock pg_dump successful but file not created
        mock_subprocess.return_value = MagicMock(returncode=0, stderr="")
        mock_exists.return_value = False

        # Act
        response = super_admin_client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 500
        assert "Export file was not created" in response.json()["detail"]

    @patch('recyclic_api.api.api_v1.endpoints.db_export.subprocess.run')
    def test_export_database_timeout_returns_504(
        self,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que le timeout de pg_dump retourne une erreur 504."""
        # Arrange
        # Mock pg_dump timeout
        from subprocess import TimeoutExpired
        mock_subprocess.side_effect = TimeoutExpired(cmd="pg_dump", timeout=300)

        # Act
        response = super_admin_client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 504
        assert "timeout" in response.json()["detail"].lower()

    @patch('recyclic_api.api.api_v1.endpoints.db_export.FileResponse')
    @patch('recyclic_api.api.api_v1.endpoints.db_export.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_export.os.path.exists')
    def test_export_database_filename_contains_timestamp(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        mock_file_response: Mock,
        super_admin_client: TestClient
    ):
        """Teste que le nom du fichier contient un timestamp."""
        # Arrange
        # Mock pg_dump successful execution
        mock_subprocess.return_value = MagicMock(returncode=0, stderr="")
        mock_exists.return_value = True

        # Mock FileResponse
        from fastapi.responses import Response
        mock_file_response.return_value = Response(
            content=b"SQL content",
            media_type="application/sql",
            headers={"content-disposition": "attachment; filename=recyclic_db_export_20250101_120000.sql"}
        )

        # Act
        response = super_admin_client.post("/api/v1/admin/db/export")

        # Assert
        assert response.status_code == 200
        # Vérifier que FileResponse a été appelé avec un filename contenant timestamp
        call_args = mock_file_response.call_args
        filename = call_args.kwargs.get('filename', '')
        assert "recyclic_db_export_" in filename
        assert ".sql" in filename
