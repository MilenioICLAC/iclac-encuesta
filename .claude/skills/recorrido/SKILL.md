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

**Producto intermedio: un laboratorio.** Una página aparte, publicada como artefacto, con **una
escena real y datos reales**, la misma mecánica (`sticky` + `IntersectionObserver` + pista), y cada
decisión convertida en un parámetro. Terminó con catorce combinaciones de arranque y dieciocho
parámetros: orden, anclaje, cuánto texto a la vez, tipografía, fondo, forma, alto, entrada del dato,
opacidad de lo apagado, duración, alto del paso, rótulos, color de las oleadas, clave, tamaño del
punto, aire, avance y encabezado.

El de esta vuelta está publicado como artefacto privado:
https://claude.ai/code/artifact/97f6b345-ef4e-4c25-96ba-740ef1948b54 (06-09-2026). Sirve como punto
de partida para el tramo siguiente: se le cambian los datos y las frases y queda listo.

Tres cosas lo hacen funcionar, y sin ellas no sirve:

1. **Exporta lo que se probó.** El cliente marca combinaciones, escribe una nota por cada una y
   copia un JSON con parámetros, textos y notas. Eso es lo que llega al chat: no «no me gusta», sino
   qué parámetro con qué valor y por qué.
2. **Los textos se editan ahí mismo.** El guion es la mitad del problema y el cliente es quien sabe
   cómo debe sonar. Editables, con el largo en caracteres a la vista, y viajan en la exportación.
3. **Pantalla completa.** Se prueba en el aparato donde se va a leer. Un visor chico embebido en una
   página no dice nada sobre cuánta pantalla se come el texto.

**Lo que apareció en el laboratorio y no habría aparecido de otra manera:** que el año no se
entendía sin clave de color; que el paso costaba distinto entre tramos; que el texto le ganaba la
atención a la figura; y que el pulgar tapa lo que está abajo.

**Al llevarlo al código, se lleva completo y verbatim.** Los tres errores de esta transcripción
fueron los tres del mismo tipo: llevar una versión propia en vez de la aprobada (el titular donde
iba la descripción), sumar en vez de reemplazar (dos leyendas), y arreglar un problema creando otro
(el margen negativo que superpuso las escenas). Antes de dar por aplicada una combinación, se
compara parámetro por parámetro contra el JSON exportado.

## Editorial: cuándo un paso se gana su scroll

- **Un paso, un cambio visible.** Si dos pasos seguidos muestran la misma figura, sobra uno: el
  lector paga scroll y no recibe nada. Es el error que tuvieron las escenas 2 y 3 hasta que `Serie`
  aprendió a encender por oleada.
- **El recorrido afirma, el tablero consulta** (un registro de decisiones interno). Una frase del recorrido dice algo; un
  módulo del tablero no dice nada, deja consultar. No se mezclan en el mismo scroll.
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
- **La pausa entre pasos es `scroll-snap-type: y proximity`** en el contenedor y `scroll-snap-align:
  start` en cada paso, con `scroll-margin-top` igual al colchón para que el imán caiga donde cambia
  la figura. `mandatory` no: el navegador tiene que terminar siempre en un punto de imán, y el
  cierre de la capa no es uno, así que puede quedar fuera de alcance.
- **El bloque de texto no cambia de alto entre pasos.** Todas las frases en la misma celda de una
  grilla de una celda: mide lo que la más alta, sin `min-height` mágico y sin saltos.
- **El alto sale del contenedor, no de la pantalla.** La capa es `fixed inset-0`, así que su alto
  ya es el viewport real en cada momento: `100%` acierta también cuando el navegador del teléfono
  muestra u oculta su barra, cosa que ni `vh` ni `svh` hacen. Esos quedan de respaldo para el
  primer cuadro.
- **La escena se pega debajo de la barra de la capa, no debajo del borde de la pantalla.** Con
  `top: 0` la barra tapa el aire de arriba del título: el espacio existe, pero queda detrás.
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
- **La capa entra al historial.** En Android el gesto de atrás es el gesto de cerrar; sin entrada
  propia se lleva puesta la página entera.

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
2. En los tres anchos (360, 768, escritorio), con `npm run dev`:
   - cada frase cambia algo en la figura;
   - la figura entra completa en pantalla en 360 con la barra del navegador a la vista;
   - el botón atrás cierra la capa y deja el tablero donde estaba;
   - el fondo no se mueve mientras la capa está abierta.
3. Con `prefers-reduced-motion: reduce` forzado: la figura arranca completa.
4. Con JavaScript apagado: el texto de las escenas se lee entero.
5. El emulador móvil de Chrome **no** reproduce el comportamiento de la barra del navegador. Lo de
   `svh` se comprueba en un teléfono de verdad.
6. Contra el JSON exportado del laboratorio, parámetro por parámetro: orden, anclaje, tipografía,
   fondo, alto, entrada, aire, rótulos, clave de color, y los textos **verbatim**.
7. Con dos escenas seguidas, no una: la superposición entre escenas y el paso desparejo solo se ven
   al pasar de una a la otra.
8. Contando leyendas: una sola por figura.
9. Con `node scripts/mirar_recorrido.mjs 360` y `768`: los costos de paso tienen que ser iguales
   entre sí, y las capturas hay que **abrirlas**, no solo generarlas.

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

## Lo que quedó pendiente (06-09-2026)

- **Las escenas 2 y 3 no pasaron por el laboratorio.** Tienen el tratamiento nuevo de composición
  (figura arriba, una frase por paso, destello, tipografía de 19 px), pero **su guion sigue siendo el
  viejo**: frases de hasta 290 caracteres, contra las ~110 de la escena 1. En 19 px eso es mucha
  pantalla. Falta cortarlas con el mismo criterio y, si hace falta, pasarlas por el laboratorio.
- **La leyenda y el año de las escenas 2 y 3.** Solo la escena 1 tiene clave de oleadas: las otras
  dos usan `Serie`, con una serie por figura y color propio, así que hoy no la necesitan. Si alguna
  pasa a mostrar varias oleadas a la vez, hay que darle la misma clave.
- **Nada de esto se vio renderizado desde la sesión.** Todo lo visual lo verificó el cliente en su
  teléfono. Ver «Qué herramienta usar, y cuál no».

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
