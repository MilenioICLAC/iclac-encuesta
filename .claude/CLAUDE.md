# CLAUDE.md — Visualizador de la encuesta ICLAC

Reglas que no caducan, un mapa y dónde está el resto. **Lo que falta hacer** vive en
`la documentación interna documentación interna` (repo privado `la documentación interna`). **Por
qué algo es como es** vive en los ADR de la misma carpeta, `docs/adr/` (índice en su `README.md`).
Acá no va historia: si una regla necesita su anécdota para entenderse, la anécdota va a un ADR.

## Qué es

Visualizador de la **Encuesta de Percepciones sobre China en Chile** (ICLAC, una oleada por año:
2023, 2024, 2025). Cuatro vistas con ruta por hash:

- **Historias** (raíz, menú de tarjetas; cada una en `#/historias/<id>`, y `#/recorrido` redirige al
  menú): capas a pantalla completa que avanzan con el scroll. Portada, escenas separadas por pausas
  («respiros») y cierre. Una por bloque de la guía de contexto de ICLAC que sostuvo alguna hipótesis.
- **Explorador** (`#/explorar`: cualquier pregunta, **una oleada a la vez**, filtro y un corte; las comparaciones, «Entre oleadas» (solo entre oleadas con la misma pregunta) y con corte, son mancuernas (una fila por categoría y un punto por oleada o por grupo), salvo el termómetro y las de dos categorías, que van en barras; las ocho abiertas van como las diez palabras más dichas (un registro de decisiones interno); pregunta, oleada y corte en una sola barra pegada, cuyo N es el total de la oleada y el de la figura las respuestas (un registro de decisiones interno); el estado va en la dirección, `?p=&vista=&ola=&corte=`), **Descargas** (`#/descargas`), **Ficha técnica** (`#/ficha`: la encuesta en sí, solo descriptiva; `FichaTecnica.tsx`) y **Sobre los datos** (`#/datos`, con
  el método de cada historia en `?foco=metodo-<id>`).

El tablero, que reconstruía módulo por módulo el monitor Shiny que ICLAC publica hoy desde la cuenta
de un tercero, **salió de la app** (Felipe, 22-09-2026): sumaba las oleadas activas en cada módulo.
`#/tablero` lleva al explorador. El código del monitor (de Bastián Olea, especificación y no
dependencia) sigue en `la documentación interna`, y el inventario
figura por figura en `encuesta/docs/sprint_1/paridad_monitor.md` del mismo repo.

## Mapa del código

React + TypeScript + Vite, Tailwind 3.4, `HashRouter`. Los números de línea son aproximados. Para
quién llama a qué, el MCP `code-review-graph` (`.mcp.json`); su índice local se rehace con
`uvx --from "code-review-graph[embeddings]" code-review-graph update`.

