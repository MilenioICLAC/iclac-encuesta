---
name: recorrido
description: Reglas para construir y modificar el recorrido con scroll (scrollytelling) del visualizador ICLAC. Se usa al tocar `CapaRecorrido.tsx`, `nucleo/pasos.ts`, las escenas, respiros, portada o cierre de una historia (`src/historias/`), o al agregar un paso, una figura que se enciende con el scroll o cualquier animación ligada al scroll.
---

# El recorrido con scroll

Solo reglas vigentes. De dónde salió cada una, con sus mediciones, y lo que queda pendiente, está
en la documentación interna.

**Antes de cambiar la composición de algo visible, skill `laboratorio`.** Antes de escribir una frase
o una cifra, skill `afirmaciones`. Antes de dar algo por cerrado, skill `verificar-navegador` y la
lista del final.

## Estructura

Todo vive en la capa (`CapaRecorrido`, `fixed inset-0`, con barra superior medida en `--barra-capa`):

| Pieza | Componente | Índice |
|---|---|---|
| Portada | `Portada` | 0 |
| Escena 1 a N | `Escena` | 1 a N |
| Respiro (pausa entre escenas) | `Respiro` | negativo |
| Cierre | `Cierre` | −99 |

**La barra no nombra piezas** (Felipe, 22-09-2026): «escena», «pausa», «paso», «portada» y «cierre»
son vocabulario interno. La barra de avance **no se corta** (Felipe, 02-10-2026): ni lo recorrido ni
lo que falta llevan marcas; hasta esa fecha había un corte blanco de 4 px en cada paso y cada respiro.
Dice cuánto falta, no qué viene.
Se dibuja como una ola de tinta que deja atrás un junco negro (`BarraDeAvance.tsx`, laboratorio
`barra-barco`, 25-09-2026): tinta de 6 px en tres hebras en `brand-dark`, lo que falta en gris 200,
ola de 1,5 px y 40 px de largo con período fijo en píxeles (no se estira con el ancho), y un barco
de 20 px centrado en la punta, que se inclina con la mitad de la pendiente y va derecho con
movimiento reducido. La barra mide 27 px y la franja de arriba 44 (antes 6 y 43).

Desde el 22-09-2026 hay **seis historias**, cada una una capa propia en `#/historias/<id>`, con
registro en `src/historias/indice.tsx` y menú en la raíz:

| Historia | Archivo | Escenas |
|---|---|---|
| La mirada | `src/historias/recorrido.tsx` (`parte="mirada"`) | 1 termómetro por país; 2 ideología (la recta y el punto de treinta personas); 3 lo primero que se les viene a la cabeza (palabras de `p4_1` y `p4_2`, «Trump») |
| Entre dos potencias | ídem (`parte="potencias"`) | 1 confianza (`p24`/`p25`, `Divergente`); 2 la misma comparación dentro de cada persona; 3 posicionamiento (`p26`) |
| Donde uno vive | `src/historias/territorio.tsx` | 1 riesgo (`p7`); 2 el mapa y los cuatro niveles de exposición, en un paso; 3 riesgo por nivel; 4 rol en la comuna (`p8`). «Estrato» no se dice en pantalla |
| Inversión y Estado | `src/historias/inversion.tsx` | 1 quiere poder limitar (`p19`); 2 sectores (`p20`, puntos por oleada) |
| China cotidiana | `src/historias/cotidiana.tsx` | 1 mall y restaurante; 2 conoce a alguien; 3 dónde es el contacto (palabras de `p16`); 4 buses (2025); 5 racismo visto y quién lo ve |
| La vacuna | `src/historias/vacuna.tsx` | 1 dice haberla recibido, y el reparto de 2025 con «No recuerdo»; 2 buena opinión y preferencia por Pfizer |

Las historias nuevas usan `BarrasDeEscena`. Lo que dice el resto de esta skill del «recorrido» vale
para cada historia.

