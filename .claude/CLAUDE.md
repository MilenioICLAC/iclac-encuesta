# CLAUDE.md — Visualizador de la encuesta ICLAC

Contexto para quien retome este repositorio, sea persona o agente. Acá van **las reglas que no
caducan**: lo que se descubrió mirando los datos y que cuesta caro volver a descubrir. **Lo que falta
hacer vive fuera de este repositorio**, en la documentación interna: `la documentación interna` (privado),
`encuesta/docs/estado.md`.

## Qué es

El visualizador de la **Encuesta de Percepciones sobre China en Chile**, que ICLAC levanta una vez al
año. Dos tramos en una sola página, en este orden:

1. **El recorrido**: una narración que se avanza con el scroll y cuenta, hallazgo por hallazgo, qué se
   movió entre oleadas. Hasta ocho tramos, sobre un guion acordado con ICLAC.
2. **El tablero**: diez módulos para consultar una oleada concreta, con selector de año, filtro
   general y agrupación por variable de caracterización.

El tablero **no se inventa**: reconstruye el monitor que ICLAC ya publica en
https://iclac.cl/monitor-de-opinion-publica/, hoy una app Shiny alojada en la cuenta personal de un
tercero (`bastianoleah.shinyapps.io/iclac_encuesta/`). Su código está en la documentación interna,
`encuesta/referencia/monitor_r/`. Reconstruirlo acá es lo que corta esa dependencia.

Tres idiomas: español, inglés y chino.

---

## Los siete hechos de los datos que hay que saber antes de tocar nada

Verificados contra los archivos de `data/sources/`: los cinco primeros el 13-08-2026, el sexto y el
séptimo el 31-08-2026, y los hechos 4, 5 y 6 rehechos el 02-09-2026 sobre las bases canónicas nuevas
(ver `data/sources/README.md`). Ninguno es evidente y todos cambian lo que se puede construir.

### 1. No es un panel. Son tres cortes transversales

Solapamiento de identificadores de panelista entre oleadas: **54** casos entre 2023 y 2024, **47**
entre 2024 y 2025, **37** entre 2023 y 2025, y **15 en las tres**. Eso es reselección al azar desde el
panel de Netquest, no un diseño longitudinal.

**Consecuencia:** no se puede seguir a una persona cambiando de opinión, y **la palabra «panel» no se
usa** para describir el producto: en un instituto de investigación significa datos longitudinales.
«Oleadas» o «la serie». La única acepción válida es «panel en línea», que es el panel de encuestados
de Netquest.

### 2. No hay ponderadores

Ninguna de las tres oleadas trae columna de peso, factor o expansión. Es un panel en línea por cuotas,
así que la muestra **no es probabilística**.

**Consecuencia:** los resultados van **sin ponderar**, sobre los casos efectivos, y **no se declara
margen de error**, porque en una muestra no probabilística no corresponde. Lo que sí se muestra es el
N de cada figura. El cálculo de ponderadores quedó explícitamente fuera del alcance cotizado.

### 3. Mismo nombre de variable no es misma pregunta

23 preguntas comparten nombre en las tres oleadas, cerca del 80% del instrumento. Pero al menos cinco
derivaron:

| Variable | Qué cambió |
|---|---|
| `P4` | de «¿por quién **votó** en la segunda vuelta Boric–Kast?» (2023/2024) a «si la segunda vuelta **fuera hoy**, ¿por quién votaría?» (2025). **Y los códigos significan cosas distintas:** en 2023 y 2024 el 1 es Boric y el 2 es Kast; en 2025 el 1 es Kast y el 2 es Jara |
| `P21` | de inversión **de China** (2023) a inversión **extranjera en general** (2024 y 2025) |
| `P17` | de escala cerrada de 1 a 5 (2023) a respuesta abierta (2024 y 2025) |
| `P15` | los tramos cambiaron entre 2023 y 2024: 20-50 mil → 20-99 mil, 100-150 mil → 100-199 mil |
| `P9` | las categorías cambiaron; «no recuerdo» solo existe en 2025 y se lleva 209 casos |

`P6` además cambió redacción. La base combinada del 01-09 trae derivadas que acotan tres de estos casos
(`p4_voto`, `p9_rec`, `p15_rec`) y una columna `uso_serie_longitudinal` que marca qué dejar fuera de los
gráficos por año. **`P4` y `P21` no son comparables ni con derivada.**

