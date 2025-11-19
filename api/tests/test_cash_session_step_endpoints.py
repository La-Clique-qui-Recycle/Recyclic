import pytest
from datetime import datetime, timezone
from uuid import uuid4

from recyclic_api.models.cash_session import CashSession, CashSessionStatus, CashSessionStep
from recyclic_api.models.user import User, UserRole
from recyclic_api.schemas.cash_session import CashSessionStepUpdate, CashSessionStep


class TestCashSessionStepEndpoints:
    """Tests pour les endpoints de métriques d'étapes des sessions de caisse."""

    def test_get_session_step_metrics_success(self, client, db_session, test_user):
        """Test récupération des métriques d'étape avec succès."""
        # Créer une session de test
        session = CashSession(
            operator_id=test_user.id,
            site_id=uuid4(),
            initial_amount=50.0,
            current_step=CashSessionStep.ENTRY,
            last_activity=datetime.now(timezone.utc),
            step_start_time=datetime.now(timezone.utc)
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Faire la requête
        response = client.get(f"/api/v1/sessions/{session.id}/step")

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == str(session.id)
        assert data["current_step"] == "entry"
        assert data["step_start_time"] is not None
        assert data["last_activity"] is not None

    def test_get_session_step_metrics_not_found(self, client, test_user):
        """Test récupération des métriques d'une session inexistante."""
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        fake_session_id = str(uuid4())
        response = client.get(f"/api/v1/sessions/{fake_session_id}/step")

        assert response.status_code == 404
        assert "non trouvée" in response.json()["detail"]

    def test_get_session_step_metrics_unauthorized(self, client, db_session, test_user, admin_user):
        """Test accès non autorisé aux métriques d'une autre session."""
        # Créer une session pour l'admin
        session = CashSession(
            operator_id=admin_user.id,
            site_id=uuid4(),
            initial_amount=50.0
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier un utilisateur normal
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Tenter d'accéder à la session de l'admin
        response = client.get(f"/api/v1/sessions/{session.id}/step")

        assert response.status_code == 403
        assert "non autorisé" in response.json()["detail"]

    def test_update_session_step_success(self, client, db_session, test_user):
        """Test mise à jour de l'étape avec succès."""
        # Créer une session de test
        session = CashSession(
            operator_id=test_user.id,
            site_id=uuid4(),
            initial_amount=50.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Mettre à jour l'étape
        step_update = CashSessionStepUpdate(step=CashSessionStep.SALE)
        response = client.put(
            f"/api/v1/sessions/{session.id}/step",
            json=step_update.model_dump()
        )

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == str(session.id)
        assert data["current_step"] == "sale"
        assert data["step_start_time"] is not None
        assert data["last_activity"] is not None

    def test_update_session_step_closed_session(self, client, db_session, test_user):
        """Test mise à jour de l'étape d'une session fermée."""
        # Créer une session fermée
        session = CashSession(
            operator_id=test_user.id,
            site_id=uuid4(),
            initial_amount=50.0,
            status=CashSessionStatus.CLOSED
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Tenter de mettre à jour l'étape
        step_update = CashSessionStepUpdate(step=CashSessionStep.SALE)
        response = client.put(
            f"/api/v1/sessions/{session.id}/step",
            json=step_update.model_dump()
        )

        assert response.status_code == 400
        assert "fermée" in response.json()["detail"]

    def test_update_session_step_invalid_step(self, client, db_session, test_user):
        """Test mise à jour avec une étape invalide."""
        # Créer une session de test
        session = CashSession(
            operator_id=test_user.id,
            site_id=uuid4(),
            initial_amount=50.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Tenter de mettre à jour avec une étape invalide
        response = client.put(
            f"/api/v1/sessions/{session.id}/step",
            json={"step": "invalid_step"}
        )

        assert response.status_code == 422  # Validation error

    def test_update_session_step_unauthorized(self, client, db_session, test_user, admin_user):
        """Test mise à jour non autorisée d'une session d'un autre utilisateur."""
        # Créer une session pour l'admin
        session = CashSession(
            operator_id=admin_user.id,
            site_id=uuid4(),
            initial_amount=50.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier un utilisateur normal
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Tenter de mettre à jour la session de l'admin
        step_update = CashSessionStepUpdate(step=CashSessionStep.SALE)
        response = client.put(
            f"/api/v1/sessions/{session.id}/step",
            json=step_update.model_dump()
        )

        assert response.status_code == 403
        assert "non autorisé" in response.json()["detail"]

    def test_session_creation_initializes_step_metrics(self, client, db_session, test_user):
        """Test que la création de session initialise les métriques d'étape."""
        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Créer une session
        session_data = {
            "operator_id": str(test_user.id),
            "site_id": str(uuid4()),
            "initial_amount": 75.0
        }
        response = client.post("/api/v1/sessions/", json=session_data)

        assert response.status_code == 201
        data = response.json()

        # Vérifier que les métriques sont initialisées
        assert data["current_step"] == "entry"
        assert data["step_start_time"] is not None
        assert data["last_activity"] is not None

    def test_step_metrics_include_duration(self, client, db_session, test_user):
        """Test que les métriques incluent la durée écoulée."""
        # Créer une session avec métriques
        session = CashSession(
            operator_id=test_user.id,
            site_id=uuid4(),
            initial_amount=50.0
        )
        session.set_current_step(CashSessionStep.ENTRY)
        db_session.add(session)
        db_session.commit()

        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Récupérer les métriques
        response = client.get(f"/api/v1/sessions/{session.id}/step")

        assert response.status_code == 200
        data = response.json()

        # Vérifier que la durée est présente et >= 0
        assert "step_duration_seconds" in data
        assert data["step_duration_seconds"] >= 0

    def test_step_update_preserves_history(self, client, db_session, test_user):
        """Test que les mises à jour d'étape préservent l'historique."""
        # Créer une session
        session = CashSession(
            operator_id=test_user.id,
            site_id=uuid4(),
            initial_amount=50.0,
            status=CashSessionStatus.OPEN
        )
        db_session.add(session)
        db_session.commit()

        # Authentifier l'utilisateur
        client.headers["Authorization"] = f"Bearer {test_user.id}"

        # Première mise à jour
        step_update = CashSessionStepUpdate(step=CashSessionStep.ENTRY)
        response1 = client.put(
            f"/api/v1/sessions/{session.id}/step",
            json=step_update.model_dump()
        )
        assert response1.status_code == 200

        # Deuxième mise à jour
        step_update = CashSessionStepUpdate(step=CashSessionStep.SALE)
        response2 = client.put(
            f"/api/v1/sessions/{session.id}/step",
            json=step_update.model_dump()
        )
        assert response2.status_code == 200

        # Vérifier que l'étape a changé
        data = response2.json()
        assert data["current_step"] == "sale"

        # Vérifier que les timestamps sont différents
        start_time_1 = response1.json()["step_start_time"]
        start_time_2 = data["step_start_time"]
        assert start_time_2 > start_time_1


