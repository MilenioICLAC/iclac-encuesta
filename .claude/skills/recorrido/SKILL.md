---
name: recorrido
description: Reglas para construir y modificar el recorrido con scroll (scrollytelling) del visualizador ICLAC. Se usa al tocar `CapaRecorrido.tsx`, `nucleo/pasos.ts`, las escenas, respiros, portada o cierre en `App.tsx`, o al agregar un paso, una figura que se enciende con el scroll o cualquier animación ligada al scroll.
---

# El recorrido con scroll

Solo reglas vigentes. De dónde salió cada una, con sus mediciones: un registro de decisiones interno (scroll y capa),
0021 (laboratorio), 0022 (geometría), 0023 (composición), en `la documentación interna`,
`encuesta/docs/adr/`. Lo que queda pendiente: `encuesta/docs/estado.md` §2.2.

**Antes de cambiar la composición de algo visible, skill `laboratorio`.** Antes de escribir una frase
o una cifra, skill `afirmaciones`. Antes de dar algo por cerrado, skill `verificar-navegador` y la
lista del final.

## Estructura

Todo vive en la capa (`CapaRecorrido`, `fixed inset-0`, con barra superior medida en `--barra-capa`):

| Pieza | Componente | En la barra | Índice |
|---|---|---|---|
| Portada | `Portada` | «Portada» | 0 |
| Escena 1 a N | `Escena` | «Escena N de M» y un punto por paso | 1 a N |
| Respiro (pausa entre escenas) | `Respiro` | «Pausa» | negativo |
| Cierre | `Cierre` | «Cierre» | −99 |

Desde el 21-09-2026 hay **cinco historias**, cada una una capa propia en `#/historias/<id>`, con
registro en `src/historias/indice.tsx` y menú en la raíz:

| Historia | Archivo | Escenas |
|---|---|---|
| La mirada | `src/historias/recorrido.tsx` (`parte="mirada"`) | 1 termómetro por país; 2 ideología (la recta y el punto de treinta personas) |
| Entre dos potencias | ídem (`parte="potencias"`) | 1 confianza (`p24`/`p25`, `Divergente`); 2 la misma comparación dentro de cada persona; 3 posicionamiento (`p26`) |
| Donde uno vive | `src/historias/territorio.tsx` | 1 riesgo (`p7`); 2 el mapa y los cuatro niveles de exposición, en un paso; 3 riesgo por nivel; 4 rol en la comuna (`p8`). «Estrato» no se dice en pantalla |
| Inversión y Estado | `src/historias/inversion.tsx` | 1 quiere poder limitar (`p19`); 2 sectores (`p20`, puntos por oleada) |
| China cotidiana | `src/historias/cotidiana.tsx` | 1 mall y restaurante; 2 conoce a alguien; 3 buses (2025); 4 racismo visto y quién lo ve |
| La vacuna | `src/historias/vacuna.tsx` | 1 dice haberla recibido, y el reparto de 2025 con «No recuerdo»; 2 buena opinión y preferencia por Pfizer |

Las historias nuevas usan `BarrasDeEscena`. Lo que dice el resto de esta skill del «recorrido» vale
para cada historia.

## Editorial

- **Un paso, un cambio visible.** Si dos pasos seguidos muestran lo mismo, sobra uno.
- **Si la figura cambia, cambió la escena, y en medio va un respiro.** Un cambio de figura es un
  cambio de pregunta. El respiro es una frase sola, centrada, **sin nada de la escena**: ni titular,
  ni pie, ni leyenda, ni año, ni enlace. No se numera.
- **Una escena puede cambiar de filas sin cambiar de eje** (la 1 pasa de países a tramos
  ideológicos): la escala se calcula sobre los dos juegos de filas juntos.
- **El encabezado sigue al paso.** `titulo`, `nota` y `cabecera` aceptan una función del paso: un pie
  que describe la figura anterior contradice a la actual.
