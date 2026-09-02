# data/sources — qué archivo manda en cada oleada

Las tres oleadas llegaron varias veces y en varias versiones. Esta tabla dice **cuál es la buena y por
qué**, para que nadie tenga que volver a deducirlo mirando el sitio publicado. Verificado el 02-09-2026
abriendo cada archivo.

## Canónicos

| Oleada | Archivo | Casos × columnas | Por qué este |
|---|---|---|---|
| 2023 | `2023/ICLACsurvey2023.xlsx` | 664 × 78 | Único con hoja `Labels`. Superset de `ICLAC_2023_base.xlsx` (664 × 67, sin etiquetas) |
| 2024 | `2024/ICLAC_2024_base.xlsx` | 668 × 89 | Hojas `Datos`, `Labels`, `Variables`, `Codes`. Las 668 personas alineadas fila por fila entre `Datos` y `Labels` |
| 2025 | `2025/UCHXCL_285395_20251020.xlsx` | **1228** × 95 | Entrega original de Netquest. `Label` y `Data` traen las mismas 1228 personas, alineadas por `key` **y** por posición, sin claves repetidas |
| Serie | `combinada/ICLAC_2023_2025_combinada.xlsx` | 2559 filas | La que ICLAC rehizo el 01-09-2026. Nombres de variable unificados y hoja `diccionario` con el nombre original por oleada |

La combinada apila 664 (2023) + 668 (2024) + 1227 (2025); el caso que falta en 2025 es un panelista que
respondió dos veces y del que se conservó la primera respuesta.

## Los derivados que se conservan, y para qué

- **`2025/Encuesta_data_2025.xlsx`** es `UCHXCL_285395_20251020.xlsx` pasado por un script de selección
  que lo recortaba a 660 casos para igualar el tamaño de las oleadas anteriores. Son las mismas 95
  columnas más seis del propio script (`total_muestra`, `prop_region`, `target_region`, `random`,
  `muestra_anidada`, `total_seleccionados`).

  **El script se corrió dos veces sobre hojas ordenadas distinto y dejó dos submuestras que no
  coinciden:** la hoja `labels` trae 662 personas (más 566 filas vacías, hasta completar 1228) y la hoja
  `data` otras 662, y comparten solo 348. Se conserva porque **es lo que lee el monitor publicado**, y sin
  él no se pueden reproducir las cifras del sitio.

- **`2023/data_csv.csv`, `data_excel.xls`, `data_stata.dta`** y sus equivalentes de 2024 son la microdata
  que ICLAC publica en su sitio. Se conservan porque el ETL de 2023 corre hoy sobre ellos y porque el
  `.dta` de 2023 es el que aporta los enunciados. **Les falta el termómetro `P5`:** guardan solo si la
  persona respondió, no el número.

## Cómo se reconoce cada cifra

Contrastes verificados, útiles para saber sobre qué archivo está calculada una cifra que aparezca por ahí:

| Cifra | Qué archivo la produce |
|---|---|
| Opinión sobre China 2023 = **61,4** (n=543) | `ICLACsurvey2023.xlsx`, columna `P5_1#1#value`. Es la del Policy Paper ICLAC 03 |
| Japón 2023 = **71,8** (n=540) | el mismo, `P5_5#1#value` |
| China 2025 = **65,8** (n=1047) | `UCHXCL_285395_20251020.xlsx`, los 1228 casos |
| China 2025 = **67,0** | `Encuesta_data_2025.xlsx`, hoja `labels`, 662 casos. **Es lo que muestra el sitio hoy** |
| China 2025 = **64,9** | la combinada anterior al 01-09, armada sobre la hoja `data` |

Las tres últimas describen la misma oleada. Cuál se publica es decisión pendiente: ver `C8` en la cola
de correcciones al cliente, en la documentación interna.

## Libros de códigos

Cada oleada tiene el suyo legible por máquina en su carpeta (`ICLAC_20XX_codebook.xlsx`), más los docx
en español, inglés y chino que entregó el proveedor de campo en 2023 y 2024. En `combinada/` están los
tres libros que ICLAC rehízo el 01-09 con los nombres de variable ya unificados.

**Verificar contra los datos, nunca contra el libro de códigos:** los docx de 2023 y 2024 documentan
variables que no existen y omiten seis que sí están. El detalle, en `.claude/CLAUDE.md`.

## metodologia/

Diseño muestral, cuestionarios por oleada y el `00_LEEME.docx` de ICLAC. De acá sale que la muestra se
estratificó **por peso económico de China, no por población**, que es la razón de que la Región
Metropolitana pese 16,5% y no 40%. Es diseño, no defecto.
