---
name: recorrido
description: Reglas para construir y modificar el recorrido con scroll (scrollytelling) del visualizador ICLAC. Se usa al tocar `CapaRecorrido.tsx`, `nucleo/pasos.ts`, las escenas del recorrido, o al agregar un tramo, un paso, una figura que se enciende con el scroll, o cualquier animación ligada al scroll.
---

# El recorrido con scroll

Reglas del scrollytelling de este repositorio. Salen de tres fuentes primarias (al final) y de lo
que ya costó caro acá. **Lo que no está acá vive en `.claude/CLAUDE.md`**: los siete hechos de los
datos, la paleta y los tres anchos de verificación.

## El método: el laboratorio va antes que el código

**Una escena de recorrido no se decide leyendo, se decide mirándola avanzar.** Lo aprendimos caro
el 05 y 06-09-2026: el primer intento se escribió directo en la app, se «verificó» con `lint`, tipos
y pruebas, y aun así el cliente lo describió como cansador. Lo que fallaba no era ningún archivo en
particular, era la composición, y eso no se ve en un diff.

**Producto intermedio: un laboratorio.** Una página aparte, publicada como artefacto, con **las
escenas reales y datos reales**, la misma mecánica (`sticky` + `IntersectionObserver` + pista), y
cada decisión convertida en un parámetro. Hoy son veintiún parámetros: orden, anclaje, cuánto texto
a la vez, tipografía, fondo, forma, alto, escala del eje, entrada del dato, opacidad de lo apagado,
duración, alto del paso, rótulos, color de las oleadas, clave, tamaño del punto, aire, avance,
encabezado, unidad en el eje, y las columnas de escritorio con su escala de texto.

**El laboratorio vive en el repositorio y se sirve desde el servidor de desarrollo.** La fuente es
`laboratorio/recorrido.html`; `npm run lab` la copia a `public/laboratorio.html` poniéndole el
`<head>` con el `meta viewport`, y queda en `http://<máquina>:5180/laboratorio.html`.

**Ya no se publica como artefacto** (decidido el 07-09-2026). Un artefacto pertenece a la cuenta
que lo publica: al trabajar desde dos cuentas, el enlace deja de abrir para una de ellas, y la
copia que sí abre no se puede actualizar desde la otra. El servidor no tiene ese problema, además
de que evita el marco embebido, donde `position: fixed` y `svh` significan otra cosa. El artefacto
anterior (`fd09e261…`) queda como está y no se mantiene.

**El anterior (`97f6b345…`) quedó en otra cuenta.** Los artefactos son de la cuenta que los
publica: al cambiar de cuenta, el enlace viejo responde «no existe o no está compartido contigo»,
que se lee igual que un borrado y no lo es. Dos consecuencias operativas: **el enlace de acá se
verifica antes de mandárselo a nadie**, porque publicar de nuevo crea otra dirección y esta línea es
lo único que la ata al proyecto; y **lo que el laboratorio guarda vive en el navegador, no en el
artefacto** (`localStorage` por origen), así que los textos y parámetros guardados no viajan a la
dirección nueva. Lo que sí viaja es el JSON exportado, que para eso existe.

Siete cosas lo hacen funcionar, y sin ellas no sirve:

1. **Exporta lo que se probó.** El cliente marca combinaciones, escribe una nota por cada una y
   copia un JSON con parámetros, textos y notas. Eso es lo que llega al chat: no «no me gusta», sino
   qué parámetro con qué valor y por qué. La exportación lleva **los textos de todas las escenas**,
   no solo la abierta: un comentario tipo «la 2 quedó mejor que la 3» necesita las dos.
2. **Los textos se editan ahí mismo,** por escena, con almacenamiento propio cada una: con una sola
   clave, abrir la escena 2 pisaba el trabajo hecho sobre la 1.
3. **El largo de cada frase, a la vista, con umbral.** La escena 1 quedó en ~110 caracteres y se lee
   sin cansar; las de la 2 y la 3 andaban en 180 y 270. El contador se marca pasados los 130. No
   decide nada, pero pone el número donde se está escribiendo.
4. **Los parámetros se guardan, no solo los textos.** Sin eso, cada recarga volvía al preset de
   arranque y una combinación elegida se perdía al cerrar la pestaña.
5. **Los presets con nombre son decisiones, no puntos de partida.** «La elegida» es la combinación
   aprobada, y al lado va «Como está la app» para poder ver la diferencia de un clic.
6. **Todas las vistas en el mismo laboratorio, con selector de ancho** (390 / 768 / todo). Partirlo
   en dos artefactos —uno de teléfono y otro de escritorio— es la tentación obvia y es un error: dos
   archivos con la misma escena divergen a la segunda edición y después ninguno manda. Lo incómodo
   no era que fuera uno, era tener que entrar y salir de pantalla completa para ver escritorio.
7. **Pantalla completa.** Se prueba en el aparato donde se va a leer. Un visor chico embebido en una
   página no dice nada sobre cuánta pantalla se come el texto.

   **Y hay dos capas más de encierro, y las dos rompieron el laboratorio el 07-09-2026.**

   Primero, **el visor en 390 dentro de una ventana grande no es la ventana en 390.** El 07-09-2026 el
   cliente abrió el laboratorio en su teléfono y era inusable, con todas las medidas del visor
   verificadas: el rótulo «Paso 1 de 4 · visor 356 px» se partía en seis líneas, los veinte presets
   envueltos se comían 1.200 px antes de la primera figura, y el selector de anchos ocupaba lugar
   para elegir un ancho que ya era el real. **La verificación del laboratorio se hace con la ventana
   del navegador en 390, no con su selector.**

   Segundo, **un artefacto se mira dentro de un marco, así que se prueba dentro de un marco.** El
   modo de pantalla completa del laboratorio restaba `41px` a mano por su barra y medía el resto en
   `svh`. Las dos cosas fallan ahí: la barra deja de medir una línea apenas los botones no caben, y
   `svh` dentro de un artefacto es el alto del marco que lo hospeda, no el de la pantalla. El visor
   terminaba cuatro píxeles más abajo del borde y el contenido se salía. **Ningún alto se calcula
   restando el de otra cosa dibujada:** la caja va en columna y el visor crece con lo que queda. Es
   la misma regla que en la app (`--alto-encabezado`, `--barra-capa`), acá resuelta sin variable
   porque el navegador la reparte solo. La comprobación se hace cargando el laboratorio dentro de un
   `<iframe>` del alto del teléfono, no como página suelta.

   Tercero, y es el que costó tres rondas: **dentro de un artefacto no se usa `position: fixed`.**
   El navegador del teléfono lo posiciona contra la ventana de afuera y no contra el marco, así que
   el elemento sale más ancho que el marco y se desborda por la derecha. **No se reproduce en el
   emulador ni con un `<iframe>` local**: las tres auditorías dieron limpio mientras el cliente lo
   veía roto. El modo de pantalla completa del laboratorio se hace sin salir del flujo (el
   envoltorio toma el alto del documento, se esconde lo demás, el marco se queda con lo que hay) y
   la hoja de ajustes se ancla al marco con `position: absolute`. Dos cuidados que salieron de ahí:
   al vaciar el flujo hay que esconder **también** la columna de controles, que vive dentro del
   tablero (si no, el marco mide 7.887 px), y el marco normal es pegajoso con `top: 8px`, que en
   relativo se convierte en desplazamiento.

   **Y cuando el marco estorba, hay una vía sin marco:** el laboratorio se copia a `public/` y se
   abre desde el servidor de desarrollo por la red local, que en el teléfono es una página normal.
   Está en `.gitignore`: es herramienta, no producto.

