import os
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from recyclic_api.core.security import hash_password
from recyclic_api.models.user import User, UserRole, UserStatus


logger = logging.getLogger(__name__)


def _get_env(var_name: str) -> Optional[str]:
    """Read an environment variable and return None if empty."""
    value = os.getenv(var_name)
    if value is None:
        return None
    value = value.strip()
    return value if value else None


def init_super_admin_if_configured(db: Session) -> None:
    """
    Create the first Super Admin user if environment variables are set and the user does not exist yet.

    Idempotent: If user already exists or variables are not set, does nothing.
    """
    username_env = _get_env("FIRST_SUPER_ADMIN_USERNAME")
    password = _get_env("FIRST_SUPER_ADMIN_PASSWORD")

    # Determine username (username is mandatory; no email fallback)
    username = username_env

    if not username or not password:
        # Not configured; nothing to do
        logger.info("Super-admin bootstrap not configured (missing env vars). Skipping.")
        return

    # Check if a user with this username already exists
    existing = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if existing is not None:
        logger.info("Super-admin already exists. Skipping creation.")
        return

    # Create the super admin user
    new_user = User(
        username=username,
        email=None,
        hashed_password=hash_password(password),
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    logger.info("Super-admin user created from environment configuration: %s", username)


