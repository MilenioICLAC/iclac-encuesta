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
- **Lo visible se verifica en el navegador**, y en los tres anchos: teléfono (360), tablet (768-1023) y
  escritorio.

**La paleta de ocho sectores de `mapa_FDI` no se copia:** se generó para esas ocho categorías de FDI.
Si hacen falta categóricos acá, se genera su propia paleta con el validador de la skill `dataviz`.

---

## Las reglas del recorrido viven en su skill

El scrollytelling del recorrido (cuándo un paso se gana su scroll, qué puede hacer una figura
mientras avanza el scroll, la mecánica de `sticky` + `IntersectionObserver`, y qué no se hace) está
en `.claude/skills/recorrido/SKILL.md`, con sus fuentes. Acá no se duplica: un dato, un lugar.

---

## Dónde está lo que falta

`estado.md`, en `la documentación interna`, carpeta `encuesta/docs/`.
