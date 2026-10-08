"""EVM calculations, checked against values computed by hand.

Every expected number below was worked out on paper before the code existed; the
docstring of each case shows the arithmetic so a reader can re-check it.
"""

from decimal import Decimal

import pytest

from app.domain.evm import (
    ActivityInput,
    CostStatus,
    ScheduleStatus,
    calculate_activity,
    consolidate_project,
)


def activity(bac: str, planned: str, actual: str, cost: str) -> ActivityInput:
    return ActivityInput(
        bac=Decimal(bac),
        planned_percent=Decimal(planned),
        actual_percent=Decimal(actual),
        actual_cost=Decimal(cost),
    )


def test_activity_under_budget_and_behind_schedule():
    """BAC 10,000; plan 50 %; done 40 %; AC 3,200.

    PV = 0.50 x 10,000 = 5,000    EV = 0.40 x 10,000 = 4,000
    CV = 4,000 - 3,200 = 800      SV = 4,000 - 5,000 = -1,000
    CPI = 4,000 / 3,200 = 1.25    SPI = 4,000 / 5,000 = 0.80
    EAC = 10,000 / 1.25 = 8,000   VAC = 10,000 - 8,000 = 2,000
    """
    result = calculate_activity(activity("10000", "50", "40", "3200"))

    assert result.pv == Decimal("5000.00")
    assert result.ev == Decimal("4000.00")
    assert result.ac == Decimal("3200.00")
    assert result.cv == Decimal("800.00")
    assert result.sv == Decimal("-1000.00")
    assert result.cpi == Decimal("1.25")
    assert result.spi == Decimal("0.80")
    assert result.eac == Decimal("8000.00")
    assert result.vac == Decimal("2000.00")
    assert result.cost_status is CostStatus.UNDER_BUDGET
    assert result.schedule_status is ScheduleStatus.BEHIND


def test_activity_over_budget_and_ahead_of_schedule():
    """BAC 20,000; plan 25 %; done 50 %; AC 12,000.

    PV = 5,000; EV = 10,000; CV = -2,000; SV = 5,000
    CPI = 10,000 / 12,000 = 0.8333 -> 0.83; SPI = 10,000 / 5,000 = 2.00
    EAC = 20,000 / 0.8333... = 24,000 (unrounded CPI; 20,000 / 0.83 would give 24,096.39)
    VAC = 20,000 - 24,000 = -4,000
    """
    result = calculate_activity(activity("20000", "25", "50", "12000"))

    assert result.pv == Decimal("5000.00")
    assert result.ev == Decimal("10000.00")
    assert result.cv == Decimal("-2000.00")
    assert result.sv == Decimal("5000.00")
    assert result.cpi == Decimal("0.83")
    assert result.spi == Decimal("2.00")
    assert result.eac == Decimal("24000.00")
    assert result.vac == Decimal("-4000.00")
    assert result.cost_status is CostStatus.OVER_BUDGET
    assert result.schedule_status is ScheduleStatus.AHEAD


def test_activity_with_progress_but_no_recorded_cost_has_no_cpi():
    """AC = 0 and EV > 0: EV / 0 is undefined, so CPI, EAC and VAC are None.

    PV = 500; EV = 300; CV = 300 - 0 = 300; SV = -200; SPI = 300 / 500 = 0.60
    """
    result = calculate_activity(activity("1000", "50", "30", "0"))

    assert result.cv == Decimal("300.00")
    assert result.sv == Decimal("-200.00")
    assert result.cpi is None
    assert result.spi == Decimal("0.60")
    assert result.eac is None
    assert result.vac is None
    assert result.cost_status is CostStatus.NOT_AVAILABLE
    assert result.schedule_status is ScheduleStatus.BEHIND


