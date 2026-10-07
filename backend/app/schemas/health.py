from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = Field(description="Always 'ok' when the API and database respond.")
