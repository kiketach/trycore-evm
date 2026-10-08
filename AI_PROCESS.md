# Proceso con IA

Este documento resume cómo trabajé con IA durante la prueba. Los prompts y las decisiones se registraron durante el desarrollo; esta síntesis se redactó al preparar la entrega. Distingo lo que propuso la IA, lo que decidí y la evidencia que usé para verificarlo.

## 1. Herramientas de IA y por qué las elegí

Usé Claude Code usando OPUS 5.5 como programador par, guiado por los prompts que envié durante el ejercicio. En el primer prompt le pedí que me enseñara lo que no sabía, cuestionara mis decisiones y explicara el porqué, porque después tenía que poder contar el proyecto en un video con mis palabras.

Lo usé para proponer la arquitectura y el orden de trabajo, implementar cambios, escribir pruebas y documentación y corregir problemas encontrados en las revisiones. Me resultaba útil trabajar sobre el mismo repositorio y avanzar por ramas pequeñas, en vez de recibir una solución completa que después no pudiera explicar.

Gemini fue el revisor local del hook pre-push, que hacía una revisión automatizada antes de cada push. Esa revisión y el CI eran ayudas, no sustitutos de revisar el diff y comprobar la interfaz.

También usé un asistente personal de IA apoyado de un Harness propio y local distinto de Claude Code usando Gemini 3.8 flash para comprender los conceptos del proyecto y revisar y mejorar los prompts antes de enviarlos. Me ayudó a aclarar lo que necesitaba pedir; eso no reemplazó mi responsabilidad de entender y verificar el resultado.

**Fuentes:** primer prompt en `docs/ai/prompts-log.md`, historial de PRs y `DECISIONS.md`.

## 2. Prompts (textuales, en orden cronológico)

Los prompts textuales están en [`docs/ai/prompts-log.md`](docs/ai/prompts-log.md). El hook `.claude/hooks/log_prompt.py` los registra automáticamente al enviarlos. No los reconstruí al final ni reescribí el historial para que pareciera más ordenado.

El proceso fue iterativo. Revisaba cada PR en GitHub, identificaba qué faltaba o qué no entendía y formulaba el siguiente pedido a partir de eso. Los prompts pasaron de aprender EVM y definir el plan a pedir cambios concretos, pruebas de casos borde y correcciones visuales.

Gestioné 15 PRs: 14 se integraron y el #8 se cerró y reemplazó por el #9 al cambiar el nombre de la rama. Trabajé con Gitflow, usando ramas `feature/*`, `bugfix/*` y `release/*`, y con mensajes de commit descriptivos en imperativo. No mergeé un PR sin revisión; cuando aparecían hallazgos, pedía correcciones y esperaba el CI en verde antes de integrarlo.

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