def test_activity_not_started_has_no_cost_performance_yet():
    """AC = 0 and EV = 0 with 20 % planned: no cost data, but clearly behind.

    PV = 200; EV = 0; CV = 0; SV = -200; SPI = 0 / 200 = 0.00
    EAC stays None: without performance data the formula assumes nothing.
    """
    result = calculate_activity(activity("1000", "20", "0", "0"))

    assert result.cv == Decimal("0.00")
    assert result.sv == Decimal("-200.00")
    assert result.cpi is None
    assert result.spi == Decimal("0.00")
    assert result.eac is None
    assert result.vac is None
    assert result.cost_status is CostStatus.NOT_AVAILABLE
    assert result.schedule_status is ScheduleStatus.BEHIND


def test_activity_with_nothing_planned_yet_has_no_spi():
    """PV = 0 (plan 0 %) but 10 % already done: SPI undefined, SV still shows the lead.

    EV = 100; SV = 100 - 0 = 100; CPI = 100 / 50 = 2.00
    EAC = 1,000 / 2 = 500; VAC = 500
    """
    result = calculate_activity(activity("1000", "0", "10", "50"))

    assert result.pv == Decimal("0.00")
    assert result.sv == Decimal("100.00")
    assert result.spi is None
    assert result.cpi == Decimal("2.00")
    assert result.eac == Decimal("500.00")
    assert result.vac == Decimal("500.00")
    assert result.schedule_status is ScheduleStatus.NOT_AVAILABLE


def test_activity_with_cost_and_no_progress_has_cpi_zero_not_none():
    """EV = 0 and AC = 250: CPI = 0 is a real value (money spent, nothing earned).

    CV = -250; CPI = 0 / 250 = 0.00 -> over budget, not "not available"
    EAC = 1,000 / 0 would be infinite: None; VAC follows EAC.
    """
    result = calculate_activity(activity("1000", "30", "0", "250"))

    assert result.cv == Decimal("-250.00")
    assert result.cpi == Decimal("0.00")
    assert result.spi == Decimal("0.00")
    assert result.eac is None
    assert result.vac is None
    assert result.cost_status is CostStatus.OVER_BUDGET
    assert result.schedule_status is ScheduleStatus.BEHIND


def test_project_without_activities_sums_to_zero_with_no_indices():
    result = consolidate_project([])

    assert (result.bac, result.pv, result.ev, result.ac) == (Decimal("0.00"),) * 4
    assert (result.cv, result.sv) == (Decimal("0.00"), Decimal("0.00"))
    assert (result.cpi, result.spi, result.eac, result.vac) == (None, None, None, None)
    assert result.cost_status is CostStatus.NOT_AVAILABLE
    assert result.schedule_status is ScheduleStatus.NOT_AVAILABLE


def test_project_indices_come_from_sums_not_from_averaging_activity_indices():
    """Small activity A: CPI 2.00. Large activity B: CPI 0.50. Their average is 1.25.

    Sums: BAC 101,000; PV 51,000; EV 51,000; AC 100,500
    CPI = 51,000 / 100,500 = 0.5075 -> 0.51: the project is OVER budget, not under.
    EAC = 101,000 x 100,500 / 51,000 = 199,029.41; VAC = -98,029.41
    """
    small = activity("1000", "100", "100", "500")
    large = activity("100000", "50", "50", "100000")

    assert calculate_activity(small).cpi == Decimal("2.00")
    assert calculate_activity(large).cpi == Decimal("0.50")

    project = consolidate_project([small, large])

    assert project.bac == Decimal("101000.00")
    assert project.pv == Decimal("51000.00")
    assert project.ev == Decimal("51000.00")
    assert project.ac == Decimal("100500.00")
    assert project.cv == Decimal("-49500.00")
    assert project.sv == Decimal("0.00")
    assert project.cpi == Decimal("0.51")
    assert project.spi == Decimal("1.00")
    assert project.eac == Decimal("199029.41")
    assert project.vac == Decimal("-98029.41")
    assert project.cost_status is CostStatus.OVER_BUDGET
    assert project.schedule_status is ScheduleStatus.ON_SCHEDULE


