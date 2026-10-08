from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.core.limits import DECIMAL_PLACES, MONEY_MAX_DIGITS, NAME_MAX_LENGTH, PERCENT_MAX_DIGITS
from app.domain.evm.constants import MAX_PERCENT, MIN_PERCENT, ZERO
from app.schemas.numbers import DecimalAsNumber

ActivityName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=NAME_MAX_LENGTH)
]
Money = Annotated[Decimal, Field(max_digits=MONEY_MAX_DIGITS, decimal_places=DECIMAL_PLACES)]
Percent = Annotated[
    Decimal,
    Field(
        ge=MIN_PERCENT,
        le=MAX_PERCENT,
        max_digits=PERCENT_MAX_DIGITS,
        decimal_places=DECIMAL_PLACES,
    ),
]


class ActivityWrite(BaseModel):
    """Body for creating an activity or replacing all its fields."""

    name: ActivityName = Field(
        description="Activity name. Leading and trailing spaces are removed."
    )
    bac: Annotated[Money, Field(gt=ZERO)] = Field(
        description="Budget at Completion: total planned budget. Greater than zero."
    )
    planned_percent: Percent = Field(
        description="Planned progress at the cut-off date, from 0 to 100."
    )
    actual_percent: Percent = Field(description="Actual progress completed, from 0 to 100.")
    actual_cost: Annotated[Money, Field(ge=ZERO)] = Field(
        description="Actual Cost incurred to date. Zero or more; may exceed the BAC."
    )


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    bac: DecimalAsNumber
    planned_percent: DecimalAsNumber
    actual_percent: DecimalAsNumber
    actual_cost: DecimalAsNumber
    created_at: datetime
    updated_at: datetime