Tres reglas más del laboratorio, todas de esta segunda vuelta:

- **Los rótulos de los parámetros tienen que decir lo que hacen.** «Leyenda arriba» siguió diciendo
  eso una vuelta entera después de bajar la leyenda al pie. Un panel que miente sobre lo que hace es
  peor que no tenerlo, porque el cliente decide sobre esa etiqueta.
- **Un parámetro que en esta escena no significa nada se saca del panel**, no se deja marcado sin
  efecto. En las escenas 2 y 3 el color son las variables y no las oleadas, así que la leyenda de
  años y la rampa de color desaparecen.
- **El laboratorio se pone al día con el código, no solo al revés.** Cuando la app arregló el
  párrafo apilado, el laboratorio seguía con la versión vieja y la comparación dejaba de ser
  comparación.

**Lo que apareció en el laboratorio y no habría aparecido de otra manera:** que el año no se
entendía sin clave de color; que el paso costaba distinto entre tramos; que el texto le ganaba la
atención a la figura; y que el pulgar tapa lo que está abajo.

**Al llevarlo al código, se lleva completo y verbatim.** Los tres errores de la primera vuelta
fueron los tres del mismo tipo: llevar una versión propia en vez de la aprobada (el titular donde
iba la descripción), sumar en vez de reemplazar (dos leyendas), y arreglar un problema creando otro
(el margen negativo que superpuso las escenas). Antes de dar por aplicada una combinación, se
compara parámetro por parámetro contra el JSON exportado. En la segunda vuelta se coló uno más, del
mismo tipo: un preset «tuyo» escrito de memoria con `clave: leyenda` cuando el JSON decía `ambas`.

**Y una regla de método, que costó una discusión:** cuando el cliente dice que algo se le mueve
solo, **no se le devuelve una causa sin haberla medido**. Acá se le dijo que la culpa era que el
laboratorio no persistía los parámetros; era verdad que no los persistía, pero el JSON que él había
mandado mostraba los parámetros correctos, o sea que no era eso. Se arregla lo que sí está mal, se
dice qué se midió, y lo que no se sabe se dice que no se sabe.

## Editorial: cuándo un paso se gana su scroll

- **Un paso, un cambio visible.** Si dos pasos seguidos muestran la misma figura, sobra uno: el
  lector paga scroll y no recibe nada. Es el error que tuvieron las escenas 2 y 3 hasta que `Serie`
  aprendió a encender por oleada.
- **El recorrido afirma, el tablero consulta** (un registro de decisiones interno). Una frase del recorrido dice algo; un
  módulo del tablero no dice nada, deja consultar. No se mezclan en el mismo scroll, y desde el
  07-09-2026 tampoco en la misma vista: el tablero tiene su propia ruta.
- **Cuando una escena cambia de tema a mitad de camino, todo su encabezado la sigue.** La escena 1
  empieza comparando países y termina mostrando que la posición política no ordena nada: el
  titular, el pie y el año grande son funciones del paso, no constantes. Un pie fijo que dice «543
  personas» mientras la figura muestra 513, o un titular sobre el termómetro encima de una figura
  de ideología, contradicen a la figura, que es peor que no decir nada. Por eso `titulo`, `nota` y
  `cabecera` aceptan una función del paso.
- **Y la leyenda aparece cuando el color significa algo.** En los cuatro primeros pasos del
  experimento hay una sola oleada dibujada: una clave de tres años ofrecería dos colores que no
  están en la figura.
- **El recorrido afirma, así que publica su método.** «Cómo se hizo el recorrido» vive en «Sobre
  los datos» (`#/datos?foco=metodo-recorrido`), y se llega desde la barra de la capa y desde su
  cierre. Tiene tres partes: lo que la animación **no** puede hacer, la prueba que sostiene cada
  afirmación —armada con los contrastes del artefacto, así que una frase sin prueba ahí es una
  frase que no debería estar en el recorrido— y por qué un puñado de respuestas puede inclinar una
  recta. Una figura que cambia con el scroll es cómoda de leer y difícil de auditar: sin esa
  sección, el lector no tiene dónde verificar nada.
- **La emanata es el gesto del dato del termómetro, al entrar y al salir.** Que sea el mismo en los
  dos lados es la gracia: el lector lo aprende una vez. Antes la entrada era un halo, y un halo dice
  «esto brilla»; las líneas dicen «esto acaba de llegar».

  **Y hay dos implementaciones porque hay dos tecnologías.** El punto del termómetro es un `<span>`
  redondo, así que los rayos salen de un `conic-gradient` recortado a un anillo con `mask`
  (`.dato-emanata`); el de la regresión es SVG y lleva ocho `<line>` (`.emanata`). **Un
  pseudo-elemento no existe en un `<circle>` de SVG:** al cambiar el efecto compartido por el del
  pseudo-elemento, las escenas 2 a 4 —que dibujan con `Serie`, en SVG— se quedaron sin ningún gesto
  de entrada, y ninguna prueba lo vio. Por eso `.dato-nuevo` conserva el halo para SVG y
  `.dato-emanata` lo apaga donde pone los rayos: dos gestos a la vez en el mismo punto se leen como
  uno borroso.

  **El tamaño se mide contra la fila, no contra el punto.** Con el pseudo-elemento a 4,4× los rayos
  entraban en la fila de arriba, y una fila del recorrido mide 40 px; a 3× quedan dentro.
