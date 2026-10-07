# Decisiones

Registro cronológico de cada momento en que **rechacé o modifiqué** una sugerencia de la IA, con mi razón.
Es la fuente de las secciones «Decisiones donde no seguí a la IA» y «Decisión de arquitectura independiente» de `AI_PROCESS.md`.

Reglas:
- Solo entra lo que realmente pasó. No se reconstruye ni se inventa después.
- Una entrada por decisión, en el momento en que ocurre.
- La IA puede redactar la entrada, pero el texto de «Mi razón» lo dicto o lo apruebo yo.

## Formato

### D-NN · Título corto · AAAA-MM-DD HH:MM
- **Qué propuso la IA:**
- **Qué decidí:**
- **Mi razón:**
- **Cómo lo verifiqué:**
- **Prompt relacionado:** Prompt N en `docs/ai/prompts-log.md`

## Entradas

### D-01 · httpx2: la IA tenía razón y yo no · 2026-10-07 12:46
- **Qué propuso la IA:** usar `httpx2` en lugar de `httpx` como cliente HTTP de los tests, porque el `TestClient` de Starlette 1.7 importa `httpx2` y emite un aviso de deprecación con `httpx`.
- **Qué decidí:** en la revisión del PR #1 pedí cambiarlo por `httpx`, porque creí que el paquete no existía. Ante la evidencia, lo mantuve.
- **Mi razón:** «Propuse cambiarlo basándome en el nombre inusual, y tu evidencia del paquete y la dependencia de Starlette me corrigió». Verifiqué que httpx2 sí existe: es el cliente HTTP de nueva generación de Tom Christie.
- **Cómo lo verifiqué:** `pypi.org/pypi/httpx2/2.13.1` responde 200 (autor Tom Christie, mantenido por Pydantic Services); `starlette/testclient.py` hace `import httpx2 as httpx`; clon limpio + `uv sync --locked` + `pytest` → 3 passed. Pendiente antes de la entrega: repetir `uv sync` desde un clon limpio.
- **Prompt relacionado:** Prompts 3 y 5 en `docs/ai/prompts-log.md`

### D-02 · El script de inicialización vive en `db/init/01_schema.sql` · 2026-10-07 12:46
- **Qué propuso la IA:** el plan aprobado decía `db/init/01_schema.sql` montado en `docker-entrypoint-initdb.d`, pero al implementar la IA se apartó del plan: dejó el DDL en `db/schema.sql` y un script de arranque `db/init/01-create-databases.sql` que lo incluía.
- **Qué decidí:** volver a la ruta del plan: `db/init/01_schema.sql` crea las tablas en `evm` y `db/init/02_create_test_database.sql` crea `evm_test` reutilizando el 01.
- **Mi razón:** «Mi razón no es que el enunciado fije la ruta, es de consistencia y legibilidad. El plan de arquitectura que aprobé decía db/init/01_schema.sql montado en docker-entrypoint-initdb.d, y quiero que el script de inicialización de la BD sea evidente para quien evalúa, porque el enunciado sí pide un script de inicialización visible». En el prompt 3 había dado como razón que era «la ruta que pide el entregable»; la IA señaló que el enunciado no fija ruta y en el prompt 5 aclaré la razón real.
- **Cómo lo verifiqué:** `docker compose down -v && docker compose up -d --wait`: los logs muestran `01_schema.sql` y luego `02_create_test_database.sql`, y `evm` y `evm_test` tienen las tablas `projects` y `activities`.
- **Prompt relacionado:** Prompts 3 y 5 en `docs/ai/prompts-log.md`

### D-03 · Cobertura del 80 % sobre la capa de negocio, exigida desde la primera rama · 2026-10-07 12:46
- **Qué propuso la IA:** medir cobertura sobre `app/domain` y `app/services` y activar el umbral en `feature/evm-domain`, cuando existiera la capa de dominio.
- **Qué decidí:** el mismo alcance (domain y services), pero exigido desde `feature/backend-setup`. En el prompt 3 había pedido medir sobre todo `app`; en el prompt 5 lo cambié a domain y services.
- **Mi razón:** «El enunciado pide 80% en la capa de negocio, así que mide sobre domain y services, no sobre todo app; routers y schemas no son lógica de negocio e inflarían el denominador. Y la exijo desde ya para que ninguna rama pueda bajar del 80% sin que el build falle».
- **Cómo lo verifiqué:** `uv run pytest` → 100 % sobre `app/services` (`app/domain` aún no existe y entra solo al crearse); corriendo solo un test que no ejercita el servicio → 44,44 % y exit 1.
- **Prompt relacionado:** Prompts 3 y 5 en `docs/ai/prompts-log.md`
