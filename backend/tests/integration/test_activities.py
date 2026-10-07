from datetime import datetime

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration

ACTIVITY_FIELDS = {
    "id",
    "project_id",
    "name",
    "bac",
    "planned_percent",
    "actual_percent",
    "actual_cost",
    "created_at",
    "updated_at",
}
NUMERIC_FIELDS = ("bac", "planned_percent", "actual_percent", "actual_cost")
MISSING_ID = 999_999
VALID_ACTIVITY = {
    "name": "Diseño de base de datos",
    "bac": 10000,
    "planned_percent": 50,
    "actual_percent": 40,
    "actual_cost": 3200,
}


# Each invalid value paired with the one field the API must report as rejected.
INVALID_VALUES = [
    ({"bac": 0}, "bac"),
    ({"bac": -100}, "bac"),
    ({"bac": 10.005}, "bac"),
    ({"bac": 1_000_000_000_000}, "bac"),
    ({"planned_percent": -1}, "planned_percent"),
    ({"planned_percent": 100.01}, "planned_percent"),
    ({"actual_percent": 101}, "actual_percent"),
    ({"actual_cost": -0.01}, "actual_cost"),
    ({"name": "  "}, "name"),
    ({"bac": "mil"}, "bac"),
]
# NUMERIC(14, 2) upper bound: the largest money value the API must still accept.
MAX_MONEY = 999_999_999_999.99


@pytest.fixture
def project_id(client: TestClient) -> int:
    response = client.post("/projects", json={"name": "Portal de clientes"})
    assert response.status_code == 201
    return response.json()["id"]


def activities_url(project: int) -> str:
    return f"/projects/{project}/activities"


def create_activity(client: TestClient, project: int, **overrides) -> dict:
    response = client.post(activities_url(project), json=VALID_ACTIVITY | overrides)
    assert response.status_code == 201
    return response.json()


def assert_activity_contract(activity: dict) -> None:
    assert set(activity) == ACTIVITY_FIELDS
    for field in NUMERIC_FIELDS:
        assert isinstance(activity[field], int | float), f"{field} must be a JSON number"
    datetime.fromisoformat(activity["created_at"])
    datetime.fromisoformat(activity["updated_at"])


def test_create_activity_returns_201_with_numbers_not_strings(
    client: TestClient, project_id: int
) -> None:
    activity = create_activity(client, project_id, name="  Diseño  ", bac=10000.5)

    assert_activity_contract(activity)
    assert activity["project_id"] == project_id
    assert activity["name"] == "Diseño"
    assert activity["bac"] == 10000.5
    assert activity["planned_percent"] == 50
    assert activity["actual_percent"] == 40
    assert activity["actual_cost"] == 3200


def test_create_activity_accepts_boundaries_and_cost_overrun(
    client: TestClient, project_id: int
) -> None:
    activity = create_activity(
        client, project_id, planned_percent=0, actual_percent=100, actual_cost=15000
    )

    assert activity["planned_percent"] == 0
    assert activity["actual_percent"] == 100
    assert activity["actual_cost"] == 15000


def test_create_activity_accepts_the_largest_money_value(
    client: TestClient, project_id: int
) -> None:
    activity = create_activity(client, project_id, bac=MAX_MONEY, actual_cost=MAX_MONEY)

    assert activity["bac"] == MAX_MONEY
    assert activity["actual_cost"] == MAX_MONEY
    stored = client.get(f"{activities_url(project_id)}/{activity['id']}").json()
    assert (stored["bac"], stored["actual_cost"]) == (MAX_MONEY, MAX_MONEY)


@pytest.mark.parametrize(("overrides", "field"), INVALID_VALUES)
def test_create_activity_rejects_invalid_values_with_422(
    client: TestClient, project_id: int, overrides: dict, field: str
) -> None:
    response = client.post(activities_url(project_id), json=VALID_ACTIVITY | overrides)

    assert response.status_code == 422
    assert [error["loc"][-1] for error in response.json()["detail"]] == [field]


def test_create_activity_rejects_missing_fields_with_422(
    client: TestClient, project_id: int
) -> None:
    response = client.post(activities_url(project_id), json={"name": "Incompleta"})

    assert response.status_code == 422
    missing = {error["loc"][-1] for error in response.json()["detail"]}
    assert missing == {"bac", "planned_percent", "actual_percent", "actual_cost"}


