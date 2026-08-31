# CLAUDE.md — Visualizador de la encuesta ICLAC

Contexto para quien retome este repositorio, sea persona o agente. Acá van **las reglas que no
caducan**: lo que se descubrió mirando los datos y que cuesta caro volver a descubrir. Lo que falta
hacer vive en `docs/estado.md`.

## Qué es

El visualizador de la **Encuesta de Percepciones sobre China en Chile**, que ICLAC levanta una vez al
año. Dos tramos en una sola página, en este orden:

1. **El recorrido**: una narración que se avanza con el scroll y cuenta, hallazgo por hallazgo, qué se
   movió entre oleadas. Hasta ocho tramos, sobre un guion acordado con ICLAC.
2. **El tablero**: diez módulos para consultar una oleada concreta, con selector de año, filtro
   general y agrupación por variable de caracterización.

El tablero **no se inventa**: reconstruye el monitor que ICLAC ya publica en
https://iclac.cl/monitor-de-opinion-publica/, hoy una app Shiny alojada en la cuenta personal de un
tercero (`bastianoleah.shinyapps.io/iclac_encuesta/`). Su código está en `docs/referencia/monitor_r/`.
Reconstruirlo acá es lo que corta esa dependencia.

Tres idiomas: español, inglés y chino.

---

## Los siete hechos de los datos que hay que saber antes de tocar nada

Verificados contra los archivos de `data/sources/`: los cinco primeros el 13-08-2026, el sexto y el
séptimo el 31-08-2026. Ninguno es evidente y todos cambian lo que se puede construir.

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

23 preguntas comparten nombre en las tres oleadas, cerca del 80% del instrumento. Pero al menos tres
derivaron:

| | 2023 / 2024 | 2025 |
|---|---|---|
| `P4` | «¿por quién **votó** en la segunda vuelta Boric–Kast?» | «si la segunda vuelta **fuera hoy**, ¿por quién votaría?» |

`P15` cambió sus tramos entre 2023 y 2024 (20-50 mil → 20-99 mil, 100-150 mil → 100-199 mil). `P6`
cambió redacción.

**Consecuencia, y es la regla operativa del producto:** se comparan entre oleadas **solo las preguntas
con enunciado y categorías idénticas**. Las demás se muestran por oleada, sin línea de tendencia.

**Y el fallo es invisible para un validador de datos:** si una pregunta conserva su nombre y cambia de
enunciado, el nombre calza, el tipo calza y los valores son plausibles. Solo lo ve alguien leyendo el
libro de códigos. Por eso está pendiente el **validador de instrumento** (ver `docs/estado.md`).

### 4. Los libros de códigos no cuadran con sus propios datos

- El de **2023** documenta `P20` y `P22`, que **no existen como columnas** en los datos de 2023. Los
  datos traen `SIZEP23/P23` y `SIZEP28/P28`, que él no documenta.
- El de **2024** no documenta `P11`, `P16`, `P17`, `P18`, `P20` ni `P22`, y las seis están en los datos.
- **2025 no trae libro de códigos** en docx. A cambio trae algo mejor para máquina: las hojas
  `variables` y `values` del xlsx, con el texto de cada pregunta y las etiquetas de respuesta. Solo en
  español.

**Consecuencia:** verificar contra los datos, nunca contra el libro de códigos.

### 5. La muestra no aguanta cortes profundos

662 casos en 2025. Tamaño del grupo más chico por variable de caracterización:

| Corte | Categorías | Grupo más chico |
|---|---|---|
| Región | 16 | **8 casos** |
| Educación | 9 | **2 casos** |
| Nivel socioeconómico | 7 | 10 |
| Tramo etario | 6 | 88 |

El cruce de dos variables es directamente ficción: región × educación da 99 celdas ocupadas con
**mediana de 4 casos**, y 76 de ellas bajo 10.

**Consecuencia:** un corte a la vez, nunca dos. **Y agrupar antes de ofrecer**, que es lo que ya hace
el monitor actual: macrozonas en vez de 16 regiones, y regiones por impacto. Los cruces libres entre
dos variables están fuera del alcance por esta razón, no por costo.

### 6. El archivo de 2025 trae dos muestras distintas, y los de 2023 y 2024 vienen sin etiquetas

Verificado el 31-08-2026.

