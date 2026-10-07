from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_all(self) -> Sequence[Project]:
        return self._session.scalars(select(Project).order_by(Project.id)).all()

    def get(self, project_id: int) -> Project | None:
        return self._session.get(Project, project_id)

    def add(self, project: Project) -> Project:
        self._session.add(project)
        self._session.flush()
        self._session.refresh(project)
        return project

    def save(self, project: Project) -> Project:
        self._session.flush()
        self._session.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self._session.delete(project)
        self._session.flush()
