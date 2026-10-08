"""GET /projects/{id}/evm against values computed by hand.

Project with three activities:
  Login      BAC 10,000  plan 50 %  done 40 %  AC 3,200  -> PV 5,000  EV 4,000
  Reportes   BAC 20,000  plan 25 %  done 50 %  AC 12,000 -> PV 5,000  EV 10,000
  Migración  BAC 1,000   plan 50 %  done 30 %  AC 0      -> PV 500    EV 300

Sums: BAC 31,000; PV 10,500; EV 14,300; AC 15,200
CV = -900; SV = 3,800
CPI = 14,300 / 15,200 = 0.940789... -> 0.94 (over budget)
SPI = 14,300 / 10,500 = 1.361904... -> 1.36 (ahead)
EAC = 31,000 x 15,200 / 14,300 = 32,951.05; VAC = -1,951.05
"""

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration

INDICATOR_FIELDS = {
    "bac", "pv", "ev", "ac", "cv", "sv", "cpi", "spi", "cpi_exact", "spi_exact", "eac", "vac",
    "cost_status", "schedule_status",
}  # fmt: skip
PROJECT_EVM_FIELDS = {"project_id", "project_name", "cutoff_date", "summary", "activities"}
MISSING_ID = 999_999


def activity(name: str, bac: float, planned: float, actual: float, cost: float) -> dict:
    return {
        "name": name,
        "bac": bac,
        "planned_percent": planned,
        "actual_percent": actual,
        "actual_cost": cost,
    }


ACTIVITIES = [
    activity("Login", 10000, 50, 40, 3200),
    activity("Reportes", 20000, 25, 50, 12000),
    activity("Migración", 1000, 50, 30, 0),
]


def create_project(client: TestClient, activities: list[dict]) -> int:
    response = client.post(
        "/projects", json={"name": "Portal de clientes", "cutoff_date": "2026-10-07"}
    )
    project_id = response.json()["id"]
    for activity in activities:
        assert client.post(f"/projects/{project_id}/activities", json=activity).status_code == 201
    return project_id


def get_evm(client: TestClient, project_id: int) -> dict:
    response = client.get(f"/projects/{project_id}/evm")
    assert response.status_code == 200
    return response.json()


def test_project_summary_comes_from_summed_activity_values(client: TestClient) -> None:
    evm = get_evm(client, create_project(client, ACTIVITIES))

    assert set(evm) == PROJECT_EVM_FIELDS
    assert evm["project_name"] == "Portal de clientes"
    assert evm["cutoff_date"] == "2026-10-07"
    assert evm["summary"] == {
        "bac": 31000,
        "pv": 10500,
        "ev": 14300,
        "ac": 15200,
        "cv": -900,
        "sv": 3800,
        "cpi": 0.94,
        "spi": 1.36,
        "cpi_exact": pytest.approx(14300 / 15200),
        "spi_exact": pytest.approx(14300 / 10500),
        "eac": 32951.05,
        "vac": -1951.05,
        "cost_status": "OVER_BUDGET",
        "schedule_status": "AHEAD",
    }


def test_each_activity_has_its_own_indicators_in_creation_order(client: TestClient) -> None:
    evm = get_evm(client, create_project(client, ACTIVITIES))
    by_name = {activity["name"]: activity for activity in evm["activities"]}

    assert [a["name"] for a in evm["activities"]] == ["Login", "Reportes", "Migración"]
    for activity in evm["activities"]:
        assert set(activity) == INDICATOR_FIELDS | {"activity_id", "name"}
    login = {key: value for key, value in by_name["Login"].items() if key != "activity_id"}
    assert login == {
        "name": "Login",
        "bac": 10000, "pv": 5000, "ev": 4000, "ac": 3200, "cv": 800, "sv": -1000,
        "cpi": 1.25, "spi": 0.8, "cpi_exact": 1.25, "spi_exact": 0.8, "eac": 8000, "vac": 2000,
        "cost_status": "UNDER_BUDGET", "schedule_status": "BEHIND",
    }  # fmt: skip
    assert (by_name["Reportes"]["cpi"], by_name["Reportes"]["spi"]) == (0.83, 2.0)
    assert by_name["Reportes"]["cpi_exact"] == pytest.approx(10000 / 12000)
    assert (by_name["Reportes"]["eac"], by_name["Reportes"]["vac"]) == (24000, -4000)
    assert by_name["Reportes"]["cost_status"] == "OVER_BUDGET"
    assert by_name["Reportes"]["schedule_status"] == "AHEAD"