**Entrada desde el menú (22-09-2026):** el clic en una tarjeta apila las demás bajo ella, centra la
pila, hace crecer el fondo de la elegida hasta cubrir la pantalla (se desvanece todo menos la
pregunta), navega y lleva la pregunta hasta el `.pregunta-portada` **medido** en la capa ya montada;
después se destapa la portada. **La cuchara del sinan viaja con la pregunta** (laboratorio del viaje,
25-09-2026): la de la tarjeta (`data-cuchara`, la de la portada a 28 px, flotando) no se apaga con el
resto, va bajo el título oscilando como brújula y, 150 ms después de destapar, se divide en tres que
se posan en el ícono de scroll y en «Anterior»/«Siguiente» (una sola en teléfono). Los íconos
esperan vacíos por `data-cuchara-viaja` en `<html>`; un scroll, Atrás o `Escape` cortan la división
y los dejan en su lugar. Vive en `src/historias/Transicion.tsx`, fuera de las rutas. **Si
cambia la clase o el estilo del título de la portada, la transición lo sigue sola** (copia el
estilo calculado), pero el selector `.pregunta-portada` tiene que seguir existiendo en las seis. El relleno de la
tarjeta es `RELLENO` (`TarjetaHistoria.tsx`), el mismo en el menú y en la copia elegida: escrito a
mano en las dos, la pregunta arranca corrida. Las dos preguntas se cruzan con un blur de 2 px que
termina en cero.

## Editorial

- **Un paso, un cambio visible.** Si dos pasos seguidos muestran lo mismo, sobra uno.
- **Si la figura cambia, cambió la escena, y en medio va un respiro.** Un cambio de figura es un
  cambio de pregunta. El respiro es una frase sola, centrada, **sin nada de la escena**: ni titular,
  ni pie, ni leyenda, ni año, ni enlace. No se numera.
- **Se entra a la pausa con un fundido en el lugar** (22-09-2026, laboratorio de la pausa, opción A
  con B). La escena anterior no sube como una página (se llevaba primero titular y frase): se queda
  pegada, y al cruzar la línea de la pausa se desvanece mientras la frase de la pausa entra desde
  abajo, 20 px y 500 ms como las frases. Geometría en `index.css` (`.escena-recorrido +
  .respiro-recorrido`, con `:has()`); el estado, `data-cruzada`, lo pone `Respiro` leyendo su
  posición en cada scroll, porque una marca observada se cruza de un salto sin avisar.
- **La pausa queda quieta un paso y la escena siguiente sube poco** (25-09-2026, laboratorio
  `pausa-corta`): quieta lo que mide el paso de la escena de antes (0,75, o 0,4 con el texto que
  corre), y la escena siguiente, montada sobre el final de la pausa, sube solo `SUBIDA_TRAS_PAUSA`
  (0,4) y aparece con un fundido (`data-salida`, también de `Respiro`) mientras la frase de la pausa
  se va hacia arriba. La pausa cuesta 2 pasos en escritorio y 1,5 en el teléfono; antes, 4,4 y 2,3,
  y su tramo en la barra confundía. En escritorio la frase de la pausa **corre**: entra al 80 % y
  sube con el scroll, y las flechas la dejan centrada. Con movimiento reducido la subida vuelve a
  ser una pantalla: sin pasos, la escena entre dos pausas solo se lee mientras sube.
- **Las frases entran desde abajo y salen hacia arriba**, 20 px, 500 ms, curva
  `cubic-bezier(0.2, 0.8, 0.2, 1)`, en todos los pasos y anchos, por `data-lugar` (`antes`,
  `activa`, `despues`); al volver atrás cada una vuelve por donde se fue. Tiempo fijo, no atado al
  scroll (decidido el 22-09-2026 en el laboratorio de las frases).
- **Una escena puede cambiar de filas sin cambiar de eje** (la 1 pasa de países a tramos
  ideológicos): la escala se calcula sobre los dos juegos de filas juntos.
- **El encabezado sigue al paso.** `titulo`, `nota` y `cabecera` aceptan una función del paso: un pie
  que describe la figura anterior contradice a la actual.
