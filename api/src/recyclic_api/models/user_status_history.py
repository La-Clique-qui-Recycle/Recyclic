from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from recyclic_api.core.database import Base

class UserStatusHistory(Base):
    __tablename__ = "user_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    changed_by_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    old_status = Column(Boolean, nullable=True)  # Pour is_active
    new_status = Column(Boolean, nullable=False)  # Pour is_active
    change_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reason = Column(String, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="status_history")
    changed_by_admin = relationship("User", foreign_keys=[changed_by_admin_id])

    def __repr__(self):
        return f"<UserStatusHistory(id={self.id}, user_id={self.user_id}, old_status={self.old_status}, new_status={self.new_status})>"
