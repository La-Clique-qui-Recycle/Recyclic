from sqlalchemy import Column, String, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from recyclic_api.core.database import Base

def get_enum_values(enum_class):
    """Extract values from enum class for SQLAlchemy values_callable"""
    return [member.value for member in enum_class]

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super-admin"
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"
    USER = "user"

class UserStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=False, nullable=True)
    hashed_password = Column(String, nullable=False)
    hashed_pin = Column(String, nullable=True)
    telegram_id = Column(String, unique=False, nullable=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(Enum(UserRole, values_callable=get_enum_values), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus, values_callable=get_enum_values), default=UserStatus.PENDING, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    site_id = Column(UUID(as_uuid=True), nullable=True)  # Foreign key to sites
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    deposits = relationship("Deposit", back_populates="user")
    cash_sessions = relationship("CashSession", back_populates="operator")
    status_history = relationship("UserStatusHistory", foreign_keys="UserStatusHistory.user_id", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, telegram_id={self.telegram_id}, role={self.role}, status={self.status})>"