| Dónde | Qué hay |
|---|---|
| `src/App.tsx` | Rutas y páginas que no son historias: `App` (rutas), `Marco` (159, encabezado), `SobreLosDatos` (203) |
| `src/historias/` | `indice.tsx` (registro: id, bloque, pregunta, hallazgo, contrastes que la sostienen), `MenuHistorias.tsx` (la raíz), una historia por archivo (`recorrido.tsx` tiene `La mirada` y `Entre dos potencias`, partidas del recorrido viejo; `territorio`, `inversion`, `cotidiana`, `vacuna`), `comun.tsx` (`AnioDelPaso`, `LeyendaDeOleadas`) y `lectura.ts` (`lector`, `serieDeMedida`, `casosDe`) |
| `src/componentes/CapaRecorrido.tsx` | La capa: `paradasDeCambio` (90, adónde llevan teclado y flechas), `CapaRecorrido` (171, props `metodo` y `salida`; `irA` y las flechas «Anterior»/«Siguiente»), `Portada` (494), `Respiro` (619), `Escena` (720; en escritorio el texto corre, un registro de decisiones interno), `Pista` (958, con las tarjetas de frase), `Cierre` (1066) |
| `src/nucleo/pasos.ts` | `usePasoActivo`, `pasoActivo`, `useMovimientoReducido` |
| `src/nucleo/modulos.ts` | `TERMOMETRO`, `CORTES` (los de la barra del explorador), `variableDe` |
| `src/nucleo/paleta.ts` | `IDENTIDAD`, `ORDEN` y `pasosDeOrden` (rampa de oleadas), `GRUPOS`, `pasosDeGrupo`, `GENERO`, `IDEOLOGIA` y `MACROZONA` (grupos de un corte en el explorador, que no se pintan como oleadas; cada corte declara la suya en `CORTES` y `paletaDeCorte` la aplica por grupo), `SEMANTICOS` (color por etiqueta) |
| `src/nucleo/termometro.ts` | Escala, orden y rótulo del termómetro de «La mirada» (el explorador lo muestra en barras de 0 a 100) |
| `src/nucleo/explorador.ts` | Qué dibuja el explorador en sus tres estados (una oleada, con corte, entre oleadas), leído del catálogo `encuesta.preguntas` |
| `src/nucleo/` resto | `agregar.ts` (porcentajes; `participacion`: respuestas no son personas), `ficha.ts` (cifras de la «Ficha técnica»), `confianza.ts` (`p24`/`p25`), `escala.ts`, `tipos.ts` |
| `src/componentes/` | Figuras: `FiguraExplorador` (la única del explorador: barras sin comparar, en el termómetro y en las de dos categorías; mancuerna con `Puntos` en las demás comparaciones; `formaDeFigura` en `explorador.ts` decide), `BarrasPosicionamiento` (`p26`), `Divergente` (escalas ordinales), `Puntos`, `Regresion`, `Enfasis`. Además `BarrasDeEscena` (barras de las historias), `MapaRegiones` (las 16 regiones, geometría de simplemaps), `Encabezado`, `MetodoHistorias` (método por historia, plegable), `Evidencia` (una prueba dibujada con su intervalo; la única forma de escribir un contraste en «Sobre los datos»), `MetodoRecorrido` (el caso de la recta), `Contrastes` (cómo se prueba y la tabla de medidas), `Descargas`, `Graficador` (el explorador), `BarraEstado` |
| `src/textos.ts`, `src/locale.ts` | Cromo en tres idiomas; formato de números según idioma |
| `src/index.css` | Estilos globales, incluidas las medidas de la capa (`--barra-capa`, `--alto-capa`) |
| `scripts/etl_combinada.mjs` | ETL de producción: `data/sources/combinada/ICLAC_2023_2025_combinada.xlsx` → `public/data/encuesta.json` (`olas`, `variables`, `multiples`, `preguntas`, `casos`, `contrastes`, …) |
| `scripts/lib/preguntas_explorador.mjs` | El catálogo del explorador: título, enunciado, orden de categorías, etiquetas por oleada y qué se compara, pregunta por pregunta; el ETL lo valida contra los datos y falla si no cuadra. Procedencia en `encuesta/docs/explorador/` de la documentación interna |
| `scripts/lib/abiertas.mjs` | Las preguntas abiertas (`ABIERTAS` en el catálogo) como múltiples de palabras: marca por persona si contestó y cada palabra candidata, sin el texto |
| `scripts/lib/ficha.mjs` | Campo de cada oleada (`endtime`, `duration`) e índice de exposición del archivo de diseño, a `encuesta.ficha`; se detiene si el índice no cuadra con `impacto()` |
| `scripts/lib/contraste.mjs`, `contrastes.mjs` | Permutación y bootstrap; qué comparaciones se publican y sus familias de Holm (`FAMILIAS`; skill `afirmaciones`) |
| `scripts/etl.mjs` | ETL viejo por oleada sobre `data_csv.csv`; lo usan las pruebas de la microdata publicada |
| `scripts/geometria_regiones.mjs` | SVG de simplemaps (`data/sources/geo/`) → `public/data/chile-regiones.json`; corre dentro de `npm run datos` |
| `scripts/mirar_recorrido.mjs` | Recorre cada historia (o la pedida) con Playwright y mide costo de paso, escenas y leyendas a la vista |
| `scripts/mirar_explorador.mjs` | Recorre cada pregunta del explorador en sus tres estados y anchos; mide desbordes, títulos, valores cortados y consola |
| `scripts/laboratorio.mjs`, `laboratorio/` | Laboratorios de composición (skill `laboratorio`) |
| Pruebas | `scripts/*.test.mjs` (`informe_2023`, `contrastes`, `descargas`, `guia_urdinez`, `historias`: vocabulario, `preguntas_explorador`: el catálogo contra los datos), `scripts/lib/*.test.mjs`, `src/nucleo/*.test.ts` (`explorador`: cada pregunta en cada estado) |
| `data/sources/` | Fuentes del cliente por oleada, la combinada y la metodología; su `README.md` dice cuál es canónica |