- **Lo que sigue a una historia es otra** (Felipe, 22-09-2026). El tablero salió de la app ese mismo
  día; el cierre ofrece además el explorador.
- **Cada historia publica su método** en «Sobre los datos» (`#/datos?foco=metodo-<id>`, armado desde `indice.tsx`), enlazado
  desde la barra (oculto bajo 640 px). Una frase sin prueba ahí no debería estar en el recorrido.
- **Contar el método vale cuando el método es el hallazgo**, y solo si retirar el punto da vuelta la
  conclusión; si no, esos pasos no se dibujan.
- **Pocos pasos:** dos minutos de lectura, tres o cuatro frases por escena. Las cifras se calculan
  (`encendidos()`, `lector()`), no se escriben a mano.
- **Portada:** logo de ICLAC, «¿Qué opina la gente sobre China?» y un botón de tres arcos flotando en
  cascada con «Haz scroll para desplazarte» («Desliza» con puntero táctil, por media query de puntero
  y no por ancho). El botón hace lo mismo que el gesto. Sin lista de escenas.
- **Cierre:** repite conclusiones, no escenas. Los titulares de las escenas, cada uno enlazado a su
  escena y en gris 500 al pasar. En un paso propio, la salida: la historia siguiente como la tarjeta
  del menú («Siguiente · Historia N», su pregunta y «Leer la historia →», por el contexto `Siguiente`
  que arma `App`); en la última, «Ver todas las historias →». Debajo, en texto: volver a las
  historias (no en la última, que ya lo es), explorar las preguntas, cómo se hizo (el método de la
  historia) y volver al inicio. Las frases **son** los titulares, escritos una vez.

## Honestidad de la animación

Están también en `src/nucleo/pasos.ts`:

1. **La escala nunca depende de lo visible.** Se calcula con todos los datos y se pasa hecha.
2. **Ocultar no es borrar.** Lo apagado queda en el DOM con opacidad cero. Solo el trazo y los rótulos
   se calculan sobre lo encendido.
3. **El último paso enciende todo**, y es el estado con movimiento reducido o sin JavaScript.

No se interpolan anchos entre oleadas ni se le pone fecha a un cruce entre mediciones.

## La figura dice sola qué muestra

- **Encabezado en dos niveles:** titular con el hallazgo, bajada con qué se mira.
- **La unidad va en el eje**, con aire propio; si el eje está recortado, lo declara.
- **Oleadas con rampa de claro a oscuro** (`pasosDeOrden`), nunca categóricos, y el punto crece con la
  oleada (`radioCreciente` en `Puntos`) para que la secuencia se lea también sin color.
- **El año del paso en grande, arriba a la derecha, fuera del lienzo.** La leyenda, al pie a la
  derecha, y solo cuando el color significa algo (con una sola oleada dibujada, no va).
- **Una sola leyenda por figura.** `Puntos` trae la suya y se apaga con `leyenda={false}`. La muestra
  de la leyenda es la marca real, no una barra de color.
- **Con la serie destacada encendida se rotula esa y ninguna más.**
- **Contexto (bajada, nota) en gris 500**, el último tono con 4,5:1 sobre blanco.
- **El orden de dibujo es diseño:** recta primero, después puntos y rótulos.
- **Un color que identifica algo no cambia a mitad de escena.** Rótulos que se pisan no se separan a
  la fuerza: la información va a la leyenda.
- **Escalas con polaridad, divergentes** (`Divergente`): categoría neutra a caballo del cero, color
  del número decidido por la luminancia del relleno, y el nombre de la fila no se apaga con la fila.
- **Toda figura lleva texto equivalente** (`sr-only` o `aria-label`) y su nota con el N.

## Gestos y énfasis

- **Lo que dice de qué habla el paso va estático**, dura todo el paso y se apaga en el siguiente
  (`Enfasis`): doble anillo blanco y tinta **dentro** del segmento, uno solo por paso. Si la frase
  habla de varios segmentos a la vez, no va marca. **No se apaga con movimiento reducido**: es
  información, no movimiento.
