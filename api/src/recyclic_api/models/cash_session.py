from sqlalchemy import Column, String, DateTime, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from recyclic_api.core.database import Base

class SessionStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    PAUSED = "paused"

class CashSession(Base):
    __tablename__ = "cash_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.OPEN, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="cash_sessions")
    site = relationship("Site", back_populates="cash_sessions")
    sales = relationship("Sale", back_populates="cash_session")

    def __repr__(self):
        return f"<CashSession(id={self.id}, status={self.status}, total={self.total_amount})>"
