import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.models.user import UserStatus, UserRole
from tests.factories import UserFactory
from recyclic_api.main import app
from recyclic_api.core.database import get_db


class TestPendingUsersEndpoints:
    def test_get_pending_users_success_returns_list(self, admin_client: TestClient, db_session: Session):
        u1 = UserFactory(status=UserStatus.PENDING)
        u2 = UserFactory(status=UserStatus.APPROVED)
        db_session.add_all([u1, u2])
        db_session.commit()

        resp = admin_client.get("/api/v1/admin/users/pending")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["status"] == UserStatus.PENDING.value

    def test_get_pending_users_empty_list_returns_empty(self, admin_client: TestClient, db_session: Session):
        u = UserFactory(status=UserStatus.APPROVED)
        db_session.add(u)
        db_session.commit()
        resp = admin_client.get("/api/v1/admin/users/pending")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_pending_users_insufficient_role_returns_403(self, client: TestClient, db_session: Session):
        user = UserFactory(role=UserRole.USER, status=UserStatus.APPROVED)
        db_session.add(user)
        db_session.commit()
        client.headers.pop("Authorization", None)
        resp = client.get("/api/v1/admin/users/pending")
        assert resp.status_code in (401, 403)

    def test_approve_user_success_updates_status(self, admin_client: TestClient, db_session: Session):
        user = UserFactory(status=UserStatus.PENDING)
        db_session.add(user)
        db_session.commit()
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/approve")
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.APPROVED

    def test_approve_user_not_found_returns_404(self, admin_client: TestClient):
        resp = admin_client.post(f"/api/v1/admin/users/{uuid.uuid4()}/approve")
        assert resp.status_code == 404

    def test_approve_user_invalid_uuid_returns_404(self, admin_client: TestClient):
        resp = admin_client.post("/api/v1/admin/users/invalid-uuid/approve")
        assert resp.status_code == 404

    def test_approve_user_not_pending_returns_400(self, admin_client: TestClient, db_session: Session):
        user = UserFactory(status=UserStatus.APPROVED)
        db_session.add(user)
        db_session.commit()
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/approve")
        assert resp.status_code == 400

    def test_reject_user_success_updates_status(self, admin_client: TestClient, db_session: Session):
        user = UserFactory(status=UserStatus.PENDING)
        db_session.add(user)
        db_session.commit()
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/reject")
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.REJECTED

    def test_reject_user_not_found_returns_404(self, admin_client: TestClient):
        resp = admin_client.post(f"/api/v1/admin/users/{uuid.uuid4()}/reject")
        assert resp.status_code == 404

    def test_reject_user_not_pending_returns_400(self, admin_client: TestClient, db_session: Session):
        user = UserFactory(status=UserStatus.APPROVED)
        db_session.add(user)
        db_session.commit()
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/reject")
        assert resp.status_code == 400

    @pytest.mark.usefixtures()
    def test_approve_user_telegram_error_continues_operation(self, admin_client: TestClient, db_session: Session, monkeypatch):
        user = UserFactory(status=UserStatus.PENDING)
        db_session.add(user)
        db_session.commit()
        from recyclic_api.services import telegram_service as ts
        monkeypatch.setattr(ts.telegram_service, "send_user_approval_notification", lambda *a, **k: None)
        monkeypatch.setattr(ts.telegram_service, "notify_admins_user_processed", lambda *a, **k: None)
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/approve")
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.APPROVED

    def test_reject_user_telegram_error_continues_operation(self, admin_client: TestClient, db_session: Session, monkeypatch):
        user = UserFactory(status=UserStatus.PENDING)
        db_session.add(user)
        db_session.commit()
        from recyclic_api.services import telegram_service as ts
        monkeypatch.setattr(ts.telegram_service, "send_user_rejection_notification", lambda *a, **k: None)
        monkeypatch.setattr(ts.telegram_service, "notify_admins_user_processed", lambda *a, **k: None)
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/reject")
        assert resp.status_code == 200
        db_session.refresh(user)
        assert user.status == UserStatus.REJECTED

    def test_approve_user_without_message_succeeds(self, admin_client: TestClient, db_session: Session):
        user = UserFactory(status=UserStatus.PENDING)
        db_session.add(user)
        db_session.commit()
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/approve", json=None)
        assert resp.status_code == 200

    def test_reject_user_without_reason_succeeds(self, admin_client: TestClient, db_session: Session):
        user = UserFactory(status=UserStatus.PENDING)
        db_session.add(user)
        db_session.commit()
        resp = admin_client.post(f"/api/v1/admin/users/{user.id}/reject", json=None)
        assert resp.status_code == 200

    def test_database_error_handling_returns_500(self, admin_client: TestClient):
        # Override FastAPI dependency to force DB error
        def _broken_get_db():
            raise Exception("Database connection error")
        app.dependency_overrides[get_db] = _broken_get_db
        try:
            resp = admin_client.get("/api/v1/admin/users/pending")
            assert resp.status_code == 500
        finally:
            app.dependency_overrides.pop(get_db, None)
