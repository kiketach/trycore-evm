# Proceso con IA

Este documento resume cómo trabajé con IA durante la prueba. Los prompts y las decisiones se registraron durante el desarrollo; esta síntesis se redactó al preparar la entrega. Distingo lo que propuso la IA, lo que decidí y la evidencia que usé para verificarlo.

## 1. Herramientas de IA y por qué las elegí

Usé Claude Code usando OPUS 5.5 como programador par, guiado por los prompts que envié durante el ejercicio. En el primer prompt le pedí que me enseñara lo que no sabía, cuestionara mis decisiones y explicara el porqué, porque después tenía que poder contar el proyecto en un video con mis palabras.

Lo usé para proponer la arquitectura y el orden de trabajo, implementar cambios, escribir pruebas y documentación y corregir problemas encontrados en las revisiones. Me resultaba útil trabajar sobre el mismo repositorio y avanzar por ramas pequeñas, en vez de recibir una solución completa que después no pudiera explicar.

Gemini fue el revisor local del hook pre-push, que hacía una revisión automatizada antes de cada push. Esa revisión y el CI eran ayudas, no sustitutos de revisar el diff y comprobar la interfaz.

También usé un asistente personal de IA apoyado de un Harness propio y local distinto de Claude Code usando Gemini 3.8 flash para comprender los conceptos del proyecto y revisar y mejorar los prompts antes de enviarlos. Me ayudó a aclarar lo que necesitaba pedir; eso no reemplazó mi responsabilidad de entender y verificar el resultado.

**Fuentes:** primer prompt en `docs/ai/prompts-log.md`, historial de PRs y `DECISIONS.md`.

## 2. Prompts (textuales, en orden cronológico)

Abajo están copiados, textualmente y en orden cronológico, los prompts 1 a 33 que envié, tal como los registró el hook `.claude/hooks/log_prompt.py` en [`docs/ai/prompts-log.md`](docs/ai/prompts-log.md) al enviarlos. No los reconstruí al final ni reescribí el historial para que pareciera más ordenado. El registro continúa en `docs/ai/prompts-log.md` con los prompts enviados después de esta copia.

El proceso fue iterativo. Revisaba cada PR en GitHub, identificaba qué faltaba o qué no entendía y formulaba el siguiente pedido a partir de eso. Los prompts pasaron de aprender EVM y definir el plan a pedir cambios concretos, pruebas de casos borde y correcciones visuales.

Gestioné 17 PRs: 16 se integraron y el #8 se cerró y reemplazó por el #9 al cambiar el nombre de la rama. Trabajé con Gitflow, usando ramas `feature/*`, `bugfix/*` y `release/*`, y con mensajes de commit descriptivos en imperativo. No mergeé un PR sin revisión; cuando aparecían hallazgos, pedía correcciones y esperaba el CI en verde antes de integrarlo.

### Prompts 1 a 33

#### Prompt 1 · 2026-10-07 11:14

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

#### Prompt 2 · 2026-10-07 11:57

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

#### Prompt 3 · 2026-10-07 12:21

~~~~text
Revisé el PR y no lo apruebo todavía. Cambios antes del merge:
1. Configura la cobertura: agrega a pyproject.toml la sección [tool.coverage.run] con source=["app"], [tool.coverage.report] con fail_under=80, y --cov=app en los addopts de pytest, para que el build falle si baja del 80%.
2. En las dependencias dice "httpx2>=2.13.1": ese paquete no existe, TestClient necesita httpx. Corrige y verifica que uv sync funcione desde un clon limpio; revisa también que las versiones de fastapi, pytest y ruff existan.
3. Renombra db/schema.sql a db/init/01_schema.sql, que es la ruta que pide el entregable, y ajusta el compose.
4. Quita del cuerpo del PR la mención al "dsh" o explícala; un revisor externo no sabe qué es.
5. Verifica que los links del README a AI_PROCESS.md, DECISIONS.md y docs/ai/prompts-log.md no estén rotos en esta rama.

Cuando estén los cambios vuelvo a revisar y ahí sí te doy el aprobado.
~~~~

#### Prompt 4 · 2026-10-07 12:42

~~~~text
Ajusta el registro de prompts en docs/ai/prompts-log.md: está capturando también los <task-notification> de comandos en segundo plano y los wrappers <pasted_content>, y eso no son prompts míos. Quiero que el log registre únicamente mis mensajes reales, con su texto limpio, en orden cronológico. Limpia los que ya quedaron registrados y deja al inicio del archivo una nota de una línea diciendo que se omitieron las notificaciones automáticas de la herramienta.
~~~~

