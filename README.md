# Trycore · Dashboard de Valor Ganado (EVM)

Aplicación fullstack para que los líderes de proyecto registren el avance de sus actividades y vean,
en tiempo real, los indicadores de Valor Ganado (PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC).

## Requisitos
- Docker (con Docker Compose)
- Python 3.12 y [uv](https://docs.astral.sh/uv/)

## Correr en local

### 1. Base de datos
```bash
cp .env.example .env        # opcional: solo si quieres cambiar credenciales o puerto
docker compose up -d --wait
```
PostgreSQL queda en `localhost:5433` (el puerto se cambia con `POSTGRES_PORT`).

**Script de inicialización:** al crear el contenedor por primera vez, [`db/init/01-create-databases.sql`](db/init/01-create-databases.sql)
aplica [`db/schema.sql`](db/schema.sql) a la base `evm` (aplicación) y a `evm_test` (pruebas de integración).
Para reinicializar desde cero: `docker compose down -v && docker compose up -d --wait`.

Sin Docker, sobre un PostgreSQL propio: `psql -d <tu_base> -f db/schema.sql`.

### 2. Backend
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```
- API: http://localhost:8000
- Documentación OpenAPI (Swagger UI): http://localhost:8000/api-docs

## Pruebas y linter
```bash
cd backend
uv run pytest            # las pruebas de integración necesitan la BD levantada
uv run ruff check .
uv run ruff format --check .
```

## Documentos del proceso
- [`AI_PROCESS.md`](AI_PROCESS.md): cómo usé la IA durante el ejercicio.
- [`DECISIONS.md`](DECISIONS.md): decisiones donde rechacé o modifiqué una sugerencia de la IA.
- [`docs/ai/prompts-log.md`](docs/ai/prompts-log.md): todos los prompts, textuales y en orden.
