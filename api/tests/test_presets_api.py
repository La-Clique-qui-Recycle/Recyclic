import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from recyclic_api.main import app
from recyclic_api.core.database import get_db
from recyclic_api.models.category import Category
from recyclic_api.models.preset_button import PresetButton, ButtonType
import uuid

client = TestClient(app)


@pytest.fixture
def test_category(db: Session):
    """Create a test category for preset buttons"""
    category = Category(
        name="Test Category",
        is_active=True
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_preset_button(db: Session, test_category):
    """Create a test preset button"""
    preset = PresetButton(
        name="Test Preset",
        category_id=test_category.id,
        preset_price=10.50,
        button_type=ButtonType.DONATION,
        sort_order=1,
        is_active=True
    )
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return preset


def test_get_presets_empty(db: Session):
    """Test getting presets when none exist"""
    response = client.get("/api/v1/presets/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_presets_with_data(db: Session, test_preset_button):
    """Test getting presets when data exists"""
    response = client.get("/api/v1/presets/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1

    preset = data[0]
    assert preset["id"] == str(test_preset_button.id)
    assert preset["name"] == test_preset_button.name
    assert preset["preset_price"] == 10.5
    assert preset["button_type"] == "donation"
    assert preset["category_name"] == "Test Category"


def test_get_active_presets(db: Session, test_preset_button):
    """Test getting only active presets"""
    response = client.get("/api/v1/presets/active")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1


def test_get_preset_by_id(db: Session, test_preset_button):
    """Test getting a specific preset by ID"""
    response = client.get(f"/api/v1/presets/{test_preset_button.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_preset_button.id)
    assert data["name"] == test_preset_button.name


def test_get_preset_by_invalid_id():
    """Test getting a preset with invalid ID"""
    response = client.get("/api/v1/presets/invalid-id")
    assert response.status_code == 422  # Validation error for invalid UUID


def test_get_nonexistent_preset():
    """Test getting a preset that doesn't exist"""
    random_uuid = str(uuid.uuid4())
    response = client.get(f"/api/v1/presets/{random_uuid}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_filter_presets_by_category(db: Session, test_category, test_preset_button):
    """Test filtering presets by category"""
    response = client.get(f"/api/v1/presets/?category_id={test_category.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category_id"] == str(test_category.id)


def test_filter_presets_by_button_type(db: Session, test_preset_button):
    """Test filtering presets by button type"""
    response = client.get("/api/v1/presets/?button_type=donation")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["button_type"] == "donation"

    # Test with different type
    response = client.get("/api/v1/presets/?button_type=recycling")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


def test_filter_presets_by_active_status(db: Session, test_preset_button):
    """Test filtering presets by active status"""
    # Test active only
    response = client.get("/api/v1/presets/?is_active=true")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    # Test inactive only
    response = client.get("/api/v1/presets/?is_active=false")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