**La entrega de dos hojas es lo normal, y en 2024 funciona.** `ICLAC_2024_base.xlsx` trae `Datos` y
`Labels` con las **mismas 668 personas, alineadas fila por fila** (668/668 por `key` y por posición).
`ICLAC_2023_base.xlsx` trae una sola hoja de datos. **El defecto es exclusivo de 2025.**

**2025.** `Encuesta_data_2025.xlsx` tiene una hoja `labels` (respuestas en texto) y una hoja `data`
(códigos numéricos). No son dos vistas de la misma tabla: cada una trae 662 personas y **comparten solo
348 `key`**, y apenas 10 filas de 662 están alineadas por posición. En esas 348 todo calza celda a celda, así que son la misma encuesta, pero **dos sorteos
distintos**. El archivo mismo lo explica: `total_muestra = 1228` casos completos y
`total_seleccionados = 662`.

La aritmética de la selección: `prop_region` es la participación de cada región dentro de los 1228
(`prop_region × 1228` da entero en las 16) y `target_region = round(prop_region × 662)`. La submuestra
**conserva** la forma regional del pozo, no la corrige. Y esa forma está lejos de la población: la
Región Metropolitana pesa 16,5% cuando es cerca del 40% del país.

**Consecuencia, y NO está resuelta: las dos cosas que ICLAC publica usan hojas distintas.**

- **El Monitor desplegado usa `labels`.** Con solo 2025 seleccionado muestra la opinión sobre China en
  10 / 4 / 22 / 24 / 28 por ciento, y sobre el total de los 662 casos `labels` reproduce **las cinco**
  bandas (9,5 / 3,9 / 21,6 / 24,0 / 27,6) mientras `data` reproduce dos (9,8 / 5,1 / 23,0 / 23,6 / 23,4).
- **La base combinada de la carpeta usa `data`.** Las 662 filas de 2025 de
  `ICLAC_2023_2025_combinada.xlsx` calzan 662/662 por `key` con `data` y 348/662 con `labels`, y su
  promedio de China da 64,93. **Pero no es una decisión metodológica ni una auditoría:** el archivo lo
  generó `openpyxl 3.1.5` y sus metadatos dan creación y modificación con dos segundos de diferencia,
  o sea que nunca se abrió en Excel. Es salida de script, y quien lo escribió agarró la hoja de códigos
  numéricos sin ver que las dos difieren. Vale como aviso al cliente, no como autoridad.

Elegir una u otra mueve la puntuación promedio de China de **67,0 a 64,9 puntos**. El visualizador usa
**`labels`**, que es lo único publicado, y lo declara. Lo que queda abierto en `C8` no es cuál usar sino
por qué el archivo trae adentro una segunda muestra que nadie publica.

Dos lecciones de método de este episodio, las dos caras del mismo error:

- **Una cifra suelta no discrimina.** El primer intento cruzó un solo porcentaje del Monitor, barrió
  veinte umbrales hasta que uno calzara y concluyó al revés. Hizo falta la distribución completa.
- **Una sola fuente tampoco.** Con la distribución completa se concluyó `labels` y se dio C8 por
  cerrado, sin mirar que la propia base combinada de ICLAC dice `data`. Antes de cerrar un contraste,
  preguntarse qué otra cosa del cliente responde la misma pregunta. Y no unir nunca las dos hojas por número de fila: solo 10 de 662 filas están
alineadas posicionalmente. Si hay que cruzarlas, es por `key`.

**El monitor calcula sus porcentajes sobre el total de casos, incluidos los que no contestaron.** Sus
cinco bandas de 2025 suman 88 %, y el 12 % restante son las 88 personas sin respuesta. El Policy Paper
de 2023, en cambio, calcula sobre respuestas efectivas (ver hecho 7). **Son dos criterios distintos en
la misma casa**, y el visualizador tiene que elegir uno y decirlo en la figura.

**2023 y 2024.** El `data_excel.xls` tiene **una sola hoja** con los valores en código numérico; no es
el archivo de varias hojas que lee el monitor en R (`ICLACsurvey2023.xlsx`, hoja 2 datos y hoja 3 libro
de variables), que no está entre los archivos recibidos.

- **2023:** el `.dta` salva parcialmente la oleada, con 24 conjuntos de value labels y el enunciado de
  cada pregunta. El archivo **está en utf-8** (release 118). `pandas.read_stata` cae igual a latin-1 y
  devuelve todo el acento como mojibake, porque el relleno de los campos de ancho fijo no es texto: el
  primer nombre de variable es `key ricalId …`, con restos de `numericalId` después del terminador.
  Cortar en el primer NUL **antes** de decodificar, nunca después. Y sus enunciados vienen **recortados
  a 80 bytes**: 22 de 38 están truncados, el corte parte un carácter al medio, y la pregunta completa
  solo está en el docx.
