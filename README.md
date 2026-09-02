# Visualizador de la Encuesta de Percepciones sobre China en Chile

Publica los resultados de la encuesta anual de ICLAC en una sola página con dos tramos: primero un
**recorrido** que cuenta qué encontró la encuesta y qué se movió entre oleadas, después un **tablero**
para consultar un año concreto. En español, inglés y chino.

**Estado: E1 en curso.** Andamiaje en pie, ETL de 2023 corriendo y contrastado contra el informe
publicado por ICLAC, explorador de datos en el navegador. Alcance y calendario en
`../admin/cotizaciones/cotizacion_iclac_fases2y3_felipe.pdf`, enviada a ICLAC el 14-08-2026.

---

## Los datos

Tres oleadas, en `data/sources/`. **Cada una llegó en varias versiones**, y no todas dicen lo mismo:
`data/sources/README.md` dice cuál manda y por qué. Estas son las canónicas:

| | 2023 | 2024 | 2025 |
|---|---|---|---|
| Archivo | `ICLACsurvey2023.xlsx` | `ICLAC_2024_base.xlsx` | `UCHXCL_285395_20251020.xlsx` |
| Casos × columnas | 664 × 78 | 668 × 89 | 1228 × 95 |
| Etiquetas | hoja `Labels` | hojas `Labels` y `Codes` | hojas `Label` y `Values` |
| Libro de códigos | xlsx + docx en ES, EN y CN | xlsx + docx en ES, EN y CN | xlsx, solo en español |
| Campo | Netquest, ISO 26362 | Netquest, ISO 20252 | Netquest |

Más la serie apilada en `data/sources/combinada/`, que ICLAC rehizo el 01-09-2026: 2.559 filas, nombres
de variable unificados y un diccionario que dice, para cada una, en qué oleadas aparece y si es
comparable.

Cobertura: **Chile**, las 16 regiones. **Lo que ICLAC publica en su sitio no es esto**: es una versión
recortada de 55 columnas a la que le falta el termómetro de opinión.

**Antes de escribir una línea de código, leer `.claude/CLAUDE.md`.** Documenta siete cosas que se
descubrieron mirando estos archivos y que determinan lo que se puede construir: que no es un panel, que
no hay ponderadores, que el mismo nombre de variable no siempre es la misma pregunta, que los libros de
códigos no cuadran con sus datos, hasta dónde aguanta la muestra al cortarla, y por qué la oleada 2025
tiene tres cifras distintas circulando para el mismo dato.

## El monitor que ya existe

ICLAC publica hoy https://iclac.cl/monitor-de-opinion-publica/, que embebe una app Shiny alojada en la
cuenta personal de un tercero. Su código está en `referencia/monitor_r/` **como especificación del
tablero, no como dependencia**. No es código nuestro y esa carpeta se borra antes del traspaso.

## Cómo está organizado

```
data/sources/    las bases de las tres oleadas; empezar por su README.md
data/schema/     el contrato de datos (se define en E2)
scripts/         ETL y validadores
docs/            documentación interna, ver docs/README.md
referencia/      el monitor en R; temporal, se borra antes del traspaso
```

`.claude/CLAUDE.md` explica **por qué** las decisiones son las que son. `docs/estado.md` dice qué falta
y de quién depende.

## Traspaso

El repositorio nace en cuenta personal y **se transfiere a ICLAC al cierre del producto**, igual que se
hizo con el repositorio de inversiones. El traspaso es un entregable, no un trámite.
