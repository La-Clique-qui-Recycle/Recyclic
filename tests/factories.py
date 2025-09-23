from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.core.security import hash_password
import uuid


def UserFactory(**overrides) -> User:
    """Create an unsaved User instance with defaults for tests.
    Caller is responsible for adding to session and committing when needed.
    """
    defaults = {
        "id": uuid.uuid4(),
        "username": f"user_{uuid.uuid4().hex[:8]}",
        "email": None,
        "hashed_password": hash_password("password"),
        "role": UserRole.USER,
        "status": UserStatus.PENDING,
        "is_active": True,
        "telegram_id": "100000000",  # numeric string to allow int() cast
        "first_name": None,
        "last_name": None,
        "site_id": None,
    }
    defaults.update(overrides)
    return User(**defaults)
