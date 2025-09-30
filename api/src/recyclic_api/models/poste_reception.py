from sqlalchemy import Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid

from recyclic_api.core.database import Base


class PosteReceptionStatus(str, enum.Enum):
    OPENED = "opened"
    CLOSED = "closed"


class PosteReception(Base):
    __tablename__ = "poste_reception"
    __allow_unmapped__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opened_by_user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    opened_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(PosteReceptionStatus), nullable=False, default=PosteReceptionStatus.OPENED)

    # Relationships
    opened_by = relationship("User")
    tickets = relationship("TicketDepot", back_populates="poste", cascade="all, delete-orphan")


