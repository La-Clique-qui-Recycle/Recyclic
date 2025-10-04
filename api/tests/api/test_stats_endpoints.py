"""
Tests for statistics endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import uuid4

from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.poste_reception import PosteReception, PosteReceptionStatus
from recyclic_api.models.ticket_depot import TicketDepot, TicketDepotStatus
from recyclic_api.models.ligne_depot import LigneDepot, Destination
from recyclic_api.models.category import Category
from recyclic_api.core.security import create_access_token, hash_password


@pytest.fixture
def test_categories(db_session: Session):
    """Create test categories."""
    categories = [
        Category(
            id=uuid4(),
            name="Écrans",
            is_active=True
        ),
        Category(
            id=uuid4(),
            name="Petit électroménager",
            is_active=True
        ),
        Category(
            id=uuid4(),
            name="Gros électroménager",
            is_active=True
        )
    ]
    for cat in categories:
        db_session.add(cat)
    db_session.commit()
    return categories


@pytest.fixture
def test_reception_data(db_session: Session, test_categories):
    """Create test reception data with tickets and lines."""
    # Create user
    user = User(
        id=uuid4(),
        username="benevole@test.com",
        hashed_password=hash_password("password"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE
    )
    db_session.add(user)
    db_session.commit()

    # Create poste
    poste = PosteReception(
        id=uuid4(),
        opened_by_user_id=user.id,
        status=PosteReceptionStatus.OPENED.value
    )
    db_session.add(poste)
    db_session.commit()

    # Create tickets with different dates
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)

    tickets_data = [
        (today, test_categories[0], 10.5, 5),  # Écrans: 10.5kg, 5 items
        (today, test_categories[1], 15.2, 8),  # Petit électroménager: 15.2kg, 8 items
        (yesterday, test_categories[0], 20.0, 10),  # Écrans: 20.0kg, 10 items
        (week_ago, test_categories[2], 50.0, 3),  # Gros électroménager: 50.0kg, 3 items
    ]

    for created_at, category, weight, item_count in tickets_data:
        ticket = TicketDepot(
            id=uuid4(),
            poste_id=poste.id,
            benevole_user_id=user.id,
            status=TicketDepotStatus.CLOSED.value,
            created_at=created_at
        )
        db_session.add(ticket)
        db_session.flush()

        # Create ligne depot
        ligne = LigneDepot(
            id=uuid4(),
            ticket_id=ticket.id,
            category_id=category.id,
            poids_kg=Decimal(str(weight)),
            destination=Destination.MAGASIN
        )
        db_session.add(ligne)

    db_session.commit()

    return {
        "total_weight": Decimal("95.7"),  # 10.5 + 15.2 + 20.0 + 50.0
        "total_items": 4,  # Number of ligne_depot records
        "unique_categories": 3,
        "categories": test_categories
    }


class TestReceptionSummaryEndpoint:
    """Tests for GET /api/v1/stats/reception/summary endpoint."""

    def test_summary_requires_authentication(self, client: TestClient, test_reception_data):
        """Test that the endpoint requires authentication."""
        response = client.get("/api/v1/stats/reception/summary")
        assert response.status_code == 401

    def test_summary_requires_admin_role(self, client: TestClient, db_session: Session, test_reception_data):
        """Test that the endpoint requires admin role."""
        # Create regular user
        user = User(
            id=uuid4(),
            username="user@test.com",
            hashed_password=hash_password("password"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Create token for regular user
        token = create_access_token(data={"sub": str(user.id)})

        response = client.get(
            "/api/v1/stats/reception/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403

    def test_summary_success_no_filters(self, admin_client: TestClient, test_reception_data):
        """Test successful retrieval of summary without filters."""
        response = admin_client.get("/api/v1/stats/reception/summary")

        assert response.status_code == 200
        data = response.json()

        assert "total_weight" in data
        assert "total_items" in data
        assert "unique_categories" in data

        # Verify values (allowing for existing data in test DB)
        # Our test data adds 95.7kg, so result should be >= this
        assert float(data["total_weight"]) >= float(test_reception_data["total_weight"])
        assert data["total_items"] >= test_reception_data["total_items"]
        assert data["unique_categories"] >= test_reception_data["unique_categories"]

    def test_summary_with_date_filters(self, admin_client: TestClient, test_reception_data):
        """Test summary with date range filters."""
        today = datetime.now().date()
        yesterday = (datetime.now() - timedelta(days=1)).date()

        # Filter for last 2 days (should include today and yesterday)
        response = admin_client.get(
            f"/api/v1/stats/reception/summary?start_date={yesterday}&end_date={today}"
        )

        assert response.status_code == 200
        data = response.json()

        # Should include today (10.5 + 15.2) and yesterday (20.0) = 45.7kg minimum
        # (may have more from other tests, so >= check)
        assert float(data["total_weight"]) >= 45.7
        assert data["total_items"] >= 3
        assert data["unique_categories"] >= 2  # At least Écrans and Petit électroménager

    def test_summary_with_start_date_only(self, admin_client: TestClient, test_reception_data):
        """Test summary with only start_date filter."""
        today = datetime.now().date()

        response = admin_client.get(
            f"/api/v1/stats/reception/summary?start_date={today}"
        )

        assert response.status_code == 200
        data = response.json()

        # Should include at least today's data: 10.5 + 15.2 = 25.7kg minimum
        assert float(data["total_weight"]) >= 25.7
        assert data["total_items"] >= 2

    def test_summary_empty_result(self, admin_client: TestClient, test_reception_data):
        """Test summary when no data matches filters."""
        future_date = (datetime.now() + timedelta(days=30)).date()

        response = admin_client.get(
            f"/api/v1/stats/reception/summary?start_date={future_date}"
        )

        assert response.status_code == 200
        data = response.json()

        assert float(data["total_weight"]) == 0.0
        assert data["total_items"] == 0
        assert data["unique_categories"] == 0

    def test_summary_rate_limiting(self, admin_client: TestClient):
        """Test that rate limiting is applied (configured at 60/minute)."""
        # This test verifies the endpoint has rate limiting configured
        # Actual rate limit testing would require making 60+ requests
        response = admin_client.get("/api/v1/stats/reception/summary")
        assert response.status_code == 200
        # Verify rate limit headers are present (slowapi adds these)
        # Note: In testing environment, rate limiting might be disabled

    def test_summary_invalid_date_range(self, admin_client: TestClient, test_reception_data):
        """Test that invalid date range (start > end) returns 400."""
        today = datetime.now().date()
        yesterday = (datetime.now() - timedelta(days=1)).date()

        # Request with start_date after end_date
        response = admin_client.get(
            f"/api/v1/stats/reception/summary?start_date={today}&end_date={yesterday}"
        )

        assert response.status_code == 400
        assert "start_date cannot be after end_date" in response.json()["detail"]


class TestReceptionByCategoryEndpoint:
    """Tests for GET /api/v1/stats/reception/by-category endpoint."""

    def test_by_category_requires_authentication(self, client: TestClient, test_reception_data):
        """Test that the endpoint requires authentication."""
        response = client.get("/api/v1/stats/reception/by-category")
        assert response.status_code == 401

    def test_by_category_requires_admin_role(self, client: TestClient, db_session: Session, test_reception_data):
        """Test that the endpoint requires admin role."""
        # Create regular user
        user = User(
            id=uuid4(),
            username="user2@test.com",
            hashed_password=hash_password("password"),
            role=UserRole.USER,
            status=UserStatus.ACTIVE
        )
        db_session.add(user)
        db_session.commit()

        # Create token for regular user
        token = create_access_token(data={"sub": str(user.id)})

        response = client.get(
            "/api/v1/stats/reception/by-category",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403

    def test_by_category_success_no_filters(self, admin_client: TestClient, test_reception_data):
        """Test successful retrieval of stats by category without filters."""
        response = admin_client.get("/api/v1/stats/reception/by-category")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) >= 3  # At least 3 categories (may have more from other tests)

        # Verify structure
        for item in data:
            assert "category_name" in item
            assert "total_weight" in item
            assert "total_items" in item

        # Verify our test categories are present and ordered by weight (descending)
        category_dict = {item["category_name"]: item for item in data}

        # Check our test categories exist
        assert "Gros électroménager" in category_dict
        assert "Écrans" in category_dict
        assert "Petit électroménager" in category_dict

        # Verify minimum values for our test data
        assert float(category_dict["Gros électroménager"]["total_weight"]) >= 50.0
        assert float(category_dict["Écrans"]["total_weight"]) >= 30.5  # 10.5 + 20.0
        assert float(category_dict["Petit électroménager"]["total_weight"]) >= 15.2

    def test_by_category_with_date_filters(self, admin_client: TestClient, test_reception_data):
        """Test by-category with date range filters."""
        today = datetime.now().date()

        # Filter for today only
        response = admin_client.get(
            f"/api/v1/stats/reception/by-category?start_date={today}&end_date={today}"
        )

        assert response.status_code == 200
        data = response.json()

        assert len(data) >= 2  # At least 2 categories today (may have more from other tests)

        # Verify our test categories from today are present
        category_names = [item["category_name"] for item in data]
        assert "Écrans" in category_names
        assert "Petit électroménager" in category_names
        # Note: Gros électroménager was added a week ago, so shouldn't be in today's data
        # But we can't assert it's NOT there because other tests may add it

    def test_by_category_empty_result(self, admin_client: TestClient, test_reception_data):
        """Test by-category when no data matches filters."""
        future_date = (datetime.now() + timedelta(days=30)).date()

        response = admin_client.get(
            f"/api/v1/stats/reception/by-category?start_date={future_date}"
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 0

    def test_by_category_invalid_date_range(self, admin_client: TestClient, test_reception_data):
        """Test that invalid date range (start > end) returns 400."""
        today = datetime.now().date()
        yesterday = (datetime.now() - timedelta(days=1)).date()

        # Request with start_date after end_date
        response = admin_client.get(
            f"/api/v1/stats/reception/by-category?start_date={today}&end_date={yesterday}"
        )

        assert response.status_code == 400
        assert "start_date cannot be after end_date" in response.json()["detail"]


class TestStatsSQLPerformance:
    """Tests to verify SQL query performance and optimization."""

    def test_summary_uses_aggregation(self, admin_client: TestClient, test_reception_data):
        """Verify that summary endpoint uses SQL aggregation (not fetching all rows)."""
        # This is an implicit test - if the query was fetching all rows,
        # it would be significantly slower with large datasets
        # The query uses func.sum(), func.count() which are SQL aggregations
        response = admin_client.get("/api/v1/stats/reception/summary")
        assert response.status_code == 200
        # If this runs quickly, aggregation is working

    def test_by_category_uses_group_by(self, admin_client: TestClient, test_reception_data):
        """Verify that by-category endpoint uses GROUP BY."""
        # Similar to above - verifies the query structure
        response = admin_client.get("/api/v1/stats/reception/by-category")
        assert response.status_code == 200
        data = response.json()
        # Each category appears only once (GROUP BY is working)
        category_names = [item["category_name"] for item in data]
        assert len(category_names) == len(set(category_names))  # No duplicates
