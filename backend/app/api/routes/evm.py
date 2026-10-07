from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.errors import NOT_FOUND_RESPONSE
from app.api.params import ProjectId
from app.db.session import DbSession
from app.schemas.evm import ProjectEvmResponse
from app.services.evm_service import EvmService

router = APIRouter(prefix="/projects/{project_id}/evm", tags=["evm"])


def get_evm_service(session: DbSession) -> EvmService:
    return EvmService(session)


Service = Annotated[EvmService, Depends(get_evm_service)]


@router.get(
    "",
    response_model=ProjectEvmResponse,
    summary="Get a project's Earned Value indicators and their interpretation",
    description=(
        "Computes PV, EV, AC, CV, SV, CPI, SPI, EAC and VAC for every activity and for the "
        "project, and interprets CPI (under / on / over budget) and SPI (ahead / on schedule / "
        "behind). Project indicators come from the summed BAC, PV, EV and AC of its activities, "
        "never from averaged indices. Indicators whose formula would divide by zero are null. "
        "Computed on every request from the stored activities: never stale."
    ),
    responses=NOT_FOUND_RESPONSE,
)
def get_project_evm(project_id: ProjectId, service: Service) -> ProjectEvmResponse:
    return service.project_evm(project_id)
