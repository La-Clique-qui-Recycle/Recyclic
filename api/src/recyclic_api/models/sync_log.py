from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from recyclic_api.core.database import Base

class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sync_type = Column(String, nullable=False)  # 'export', 'import', 'backup'
    status = Column(String, nullable=False)  # 'success', 'error', 'pending'
    message = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    records_count = Column(Integer, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<SyncLog(id={self.id}, type={self.sync_type}, status={self.status})>"