- **Lo que sigue a una historia es otra** (Felipe, 22-09-2026). El tablero salió de la app ese mismo
  día; el cierre ofrece además el explorador.
- **Cada figura publica su método en un pop-up** (29-09-2026): la nota que iba al pie más los
  contrastes que la sostienen (`src/historias/medidas.ts`, prop `medidas` de `Escena`, que puede
  depender del paso). El de la historia entera lo abren el «Método» de la barra (oculto bajo 640 px)
  y el «Cómo se hizo» del cierre. Una frase sin prueba ahí no debería estar en el recorrido. El
  pop-up escucha el teclado **en fase de captura** sobre `document` y corta la propagación: si no,
  `Escape` cierra la historia entera y las flechas mueven el recorrido de atrás.
- **Contar el método vale cuando el método es el hallazgo**, y solo si retirar el punto da vuelta la
  conclusión; si no, esos pasos no se dibujan.
- **Pocos pasos:** dos minutos de lectura, tres o cuatro frases por escena. Las cifras se calculan
  (`encendidos()`, `lector()`), no se escriben a mano.
- **Portada:** logo de ICLAC, «¿Qué opina la gente sobre China?» y un botón con la cuchara del sinan
  que baja y vuelve con «Haz scroll para desplazarte» («Desliza» con puntero táctil, por media query
  de puntero y no por ancho). El botón hace lo mismo que el gesto. Sin lista de escenas.
- **Los íconos de dirección son el sinan** (laboratorio del sinan, 25-09-2026; `Sinan.tsx`): la
  cuchara de la portada, la misma sin círculo a 26 px en «Anterior» y «Siguiente», y el «mango
  tendido» (de Codex) en lugar de «→» y «↑» en el cierre. La dirección la da el mango. Sin
  caracteres chinos inventados. Las tarjetas del menú siguen con «→».
- **Cierre:** repite conclusiones, no escenas. Los titulares de las escenas, cada uno enlazado a su
  escena y en gris 500 al pasar. En un paso propio, la salida: la historia siguiente como una tarjeta
  del menú en miniatura (`TarjetaSiguiente`: «Siguiente · Historia N» y la tarjeta con nombre,
  cuchara y pregunta, por el contexto `Siguiente` que arma `App`), que al tocarla hace la misma
  transición que el menú, sin pila (25-09-2026); en la última, «Ver todas las historias». Debajo, en texto: volver a las
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
- **El paso activo es el mayor de los que están dentro de la banda**, con el estado acumulado entre
  entregas del observador (`pasoActivo`). Al cruzar una marca, el paso anterior y el nuevo están
  dentro a la vez durante 0,1 de pantalla; decidir solo con la última entrega dejaba la frase sin
  volver al retroceder desde esa franja (22-09-2026).
- **La pista sube el alto de la escena entero** (`marginTop: -altoEscena` en `Pista`), sin restar
  el colchón, que ya está dentro. Colchón de entrada 0,55 × alto, pasos de 0,75 × alto, colchón de
  salida 0,45 × alto en una escena (así el último paso dura 0,75 como los demás; con 0,2 duraba 0,5)
  y 0,2 en el cierre (prop `salida` de `Pista`). En píxeles medidos, nunca en porcentaje.
- **La escena no lleva margen negativo:** su alto propio es lo que separa una escena de la siguiente.
- **Sin imán** (Felipe, 22-09-2026): nada de `scroll-snap`. Con `mandatory` volver atrás con la
  rueda costaba, el scroll se movía solo y las paradas no coincidían con las marcas. El scroll es del
  lector; cada paso lleva `scroll-margin-top` igual al colchón, que define su **parada**: el scroll en
  que toca la banda de lectura. Medido: cada frase cambia a menos de 8 px de su marca.