- **La emanata es el gesto de entrada y salida de un punto:** ocho líneas largas y cortas alternadas,
  una sola vez, animando solo `stroke-dashoffset` y `opacity`, a 3× el punto como máximo. Dos
  implementaciones: `.dato-emanata` (`<span>` con `conic-gradient` y `mask`) y `.emanata` (`<line>` en
  SVG, donde no hay pseudo-elementos). **Con movimiento reducido no se dibuja.**
- **Solo se anima `opacity` y `transform`**, 150 a 500 ms.

## Mecánica

- **La figura se fija con `position: sticky`**, nunca con un listener de scroll.
- **El disparador es `IntersectionObserver`** sobre una pista invisible (`Pista`, `aria-hidden`), con
  `root` en el contenedor de la capa y banda angosta `rootMargin: '-45% 0px -45% 0px'`. Cada paso tiene
  que ser más alto que la banda.
- **La pista sube el alto de la escena entero** (`marginTop: -altoEscena` en `Pista`), sin restar
  el colchón, que ya está dentro. Colchón de entrada 0,55 × alto, pasos de 0,75 × alto, colchón de
  salida 0,2 × alto. En píxeles medidos, nunca en porcentaje.
- **La escena no lleva margen negativo:** su alto propio es lo que separa una escena de la siguiente.
- **Imán `scroll-snap-type: y mandatory`**, `scroll-snap-align: start` en cada paso y
  `scroll-margin-top` igual al colchón. **Todo el recorrido tiene puntos** (pasos, colchones, portada,
  respiros, cierre) y **ningún par consecutivo está a más de una pantalla**. `proximity` no sirve.
  **La lista de puntos está dos veces:** en el CSS (`scroll-snap-align` en `src/index.css`) y en el
  selector de paradas del teclado (`CapaRecorrido`, `'.portada-recorrido, .respiro-recorrido,
  .colchon-recorrido, .paso-recorrido'`). Cambiar una sin la otra deja al teclado parando donde la
  rueda no, o al revés.
- **Teclado:** la capa maneja `PageUp`/`PageDown` y flechas llevando al anclaje siguiente. Los anclajes
  se miden con `getBoundingClientRect().top − (capa.getBoundingClientRect().top − capa.scrollTop)`,
  nunca con `offsetTop`, **menos el `scroll-margin-top` del elemento**: la parada es donde el imán deja el
  scroll, no el borde. Sin restarlo, PageUp no salía del cierre (21-09-2026). No es scroll-jacking: rueda y gesto quedan intactos.
- **El alto sale del contenedor y va en píxeles** (`--alto-capa`), con `svh` de respaldo para el primer
  cuadro. Nunca `100%` (se resuelve contra una sección sin alto) ni `vh`.
- **La escena se pega bajo la barra**; la barra se mide y se publica en `--barra-capa`. Alto útil de
  una escena = capa − barra.
- **Respiro y portada miden la pantalla entera**, barra incluida; su escena interna va pegada bajo la
  barra. Con el alto de una escena se asoma la siguiente.
- **La geometría se fija al abrir** y se rehace solo si cambia el ancho (la barra del navegador móvil
  cambia el alto sin que sea una rotación).
- **El bloque de texto no cambia de alto:** todas las frases en la misma celda de una grilla, una
  frase por paso en todos los anchos. Con movimiento reducido el párrafo **no** lleva la grilla.
- **El bloque de la figura no se encoge entre pasos:** `Escena` guarda su mayor alto por ancho con
  `useLayoutEffect`.
- **Pantallas bajas:** media query por alto (`max-height: 700px`); el aire es lo primero que cede.
- **La capa es una ruta** (`#/historias/<id>`). Sin `pushState` propio. Salir lleva al menú de historias y
  el botón lo dice («Volver a las historias», prop `salida`). En iOS, bloquear el fondo pide `position: fixed` con `top: -scrollY`.