- **El teclado avanza de a un paso, y eso hay que escribirlo.** `PageDown` mueve el alto del
  contenedor, que no coincide con el alto de un paso: el desfase acumulado se comía uno entero
  (medido el 08-09-2026, del cuarto al sexto). **`scroll-snap-stop: always` no lo arregla**, porque
  el navegador no vuelve a encajar después de un desplazamiento por teclado. La capa maneja
  `PageUp`/`PageDown` y las flechas llevando al punto de anclaje siguiente. **No es
  scroll-jacking:** la rueda y el gesto táctil siguen intactos; lo que se corrige es que quien pide
  «el siguiente» reciba el siguiente y no una cantidad de píxeles.

  **Y la lista de anclajes se mide contra el contenedor, no con `offsetTop`.** `offsetTop` cuenta
  desde el ancestro posicionado, y cada escena es una `<section class="relative">`: los pasos de
  cada escena devolvían su posición **dentro de su escena**, la lista salía revuelta y el teclado
  se quedaba clavado en el primer anclaje (medido el 08-09-2026 con Playwright: el scroll no pasaba
  de 351 px por más flechas que se apretaran). Va
  `getBoundingClientRect().top − (capa.getBoundingClientRect().top − capa.scrollTop)`. **El defecto
  era invisible mirando**, porque con rueda todo seguía funcionando: apareció al medir el scroll
  después de cada tecla.
- **El orden de dibujo es parte del diseño.** La recta de la regresión se dibujaba después de los
  puntos y le pasaba por encima al rótulo del punto marcado; el halo no servía, porque quedaba
  debajo de la línea. Va primero la recta, después los puntos y sus rótulos.
- **Un color que identifica algo no cambia a mitad de escena.** La recta de una oleada lleva el
  color de esa oleada desde el primer paso en que aparece. Estaba en el tono oscuro genérico y en
  el último paso pasaba al color del año: el lector veía cambiar de color a la misma recta. El
  precio es que el tono claro necesita más grosor (3,5 px contra 2,5) para no perderse en el papel.
- **Tres rótulos que se pisan no se arreglan separándolos.** En el último paso, dos de las tres
  rectas terminan a menos de un punto de distancia. Separar los rótulos a la fuerza los apila sin
  decir de quién es cada uno; atarlos con un conector obliga a cruzar la figura con una línea que
  compite con los datos. **La pendiente se fue a la leyenda del pie**, donde el color hace la
  conexión y nada puede superponerse.
- **En pantallas bajas, el aire es lo primero que cede.** La escena reparte su alto entre
  encabezado, texto y figura, y en un iPhone 12 (664 px) la suma se pasaba por 16 px: el enlace al
  tablero quedaba bajo el borde. La media query es por **alto** (`max-height: 700px`), no por
  ancho: lo que falta es alto, y hay teléfonos anchos y bajos.
- **Un gesto puede marcar lo que un cambio de estado no dice solo.** Al retirar el punto de la
  regresión salen ocho líneas radiales desde su perímetro: son una **emanata** (Mort Walker, «The
  Lexicon of Comicana», 1980; en motion design, *burst lines*). Marcan que algo salió, que es lo
  que el paso cuenta. Tres reglas para que sea gesto y no adorno: sale **una sola vez**, en el paso
  del retiro y no en los siguientes; **solo se animan `stroke-dashoffset` y `opacity`**, que no
  obligan a recalcular la página; y **con `prefers-reduced-motion` no se dibuja**, porque el punto
  ya está hueco y no hay nada que anunciar. El truco del trazo que viaja: `dasharray` igual al
  largo y `dashoffset` de +L a −L. Y las líneas van **largas y cortas alternadas**: ocho iguales se
  leen como un engranaje, no como algo que sale.
- **Si la figura cambia, cambió la escena, y en medio va una pausa.** Es la regla que salió del
  08-09-2026 y ordena todo el recorrido: seis escenas y tres pausas, en vez de dos escenas largas
  que mutaban de figura a mitad de camino.

  Antes había un paso sin figura dentro de la escena del termómetro, y funcionaba a medias: la
  barra lo anunciaba como «paso 5 de 9», o sea el lector no estaba en una pausa sino a mitad de una
  escena, y al entrar el bloque de texto brincaba 187 px porque la figura desaparecía. La escena de
  confianza tenía el defecto opuesto y peor: cambiaba de figura **en el mismo paso** en que cambiaba
  la frase, sin pausa ninguna, y el bloque se recolocaba de golpe (la figura pasaba de 412 px a 291
  y el titular bajaba 60).

  Un cambio de figura es un cambio de pregunta. Se cierra la escena, va una pantalla de pausa, y la
  figura nueva ya está armada cuando empieza la que sigue. **Lo que hace que el cambio se sienta
  ganado por el scroll es la pausa**, no una animación: atarlo al progreso del dedo pediría medir el
  scroll en cada cuadro, que es justo lo que la mecánica de acá evita.

  La forma de la pausa costó tres intentos, y los dos primeros enseñan algo:

  1. **Con la figura que viene ya presente:** la frase hablaba de niveles socioeconómicos y
     macrozonas mientras se veía otra cosa. Es el defecto del pie que miente, del lado de la figura.
  2. **Con su propia figura** —un punto por grupo, una fila por corte, sobre el eje del cambio—:
     catorce puntos en tres rieles, ninguno rotulado, imposible de leer en un paso que dura un
     gesto de scroll.
  3. **Sin figura.** Lo que hace de pausa es que no haya nada más donde mirar. El dato que respalda
     la frase vive en «Sobre los datos», que es donde se audita.

  Y una pausa **no lleva nada de la escena**: ni titular, ni pie, ni leyenda, ni año grande, ni el
  enlace al tablero. Todos hablarían de algo que no está.
