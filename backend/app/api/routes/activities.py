from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.errors import NOT_FOUND_RESPONSE
from app.api.params import ActivityId, ProjectId
from app.db.session import DbSession
from app.schemas.activity import ActivityResponse, ActivityWrite
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/projects/{project_id}/activities", tags=["activities"])


def get_activity_service(session: DbSession) -> ActivityService:
    return ActivityService(session)


Service = Annotated[ActivityService, Depends(get_activity_service)]


@router.get(
    "",
    response_model=list[ActivityResponse],
    summary="List a project's activities",
    description="Returns the project's activities ordered by id; an empty list when it has none.",
    responses=NOT_FOUND_RESPONSE,
)
def list_activities(project_id: ProjectId, service: Service) -> list[ActivityResponse]:
    return [ActivityResponse.model_validate(a) for a in service.list_activities(project_id)]


@router.post(
    "",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an activity",
    description=(
        "Adds an activity to the project. BAC must be greater than zero, percentages between "
        "0 and 100, actual cost zero or more; money and percentages accept two decimals."
    ),
    responses=NOT_FOUND_RESPONSE,
)
def create_activity(
    project_id: ProjectId, data: ActivityWrite, service: Service
) -> ActivityResponse:
    return ActivityResponse.model_validate(service.create_activity(project_id, data))


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Get an activity",
    description="Returns one activity. 404 when it does not exist or belongs to another project.",
    responses=NOT_FOUND_RESPONSE,
)
def get_activity(
    project_id: ProjectId, activity_id: ActivityId, service: Service
) -> ActivityResponse:
    return ActivityResponse.model_validate(service.get_activity(project_id, activity_id))


@router.put(
    "/{activity_id}",
    response_model=ActivityResponse,
    summary="Replace an activity",
    description="Replaces every field of the activity, with the same rules as creation.",
    responses=NOT_FOUND_RESPONSE,
)
def update_activity(
    project_id: ProjectId, activity_id: ActivityId, data: ActivityWrite, service: Service
) -> ActivityResponse:
    return ActivityResponse.model_validate(service.update_activity(project_id, activity_id, data))


@router.delete(
    "/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an activity",
    description="Deletes the activity. 404 when it does not exist or belongs to another project.",
    responses=NOT_FOUND_RESPONSE,
)
def delete_activity(project_id: ProjectId, activity_id: ActivityId, service: Service) -> None:
    service.delete_activity(project_id, activity_id)
