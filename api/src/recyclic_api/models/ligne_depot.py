from sqlalchemy import Column, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import uuid

from recyclic_api.core.database import Base


class LigneDepot(Base):
    __tablename__ = "ligne_depot"
    __allow_unmapped__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(PGUUID(as_uuid=True), ForeignKey("ticket_depot.id"), nullable=False)
    dom_category_id = Column(PGUUID(as_uuid=True), ForeignKey("dom_category.id"), nullable=False)
    poids_kg = Column(Numeric(8, 3), nullable=False)
    destination = Column(String(255), nullable=True)
    notes = Column(String, nullable=True)

    # Relationships
    ticket = relationship("TicketDepot", back_populates="lignes")
    dom_category = relationship("DomCategory")


