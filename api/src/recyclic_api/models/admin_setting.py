from sqlalchemy import Column, String, DateTime, Text, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from recyclic_api.core.database import Base


class AdminSetting(Base):
    """Storages for encrypted administrative configuration values."""

    __tablename__ = "admin_settings"
    __table_args__ = (
        UniqueConstraint("key", "site_id", name="uq_admin_settings_key_site"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), nullable=False)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)
    value_encrypted = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<AdminSetting(key={self.key!r}, site_id={self.site_id})>"