## Comandos

```bash
npm run dev          # Vite en 5180; desde otra máquina: http://localhost:5180
npm run typecheck && npm run lint && npm test    # lo mínimo antes de cerrar algo
npm run datos        # etl:combinada + descargas
npm run lab:<tema>   # copia un laboratorio a public/ (lab, lab:cierre, lab:portada, lab:cotidiana, lab:scroll; lab:decisiones es el dashboard de decisiones)
npm run build
```

Verde en los tres primeros no dice nada sobre lo visible: eso se mide en el navegador (skill
`verificar-navegador`).

## Skills del proyecto: cargarlas antes de tocar su tema

| Skill | Cuándo |
|---|---|
| `recorrido` | Cualquier cambio en la capa, sus escenas, pasos, portada, respiros o cierre |
| `laboratorio` | Decidir la composición de algo visible antes del código; cuando Felipe pega un JSON de laboratorio |
| `afirmaciones` | Escribir o cambiar una frase, titular, pie o cifra; tocar los contrastes; decidir si una diferencia es real |
| `verificar-navegador` | Antes de dar por cerrado cualquier cambio visible |
| `dataviz` (global) | Antes de tocar color, escala, leyenda o rótulos de una figura |

## Los siete hechos de los datos

Cada uno cambia lo que se puede construir. Detalle y procedencia en `data/sources/README.md`.

1. **No es un panel: son tres cortes transversales.** En la combinada, 159 panelistas aparecen en más
   de una oleada (`olas_panelista`: 2.221 en una, 278 en dos, 60 en tres). No se sigue a nadie entre
   oleadas, y **«panel» no se usa** para el producto; se dice «oleadas» o «la serie». Solo vale «panel
   en línea» para el de Netquest.
2. **No hay ponderadores y la muestra no es probabilística** (panel en línea por cuotas). Resultados
   sin ponderar, sobre casos efectivos, **sin margen de error**, con el N a la vista.
3. **Mismo nombre no es misma pregunta.** Derivaron `P4` (votó → votaría; en 2025 los códigos cambian
   de candidato), `P21` (inversión de China → extranjera), `P17` (escala → abierta), `P15` y `P9`
   (categorías), y `P6` cambió redacción. La combinada trae `p4_voto`, `p9_rec`, `p15_rec` y
   `uso_serie_longitudinal`. **Solo se comparan entre oleadas las preguntas con enunciado y categorías
   idénticas**; `P21` no, ni con derivada. **Excepción decidida por Felipe (undécima ronda): `P4`** se
   compara en el explorador **por candidato, no por código** (Kast en las tres; Boric solo en 2023-2024,
   Jara solo en 2025), con la nota de que 2023-2024 recuerdan el voto de 2021 y 2025 pregunta por uno
   hipotético (`recodificar` en el catálogo). Un validador de datos no ve este fallo.
4. **Los libros de códigos no cuadran con sus datos.** Se verifica contra los datos, nunca contra el
   libro. Los `.dta` de 2023 están en utf-8: cortar en el primer NUL **antes** de decodificar; los de
   2024 no traen value labels. A las etiquetas de `comuna` de 2023 les falta la sílaba «vi» («ña del
   Mar»): se documenta y no se parcha (`C10`, en `generales/correcciones_cliente.md` de la documentación interna).
5. **La muestra no aguanta cortes profundos.** En 2025 (1.228 casos) educación deja un grupo de 2 y
   región × educación da mediana de 6,5 por celda. **Un corte a la vez, y agrupado antes de ofrecerlo**
   (macrozonas, no 16 regiones).
