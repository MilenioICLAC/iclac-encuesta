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
 * **Identidad en figuras apiladas o de barras contiguas**, donde solo se tocan los vecinos.
 * Ese caso admite seis: la comprobación es sobre pares adyacentes, no sobre todos.
 *
 * Lo usa el desglose por región, cuyas cuatro categorías (inversor, comprador, proveedor,
 * competidor) son nominales: no hay un orden entre ellas y pintarlas con una rampa insinuaría
 * uno.
 */
export const IDENTIDAD_CONTIGUA = ['#00998C', '#E8632A', '#2A6FD6', '#C64A8E', '#C98500', '#6B4FC4'] as const

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
 * Colores con significado propio, que no se reasignan nunca.
 *
 * `p26` y `p7` tienen categorías con polaridad: estar a favor de una potencia o de la otra, o
 * estar de acuerdo o en desacuerdo. Ahí el color no dice «serie 1» sino «este lado», y por eso
 * se amarran por etiqueta. Es lo mismo que hace el monitor actual.
 *
 * **Se amarran a la etiqueta exacta**, que es frágil: si el proveedor de campo cambia «A favor
 * de EE. UU.» por «A favor de EEUU», el color se cae al de reserva. La alternativa, amarrarlos
 * al código, es peor: en `p4` el código 1 es Boric en 2023 y Kast en 2025.
 */
export const SEMANTICOS: Record<string, string> = {
  'A favor de China': '#E8632A',
  'A favor de EE. UU.': '#2A6FD6',
  'Mantener distancia de ambos': '#8A8A85',
  'Relacionarse con ambos': '#00998C',
}

/** Gris de reserva, para lo que no calza en ningún conjunto. */
export const NEUTRO = '#8A8A85'
