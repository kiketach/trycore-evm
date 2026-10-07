from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.schemas.error import ErrorResponse
from app.services.errors import ResourceNotFoundError

NOT_FOUND_RESPONSE = {
    status.HTTP_404_NOT_FOUND: {
        "model": ErrorResponse,
        "description": "The resource does not exist.",
    }
}


async def handle_resource_not_found(_: Request, error: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ErrorResponse(detail=str(error)).model_dump(),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ResourceNotFoundError, handle_resource_not_found)
