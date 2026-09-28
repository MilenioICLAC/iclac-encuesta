// El contrato de los archivos de traducción: las mismas claves que el español, ni una más ni una menos.
//
// Una clave que falta dejaría un texto sin traducir en pantalla; una que sobra es una traducción
// huérfana, casi siempre de un texto que cambió de id, y la versión nueva quedaría sin traducir sin
// que nadie lo note. Por eso el ETL se detiene en los dos casos, con la lista completa.

/**
 * Las hojas de un objeto anidado, como `[ruta, valor]`. La ruta es un arreglo de claves: una palabra
 * como «ee.uu» no se confunde con dos niveles.
 */
export function aplanar (objeto, ruta = []) {
  const salida = []
  for (const [k, v] of Object.entries(objeto)) {
    if (v !== null && typeof v === 'object') salida.push(...aplanar(v, [...ruta, k]))
    else salida.push([[...ruta, k], v])
  }
  return salida
}

const legible = (ruta) => ruta.join(' › ')

/**
 * Compara cada idioma con el español y falla con todo lo que no cuadra.
 *
 * @param nombre        qué archivo es («preguntas»), para el mensaje
 * @param es            el español, con la forma de `textos.mjs`
 * @param traducciones  `{ en, cn }`, lo que exportan los archivos de ese nombre
 */
export function validarTraducciones (nombre, es, traducciones) {
  const errores = []
  const esperadas = new Map(aplanar(es).map(([ruta]) => [JSON.stringify(ruta), ruta]))
  for (const [idioma, objeto] of Object.entries(traducciones)) {
    const archivo = `traducciones/${nombre}.${idioma}.mjs`
    if (!objeto || typeof objeto !== 'object') { errores.push(`${archivo}: no exporta un objeto`); continue }
    const presentes = new Map(aplanar(objeto).map(([ruta, valor]) => [JSON.stringify(ruta), [ruta, valor]]))
    for (const [clave, ruta] of esperadas) {
      if (!presentes.has(clave)) errores.push(`${archivo}: falta ${legible(ruta)}`)
    }
    for (const [clave, [ruta, valor]] of presentes) {
      if (!esperadas.has(clave)) errores.push(`${archivo}: sobra ${legible(ruta)}`)
      else if (typeof valor !== 'string' || !valor.trim()) errores.push(`${archivo}: ${legible(ruta)} no es un texto`)
    }
  }
  if (errores.length > 0) {
    throw new Error(`Las traducciones no cuadran con el español (${errores.length}):\n  ${errores.join('\n  ')}`)
  }
}
