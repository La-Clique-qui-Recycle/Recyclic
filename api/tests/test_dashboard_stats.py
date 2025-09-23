from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.core.config import settings
from recyclic_api.core.security import hash_password, create_access_token
from recyclic_api.models.cash_session import CashSession, CashSessionStatus
from recyclic_api.models.site import Site
from recyclic_api.models.user import User, UserRole, UserStatus
def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def _create_user(db: Session, role: UserRole, username: str, site_id) -> User:
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password=hash_password('StrongPass!23'),
        role=role,
        status=UserStatus.APPROVED,
        is_active=True,
        site_id=site_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_dashboard_stats_endpoint(admin_client: TestClient, db_session: Session):
    """Teste la récupération réussie des statistiques du tableau de bord."""
    from recyclic_api.core.auth import get_current_user
    from recyclic_api.models.user import User, UserRole, UserStatus
    from recyclic_api.main import app
    
    # Créer un utilisateur admin mock
    admin_user = User(
        id=uuid4(),
        username="test_admin",
        telegram_id="123456789",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
        is_active=True
    )
    
    # Créer un site de test
    site = Site(id=uuid4(), name="Site Test Stats", is_active=True)
    db_session.add(site)
    db_session.commit()

    # Override de l'authentification
    app.dependency_overrides[get_current_user] = lambda: admin_user
    
    try:
        response = admin_client.get(f"/api/v1/admin/dashboard/dashboard/stats?site_id={site.id}")
        
        assert response.status_code == 200
        data = response.json()
        # Vérifier que la réponse contient les champs attendus du dashboard
        assert "metrics" in data or "recent_sessions" in data or "recent_reports" in data
    finally:
        # Nettoyer l'override
        app.dependency_overrides.pop(get_current_user, None)

