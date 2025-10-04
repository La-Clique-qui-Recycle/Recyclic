from sqlalchemy import Column, Numeric, String, ForeignKey, DateTime
from sqlalchemy import Enum as SAEnum
import enum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from recyclic_api.core.database import Base


class Destination(str, enum.Enum):
    MAGASIN = "MAGASIN"
    RECYCLAGE = "RECYCLAGE"
    DECHETERIE = "DECHETERIE"


class LigneDepot(Base):
    __tablename__ = "ligne_depot"
    __allow_unmapped__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(PGUUID(as_uuid=True), ForeignKey("ticket_depot.id"), nullable=False)
    category_id = Column(PGUUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    poids_kg = Column(Numeric(8, 3), nullable=False)
    destination = Column(SAEnum(Destination, name="destinationenum"), nullable=False)
    notes = Column(String, nullable=True)

    # Relationships
    ticket = relationship("TicketDepot", back_populates="lignes")
    category = relationship("Category")