- **El bloque de la figura no se encoge entre pasos.** La escena está centrada verticalmente, así
  que cualquier cambio de alto recoloca el titular y la frase: el pie del experimento crece 21 px al
  aparecer la leyenda de pendientes, y eso movía todo. `Escena` guarda el mayor alto que el bloque
  ya tuvo **en ese ancho** y lo aplica como mínimo, medido con `useLayoutEffect` para que el lector
  no alcance a ver el alto chico. Se reinicia cuando cambia el ancho, no el alto: en el teléfono el
  alto cambia solo porque la barra del navegador va y viene. **Solo evita que se encoja**: la
  primera vez que un paso agranda el bloque, ese paso todavía mueve las cosas una vez.
- **Una escala con polaridad se dibuja divergente, y así no hay que elegir umbral.** Las cuatro
  respuestas de confianza van a los dos lados de un cero común, en vez de una serie con la caja de
  arriba: con «mucha» sola China pasa a Estados Unidos en 2025, con «mucha o algo» venía arriba
  desde 2023 (ver `CLAUDE.md`, «Una escala ordinal no se resume sin declarar el corte»). Tres
  detalles que costaron su medición:

  1. **El número del segmento cambia de color según el relleno que tiene detrás.** Blanco sobre el
     naranjo claro da 2:1, muy por debajo del piso de 4,5:1, y el número de «Poca» quedaba
     ilegible mientras el de al lado se leía bien. Se decide con la luminancia del relleno, no a
     ojo, así que un cambio de paleta no lo vuelve a romper.
  2. **La categoría neutra va a caballo del cero**, mitad y mitad: es la convención de las escalas
     con punto medio y evita inventarle un lado a quien no se inclina.
  3. **El nombre de la fila no se apaga con la fila.** Con el nombre puesto y la barra vacía, la
     figura dice «esto viene» antes de que el paso lo cuente, que es lo mismo que ya hacía el
     panel vacío de `Serie`.
- **Entre dos escenas va un respiro, y no es una escena.** Es el mismo recurso que el puente —una
  frase sola, centrada, sin nada más donde mirar— pero entre escenas en vez de dentro de una:
  cierra lo que se leyó y formula la pregunta de lo que viene («entonces la gente evalúa mejor a
  China, ¿pero confía en ella?»). **No se numera**: contarlo como escena diría que el recorrido
  tiene un hallazgo más de los que tiene, y meterlo como último paso de la escena anterior lo
  dejaría bajo un titular que ya no es el suyo. La barra lo anuncia como «Pausa».

  **Su sección mide la pantalla entera, barra incluida, y eso no es lo mismo que el alto de una
  escena.** El imán alinea el borde de arriba de la sección con el borde del contenedor, y la barra
  tapa los primeros 43 px: con el alto de una escena (pantalla menos barra), los últimos 43 px
  mostraban el titular de la escena siguiente, que es exactamente lo que una pausa no puede dejar
  ver. La escena de adentro sigue pegada bajo la barra y ocupa el hueco que queda.
- **Contar el método es contar un hallazgo, cuando el método *es* el hallazgo.** Los cinco pasos
  del experimento muestran la recta que publica el monitor, marcan el punto de treinta personas que
  la sostiene, lo retiran y la recta se endereza. Una línea plana no tiene épica; verla enderezarse
  sí. El scroll sirve para mostrar un cambio, así que el método se muestra en vez de resumirse.
  **La condición para contarlo** es que el retiro dé vuelta la conclusión (la recta pasa el
  contraste y sin ese punto no): si no, los pasos no se dibujan.
- **Una escena puede cambiar de filas sin cambiar de eje.** La escena 1 pasa de cinco países a
  tres tramos ideológicos en el paso 5: misma figura, misma escala (calculada sobre los dos juegos
  de filas juntos, así que ninguna marca se mueve), y el pie y el año grande cambian con ella. Un
  pie que sigue describiendo la figura anterior es peor que no tener pie, así que `nota` acepta una
  función del paso, igual que `cabecera`.
- **Una escena solo afirma lo que pasa el contraste.** «Se movió» y «no se movió» son afirmaciones
  estadísticas: van contra los contrastes que el ETL calcula (permutación y bootstrap, ver
  `CLAUDE.md`, «Cuándo un cambio entre oleadas es un cambio»), y hay una prueba que falla si el
  recorrido afirma una diferencia que no los pasa.
- **Y una cifra que el lector no puede calibrar no es una cifra, es relleno.** La escena 1 decía
  «ningún país se movió más de 1,0 puntos»: cierto, y nadie sabe si 1,0 es mucho en una escala de
  0 a 100 con desviación de 28. Ahora dice que ninguno de los cinco se distingue del ruido, que es
  más fuerte y no tiene número arbitrario. **El hecho no se cortó, se dijo mejor:** es lo que
  sostiene el titular, porque sin él no se distingue un quiebre de una tendencia que ya venía.
- **Donde el intervalo cruza el cero, se dice «parejos».** No se elige un ganador por el signo del
  promedio. La escena 1 afirmaba que en 2023 y 2024 Estados Unidos estaba mejor evaluado; en 2023
  la brecha era de 2,1 puntos con un intervalo que cruza el cero, o sea que esa mitad afirmaba de
  más. Y como los rótulos de la figura muestran los promedios (61,4 contra 64,2), la nota tiene que
  decir de dónde sale «parejos», o el texto parece contradecir a la figura.
- **Las cifras se calculan, no se transcriben.** Una frase con el número escrito a mano envejece con
  la oleada siguiente. Ver `encendidos()` y las escenas en `src/App.tsx`.
- **Pocos pasos.** Dos minutos de lectura, tres o cuatro frases por escena. El formato premia salir
  temprano, no agotar el guion.

## Honestidad de la animación

Las tres reglas que gobiernan qué puede hacer una figura mientras avanza el scroll. Están también en
`src/nucleo/pasos.ts`, porque son de código, no de estilo:

1. **La escala nunca depende de lo visible.** Se calcula sobre todos los datos y se pasa hecha a la
   figura. Recalcularla con lo encendido mueve el mismo valor de lugar al avanzar: es la manera más
   limpia de mentir con una animación.
2. **Ocultar no es borrar.** Lo apagado queda en el DOM con opacidad cero: está al imprimir y para
   un lector de pantalla. La animación es una capa de lectura sobre una figura ya completa. Lo que
   sí se calcula sobre lo encendido son el trazo y los rótulos, que anunciarían un rango todavía no
   mostrado (ver `Puntos.tsx` y `Serie.tsx`).
3. **El último paso enciende todo.** Es la garantía de que el recorrido no termina escondiendo nada,
   y es además el estado con `prefers-reduced-motion` o sin JavaScript.

