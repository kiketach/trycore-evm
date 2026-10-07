from fastapi import APIRouter, HTTPException, status

from app.db.session import DbSession
from app.schemas.error import ErrorResponse
from app.schemas.health import HealthResponse
from app.services.health_service import is_database_reachable

DATABASE_UNAVAILABLE_DETAIL = "Database unavailable"

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check API and database health",
    description="Returns 200 when the API is up and PostgreSQL answers a trivial query.",
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "The database cannot be reached.",
        }
    },
)
def read_health(session: DbSession) -> HealthResponse:
    if not is_database_reachable(session):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=DATABASE_UNAVAILABLE_DETAIL
        )
    return HealthResponse(status="ok")
