/**
 * La paleta de las figuras.
 *
 * **No está elegida a ojo.** Cada conjunto pasó por el validador de la skill `dataviz`, que
 * comprueba banda de luminosidad, piso de croma, separación bajo daltonismo (protanopía y
 * deuteranopía simuladas), un piso de separación para visión normal, y contraste contra el
 * fondo. La paleta de ocho sectores de `mapa_FDI` no se copia: se generó para esas ocho
 * categorías y este producto tiene otras.
 *
 * Los tres conjuntos existen porque el color hace tres trabajos distintos y cada uno tiene su
 * regla. Confundirlos es el error más común en gráficos: pintar categorías ordenadas con
 * colores de identidad, o categorías nominales con una rampa que insinúa un orden que no hay.
 */

/**
 * **Identidad**, para series que no tienen orden entre sí: las tres oleadas, los dos géneros.
 * Se asignan en orden fijo y **nunca se ciclan**: si hicieran falta más, el problema es la
 * cantidad de series, no la paleta.
 *
 * Validado en `--pairs all` con los **tres primeros slots**, que es el caso de las figuras
 * donde las marcas se superponen (curvas de densidad, líneas por oleada). Con cuatro, magenta
 * y verde azulado colapsan bajo deuteranopía a ΔE 0,9: indistinguibles. Por eso ninguna figura
 * de líneas superpuestas lleva más de tres series, y las que necesitan más van separadas en
 * paneles, donde el título de cada panel carga la identidad y el color deja de hacerlo.
 */
export const IDENTIDAD = ['#00998C', '#E8632A', '#2A6FD6'] as const

/**
 * **Orden**, para categorías cuya secuencia significa algo: tramos de edad, nivel educacional,
 * nivel socioeconómico, macrozona de norte a sur, impacto de bajo a muy alto.
 *
 * Un solo tono, de claro a oscuro, para que el orden se vea en el color. **Seis pasos es el
 * máximo**: con siete, dos pasos contiguos quedan a ΔL 0,056 y dejan de distinguirse, y bajar
 * más el extremo claro lo hunde bajo el piso de contraste de 2:1 contra el fondo blanco.
 *
 * De ahí sale una consecuencia sobre los datos, no sobre el diseño: los cortes que se ofrecen
 * tienen que tener seis categorías o menos. Educación venía con diez y nivel socioeconómico
 * con siete, así que se agrupan en el ETL. Es la misma regla que ya obliga a ofrecer
 * macrozonas en vez de dieciséis regiones.
 */
export const ORDEN = ['#6ABDB4', '#2AA69B', '#008C81', '#006B62', '#004A44', '#002E29'] as const

/**
 * **Estratos de exposición del diseño muestral**, de Bajo a Muy alto: una rampa ordinal propia, en
 * naranja, porque el teal de `ORDEN` ya dice «oleada» en las mismas historias. Validada el
 * 22-09-2026 con `validate_palette.js --ordinal` sobre blanco: un solo tono (6°), luminosidad
 * monótona con saltos ≥ 0,06 y el extremo claro a 2,02:1. El número va en `tintaSobre()`.
 */
export const EXPOSICION = ['#EFA67A', '#D9733A', '#A84D17', '#6B2E0B'] as const

/**
 * **Grupos de un corte ordenado** (edad, educación, NSE e impacto) en el explorador, de menos a más:
 * en NSE, de E a AB · C1, que es el de más poder adquisitivo y el paso más oscuro (Felipe, duodécima y
 * decimotercera ronda). No es teal, porque el teal de `ORDEN` dice «oleada» (Felipe, décima ronda: «definir
 * paletas diferentes para los grupos, para diferenciarlos de oleadas»).
 *
 * **Varios tonos y no uno**, de ámbar a ciruela, oscureciendo de un extremo al otro. La primera
 * versión era una rampa violeta de un solo tono, y en la mancuerna sus pasos oscuros no se
 * distinguían (Felipe, undécima ronda); el validador de `dataviz` lo confirmaba: ΔE 8,0 entre
 * vecinos con visión normal. Esta, generada en OKLCH con luminosidad de 0,76 a 0,35, da ΔE 13,0
 * con visión normal y 9,2 bajo protanopía, y pasa las pruebas ordinales (luminosidad monótona,
 * saltos ≥ 0,06, extremo claro a 2,11:1). **Sigue bajo el piso de 15 de visión normal**, y por eso
 * la mancuerna agrega un segundo código: el punto crece con el grupo, como con las oleadas.
 *
 * Cinco pasos porque ningún corte del explorador tiene más de cinco grupos.
 */
