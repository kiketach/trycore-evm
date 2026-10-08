from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.domain.evm import CostStatus, ScheduleStatus
from app.schemas.numbers import DecimalAsNumber

NOT_COMPUTABLE = " Null when its formula would divide by zero."


class EvmIndicatorsResponse(BaseModel):
    """Earned Value indicators with their interpretation."""

    model_config = ConfigDict(from_attributes=True)

    bac: DecimalAsNumber = Field(description="Budget at Completion.")
    pv: DecimalAsNumber = Field(description="Planned Value = planned % x BAC.")
    ev: DecimalAsNumber = Field(description="Earned Value = actual % x BAC.")
    ac: DecimalAsNumber = Field(description="Actual Cost.")
    cv: DecimalAsNumber = Field(description="Cost Variance = EV - AC. Negative: overspending.")
    sv: DecimalAsNumber = Field(description="Schedule Variance = EV - PV. Negative: behind.")
    cpi: DecimalAsNumber | None = Field(
        description="Cost Performance Index = EV / AC, two decimals." + NOT_COMPUTABLE
    )
    spi: DecimalAsNumber | None = Field(
        description="Schedule Performance Index = EV / PV, two decimals." + NOT_COMPUTABLE
    )
    eac: DecimalAsNumber | None = Field(
        description=(
            "Estimate at Completion = BAC / CPI. Null without cost performance data "
            "or when CPI is 0."
        )
    )
    vac: DecimalAsNumber | None = Field(
        description="Variance at Completion = BAC - EAC. Null when EAC is null."
    )
    cost_status: CostStatus = Field(
        description=(
            "Interpretation of the exact, unrounded CPI: UNDER_BUDGET (> 1), ON_BUDGET (= 1), "
            "OVER_BUDGET (< 1), NOT_AVAILABLE (CPI null). A CPI shown as 1.00 can therefore "
            "read OVER_BUDGET (exact 0.9996) or UNDER_BUDGET (exact 1.0004)."
        )
    )
    schedule_status: ScheduleStatus = Field(
        description=(
            "Interpretation of the exact, unrounded SPI: AHEAD (> 1), ON_SCHEDULE (= 1), "
            "BEHIND (< 1), NOT_AVAILABLE (SPI null). An SPI shown as 1.00 can therefore read "
            "BEHIND or AHEAD."
        )
    )


class ActivityEvmResponse(EvmIndicatorsResponse):
    activity_id: int
    name: str


class ProjectEvmResponse(BaseModel):
    project_id: int
    project_name: str
    cutoff_date: date | None
    summary: EvmIndicatorsResponse = Field(
        description="Project indicators, computed from the summed BAC, PV, EV and AC."
    )
    activities: list[ActivityEvmResponse]
