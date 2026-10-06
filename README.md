<p align="center"><img src="public/icon-192.png" alt="El junco, ícono del visualizador" width="120"></p>

# Visualizador de la Encuesta de Percepciones sobre China en Chile

Publica los resultados de la encuesta anual de ICLAC en dos tramos: seis **historias** que cuentan qué
encontró la encuesta y qué se movió entre oleadas, y un **explorador** para consultar cualquier
pregunta en una oleada. El sitio son cuatro vistas con URL propia (historias, explorador, descargas y
ficha técnica), con el encabezado de iclac.cl. En español, inglés y chino.

**Cada figura publica su método.** Desde donde antes iba su pie se abre un pop-up con esa nota y con
las pruebas que sostienen lo que la figura muestra; la barra de la capa y el cierre abren el de la
historia entera, y el menú, la metodología completa con todas las comparaciones. Dicen qué sostiene
cada afirmación y qué tiene prohibido hacer la animación.

**Las diferencias entre oleadas van contrastadas.** El ETL calcula, para cada comparación que el
producto muestra, una prueba de permutación, un intervalo bootstrap y la misma diferencia con la
composición de edad y sexo fija. La muestra no es probabilística, así que **no son margen de error**:
comparan las oleadas entre sí. El método y sus límites están en `.claude/CLAUDE.md` y publicados en
los pop-ups de método.

**Qué hay hoy.** Seis historias, nubes de palabras, un explorador de 44 preguntas (37 se comparan
entre oleadas) y las descargas de las bases. El tablero que reconstruía módulo por módulo el monitor
actual salió de la app el 22-09-2026: el explorador lo reemplaza. La oleada 2023 tiene prueba de
aceptación contra las cifras que ICLAC publicó en el Policy Paper 03.

## Cómo correrlo

Requiere Node 22 (`.nvmrc`).

```bash
npm ci
npm run datos      # genera public/data/encuesta.json, public/descargas/ y la geometría de las regiones
npm run dev        # http://localhost:5180
```

**`npm run datos` no es opcional**: los datos del sitio son derivados de `data/sources/` y están en
`.gitignore`. Sin ellos la app compila y se queda cargando.

```bash
npm run typecheck && npm run lint && npm test    # lo mínimo antes de cerrar un cambio
npm run build      # typecheck + vite build, a dist/
```

El despliegue es Netlify (`netlify.toml`): corre `npm run datos && npm run build` y publica `dist/`.

---

## Los datos

**El producto corre sobre `data/sources/combinada/ICLAC_2023_2025_combinada.xlsx`**, la base que ICLAC
rehízo el 01-09-2026 con las tres oleadas unificadas. Reproduce las dieciocho cifras del Policy Paper
2023, incluido el termómetro que la microdata publicada no permite calcular.

Las entregas por oleada siguen en el repositorio y sirven de respaldo y de contraste. Tres oleadas, en
`data/sources/`. **Cada una llegó en varias versiones**, y no todas dicen lo mismo:
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
cuenta personal de un tercero. Su código lo escribió Bastián Olea Herrera y sirve como **especificación
del tablero, no como dependencia**: no es código nuestro y nada de acá lo ejecuta ni lo importa. Se
guarda en la documentación interna.

## Cómo está organizado

```
data/sources/    las bases de las tres oleadas; empezar por su README.md
scripts/         ETL, validadores y pruebas (scripts/lib/ trae el catálogo del explorador y los contrastes)
src/             la aplicación: historias/, componentes/, nucleo/, locales/ (es, en, cn)
laboratorio/     páginas de composición con las que se decidió el diseño; no se publican con el sitio
public/          estáticos; los datos y las descargas se generan con `npm run datos`
```

`.claude/CLAUDE.md` explica **por qué** las decisiones son las que son: los hechos de los datos que
cuesta caro volver a descubrir.

La documentación interna del desarrollo **no forma parte de este repositorio**: el estado del
proyecto, el devlog, la cola de lo que hay que pedirle o decirle a ICLAC, los planes por sprint y el
código del monitor en R. **Los
identificadores `C<n>` que aparecen en comentarios del código** (por ejemplo `C9`, `C10`) son entradas
de esa cola de correcciones; el hecho siempre está escrito en el comentario, la entrada solo agrega el
contexto.
