# Registro de prompts

> Nota: se omitieron las notificaciones automáticas de la herramienta (avisos de comandos en segundo plano), que no son prompts míos.

Cada prompt enviado a Claude Code en este proyecto, textual y en orden cronológico.
Lo escribe automáticamente el hook `.claude/hooks/log_prompt.py`; no se edita a mano.
Es la fuente de la sección «Prompts» de `AI_PROCESS.md`.

## Prompt 1 · 2026-10-07 11:14

~~~~text
# Contexto y encargo para Claude Code

Voy a desarrollar la prueba técnica de Trycore para el cargo de Ingeniero de Desarrollo IA. Quiero que actúes como ingeniero de software senior y como par de trabajo: que me enseñes lo que no sé, cuestiones mis decisiones y me expliques el porqué, porque después tengo que explicarlo todo en un video, con mis palabras y sin leer.

## 1. El reto
El enunciado completo está en docs/reto/desafio-trycore.md y las reglas del proyecto en CLAUDE.md. Léelos completos antes de responder.

Resumen: una app fullstack para que líderes de proyecto registren sus actividades y vean en tiempo real los indicadores de Valor Ganado (Earned Value Management). La fecha límite es el jueves 8 de octubre a las 5:00 p. m.

## 2. Qué vamos a construir
- Backend: FastAPI + PostgreSQL (con Docker Compose), API REST con CRUD de proyectos y actividades.
- Cada actividad tiene: nombre, BAC (presupuesto), % de avance planeado, % de avance real y AC (costo real).
- Cálculo por actividad y consolidado por proyecto: PV = %plan × BAC, EV = %real × BAC, CV = EV − AC, SV = EV − PV, CPI = EV / AC, SPI = EV / PV, EAC = BAC / CPI, VAC = BAC − EAC.
- Un endpoint que devuelva la interpretación de CPI y SPI: bajo o sobre presupuesto, adelantado o atrasado.
- Frontend React: tabla editable de actividades con sus indicadores, indicadores consolidados del proyecto, estado visual de CPI y SPI, y una gráfica que compare PV, EV y AC por actividad. Un diseño simple está bien.