**Consecuencia, y es la regla operativa del producto:** se comparan entre oleadas **solo las preguntas
con enunciado y categorías idénticas**. Las demás se muestran por oleada, sin línea de tendencia.

**Y el fallo es invisible para un validador de datos:** si una pregunta conserva su nombre y cambia de
enunciado, el nombre calza, el tipo calza y los valores son plausibles. Solo lo ve alguien leyendo el
libro de códigos. Por eso está pendiente el **validador de instrumento** (ver `estado.md` §2.1 en la
documentación interna).

### 4. Los libros de códigos no cuadran con sus propios datos

- El de **2023** documenta `P20` y `P22`, que **no existen como columnas** en los datos de 2023. Los
  datos traen `SIZEP23/P23` y `SIZEP28/P28`, que él no documenta.
- El de **2024** no documenta `P11`, `P16`, `P17`, `P18`, `P20` ni `P22`, y las seis están en los datos.
- Los codebooks en docx que entregó el proveedor de campo están **solo en español** para 2025.

**Ahora los tres son legibles por máquina.** Cada oleada tiene su `ICLAC_20XX_codebook.xlsx` en
`data/sources/<año>/`, y las bases canónicas de 2023, 2024 y 2025 traen sus propias hojas `Variables` y
`Values`/`Codes` con el enunciado de cada pregunta y sus etiquetas de respuesta.

**Consecuencia:** verificar contra los datos, nunca contra el libro de códigos.

### 5. La muestra no aguanta cortes profundos

1228 casos en 2025, sobre la entrega original. Tamaño del grupo más chico por variable de
caracterización:

| Corte | Categorías | Grupo más chico |
|---|---|---|
| Región | 16 | 15 casos |
| Educación | 9 | **2 casos** |
| Nivel socioeconómico | 7 | 19 |
| Tramo etario | 6 | 162 |

El doble de muestra no salva el cruce de dos variables: región × educación da 110 celdas ocupadas con
**mediana de 6,5 casos**, y 71 de ellas bajo 10.

**Consecuencia:** un corte a la vez, nunca dos. **Y agrupar antes de ofrecer**, que es lo que ya hace
el monitor actual: macrozonas en vez de 16 regiones, y regiones por impacto. Los cruces libres entre
dos variables están fuera del alcance por esta razón, no por costo. Sobre los 662 de la base derivada
los números eran peores todavía: 8 casos en la región más chica y mediana de 4 en el cruce.

### 6. La oleada 2025 tiene una entrega original de 1228 casos y una derivada de 662 que no cuadra consigo misma

Verificado el 31-08-2026, corregido y ampliado el 02-09-2026.

**La entrega original está sana.** `data/sources/2025/UCHXCL_285395_20251020.xlsx` trae **1228 casos** y
95 columnas, y sus hojas `Label` y `Data` son las mismas 1228 personas alineadas por `key` **y** por
posición, sin claves repetidas. Lo mismo vale para 2024: `ICLAC_2024_base.xlsx` tiene las mismas 668
personas fila por fila en `Datos` y `Labels`. La entrega de dos hojas es lo normal y funciona.

**El defecto está en un derivado, y es exclusivo de 2025.** `Encuesta_data_2025.xlsx` es esa entrega
pasada por un script que la recortaba a 660 casos para igualar el tamaño de las oleadas anteriores: 95
columnas más seis del propio script (`total_muestra`, `prop_region`, `target_region`, `random`,
`muestra_anidada`, `total_seleccionados`). **El script se corrió dos veces sobre hojas ordenadas
distinto y dejó dos submuestras que no coinciden.** La hoja `labels` trae 662 personas (más 566 filas
vacías hasta completar 1228) y la hoja `data` otras 662; comparten solo **348 `key`**, y apenas 10 de
662 filas están alineadas por posición. En esas 348 todo calza celda a celda: es la misma encuesta, dos
sorteos distintos.

**Y la submuestra no corregía nada.** `prop_region` es la participación de cada región dentro de los
1228 y `target_region = round(prop_region × 662)`: conserva la forma regional del pozo en vez de
acercarla a la población. La Región Metropolitana pesa 16,5% donde el país da cerca de 40%, y eso no es
defecto sino diseño (la muestra se estratificó por peso económico de China, ver
`data/sources/metodologia/`).

