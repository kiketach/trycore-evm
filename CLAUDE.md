# Trycore · Prueba técnica · Dashboard de Valor Ganado (EVM)

App fullstack para que líderes de proyecto registren actividades y vean indicadores EVM en tiempo real.
Enunciado completo (solo local, fuera de git): `docs/reto/desafio-trycore.md`.
**Entrega: jueves 8 de octubre de 2026, 5:00 p. m.**

## Lo que más pesa en la evaluación
El video y `AI_PROCESS.md` pesan más que el código. Trycore quiere ver a un ingeniero que usa la IA para
pensar mejor, no para evitar pensar. Por eso:
- **No avances sin aprobación** en los puntos marcados como compuerta. Proponer, explicar y esperar es parte del entregable.
- **Explica para que yo entienda**, no para impresionar. Voy a tener que explicar EVM en el video con mis palabras.
- **Nunca inventes** prompts, decisiones ni razones. `DECISIONS.md` y `AI_PROCESS.md` solo contienen lo que pasó.

## Compuertas (no seguir sin mi «aprobado»)
1. Explicación de EVM y propuesta de arquitectura.
2. Antes de cada merge de `feature/*` a `develop` (resumen del PR).
3. Antes de crear `release/*` y de hacer merge a `main`.

## Registro del proceso
- Cada prompt mío se guarda solo en `docs/ai/prompts-log.md` (hook). No lo edites.
- Cuando rechace o modifique una sugerencia tuya, **propón la entrada para `DECISIONS.md`** en ese momento,
  con lo que propusiste, lo que decidí y mi razón en mis palabras. La escribes solo cuando la apruebo.
- Si mi razón no está clara, pregúntamela; no la deduzcas.

## Stack (decidido)
- Backend: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL. Documentación OpenAPI en `/api-docs`.
- Frontend: React + TypeScript (Vite).
- PostgreSQL con Docker Compose, con script de inicialización de la BD.
- Linter configurado y versionado: ruff (backend), eslint (frontend).

## Estándares obligatorios del reto
- **Lógica EVM fuera de los controladores**, en una capa de negocio pura y testeable.
- **Tests unitarios de toda la lógica EVM**, con casos borde: AC = 0, proyecto sin actividades, avance real 0 %,
  y los que salgan del análisis (por ejemplo PV = 0, CPI = 0). Las pruebas verifican valores, no que «algo retorne».
- **Cobertura ≥ 80 % en la capa de negocio**, medida y reportada.
- **Al menos un test de integración por endpoint** que valide el contrato de respuesta.
- **Cero code smells**: sin código comentado, sin variables sin usar, sin números ni strings mágicos dispersos,
  nombres descriptivos, funciones de una sola responsabilidad, nada repetido más de dos veces.
- **OpenAPI completo**: descripción, esquemas de request y response y códigos de error en cada endpoint.
- **README** con pasos para correr en local y script de inicialización de la BD.

## Gitflow estricto (el historial es parte de la entrega)
- Ramas: `main` (producción), `develop` (integración), `feature/*` por funcionalidad, al menos un `release/*`.
- Cada `feature/*` entra a `develop` por **Pull Request** en GitHub, aunque trabaje solo.
- Commits en inglés, en imperativo y descriptivos: `Add EVM calculation service`, `Fix CPI edge case when AC is zero`.
  Prohibido: `fix`, `cambios`, `wip`, `update`.
- Commits pequeños, uno por cambio lógico. Nunca commits directos a `main` ni a `develop`.
- Repo privado en GitHub: `kiketach/trycore-evm`.

## Forma de trabajar
- Español colombiano natural (tuteo) conmigo; código, commits y comentarios en inglés.
- Pasos pequeños y verificables: al cerrar cada paso muestra la salida real (tests, cobertura, lint), no un resumen.
- Comentarios solo donde el porqué no es obvio.
- Al proponer una decisión: la opción, una o dos alternativas descartadas, el porqué y el riesgo.
