"""Load the demo project used in the video into the application database.

Run from backend/:  uv run python -m scripts.seed_demo

It goes through the same services as the API, so the data passes the same validation.
Re-running it replaces only the project named DEMO_PROJECT_NAME; nothing else is touched.

Expected project indicators (computed by hand, see README):
  BAC 41,000 | PV 20,500 | EV 24,296 | AC 25,200 | CV -904 | SV 3,796
  CPI 0.96 (0.964127, over budget) | SPI 1.19 (1.185171, ahead)
  EAC 42,525.52 | VAC -1,525.52
"""

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.session import get_session_factory
from app.models.project import Project
from app.schemas.activity import ActivityWrite
from app.schemas.project import ProjectWrite
from app.services.activity_service import ActivityService
from app.services.project_service import ProjectService

DEMO_PROJECT_NAME = "Portal de clientes (demo)"

DEMO_PROJECT = ProjectWrite(
    name=DEMO_PROJECT_NAME,
    description="Proyecto de demostración del dashboard de Valor Ganado.",
    cutoff_date=date(2026, 10, 7),
)


def _activity(name: str, bac: str, planned: str, actual: str, cost: str) -> ActivityWrite:
    return ActivityWrite(
        name=name,
        bac=Decimal(bac),
        planned_percent=Decimal(planned),
        actual_percent=Decimal(actual),
        actual_cost=Decimal(cost),
    )


DEMO_ACTIVITIES = [
    # Under budget, behind schedule: CPI 1.25, SPI 0.80.
    _activity("Login", "10000", "50", "40", "3200"),
    # Over budget, ahead of schedule: CPI 0.83, SPI 2.00.
    _activity("Reportes", "20000", "25", "50", "12000"),
    # No cost recorded yet: CPI, EAC and VAC are not available.
    _activity("Migración", "1000", "50", "30", "0"),
    # Shown as 1.00 but exactly 0.9996: over budget and behind (D-06).
    _activity("Casi en presupuesto", "10000", "100", "99.96", "10000"),
]


def seed_demo(session: Session) -> Project:
    """Replace the demo project with a fresh copy and return it."""
    projects = ProjectService(session)
    for existing in projects.list_projects():
        if existing.name == DEMO_PROJECT_NAME:
            projects.delete_project(existing.id)
    project = projects.create_project(DEMO_PROJECT)
    activities = ActivityService(session)
    for activity in DEMO_ACTIVITIES:
        activities.create_activity(project.id, activity)
    return project


def main() -> None:
    with get_session_factory()() as session:
        project = seed_demo(session)
        print(f"Demo project '{project.name}' loaded with id {project.id}.")


if __name__ == "__main__":
    main()