**Consecuencia: la misma oleada tiene tres cifras de opinión sobre China circulando.**

| Puntuación | De dónde sale | Dónde aparece |
|---|---|---|
| **67,0** | `Encuesta_data_2025.xlsx`, hoja `labels`, 662 casos | el Monitor publicado hoy |
| **64,9** | la misma base, hoja `data` | la base combinada anterior al 01-09 |
| **65,8** | la entrega original, 1228 casos (n=1047) | la base combinada del 01-09 |

**Cuál se publica no está resuelto (`C8`).** ICLAC rehízo la base combinada el 01-09 sobre los 1228
completos menos un panelista duplicado, así que la serie nueva ya no coincide con la cifra del sitio.
Elegir es decisión suya, y la figura tiene que decir cuál usa.

Dos lecciones de método del episodio, las dos caras del mismo error:

- **Una cifra suelta no discrimina.** El primer intento cruzó un solo porcentaje del Monitor, barrió
  veinte umbrales hasta que uno calzara y concluyó al revés. Hizo falta la distribución completa.
- **Una sola fuente tampoco.** Con la distribución completa se concluyó `labels` y se dio C8 por
  cerrado, sin mirar que la base combinada del propio ICLAC decía `data`. Y ninguna de las dos vueltas
  miró la entrega original, que estaba en `archivo/` desde el 13-08 y no tiene el problema. Antes de
  cerrar un contraste, preguntarse qué otra cosa del cliente responde la misma pregunta.

**Nunca unir dos hojas por número de fila.** En la base derivada de 2025 solo 10 de 662 filas están
alineadas posicionalmente. Si hay que cruzarlas, es por `key`.

**El monitor calcula sus porcentajes sobre el total de casos, incluidos los que no contestaron.** Sus
cinco bandas de 2025 suman 88 %, y el 12 % restante son las personas sin respuesta. El Policy Paper de
2023, en cambio, calcula sobre respuestas efectivas (ver hecho 7). **Son dos criterios distintos en la
misma casa**, y el visualizador tiene que elegir uno y decirlo en la figura.

**Lo que ICLAC publica en su sitio no es lo que tenemos.** La microdata publicada de 2023
(`data_csv.csv`, `data_excel.xls`, `data_stata.dta`, 55 columnas) guarda de `P5_1` a `P5_5` **solo si la
persona respondió**: 1 («Opinión del 0 al 100») o 999 («Prefiero no responder»). El número escrito no
está. Es el termómetro que abre el monitor y la variable dependiente de su gráfico de «predicción», y lo
que ICLAC publica es **byte a byte** lo que recibimos por correo (SHA-256 verificado sobre los tres
`.rar`), o sea que el faltante está en la publicación. **Nosotros sí lo tenemos**, en
`ICLACsurvey2023.xlsx` (78 columnas, con hoja `Labels`), pero **quien baje los datos del sitio de ICLAC
no puede reproducir la serie**. Eso sigue siendo algo que decirle al cliente, no un pendiente nuestro.

**Los `.dta` siguen teniendo sus trampas**, y el ETL los usa hoy como libro de códigos:

- **2023:** 24 conjuntos de value labels y el enunciado de cada pregunta. El archivo **está en utf-8**
  (release 118). `pandas.read_stata` cae igual a latin-1 y devuelve mojibake, porque el relleno de los
  campos de ancho fijo no es texto: el primer nombre de variable es `key ricalId …`, con restos de
  `numericalId` después del terminador. Cortar en el primer NUL **antes** de decodificar, nunca después.
  Y sus enunciados vienen **recortados a 80 bytes**: 22 de 38 truncados, con el corte partiendo un
  carácter al medio.
- **2024:** **cero** value labels, y sus variable labels son solo el nombre original de la columna.

**A las etiquetas de `comuna` de 2023 les falta la sílaba «vi».** De las 347 etiquetas, **ninguna**
contiene «vi», y diecisiete sí contienen otras «v». «Viña del Mar» es «ña del Mar», «Providencia» es
«Prodencia», «San Vicente» es «San cente», «Valdivia» es «Valdia». Los códigos están bien y el conjunto
está completo, así que los porcentajes salen correctos: solo se ve leyendo los nombres. Se documenta y
no se parcha (`C10`), porque reponer las letras exige la lista oficial de comunas y criterio caso a
caso.

