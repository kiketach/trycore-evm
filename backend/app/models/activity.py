from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.limits import (
    DECIMAL_PLACES,
    MONEY_MAX_DIGITS,
    NAME_MAX_LENGTH,
    PERCENT_MAX_DIGITS,
)
from app.db.base import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(NAME_MAX_LENGTH))
    bac: Mapped[Decimal] = mapped_column(Numeric(MONEY_MAX_DIGITS, DECIMAL_PLACES))
    planned_percent: Mapped[Decimal] = mapped_column(Numeric(PERCENT_MAX_DIGITS, DECIMAL_PLACES))
    actual_percent: Mapped[Decimal] = mapped_column(Numeric(PERCENT_MAX_DIGITS, DECIMAL_PLACES))
    actual_cost: Mapped[Decimal] = mapped_column(Numeric(MONEY_MAX_DIGITS, DECIMAL_PLACES))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
