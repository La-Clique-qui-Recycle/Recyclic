import pytest
from fastapi import HTTPException
from recyclic_api.core.uuid_validation import validate_and_convert_uuid, is_valid_uuid


class TestUUIDValidation:
    """Tests pour les utilitaires de validation UUID."""

    def test_validate_and_convert_uuid_valid_with_hyphens(self):
        """Test UUID valide avec tirets."""
        uuid_str = "123e4567-e89b-12d3-a456-426614174000"
        result = validate_and_convert_uuid(uuid_str)
        assert str(result) == uuid_str

    def test_validate_and_convert_uuid_valid_without_hyphens(self):
        """Test UUID valide sans tirets."""
        uuid_str = "123e4567e89b12d3a456426614174000"
        result = validate_and_convert_uuid(uuid_str)
        assert str(result) == "123e4567-e89b-12d3-a456-426614174000"  # Python normalise automatiquement

    def test_validate_and_convert_uuid_invalid_format(self):
        """Test UUID invalide."""
        uuid_str = "invalid-uuid"
        with pytest.raises(HTTPException) as exc_info:
            validate_and_convert_uuid(uuid_str)
        assert exc_info.value.status_code == 400
        assert "Invalid UUID format" in str(exc_info.value.detail)

    def test_validate_and_convert_uuid_empty_string(self):
        """Test chaîne vide."""
        with pytest.raises(HTTPException) as exc_info:
            validate_and_convert_uuid("")
        assert exc_info.value.status_code == 400

    def test_is_valid_uuid_valid_cases(self):
        """Test is_valid_uuid avec UUID valides."""
        assert is_valid_uuid("123e4567-e89b-12d3-a456-426614174000") is True
        assert is_valid_uuid("123e4567e89b12d3a456426614174000") is True

    def test_is_valid_uuid_invalid_cases(self):
        """Test is_valid_uuid avec UUID invalides."""
        assert is_valid_uuid("invalid-uuid") is False
        assert is_valid_uuid("") is False
        assert is_valid_uuid("not-a-uuid-at-all") is False

    def test_roundtrip_conversion(self):
        """Test conversion aller-retour."""
        original = "123e4567-e89b-12d3-a456-426614174000"
        uuid_obj = validate_and_convert_uuid(original)
        back_to_str = str(uuid_obj)
        assert back_to_str == original
