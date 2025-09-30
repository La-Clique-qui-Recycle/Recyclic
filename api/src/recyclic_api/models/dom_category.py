from __future__ import annotations

from typing import List, Optional
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

from recyclic_api.core.database import Base


class DomCategory(Base):
    __tablename__ = "dom_category"
    __allow_unmapped__ = True

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(PGUUID(as_uuid=True), ForeignKey("dom_category.id"), nullable=True)
    level = Column(Integer, nullable=False)
    label = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    active = Column(Boolean, nullable=False, default=True)
    l1_root_id = Column(PGUUID(as_uuid=True), ForeignKey("dom_category.id"), nullable=True)

    # Relationships
    parent: Optional["DomCategory"] = relationship(
        "DomCategory", remote_side=[id], backref="children", foreign_keys=[parent_id]
    )
    l1_root: Optional["DomCategory"] = relationship(
        "DomCategory", remote_side=[id], foreign_keys=[l1_root_id]
    )

    # Closure relationships (optional helpers)
    ancestors = relationship(
        "DomCategoryClosure",
        primaryjoin="DomCategory.id==DomCategoryClosure.descendant_id",
        cascade="all, delete-orphan",
        back_populates="descendant",
    )
    descendants = relationship(
        "DomCategoryClosure",
        primaryjoin="DomCategory.id==DomCategoryClosure.ancestor_id",
        cascade="all, delete-orphan",
        back_populates="ancestor",
    )

    def __repr__(self) -> str:
        return f"<DomCategory id={self.id} label={self.label} level={self.level}>"


