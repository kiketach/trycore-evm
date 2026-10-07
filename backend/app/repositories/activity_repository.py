from collections.abc import Sequence

from sqlalchemy import select

from app.models.activity import Activity
from app.repositories.base import Repository


class ActivityRepository(Repository[Activity]):
    def list_for_project(self, project_id: int) -> Sequence[Activity]:
        query = select(Activity).where(Activity.project_id == project_id).order_by(Activity.id)
        return self._session.scalars(query).all()

    def get_for_project(self, project_id: int, activity_id: int) -> Activity | None:
        """The activity only when it belongs to the given project."""
        query = select(Activity).where(
            Activity.id == activity_id, Activity.project_id == project_id
        )
        return self._session.scalars(query).one_or_none()
