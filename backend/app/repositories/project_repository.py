from collections.abc import Sequence

from sqlalchemy import select

from app.models.project import Project
from app.repositories.base import Repository


class ProjectRepository(Repository[Project]):
    def list_all(self) -> Sequence[Project]:
        return self._session.scalars(select(Project).order_by(Project.id)).all()

    def get(self, project_id: int) -> Project | None:
        return self._session.get(Project, project_id)
