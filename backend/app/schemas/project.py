from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.core.limits import NAME_MAX_LENGTH

ProjectName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=NAME_MAX_LENGTH)
]


class ProjectWrite(BaseModel):
    """Body for creating a project or replacing all its editable fields."""

    name: ProjectName = Field(description="Project name. Leading and trailing spaces are removed.")
    description: str | None = Field(default=None, description="Optional free-text description.")
    cutoff_date: date | None = Field(
        default=None,
        description=(
            "Date the activities' progress percentages refer to. "
            "Informative only: it does not change any calculation."
        ),
    )


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    cutoff_date: date | None
    created_at: datetime
    updated_at: datetime