## Lo que la figura tiene que decir sola

Salió de probar catorce combinaciones en el laboratorio, con el cliente mirando (06-09-2026):

- **El encabezado va en dos niveles.** El titular dice el hallazgo; una bajada dice qué se está
  mirando. Con un solo nivel, el lector no sabe qué mide la figura y hay que repetir la unidad en
  cada frase.
- **La unidad vive en el eje**, no en el relato. Y si el eje está recortado, lo declara: «de 0 a 100 ·
  el eje muestra el tramo 55 a 75». Un eje recortado que no lo dice exagera la pendiente, que es
  justo el defecto del monitor actual.
- **Una serie ordenada se pinta con un tono de claro a oscuro** (`pasosDeOrden`), nunca con colores
  categóricos. Las oleadas son una secuencia: con tres colores distintos hay que memorizar cuál es
  cuál; con la rampa, más oscuro es más nuevo. Y el tamaño del punto crece con el orden, para que la
  secuencia se lea también sin color.
- **El año del paso, en grande y fuera del lienzo.** Dice de qué oleada habla este paso sin mandar
  la vista a la leyenda y traerla de vuelta. Fuera del lienzo porque flotando encima choca con la
  fila de arriba.
- **El dato que entra destella, y el nombre de su fila destella con él.** El destello no mueve nada:
  ni posición, ni tamaño, ni eje. El nombre nunca baja del piso de lectura: un punto apagado es una
  figura incompleta, un nombre ilegible es una fila sin dueño.
- **Una sola leyenda, y la pone quien usa la figura.** `Puntos` trae la suya al pie y se apaga con
  `leyenda={false}`. Dos leyendas de lo mismo es peor que ninguna, y es fácil sumar una sin mirar si
  ya había.
- **La muestra de la leyenda es el punto**, con su tamaño real, no una barra de color: la leyenda
  tiene que verse como lo que el lector está mirando.
- **La leyenda y el año del paso son dos cosas distintas y van en lugares distintos.** El año arriba
  a la derecha, donde la vista ya está, porque dice de qué habla este paso. La leyenda al pie a la
  derecha, porque se consulta después de haber visto los puntos.
- **Con una serie destacada encendida se rotula esa y ninguna más.** Sumarle el otro extremo «si hay
  espacio» deja el número de una oleada vieja al lado del de la última: dos números, y solo uno es
  del que habla el paso. Los extremos se rotulan únicamente mientras la destacada no entró, para que
  ninguna fila quede sin un número que leer.
- **Una figura hecha para una columna angosta no se pone a pantalla completa sin revisar su
  lienzo.** El `viewBox` de `Serie` es casi cuadrado (100 × 132) porque en el tablero vive en una
  columna: a 360 px de ancho se escala 3,6 veces y los números salen a 32 px. En el recorrido va con
  `anchoLienzo={300}`, que da una figura ancha y baja. Lo mismo vale para cualquier figura que se
  mude del tablero al recorrido.
- **El rótulo de la unidad necesita su propio aire.** Pegado al eje se lee como una marca más, y en
  360 px una frase larga se parte en tres líneas encima de las marcas.
- **El contexto va más apagado que el relato, con piso.** Bajada y nota en gris 500: es el último
  tono que mantiene 4,5:1 sobre blanco, que es el piso de lectura para texto chico. Más apagado se
  ve mejor y deja gente afuera.
- **No se habla por la población.** «Las personas encuestadas», no «los chilenos»: la muestra no es
  probabilística (hecho 2 del `CLAUDE.md`).

## La capa: entrada, posición y salida

Decidido con el cliente el 07-09-2026, y lo que sostiene el resto de esta sección.

- **La raíz del sitio es el recorrido**, y `#/recorrido` es su alias. El tablero no afirma nada:
  sin el relato hay que saber de antemano qué buscar.
- **La portada es la primera pantalla de la capa, no una página anterior.** Fue una vista aparte
  durante media tarde y el lector no la veía nunca, porque la capa se abría encima: entraba en
  mitad de la escena 1 sin saber qué era esto ni cuánto duraba. Adentro, ocupa **una pantalla
  exacta**, es punto del imán, no se numera y no cuenta como escena en la barra («Portada», no
  «escena 1 de 5»). Lleva un botón que hace lo mismo que el gesto, para rueda y teclado.
- **La capa es una ruta, no un estado suelto.** De ahí salen gratis el gesto de atrás del teléfono
  y el enlace. **No se le suma `pushState` propio:** con la ruta encima, la entrada quedaba
  duplicada y el botón de atrás pedía dos toques. En la raíz no hay nada detrás, así que ahí el
  gesto de atrás sale del sitio, que es lo que hace cualquier página de entrada; entrando desde el
  tablero, vuelve al tablero.
- **Salir lleva al tablero, y el botón lo dice.** Salir de un relato es ir a consultar; «Cerrar» no
  dice qué pasa después.
- **La posición se muestra en dos niveles:** «Escena N de M» y un punto por paso de esa escena,
  además de la barra de avance. La barra sola dice cuánto falta pero no dice de qué. Va también en
  texto (`sr-only` con `aria-live="polite"`) para quien no ve ninguno de los dos.
- **Cada escena ofrece su módulo del tablero** (`#/tablero?foco=<id>`), que llega enfocado y
  marcado. Mandar al tablero entero no es una respuesta: son veintisiete tarjetas.
- **La escena que informa su posición es la que cruza la banda de lectura**, medida con la misma
  banda de los pasos (`-45%`) sobre la sección de la escena. Con la escena pegada, su sección
  ocupa toda su tajada de scroll, así que solo una la cruza a la vez.

## Mecánica

- **La figura se fija con `position: sticky`, nunca con un listener de scroll.** El listener es
  lento y salta; `sticky` lo resuelve el navegador. El único JavaScript es el disparador del paso.
- **El disparador es `IntersectionObserver`** sobre una pista invisible (`aria-hidden`), no sobre el
  texto: en la capa el párrafo queda quieto, así que el texto no puede dar el ritmo.
- **La banda de lectura es angosta** (`rootMargin: '-45% 0px -45% 0px'`). Con una banda ancha hay dos
  pasos dentro a la vez y el activo depende del orden en que el navegador entregue las entradas, que
  no está garantizado. Precio: **cada paso tiene que ser más alto que la banda**.