#### Prompt 5 · 2026-10-07 12:46

~~~~text
Buenas preguntas, aquí van mis razones:

Punto 2 (httpx2): acepto tu respuesta. Verifiqué y httpx2 sí existe, es el cliente HTTP de nueva generación de Tom Christie. Regístralo en DECISIONS.md como decisión donde tú tenías razón y yo no: propuse cambiarlo basándome en el nombre inusual, y tu evidencia del paquete y la dependencia de Starlette me corrigió. Aun así, deja como tarea pendiente correr uv sync desde un clon limpio antes de la entrega.

Punto 3 (ruta del esquema): mi razón no es que el enunciado fije la ruta, es de consistencia y legibilidad. El plan de arquitectura que aprobé decía db/init/01_schema.sql montado en docker-entrypoint-initdb.d, y quiero que el script de inicialización de la BD sea evidente para quien evalúa, porque el enunciado sí pide un script de inicialización visible.

Punto 1 (alcance de la cobertura): el enunciado pide 80% en la capa de negocio, así que mide sobre domain y services, no sobre todo app; routers y schemas no son lógica de negocio e inflarían el denominador. Y la exijo desde ya para que ninguna rama pueda bajar del 80% sin que el build falle.

Con eso redacta las entradas de DECISIONS.md y muéstramelas antes de escribirlas.
~~~~

#### Prompt 6 · 2026-10-07 12:51

~~~~text
Aprobadas las tres entradas tal cual. Escríbelas en DECISIONS.md, haz commit, pasa la revisión y sube el push al PR #1. Cuando el PR esté actualizado me avisas para la revisión final y el aprobado del merge.
~~~~

#### Prompt 7 · 2026-10-07 12:57

~~~~text
Gracias por reportarlo con esa claridad. Decisiones:
1. Sí, termina la revisión completa del diff sin interrumpirla. Si hay hallazgos, me los traes antes de cualquier push.
2. Sí, propón el cambio al hook pre-push para que PARTIAL también bloquee, igual que un fallo. Muéstrame el diff del script antes de aplicarlo, porque es mi configuración global.
3. Registra este incidente como entrada adicional en DECISIONS.md: qué pasó (push con revisión en PARTIAL por detener el proceso a la fuerza), cómo se detectó, cómo se corrigió y qué cambio de proceso sale de aquí. Un fallo de proceso corregido con evidencia vale más que un historial perfecto.
~~~~

#### Prompt 8 · 2026-10-07 16:43

~~~~text
Aprobadas las dos propuestas. Aplica el diff al hook global, repite la prueba de kill en el repo aislado contra el hook real, escribe D-04, haz commit, pasa la revisión y sube el push al PR #1. Cuando quede, me avisas para la revisión final y el aprobado del merge. Y deja explícito en D-04 lo que dijiste al final: kill -9 y taskkill /F no se pueden atrapar, por eso la regla de no interrumpir sigue siendo la primera defensa.
~~~~

#### Prompt 9 · 2026-10-07 16:53

~~~~text
Aprobado el PR #1 con dos ajustes mínimos antes del merge: actualiza la descripción del PR para que liste D-01 a D-04 (ya no "se está documentando"), y agrega en DECISIONS.md una glosa de una línea explicando qué es "dsh" en la entrada D-04. Con esos dos cambios haz el merge a develop y arranca feature/ci-pipeline.
~~~~

#### Prompt 10 · 2026-10-07 17:11

~~~~text
Adjudicación: el hallazgo queda descartado. Verifiqué independientemente que actions/checkout v7.0.1 existe y es la última release; el revisor razonó con conocimiento de entrenamiento y no con el registro actual, mismo patrón de D-01. Se mantiene actions/checkout@v7 y astral-sh/setup-uv@v10.2.0. Yo mismo hago el push con SKIP_REVIEW=1 git push origin feature/ci-pipeline desde mi terminal, y la ejecución del CI en el PR #2 será la prueba real. Y sí: registra el hallazgo descartado en DECISIONS.md, como segundo caso donde la evidencia verificada le gana a la afirmación de una IA. Además, propongo mejorar el revisor para que antes de afirmar que una versión no existe consulte las etiquetas remotas (gh api o actionlint con verificación remota); propón ese cambio en una rama aparte, no en esta.
~~~~