def test_project_cpi_exists_even_when_one_activity_has_no_cost():
    """A has AC = 0 (CPI None); B has AC 400. Sums: EV 1,000; AC 400.

    CPI = 2.50; EAC = 2,000 / 2.5 = 800; VAC = 1,200
    """
    no_cost = activity("1000", "50", "50", "0")
    with_cost = activity("1000", "50", "50", "400")

    project = consolidate_project([no_cost, with_cost])

    assert calculate_activity(no_cost).cpi is None
    assert project.cpi == Decimal("2.50")
    assert project.eac == Decimal("800.00")
    assert project.vac == Decimal("1200.00")
    assert project.cost_status is CostStatus.UNDER_BUDGET


@pytest.mark.parametrize(
    ("progress", "expected"),
    [
        pytest.param(
            ("100", "99.96", "10000"),
            (CostStatus.OVER_BUDGET, ScheduleStatus.BEHIND, "10004.00", "-4.00"),
            id="just-below-1",
        ),
        pytest.param(
            ("99.96", "100", "9996"),
            (CostStatus.UNDER_BUDGET, ScheduleStatus.AHEAD, "9996.00", "4.00"),
            id="just-above-1",
        ),
        pytest.param(
            ("50", "50", "5000"),
            (CostStatus.ON_BUDGET, ScheduleStatus.ON_SCHEDULE, "10000.00", "0.00"),
            id="exactly-1",
        ),
    ],
)
def test_status_is_interpreted_on_the_exact_index_not_the_rounded_one(progress, expected):
    """All three show CPI and SPI as 1.00; the status reads the exact value behind it.

    progress = (planned %, actual %, AC) on BAC 10,000
    just-below-1:  EV 9,996 / AC 10,000 = 0.9996 (CPI and SPI)  -> over budget, behind
    just-above-1:  EV 10,000 / AC 9,996 = 1.0004; EV / PV 9,996 -> under budget, ahead
    exactly-1:     EV = PV = AC = 5,000                        -> on budget, on schedule
    EAC uses the exact CPI too: 10,000 / 0.9996 = 10,004.00; 10,000 / 1.0004 = 9,996.00
    """
    planned, actual, cost = progress
    cost_status, schedule_status, eac, vac = expected

    result = calculate_activity(activity("10000", planned, actual, cost))

    assert (result.cpi, result.spi) == (Decimal("1.00"), Decimal("1.00"))
    assert result.cost_status is cost_status
    assert result.schedule_status is schedule_status
    assert (result.eac, result.vac) == (Decimal(eac), Decimal(vac))


def test_indices_round_half_up():
    """EV 985 and AC 1,000: CPI 0.985 rounds half up to 0.99 (banker's rounding gives 0.98)."""
    result = calculate_activity(activity("1000", "98.5", "98.5", "1000"))

    assert result.cpi == Decimal("0.99")


@pytest.mark.parametrize(
    ("bac", "planned", "actual", "cost", "message"),
    [
        ("0", "10", "10", "0", "bac must be greater than zero"),
        ("-1", "10", "10", "0", "bac must be greater than zero"),
        ("100", "-1", "10", "0", "planned_percent must be between 0 and 100"),
        ("100", "10", "100.01", "0", "actual_percent must be between 0 and 100"),
        ("100", "10", "10", "-0.01", "actual_cost must not be negative"),
    ],
)
def test_invalid_activity_input_is_rejected(bac, planned, actual, cost, message):
    with pytest.raises(ValueError, match=message):
        activity(bac, planned, actual, cost)


def test_percentage_bounds_and_cost_overrun_are_valid_input():
    """0 % and 100 % are valid, and AC may exceed BAC: overruns are real."""
    result = calculate_activity(activity("1000", "0", "100", "1500"))

    assert result.ev == Decimal("1000.00")
    assert result.cpi == Decimal("0.67")
    assert result.cost_status is CostStatus.OVER_BUDGET
