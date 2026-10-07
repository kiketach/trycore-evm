from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Body returned by every handled error (same shape as FastAPI's HTTPException)."""

    detail: str = Field(description="Human-readable explanation of the error.")
