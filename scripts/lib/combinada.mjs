// Acceso a la base canónica para las pruebas de aceptación.
//
// Existe para que las dos pruebas que contrastan contra cifras publicadas —el Policy Paper
// 2023 y la guía de Urdinez— midan **con el mismo código**. Si cada una se escribiera su
// propio conteo, podrían discrepar entre sí y no tendríamos forma de saber cuál miente.
//
// No es el módulo de agregación del producto: ese es `src/nucleo/agregar.ts`, en TypeScript,
// y lo usa la aplicación. Este es su equivalente para Node, y la duplicación es a propósito:
// que la prueba calcule por su cuenta es lo que la vuelve una prueba y no una tautología.

import { registros } from './xlsx.mjs'

export const RUTA = 'data/sources/combinada/ICLAC_2023_2025_combinada.xlsx'

let cache = null

function cargar () {
  if (cache) return cache
  const { datos: casos } = registros(RUTA, 'datos')
  const { datos: valores } = registros(RUTA, 'valores')
  const { datos: diccionario } = registros(RUTA, 'diccionario')

  // Etiqueta -> código, por variable y por oleada. Los códigos se buscan **por etiqueta**,
  // nunca por número: en `p4` el 1 es Boric en 2023 y Kast en 2025, así que una prueba
  // escrita contra números diría cosas distintas según el año sin avisar.
  const codigos = new Map()
  for (const v of valores) {
    const variable = String(v.variable ?? '').trim()
    if (!variable) continue
    const clave = `${variable}|${v.ola}`
    if (!codigos.has(clave)) codigos.set(clave, new Map())
    codigos.get(clave).set(String(v.etiqueta ?? '').trim(), v.codigo)
  }

  cache = { casos, valores, diccionario, codigos }
  return cache
}

export function casosDe (ola) {
  return cargar().casos.filter((c) => c.ola === ola)
}

export function diccionario () {
  return cargar().diccionario
}

/**
 * Resuelve una lista de respuestas a códigos numéricos. Acepta **etiquetas o códigos**, y la
 * mezcla no es pereza: es la forma de la fuente.
 *
 * La hoja `valores` de la base combinada trae 537 etiquetas para 2023 y 656 para 2025, pero
 * **solo 5 para 2024**, porque ICLAC declara en su propio diccionario que no dispuso del libro
 * de códigos de esa oleada (`C12`). Donde hay etiquetas conviene usarlas, porque protegen del
 * caso `p4`, cuyo código 1 es Boric en 2023 y Kast en 2025. Donde no las hay, el código es lo
 * único que existe, y pedirle a la prueba que invente una etiqueta sería peor.
 *
 * El día que ICLAC complete las etiquetas de 2024, esto sigue funcionando sin cambios.
 */
export function codigosDe (variable, ola, respuestas) {
  const { codigos } = cargar()
  const mapa = codigos.get(`${variable}|${ola}`)

  return respuestas.map((r) => {
    if (typeof r === 'number') return r
    if (!mapa) {
      throw new Error(
        `${variable} no tiene etiquetas registradas en ${ola}, así que «${r}» no se puede resolver. ` +
        'Usar el código numérico.',
      )
    }
    const codigo = mapa.get(r)
    if (codigo === undefined) {
      throw new Error(`«${r}» no es una etiqueta de ${variable} en ${ola}. Tiene: ${[...mapa.keys()].join(' · ')}`)
    }
    return codigo
  })
}

/**
 * Porcentaje sobre **respuestas efectivas**, que es el criterio del Policy Paper y el del
 * producto. El monitor publicado usa el otro (sobre todos los casos), y por eso sus cifras
 * de 2025 suman 88 %.
 */
export function porcentaje (ola, variable, respuestas, { excluir = [] } = {}) {
  const codigos = codigosDe(variable, ola, respuestas)
  const fuera = new Set(excluir.length ? codigosDe(variable, ola, excluir) : [])

  const base = casosDe(ola)
    .map((c) => c[variable])
    .filter((v) => v !== null && v !== undefined && v !== '' && !fuera.has(v))

  const n = base.filter((v) => codigos.includes(v)).length
  return { porcentaje: (100 * n) / base.length, n, base: base.length }
}

/** Media de una columna numérica, sobre los casos con dato. */
export function media (ola, columna) {
  const v = casosDe(ola).map((c) => c[columna]).filter((x) => typeof x === 'number')
  return { media: v.reduce((a, b) => a + b, 0) / v.length, base: v.length }
}
