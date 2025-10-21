import pytest
from sqlalchemy.orm import Session
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.schemas.user import UserSelfUpdate, UserUpdate
from uuid import UUID


class TestUserPermissions:
    """Tests de séparation des permissions entre utilisateurs et admins."""
    
    def test_user_self_update_permissions(self, db_session: Session):
        """Test que UserSelfUpdate permet seulement phone_number et address."""
        # Créer un utilisateur
        user = User(
            username="selfupdate@example.com",
            hashed_password="hashed_password",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Test UserSelfUpdate - doit permettre phone_number et address
        self_update_data = UserSelfUpdate(
            phone_number="+33111111111",
            address="123 Rue de la Paix, Paris"
        )
        
        # Vérifier que les champs sont présents dans le schéma
        update_dict = self_update_data.model_dump(exclude_unset=True)
        assert "phone_number" in update_dict
        assert "address" in update_dict
        assert update_dict["phone_number"] == "+33111111111"
        assert update_dict["address"] == "123 Rue de la Paix, Paris"
        
        # Vérifier que les champs admin ne sont PAS dans UserSelfUpdate
        # (Ils ne devraient pas être définis dans le schéma)
        assert not hasattr(self_update_data, 'notes')
        assert not hasattr(self_update_data, 'skills')
        assert not hasattr(self_update_data, 'availability')
    
    def test_admin_user_update_permissions(self, db_session: Session):
        """Test que UserUpdate permet tous les champs pour les admins."""
        # Créer un utilisateur admin
        admin_user = User(
            username="admin@example.com",
            hashed_password="hashed_password",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)
        
        # Test UserUpdate - doit permettre tous les champs
        admin_update_data = UserUpdate(
            phone_number="+33222222222",
            address="456 Avenue des Champs, Paris",
            notes="Notes admin sur l'utilisateur",
            skills="Compétences détaillées",
            availability="Disponibilités spécifiques",
            email="admin.updated@example.com"
        )
        
        # Vérifier que tous les champs sont présents dans le schéma
        update_dict = admin_update_data.model_dump(exclude_unset=True)
        assert "phone_number" in update_dict
        assert "address" in update_dict
        assert "notes" in update_dict
        assert "skills" in update_dict
        assert "availability" in update_dict
        assert "email" in update_dict
        
        # Vérifier les valeurs
        assert update_dict["phone_number"] == "+33222222222"
        assert update_dict["address"] == "456 Avenue des Champs, Paris"
        assert update_dict["notes"] == "Notes admin sur l'utilisateur"
        assert update_dict["skills"] == "Compétences détaillées"
        assert update_dict["availability"] == "Disponibilités spécifiques"
        assert update_dict["email"] == "admin.updated@example.com"
    
    def test_user_self_update_excludes_admin_fields(self, db_session: Session):
        """Test que UserSelfUpdate exclut explicitement les champs admin."""
        # Créer un utilisateur
        user = User(
            username="exclude@example.com",
            hashed_password="hashed_password",
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Tenter de créer un UserSelfUpdate avec des champs admin
        # (Cela devrait échouer car ces champs ne sont pas définis dans le schéma)
        try:
            # Cette ligne devrait échouer car 'notes' n'est pas un champ valide pour UserSelfUpdate
            invalid_self_update = UserSelfUpdate(
                phone_number="+33333333333",
                notes="Tentative d'ajout de notes"  # Ceci devrait échouer
            )
            pytest.fail("UserSelfUpdate ne devrait pas accepter le champ 'notes'")
        except ValueError:
            # C'est le comportement attendu
            pass
    
    def test_schema_field_separation(self):
        """Test de la séparation des champs entre les schémas."""
        # Vérifier que UserSelfUpdate a seulement les champs autorisés
        self_update_fields = set(UserSelfUpdate.model_fields.keys())
        expected_self_fields = {"phone_number", "address"}
        
        # UserSelfUpdate devrait avoir seulement phone_number et address
        assert self_update_fields == expected_self_fields
        
        # Vérifier que UserUpdate a tous les champs
        user_update_fields = set(UserUpdate.model_fields.keys())
        expected_user_fields = {
            "phone_number", "address", "notes", "skills", "availability", "email",
            "first_name", "last_name", "username", "role", "status", "is_active"
        }
        
        # UserUpdate devrait avoir tous les champs
        assert expected_user_fields.issubset(user_update_fields)
    
    def test_user_profile_field_validation(self, db_session: Session):
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
        
        # Test avec des valeurs valides
        valid_self_update = UserSelfUpdate(
            phone_number="+33444444444",
            address="789 Boulevard Saint-Germain, 75006 Paris"
        )
        
        # Vérifier que la validation passe
        assert valid_self_update.phone_number == "+33444444444"
        assert valid_self_update.address == "789 Boulevard Saint-Germain, 75006 Paris"
        
        # Test avec des valeurs vides (devrait être autorisé car nullable)
        empty_self_update = UserSelfUpdate(
            phone_number=None,
            address=None
        )
        
        assert empty_self_update.phone_number is None
        assert empty_self_update.address is None


