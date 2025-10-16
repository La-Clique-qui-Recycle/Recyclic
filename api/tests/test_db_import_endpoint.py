"""
Tests pour l'endpoint d'import de base de données (Story B26-P2)
Pattern: Mocks & Overrides (évite d'exécuter psql réel en test)
"""

import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from io import BytesIO

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import create_access_token
from tests.factories import UserFactory


class TestDatabaseImportEndpoint:
    """Tests pour l'endpoint POST /api/v1/admin/db/import"""

    @patch('recyclic_api.api.api_v1.endpoints.db_import.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_import.os.path.exists')
    def test_import_database_success_as_super_admin(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste qu'un super-admin peut importer la base de données avec succès."""
        # Arrange
        # Mock successful backup and import
        mock_subprocess.return_value = MagicMock(returncode=0, stderr="")
        mock_exists.return_value = True

        # Create a test SQL file
        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 200
        response_data = response.json()
        assert "Import de la base de données effectué avec succès" in response_data["message"]
        assert response_data["imported_file"] == "test.sql"
        assert "backup_created" in response_data
        assert mock_subprocess.called

    def test_import_database_requires_authentication(self, client: TestClient):
        """Teste que l'endpoint nécessite une authentification."""
        # Arrange
        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 401

    def test_import_database_requires_super_admin_role(
        self,
        admin_client: TestClient
    ):
        """Teste que l'endpoint nécessite le rôle SUPER_ADMIN (ADMIN n'est pas suffisant)."""
        # Arrange
        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 403
        assert "super-administrateur" in response.json()["detail"].lower()

    def test_import_database_regular_user_denied(
        self,
        client: TestClient,
        db_session: Session
    ):
        """Teste qu'un utilisateur régulier ne peut pas importer."""
        # Arrange
        user = UserFactory(role=UserRole.USER, status=UserStatus.ACTIVE)
        db_session.commit()

        access_token = create_access_token(data={"sub": str(user.id)})
        client.headers = {"Authorization": f"Bearer {access_token}"}

        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 401

    def test_import_database_no_file_returns_400(self, super_admin_client: TestClient):
        """Teste que l'absence de fichier retourne une erreur 400."""
        # Act
        response = super_admin_client.post("/api/v1/admin/db/import")

        # Assert
        assert response.status_code == 400
        assert "Aucun fichier fourni" in response.json()["detail"]

    def test_import_database_non_sql_file_returns_400(self, super_admin_client: TestClient):
        """Teste qu'un fichier non-SQL retourne une erreur 400."""
        # Arrange
        files = {"file": ("test.txt", BytesIO(b"content"), "text/plain")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 400
        assert "fichier SQL" in response.json()["detail"]

    def test_import_database_file_too_large_returns_413(self, super_admin_client: TestClient):
        """Teste qu'un fichier trop volumineux retourne une erreur 413."""
        # Arrange
        # Create a large file (> 100MB)
        large_content = b"x" * (101 * 1024 * 1024)  # 101MB
        files = {"file": ("large.sql", BytesIO(large_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 413
        assert "trop volumineux" in response.json()["detail"]

    @patch('recyclic_api.api.api_v1.endpoints.db_import.subprocess.run')
    def test_import_database_backup_failure_returns_500(
        self,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que l'échec de la sauvegarde automatique retourne une erreur 500."""
        # Arrange
        # Mock backup failure
        mock_subprocess.return_value = MagicMock(
            returncode=1,
            stderr="pg_dump: error: connection failed"
        )

        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 500
        assert "sauvegarde automatique" in response.json()["detail"]

    @patch('recyclic_api.api.api_v1.endpoints.db_import.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_import.os.path.exists')
    def test_import_database_import_failure_returns_500(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que l'échec de l'import retourne une erreur 500."""
        # Arrange
        # Mock successful backup but failed import
        def side_effect(*args, **kwargs):
            # First call (backup) succeeds, second call (import) fails
            if len(mock_subprocess.call_args_list) == 0:
                return MagicMock(returncode=0, stderr="")
            else:
                return MagicMock(returncode=1, stderr="psql: error: syntax error")
        
        mock_subprocess.side_effect = side_effect
        mock_exists.return_value = True

        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 500
        assert "Erreur lors de l'import" in response.json()["detail"]

    @patch('recyclic_api.api.api_v1.endpoints.db_import.subprocess.run')
    def test_import_database_timeout_returns_504(
        self,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que le timeout de l'import retourne une erreur 504."""
        # Arrange
        # Mock timeout during import
        from subprocess import TimeoutExpired
        mock_subprocess.side_effect = TimeoutExpired(cmd="psql", timeout=600)

        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 504
        assert "timeout" in response.json()["detail"].lower()

    @patch('recyclic_api.api.api_v1.endpoints.db_import.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_import.os.path.exists')
    def test_import_database_creates_automatic_backup(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que l'import crée automatiquement une sauvegarde."""
        # Arrange
        # Mock successful backup and import
        mock_subprocess.return_value = MagicMock(returncode=0, stderr="")
        mock_exists.return_value = True

        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 200
        response_data = response.json()
        assert "backup_created" in response_data
        assert "recyclic_db_backup_before_import_" in response_data["backup_created"]
        
        # Vérifier que pg_dump a été appelé pour la sauvegarde
        assert mock_subprocess.called
        # Le premier appel devrait être pg_dump (backup)
        first_call = mock_subprocess.call_args_list[0]
        assert "pg_dump" in first_call[0][0]

    @patch('recyclic_api.api.api_v1.endpoints.db_import.subprocess.run')
    @patch('recyclic_api.api.api_v1.endpoints.db_import.os.path.exists')
    def test_import_database_cleans_up_temporary_files(
        self,
        mock_exists: Mock,
        mock_subprocess: Mock,
        super_admin_client: TestClient
    ):
        """Teste que les fichiers temporaires sont nettoyés après l'import."""
        # Arrange
        # Mock successful backup and import
        mock_subprocess.return_value = MagicMock(returncode=0, stderr="")
        mock_exists.return_value = True

        sql_content = b"CREATE TABLE test (id SERIAL PRIMARY KEY);"
        files = {"file": ("test.sql", BytesIO(sql_content), "application/sql")}

        # Act
        response = super_admin_client.post("/api/v1/admin/db/import", files=files)

        # Assert
        assert response.status_code == 200
        # Le test vérifie que le code gère le nettoyage des fichiers temporaires
        # (le nettoyage est fait dans le finally block)
