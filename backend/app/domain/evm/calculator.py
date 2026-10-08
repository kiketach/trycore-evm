"""Earned Value Management calculations.

Activity and project results come from the same formulas: a project is evaluated on
the SUM of its activities' BAC, PV, EV and AC, never on the average of their indices,
so each activity weighs in proportion to its money.
"""

from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal

from app.domain.evm.constants import INDEX_QUANTUM, MONEY_QUANTUM, PERCENT_SCALE, ZERO
from app.domain.evm.interpretation import interpret_cpi, interpret_spi
from app.domain.evm.models import ActivityInput, EvmIndicators


def calculate_activity(activity: ActivityInput) -> EvmIndicators:
    return _indicators_from_totals(
        bac=activity.bac,
        pv=planned_value(activity),
        ev=earned_value(activity),
        ac=activity.actual_cost,
    )


def consolidate_project(activities: Iterable[ActivityInput]) -> EvmIndicators:
    """Project indicators from summed totals. A project without activities sums to zero."""
    items = list(activities)
    return _indicators_from_totals(
        bac=sum((a.bac for a in items), ZERO),
        pv=sum((planned_value(a) for a in items), ZERO),
        ev=sum((earned_value(a) for a in items), ZERO),
        ac=sum((a.actual_cost for a in items), ZERO),
    )


def planned_value(activity: ActivityInput) -> Decimal:
    return activity.planned_percent / PERCENT_SCALE * activity.bac


def earned_value(activity: ActivityInput) -> Decimal:
    return activity.actual_percent / PERCENT_SCALE * activity.bac


def _indicators_from_totals(bac: Decimal, pv: Decimal, ev: Decimal, ac: Decimal) -> EvmIndicators:
    cpi = _ratio(ev, ac)
    spi = _ratio(ev, pv)
    eac = _estimate_at_completion(bac, cpi)
    return EvmIndicators(
        bac=_round_money(bac),
        pv=_round_money(pv),
        ev=_round_money(ev),
        ac=_round_money(ac),
        cv=_round_money(ev - ac),
        sv=_round_money(ev - pv),
        cpi=_round_index(cpi),
        spi=_round_index(spi),
        cpi_exact=cpi,
        spi_exact=spi,
        eac=_round_money(eac) if eac is not None else None,
        vac=_round_money(bac - eac) if eac is not None else None,
        # Interpreted on the exact index: rounding is for display only, so a CPI of 0.9996
        # is shown as 1.00 but still reads OVER_BUDGET.
        cost_status=interpret_cpi(cpi),
        schedule_status=interpret_spi(spi),
    )


def _estimate_at_completion(bac: Decimal, cpi: Decimal | None) -> Decimal | None:
    """BAC / CPI, using the unrounded CPI so the forecast carries no rounding error.

    None without cost performance data (CPI undefined) and when nothing has been
    earned yet (CPI = 0): at that rate the work never finishes.
    """
    if cpi is None or cpi == ZERO:
        return None
    return bac / cpi


def _ratio(numerator: Decimal, denominator: Decimal) -> Decimal | None:
    if denominator == ZERO:
        return None
    return numerator / denominator


def _round_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def _round_index(value: Decimal | None) -> Decimal | None:
    return None if value is None else value.quantize(INDEX_QUANTUM, rounding=ROUND_HALF_UP)