#### Prompt 11 · 2026-10-07 17:20

~~~~text
Aprobado el diseño. Crea la rama feature/verify-remote-versions en ~/.claude/scripts e impleméntalo: el motor resuelve las referencias con versión del diff contra sus registros reales (gh api para actions, PyPI para pyproject, npm para package.json) antes de llamar al revisor, le pasa el resultado como evidencia verificada, y la rúbrica nueva solo permite afirmar que una versión no existe cuando la evidencia del registro lo dice. Si el registro no responde, no cuenta como verificado. Incluye los cuatro tests que propones. Y ojo: mientras esa mejora no esté o ci.yml no llegue a main, cada push que toque ci.yml volverá a bloquearse con el mismo hallazgo falso, así que documenta eso en la descripción del PR.
~~~~

#### Prompt 12 · 2026-10-07 17:34

~~~~text
Aprobado el PR #2 con dos correcciones de documentación: (1) sí, cambia "volverá a bloquearse" por "puede volver a bloquearse" en la descripción del PR y en D-05, porque el revisor no es determinista; (2) en la sección Verification del PR todavía aparece setup-uv@v10 como referencia verificada, y contradice el arreglo documentado: cámbialo a @v10.2.0. Con eso haz el merge a develop y sigue con feature/evm-domain. Y sobre la mejora del revisor: aprobada, yo mismo activé la rama en mi terminal.
~~~~

#### Prompt 13 · 2026-10-07 17:49

~~~~text
<ide_opened_file>The user opened the file c:\Users\eabri\Documents\Proyectos\Trycore\docs\ai\prompts-log.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
Aprobado el PR #3 para merge a develop. Antes de mergear, agrega el test de pureza: uno que verifique que importar app.domain.evm no jala fastapi ni sqlalchemy (revisando sys.modules). Es el único criterio que un evaluador podría preguntar y hoy solo se cumple por inspección. Si toma más, déjalo y documenta en el PR por qué queda fuera. Después sigue con feature/projects-crud.
~~~~

#### Prompt 14 · 2026-10-07 17:59

