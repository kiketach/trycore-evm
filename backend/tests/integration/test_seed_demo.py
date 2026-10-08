"""The demo project shows exactly the hand-computed numbers quoted in the README."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from scripts.seed_demo import DEMO_PROJECT_NAME, seed_demo

pytestmark = pytest.mark.integration


def demo_projects(client: TestClient) -> list[dict]:
    return [p for p in client.get("/projects").json() if p["name"] == DEMO_PROJECT_NAME]


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


def test_demo_project_covers_every_status_the_video_explains(
    client: TestClient, db_session: Session
) -> None:
    project = seed_demo(db_session)

    activities = {
        a["name"]: a for a in client.get(f"/projects/{project.id}/evm").json()["activities"]
    }

    assert list(activities) == ["Login", "Reportes", "Migración", "Casi en presupuesto"]
    assert (activities["Login"]["cost_status"], activities["Login"]["schedule_status"]) == (
        "UNDER_BUDGET",
        "BEHIND",
    )
    assert (activities["Reportes"]["cost_status"], activities["Reportes"]["schedule_status"]) == (
        "OVER_BUDGET",
        "AHEAD",
    )
    assert activities["Migración"]["cpi"] is None
    assert activities["Migración"]["cost_status"] == "NOT_AVAILABLE"
    boundary = activities["Casi en presupuesto"]
    assert (boundary["cpi"], boundary["cpi_exact"], boundary["cost_status"]) == (
        1.0,
        0.9996,
        "OVER_BUDGET",
    )


def test_running_the_seed_twice_keeps_a_single_demo_project(
    client: TestClient, db_session: Session
) -> None:
    client.post("/projects", json={"name": "Proyecto real"})
    seed_demo(db_session)

    second = seed_demo(db_session)

    assert [p["id"] for p in demo_projects(client)] == [second.id]
    assert any(p["name"] == "Proyecto real" for p in client.get("/projects").json())
    assert len(client.get(f"/projects/{second.id}/activities").json()) == 4
