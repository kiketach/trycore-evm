"""The demo project shows exactly the hand-computed numbers quoted in the README."""

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.schemas.activity import ActivityWrite
from scripts import seed_demo as seed_module
from scripts.seed_demo import DEMO_ACTIVITIES, DEMO_PROJECT_NAME, seed_demo

pytestmark = pytest.mark.integration


def demo_projects(client: TestClient) -> list[dict]:
    return [p for p in client.get("/projects").json() if p["name"] == DEMO_PROJECT_NAME]


def demo_activities(client: TestClient, project_id: int) -> dict[str, dict]:
    evm = client.get(f"/projects/{project_id}/evm").json()
    return {activity["name"]: activity for activity in evm["activities"]}


def test_demo_project_has_the_documented_indicators(
    client: TestClient, db_session: Session
) -> None:
    project = seed_demo(db_session)

    evm = client.get(f"/projects/{project.id}/evm").json()

    assert evm["cutoff_date"] == "2026-10-07"
    summary = evm["summary"]
    assert {k: summary[k] for k in ("bac", "pv", "ev", "ac", "cv", "sv", "eac", "vac")} == {
        "bac": 41000, "pv": 20500, "ev": 24296, "ac": 25200, "cv": -904, "sv": 3796,
        "eac": 42525.52, "vac": -1525.52,
    }  # fmt: skip
    assert (summary["cpi"], summary["cost_status"]) == (0.96, "OVER_BUDGET")
    assert (summary["spi"], summary["schedule_status"]) == (1.19, "AHEAD")
    assert summary["cpi_exact"] == pytest.approx(24296 / 25200)
    assert summary["spi_exact"] == pytest.approx(24296 / 20500)


def test_demo_activities_keep_their_order(client: TestClient, db_session: Session) -> None:
    project = seed_demo(db_session)

    assert list(demo_activities(client, project.id)) == [
        "Login",
        "Reportes",
        "Migración",
        "Casi en presupuesto",
    ]


# Hand-computed per activity: (CPI, CPI exact, SPI, SPI exact, cost status, schedule status).
@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Login", (1.25, 1.25, 0.8, 0.8, "UNDER_BUDGET", "BEHIND")),
        ("Reportes", (0.83, 10000 / 12000, 2.0, 2.0, "OVER_BUDGET", "AHEAD")),
        ("Migración", (None, None, 0.6, 0.6, "NOT_AVAILABLE", "BEHIND")),
        ("Casi en presupuesto", (1.0, 0.9996, 1.0, 0.9996, "OVER_BUDGET", "BEHIND")),
    ],
)
def test_each_demo_activity_has_its_documented_indices(
    client: TestClient, db_session: Session, name: str, expected: tuple
) -> None:
    project = seed_demo(db_session)
    activity = demo_activities(client, project.id)[name]

    cpi, cpi_exact, spi, spi_exact, cost_status, schedule_status = expected
    assert (activity["cpi"], activity["spi"]) == (cpi, spi)
    assert activity["cpi_exact"] == (None if cpi_exact is None else pytest.approx(cpi_exact))
    assert activity["spi_exact"] == pytest.approx(spi_exact)
    assert (activity["cost_status"], activity["schedule_status"]) == (cost_status, schedule_status)


def test_running_the_seed_twice_keeps_a_single_demo_project(
    client: TestClient, db_session: Session
) -> None:
    client.post("/projects", json={"name": "Proyecto real"})
    seed_demo(db_session)

    second = seed_demo(db_session)

    assert [p["id"] for p in demo_projects(client)] == [second.id]
    assert any(p["name"] == "Proyecto real" for p in client.get("/projects").json())
    assert len(client.get(f"/projects/{second.id}/activities").json()) == 4


def test_a_failure_midway_leaves_the_previous_demo_untouched(
    client: TestClient, db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    previous = seed_demo(db_session)
    # Bypasses request validation on purpose so the database CHECK (bac > 0) rejects the
    # second insert, after the old demo was deleted and the new project was created.
    rejected_by_database = ActivityWrite.model_construct(
        name="Rota",
        bac=Decimal(0),
        planned_percent=Decimal(10),
        actual_percent=Decimal(10),
        actual_cost=Decimal(0),
    )
    monkeypatch.setattr(seed_module, "DEMO_ACTIVITIES", [DEMO_ACTIVITIES[0], rejected_by_database])

    with pytest.raises(IntegrityError, match="ck_activities_bac_positive"):
        seed_demo(db_session)

    assert [p["id"] for p in demo_projects(client)] == [previous.id]
    assert list(demo_activities(client, previous.id)) == [
        "Login",
        "Reportes",
        "Migración",
        "Casi en presupuesto",
    ]