- **Dentro de una capa con scroll propio, el `root` del observador es el contenedor**, no la
  pantalla. Con la pantalla como raíz, ningún paso se activa nunca.
- **Los pasos tienen que costar todos lo mismo, y no salen parejos solos.** La escena pegada ocupa
  una pantalla de flujo antes de que empiece la pista, así que el primer cambio llega una pantalla
  tarde. Se corrige **subiendo la pista** (`alto − colchón`), más un colchón del 55 % de pantalla al
  principio (hace que el paso *i* entre a la banda en `i × alto de paso`) y otro al final (sin él, el
  último paso no se activa nunca). **En píxeles medidos, nunca en porcentaje:** un margen en
  porcentaje se resuelve contra el ancho.
- **La geometría se mide, no se calcula.** El desfase del primer paso se calculó mal dos veces en el
  papel —primero descontando el alto de la pantalla en vez del de la escena, después restando el
  colchón dos veces— y las dos veces el error era invisible en el código y evidente en la medición:
  el primer paso duraba 1.080 px contra 600 de los demás. Se corre `scripts/mirar_recorrido.mjs` y
  los costos tienen que salir iguales entre sí (con el imán desactivado, que si no mueve el scroll
  que se pide por código y contamina la medida).
- **La corrección no se hace anulando el alto de la escena.** Un margen inferior negativo en la
  escena empareja los pasos igual, pero sin altura propia la escena queda pegada hasta el último
  píxel de su sección y **la escena siguiente entra encima**. El alto de la escena es lo que separa
  una escena de la que viene.
- **La pausa entre pasos es `scroll-snap-type: y mandatory`** en el contenedor y `scroll-snap-align:
  start` en cada paso, con `scroll-margin-top` igual al colchón para que el imán caiga donde cambia
  la figura.

  **`proximity` no sirve acá, y esto está medido:** con pasos de 585 px, un gesto que deja el scroll
  a 285 px del punto más cercano no mueve nada, así que el imán no existe en la práctica. Lo que
  hace seguro a `mandatory` es que **todo el recorrido tenga puntos** —los pasos, los dos colchones
  de cada escena y el cierre de la capa—, y que **ningún par de puntos consecutivos quede más lejos
  que una pantalla**; si no, el navegador salta entre puntos lejanos y deja contenido inalcanzable,
  empezando por el botón de salida. Los dos se comprueban con `scripts/mirar_recorrido.mjs`.

  Cuidado al medirlo: mover el scroll por código (`scrollTop = …`) no dispara el imán igual que un
  gesto, así que la comprobación va con rueda o arrastre de verdad.
- **El bloque de texto no cambia de alto entre pasos.** Todas las frases en la misma celda de una
  grilla de una celda: mide lo que la más alta, sin `min-height` mágico y sin saltos. Medido: con
  las inactivas fuera del flujo (`position: absolute`), el bloque medía la frase activa y la figura
  subía y bajaba a cada paso; con la grilla, 0 px de movimiento en los cuatro pasos.

  **Cuidado con `prefers-reduced-motion`:** ahí se muestran todas las frases a la vez, y en la misma
  celda se superponen. Con movimiento reducido el párrafo **no lleva** la clase de grilla. Fue un
  defecto real en teléfono desde que se apiló el párrafo, y no lo vio ninguna prueba.
- **Una frase por paso en todos los anchos.** Al principio, desde 640 px el párrafo se leía entero
  con las futuras en gris claro. Con el texto de escritorio a 34 px son cuatro frases que no entran,
  y además contradice la premisa: un paso muestra lo que ese paso cuenta.
- **El alto sale del contenedor, no de la pantalla, y hay que dárselo en píxeles.** La capa es
  `fixed inset-0`, así que su alto ya es el viewport real en cada momento, también cuando el
  navegador del teléfono muestra u oculta su barra, cosa que ni `vh` ni `svh` hacen.

  **Pero no puede venir de un `100%`, y esto está medido (07-09-2026):** entre la capa y la escena
  hay una `<section>` de alto automático, así que un porcentaje se resuelve contra un contenedor sin
  alto definido y el navegador lo descarta. Como era la última declaración, pisaba a las de `vh` y
  `svh`, y la escena terminaba midiendo su contenido: 657 px en una capa de 780. **El síntoma no era
  el alto**, era que `justify-center` no hacía nada, porque no había espacio libre que repartir. El
  alto va como variable en píxeles, la misma medición que la capa ya hace para los pasos; `svh`
  queda de respaldo para el primer cuadro.
- **La escena se pega debajo de la barra de la capa, no debajo del borde de la pantalla.** Con
  `top: 0` la barra tapa el aire de arriba del título: el espacio existe, pero queda detrás.
- **El alto de esa barra se mide y se publica (`--barra-capa`), no se escribe a mano.** Estaba
  escrito `2.5rem` y la barra mide 43 px: cada escena terminaba 3 px por debajo del borde de la
  capa, y en la escena más apretada eso es la última línea de la nota. Es la misma regla del
  encabezado del sitio (`--alto-encabezado`). El valor del CSS queda solo como respaldo del primer
  cuadro, en la cadena `var(--barra-capa, 2.5rem)`.
- **El alto útil de una escena es la capa menos su barra.** En 360 px son **737 px**, y ahí entra
  todo: encabezado, frase, figura y nota. Se mide, no se estima: la escena de cierre pedía 776 con
  frases de dos líneas y una nota de cuatro.
- **El alto de la geometría se fija al abrir y solo se rehace si cambia el ancho.** La barra del
  navegador móvil cambia el alto del contenedor entre un 8 % y un 15 % al ir y venir; si el alto de
  los pasos siguiera cada cambio, se recalcularía en pleno gesto y el contenido saltaría bajo el
  dedo. El ancho es lo que distingue una rotación real de la barra yendo y viniendo.
- **El scroll dentro de la capa reduce, pero no elimina, el colapso de la barra del navegador
  móvil.** Es una ventaja del scroll
  en contenedor propio frente al scroll de página, y una razón más para que el recorrido viva en una
  capa, y una razón más para que el recorrido viva en una capa. Pero Chrome en Android la colapsa
  igual cuando el contenedor ocupa la pantalla entera. **No hay API para impedirlo**: lo único que
  se puede es no depender de que la barra esté o no, que es lo que hacen las dos reglas de arriba.