def test_create_activity_in_missing_project_returns_404(client: TestClient) -> None:
    response = client.post(activities_url(MISSING_ID), json=VALID_ACTIVITY)

    assert response.status_code == 404
    assert response.json() == {"detail": f"Project {MISSING_ID} not found"}


def test_list_activities_returns_only_the_projects_activities_in_id_order(
    client: TestClient, project_id: int
) -> None:
    first = create_activity(client, project_id, name="Primera")
    second = create_activity(client, project_id, name="Segunda")
    other_project = client.post("/projects", json={"name": "Otro"}).json()["id"]
    create_activity(client, other_project, name="Ajena")

    response = client.get(activities_url(project_id))

    assert response.status_code == 200
    assert [a["id"] for a in response.json()] == [first["id"], second["id"]]
    for activity in response.json():
        assert_activity_contract(activity)


def test_list_activities_of_project_without_activities_is_empty(
    client: TestClient, project_id: int
) -> None:
    response = client.get(activities_url(project_id))

    assert response.status_code == 200
    assert response.json() == []


def test_list_activities_of_missing_project_returns_404(client: TestClient) -> None:
    response = client.get(activities_url(MISSING_ID))

    assert response.status_code == 404
    assert response.json() == {"detail": f"Project {MISSING_ID} not found"}


def test_get_activity_returns_it(client: TestClient, project_id: int) -> None:
    created = create_activity(client, project_id)

    response = client.get(f"{activities_url(project_id)}/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_get_missing_activity_returns_404(client: TestClient, project_id: int) -> None:
    response = client.get(f"{activities_url(project_id)}/{MISSING_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": f"Activity {MISSING_ID} not found"}


def test_activity_of_another_project_is_not_reachable(client: TestClient, project_id: int) -> None:
    other_project = client.post("/projects", json={"name": "Otro"}).json()["id"]
    foreign = create_activity(client, other_project)
    foreign_url = f"{activities_url(project_id)}/{foreign['id']}"

    assert client.get(foreign_url).status_code == 404
    assert client.put(foreign_url, json=VALID_ACTIVITY).status_code == 404
    assert client.delete(foreign_url).status_code == 404
    assert client.get(f"{activities_url(other_project)}/{foreign['id']}").json() == foreign


def test_update_activity_replaces_all_fields(client: TestClient, project_id: int) -> None:
    created = create_activity(client, project_id)
    new_values = {
        "name": "Diseño v2",
        "bac": 12000,
        "planned_percent": 60,
        "actual_percent": 55.5,
        "actual_cost": 7000.25,
    }

    response = client.put(f"{activities_url(project_id)}/{created['id']}", json=new_values)

    assert response.status_code == 200
    updated = response.json()
    assert_activity_contract(updated)
    assert {k: updated[k] for k in new_values} == new_values
    assert updated["id"] == created["id"]


@pytest.mark.parametrize(("overrides", "field"), INVALID_VALUES)
def test_update_activity_rejects_invalid_values_with_422(
    client: TestClient, project_id: int, overrides: dict, field: str
) -> None:
    created = create_activity(client, project_id)

    response = client.put(
        f"{activities_url(project_id)}/{created['id']}", json=VALID_ACTIVITY | overrides
    )

    assert response.status_code == 422
    assert [error["loc"][-1] for error in response.json()["detail"]] == [field]


def test_update_missing_activity_returns_404(client: TestClient, project_id: int) -> None:
    response = client.put(f"{activities_url(project_id)}/{MISSING_ID}", json=VALID_ACTIVITY)

    assert response.status_code == 404
    assert response.json() == {"detail": f"Activity {MISSING_ID} not found"}


def test_delete_activity_returns_204_and_removes_it(client: TestClient, project_id: int) -> None:
    created = create_activity(client, project_id)
    url = f"{activities_url(project_id)}/{created['id']}"

    response = client.delete(url)

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(url).status_code == 404


def test_delete_missing_activity_returns_404(client: TestClient, project_id: int) -> None:
    response = client.delete(f"{activities_url(project_id)}/{MISSING_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": f"Activity {MISSING_ID} not found"}