def test_activity_without_cost_returns_null_indices_not_zero(client: TestClient) -> None:
    evm = get_evm(client, create_project(client, ACTIVITIES))
    migration = next(a for a in evm["activities"] if a["name"] == "Migración")

    assert migration["cv"] == 300
    assert migration["cpi"] is None
    assert migration["cpi_exact"] is None
    assert migration["eac"] is None
    assert migration["vac"] is None
    assert migration["spi"] == 0.6
    assert migration["cost_status"] == "NOT_AVAILABLE"
    assert migration["schedule_status"] == "BEHIND"


def test_project_without_activities_returns_zeros_and_nulls(client: TestClient) -> None:
    evm = get_evm(client, create_project(client, []))

    assert evm["activities"] == []
    assert evm["summary"] == {
        "bac": 0, "pv": 0, "ev": 0, "ac": 0, "cv": 0, "sv": 0,
        "cpi": None, "spi": None, "cpi_exact": None, "spi_exact": None, "eac": None, "vac": None,
        "cost_status": "NOT_AVAILABLE", "schedule_status": "NOT_AVAILABLE",
    }  # fmt: skip


def test_indicators_reflect_an_activity_edit_immediately(client: TestClient) -> None:
    project_id = create_project(client, ACTIVITIES[:1])
    activity_id = get_evm(client, project_id)["activities"][0]["activity_id"]

    edited = ACTIVITIES[0] | {"actual_cost": 5000}
    response = client.put(f"/projects/{project_id}/activities/{activity_id}", json=edited)
    assert response.status_code == 200

    summary = get_evm(client, project_id)["summary"]
    assert (summary["cpi"], summary["cost_status"]) == (0.8, "OVER_BUDGET")
    assert (summary["eac"], summary["vac"]) == (12500, -2500)


@pytest.mark.parametrize(
    ("boundary_activity", "cost_status", "schedule_status"),
    [
        pytest.param(
            activity("Casi en presupuesto", 10000, 100, 99.96, 10000),
            "OVER_BUDGET",
            "BEHIND",
            id="exact-0.9996-shown-1.00",
        ),
        pytest.param(
            activity("Apenas adelantada", 10000, 99.96, 100, 9996),
            "UNDER_BUDGET",
            "AHEAD",
            id="exact-1.0004-shown-1.00",
        ),
    ],
)
def test_status_reads_the_exact_index_while_the_value_is_shown_rounded(
    client: TestClient, boundary_activity: dict, cost_status: str, schedule_status: str
) -> None:
    evm = get_evm(client, create_project(client, [boundary_activity]))

    for indicators in (evm["summary"], evm["activities"][0]):
        assert (indicators["cpi"], indicators["spi"]) == (1.0, 1.0)
        assert indicators["cpi_exact"] != 1.0
        assert indicators["cost_status"] == cost_status
        assert indicators["schedule_status"] == schedule_status


def test_evm_of_missing_project_returns_404(client: TestClient) -> None:
    response = client.get(f"/projects/{MISSING_ID}/evm")

    assert response.status_code == 404
    assert response.json() == {"detail": f"Project {MISSING_ID} not found"}


def test_evm_with_non_positive_project_id_returns_422(client: TestClient) -> None:
    assert client.get("/projects/0/evm").status_code == 422
