
import pytest
import uuid
from unittest.mock import MagicMock
from sqlalchemy.orm import Session
from datetime import datetime

from recyclic_api.services.cash_session_service import CashSessionService
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.site import Site
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.sale import Sale
from recyclic_api.schemas.cash_session import CashSessionFilters
from recyclic_api.core.security import hash_password

@pytest.fixture
def test_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        username='test_n1_user',
        hashed_password=hash_password('password'),
        role=UserRole.USER,
        status=UserStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def test_site(db_session: Session) -> Site:
    site = Site(id=uuid.uuid4(), name='Test Site N1')
    db_session.add(site)
    db_session.commit()
    return site

class TestCashSessionPerformance:
    def test_get_sessions_avoids_n_plus_1(self, db_session: Session, test_user: User, test_site: Site):
        """
        Tests that get_sessions_with_filters avoids the N+1 query problem.
        """
        # Arrange: Create multiple sessions with sales
        for i in range(5):
            session = CashSession(
                id=uuid.uuid4(),
                operator_id=test_user.id,
                site_id=test_site.id,
                initial_amount=100.0,
                opened_at=datetime.utcnow()
            )
            db_session.add(session)
            db_session.flush()  # Flush to get session ID

            # Add sales to the session
            for j in range(3):
                sale = Sale(
                    id=uuid.uuid4(),
                    cash_session_id=session.id,
                    total_amount=10.0 * (j + 1),
                    donation=1.0 if j % 2 == 0 else 0.0
                )
                db_session.add(sale)
        db_session.commit()

        service = CashSessionService(db_session)
        filters = CashSessionFilters(skip=0, limit=10)

        # Act: Track the number of queries
        db_session.execute = MagicMock(wraps=db_session.execute)
        service.get_sessions_with_filters(filters)

        # Assert: Check that the number of queries is low
        # A good implementation should have a constant number of queries,
        # regardless of the number of sessions.
        # e.g., 1 for sessions, 1 for sales, 1 for donations, 1 for total count.
        assert db_session.execute.call_count < 5, "N+1 problem detected: too many queries."