- **Teclado y flechas de la pantalla hacen lo mismo** (`irA` y `paradasDeCambio` en `CapaRecorrido`,
  25-09-2026): `PageUp`/`PageDown`, las flechas del teclado y los botones «Anterior»/«Siguiente» van al
  **próximo cambio** (portada, cada paso, cada pausa, el final), nunca a un colchón. Con el texto que
  corre, el destino de un paso no es su parada sino, dentro del mismo paso, donde la frase queda
  centrada en la figura, fuera del degradado del titular y antes del paso siguiente. Dos acciones
  seguidas cuentan desde el último destino pedido, no desde el scroll a mitad de camino. La tecla se
  consume siempre dentro de la capa (en la portada el navegador aplicaba su scroll de 40 px). Los
  anclajes se miden con `getBoundingClientRect().top − (capa.getBoundingClientRect().top − capa.scrollTop)`,
  nunca con `offsetTop`, **menos el `scroll-margin-top` del elemento** (función `paradas`, de la que
  sale `paradasDeCambio`). Sin restarlo, PageUp no salía del cierre (21-09-2026). No es scroll-jacking: rueda y gesto quedan intactos.
  **El botón de la portada va por el mismo `irA`** (contexto `Avance`), no por el alto de su sección:
  con el texto que corre eso dejaba la primera frase 306 px más abajo que la flecha (29-09-2026).
- **Con movimiento reducido se avanza una pantalla, no una parada** (0,85 del alto, en `irA`). Sin
  pista no hay pasos, y las pausas no sirven de parada porque comparten tramo de scroll con la escena
  que las precede: yendo de parada en parada, «La mirada» iba de la portada al cierre en tres teclas
  sin mostrar una figura (29-09-2026). Con una pantalla por acción se pasa por las tres escenas y las
  dos pausas. La excepción es el botón de la portada, que sigue usando el alto de su sección para
  dejar la escena 1 justo al empezar.
- **Los botones existen por quien no tiene rueda** (Fran, 25-09-2026): un clic en la barra de scroll
  baja 87,5 % de la pantalla y se saltaba frases; arrastrarla mueve de 10 a 23 px por píxel. Van abajo
  a la derecha y **solo con puntero fino** (`.flechas-recorrido`, media query de puntero, no de ancho).
- **El alto sale del contenedor y va en píxeles** (`--alto-capa`), con `svh` de respaldo para el primer
  cuadro. Nunca `100%` (se resuelve contra una sección sin alto) ni `vh`.
- **La escena se pega bajo la barra**; la barra se mide y se publica en `--barra-capa`. Alto útil de
  una escena = capa − barra.
- **Respiro y portada miden la pantalla entera**, barra incluida (el respiro que sigue a una escena
  mide 1 + paso y sube lo mismo, montado sobre ella); su escena interna va pegada bajo la
  barra. Con el alto de una escena se asoma la siguiente.
- **La geometría se fija al abrir** y se rehace solo si cambia el ancho (la barra del navegador móvil
  cambia el alto sin que sea una rotación).
- **El bloque de texto no cambia de alto:** todas las frases en la misma celda de una grilla, una
  frase por paso en todos los anchos (con el texto que corre, esa celda queda invisible y lo que se
  lee son las tarjetas). Con movimiento reducido el párrafo **no** lleva la grilla.
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
- **El texto corre** (laboratorio del scroll, 25-09-2026; `corre` en `Escena`, clase `.texto-corre`):
  con dos columnas, desde 900 px y sin movimiento reducido, cada frase es una tarjeta
  (`.tarjeta-frase`) dentro de su paso de la pista y sube con el scroll; la figura queda pegada y
  sigue encendiendo por paso. Pasos de **0,4** de pantalla (`PASO_TEXTO_CORRE`; con 0,75 la frase se
  leía entera solo el 25 a 43 % de su paso) y la frase al **80 %** cuando su paso se activa
  (`LECTURA_TEXTO_CORRE`). La frase activa en tinta plena, las demás a 0,25. El titular sube al borde
  de arriba, con fondo blanco y un degradado de 7 rem debajo; la pista va con `z-index: -1` detrás de
  la escena pegada, así que el titular tapa las frases **sin listener de scroll**. El párrafo de la
  escena queda con opacidad cero: es el texto de verdad para el lector de pantalla. La grilla de dos
  columnas vive en variables (`--columnas-escena` y afines) que comparten escena y tarjetas.
  Colchones sin cambio (0,55 y 0,45). En teléfono no cambió nada. Bajo 1100 px de ancho o 700 de
  alto las tarjetas van a 28 px: a 900×700, con 34, dos frases medían 442 px y no cabían enteras.
  `useConsulta` lee la media query al crear el estado, no un cuadro después (si no, la geometría
  salta al entrar). El destino pendiente de las flechas dura lo que un scroll suave (1,2 s) y se
  olvida con la rueda o el dedo: con el destino viejo, un clic tras la rueda devolvía 589 px.

