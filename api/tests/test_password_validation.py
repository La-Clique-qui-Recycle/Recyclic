"""
Tests for password validation functionality
Story auth.B - Backend CLI adaptation QA fixes
"""

import pytest
from recyclic_api.core.security import validate_password_strength


class TestPasswordValidation:
    """Tests for password strength validation"""

    def test_validate_password_strength_valid_password(self):
        """Test validation with a valid strong password"""
        password = "StrongPass123!"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_password_strength_too_short(self):
        """Test validation with password too short"""
        password = "Short1!"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert "Password must be at least 8 characters long" in errors

    def test_validate_password_strength_no_uppercase(self):
        """Test validation with password missing uppercase letter"""
        password = "lowercase123!"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert "Password must contain at least one uppercase letter" in errors

    def test_validate_password_strength_no_lowercase(self):
        """Test validation with password missing lowercase letter"""
        password = "UPPERCASE123!"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert "Password must contain at least one lowercase letter" in errors

    def test_validate_password_strength_no_digit(self):
        """Test validation with password missing digit"""
        password = "NoDigitsHere!"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert "Password must contain at least one digit" in errors

    def test_validate_password_strength_no_special_char(self):
        """Test validation with password missing special character"""
        password = "NoSpecial123"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert "Password must contain at least one special character" in errors

    def test_validate_password_strength_multiple_errors(self):
        """Test validation with multiple errors"""
        password = "weak"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert len(errors) == 4  # Missing: length, uppercase, digit, special char
        assert "Password must be at least 8 characters long" in errors
        assert "Password must contain at least one uppercase letter" in errors
        assert "Password must contain at least one digit" in errors
        assert "Password must contain at least one special character" in errors

    def test_validate_password_strength_edge_case_exactly_8_chars(self):
        """Test validation with password exactly 8 characters"""
        password = "Test123!"
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is True
        assert len(errors) == 0

    def test_validate_password_strength_all_special_chars(self):
        """Test validation with various special characters"""
        special_chars = "!@#$%^&*(),.?\":{}|<>"
        for char in special_chars:
            password = f"Test123{char}"
            is_valid, errors = validate_password_strength(password)
            assert is_valid is True, f"Failed for special char: {char}"
            assert len(errors) == 0

    def test_validate_password_strength_empty_password(self):
        """Test validation with empty password"""
        password = ""
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert len(errors) == 5  # All requirements missing

    def test_validate_password_strength_whitespace_only(self):
        """Test validation with whitespace-only password"""
        password = "   \t\n  "
        is_valid, errors = validate_password_strength(password)
        
        assert is_valid is False
        assert "Password must be at least 8 characters long" in errors