## 3. Calidad obligatoria
Tests unitarios de toda la lógica EVM, incluidos los casos borde (AC = 0, proyecto sin actividades, 0 % de avance); cobertura mínima del 80 % en la capa de negocio; un test de integración por endpoint; linter configurado; cero código comentado y cero variables sin usar; Gitflow estricto con main, develop, feature/* con PR aunque trabaje solo y al menos un release/* antes del merge final a main; commits en imperativo y descriptivos; OpenAPI en /api-docs; README con los pasos para correr en local y el script de inicialización de la BD.

## 4. Registro del proceso
- Mis prompts se guardan solos en docs/ai/prompts-log.md.
- Mantén DECISIONS.md: cada vez que yo rechace o modifique una sugerencia tuya, propón la entrada en ese momento, con lo que propusiste, lo que decidí y mi razón en mis palabras. Si mi razón no está clara, pregúntamela.
- Nunca inventes prompts, decisiones ni razones.

## 5. Primer encargo (no escribas código todavía)
1. Explícame EVM como a alguien que nunca lo ha visto: qué mide cada indicador (PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC), cómo se relacionan y cómo se interpretan. Incluye un ejemplo con una actividad y números concretos que yo pueda verificar a mano, y luego hazme 3 preguntas para comprobar que lo entendí.
2. Analiza los casos borde: qué debería devolver cada indicador cuando AC = 0, PV = 0, CPI = 0, no hay actividades o el avance es 0 %. Propón cómo manejar cada uno y explica por qué.
3. Explica cómo se consolida por proyecto: si los índices del proyecto se calculan sumando PV, EV, AC y BAC, o promediando los índices de cada actividad, y cuál es la forma correcta.
4. Propón la arquitectura: capas, estructura de carpetas, modelo de datos, endpoints y cómo vas a probar los cálculos. Para cada decisión importante dame la opción, una o dos alternativas descartadas, el porqué y el riesgo.
5. Propón el plan de ramas feature/* en el orden en que las haríamos.

Después de eso, detente y espera mi aprobación antes de crear el repo o escribir código.
~~~~

## Prompt 2 · 2026-10-07 11:57

~~~~text
Pregunta 1: PV = 0,25 × 20.000 = 5.000; EV = 0,50 × 20.000 = 10.000; CPI = 10.000 / 12.000 ≈ 0,83; SPI = 10.000 / 5.000 = 2,0. La actividad va al doble del ritmo planeado pero con sobrecosto: cada peso gastado rinde 0,83 de valor.

Pregunta 2: si EV = AC, entonces CPI sería siempre 1 y CV siempre 0. Perdería sentido medir costo, porque EVM dejaría de poder detectar si gasto de más o de menos. El EV existe precisamente para comparar el valor del trabajo contra lo que costó lograrlo.

Pregunta 3: SPI = 1,0. Limitación: cuando el plan llega al 100 %, el SPI converge a 1 al completar la actividad, aunque haya terminado tarde. Por eso el SPI solo sirve mientras la actividad está en curso, no para evaluar puntualidad al cierre.

Decisiones:
1. Interpretación embebida en /evm, como propones. Es el mismo cálculo y evita dos llamadas desfasadas.
2. EAC sin datos de desempeño: null. Prefiero no asumir nada que la fórmula no diga; mostrar BAC sin evidencia sería disfrazar el plan de pronóstico.
3. Semáforo de dos colores más gris para "no disponible". Sin umbrales inventados.
4. Sí, agrega cutoff_date al proyecto como campo informativo, fuera de los cálculos. El enunciado habla de fecha de corte y quiero que se vea que lo leí con cuidado.
5. Sí al GitHub Actions mínimo (lint + tests en cada PR). Es poco trabajo y hace visible que todo pasa.

Aprobado el plan. Puedes crear el repo y arrancar con feature/backend-setup. Avísame al terminar cada rama para revisarla antes del merge.
~~~~

## Prompt 3 · 2026-10-07 12:21

~~~~text
Revisé el PR y no lo apruebo todavía. Cambios antes del merge:
1. Configura la cobertura: agrega a pyproject.toml la sección [tool.coverage.run] con source=["app"], [tool.coverage.report] con fail_under=80, y --cov=app en los addopts de pytest, para que el build falle si baja del 80%.
2. En las dependencias dice "httpx2>=2.13.1": ese paquete no existe, TestClient necesita httpx. Corrige y verifica que uv sync funcione desde un clon limpio; revisa también que las versiones de fastapi, pytest y ruff existan.
3. Renombra db/schema.sql a db/init/01_schema.sql, que es la ruta que pide el entregable, y ajusta el compose.
4. Quita del cuerpo del PR la mención al "dsh" o explícala; un revisor externo no sabe qué es.
5. Verifica que los links del README a AI_PROCESS.md, DECISIONS.md y docs/ai/prompts-log.md no estén rotos en esta rama.

Cuando estén los cambios vuelvo a revisar y ahí sí te doy el aprobado.
~~~~

## Prompt 4 · 2026-10-07 12:42

~~~~text
Ajusta el registro de prompts en docs/ai/prompts-log.md: está capturando también los <task-notification> de comandos en segundo plano y los wrappers <pasted_content>, y eso no son prompts míos. Quiero que el log registre únicamente mis mensajes reales, con su texto limpio, en orden cronológico. Limpia los que ya quedaron registrados y deja al inicio del archivo una nota de una línea diciendo que se omitieron las notificaciones automáticas de la herramienta.
~~~~

## Prompt 5 · 2026-10-07 12:46

~~~~text
Buenas preguntas, aquí van mis razones:

Punto 2 (httpx2): acepto tu respuesta. Verifiqué y httpx2 sí existe, es el cliente HTTP de nueva generación de Tom Christie. Regístralo en DECISIONS.md como decisión donde tú tenías razón y yo no: propuse cambiarlo basándome en el nombre inusual, y tu evidencia del paquete y la dependencia de Starlette me corrigió. Aun así, deja como tarea pendiente correr uv sync desde un clon limpio antes de la entrega.

Punto 3 (ruta del esquema): mi razón no es que el enunciado fije la ruta, es de consistencia y legibilidad. El plan de arquitectura que aprobé decía db/init/01_schema.sql montado en docker-entrypoint-initdb.d, y quiero que el script de inicialización de la BD sea evidente para quien evalúa, porque el enunciado sí pide un script de inicialización visible.

Punto 1 (alcance de la cobertura): el enunciado pide 80% en la capa de negocio, así que mide sobre domain y services, no sobre todo app; routers y schemas no son lógica de negocio e inflarían el denominador. Y la exijo desde ya para que ninguna rama pueda bajar del 80% sin que el build falle.

Con eso redacta las entradas de DECISIONS.md y muéstramelas antes de escribirlas.
~~~~

## Prompt 6 · 2026-10-07 12:51

~~~~text
Aprobadas las tres entradas tal cual. Escríbelas en DECISIONS.md, haz commit, pasa la revisión y sube el push al PR #1. Cuando el PR esté actualizado me avisas para la revisión final y el aprobado del merge.
~~~~

## Prompt 7 · 2026-10-07 12:57

~~~~text
Gracias por reportarlo con esa claridad. Decisiones:
1. Sí, termina la revisión completa del diff sin interrumpirla. Si hay hallazgos, me los traes antes de cualquier push.
2. Sí, propón el cambio al hook pre-push para que PARTIAL también bloquee, igual que un fallo. Muéstrame el diff del script antes de aplicarlo, porque es mi configuración global.
3. Registra este incidente como entrada adicional en DECISIONS.md: qué pasó (push con revisión en PARTIAL por detener el proceso a la fuerza), cómo se detectó, cómo se corrigió y qué cambio de proceso sale de aquí. Un fallo de proceso corregido con evidencia vale más que un historial perfecto.
~~~~

## Prompt 8 · 2026-10-07 16:43

~~~~text
Aprobadas las dos propuestas. Aplica el diff al hook global, repite la prueba de kill en el repo aislado contra el hook real, escribe D-04, haz commit, pasa la revisión y sube el push al PR #1. Cuando quede, me avisas para la revisión final y el aprobado del merge. Y deja explícito en D-04 lo que dijiste al final: kill -9 y taskkill /F no se pueden atrapar, por eso la regla de no interrumpir sigue siendo la primera defensa.
~~~~

## Prompt 9 · 2026-10-07 16:53

~~~~text
Aprobado el PR #1 con dos ajustes mínimos antes del merge: actualiza la descripción del PR para que liste D-01 a D-04 (ya no "se está documentando"), y agrega en DECISIONS.md una glosa de una línea explicando qué es "dsh" en la entrada D-04. Con esos dos cambios haz el merge a develop y arranca feature/ci-pipeline.
~~~~

## Prompt 10 · 2026-10-07 17:11

~~~~text
Adjudicación: el hallazgo queda descartado. Verifiqué independientemente que actions/checkout v7.0.1 existe y es la última release; el revisor razonó con conocimiento de entrenamiento y no con el registro actual, mismo patrón de D-01. Se mantiene actions/checkout@v7 y astral-sh/setup-uv@v10.2.0. Yo mismo hago el push con SKIP_REVIEW=1 git push origin feature/ci-pipeline desde mi terminal, y la ejecución del CI en el PR #2 será la prueba real. Y sí: registra el hallazgo descartado en DECISIONS.md, como segundo caso donde la evidencia verificada le gana a la afirmación de una IA. Además, propongo mejorar el revisor para que antes de afirmar que una versión no existe consulte las etiquetas remotas (gh api o actionlint con verificación remota); propón ese cambio en una rama aparte, no en esta.
~~~~

## Prompt 11 · 2026-10-07 17:20

~~~~text
Aprobado el diseño. Crea la rama feature/verify-remote-versions en ~/.claude/scripts e impleméntalo: el motor resuelve las referencias con versión del diff contra sus registros reales (gh api para actions, PyPI para pyproject, npm para package.json) antes de llamar al revisor, le pasa el resultado como evidencia verificada, y la rúbrica nueva solo permite afirmar que una versión no existe cuando la evidencia del registro lo dice. Si el registro no responde, no cuenta como verificado. Incluye los cuatro tests que propones. Y ojo: mientras esa mejora no esté o ci.yml no llegue a main, cada push que toque ci.yml volverá a bloquearse con el mismo hallazgo falso, así que documenta eso en la descripción del PR.
~~~~