6. **2025 tiene tres cifras de opinión sobre China:** 67,0 (derivada de 662, hoja `labels`, la que
   publica el monitor), 64,9 (misma derivada, hoja `data`) y 65,8 (entrega original de 1.228, la de la
   combinada). Cuál se publica es decisión de ICLAC (`C8`), y la figura dice cuál usa. **Nunca unir
   hojas por número de fila:** por `key`. El monitor calcula sobre el total con los que no contestaron;
   el visualizador, sobre respuestas efectivas.
7. **El Policy Paper ICLAC 03 verifica la oleada 2023** y está enganchado como prueba de aceptación
   (`scripts/informe_2023.test.mjs`): porcentajes al decimal, termómetro 61,4 (China) y 71,8 (Japón).
   La microdata publicada en el sitio de ICLAC no trae el número del termómetro (prueba `C9b`). **Los
   centinelas se reconocen por etiqueta, no por número:** en 2023, 98 «Otro» y 99 «Ninguna» son
   respuestas reales; 999 no.

## Convenciones

- **Un dato, un lugar.** Tenerlo en dos garantiza que diverjan. Vale también para estos documentos.
- **Los problemas de datos se documentan, no se parchean.** Salvo correcciones deterministas y sin
  pérdida, que se aplican y se listan. Todo pendiente de datos necesita su instrumento, y un validador
  que grita sobre datos correctos deja de leerse.
- **Marca:** `brand` `#00A89C`, `brand-dark` `#00776E`. Nunca `text-white` sobre `brand` (2,96:1).
  Categóricos nuevos se generan con el validador de `dataviz`; no se copia la paleta de `mapa_FDI`.
- **Ningún locale a mano** en un `Intl`; `cn` es etiqueta interna, `Intl` conoce `zh`.
- **El vocabulario del equipo no va en la interfaz** («microdata», «ponderador», «quiebre de serie»).
- **Una figura por pregunta.** Si dos vistas muestran la misma pregunta, pasan por el mismo código
  (`termometro.ts`, con una prueba que lee `src/historias/recorrido.tsx`). Excepción decidida por
  Felipe (décima ronda): el explorador muestra el termómetro en barras de 0 a 100, sin recorte, y no
  pasa por `termometro.ts`. A una variable continua no
  se le pide distribución por categoría: con corte va la media por grupo. La bajada es cierta en
  todos los estados de la figura.
- **Una figura pensada para columna angosta no se estira a ancho completo** sin revisar su lienzo.
- **Un `--algo` escrito en `style` no lo alcanza ninguna media query:** dos nombres y
  `var(--algo-ancho, var(--algo))` (usado en `Puntos`).
- **`z-index` no tapa un texto:** lo que tapa es un relleno. Un número que está en la frase y en la
  figura se redondea igual en las dos; `minimoRotulo` depende del largo del texto.
- **Alturas medidas, publicadas como variable** (`--alto-encabezado` por `ResizeObserver`,
  `--barra-capa`), nunca literales.
- **Una familia declarada no es una familia cargada:** Raleway se importa en `src/index.css`, pesos 400
  y 600.
- **Un control que se presiona se hunde** (`.presionable` en `src/index.css`, 0,97 en 160 ms), salvo las
  tarjetas del menú, cuya caja copia la transición en el clic. **Los `hover:` solo existen con puntero
  fino** (`hoverOnlyWhenSupported` en `tailwind.config.js`): nada que solo se descubra con el cursor.
  Por qué, y lo que no se aplicó de las skills de diseño externas: un registro de decisiones interno.
- **Un control que no hace nada no se publica; uno que hace la mitad dice cuál.** El selector de
  idioma cubre el cromo y una franja lo declara.
- **El encabezado replica el de iclac.cl** (88 px escritorio, 60 teléfono, sombra y no borde; nav
  completo desde `lg`). El estado del explorador vive en `App` y sobrevive al cambio de vista.
- **Commits** en español, en presente y describiendo el efecto («El recorrido estrena cierre y
  portada»). Solo cuando Felipe lo pide.
