"""
UUID Validation Utilities

Centralized utilities for UUID validation and conversion across the application.
Provides consistent error handling and reusable validation logic.
"""
from fastapi import HTTPException
from uuid import UUID


def validate_and_convert_uuid(uuid_str: str) -> UUID:
    """
    Valide et convertit une chaîne UUID en objet UUID.

    Args:
        uuid_str: Chaîne représentant un UUID (avec ou sans tirets)

    Returns:
        UUID: Objet UUID validé

    Raises:
        HTTPException: Si le format UUID est invalide (400 Bad Request)
    """
    try:
        return UUID(uuid_str)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID format"
        )


def is_valid_uuid(uuid_str: str) -> bool:
    """
    Vérifie si une chaîne représente un UUID valide sans lever d'exception.

    Args:
        uuid_str: Chaîne à valider

    Returns:
        bool: True si le format est valide, False sinon
    """
    try:
        UUID(uuid_str)
        return True
    except ValueError:
        return False
