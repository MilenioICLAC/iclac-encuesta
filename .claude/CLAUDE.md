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

## Los seis hechos de los datos que hay que saber antes de tocar nada

Verificados contra los archivos de `data/sources/`: los cinco primeros el 13-08-2026, el sexto el
31-08-2026. Ninguno es evidente y todos cambian lo que se puede construir.

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

**2025.** `Encuesta_data_2025.xlsx` tiene una hoja `labels` (respuestas en texto) y una hoja `data`
(códigos numéricos). No son dos vistas de la misma tabla: cada una trae 662 personas y **comparten solo
348 `key`**. En esas 348 todo calza celda a celda, así que son la misma encuesta, pero **dos sorteos
distintos**. El archivo mismo lo explica: `total_muestra = 1228` casos completos y
`total_seleccionados = 662`.

La aritmética de la selección: `prop_region` es la participación de cada región dentro de los 1228
(`prop_region × 1228` da entero en las 16) y `target_region = round(prop_region × 662)`. La submuestra
**conserva** la forma regional del pozo, no la corrige. Y esa forma está lejos de la población: la
Región Metropolitana pesa 16,5% cuando es cerca del 40% del país.

**Consecuencia:** ninguna cifra de 2025 se publica hasta que ICLAC diga cuál hoja vale (`C8` en
`docs/generales/correcciones_cliente.md`). Leer una hoja u otra mueve la opinión sobre China de
**66,98 a 64,93**. Y no unir nunca las dos hojas por número de fila: solo 10 de 662 filas están
alineadas posicionalmente. Si hay que cruzarlas, es por `key`.

**2023 y 2024.** El `data_excel.xls` tiene **una sola hoja** con los valores en código numérico; no es
el archivo de varias hojas que lee el monitor en R (`ICLACsurvey2023.xlsx`, hoja 2 datos y hoja 3 libro
de variables), que no está entre los archivos recibidos.

- **2023:** el `.dta` salva la oleada, con 24 conjuntos de value labels y el enunciado de cada pregunta.
  Está en **latin-1, no utf-8**; leerlo como utf-8 falla en la primera tilde.
- **2024:** **cero** value labels en el `.dta`, y sus variable labels son solo el nombre original de la
  columna. No hay ninguna fuente de etiquetas legible por máquina para esa oleada.

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