### 7. Hay una fuente independiente para verificar la oleada 2023, y ya está enganchada

El **Policy Paper ICLAC 03** (Jenne, Labarca, Montt y Urdinez, julio de 2024, DOI
10.5281/zenodo.12700686) publica dieciocho cifras de la oleada 2023. Nuestro ETL las reproduce: las
cuatro que el informe da con decimal calzan **al decimal** (mall chino 54,8 %; en desacuerdo 32,5 %;
muy en desacuerdo 6,9 %; inversor importante 18,5 %), y el resto queda dentro de un punto.

Está escrito como prueba en `scripts/informe_2023.test.mjs` y corre con `npm test`. **Es la prueba de
aceptación del ETL**, porque traduce a mano un pipeline en R que no podemos ejecutar y nada de eso se
verificaba solo.

De ahí salen dos cosas más:

- **Los porcentajes van sobre respuestas efectivas, y eso ahora está medido, no supuesto.** Se ve en
  `p11`: 157 personas no contestaron y las cifras del informe solo cuadran sobre las 507 restantes.
- **El informe publica `61,4` puntos de opinión sobre China y `71,8` de Japón.** Los dos se reproducen
  al decimal sobre `data/sources/2023/ICLACsurvey2023.xlsx` (`P5_1#1#value`: n=543, media 61,44;
  `P5_5#1#value`: n=540, media 71,81). **La prueba todavía no lo contrasta**, porque el ETL sigue
  corriendo sobre `data_csv.csv`, al que esas columnas le faltan; hoy la prueba afirma la ausencia.
  Rehacer el ETL sobre el xlsx y dar vuelta la prueba es el primer trabajo pendiente.

**Los códigos centinela se reconocen por la etiqueta, nunca por el número.** En 2023, `98` es «Otro» y
`99` es «Ninguna», que son respuestas reales, mientras `999` es «Prefiero no responder» y «No
informada». Filtrar los números redondos borraría dos categorías legítimas.

---

## Lo que hay que saber del monitor en R

Código en `encuesta/referencia/monitor_r/`, dentro de la documentación interna. **No es nuestro**: lo
escribió Bastián Olea Herrera. Sirve como especificación, no como dependencia. El inventario figura por
figura está en `encuesta/docs/sprint_1/paridad_monitor.md`.

- **`funciones.R`** son 27 funciones `iclac_*` de ETL puro (cargar, limpiar, categorizar regiones,
  recodificar edad/educación/ideología, pivotar multi-respuesta, tokenizar texto). Es especificación
  legible: traducirlo es mecánico.
- **`app/app.R`** son 3.543 líneas con **22 gráficos**. El inventario de geoms da unos cinco arquetipos:
  barras (`geom_col`, el grueso), multi-respuesta, termómetro 0-100 por país, línea con regresión, y
  nube de palabras (`ggwordcloud`). Pero 26 `geom_text` y 32 `geom_point` son rotulado a mano gráfico
  por gráfico, y eso no comprime.
- **«Predicción» es `lm(p5_1_1_value ~ p3)`**: regresión lineal simple de opinión sobre China contra
  ideología, con `predict(interval="confidence")` dibujado como puntos y barras de error. OLS
  univariada, forma cerrada, sin librería.
- **La app carga solo dos `.rds`** ya procesados, y un libro de variables
  (`datos/lista_variables.csv`, 67 filas) gobierna qué preguntas aparecen y con qué etiqueta. Es un
  diseño dirigido por configuración: conviene conservar esa idea.
- **`iclac_cargar_originales()` lee, para 2025, la hoja `labels`** de la base derivada de 662 casos. Ahí
  nacen los 67,0 puntos de opinión sobre China que muestra el sitio.
- `lista_variables.csv` está separado por punto y coma: la misma trampa de Excel en configuración
  regional española ya documentada en `mapa_FDI`.

---

## Convenciones que se heredan de la Fase 1

Salieron de problemas concretos del repositorio de inversiones y aplican igual acá. El detalle está en
`../mapa_FDI/.claude/CLAUDE.md`.

