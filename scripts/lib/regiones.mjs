// Agrupaciones de región, portadas de `iclac_categorizar_regiones()` del monitor en R.
//
// Existen porque la muestra no aguanta cortar por las dieciséis regiones: la más chica tiene
// 15 casos. Agrupar antes de ofrecer es lo que ya hace el monitor actual, y es la razón por
// la que el corte territorial se ofrece como macrozona o como impacto, nunca como región.
//
// **La de impacto no es geográfica:** agrupa por peso económico de China en la región, que es
// el criterio con el que se estratificó la muestra. Es la variable que da sentido al diseño
// muestral y la que sostiene el hallazgo más publicable del proyecto.

/**
 * Orden geográfico de norte a sur. Los códigos de región vienen del número romano, así que
 * `13` (Metropolitana) cae entre Valparaíso y O'Higgins y no al final.
 */
const ORDEN_GEOGRAFICO = {
  15: 1, // Arica y Parinacota
  1: 2, //  Tarapacá
  2: 3, //  Antofagasta
  3: 4, //  Atacama
  4: 5, //  Coquimbo
  5: 6, //  Valparaíso
  13: 7, // Metropolitana
  6: 8, //  O'Higgins
  7: 9, //  Maule
  16: 10, // Ñuble
  8: 11, // Biobío
  9: 12, // La Araucanía
  14: 13, // Los Ríos
  10: 14, // Los Lagos
  11: 15, // Aysén
  12: 16, // Magallanes
}

export const MACROZONAS = ['Norte', 'Centro', 'Centro sur', 'Sur']

/**
 * Macrozona de una región.
 *
 * **Difiere del monitor publicado en un caso, a propósito.** Su `case_when` evalúa
 * `orden_geo == 15 ~ "Norte"` antes de las ramas del sur, y `orden_geo` 15 es **Aysén**: en el
 * monitor que ICLAC publica hoy, Aysén cuenta como Norte. Se ve en su propio código, con una
 * rama `"Sur austral"` comentada al lado, así que parece un arreglo a medio hacer más que una
 * decisión. Acá Aysén va al Sur.
 *
 * La consecuencia es que el corte por macrozona **no reproduce las cifras del sitio**. Aysén
 * aporta pocos casos, pero la diferencia existe y hay que declararla en la figura.
 */
export function macrozona (region) {
  const orden = ORDEN_GEOGRAFICO[region]
  if (orden === undefined) return null
  if (orden <= 5) return 'Norte'
  if (region === 5 || region === 13 || region === 6) return 'Centro'
  if (orden >= 12) return 'Sur'
  if (orden >= 8) return 'Centro sur'
  return null
}

export const IMPACTOS = ['Bajo', 'Medio', 'Alto', 'Muy alto']

/** Impacto económico de China en la región. Es el estrato del diseño muestral. */
export function impacto (region) {
  if ([1, 2, 3, 6].includes(region)) return 'Muy alto'
  if ([5, 8, 4, 7].includes(region)) return 'Alto'
  if ([13, 9, 14, 15].includes(region)) return 'Medio'
  if ([10, 12, 16, 11].includes(region)) return 'Bajo'
  return null
}

/** Para ordenar las regiones de norte a sur en una figura. */
export function orden (region) {
  return ORDEN_GEOGRAFICO[region] ?? 99
}

/**
 * Tres regiones tienen nombre oficial largo y en un eje quedan truncadas con puntos
 * suspensivos, que es peor que abreviarlas: «Aysén del Genera…» no dice más que «Aysén».
 */
const ABREVIADAS = {
  "Libertador General Bernardo O'Higgins": "O'Higgins",
  'Aysén del General Carlos Ibañez del Campo': 'Aysén',
  'Magallanes y la Antártica Chilena': 'Magallanes',
  // «X Región de los Lagos»: el artículo es parte del nombre, y el recorte de «de los» lo comía.
  Lagos: 'Los Lagos',
}

/** «V Región de Valparaíso» → «Valparaíso». El número romano no aporta y ocupa el eje. */
export function nombreCorto (etiqueta) {
  const limpio = String(etiqueta)
    .replace(/^[IVX]+\s+/, '')
    .replace(/^Región\s+(del|de\s+la|de\s+los|de\s+las|de)\s+/i, '')
    .replace(/^Región\s+/i, '')
    .trim()
  return ABREVIADAS[limpio] ?? limpio
}
