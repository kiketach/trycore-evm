from dataclasses import dataclass
from decimal import Decimal

from app.domain.evm.constants import MAX_PERCENT, MIN_PERCENT, ZERO
from app.domain.evm.interpretation import CostStatus, ScheduleStatus


@dataclass(frozen=True)
class ActivityInput:
    """The four figures a project leader records for one activity."""

    bac: Decimal
    planned_percent: Decimal
    actual_percent: Decimal
    actual_cost: Decimal

    def __post_init__(self) -> None:
        if self.bac <= ZERO:
            raise ValueError("bac must be greater than zero")
        for field_name in ("planned_percent", "actual_percent"):
            if not MIN_PERCENT <= getattr(self, field_name) <= MAX_PERCENT:
                raise ValueError(f"{field_name} must be between {MIN_PERCENT} and {MAX_PERCENT}")
        if self.actual_cost < ZERO:
            raise ValueError("actual_cost must not be negative")


@dataclass(frozen=True)
class EvmIndicators:
    """EVM result for one activity or a whole project.

    An index or forecast is None when its formula would divide by zero: the data
    does not support a number, and inventing one (0 or infinity) would mislead.
    """

    bac: Decimal
    pv: Decimal
    ev: Decimal
    ac: Decimal
    cv: Decimal
    sv: Decimal
    cpi: Decimal | None
    spi: Decimal | None
    # Unrounded indices: the statuses are read from these (D-06), and the UI shows them on demand.
    cpi_exact: Decimal | None
    spi_exact: Decimal | None
    eac: Decimal | None
    vac: Decimal | None
    cost_status: CostStatus
    schedule_status: ScheduleStatus
