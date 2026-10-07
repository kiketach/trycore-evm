from fastapi import FastAPI

from app.api.errors import register_error_handlers
from app.api.routes import health, projects

API_TITLE = "EVM Dashboard API"
API_VERSION = "0.1.0"
API_DESCRIPTION = (
    "REST API to manage projects and activities and compute their Earned Value Management "
    "indicators (PV, EV, CV, SV, CPI, SPI, EAC, VAC)."
)


def create_app() -> FastAPI:
    app = FastAPI(
        title=API_TITLE,
        version=API_VERSION,
        description=API_DESCRIPTION,
        docs_url="/api-docs",
        redoc_url=None,
    )
    register_error_handlers(app)
    app.include_router(health.router)
    app.include_router(projects.router)
    return app


app = create_app()
