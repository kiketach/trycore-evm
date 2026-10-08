from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectWrite
from app.services.errors import ResourceNotFoundError

PROJECT_RESOURCE = "Project"


class ProjectService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._projects = ProjectRepository(session)

    def list_projects(self) -> Sequence[Project]:
        return self._projects.list_all()

    def get_project(self, project_id: int) -> Project:
        project = self._projects.get(project_id)
        if project is None:
            raise ResourceNotFoundError(PROJECT_RESOURCE, project_id)
        return project

    def create_project(self, data: ProjectWrite) -> Project:
        project = self._projects.add(Project(**data.model_dump()))
        self._session.commit()
        return project

    def update_project(self, project_id: int, data: ProjectWrite) -> Project:
        project = self.get_project(project_id)
        for field, value in data.model_dump().items():
            setattr(project, field, value)
        project = self._projects.save(project)
        self._session.commit()
        return project

    def delete_project(self, project_id: int) -> None:
        self._projects.delete(self.get_project(project_id))
        self._session.commit()