- **Nada de `vh` en la pista ni en la escena.** El mostrar y ocultar de la barra del navegador móvil
  cambia `vh` y dispara una cascada de resize. Va `svh`, con `vh` de fallback, y las dos medidas
  (escena y paso) viven juntas en `src/index.css` para que no se desincronicen.
- **Solo se anima `opacity` y `transform`.** `top`, `height` y `margin` obligan a recalcular layout
  en cada cuadro. Transiciones de 150-500 ms.
- **En iOS, `body { overflow: hidden }` no bloquea el scroll de fondo.** Hace falta `position: fixed`
  con `top: -scrollY`, restaurando la posición al cerrar.
- **Un valor escrito en el atributo `style` le gana a cualquier regla, también cuando lo que define
  es una variable CSS.** Si un componente escribe `--alto-fila` en línea, ninguna media query lo
  alcanza. Para dejar que un ancestro lo pase por encima hacen falta **dos nombres** y una cadena de
  respaldo: el componente lee `var(--alto-fila-ancho, var(--alto-fila))` y quien manda define
  `--alto-fila-ancho` más arriba. Lo mismo pasó en el laboratorio con un `font-size` en línea, que
  dejaba la frase en el tamaño del teléfono con las dos columnas puestas.
- **La capa entra al historial.** En Android el gesto de atrás es el gesto de cerrar; sin entrada
  propia se lleva puesta la página entera.

## Escritorio: dos columnas

Decidido en el laboratorio el 07-09-2026, y medido antes: en una sola columna el bloque se quedaba
en 672 px sea cual sea la pantalla, así que en 1512×945 se usaba el 44 % del ancho, sobraban 276 px
de alto y **la figura arrancaba a 528 px del techo**, o sea a medias en un portátil.

- **El umbral son 900 px de ventana**, que es donde la columna de la figura deja de apretar las
  cinco filas de países.
- **Acá sí va media query, y en el laboratorio no.** La capa es `fixed inset-0`: su ancho **es** el
  de la ventana. El visor del laboratorio, en cambio, es un contenedor dentro de una página, así que
  ahí el ancho se mide por JavaScript o la media query miente justo donde importa.
- **El titular y la frase son la misma voz y viajan juntos**, en una columna; la figura en la otra.
  El envoltorio es `display: contents` en angosto, así que no cambia nada abajo del umbral.
- **El titular pegado arriba y la frase centrada en lo que sobra:** la columna del relato va
  `align-self: stretch` y la frase lleva `margin-block: auto`. Hacer que la figura ocupe dos filas
  de la grilla parece equivalente y no lo es: su altura empuja la segunda fila y abre 200 px entre
  el titular y su propia frase.
- **El texto crece con la pantalla**, al escalón del 80 % sobre las medidas del teléfono: titular
  27 px, frase 34.
- **La figura también crece**, o queda un dibujo chico en una columna ancha: filas de 40 a 58 px y
  nombres de país de 12 a 14. Y al agrandar la tipografía hay que volver a mirar la columna de
  nombres: «Estados Unidos» empezó a salir cortado con puntos suspensivos.
- **Dos columnas solo donde la figura es una sola figura.** Las escenas con dos o tres paneles en
  paralelo quedan con cada panel en 192 px y los números a 6 px. Va por escena (`dosColumnas` en
  `Escena`), no global.

## Accesibilidad

- **El texto va entero en el DOM siempre**, con opacidad y no con `display: none`: se puede copiar,
  buscar y leer con lector de pantalla desde el primer paso.
- **No se intercepta el scroll.** Nada de `scroll-jacking` ni de `scroll-snap` que secuestre la
  rueda.
- **Se entra cuando se quiere y se sale cuando se quiere:** botón de cierre siempre a la vista,
  `Escape`, y barra de avance que diga cuánto falta. Sin la barra, «salir cuando quieras» es una
  promesa que el lector no puede evaluar.
- **Trampa de foco en la capa**, foco al abrir y devuelto al cerrar.
- **`prefers-reduced-motion` salta al paso completo**, no a una versión recortada.
- Toda figura lleva su texto equivalente (`sr-only` o `aria-label`) y su nota con el N.

## Lo que no se hace

- **No se migra a `animation-timeline` / `scroll()` / `view()` de CSS.** MDN todavía marca la
  propiedad como *limited availability, not Baseline* (verificado 05-09-2026). `IntersectionObserver`
  se queda.
- **Nada de scroll-jacking**, tampoco «un gesto, un paso». Si hace falta una pausa entre pasos, va
  `scroll-snap` nativo: da la pausa sin quitarle el gesto al lector ni dejar fuera al teclado.
- **Nada de parallax.** Dispara trastornos vestibulares y no aporta a una figura de datos.
- **Ninguna librería nueva de scroll.** `scrollama` y GSAP resuelven lo que acá son cuarenta líneas
  en `nucleo/pasos.ts`, y traen su propio ciclo de vida.

## Verificación antes de dar por cerrado un tramo

1. `npm run lint && npm test`.
2. En cinco anchos, con `npm run dev`: **360, 768, 900, 1512 y 1920**. Los tres de siempre no
   alcanzan desde que hay dos columnas: 900 es el umbral y hay que verlo justo encima y justo
   debajo, y 1920 es donde se nota si algo se estira sin tope.
   - cada frase cambia algo en la figura;
   - la figura entra completa en pantalla en 360 con la barra del navegador a la vista;
   - el botón atrás cierra la capa y deja el tablero donde estaba;
   - el fondo no se mueve mientras la capa está abierta.
3. Con `prefers-reduced-motion: reduce` forzado: la figura arranca completa.
4. Con JavaScript apagado: el texto de las escenas se lee entero.
5. El emulador móvil de Chrome **no** reproduce el comportamiento de la barra del navegador. Lo de
   `svh` se comprueba en un teléfono de verdad.
6. Contra el JSON exportado del laboratorio, parámetro por parámetro: orden, anclaje, tipografía,
   fondo, alto, entrada, aire, rótulos, clave de color, columnas, escala de escritorio, y los textos
   **verbatim**. Se leen del JSON, no de memoria.
7. Con dos escenas seguidas, no una: la superposición entre escenas y el paso desparejo solo se ven
   al pasar de una a la otra.
8. Contando leyendas: una sola por figura.
9. Con `node scripts/mirar_recorrido.mjs 360` y `768`: los costos de paso tienen que ser iguales
   entre sí, y las capturas hay que **abrirlas**, no solo generarlas.
