# Visualizador de la Encuesta de Percepciones sobre China en Chile

Publica los resultados de la encuesta anual de ICLAC en una sola página con dos tramos: primero un
**recorrido** que cuenta qué encontró la encuesta y qué se movió entre oleadas, después un **tablero**
para consultar un año concreto. En español, inglés y chino.

**Estado: sin arrancar.** El repositorio existe con los datos y la documentación en su lugar; el
desarrollo empieza en el sprint E1 (18 de agosto de 2026). Alcance y calendario en
`../admin/cotizaciones/cotizacion_iclac_fases2y3_felipe.pdf`, enviada a ICLAC el 14-08-2026.

---

## Los datos

Tres oleadas, en `data/sources/`:

| | 2023 | 2024 | 2025 |
|---|---|---|---|
| Casos | 664 | 668 | 662 |
| Formato | CSV + XLS + DTA | CSV + XLS + DTA | XLSX de cuatro hojas |
| Libro de códigos | docx en ES, EN y CN | docx en ES, EN y CN | ninguno; las hojas `variables` y `values` lo reemplazan, solo en español |
| Campo | Netquest, ISO 26362 | Netquest, ISO 20252 | notificación no recibida |

Cobertura: **Chile**, las 16 regiones. Las tres oleadas son públicas y se descargan del sitio de ICLAC.

**Antes de escribir una línea de código, leer `.claude/CLAUDE.md`.** Documenta siete cosas que se
descubrieron mirando estos archivos y que determinan lo que se puede construir: que no es un panel, que
no hay ponderadores, que el mismo nombre de variable no siempre es la misma pregunta, que los libros de
códigos no cuadran con sus datos, hasta dónde aguanta la muestra al cortarla, y que el archivo de 2025
trae dos muestras distintas que no coinciden.

## El monitor que ya existe

ICLAC publica hoy https://iclac.cl/monitor-de-opinion-publica/, que embebe una app Shiny alojada en la
cuenta personal de un tercero. Su código está en `docs/referencia/monitor_r/` **como especificación del
tablero, no como dependencia**. No es código nuestro.

## Cómo está organizado

```
data/sources/    las tres oleadas tal como las entrega el proveedor de campo
data/schema/     el contrato de datos (se define en E2)
scripts/         ETL y validadores (por escribir)
docs/            documentación por sprint; local, ver docs/README.md
docs/referencia/ el monitor en R y material de apoyo
```

`.claude/CLAUDE.md` explica **por qué** las decisiones son las que son. `docs/estado.md` dice qué falta
y de quién depende.

## Traspaso

El repositorio nace en cuenta personal y **se transfiere a ICLAC al cierre del producto**, igual que se
hizo con el repositorio de inversiones. El traspaso es un entregable, no un trámite.
