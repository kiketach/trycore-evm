import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.session import get_db
from app.main import create_app

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://evm:evm@localhost:5433/evm_test"
)


@pytest.fixture(scope="session")
def test_engine() -> Iterator[Engine]:
    engine = create_engine(TEST_DATABASE_URL)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(test_engine: Engine) -> Iterator[Session]:
    """Session wrapped in an outer transaction that is rolled back, so tests never leak data."""
    with test_engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        yield session
        session.close()
        transaction.rollback()


@pytest.fixture
def client(db_session: Session) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def committing_client(test_engine: Engine) -> Iterator[TestClient]:
    """Each request runs and commits in its own transaction, as in production.

    For behaviour that depends on PostgreSQL's now(), which is frozen for the whole
    transaction: under the rolled-back `client` fixture every request shares one.
    Tests using it must delete what they create.
    """
    session_factory = sessionmaker(bind=test_engine, expire_on_commit=False)

    def committing_session() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = committing_session
    with TestClient(app) as test_client:
        yield test_client
