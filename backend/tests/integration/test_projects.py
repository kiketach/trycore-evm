from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

pytestmark = pytest.mark.integration

PROJECT_FIELDS = {"id", "name", "description", "cutoff_date", "created_at", "updated_at"}
MISSING_PROJECT_ID = 999_999


def create_project(client: TestClient, **overrides) -> dict:
    body = {"name": "Portal de clientes", "description": "Fase 1", "cutoff_date": "2026-10-07"}
    response = client.post("/projects", json=body | overrides)
    assert response.status_code == 201
    return response.json()


def assert_project_contract(project: dict) -> None:
    assert set(project) == PROJECT_FIELDS
    assert isinstance(project["id"], int)
    datetime.fromisoformat(project["created_at"])
    datetime.fromisoformat(project["updated_at"])


def test_create_project_returns_201_with_the_stored_project(client: TestClient) -> None:
    project = create_project(client, name="  Portal de clientes  ")

    assert_project_contract(project)
    assert project["name"] == "Portal de clientes"
    assert project["description"] == "Fase 1"
    assert project["cutoff_date"] == "2026-10-07"


def test_create_project_without_optional_fields(client: TestClient) -> None:
    response = client.post("/projects", json={"name": "Sin fecha de corte"})

    assert response.status_code == 201
    assert response.json()["description"] is None
    assert response.json()["cutoff_date"] is None


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 121},
        {"name": "Valid", "cutoff_date": "not-a-date"},
    ],
)
def test_create_project_rejects_invalid_body_with_422(client: TestClient, body: dict) -> None:
    response = client.post("/projects", json=body)

    assert response.status_code == 422
    assert "detail" in response.json()


def test_list_projects_returns_all_projects_ordered_by_id(client: TestClient) -> None:
    first = create_project(client, name="Primero")
    second = create_project(client, name="Segundo")

    response = client.get("/projects")

    assert response.status_code == 200
    ids = [p["id"] for p in response.json()]
    assert ids == sorted(ids)
    assert {first["id"], second["id"]} <= set(ids)
    for project in response.json():
        assert_project_contract(project)


def test_get_project_returns_the_project(client: TestClient) -> None:
    created = create_project(client)

    response = client.get(f"/projects/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_get_missing_project_returns_404_with_error_body(client: TestClient) -> None:
    response = client.get(f"/projects/{MISSING_PROJECT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": f"Project {MISSING_PROJECT_ID} not found"}


def test_get_project_with_non_positive_id_returns_422(client: TestClient) -> None:
    assert client.get("/projects/0").status_code == 422


def test_update_project_replaces_editable_fields(client: TestClient) -> None:
    created = create_project(client)

    response = client.put(f"/projects/{created['id']}", json={"name": "Portal v2"})

    assert response.status_code == 200
    updated = response.json()
    assert_project_contract(updated)
    assert updated["id"] == created["id"]
    assert updated["name"] == "Portal v2"
    assert updated["description"] is None
    assert updated["cutoff_date"] is None
    assert client.get(f"/projects/{created['id']}").json() == updated


def test_update_missing_project_returns_404(client: TestClient) -> None:
    response = client.put(f"/projects/{MISSING_PROJECT_ID}", json={"name": "Nadie"})

    assert response.status_code == 404
    assert response.json() == {"detail": f"Project {MISSING_PROJECT_ID} not found"}


def test_update_project_rejects_blank_name_with_422(client: TestClient) -> None:
    created = create_project(client)

    assert client.put(f"/projects/{created['id']}", json={"name": " "}).status_code == 422


def test_delete_project_returns_204_and_removes_it(client: TestClient) -> None:
    created = create_project(client)

    response = client.delete(f"/projects/{created['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/projects/{created['id']}").status_code == 404


def test_delete_project_cascades_to_its_activities(client: TestClient, db_session: Session) -> None:
    created = create_project(client)
    activity_id = db_session.execute(
        text(
            "INSERT INTO activities "
            "(project_id, name, bac, planned_percent, actual_percent, actual_cost) "
            "VALUES (:project_id, 'Diseño', 1000, 50, 40, 300) RETURNING id"
        ),
        {"project_id": created["id"]},
    ).scalar_one()
    ids = {"project_id": created["id"], "activity_id": activity_id}
    count_rows = text(
        "SELECT (SELECT count(*) FROM projects WHERE id = :project_id), "
        "(SELECT count(*) FROM activities WHERE id = :activity_id)"
    )
    assert tuple(db_session.execute(count_rows, ids).one()) == (1, 1)

    response = client.delete(f"/projects/{created['id']}")

    assert response.status_code == 204
    assert tuple(db_session.execute(count_rows, ids).one()) == (0, 0)


def test_update_advances_updated_at_and_keeps_created_at(committing_client: TestClient) -> None:
    created = create_project(committing_client)
    try:
        response = committing_client.put(f"/projects/{created['id']}", json={"name": "Portal v2"})

        assert response.status_code == 200
        updated = response.json()
        assert updated["created_at"] == created["created_at"]
        assert datetime.fromisoformat(updated["updated_at"]) > datetime.fromisoformat(
            created["updated_at"]
        )
    finally:
        committing_client.delete(f"/projects/{created['id']}")


def test_delete_missing_project_returns_404(client: TestClient) -> None:
    response = client.delete(f"/projects/{MISSING_PROJECT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": f"Project {MISSING_PROJECT_ID} not found"}
