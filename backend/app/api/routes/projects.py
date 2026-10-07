from typing import Annotated

from fastapi import APIRouter, Depends, Path, status

from app.api.errors import NOT_FOUND_RESPONSE
from app.db.session import DbSession
from app.schemas.project import ProjectResponse, ProjectWrite
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])

ProjectId = Annotated[int, Path(description="Project identifier.", gt=0)]


def get_project_service(session: DbSession) -> ProjectService:
    return ProjectService(session)


Service = Annotated[ProjectService, Depends(get_project_service)]


@router.get(
    "",
    response_model=list[ProjectResponse],
    summary="List projects",
    description="Returns every project, ordered by id. An empty list when there are none.",
)
def list_projects(service: Service) -> list[ProjectResponse]:
    return [ProjectResponse.model_validate(p) for p in service.list_projects()]


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project",
    description="Creates a project without activities. `cutoff_date` is informative only.",
)
def create_project(data: ProjectWrite, service: Service) -> ProjectResponse:
    return ProjectResponse.model_validate(service.create_project(data))


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a project",
    description="Returns one project by id.",
    responses=NOT_FOUND_RESPONSE,
)
def get_project(project_id: ProjectId, service: Service) -> ProjectResponse:
    return ProjectResponse.model_validate(service.get_project(project_id))


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Replace a project's editable fields",
    description="Replaces name, description and cutoff_date. Omitted optional fields become null.",
    responses=NOT_FOUND_RESPONSE,
)
def update_project(project_id: ProjectId, data: ProjectWrite, service: Service) -> ProjectResponse:
    return ProjectResponse.model_validate(service.update_project(project_id, data))


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
    description="Deletes the project and, in cascade, all of its activities.",
    responses=NOT_FOUND_RESPONSE,
)
def delete_project(project_id: ProjectId, service: Service) -> None:
    service.delete_project(project_id)
