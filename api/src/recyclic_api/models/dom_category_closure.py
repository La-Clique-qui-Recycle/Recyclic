from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from recyclic_api.core.database import Base


class DomCategoryClosure(Base):
    __tablename__ = "dom_category_closure"
    __allow_unmapped__ = True

    ancestor_id = Column(PGUUID(as_uuid=True), ForeignKey("dom_category.id"), nullable=False)
    descendant_id = Column(PGUUID(as_uuid=True), ForeignKey("dom_category.id"), nullable=False)
    depth = Column(Integer, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("ancestor_id", "descendant_id", name="pk_dom_category_closure"),
    )

    # Relationships
    ancestor = relationship("DomCategory", foreign_keys=[ancestor_id], back_populates="descendants")
    descendant = relationship("DomCategory", foreign_keys=[descendant_id], back_populates="ancestors")


