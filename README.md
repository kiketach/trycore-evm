# Trycore · Dashboard de Valor Ganado (EVM)

Aplicación fullstack para que los líderes de proyecto registren el avance de sus actividades y vean,
en tiempo real, los indicadores de Valor Ganado (PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC).

## Requisitos
- Docker (con Docker Compose)
- Python 3.12 y [uv](https://docs.astral.sh/uv/)
- Node.js 22 y npm

## Correr en local

### 1. Base de datos
```bash
cp .env.example .env        # opcional: solo si quieres cambiar credenciales o puerto
docker compose up -d --wait
```
PostgreSQL queda en `localhost:5433` (el puerto se cambia con `POSTGRES_PORT`).

**Script de inicialización:** al crear el contenedor por primera vez, PostgreSQL ejecuta en orden los scripts de
[`db/init/`](db/init/): [`01_schema.sql`](db/init/01_schema.sql) crea las tablas en la base `evm` (aplicación) y
[`02_create_test_database.sql`](db/init/02_create_test_database.sql) crea `evm_test` (pruebas de integración) con el mismo esquema.
Para reinicializar desde cero: `docker compose down -v && docker compose up -d --wait`.

Sin Docker, sobre un PostgreSQL propio: `psql -d <tu_base> -f db/init/01_schema.sql`.

### 2. Backend
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```
- API: http://localhost:8000
- Documentación OpenAPI (Swagger UI): http://localhost:8000/api-docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
- Dashboard: http://localhost:5173
- El servidor de Vite reenvía `/api/*` al backend (`http://localhost:8000`, configurable con la variable `BACKEND_URL`),
  así el navegador habla con un solo origen y el backend no necesita CORS. El backend debe estar corriendo.

## Pruebas y linter
```bash
cd backend
uv run pytest            # las pruebas de integración necesitan la BD levantada
uv run ruff check .
uv run ruff format --check .

cd ../frontend
npm run lint
npm run typecheck
npm test
```

El mismo flujo (backend: BD con los scripts de `db/init/`, lint, formato y pruebas con el umbral de cobertura;
frontend: lint, tipos, pruebas y build) corre en GitHub Actions en cada Pull Request hacia `develop` o `main`: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Documentos del proceso
- [`AI_PROCESS.md`](AI_PROCESS.md): cómo usé la IA durante el ejercicio.
- [`DECISIONS.md`](DECISIONS.md): decisiones donde rechacé o modifiqué una sugerencia de la IA.
- [`docs/ai/prompts-log.md`](docs/ai/prompts-log.md): todos los prompts, textuales y en orden.
