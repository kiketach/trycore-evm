from typing import Annotated

from fastapi import Path

ProjectId = Annotated[int, Path(description="Project identifier.", gt=0)]
ActivityId = Annotated[int, Path(description="Activity identifier.", gt=0)]
