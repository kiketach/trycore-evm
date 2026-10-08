# Trycore · Dashboard de Valor Ganado (EVM)

Aplicación fullstack para que los líderes de proyecto registren el avance de sus actividades y vean,
en tiempo real, si su proyecto va bien o mal en costo y en cronograma, con los indicadores de Valor Ganado
(Earned Value Management, estándar del PMI).

- **Backend:** Python 3.12 · FastAPI · SQLAlchemy 2 · PostgreSQL 16 (Docker Compose)
- **Frontend:** React 19 · TypeScript (estricto) · Vite · Recharts
- **Calidad:** ruff y ESLint; pytest y Vitest; cobertura mínima del 80 % en la capa de negocio; CI en GitHub Actions

## Inicio rápido

Requisitos: Docker (con Docker Compose), Python 3.12 con [uv](https://docs.astral.sh/uv/), Node.js 22 con npm.

```bash
docker compose up -d --wait                                # 1. Base de datos

cd backend && uv sync
uv run python -m scripts.seed_demo                         # 2. (opcional) proyecto de demostración
uv run uvicorn app.main:app --reload                       # 3. API en http://localhost:8000

# 4. En otra terminal, desde la raíz del repositorio:
cd frontend && npm install && npm run dev                  # Dashboard en http://localhost:5173
```

Documentación de la API (OpenAPI / Swagger UI): **http://localhost:8000/api-docs**

## Correr en local, paso a paso

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

### 4. Datos de demostración (opcional)
```bash
cd backend
uv run python -m scripts.seed_demo
```
Carga el proyecto **«Portal de clientes (demo)»** con las mismas validaciones de la API
([`backend/scripts/seed_demo.py`](backend/scripts/seed_demo.py)). Si lo vuelves a ejecutar, reemplaza solo ese proyecto,
en una sola transacción: si algo falla a mitad, el demo anterior queda intacto.

| Actividad | BAC | % plan | % real | AC | PV | EV | CPI | SPI | Lectura |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Login | 10.000 | 50 | 40 | 3.200 | 5.000 | 4.000 | 1,25 | 0,80 | bajo presupuesto, atrasada |
| Reportes | 20.000 | 25 | 50 | 12.000 | 5.000 | 10.000 | 0,83 | 2,00 | sobre presupuesto, adelantada |
| Migración | 1.000 | 50 | 30 | 0 | 500 | 300 | N/D | 0,60 | sin costo registrado: CPI no disponible |
| Casi en presupuesto | 10.000 | 100 | 99,96 | 10.000 | 10.000 | 9.996 | 1,00 | 1,00 | se muestra 1,00, pero es 0,9996: sobre presupuesto y atrasada |
| **Proyecto (sumas)** | **41.000** | | | **25.200** | **20.500** | **24.296** | **0,96** | **1,19** | **sobre presupuesto, adelantado** |

Proyecto: CV −904 · SV 3.796 · EAC 42.525,52 · VAC −1.525,52. Estos valores están calculados a mano y fijados por
[`test_seed_demo.py`](backend/tests/integration/test_seed_demo.py).

## Cómo se calcula

| Indicador | Fórmula | Se lee como |
|---|---|---|
| PV — Valor planeado | % planeado × BAC | cuánto trabajo, en dinero, debería estar hecho a la fecha de corte |
| EV — Valor ganado | % real × BAC | cuánto vale, según el presupuesto, el trabajo realmente hecho |
| AC — Costo real | dato | cuánto se ha gastado |
| CV — Variación de costo | EV − AC | negativo: se gastó más de lo que vale lo hecho |
| SV — Variación de cronograma | EV − PV | negativo: va atrasado |
| CPI — Índice de costo | EV / AC | > 1 bajo presupuesto · < 1 sobre presupuesto |
| SPI — Índice de cronograma | EV / PV | > 1 adelantado · < 1 atrasado |
| EAC — Estimado al completar | BAC / CPI | costo final si se mantiene la eficiencia actual |
| VAC — Variación al completar | BAC − EAC | negativo: el proyecto terminará por encima del presupuesto |

Reglas que no son obvias (detalle y razones en [`DECISIONS.md`](DECISIONS.md)):
- **El proyecto se calcula sumando, no promediando.** Se suman BAC, PV, EV y AC de las actividades y se aplican las
  mismas fórmulas. Promediar los CPI le daría el mismo peso a una actividad de 1.000 que a una de 100.000.
- **Si una fórmula divide por cero, el indicador es `null` («N/D»), nunca 0 ni infinito.** CPI sin AC, SPI sin PV;
  EAC y VAC sin datos de desempeño de costo o cuando CPI = 0.
- **CPI = 0 sí es un valor:** se gastó y no se avanzó nada, y se marca sobre presupuesto.
- **El estado se interpreta sobre el índice exacto; el redondeo a 2 decimales es solo presentación** (D-06). Por eso un
  CPI de 0,9996 se muestra como 1,00 en rojo, y el dashboard muestra el valor sin redondear al pasar el cursor
  o al enfocarlo con el teclado.
- **El frontend nunca calcula EVM:** después de cada cambio vuelve a pedir los indicadores al backend.
- La fecha de corte del proyecto es informativa: no entra en ningún cálculo.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | estado de la API y de la base de datos |
| GET · POST | `/projects` | listar · crear proyectos |
| GET · PUT · DELETE | `/projects/{project_id}` | consultar · reemplazar · eliminar (borra sus actividades) |
| GET · POST | `/projects/{project_id}/activities` | listar · crear actividades del proyecto |
| GET · PUT · DELETE | `/projects/{project_id}/activities/{activity_id}` | consultar · reemplazar · eliminar una actividad |
| GET | `/projects/{project_id}/evm` | indicadores por actividad y consolidados, con su interpretación |

Cada endpoint documenta en `/api-docs` sus esquemas de request y response y sus códigos de error
(`404` con `{"detail": "..."}` y `422` de validación). Si la base de datos no responde, `/health` contesta `503`
con `{"detail": "Database unavailable"}`; los demás endpoints no manejan ese caso y responden `500`.

## Arquitectura

```
frontend (React) ──/api──▶ routers FastAPI ──▶ servicios ──▶ dominio EVM (puro)
                                  │                │
                              esquemas         repositorios ──▶ modelos SQLAlchemy ──▶ PostgreSQL
```

- [`backend/app/domain/evm/`](backend/app/domain/evm/): la lógica EVM, en funciones puras con `Decimal`, sin FastAPI
  ni SQLAlchemy (un test lo verifica). Junto con los servicios, es la capa sobre la que se mide la cobertura.
- [`backend/app/services/`](backend/app/services/): orquestan repositorio y dominio; no calculan EVM.
- [`backend/app/api/routes/`](backend/app/api/routes/): solo HTTP.
- [`frontend/src/components/`](frontend/src/components/): panel de proyectos, indicadores consolidados con semáforo,
  gráfica PV/EV/AC y tabla editable. Resumen, gráfica y tabla salen de una sola carga de datos.

## Pruebas, linters y CI
```bash
cd backend
uv run pytest            # unitarias + integración (la BD debe estar levantada); falla si la cobertura < 80 %
uv run ruff check .
uv run ruff format --check .

cd ../frontend
npm run lint
npm run typecheck
npm test
npm run build
```

- Las pruebas unitarias del dominio usan valores calculados a mano, incluidos los casos borde (AC = 0, PV = 0,
  CPI = 0, avance 0 %, proyecto sin actividades, índices en el límite de 1).
- Cada endpoint tiene pruebas de integración contra PostgreSQL real (base `evm_test`), cada una dentro de una
  transacción que se revierte al terminar.
- El mismo flujo corre en GitHub Actions en cada Pull Request hacia `develop` o `main`:
  [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Flujo de trabajo
Gitflow: `main` (producción), `develop` (integración), una rama `feature/*` o `bugfix/*` por cambio, integrada a
`develop` por Pull Request revisado, y una rama `release/*` antes de llegar a `main`.

## Documentos del proceso
- [`AI_PROCESS.md`](AI_PROCESS.md): cómo usé la IA durante el ejercicio.
- [`DECISIONS.md`](DECISIONS.md): decisiones donde rechacé o modifiqué una sugerencia de la IA.
- [`docs/ai/prompts-log.md`](docs/ai/prompts-log.md): todos los prompts, textuales y en orden.
