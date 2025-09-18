from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from recyclic_api.core.database import Base


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(PG_UUID(as_uuid=True), primary_key=True)
    user_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    username = Column(String, nullable=True, index=True)
    success = Column(Boolean, nullable=False, default=False, index=True)
    client_ip = Column(String, nullable=True)
    error_type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<LoginHistory user_id={self.user_id} username={self.username} success={self.success}>"