10. Midiendo, no mirando: que la figura no se mueva entre pasos (el borde superior del bloque de la
    figura tiene que dar el mismo número en todos), y que la escena no sea más alta que la capa.
11. Con `prefers-reduced-motion` **y** el párrafo apilado: que las frases no queden una encima de
    otra. Y con una escena que **cambia de figura**: que se muestren todas, no solo la del último
    paso, o la mitad del texto habla de algo que no está dibujado.
12. **Con teclado, no solo con scroll.** `PageDown` de punta a punta tiene que pasar por todos los
    pasos, sin saltarse ninguno, y `PageUp` igual al revés. Es el defecto que ninguna captura
    muestra: la figura se ve bien en cada paso, y el paso que falta no se ve por definición.
13. **En dos teléfonos, no en uno.** Un iPhone 12 tiene 664 px de alto útil y un Galaxy S8, 740: lo
    que entra en uno se sale del otro por veinte píxeles. Y el elemento que se sale suele ser el
    último —el enlace al tablero—, así que la comprobación se hace sobre el **último hijo** de la
    figura, no sobre la escena.
14. **Mirando el orden de dibujo**, que es parte del diseño: un trazo dibujado después de un rótulo
    lo tapa, y ningún halo lo salva porque el halo queda debajo del trazo.

**`lint`, tipos y pruebas verdes no dicen nada sobre esto.** Los tres defectos que llegaron al
cliente pasaban las 90 pruebas.

## Qué herramienta usar, y cuál no

- **Para construir el laboratorio: la skill `artifact-design`**, obligatoria antes de escribir el
  archivo, y publicarlo como artefacto. El laboratorio es una herramienta que se opera, no un
  documento: la información manda sobre la tipografía.
- **Antes de tocar color, escala, leyenda o rótulos: la skill `dataviz`.** En esta sesión no se
  cargó y se resolvió con las reglas del `CLAUDE.md`; se llegó al mismo lugar (rampa ordenada,
  etiquetado directo, piso de contraste), pero por camino largo y con una vuelta de más.
- **Un canvas de diseño estático (la skill `design`) no sirve para esto.** El problema del recorrido
  es de **comportamiento en el tiempo**: cuánto scroll cuesta un paso, qué se enciende cuándo, si el
  cambio se alcanza a ver. Un artboard no scrollea ni mide pasos, y todo lo que terminó decidiendo el
  resultado —el paso desparejo, el destello, la clave de color en movimiento— es invisible en una
  maqueta quieta. Sirve para comparar composiciones quietas, que es la parte fácil.
- **Para mirar y medir: Playwright, que ya está instalado en esta máquina.** Hay dos instrumentos:
  `~/.claude/bin/captura-web.mjs` (captura en los tres anchos y denuncia desbordes, sirve para
  cualquier página) y `scripts/mirar_recorrido.mjs` en este repositorio, que abre la capa, la
  recorre y mide el costo en píxeles de cada paso, cuántas escenas hay a la vista, cuántas leyendas
  y qué números están rotulados.

  **Durante la sesión del 06-09-2026 di por hecho que no había navegador y entregué sin mirar.**
  No era cierto: la herramienta estaba en `~/.claude/bin` desde antes. Los tres defectos que
  terminó reportando el cliente eran visibles en el primer render, y dos más (la figura de la
  escena 2 renderizada a 3,6 veces su tamaño y la unidad del eje pisando las marcas) aparecieron en
  la primera captura apenas se miró. **Antes de decir «no tengo navegador», se busca.**

## Lo que quedó pendiente (07-09-2026)

- **La escena 4 y la portada son borrador.** La escena de cierre repite las tres medidas, una por
  panel, con frases de una línea; la portada dice qué es el recorrido, cuánto dura y por dónde va.
  Ninguna de las dos tiene guion acordado con ICLAC, igual que las escenas 2 y 3.

- **Las escenas 2 y 3 siguen con el guion viejo.** Tienen la composición nueva de una columna, pero
  frases de 183, 227 y 270 caracteres contra las ~110 de la escena 1. **Ya están cargadas en el
  laboratorio**, con las cifras reales y un botón «Probar el guion corto» que propone tres pasos de
  un dato cada uno. Falta la vuelta con el cliente.
- **Y a 360 px la escena 3 no cabe:** mide 1.018 px contra una pantalla de 780. Es anterior a los
  cambios de composición (verificado revirtiendo), y la causa es la frase de 270 caracteres. Lo que
  cambió es qué queda cortado: antes la cola del párrafo, ahora la figura.
- **Las escenas 2 y 3 no tienen escritorio.** Se quedan en una columna porque sus dos y tres paneles
  en paralelo no entran en media pantalla. La salida probable es apilar los paneles, y hay que
  medirla: tres paneles apilados a 576 px de ancho son ~760 px de alto, que en una ventana de
  1280×800 no entran.
- **La frase 2 de la escena 3 dice «hay más chilenos».** Habla por el país sobre una muestra no
  probabilística (hecho 2 del `CLAUDE.md`). La corrección está propuesta en el laboratorio y no
  aplicada al código.
- **La leyenda y el año de las escenas 2 y 3.** Solo la escena 1 tiene clave de oleadas: las otras
  dos usan `Serie`, con una serie por figura y color propio, así que hoy no la necesitan. Si alguna
  pasa a mostrar varias oleadas a la vez, hay que darle la misma clave.

## Fuentes

- The Pudding, *Easier scrollytelling with position sticky*: https://pudding.cool/process/scrollytelling-sticky/
- `scrollama`, README v2 (opciones, y el aviso de no usar `vh`): https://github.com/russellsamora/scrollama
- *Scrollytelling Design Patterns* (un paso un cambio visible; `svh`; solo `transform` y `opacity`):
  https://scrollytelling.ai/scrollytelling-design-patterns/
- MDN, `animation-timeline` (estado de soporte): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline

**No sirvieron, y conviene no volver a buscarlas:** `scrollytelling.ai/scrollytelling-tools/` es un
listado de plataformas no-code; la skill `scroll-craft` (nateherkai) es para landings de marketing
con assets generados por IA; la skill `scrollytelling` de doodledood abre con cifras de impacto sin
fuente («400 % más tiempo en página»), aunque su sección de móvil y WCAG es aprovechable y está
destilada acá.
