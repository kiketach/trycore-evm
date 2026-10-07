from decimal import Decimal
from enum import StrEnum

from app.domain.evm.constants import PERFORMANCE_BASELINE


class CostStatus(StrEnum):
    UNDER_BUDGET = "UNDER_BUDGET"
    ON_BUDGET = "ON_BUDGET"
    OVER_BUDGET = "OVER_BUDGET"
    NOT_AVAILABLE = "NOT_AVAILABLE"


class ScheduleStatus(StrEnum):
    AHEAD = "AHEAD"
    ON_SCHEDULE = "ON_SCHEDULE"
    BEHIND = "BEHIND"
    NOT_AVAILABLE = "NOT_AVAILABLE"


def interpret_cpi(cpi: Decimal | None) -> CostStatus:
    """CPI > 1: each unit spent earns more than one unit of value; < 1: overspending."""
    if cpi is None:
        return CostStatus.NOT_AVAILABLE
    if cpi > PERFORMANCE_BASELINE:
        return CostStatus.UNDER_BUDGET
    if cpi < PERFORMANCE_BASELINE:
        return CostStatus.OVER_BUDGET
    return CostStatus.ON_BUDGET


def interpret_spi(spi: Decimal | None) -> ScheduleStatus:
    """SPI > 1: more work done than planned to date; < 1: behind the plan."""
    if spi is None:
        return ScheduleStatus.NOT_AVAILABLE
    if spi > PERFORMANCE_BASELINE:
        return ScheduleStatus.AHEAD
    if spi < PERFORMANCE_BASELINE:
        return ScheduleStatus.BEHIND
    return ScheduleStatus.ON_SCHEDULE
