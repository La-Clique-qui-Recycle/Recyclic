import pytest
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.schemas.user import UserUpdate, UserSelfUpdate
from uuid import UUID


class TestUserProfileEndpoints:
    """Tests d'intégration pour les endpoints utilisateur avec les nouveaux champs de profil."""
    
    def test_get_user_with_profile_fields(self, db_session: Session, client):
        """Test GET /users/{id} avec les nouveaux champs de profil."""
        # Créer un utilisateur avec tous les champs de profil
        user = User(
            username="profile@example.com",
            hashed_password="hashed_password",
            email="profile@example.com",
            first_name="Profile",
            last_name="User",
            phone_number="+33555555555",
            address="123 Rue du Profil, 75001 Paris",
            notes="Notes de profil utilisateur",
            skills="Compétences du profil",
            availability="Disponibilités du profil",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        user_id = str(user.id)
        
        # Test GET /users/{id}
        response = client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == 200
        
        user_data = response.json()
        
        # Vérifier que tous les nouveaux champs sont présents
        assert user_data["phone_number"] == "+33555555555"
        assert user_data["address"] == "123 Rue du Profil, 75001 Paris"
        assert user_data["notes"] == "Notes de profil utilisateur"
        assert user_data["skills"] == "Compétences du profil"
        assert user_data["availability"] == "Disponibilités du profil"
        assert user_data["email"] == "profile@example.com"
    
    def test_put_user_with_profile_fields(self, db_session: Session, client):
        """Test PUT /users/{id} avec mise à jour des nouveaux champs de profil."""
        # Créer un utilisateur
        user = User(
            username="update@example.com",
            hashed_password="hashed_password",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        user_id = str(user.id)
        
        # Données de mise à jour avec tous les nouveaux champs
        update_data = {
            "phone_number": "+33666666666",
            "address": "456 Avenue de la Mise à Jour, 75008 Paris",
            "notes": "Notes mises à jour",
            "skills": "Nouvelles compétences",
            "availability": "Nouvelles disponibilités",
            "email": "updated@example.com",
            "first_name": "Updated",
            "last_name": "User"
        }
        
        # Test PUT /users/{id}
        response = client.put(f"/api/v1/users/{user_id}", json=update_data)
        assert response.status_code == 200
        
        updated_user = response.json()
        
        # Vérifier que tous les champs ont été mis à jour
        assert updated_user["phone_number"] == "+33666666666"
        assert updated_user["address"] == "456 Avenue de la Mise à Jour, 75008 Paris"
        assert updated_user["notes"] == "Notes mises à jour"
        assert updated_user["skills"] == "Nouvelles compétences"
        assert updated_user["availability"] == "Nouvelles disponibilités"
        assert updated_user["email"] == "updated@example.com"
        assert updated_user["first_name"] == "Updated"
        assert updated_user["last_name"] == "User"
    
    def test_put_user_partial_update(self, db_session: Session, client):
        """Test PUT /users/{id} avec mise à jour partielle des champs de profil."""
        # Créer un utilisateur avec des données initiales
        user = User(
            username="partial@example.com",
            hashed_password="hashed_password",
            phone_number="+33777777777",
            address="789 Rue Initiale, 75001 Paris",
            notes="Notes initiales",
            skills="Compétences initiales",
            availability="Disponibilités initiales",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        user_id = str(user.id)
        
        # Mise à jour partielle - seulement phone_number et notes
        partial_update = {
            "phone_number": "+33888888888",
            "notes": "Notes mises à jour partiellement"
        }
        
        # Test PUT /users/{id}
        response = client.put(f"/api/v1/users/{user_id}", json=partial_update)
        assert response.status_code == 200
        
        updated_user = response.json()
        
        # Vérifier que seuls les champs spécifiés ont été mis à jour
        assert updated_user["phone_number"] == "+33888888888"
        assert updated_user["notes"] == "Notes mises à jour partiellement"
        
        # Vérifier que les autres champs n'ont pas changé
        assert updated_user["address"] == "789 Rue Initiale, 75001 Paris"
        assert updated_user["skills"] == "Compétences initiales"
        assert updated_user["availability"] == "Disponibilités initiales"
    
    def test_put_user_clear_profile_fields(self, db_session: Session, client):
        """Test PUT /users/{id} pour vider les champs de profil."""
        # Créer un utilisateur avec des données
        user = User(
            username="clear@example.com",
            hashed_password="hashed_password",
            phone_number="+33999999999",
            address="999 Rue à Vider, 75001 Paris",
            notes="Notes à vider",
            skills="Compétences à vider",
            availability="Disponibilités à vider",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        user_id = str(user.id)
        
        # Vider les champs de profil
        clear_data = {
            "phone_number": None,
            "address": None,
            "notes": None,
            "skills": None,
            "availability": None
        }
        
        # Test PUT /users/{id}
        response = client.put(f"/api/v1/users/{user_id}", json=clear_data)
        assert response.status_code == 200
        
        updated_user = response.json()
        
        # Vérifier que tous les champs sont vides
        assert updated_user["phone_number"] is None
        assert updated_user["address"] is None
        assert updated_user["notes"] is None
        assert updated_user["skills"] is None
        assert updated_user["availability"] is None
    
    def test_user_profile_fields_validation(self, db_session: Session, client):
        """Test de validation des champs de profil utilisateur."""
        user = User(
            username="validation@example.com",
            hashed_password="hashed_password",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        user_id = str(user.id)
        
        # Test avec des données valides
        valid_data = {
            "phone_number": "+33123456789",
            "address": "123 Rue Valide, 75001 Paris",
            "notes": "Notes valides",
            "skills": "Compétences valides",
            "availability": "Disponibilités valides"
        }
        
        response = client.put(f"/api/v1/users/{user_id}", json=valid_data)
        assert response.status_code == 200
        
        # Test avec des chaînes vides (devrait être autorisé)
        empty_string_data = {
            "phone_number": "",
            "address": "",
            "notes": "",
            "skills": "",
            "availability": ""
        }
        
        response = client.put(f"/api/v1/users/{user_id}", json=empty_string_data)
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["phone_number"] == ""
        assert updated_user["address"] == ""
        assert updated_user["notes"] == ""
        assert updated_user["skills"] == ""
        assert updated_user["availability"] == ""