- **2024:** **cero** value labels en el `.dta`, y sus variable labels son solo el nombre original de la
  columna. No hay ninguna fuente de etiquetas legible por máquina para esa oleada.

**A la entrega de 2023 le falta la pregunta principal.** `P5` es el termómetro de opinión sobre China,
Estados Unidos, Corea del Sur, Francia y Japón, escala de 0 a 100. Es la cifra que abre el monitor y la
variable dependiente de su gráfico de «predicción». En los tres archivos de 2023, los tres de 55
columnas, `P5_1` a `P5_5` guardan **solo si la persona respondió**: 1 («Opinión del 0 al 100») o 999
(«Prefiero no responder»). El número escrito no está en ninguno. En 2024 sí, en `p5_11value` a
`p5_51value` (0 a 100, media 60,9).

**Consecuencia:** no hay serie de opinión sobre China para 2023 hasta que llegue ese archivo (`C9`). No
prometer ese tramo del recorrido sobre las tres oleadas. El archivo **existe**: `iclac_recodificar_escalas()`
referencia `p5_1_1_value` fuera de `any_of()` y `datos_2023.R` la llama, así que sin esa columna el
pipeline de Bastián fallaría. Y lo que ICLAC publica en su sitio es **byte a byte** lo que tenemos
(SHA-256 verificado sobre los tres `.rar`), o sea que el faltante está en la publicación.

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
- **El informe publica `61,4` puntos de opinión sobre China y `71,8` de Japón**, que es justamente lo
  que la microdata publicada no permite calcular (ver hecho 6). Cuando llegue el archivo de `C9`, el
  contraste contra 61,4 es la prueba de aceptación de la serie del termómetro; hasta entonces la prueba
  está escrita al revés y afirma que la columna no está.

**Los códigos centinela se reconocen por la etiqueta, nunca por el número.** En 2023, `98` es «Otro» y
`99` es «Ninguna», que son respuestas reales, mientras `999` es «Prefiero no responder» y «No
informada». Filtrar los números redondos borraría dos categorías legítimas.

---

## Lo que hay que saber del monitor en R

Código en `docs/referencia/monitor_r/`. **No es nuestro**: lo escribió Bastián Olea Herrera. Vive en
`docs/`, que está gitignoreado, y sirve como especificación, no como dependencia.

- **`funciones.R`** son 23 funciones `iclac_*` de ETL puro (cargar, limpiar, categorizar regiones,
  recodificar edad/educación/ideología, pivotar multi-respuesta, tokenizar texto). Es especificación
  legible: traducirlo es mecánico.
- **`app.R`** son 3.630 líneas con **22 gráficos**. El inventario de geoms da unos cinco arquetipos:
  barras (`geom_col`, el grueso), multi-respuesta, termómetro 0-100 por país, línea con regresión, y
  nube de palabras (`ggwordcloud`). Pero 26 `geom_text` y 32 `geom_point` son rotulado a mano gráfico
  por gráfico, y eso no comprime.
- **«Predicción» es `lm(p5_1_1_value ~ p3)`**: regresión lineal simple de opinión sobre China contra
  ideología, con `predict(interval="confidence")` dibujado como puntos y barras de error. OLS
  univariada, forma cerrada, sin librería.
- **La app carga solo dos `.rds`** ya procesados, y un libro de variables
  (`datos/lista_variables.csv`, 50 filas) gobierna qué preguntas aparecen y con qué etiqueta. Es un
  diseño dirigido por configuración: conviene conservar esa idea.
- **El repo recibido va una versión atrás del sitio:** hay `datos_2023.R` y `datos_2024.R`, no hay
  `datos_2025.R`, y la app desplegada sí muestra 2025.
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
- **Lo visible se verifica en el navegador**, y en los tres anchos: teléfono (360), tablet (768-1023) y
  escritorio.

**La paleta de ocho sectores de `mapa_FDI` no se copia:** se generó para esas ocho categorías de FDI.
Si hacen falta categóricos acá, se genera su propia paleta con el validador de la skill `dataviz`.

---

## Dónde está lo que falta

`docs/estado.md`.
