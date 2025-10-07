"""Tests for categories endpoints"""
import pytest
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.category import Category
from recyclic_api.core.auth import create_access_token
from recyclic_api.core.security import hash_password


@pytest.fixture
def super_admin_user(db_session: Session):
    """Create a super admin user for tests."""
    admin = User(
        username="super_admin_test",
        email="superadmin@test.com",
        hashed_password=hash_password("TestPassword123!"),
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    return admin


@pytest.fixture
def super_admin_token(super_admin_user: User):
    """Create JWT token for super admin."""
    return create_access_token(data={"sub": str(super_admin_user.id)})


@pytest.fixture
def normal_user(db_session: Session):
    """Create a normal user for tests."""
    user = User(
        username="test_user",
        email="user@test.com",
        hashed_password=hash_password("TestPassword123!"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def normal_user_token(normal_user: User):
    """Create JWT token for normal user."""
    return create_access_token(data={"sub": str(normal_user.id)})


@pytest.fixture
def sample_category(db_session: Session):
    """Create a sample category for tests."""
    category = Category(
        name="Electronics",
        is_active=True
    )
    db_session.add(category)
    db_session.commit()
    return category


# Test POST /categories - Create category
@pytest.mark.asyncio
async def test_create_category_success(async_client: AsyncClient, super_admin_token: str):
    """Test successful category creation by super admin"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={"name": "Furniture"},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Furniture"
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_create_category_unauthorized(async_client: AsyncClient):
    """Test category creation without authentication"""
    response = await async_client.post(
        "/api/v1/categories/",
        json={"name": "Furniture"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_category_forbidden_non_super_admin(async_client: AsyncClient, normal_user_token: str):
    """Test category creation by non-super-admin user"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={"name": "Furniture"},
        headers=headers
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_category_duplicate_name(async_client: AsyncClient, super_admin_token: str, sample_category: Category):
    """Test creating category with duplicate name"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={"name": sample_category.name},
        headers=headers
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


# Test GET /categories - List categories
@pytest.mark.asyncio
async def test_get_categories_success(async_client: AsyncClient, normal_user_token: str, sample_category: Category):
    """Test getting all categories"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get("/api/v1/categories/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_categories_filter_active(async_client: AsyncClient, normal_user_token: str, db_session: Session):
    """Test filtering categories by active status"""
    # Create active and inactive categories
    active_cat = Category(name="Active Category", is_active=True)
    inactive_cat = Category(name="Inactive Category", is_active=False)
    db_session.add(active_cat)
    db_session.add(inactive_cat)
    db_session.commit()

    headers = {"Authorization": f"Bearer {normal_user_token}"}

    # Get only active categories
    response = await async_client.get("/api/v1/categories/?is_active=true", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert all(cat["is_active"] is True for cat in data)


@pytest.mark.asyncio
async def test_get_categories_unauthorized(async_client: AsyncClient):
    """Test getting categories without authentication"""
    response = await async_client.get("/api/v1/categories/")
    assert response.status_code == 401


# Test GET /categories/{id} - Get single category
@pytest.mark.asyncio
async def test_get_category_by_id_success(async_client: AsyncClient, normal_user_token: str, sample_category: Category):
    """Test getting a category by ID"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{sample_category.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_category.id)
    assert data["name"] == sample_category.name


@pytest.mark.asyncio
async def test_get_category_by_id_not_found(async_client: AsyncClient, normal_user_token: str):
    """Test getting non-existent category"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get("/api/v1/categories/00000000-0000-0000-0000-000000000000", headers=headers)
    assert response.status_code == 404


# Test PUT /categories/{id} - Update category
@pytest.mark.asyncio
async def test_update_category_success(async_client: AsyncClient, super_admin_token: str, sample_category: Category):
    """Test successful category update by super admin"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{sample_category.id}",
        json={"name": "Updated Electronics"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Electronics"


@pytest.mark.asyncio
async def test_update_category_forbidden_non_super_admin(async_client: AsyncClient, normal_user_token: str, sample_category: Category):
    """Test category update by non-super-admin user"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{sample_category.id}",
        json={"name": "Updated Electronics"},
        headers=headers
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_category_not_found(async_client: AsyncClient, super_admin_token: str):
    """Test updating non-existent category"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        "/api/v1/categories/00000000-0000-0000-0000-000000000000",
        json={"name": "Updated"},
        headers=headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_category_duplicate_name(async_client: AsyncClient, super_admin_token: str, db_session: Session):
    """Test updating category with duplicate name"""
    cat1 = Category(name="Category 1", is_active=True)
    cat2 = Category(name="Category 2", is_active=True)
    db_session.add(cat1)
    db_session.add(cat2)
    db_session.commit()

    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{cat2.id}",
        json={"name": "Category 1"},
        headers=headers
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


# Test DELETE /categories/{id} - Soft delete category
@pytest.mark.asyncio
async def test_delete_category_success(async_client: AsyncClient, super_admin_token: str, sample_category: Category):
    """Test successful soft delete by super admin"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.delete(f"/api/v1/categories/{sample_category.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_delete_category_forbidden_non_super_admin(async_client: AsyncClient, normal_user_token: str, sample_category: Category):
    """Test category deletion by non-super-admin user"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.delete(f"/api/v1/categories/{sample_category.id}", headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_category_not_found(async_client: AsyncClient, super_admin_token: str):
    """Test deleting non-existent category"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.delete("/api/v1/categories/00000000-0000-0000-0000-000000000000", headers=headers)
    assert response.status_code == 404


# Test hierarchy functionality
@pytest.fixture
def parent_category(db_session: Session):
    """Create a parent category for hierarchy tests."""
    category = Category(
        name="Electronics",
        is_active=True
    )
    db_session.add(category)
    db_session.commit()
    return category


@pytest.fixture
def child_category(db_session: Session, parent_category: Category):
    """Create a child category for hierarchy tests."""
    category = Category(
        name="Smartphones",
        is_active=True,
        parent_id=parent_category.id
    )
    db_session.add(category)
    db_session.commit()
    return category


# Test POST /categories - Create category with parent
@pytest.mark.asyncio
async def test_create_category_with_parent(async_client: AsyncClient, super_admin_token: str, parent_category: Category):
    """Test creating a category with a parent"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={
            "name": "Laptops",
            "parent_id": str(parent_category.id)
        },
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptops"
    assert data["parent_id"] == str(parent_category.id)
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_category_with_invalid_parent(async_client: AsyncClient, super_admin_token: str):
    """Test creating a category with non-existent parent"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={
            "name": "Laptops",
            "parent_id": "00000000-0000-0000-0000-000000000000"
        },
        headers=headers
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_category_with_inactive_parent(async_client: AsyncClient, super_admin_token: str, db_session: Session):
    """Test creating a category with inactive parent"""
    # Create inactive parent
    inactive_parent = Category(name="Inactive Parent", is_active=False)
    db_session.add(inactive_parent)
    db_session.commit()
    
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={
            "name": "Child Category",
            "parent_id": str(inactive_parent.id)
        },
        headers=headers
    )
    assert response.status_code == 400
    assert "not found or inactive" in response.json()["detail"]


# Test PUT /categories/{id} - Update category parent
@pytest.mark.asyncio
async def test_update_category_parent(async_client: AsyncClient, super_admin_token: str, child_category: Category, parent_category: Category):
    """Test updating a category's parent"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{child_category.id}",
        json={"parent_id": None},  # Remove parent
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["parent_id"] is None


@pytest.mark.asyncio
async def test_update_category_self_parent(async_client: AsyncClient, super_admin_token: str, parent_category: Category):
    """Test updating a category to be its own parent (should fail)"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{parent_category.id}",
        json={"parent_id": str(parent_category.id)},
        headers=headers
    )
    assert response.status_code == 400
    assert "cannot be its own parent" in response.json()["detail"]


# Test GET /categories/hierarchy - Get hierarchy
@pytest.mark.asyncio
async def test_get_categories_hierarchy(async_client: AsyncClient, normal_user_token: str, parent_category: Category, child_category: Category):
    """Test getting categories in hierarchical structure"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get("/api/v1/categories/hierarchy", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    # Should have one root category with one child
    assert len(data) == 1
    root_category = data[0]
    assert root_category["name"] == "Electronics"
    assert len(root_category["children"]) == 1
    assert root_category["children"][0]["name"] == "Smartphones"


# Test GET /categories/{id}/children - Get children
@pytest.mark.asyncio
async def test_get_category_children(async_client: AsyncClient, normal_user_token: str, parent_category: Category, child_category: Category):
    """Test getting direct children of a category"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{parent_category.id}/children", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 1
    assert data[0]["name"] == "Smartphones"
    assert data[0]["parent_id"] == str(parent_category.id)


@pytest.mark.asyncio
async def test_get_category_children_empty(async_client: AsyncClient, normal_user_token: str, child_category: Category):
    """Test getting children of a category with no children"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{child_category.id}/children", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


# Test GET /categories/{id}/parent - Get parent
@pytest.mark.asyncio
async def test_get_category_parent(async_client: AsyncClient, normal_user_token: str, parent_category: Category, child_category: Category):
    """Test getting parent of a category"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{child_category.id}/parent", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == "Electronics"
    assert data["id"] == str(parent_category.id)


@pytest.mark.asyncio
async def test_get_category_parent_not_found(async_client: AsyncClient, normal_user_token: str, parent_category: Category):
    """Test getting parent of a category with no parent"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{parent_category.id}/parent", headers=headers)
    assert response.status_code == 404
    assert "no parent" in response.json()["detail"]


# Test GET /categories/{id}/breadcrumb - Get breadcrumb
@pytest.mark.asyncio
async def test_get_category_breadcrumb(async_client: AsyncClient, normal_user_token: str, parent_category: Category, child_category: Category):
    """Test getting breadcrumb of a category"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{child_category.id}/breadcrumb", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    # Should have 2 items: parent -> child
    assert len(data) == 2
    assert data[0]["name"] == "Electronics"  # Root
    assert data[1]["name"] == "Smartphones"  # Child


@pytest.mark.asyncio
async def test_get_category_breadcrumb_root(async_client: AsyncClient, normal_user_token: str, parent_category: Category):
    """Test getting breadcrumb of a root category"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{parent_category.id}/breadcrumb", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    # Should have 1 item: just the root category
    assert len(data) == 1
    assert data[0]["name"] == "Electronics"


@pytest.mark.asyncio
async def test_get_category_breadcrumb_not_found(async_client: AsyncClient, normal_user_token: str):
    """Test getting breadcrumb of non-existent category"""
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get("/api/v1/categories/00000000-0000-0000-0000-000000000000/breadcrumb", headers=headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


# Test hierarchy depth constraints
@pytest.mark.asyncio
async def test_create_category_exceeds_max_depth(async_client: AsyncClient, super_admin_token: str, db_session: Session):
    """Test creating a category that would exceed maximum hierarchy depth"""
    # Create a deep hierarchy (5 levels)
    categories = []
    parent_id = None
    
    for i in range(5):
        category = Category(
            name=f"Level {i+1}",
            is_active=True,
            parent_id=parent_id
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
        categories.append(category)
        parent_id = category.id
    
    # Try to create a 6th level (should fail)
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={
            "name": "Level 6",
            "parent_id": str(parent_id)
        },
        headers=headers
    )
    assert response.status_code == 400
    assert "maximum hierarchy depth" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_category_exceeds_max_depth(async_client: AsyncClient, super_admin_token: str, db_session: Session):
    """Test updating a category that would exceed maximum hierarchy depth"""
    # Create a deep hierarchy (5 levels)
    categories = []
    parent_id = None
    
    for i in range(5):
        category = Category(
            name=f"Level {i+1}",
            is_active=True,
            parent_id=parent_id
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
        categories.append(category)
        parent_id = category.id
    
    # Create a separate root category
    root_category = Category(name="Root", is_active=True)
    db_session.add(root_category)
    db_session.commit()
    db_session.refresh(root_category)
    
    # Try to move the root category under the deep hierarchy (should fail)
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{root_category.id}",
        json={"parent_id": str(parent_id)},
        headers=headers
    )
    assert response.status_code == 400
    assert "maximum hierarchy depth" in response.json()["detail"]


# Test price field validation
@pytest.mark.asyncio
async def test_create_category_with_price_on_subcategory(async_client: AsyncClient, super_admin_token: str, parent_category: Category):
    """Test creating a subcategory with price fields (should succeed)"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={
            "name": "Premium Laptops",
            "parent_id": str(parent_category.id),
            "price": "299.99",
            "min_price": "199.99",
            "max_price": "499.99"
        },
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Premium Laptops"
    assert data["parent_id"] == str(parent_category.id)
    assert float(data["price"]) == 299.99
    assert float(data["min_price"]) == 199.99
    assert float(data["max_price"]) == 499.99


@pytest.mark.asyncio
async def test_create_category_with_price_on_root_category_fails(async_client: AsyncClient, super_admin_token: str):
    """Test creating a root category with price fields (should fail with 422)"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.post(
        "/api/v1/categories/",
        json={
            "name": "Root Electronics",
            "price": "299.99"
        },
        headers=headers
    )
    assert response.status_code == 422
    assert "Price fields can only be set on subcategories" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_category_add_price_to_subcategory(async_client: AsyncClient, super_admin_token: str, child_category: Category):
    """Test updating a subcategory to add price fields (should succeed)"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{child_category.id}",
        json={
            "price": "199.99",
            "min_price": "99.99",
            "max_price": "299.99"
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["price"]) == 199.99
    assert float(data["min_price"]) == 99.99
    assert float(data["max_price"]) == 299.99


@pytest.mark.asyncio
async def test_update_category_add_price_to_root_category_fails(async_client: AsyncClient, super_admin_token: str, parent_category: Category):
    """Test updating a root category to add price fields (should fail with 422)"""
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{parent_category.id}",
        json={"price": "199.99"},
        headers=headers
    )
    assert response.status_code == 422
    assert "Price fields can only be set on subcategories" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_category_remove_parent_with_price_fails(async_client: AsyncClient, super_admin_token: str, db_session: Session, parent_category: Category):
    """Test removing parent from a category that has price fields (should fail with 422)"""
    # Create a subcategory with price
    subcategory = Category(
        name="Priced Subcategory",
        is_active=True,
        parent_id=parent_category.id,
        price=Decimal("199.99")
    )
    db_session.add(subcategory)
    db_session.commit()
    db_session.refresh(subcategory)

    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await async_client.put(
        f"/api/v1/categories/{subcategory.id}",
        json={"parent_id": None},
        headers=headers
    )
    assert response.status_code == 422
    assert "Price fields can only be set on subcategories" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_category_with_price_fields(async_client: AsyncClient, normal_user_token: str, db_session: Session, parent_category: Category):
    """Test retrieving a category with price fields"""
    # Create a subcategory with price
    subcategory = Category(
        name="Priced Laptop",
        is_active=True,
        parent_id=parent_category.id,
        price=Decimal("299.99"),
        min_price=Decimal("199.99"),
        max_price=Decimal("499.99")
    )
    db_session.add(subcategory)
    db_session.commit()
    db_session.refresh(subcategory)

    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = await async_client.get(f"/api/v1/categories/{subcategory.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert float(data["price"]) == 299.99
    assert float(data["min_price"]) == 199.99
    assert float(data["max_price"]) == 499.99