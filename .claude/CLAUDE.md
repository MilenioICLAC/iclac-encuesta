# CLAUDE.md — Visualizador de la encuesta ICLAC

Reglas que no caducan, un mapa y dónde está el resto. **Lo que falta hacer** vive en
`la documentación interna documentación interna` (repo privado `la documentación interna`). **Por
qué algo es como es** vive en los ADR de la misma carpeta, `docs/adr/` (índice en su `README.md`).
Acá no va historia: si una regla necesita su anécdota para entenderse, la anécdota va a un ADR.

## Qué es

Visualizador de la **Encuesta de Percepciones sobre China en Chile** (ICLAC, una oleada por año:
2023, 2024, 2025). Cinco vistas con ruta por hash:

- **Recorrido** (raíz y `#/recorrido`): capa a pantalla completa que avanza con el scroll. Portada,
  cinco escenas separadas por pausas («respiros») y cierre.
- **Tablero** (`#/tablero`, `?foco=<id>`): módulos por pregunta, selector de oleada, filtro y un corte.
- **Explorador** (`#/explorar`), **Descargas** (`#/descargas`) y **Sobre los datos** (`#/datos`, con
  «Cómo se hizo el recorrido» en `?foco=metodo-recorrido`).

El tablero reconstruye el monitor Shiny que ICLAC publica hoy desde la cuenta de un tercero. Su código
(de Bastián Olea, especificación y no dependencia) está en
`la documentación interna`; el inventario figura por figura, en
`encuesta/docs/sprint_1/paridad_monitor.md` del mismo repo.

## Mapa del código

React + TypeScript + Vite, Tailwind 3.4, `HashRouter`. Los números de línea son aproximados. Para
quién llama a qué, el MCP `code-review-graph` (`.mcp.json`); su índice local se rehace con
`uvx --from "code-review-graph[embeddings]" code-review-graph update`.

| Dónde | Qué hay |
|---|---|
| `src/App.tsx` | Todo lo de página. `App`, `Marco` (177, encabezado y rutas), `encendidos` (232), `lector` (313, lee contrastes), `Recorrido` (373: portada ~580, escenas `indice={1..5}` en 592/731/840/923/1011, respiros con índice negativo, cierre al final), `Tablero` (1070), `Figura` (1144), `TermometroTablero` (1258), `MultipleFigura` (1319), `SobreLosDatos` (1368) |
| `src/componentes/CapaRecorrido.tsx` | La capa: `CapaRecorrido` (80), `Portada` (336), `Respiro` (461), `Escena` (532), `Pista` (742), `Cierre` (826) |
| `src/nucleo/pasos.ts` | `usePasoActivo`, `pasoActivo`, `useMovimientoReducido` |
| `src/nucleo/modulos.ts` | `MODULOS` (qué módulos tiene el tablero y su forma), `TERMOMETRO`, `CORTES` |
| `src/nucleo/paleta.ts` | `IDENTIDAD`, `ORDEN` y `pasosDeOrden` (rampa de oleadas), `SEMANTICOS` (color por etiqueta) |
| `src/nucleo/termometro.ts` | Escala, orden y rótulo del termómetro, compartidos por recorrido y tablero |
| `src/nucleo/` resto | `agregar.ts` (porcentajes), `confianza.ts` (`p24`/`p25`), `escala.ts`, `tipos.ts` |
| `src/componentes/` | Figuras: `BarrasPorOla` (series del tablero), `BarrasPosicionamiento` (`p26`), `Divergente` (escalas ordinales), `Puntos`, `Regresion`, `Enfasis`. Además `Encabezado`, `MetodoRecorrido`, `Contrastes`, `Descargas`, `Nubes`, `Modulo` |
| `src/textos.ts`, `src/locale.ts` | Cromo en tres idiomas; formato de números según idioma |
| `src/index.css` | Estilos globales, incluidas las medidas de la capa (`--barra-capa`, `--alto-capa`) |
| `scripts/etl_combinada.mjs` | ETL de producción: `data/sources/combinada/ICLAC_2023_2025_combinada.xlsx` → `public/data/encuesta.json` (`olas`, `bloques`, `variables`, `casos`, `contrastes`, …) |
| `scripts/lib/contraste.mjs`, `contrastes.mjs` | Permutación y bootstrap; qué comparaciones se publican (skill `afirmaciones`) |
| `scripts/etl.mjs` | ETL viejo por oleada sobre `data_csv.csv`; lo usan las pruebas de la microdata publicada |
| `scripts/mirar_recorrido.mjs` | Recorre la capa con Playwright y mide costo de paso, escenas y leyendas a la vista |
| `scripts/laboratorio.mjs`, `laboratorio/` | Laboratorios de composición (skill `laboratorio`) |
| Pruebas | `scripts/*.test.mjs` (`informe_2023`, `contrastes`, `descargas`, `guia_urdinez`), `scripts/lib/*.test.mjs`, `src/nucleo/*.test.ts` |
| `data/sources/` | Fuentes del cliente por oleada, la combinada y la metodología; su `README.md` dice cuál es canónica |

## Comandos

```bash
npm run dev          # Vite en 5180; desde otra máquina: http://localhost:5180
npm run typecheck && npm run lint && npm test    # lo mínimo antes de cerrar algo
npm run datos        # etl:combinada + descargas
npm run lab:<tema>   # copia un laboratorio a public/ (lab, lab:series, lab:cierre, lab:portada)
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
   idénticas**; `P4` y `P21` no, ni con derivada. Un validador de datos no ve este fallo.
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
- **Una figura por pregunta.** Si recorrido y tablero muestran la misma pregunta, pasan por el mismo
  código (`termometro.ts`, con una prueba que lee `App.tsx`). A una variable continua no se le pide
  distribución por categoría: con corte va la media por grupo. La bajada es cierta en todos los
  estados del módulo.
- **Una figura pensada para columna angosta no se estira a ancho completo** sin revisar su lienzo.
- **Un `--algo` escrito en `style` no lo alcanza ninguna media query:** dos nombres y
  `var(--algo-ancho, var(--algo))` (usado en `Puntos`).
- **`z-index` no tapa un texto:** lo que tapa es un relleno. Un número que está en la frase y en la
  figura se redondea igual en las dos; `minimoRotulo` depende del largo del texto.
- **Alturas medidas, publicadas como variable** (`--alto-encabezado` por `ResizeObserver`,
  `--barra-capa`), nunca literales.
- **Una familia declarada no es una familia cargada:** Raleway se importa en `src/index.css`, pesos 400
  y 600.
- **Un control que no hace nada no se publica; uno que hace la mitad dice cuál.** El selector de
  idioma cubre el cromo y una franja lo declara.
- **El encabezado replica el de iclac.cl** (88 px escritorio, 79 teléfono, sombra y no borde; nav
  completo desde `lg`). El estado del tablero vive en `App` y sobrevive al cambio de vista.
- **Commits** en español, en presente y describiendo el efecto («El recorrido estrena cierre y
  portada»). Solo cuando Felipe lo pide.
