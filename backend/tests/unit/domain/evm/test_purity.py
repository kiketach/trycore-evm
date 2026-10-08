"""The EVM domain must stay pure: no web framework, no ORM.

Checked in a fresh interpreter: the pytest process has already imported FastAPI and
SQLAlchemy through conftest, so inspecting its own sys.modules would prove nothing.
"""

import json
import subprocess
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[4]
FORBIDDEN_PACKAGES = ("fastapi", "starlette", "sqlalchemy", "psycopg", "pydantic")

IMPORT_DOMAIN_AND_LIST_MODULES = (
    "import json, sys; import app.domain.evm; print(json.dumps(sorted(sys.modules)))"
)


def test_importing_the_evm_domain_loads_no_framework_or_database_package():
    completed = subprocess.run(
        [sys.executable, "-c", IMPORT_DOMAIN_AND_LIST_MODULES],
        cwd=BACKEND_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    loaded = json.loads(completed.stdout)

    assert "app.domain.evm" in loaded
    leaked = [m for m in loaded if m.split(".")[0] in FORBIDDEN_PACKAGES]
    assert leaked == []
