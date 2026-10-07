from dataclasses import asdict

from sqlalchemy.orm import Session

from app.domain.evm import ActivityInput, calculate_activity, consolidate_project
from app.models.activity import Activity
from app.repositories.activity_repository import ActivityRepository
from app.schemas.evm import ActivityEvmResponse, EvmIndicatorsResponse, ProjectEvmResponse
from app.services.project_service import ProjectService


class EvmService:
    """Loads a project's activities and hands them to the EVM domain. Computes nothing itself."""

    def __init__(self, session: Session) -> None:
        self._projects = ProjectService(session)
        self._activities = ActivityRepository(session)

    def project_evm(self, project_id: int) -> ProjectEvmResponse:
        project = self._projects.get_project(project_id)
        activities = self._activities.list_for_project(project_id)
        inputs = [_to_domain_input(activity) for activity in activities]
        return ProjectEvmResponse(
            project_id=project.id,
            project_name=project.name,
            cutoff_date=project.cutoff_date,
            summary=EvmIndicatorsResponse.model_validate(consolidate_project(inputs)),
            activities=[
                ActivityEvmResponse(
                    activity_id=activity.id,
                    name=activity.name,
                    **asdict(calculate_activity(activity_input)),
                )
                for activity, activity_input in zip(activities, inputs, strict=True)
            ],
        )


def _to_domain_input(activity: Activity) -> ActivityInput:
    return ActivityInput(
        bac=activity.bac,
        planned_percent=activity.planned_percent,
        actual_percent=activity.actual_percent,
        actual_cost=activity.actual_cost,
    )
