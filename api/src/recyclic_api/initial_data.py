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
    email = _get_env("FIRST_SUPER_ADMIN_EMAIL")
    password = _get_env("FIRST_SUPER_ADMIN_PASSWORD")

    if not email or not password:
        # Not configured; nothing to do
        logger.info("Super-admin bootstrap not configured (missing env vars). Skipping.")
        return

    # Check if a user with this username (email used as username) already exists
    existing = db.execute(select(User).where(User.username == email)).scalar_one_or_none()
    if existing is not None:
        logger.info("Super-admin already exists. Skipping creation.")
        return

    # Create the super admin user
    new_user = User(
        username=email,
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.SUPER_ADMIN,
        status=UserStatus.ACTIVE,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    logger.info("Super-admin user created from environment configuration: %s", email)


