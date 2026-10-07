# Registro de prompts

Cada prompt enviado a Claude Code en este proyecto, textual y en orden cronológico.
Lo escribe automáticamente el hook `.claude/hooks/log_prompt.py`; no se edita a mano.
Es la fuente de la sección «Prompts» de `AI_PROCESS.md`.

## Prompt 1 · 2026-10-07 11:14

~~~~text
<pasted_content id="aefa">
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
</pasted_content id="aefa">
~~~~

## Prompt 2 · 2026-10-07 11:57

~~~~text
<pasted_content id="aefa">
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
</pasted_content id="aefa">
~~~~

## Prompt 3 · 2026-10-07 11:58

~~~~text
<task-notification>
<task-id>bjmh22icg</task-id>
<tool-use-id>toolu_01UfCX5EqyaiSyRQwdCHHoDe</tool-use-id>
<output-file>C:\Users\eabri\AppData\Local\Temp\claude\c--Users-eabri-Documents-Proyectos-Trycore\34425560-1b4f-4fa8-9d91-97d682e2c08b\tasks\bjmh22icg.output</output-file>
<status>completed</status>
<summary>Background command "Run local AI review on the initial commit" completed (exit code 0)</summary>
</task-notification>
~~~~
