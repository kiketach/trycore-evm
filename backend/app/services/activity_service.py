from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityWrite
from app.services.errors import ResourceNotFoundError
from app.services.project_service import ProjectService

ACTIVITY_RESOURCE = "Activity"


class ActivityService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._activities = ActivityRepository(session)
        self._projects = ProjectService(session)

    def list_activities(self, project_id: int) -> Sequence[Activity]:
        self._projects.get_project(project_id)
        return self._activities.list_for_project(project_id)

    def get_activity(self, project_id: int, activity_id: int) -> Activity:
        self._projects.get_project(project_id)
        activity = self._activities.get_for_project(project_id, activity_id)
        if activity is None:
            raise ResourceNotFoundError(ACTIVITY_RESOURCE, activity_id)
        return activity

    def create_activity(self, project_id: int, data: ActivityWrite) -> Activity:
        self._projects.get_project(project_id)
        activity = self._activities.add(Activity(project_id=project_id, **data.model_dump()))
        self._session.commit()
        return activity

    def update_activity(self, project_id: int, activity_id: int, data: ActivityWrite) -> Activity:
        activity = self.get_activity(project_id, activity_id)
        for field, value in data.model_dump().items():
            setattr(activity, field, value)
        activity = self._activities.save(activity)
        self._session.commit()
        return activity

    def delete_activity(self, project_id: int, activity_id: int) -> None:
        self._activities.delete(self.get_activity(project_id, activity_id))
        self._session.commit()
