from decimal import Decimal

import pytest

from app.domain.evm import CostStatus, ScheduleStatus
from app.domain.evm.interpretation import interpret_cpi, interpret_spi


@pytest.mark.parametrize(
    ("cpi", "expected"),
    [
        (Decimal("1.01"), CostStatus.UNDER_BUDGET),
        (Decimal("1.00"), CostStatus.ON_BUDGET),
        (Decimal("0.99"), CostStatus.OVER_BUDGET),
        (Decimal("0.00"), CostStatus.OVER_BUDGET),
        (None, CostStatus.NOT_AVAILABLE),
    ],
)
def test_interpret_cpi(cpi, expected):
    assert interpret_cpi(cpi) is expected


@pytest.mark.parametrize(
    ("spi", "expected"),
    [
        (Decimal("1.01"), ScheduleStatus.AHEAD),
        (Decimal("1.00"), ScheduleStatus.ON_SCHEDULE),
        (Decimal("0.99"), ScheduleStatus.BEHIND),
        (Decimal("0.00"), ScheduleStatus.BEHIND),
        (None, ScheduleStatus.NOT_AVAILABLE),
    ],
)
def test_interpret_spi(spi, expected):
    assert interpret_spi(spi) is expected
