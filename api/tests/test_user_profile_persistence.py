import pytest
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.schemas.user import UserUpdate
from uuid import UUID


def test_user_profile_persistence_two_separate_requests(db_session: Session, client):
    """Test de reproduction du bug: les modifications de profil ne persistent pas entre deux requêtes HTTP séparées.

    Ce test reproduit le scénario utilisateur réel:
    1. Créer un utilisateur
    2. Modifier son profil via PUT /api/v1/users/{id} (première requête)
    3. Faire une nouvelle requête GET /api/v1/users/{id} (deuxième requête)
    4. Vérifier que les modifications sont visibles dans la deuxième requête
    """
    # Arrange: Créer un utilisateur avec un nom initial
    user = User(
        username="test@example.com",
        hashed_password="hashed_password",
        first_name="John",
        last_name="Doe",
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = str(user.id)

    # Act: Modifier le profil via l'API (première requête)
    update_data = UserUpdate(
        first_name="Jane",
        last_name="Smith"
    )

    update_response = client.put(
        f"/api/v1/users/{user_id}",
        json=update_data.model_dump(exclude_unset=True)
    )

    assert update_response.status_code == 200

    # Act: Récupérer l'utilisateur modifié (deuxième requête séparée)
    get_response = client.get(f"/api/v1/users/{user_id}")
    assert get_response.status_code == 200

    user_data = get_response.json()

    # Assert: Les modifications doivent être visibles dans la deuxième requête
    assert user_data["first_name"] == "Jane", "Bug: les modifications n'ont pas été persistées entre les requêtes"
    assert user_data["last_name"] == "Smith", "Bug: les modifications n'ont pas été persistées entre les requêtes"


def test_user_profile_persistence_with_uuid_without_hyphens(db_session: Session, client):
    """Test: UUID sans tirets fonctionne correctement (comportement Python valide)."""
    # Arrange: Créer un utilisateur
    user = User(
        username="test2@example.com",
        hashed_password="hashed_password",
        first_name="John",
        last_name="Doe",
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = str(user.id)

    # Act: Modifier avec un UUID sans tirets (valide en Python)
    update_data = UserUpdate(
        first_name="Jane",
        last_name="Smith"
    )

    uuid_without_hyphens = user_id.replace("-", "")
    response = client.put(
        f"/api/v1/users/{uuid_without_hyphens}",
        json=update_data.model_dump(exclude_unset=True)
    )

    # Assert: UUID sans tirets doit fonctionner (comportement valide de Python)
    assert response.status_code == 200
    user_response = response.json()
    assert user_response["first_name"] == "Jane"
    assert user_response["last_name"] == "Smith"

    # Vérifier que les modifications ont été appliquées en DB
    db_session.close()
    new_session = Session(bind=db_session.bind)
    updated_user = new_session.query(User).filter(User.id == UUID(user_id)).first()

    assert updated_user.first_name == "Jane"
    assert updated_user.last_name == "Smith"


def test_user_profile_persistence_with_valid_uuid_still_works(db_session: Session, client):
    """Test de validation: UUID valide doit toujours fonctionner."""
    # Arrange: Créer un utilisateur
    user = User(
        username="test3@example.com",
        hashed_password="hashed_password",
        first_name="John",
        last_name="Doe",
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = str(user.id)

    # Act: Modifier avec un UUID valide
    update_data = UserUpdate(
        first_name="Jane",
        last_name="Smith"
    )

    response = client.put(
        f"/api/v1/users/{user_id}",
        json=update_data.model_dump(exclude_unset=True)
    )

    # Assert: UUID valide doit fonctionner
    assert response.status_code == 200
    user_response = response.json()
    assert user_response["first_name"] == "Jane"
    assert user_response["last_name"] == "Smith"

    # Vérifier que les modifications ont été appliquées en DB
    db_session.close()
    new_session = Session(bind=db_session.bind)
    updated_user = new_session.query(User).filter(User.id == UUID(user_id)).first()

    assert updated_user.first_name == "Jane"
    assert updated_user.last_name == "Smith"