- **Un dato, un lugar.** Tenerlo en dos garantiza que diverjan.
- **Los problemas de datos se documentan, no se parchean en el código.** Las excepciones son las
  correcciones deterministas y sin pérdida, que se aplican y se **listan** en el informe.
- **Todo pendiente de datos necesita su instrumento.** Si nadie se va a enterar sin nosotros, falta el
  instrumento, no el dato.
- **Un validador que grita sobre datos correctos deja de leerse.**
- **Marca `brand` = `#00A89C`**, `brand-dark` = `#00776E`. Nunca `text-white` sobre `brand`: da 2,96:1
  contra un mínimo AA de 4,5:1.
- **Ningún locale se escribe a mano.** Un locale literal en un `Intl` no falla, formatea mal. Ya estuvo
  publicado en la Fase 1 con dos lugares apuntando a lados opuestos.
- **`cn` no es una etiqueta BCP-47.** Es la etiqueta interna; `Intl` conoce `zh`.
- **El vocabulario del equipo se queda fuera de la interfaz.** «Microdata», «ponderador», «quiebre de
  serie» son términos del esquema, no del lector.
- **Lo visible se verifica en el navegador**, y en cinco anchos: teléfono (360), tablet (768), el
  umbral de escritorio justo encima y justo debajo (900) y dos escritorios (1512 y 1920).
- **Un valor en el atributo `style` le gana a cualquier regla, también cuando define una variable
  CSS.** Si un componente escribe `--algo` en línea, ninguna media query lo alcanza. Para que un
  ancestro pueda pasarlo por encima hacen falta dos nombres y una cadena de respaldo:
  `var(--algo-ancho, var(--algo))`. Está usado en `Puntos` para el alto de fila y el ancho de la
  columna de nombres.

**La paleta de ocho sectores de `mapa_FDI` no se copia:** se generó para esas ocho categorías de FDI.
Si hacen falta categóricos acá, se genera su propia paleta con el validador de la skill `dataviz`.

---

## Una figura, dos vistas

**El recorrido y el tablero muestran las mismas preguntas: cuando comparten una, comparten la
figura.** El termómetro estuvo hasta el 07-09-2026 dibujado de dos maneras que no se parecían en
nada, y ninguna prueba lo vio porque las dos compilaban. Ahora la escala, el orden de las filas y
el rótulo del eje viven en `src/nucleo/termometro.ts`, y hay una prueba que **lee `App.tsx`** y
falla si alguna de las dos vistas deja de pasar por ahí: un componente compartido no sirve de nada
si alguien deja de llamarlo.

Tres trampas concretas, las tres medidas:

- **Un lienzo pensado para una columna angosta, estirado a una tarjeta de ancho completo.** El
  `viewBox` de `Serie` es de 110×132: en una tarjeta de 992 px daba un SVG de 1.150 px de alto con
  los números a 91 px. Es la misma regla que ya estaba escrita para el recorrido, y aplica igual en
  el tablero.
- **A una variable continua nunca se le pide una distribución por categoría.** El termómetro es de
  0 a 100: con un corte activo, la rama de distribución le armaba una categoría por valor y la
  tarjeta medía 4.247 px. Lo que corresponde con un corte es la **media por grupo**, que es otra
  figura y no una versión estrecha de la misma.
- **La bajada tiene que ser cierta en todos los estados del módulo.** «Los cinco países juntos»
  dejaba de ser verdad apenas se elegía un corte, porque con corte las filas son los grupos.

**Y la regla editorial que salió de ahí:** con un corte activo la pregunta cambia. Sin corte, el
termómetro compara países; con corte, compara grupos dentro de un país. Cinco países por seis
grupos son treinta filas que nadie lee, así que se elige una lectura y se dice cuál.

---

## Una escala ordinal no se resume sin declarar el corte

Decidido e implementado el 08-09-2026, sobre `p24` y `p25` (confianza en la capacidad de China y de
Estados Unidos para lidiar con los problemas de América Latina). Vale para cualquier pregunta de
categorías ordenadas, que en este instrumento son varias.

La pregunta no da un número: da cuatro categorías ordenadas por persona (ninguna, poca, algo,
mucha). Para dibujar una serie hay que cortarla, y **el corte cambia la conclusión**:

