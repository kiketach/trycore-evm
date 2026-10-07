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

### D-04 · Incidente: push con revisión incompleta (PARTIAL) por detener el proceso a la fuerza · 2026-10-07 12:57
- **Glosa:** «dsh» es el revisor de IA de la revisión local: un modelo Gemini que corre dentro de deepseek-harness, con herramientas aisladas para leer el repositorio y el diff.
- **Qué pasó:** con un push en curso cuya revisión pre-push llevaba varios minutos, la IA asumió que estaba colgado y mató con `kill` los procesos de la revisión y del hook. El revisor terminó con código 143 (SIGTERM), el motor reportó `GATE: PARTIAL` y el push siguió: `dc811e9`, `a5ebba8` y `5f74473` llegaron a `feature/backend-setup` a las 12:51 sin revisión completa.
- **Cómo se detectó:** la IA vio que el remoto estaba en `5f74473` cuando esperaba un push abortado; la salida del push mostraba `GATE: PARTIAL` y el log de la revisión `dsh headless exited 143`. Lo reportó antes de continuar.
- **Causa raíz:** el hook sí bloquea PARTIAL (el motor devuelve 1 y el hook bloquea todo lo distinto de 0), pero nunca llegó a decidir: el `kill` también mató el proceso del hook, y en Git for Windows un hook terminado por señal le devuelve 0 a git. Reproducido en un repo aislado: sin trap → `push exit=0` y el commit llega al remoto; con `trap ... exit 1` → `push exit=1`.
- **Cómo se corrigió:** revisión completa sobre todo el diff de la rama (`origin/develop...8e62cf4`) → PASS sin hallazgos; push normal a través del hook → PASS. El incidente quedó explicado en la descripción del PR #1.
- **Cambio de proceso:**
  1. Una revisión en curso nunca se interrumpe; si parece colgada, se lee su log y se espera. Es la primera defensa, porque `kill -9` y `taskkill /F` no se pueden atrapar desde el hook.
  2. `trap` en el pre-push global (`~/.claude/scripts/hooks/pre-push`) para que un hook interrumpido bloquee el push. Verificado contra el hook real en un repo aislado: al matar el hook y su revisor a mitad de la revisión imprime `[pre-push] interrupted — review did not finish, push blocked.`, el push sale con código 1 y la rama no llega al remoto.
- **Prompt relacionado:** Prompts 6, 7 y 8 en `docs/ai/prompts-log.md`

### D-05 · Hallazgo falso del revisor sobre `actions/checkout@v7`: la evidencia le gana a la IA · 2026-10-07 17:11
- **Qué propuso la IA:** el revisor local (dsh, ver D-04) bloqueó el push de `feature/ci-pipeline` con un warning: «`actions/checkout@v7` no existe o no resuelve», y propuso bajar a `actions/checkout@v4`.
- **Qué decidí:** descartar el hallazgo. Se mantienen `actions/checkout@v7` y `astral-sh/setup-uv@v10.2.0`; hice el push yo mismo con `SKIP_REVIEW=1` después de adjudicarlo por escrito.
- **Mi razón:** «Verifiqué independientemente que actions/checkout v7.0.1 existe y es la última release; el revisor razonó con conocimiento de entrenamiento y no con el registro actual, mismo patrón de D-01». Es el segundo caso donde la evidencia verificada le gana a la afirmación de una IA.
- **Cómo lo verifiqué:** `gh api repos/actions/checkout/git/matching-refs/tags/v7` → `refs/tags/v7`, `v7.0.0`, `v7.0.1`. La ejecución real del CI en el PR #2 (run `37695191075`, commit `782f63a`) terminó en verde: `Run actions/checkout@v7` → success, lint limpio, 3 tests pasan y cobertura de la capa de negocio 100 %.
- **Qué salió de aquí:** una mejora del revisor en una rama aparte (`feature/verify-remote-versions` en `~/.claude/scripts`): el motor resuelve contra GitHub, PyPI y npm cada versión que agrega el diff y se la pasa al revisor como evidencia verificada; solo puede afirmar que una versión no existe si el registro lo dice. Mientras esa mejora no esté activa o `ci.yml` no llegue a `main`, cada push que toque `ci.yml` vuelve a bloquearse con este mismo hallazgo falso (documentado en el PR #2).
- **Prompt relacionado:** Prompts 10 y 11 en `docs/ai/prompts-log.md`