export const GRUPOS = ['#DEA805', '#D76F04', '#BD413F', '#931E5A', '#5C086C'] as const

/**
 * **Género**, que no tiene orden: dos colores de identidad sin teal, para que tampoco se lea como
 * oleada. Validado con `--pairs all`: ΔE 29,1 bajo protanopía y 30,1 con visión normal, los dos
 * sobre 3:1 contra el fondo.
 */
export const GENERO = ['#7650BD', '#C27C0E'] as const

/**
 * **Ideología** en tres tramos: divergente, de rojo (izquierda) a azul (derecha) con gris al centro
 * (Felipe, duodécima ronda). Es el par divergente de la skill `dataviz` con el gris de `NEUTRO`, que
 * se ve sobre blanco. Validado con `--pairs all`: ΔE 8,9 bajo deuteranopía y 17,8 con visión normal.
 * El croma bajo del gris es a propósito: el centro no es de ningún lado. Sin tamaño creciente.
 */
export const IDEOLOGIA = ['#E34948', '#8A8A85', '#2A78D6'] as const

/**
 * **Macrozona**, de norte a sur: una rampa azul de un solo tono, de claro (Norte) a oscuro (Sur), sin
 * tamaño creciente (Felipe, decimotercera ronda: «Macrozona necesita una paleta que tenga algún tipo
 * de continuidad, dado que va de norte a sur»). Azul y no teal, que es de las oleadas, ni la rampa
 * de `GRUPOS`. Generada en OKLCH (luminosidad 0,75 a 0,27) y validada con `validate_palette.js
 * --ordinal`: monótona, saltos ≥ 0,06, extremo claro a 2,14:1; entre vecinos, ΔE 13,8 bajo
 * deuteranopía y 15,9 con visión normal.
 */
export const MACROZONA = ['#50B7FE', '#2A7ED1', '#1C489F', '#15106D'] as const

/** `n` pasos de `GRUPOS`, repartidos de punta a punta, con la misma regla que `pasosDeOrden`. */
export function pasosDeGrupo (n: number): string[] {
  if (n <= 1) return [GRUPOS[2]]
  return Array.from({ length: n }, (_, i) => GRUPOS[n > GRUPOS.length ? Math.min(i, GRUPOS.length - 1) : Math.round((i * (GRUPOS.length - 1)) / (n - 1))])
}

/**
 * Toma `n` pasos de la rampa, repartidos de punta a punta.
 *
 * Con menos de seis grupos no se usan los primeros seis colores sin más: se estiran para que
 * el contraste entre extremos sea siempre el mismo y dos grupos nunca queden casi iguales.
 */
export function pasosDeOrden (n: number): string[] {
  if (n <= 1) return [ORDEN[2]]
  if (n > ORDEN.length) {
    // No debería ocurrir: los cortes se agrupan en el ETL justamente para que no pase. Si
    // pasa, es mejor repetir el paso final que ciclar y darle a dos grupos el mismo color en
    // posiciones distintas de la escala.
    return Array.from({ length: n }, (_, i) => ORDEN[Math.min(i, ORDEN.length - 1)])
  }
  return Array.from({ length: n }, (_, i) => ORDEN[Math.round((i * (ORDEN.length - 1)) / (n - 1))])
}