| | China 2023 → 2025 | EE. UU. 2023 → 2025 | ¿China arriba? |
|---|---|---|---|
| Solo «mucha» | 10,8 → 22,7 | 13,3 → 17,1 | recién en 2025 |
| «Mucha» + «algo» | 53,0 → 71,8 | 47,9 → 50,7 | ya en 2023 |

**El recorrido publicaba «en 2025 la pasa por primera vez», que es cierto solo con la caja de
arriba.** Es la misma clase de defecto que dejó tres cifras de opinión sobre China circulando
(hecho 6): una afirmación cuyo signo depende de un umbral que la figura no declara.

Tres reglas que salen de ahí:

- **Si la figura resume, declara el corte en el pie.** Y si la conclusión cambia con el corte, lo
  dice: el pie de la escena 2 nombra las dos versiones.
- **Mejor que elegir es no elegir.** La escena muestra las cuatro categorías a los dos lados de un
  cero común (`src/componentes/Divergente.tsx`), y los colores están amarrados a la etiqueta en
  `SEMANTICOS`, así que el tablero pinta la misma pregunta igual sin que nadie repita un color.
- **Y donde dos preguntas las contesta la misma persona, la comparación va dentro del caso.**
  `p24` y `p25` se comparan por encuestado, en escalones de la escala: quienes confían más en China
  pasan de 27,1 % a 39,7 % (p = 0,0001) mientras el empate cae 9,3 puntos (p = 0,0003) y Estados
  Unidos no se mueve por encima del ruido (−3,2, p = 0,10). **No necesita umbral**, que es lo que la
  hace la medida más firme de la escena. Y los códigos hay que recodificarlos antes de restar: 1 es
  «Mucha», 3 es «Poca» y 99 es «Ninguna», así que restar los códigos crudos daría cualquier cosa.

Lo que el corte **no** cambia acá: en las dos versiones la confianza en China sube por encima del
ruido y la de Estados Unidos casi no se mueve en la serie. Con «mucha o algo» además se ve que
Estados Unidos sube en 2024 y **vuelve** en 2025 (−5,1 puntos, p = 0,03), que con la caja de arriba
no se veía.

## Cuándo un cambio entre oleadas es un cambio

Decidido e implementado el 07-09-2026, después de que el cliente preguntara si las diferencias que
afirma el recorrido son reales o son ruido. La maquinaria está en `scripts/lib/contraste.mjs`, las
comparaciones publicadas en `scripts/lib/contrastes.mjs`, y las dos tienen prueba en
`scripts/contrastes.test.mjs`.

**El apalancamiento explica por qué un puñado de respuestas puede inclinar una recta, y tiene
fórmula cerrada:** `h = 1/n + (x − x̄)² / Σ(x − x̄)²`, cuya suma sobre todas las observaciones da
exactamente el número de parámetros (2 en una regresión simple, que es la verificación de que está
bien aplicada). Lo que pesa sobre **la pendiente** es la parte de la derecha: `n·(x − x̄)² / Σ(x −
x̄)²`. En la oleada 2023, treinta personas del punto 10 aportan el **28,9 %** de la inclinación y
las 225 del punto 5 aportan el **1,6 %**: las del centro casi no la mueven porque están donde la
recta gira. **La fragilidad es incertidumbre × peso**, y por eso pocos casos en el borde son un
problema y pocos casos en el centro no.

**El apalancamiento no entra en el cálculo de los intervalos.** Los intervalos son bootstrap; la
fórmula clásica (`SE(b) = s/√Σ(x−x̄)²`) da [−2,57; −0,27] contra [−2,63; −0,21] del remuestreo, o
sea que coinciden. Se usa el bootstrap porque la fórmula supone normalidad y varianza constante, y
el termómetro no cumple ninguna de las dos: el 18 % de las respuestas son exactamente 100.

**Nada de esto es margen de error, y la regla del hecho 2 no cambia.** La muestra no es
probabilística: estos números comparan las oleadas **entre sí** y no estiman a la población.