~~~~text
Vi en el log que el hook revisa origin/main...HEAD, o sea el proyecto entero en cada push. Cámbialo para que compare contra origin/develop...HEAD: cada revisión se enfoca solo en el diff de la rama, más rápida y con más profundidad donde importa. Si hay razón para mantener main como base en el release final, déjalo solo para release/*.
~~~~

#### Prompt 15 · 2026-10-07 18:02

~~~~text
Aprobado el PR #4 con dos tests más antes del merge, porque hoy el PR afirma cosas que la suite no ejercita: (1) un test de integración que cree una actividad, borre su proyecto y verifique que ambas filas desaparecen, para probar la cascada de verdad; (2) un test que haga PUT cambiando un campo y verifique que updated_at avanzó y created_at no cambió (ojo: con la fixture de transacción externa el now() de Postgres no avanza dentro de la misma transacción, así que plantéalo en transacciones separadas). Con esos dos en verde, merge y sigue con feature/activities-crud.
~~~~

#### Prompt 16 · 2026-10-07 18:14

~~~~text
Aprobado el PR #5 con un ajuste pequeño antes del merge: el test de PUT con valores inválidos solo afirma el 422, pero el PR dice que cada caso verifica el campo exacto rechazado; alinéalo con el de POST verificando el loc del error. Agrega también el caso del valor máximo aceptado (999999999999.99) para probar que el límite no rechaza de más. Con eso, merge y dale con feature/evm-endpoint. Vamos bien
~~~~

#### Prompt 17 · 2026-10-07 18:42

~~~~text
Aprueba el PR #6 y mérgealo en develop. Actualiza tu rama con los 91 tests. Ahora abre la rama frontend-setup: inicializa el proyecto frontend, conecta con el backend, y abre PR #7. Pide mi revisión antes de mergear.
~~~~

#### Prompt 18 · 2026-10-07 20:50

~~~~text
Aprueba el PR #7 y mérgelo en develop. Después abre la rama fix/rounding-status-exact desde develop: en el dominio EVM, calcula cost_status y schedule_status sobre los índices exactos sin redondear; el redondeo a 2 decimales solo aplica a lo que se muestra. Actualiza los tests unitarios (casos 0.9996 abajo, 1.0004 arriba y exacto), agrega el caso de límite en integración, y registra la decisión D-06 en DECISIONS.md. Abre PR #8 y pide mi revisión antes de mergear.
~~~~

#### Prompt 19 · 2026-10-07 21:37

~~~~text
El número exacto es la verdad del proyecto; el redondeo es solo presentación. Que una etiqueta cambie por 0.0004 de redondeo le miente a quien toma decisiones. Prefiero mostrar 1,00 en rojo y explicarlo, a mostrar 1,00 en verde y que sea falso. Escribe D-06 en DECISIONS.md con esa razón y súbela al PR. Después renombra la rama a bugfix/rounding-status-exact siguiendo Gitflow, y cuando esté todo, mérgelo en develop. Avísame el SHA del merge y abre feature/activities-table como PR #9. Pide mi revisión antes de mergear
~~~~

#### Prompt 20 · 2026-10-07 22:04

~~~~text
Aprueba el PR #10 y mérgelo en develop. Después abre feature/evm-dashboard como PR #11: indicadores consolidados del proyecto, semáforo de CPI y SPI, gráfica PV/EV/AC, y tooltip con el valor exacto en los índices para explicar el 1,00 en rojo de D-06. Pide mi revisión antes de mergear.
~~~~

#### Prompt 21 · 2026-10-08 08:12

~~~~text
Hay  2 problemas en el PR #11, corrígelos en la misma rama: (1) el tooltip del valor exacto lo redondea a 6 decimales en format.ts, así un cpi_exact de 0,9999996 se muestra como 1,00 y el tooltip deja de explicar el estado; muestra el valor tal como llega del backend o usa precisión adaptativa que nunca colapse un valor distinto de 1 en 1,00, y agrega tests de esos casos límite. (2) En la tabla, la celda CPI/SPI (IndexValue/IndicatorCells) solo tiene ícono aria-hidden y número: el estado no es accesible por teclado ni por lector de pantalla. Agrega el texto de estado accesible en la celda y un test. Sube los cambios al PR #11 y avísame para nueva revisión.
~~~~

#### Prompt 22 · 2026-10-08 08:33

~~~~text
Aprueba el PR #11 y mérgelo en develop. Después abre feature/demo-data-and-docs como PR #12: datos de demostración para el video (el proyecto de ejemplo completo) y el README final. Pide mi revisión antes de mergear
~~~~

#### Prompt 23 · 2026-10-08 09:07

~~~~text
2 correcciones para el PR #12, súbelas en la misma rama: (1) seed_demo.py no es atómico: delete_project, create_project y cada create_activity commitean por separado; si falla una inserción queda el demo viejo borrado y el nuevo incompleto. Envuelve todo el reemplazo en una sola transacción y agrega un test de fallo a mitad. (2) El README dice que la BD caída responde 503 en los endpoints, pero eso solo pasa en /health; en /projects da 500. Ajusta el texto. Además, si es rápido, parametriza el test del seed para fijar los CPI/SPI de cada actividad, no solo el resumen del proyecto. Avísame para nueva revisión
~~~~

#### Prompt 24 · 2026-10-08 09:34

~~~~text
Aprueba el PR #12 y mérgelo en develop. Ahora la compuerta 3: repite la instalación desde un clon limpio (uv sync --locked, seed, pytest, npm ci, tests, build), y si todo pasa abre release/1.0.0 hacia main. Avísame con el resultado antes de mergear a main.
~~~~

#### Prompt 25 · 2026-10-08 09:50

~~~~text
ok espero
~~~~

#### Prompt 26 · 2026-10-08 10:03

~~~~text
Revisa el log más reciente en logs/, la revisión del hook sigue avanzando (líneas nuevas, marcas de tiempo recientes) o está congelada?
~~~~

#### Prompt 27 · 2026-10-08 10:27

~~~~text
Aprueba el PR #13. Sigue Gitflow: merge a main, etiqueta v1.0.0 en main, y merge de main de vuelta a develop. Después abre feature/ui-polish como PR #14: mejora los estilos de botones y tarjetas y haz la tabla de actividades responsive sin scroll lateral. Mantén la estructura actual, sin sidebar. Pide mi revisión antes de mergear. La idea es hacer la interfaz mas intuitiva y facil de leer a primera vista
~~~~

#### Prompt 28 · 2026-10-08 11:11

~~~~text
Aprueba el PR #14 y mérgelo en develop. Después abre fix/number-wrapping como PR #15: los indicadores de la tabla no deben partir números a la mitad - ajusta anchos de columna, fuente o formato compacto para que montos de 7+ dígitos quepan en una línea a 1280px; y corrige el recorte del primer dígito en las etiquetas del eje Y de la gráfica. Pide mi revisión antes de mergear.
~~~~

#### Prompt 29 · 2026-10-08 11:39

~~~~text
Un ajuste que me di cuenta en el PR #15: a 1280px los montos negativos menores de un millón (ej. -999.999,99, unos 79px con la fuente del sistema) se salen 2px de la celda y se pegan visualmente con el valor de al lado. Dale más ancho a las columnas de indicadores para el negativo más largo posible en cualquier fuente de respaldo, sin abreviar 999.999,99. Verifica con capturas a 1440/1280/1279/390 con montos negativos grandes, y súbelo al mismo PR. Anota también como pendiente conocido que en celular las tarjetas del resumen se desbordan con montos enormes (existía desde antes, no es de este PR)
~~~~

#### Prompt 30 · 2026-10-08 12:04

~~~~text
Mergea el PR #15 a develop. Después cierra la entrega con Gitflow: crea release/1.0.1 desde develop con el bump de versión, abre PR a main, y cuando lo apruebe: merge, tag v1.0.1, y back-merge de main a develop
~~~~

#### Prompt 31 · 2026-10-08 12:47

~~~~text
Commitea el AI_PROCESS.md en develop es una bitacora que agregué del proceso de trabajo y actualiza release/1.0.1 con develop para que el PR #16 incluya el documento final. Después del push espero el CI del PR #16
~~~~

#### Prompt 32 · 2026-10-08 12:52

~~~~text
En AI_PROCESS.md, en la sección 2, cambia la frase «Gestioné 15 PRs: 14 se integraron» por «Gestioné 17 PRs: 16 se integraron» (el #16 es el release 1.0.1 y el #17 es este documento). Haz el commit en esta misma rama feature/ai-process-doc, push, y abre el PR a develop. Avisa cuando el CI esté en verde
~~~~

#### Prompt 33 · 2026-10-08 13:20

~~~~text
Mergea el PR #17 a develop. Después actualiza release/1.0.1 con un merge de develop, push, y espera el CI del PR #16.
~~~~

**Fuentes:** registro de prompts e historial de PRs.

## 3. Cómo aprendí EVM

Empecé pidiendo una explicación desde cero: qué mide cada indicador, cómo se relacionan las fórmulas, cómo se interpreta cada resultado y qué pasa cuando falta información. También pedí preguntas para comprobar si lo había entendido y un ejemplo que pudiera calcular a mano antes de implementar el dominio.

La distinción más importante fue separar el valor del trabajo del dinero gastado:

- **BAC** es el presupuesto total aprobado.
- **PV** es el valor presupuestado del trabajo que debería estar hecho: `BAC × % planeado`.
- **EV** es el valor presupuestado del trabajo realmente hecho: `BAC × % real`.
- **AC** es el costo real registrado.

EV no es gasto, ingreso ni utilidad. Si lo igualara a AC, CPI siempre sería 1 y CV siempre sería 0: dejaría de poder detectar sobrecostos.

En el ejercicio del prompt 2 calculé una actividad con BAC de 20.000, avance planeado del 25 %, avance real del 50 % y AC de 12.000:

```text
PV  = 20.000 × 0,25 = 5.000
EV  = 20.000 × 0,50 = 10.000
CV  = 10.000 − 12.000 = −2.000
SV  = 10.000 − 5.000 = 5.000
CPI = 10.000 / 12.000 ≈ 0,83
SPI = 10.000 / 5.000 = 2,00
EAC = 20.000 / (10.000 / 12.000) = 24.000
VAC = 20.000 − 24.000 = −4.000
```

La actividad va adelantada frente al plan, pero tiene sobrecosto. No son resultados contradictorios: tiempo y costo responden preguntas distintas. EAC supone que la eficiencia actual se mantiene; no es una promesa de costo final.

Aprendí también que el consolidado suma BAC, PV, EV y AC y después calcula los índices. No se promedian los CPI o SPI de las actividades. Además, SPI puede volver a 1 al completar el trabajo aunque se haya terminado tarde, por lo que no reemplaza una comparación de fechas al cierre.

Contrasté las explicaciones con los cálculos manuales, los casos borde y las pruebas del dominio. No atribuyo aquí consultas a fuentes externas que no quedaron registradas.

**Fuentes:** prompts 1 y 2, README y pruebas de `backend/app/domain/evm`.

## 4. Decisiones donde no seguí a la IA

### D-06: interpretar el índice exacto, no el redondeado

La propuesta inicial era redondear CPI y SPI a dos decimales y decidir el estado sobre ese valor, para que la etiqueta coincidiera con el número mostrado. Al revisar esa regla, pedí cambiarla: el estado debe depender del índice exacto y el redondeo debe ser solo presentación.

Un CPI de 0,9996 puede mostrarse como 1,00, pero sigue siendo menor que 1 y significa sobrecosto. Uno de 1,0004 también puede verse como 1,00, pero significa bajo presupuesto. Solo exactamente 1 es neutral. Mi razón fue que el redondeo no debe cambiar la verdad del proyecto para quien toma decisiones.

La corrección quedó en el PR #9. Se verificaron los límites con pruebas unitarias y de integración. Después se agregó el detalle de precisión en la interfaz, accesible con cursor y teclado, para explicar por qué un 1,00 puede tener un estado desfavorable.

### D-03: cobertura en la capa de negocio desde el inicio

La IA propuso activar el umbral del 80 % cuando existiera el dominio EVM. Pedí exigirlo desde la primera rama del backend. También corregí mi pedido inicial de medir todo `app`: el alcance correcto era `domain` y `services`, porque routers y esquemas no son la lógica de negocio.

No bastaba con mostrar un porcentaje alto; había que comprobar que el umbral fallara cuando la cobertura quedaba por debajo del mínimo.

### D-05 y D-01: la evidencia también puede corregirme a mí

En D-05, el revisor de IA afirmó que `actions/checkout@v7` no existía. Contrasté esa afirmación con las etiquetas remotas y la ejecución real del CI y descarté el hallazgo. No acepté bajar la versión solo porque el revisor lo dijera.

En D-01 ocurrió lo contrario: yo cuestioné `httpx2` porque el nombre me pareció sospechoso, pero la evidencia mostró que existía y que Starlette lo usaba. Rectifiqué. Revisar a la IA no significa llevarle la contraria siempre.

### Correcciones de interfaz que los tests no detectaron

Las pruebas visuales encontraron problemas que no quedaban resueltos con el CI en verde: etiquetas del eje Y recortadas, cifras partidas en dos líneas y un dashboard difícil de leer. El ajuste de columnas también produjo encabezados de porcentajes que se pisaban y negativos que quedaban pegados al valor vecino.

Pedí corregirlos y volver a comprobarlos con montos grandes y negativos. En ese ciclo se llegó a dimensionar columnas en unidades `ch`, en lugar de píxeles fijos, y a cambiar de tabla a tarjetas cuando el contenido no cabe según la fuente real. No presento esa solución como una idea que propuse yo desde el inicio: surgió al revisar y corregir el resultado.

**Fuentes:** D-01, D-03, D-05 y D-06 en [`DECISIONS.md`](DECISIONS.md); PRs #9, #11, #14 y #15; registro de prompts.

## 5. Cómo verifiqué que los números tienen sentido

Separé la verificación de cálculo, la de integración y la visual.

### Cálculos y casos borde

Usé valores calculados a mano como resultados esperados, no resultados generados por las mismas fórmulas bajo prueba. Comprobé indicadores por actividad y consolidados, incluyendo que el proyecto suma los valores base antes de calcular los índices.

Verifiqué estos casos:

- AC = 0: CPI no está disponible; no se devuelve cero ni infinito.
- PV = 0: SPI no está disponible.
- CPI = 0 con AC positivo: es un valor válido y significa sobrecosto, pero EAC y VAC no pueden calcularse con esa división.
- Proyecto sin actividades y avance del 0 %.
- Índices justo por debajo de 1, por encima de 1 y exactamente iguales a 1.

El proyecto de demostración permite comprobar lecturas distintas: Login está atrasada y bajo presupuesto; Reportes está adelantada y con sobrecosto; Migración no tiene costo registrado; Casi en presupuesto ejercita el índice exacto de 0,9996. Las pruebas fijan los resultados por actividad y del proyecto completo.

### Ejecución local, integración y clon limpio

No me limité a correr el código en la carpeta donde se había desarrollado. En un clon limpio de `develop`, después del PR #15, ejecuté `uv sync --locked`, el script de demostración, ruff, los tests del backend, `npm ci`, lint, comprobación de tipos, tests y build del frontend.

El resultado fue 103 tests de backend en verde, cobertura del 100 % en la capa de negocio y 86 tests de frontend en verde. Son los resultados de esa verificación, no la cantidad de tests que tuvo cada PR anterior. Las pruebas de integración usan PostgreSQL real y cubren los endpoints; el seed también comprueba rollback si falla una inserción a mitad del reemplazo del demo.

### Verificación visual

Revisé resultados de pruebas locales de la interfaz con capturas reales a 1440, 1280, 1279 y 390 px. Usé cifras largas y negativas, además del ejemplo pequeño. Comprobé que los números no se partieran, que los encabezados no se pisaran y que el eje Y no perdiera dígitos.

El modo tabla o tarjetas depende también de la fuente que realmente se carga, no solo del ancho de la pantalla. No concluyo que 1280 px siempre será una tabla en todos los equipos. También quedaron limitaciones conocidas con montos enormes en el resumen móvil y texto largo dentro de inputs; no afirmo que toda la interfaz quedó perfecta.

### Incidencias y límites de la verificación

Una primera corrida de `npm test` respondió "no tests". La repetí tres veces, una de ellas en un segundo clon recién instalado: las tres dieron 11 archivos y 86 tests en verde. No pude reproducir el fallo y no conozco su causa. El CI del PR #15 también pasó. Lo dejo registrado como anomalía no explicada, no como un error resuelto.

Hubo además un incidente de proceso en D-04: la IA interrumpió una revisión pre-push y algunos commits llegaron al remoto sin que esa revisión terminara. Eso ocurrió en un push, no en un merge de PR. Se hizo una revisión completa posterior y se verificó el bloqueo del hook ante interrupciones. La regla que quedó fue no matar una revisión en curso y no tratar un resultado PARTIAL como aprobación.

**Fuentes:** pruebas del repositorio, README, PRs #12 a #15, D-04 y registro de la compuerta de clon limpio.

## 6. Decisión de arquitectura independiente

No tengo registrada una decisión de arquitectura que pueda atribuirme como una propuesta original, independiente de la IA. La separación en API, servicios, dominio EVM y repositorios, y la elección de FastAPI, React y PostgreSQL, siguieron el plan trabajado con la IA. Mi papel fue revisar ese plan, entender las razones y aprobar o pedir ajustes antes de implementarlo.

Mi intervención propia más clara fue D-06, pero es una decisión de criterio de negocio y presentación, no una nueva arquitectura. Impuse que el estado se calcule sobre el índice exacto. No sería honesto cambiarle el nombre para cumplir esta sección.

D-02 también documenta una intervención mía: exigí volver a la ruta visible de inicialización de la BD acordada en el plan. Eso mejora consistencia y legibilidad, pero tampoco demuestra que yo hubiera inventado la arquitectura.

**Fuentes:** prompt 2 y D-02 y D-06 en `DECISIONS.md`.

## 7. Qué haría diferente

Prepararía antes una matriz de ejemplos manuales, casos borde y estados esperados. Así tendría más claro qué comprobar desde el primer PR y no solo al encontrar una diferencia en pantalla.

También probaría antes la interfaz con negativos, montos grandes, móvil y fuentes de respaldo. Los tests de componentes y el CI pueden pasar aunque una cifra se corte o dos valores queden pegados. La UI debe comunicar bien los resultados, no solo renderizar elementos.

Reservaría más tiempo para completar esta síntesis y ensayar la explicación antes de la entrega. El registro de prompts y decisiones sí se fue haciendo durante el ejercicio, pero llenar `AI_PROCESS.md` al preparar el video deja menos margen para revisar si puedo explicar cada decisión.

Lo principal que aprendí de EVM fue separar avance, costo y proyección: EV no es AC, estar adelantado no significa estar bajo presupuesto y un valor redondeado no debe decidir el estado. Trabajar con IA me enseñó a pedir evidencia concreta y a verificar mis propias objeciones con la misma exigencia. La IA puede acelerar la implementación, pero también puede introducir errores o defender un hallazgo falso. Mi responsabilidad es comprender, revisar y corregir el resultado, no asumir que una respuesta segura es una respuesta correcta.
