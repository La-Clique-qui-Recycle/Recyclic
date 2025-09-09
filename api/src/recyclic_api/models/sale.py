from sqlalchemy import Column, String, DateTime, Float, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from recyclic_api.core.database import Base

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE_PAYMENT = "mobile_payment"
    VOUCHER = "voucher"

class Sale(Base):
    __tablename__ = "sales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cash_session_id = Column(UUID(as_uuid=True), ForeignKey("cash_sessions.id"), nullable=False)
    deposit_id = Column(UUID(as_uuid=True), ForeignKey("deposits.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cash_session = relationship("CashSession", back_populates="sales")
    deposit = relationship("Deposit", back_populates="sales")

    def __repr__(self):
        return f"<Sale(id={self.id}, amount={self.amount}, payment={self.payment_method})>"