/**
 * La escala de confianza de `p24` y `p25`, que es una escala con polaridad: dos tonos que se alejan
 * del cero, cada uno oscureciéndose hacia su extremo. **No es la rampa de orden**, porque acá el
 * color tiene que decir de qué lado está la respuesta y no solo en qué posición. La usan también
 * figuras de acuerdo y desacuerdo (`territorio`), con el mismo sentido de lado.
 *
 * Validado con el validador de `dataviz`: el par que se toca en el cero («Poca» contra «Algo»)
 * separa ΔE 8,5 bajo protanopía y 20,2 con visión normal, y los extremos 26,9. La única
 * objeción del validador es el piso de croma de `#00776E`, que es `brand-dark`, o sea la marca:
 * el piso existe para que un color no se lea como gris **al lado de otros colores de
 * identidad**, y acá está al lado de un óxido, que no se confunde con nada. El aviso de
 * contraste contra el fondo se cubre con los rótulos, que la figura escribe siempre.
 */
export const CONFIANZA = { mucha: '#00776E', algo: '#39B5A8', poca: '#E9A26A', ninguna: '#A8431A' } as const

/** Los lados de `p26`: alinearse con una potencia, con la otra, o con ninguna. */
export const POSICION = { china: '#E8632A', eeuu: '#2A6FD6', distancia: '#8A8A85', ambos: '#00998C' } as const

/**
 * Colores con significado propio, que no se reasignan nunca.
 *
 * `p26` y la confianza tienen categorías con polaridad: estar a favor de una potencia o de la otra,
 * o confiar mucho o nada. Ahí el color no dice «serie 1» sino «este lado». Es lo mismo que hace el
 * monitor actual.
 *
 * **Se amarran a `'<pregunta>:<código>'`, no a la etiqueta.** Amarrados a la etiqueta española, el
 * color se caía al de reserva apenas la etiqueta se tradujera, o si el proveedor de campo cambiaba
 * «EE. UU.» por «EEUU». El código es estable dentro de la pregunta; la trampa de `p4`, donde el 1 es
 * Boric en 2023 y Kast en 2025, no alcanza a estas preguntas, cuyas categorías no cambian entre
 * oleadas (el catálogo del explorador lo verifica en cada ETL).
 */
export const SEMANTICOS: Record<string, string> = {
  'p26:1': POSICION.china,
  'p26:2': POSICION.eeuu,
  'p26:3': POSICION.distancia,
  'p26:4': POSICION.ambos,
  'p24:1': CONFIANZA.mucha,
  'p24:2': CONFIANZA.algo,
  'p24:3': CONFIANZA.poca,
  'p24:99': CONFIANZA.ninguna,
  'p25:1': CONFIANZA.mucha,
  'p25:2': CONFIANZA.algo,
  'p25:3': CONFIANZA.poca,
  'p25:99': CONFIANZA.ninguna,
}

/** El color propio de una categoría, o `undefined` si no tiene. */
export function semantico (pregunta: string, codigo: number | string): string | undefined {
  return SEMANTICOS[`${pregunta}:${codigo}`]
}

/** Gris de reserva, para lo que no calza en ningún conjunto. */
export const NEUTRO = '#8A8A85'

/**
 * Tinta del texto que va **encima** de un relleno de color, decidida por su luminancia.
 *
 * Blanco sobre `#E9A26A` da 2:1, muy por debajo del piso de 4,5:1 para texto chico: el número de
 * «Poca» quedaba ilegible mientras el de «Ninguna», sobre un óxido oscuro, se leía bien. Como sale
 * del color y no de una tabla escrita a mano, un cambio de paleta no vuelve a romperlo.
 *
 * Vive acá, y no en la figura que la estrenó, porque la usan todas las que escriben un número
 * dentro de su relleno: el divergente de la confianza y las barras de las escenas.
 */
export function tintaSobre (fondo: string): string {
  const canal = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(fondo.slice(i, i + 2), 16) / 255))
  const luz = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // El umbral sale de igualar los dos contrastes: sobre este valor gana el texto oscuro.
  return luz > 0.32 ? '#1f2937' : '#ffffff'
}