## Accesibilidad

- Texto entero en el DOM siempre, con opacidad, nunca `display: none`.
- Botón de salida siempre visible, `Escape`, barra de avance como `progressbar` y el titular en pantalla
  en texto (`sr-only`, `aria-live="polite"`), sin número de escena ni de paso.
- Trampa de foco con los focos **filtrados por visibilidad** (`checkVisibility()`, respaldo
  `getClientRects().length > 0`), foco al abrir y devuelto al cerrar.
- **Movimiento reducido:** escena completa desde el primer píxel, **sin pista**, cuchara de la portada quieta, sin emanata; el énfasis estático se queda.

## Lo que no se hace

- `animation-timeline` / `scroll()` / `view()` de CSS: sin soporte Baseline (MDN, 05-09-2026).
- Scroll-jacking o «un gesto, un paso». Parallax. Librerías de scroll (`scrollama`, GSAP).
- Un canvas de diseño estático para decidir comportamiento en el tiempo: para eso está el laboratorio.

## Límites conocidos (25-09-2026)

- La barra de scroll del navegador sigue siendo gruesa para esto: un clic en su carril cruza más de
  un cambio (en escritorio, con pasos de 0,4, un tercio de los clics). Por eso existen las flechas;
  la barra no se toca.
- Sin verificar en un computador real sin rueda (el caso de Fran); medido con Playwright.

## Verificación antes de cerrar

1. `npm run typecheck && npm run lint && npm test`. Verde no dice nada de lo que sigue.
2. Anchos de la skill `verificar-navegador`: al menos 360×640, 390×844 táctil, 899, 901 y 1512.
3. `node scripts/mirar_recorrido.mjs 360` y `768` (las seis historias; un tercer argumento elige una):
   costos de paso iguales, también del último paso a la pausa, una escena a la vista salvo en la
   transición, una leyenda por figura. Abrir las capturas. Muestrea cada 40 px: los costos salen con
   esa resolución.
4. Medido: el bloque de la figura no se mueve entre pasos, y el **último hijo** de la escena queda
   dentro de la capa en 360×640 y 375×667.
5. Pasando de una escena a la siguiente, no una sola: superposición y paso desparejo.
6. Con teclado **y con los botones** de punta a punta en los dos sentidos: un cambio por acción, sin
   pasos saltados ni acciones sin cambio; con el texto que corre, cada llegada deja la frase centrada
   en la figura, entera y en tinta plena. `Shift+Tab` no escapa.
7. Con movimiento reducido: todo encendido, frases sin superponerse, sin pista.
8. Con `mouse.wheel` en los dos sentidos: cada frase cambia en su parada y la salida se alcanza.
9. Si vino de un laboratorio: contra el JSON, parámetro por parámetro, textos verbatim.
10. Lo que el emulador no reproduce (barra del navegador móvil) se reporta como no verificado.

## Fuentes

- The Pudding, *Easier scrollytelling with position sticky*: https://pudding.cool/process/scrollytelling-sticky/
- `scrollama`, README v2: https://github.com/russellsamora/scrollama
- *Scrollytelling Design Patterns*: https://scrollytelling.ai/scrollytelling-design-patterns/
- MDN, `animation-timeline`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline
