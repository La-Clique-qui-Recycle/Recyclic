import pytest
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from uuid import UUID


class TestUserModel:
    """Tests unitaires pour le modèle User avec les nouveaux champs de profil."""
    
    def test_user_creation_with_profile_fields(self, db_session: Session):
        """Test de création d'un utilisateur avec tous les nouveaux champs de profil."""
        user = User(
            username="test@example.com",
            hashed_password="hashed_password",
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            phone_number="+33123456789",
            address="123 Rue de la Paix, 75001 Paris",
            notes="Bénévole très motivé, disponible le weekend",
            skills="Gestion d'événements, Communication, Logistique",
            availability="Weekends et vacances scolaires",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Vérifier que tous les champs sont correctement sauvegardés
        assert user.phone_number == "+33123456789"
        assert user.address == "123 Rue de la Paix, 75001 Paris"
        assert user.notes == "Bénévole très motivé, disponible le weekend"
        assert user.skills == "Gestion d'événements, Communication, Logistique"
        assert user.availability == "Weekends et vacances scolaires"
        assert user.email == "john.doe@example.com"
    
    def test_user_creation_with_minimal_fields(self, db_session: Session):
        """Test de création d'un utilisateur avec seulement les champs obligatoires."""
        user = User(
            username="minimal@example.com",
            hashed_password="hashed_password",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Vérifier que les nouveaux champs sont null par défaut
        assert user.phone_number is None
        assert user.address is None
        assert user.notes is None
        assert user.skills is None
        assert user.availability is None
        assert user.email is None
    
    def test_user_profile_fields_optional(self, db_session: Session):
        """Test que les nouveaux champs de profil sont optionnels."""
        user = User(
            username="optional@example.com",
            hashed_password="hashed_password",
            first_name="Jane",
            last_name="Smith",
            # Champs de profil partiellement remplis
            phone_number="+33987654321",
            # address, notes, skills, availability laissés vides
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Vérifier que seuls les champs remplis sont présents
        assert user.phone_number == "+33987654321"
        assert user.address is None
        assert user.notes is None
        assert user.skills is None
        assert user.availability is None
    
    def test_user_profile_fields_long_text(self, db_session: Session):
        """Test que les champs texte long (notes, skills, availability) acceptent du contenu long."""
        long_notes = "Notes très détaillées sur l'utilisateur. " * 50  # ~2000 caractères
        long_skills = "Compétences détaillées. " * 50  # ~2000 caractères
        long_availability = "Disponibilités détaillées. " * 50  # ~2000 caractères
        
        user = User(
            username="longtext@example.com",
            hashed_password="hashed_password",
            notes=long_notes,
            skills=long_skills,
            availability=long_availability,
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Vérifier que les textes longs sont correctement sauvegardés
        assert user.notes == long_notes
        assert user.skills == long_skills
        assert user.availability == long_availability
        assert len(user.notes) > 1000
        assert len(user.skills) > 1000
        assert len(user.availability) > 1000
    
    def test_user_profile_fields_update(self, db_session: Session):
        """Test de mise à jour des champs de profil."""
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
        
        # Mise à jour des champs de profil
        user.phone_number = "+33555666777"
        user.address = "456 Avenue des Champs, 75008 Paris"
        user.notes = "Notes mises à jour"
        user.skills = "Nouvelles compétences"
        user.availability = "Nouvelles disponibilités"
        user.email = "updated@example.com"
        
        db_session.commit()
        db_session.refresh(user)
        
        # Vérifier que les mises à jour sont persistées
        assert user.phone_number == "+33555666777"
        assert user.address == "456 Avenue des Champs, 75008 Paris"
        assert user.notes == "Notes mises à jour"
        assert user.skills == "Nouvelles compétences"
        assert user.availability == "Nouvelles disponibilités"
        assert user.email == "updated@example.com"