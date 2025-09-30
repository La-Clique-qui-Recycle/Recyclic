from sqlalchemy import Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
import uuid

from recyclic_api.core.database import Base


class TicketDepotStatus(str, enum.Enum):
    OPENED = "opened"
    CLOSED = "closed"


class TicketDepot(Base):
    __tablename__ = "ticket_depot"
    __allow_unmapped__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poste_id = Column(PGUUID(as_uuid=True), ForeignKey("poste_reception.id"), nullable=False)
    benevole_user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(TicketDepotStatus), nullable=False, default=TicketDepotStatus.OPENED)

    # Relationships
    poste = relationship("PosteReception", back_populates="tickets")
    benevole = relationship("User")
    lignes = relationship("LigneDepot", back_populates="ticket", cascade="all, delete-orphan")