**No se usa un t de Student, y no es preferencia de estilo.** El t supone que cada oleada es una
muestra aleatoria de Chile, que es justo lo que no tenemos, y su resultado se lee como margen de
error. La **permutación** supone algo mucho más chico: que la etiqueta de año es intercambiable
entre estas respuestas. Se junta todo en un montón, se baraja el año diez mil veces y se cuenta
cuántas barajadas dan una diferencia al menos tan grande como la observada. Es una afirmación sobre
los datos que tenemos, no sobre el país. El supuesto es más débil que en un experimento, donde las
etiquetas se asignaron al azar de verdad: acá las oleadas son tres reclutamientos distintos del
mismo panel.

**Cada diferencia viaja con tres cosas, y las tres importan:** el intervalo bootstrap (95 %
percentil), el `p` de la permutación, y **la misma diferencia con la composición de edad y sexo
fija**. La tercera responde lo que las otras dos no: si cambió el resultado porque la gente piensa
distinto o porque contestó otra gente. En el alza de China de 2025 la cruda da +4,9 y la
estandarizada +4,8, así que es opinión.

**Donde la misma persona contesta por los dos lados, la resta va dentro del caso.** El termómetro
pregunta por cinco países al mismo encuestado: la brecha China − Estados Unidos calculada persona a
persona saca del medio que una oleada use la escala más generosa que otra, y su contraste es de
signo (se le cambia el signo al azar a cada diferencia individual). Restar dos promedios sueltos
tira esa información a la basura.

**Y el recorrido solo puede afirmar lo que pasa el contraste.** Eso está fijado como prueba: si una
oleada nueva deja sin sustento una frase de una escena, `npm test` falla en vez de que la frase
quede publicada.

Dos cosas que costaron caro y no se vuelven a descubrir:

- **El congruencial clásico no sirve como generador en JavaScript.** `semilla * 1103515245` pasa de
  2^53 y la multiplicación pierde precisión, así que la secuencia deja de ser uniforme. Va
  `mulberry32`, con `Math.imul`. El síntoma fue un intervalo bootstrap incoherente con su propio
  `p`, y se vio **porque las dos cosas se calculan por caminos distintos y tienen que contarse lo
  mismo**.
- **El `p` se publica como `(extremos + 1) / (rondas + 1)`**, nunca como una proporción cruda: con
  diez mil rondas el piso es 0,0001, y un «p = 0» afirmaría algo que el método no puede afirmar.

**El gradiente ideológico de la guía no se sostiene, y ahora está medido dos veces.** `C17` dice
que en 2023 hay un gradiente por ideología que después se invierte.

- **Por tramos** (izquierda 1-4, centro 5-6, derecha 7-10), la brecha entre las puntas es +5,2
  puntos en 2023 (p = 0,11), −4,8 en 2024 (p = 0,20) y +1,2 en 2025 (p = 0,61): en ninguna oleada
  se distingue del ruido.
- **Sobre la escala entera**, la regresión de 2023 sí da pendiente (−1,42, p = 0,015), y ahí está
  la trampa: **toda esa inclinación la sostiene el punto 10, que tiene treinta personas.** Sin él,
  −0,29 (p = 0,68) y R² 0,0 %. Sacar cualquier otro punto mueve la pendiente 0,53 como máximo;
  sacar el 10 la mueve 1,14. Y sin ese punto, ninguna de las tres oleadas tiene pendiente.

**Las dos pruebas son correctas y responden preguntas distintas**, así que hay que decir cuál se
usa. La conclusión que sobrevive a las dos: la posición política no ordena la opinión sobre China,
y el gradiente de 2023 que el monitor publica descansa en una celda de treinta casos. El promedio de
esa celda es 43,0 con intervalo de 31 a 55.

**Lo que no es cierto es que en 2023 hubiera menos gente de derecha:** la proporción casi no cambia
entre oleadas (23 %, 25 %, 29 %). Lo que cambia es el número de casos, porque la muestra de 2025 es
el doble: 126 personas en la derecha en 2023 contra 300, y en el punto 10, treinta contra noventa y
nueve. La celda no era chica por composición, era chica por tamaño de muestra.