## Escritorio: dos columnas

- **Desde 900 px de ventana**, con media query (la capa es la ventana; en el laboratorio, container
  query).
- Titular y frase juntos en una columna (`align-self: stretch`, frase con `margin-block: auto`), figura
  en la otra. Envoltorio `display: contents` bajo el umbral. No hacer que la figura ocupe dos filas.
- Texto a 27 px (titular) y 34 px (frase); filas de 58 px y nombres a 14 px. Revisar que «Estados
  Unidos» no salga cortado.
- **Solo en escenas con una figura** (`dosColumnas` en `Escena`).

## Accesibilidad

- Texto entero en el DOM siempre, con opacidad, nunca `display: none`.
- Botón de salida siempre visible, `Escape`, barra de avance y posición en texto (`sr-only`,
  `aria-live="polite"`).
- Trampa de foco con los focos **filtrados por visibilidad** (`checkVisibility()`, respaldo
  `getClientRects().length > 0`), foco al abrir y devuelto al cerrar.
- **Movimiento reducido:** escena completa desde el primer píxel, **sin pista y sin imán** (media
  query que apaga el snap), arcos quietos, sin emanata; el énfasis estático se queda.

## Lo que no se hace

- `animation-timeline` / `scroll()` / `view()` de CSS: sin soporte Baseline (MDN, 05-09-2026).
- Scroll-jacking o «un gesto, un paso». Parallax. Librerías de scroll (`scrollama`, GSAP).
- Un canvas de diseño estático para decidir comportamiento en el tiempo: para eso está el laboratorio.

## Límites conocidos (15-09-2026)

- Entre portada o respiro y la escena siguiente hay un punto de imán intermedio (el colchón de entrada
  de la escena, a 0,45 × alto): un gesto corto deja la pantalla partida. Arreglarlo toca el CSS **y**
  el selector del teclado, y hay que medir el cierre, que va detrás de la escena 5 sin respiro.
- Tras un salto largo por código (enlace del cierre a su escena y vuelta), dos pasos tocan la banda y
  el activo queda en el más cercano al anterior. Con la rueda no pasa.

## Verificación antes de cerrar

1. `npm run typecheck && npm run lint && npm test`. Verde no dice nada de lo que sigue.
2. Anchos de la skill `verificar-navegador`: al menos 360×640, 390×844 táctil, 899, 901 y 1512.
3. `node scripts/mirar_recorrido.mjs 360` y `768`: costos de paso iguales, una escena a la vista salvo
   en la transición, una leyenda por figura. Abrir las capturas. **Ese script apaga el imán** para
   medir la geometría: no dice nada del snap, que va en el punto 8.
4. Medido: el bloque de la figura no se mueve entre pasos, y el **último hijo** de la escena queda
   dentro de la capa en 360×640 y 375×667.
5. Pasando de una escena a la siguiente, no una sola: superposición y paso desparejo.
6. Con teclado de punta a punta en los dos sentidos, sin pasos saltados; `Shift+Tab` no escapa.
7. Con movimiento reducido: todo encendido, frases sin superponerse, sin pista.
8. Imán con `mouse.wheel`, no con `scrollTop`: ningún contenido inalcanzable, empezando por la salida.
9. Si vino de un laboratorio: contra el JSON, parámetro por parámetro, textos verbatim.
10. Lo que el emulador no reproduce (barra del navegador móvil) se reporta como no verificado.

## Fuentes

- The Pudding, *Easier scrollytelling with position sticky*: https://pudding.cool/process/scrollytelling-sticky/
- `scrollama`, README v2: https://github.com/russellsamora/scrollama
- *Scrollytelling Design Patterns*: https://scrollytelling.ai/scrollytelling-design-patterns/
- MDN, `animation-timeline`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline
