from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import create_app

UNREACHABLE_DATABASE_URL = "postgresql+psycopg://evm:evm@localhost:1/evm?connect_timeout=1"

pytestmark = pytest.mark.integration


@pytest.fixture
def client_without_database() -> Iterator[TestClient]:
    engine = create_engine(UNREACHABLE_DATABASE_URL)

    def unreachable_session() -> Iterator[Session]:
        with Session(bind=engine) as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = unreachable_session
    with TestClient(app) as test_client:
        yield test_client
    engine.dispose()


def test_health_returns_ok_when_database_answers(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_returns_503_when_database_is_unreachable(
    client_without_database: TestClient,
) -> None:
    response = client_without_database.get("/health")

    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}


def test_openapi_docs_are_served_at_api_docs(client: TestClient) -> None:
    response = client.get("/api-docs")

    assert response.status_code == 200
    assert "swagger-ui" in response.text