**Ponderadores: medidos y descartados, no olvidados.** Rastrillar por región deja un efecto de
diseño de 1,6 y baja la muestra efectiva de 2025 de 1.227 a 775, para mover los niveles 1,5 puntos
o menos y **ninguna** afirmación del recorrido (China 2024→2025 pasa de +4,9 a +4,3). Cuesta entre
20 y 30 horas, incluye mapear educación contra el marco del INE y toparse con que el NSE chileno de
uso comercial no tiene marco público, y **no arregla lo que la gente cree que arregla**: con pesos y
todo sigue sin corresponder declarar margen de error. Ponderar corrige el nivel, no la tendencia, y
el producto está hecho de tendencias. Si ICLAC lo pide igual, la versión barata es región × sexo ×
edad, como columna en la descarga y con el n efectivo a la vista.

---

## El armazón del sitio: encabezado, rutas e idioma

Decidido el 07-09-2026 y medido en el navegador. Son reglas del producto, no preferencias de estilo.

**El encabezado se clona del repositorio de inversiones, y eso es a propósito.** Las dos apps las
publica ICLAC y el lector llega desde iclac.cl: el encabezado de ese sitio mide **88 px** en escritorio
(logo de 68 px con 10 arriba y abajo) y se separa del contenido con **sombra, no con borde**. Las dos
cosas están replicadas para que el salto no se lea como cambiar de sitio. En teléfono baja a 79 px,
porque ahí cada píxel de alto se lo quita al contenido. El nav completo aparece en `lg` y no en `md`:
entre 768 y 1023 px no queda ancho al lado del título y el `h1` se parte en varias líneas.

**Una familia tipográfica declarada no es una familia cargada.** `font-display: Raleway` estaba en
`tailwind.config.js` y `@fontsource/raleway` en `package.json` desde el principio, sin ningún `@import`:
no falla, cae a la fuente del sistema, y el encabezado se veía en otra tipografía sin que nada lo dijera.
Los dos subconjuntos latinos se importan en `src/index.css`. Es la misma clase de fallo silencioso que
el locale escrito a mano.

**Un solo alto medido, publicado como variable CSS.** El encabezado es pegajoso y la barra de controles
del tablero también: la barra se pega en `var(--alto-encabezado)`, que el encabezado escribe midiéndose
con un `ResizeObserver`. **El alto no se escribe a mano en ninguna de las dos**, porque cambia con el
ancho y dos literales se desincronizan. Quien agregue otra cosa pegajosa usa la misma variable.

**La raíz del sitio es el recorrido**, con su portada como primera pantalla dentro de la capa. Las
reglas de esa capa —entrada, portada, posición, salida al tablero— viven en la skill `recorrido`,
no acá.

**El sitio son cinco vistas con URL, no una página que se scrollea sin fin.** Una sola página larga no
se recorre, se abandona, y un nav que solo mueve el scroll no da ganas de navegarla. Las vistas son el
recorrido, el tablero, el explorador, las descargas y «Sobre los datos».

- **Las rutas van por hash (`#/tablero`) mientras no haya servidor elegido.** Una ruta limpia exige que
  el servidor devuelva el index en cualquier ruta; el hash funciona en cualquier hosting estático,
  incluido abrir `dist/` a mano. Cuando el despliegue se decida, `HashRouter` pasa a `BrowserRouter` y
  no cambia nada más.
- **El estado del tablero vive en `App`**, que no se desmonta: el recorte elegido sobrevive al cambio de
  vista. Un filtro que se resetea al navegar hace que el lector desconfíe de lo que está viendo.

**El selector de idioma cubre el cromo, y lo dice.** `src/textos.ts` tiene el encabezado, el nav y los
avisos en los tres idiomas; el contenido de las figuras y del recorrido sigue en español y dentro del
código. Elegir «EN» cambia además el formato de los números, porque el idioma gobierna `locale.ts`.
**Y aparece una franja que declara hasta dónde llega la traducción**: sin ella el botón parece roto.
La regla general es esa, no la excepción: un control que no hace nada no se publica, y uno que hace la
mitad dice cuál mitad.

---

## Las reglas del recorrido viven en su skill

El scrollytelling del recorrido (cuándo un paso se gana su scroll, qué puede hacer una figura
mientras avanza el scroll, la mecánica de `sticky` + `IntersectionObserver`, y qué no se hace) está
en `.claude/skills/recorrido/SKILL.md`, con sus fuentes. Acá no se duplica: un dato, un lugar.

---

## Dónde está lo que falta

`estado.md`, en `la documentación interna`, carpeta `encuesta/docs/`.
