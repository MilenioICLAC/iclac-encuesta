import type { Caso, Encuesta, Multiple, Variable } from './tipos'

/**
 * El único lugar donde se calcula un porcentaje.
 *
 * Lo usan las historias y el explorador. La razón de que sea uno
 * solo es que hay **dos criterios de denominador circulando en la misma casa**: el monitor
 * publicado calcula sobre todos los casos, incluidos los que no contestaron, y el Policy
 * Paper 2023 calcula sobre respuestas efectivas. Nuestro ETL reproduce las dieciocho cifras
 * del informe con el segundo criterio, y ese es el que se usa acá. Si mañana ICLAC decide
 * el otro, se cambia en este archivo y en ningún otro.
 *
 * `excluidos` existe por `p9`: en 2025 se agregó «No recuerdo» y se llevó al 17 % de la
 * muestra. Sacarlo del denominador da 74,9 %, que es la cifra que ICLAC publica; dejarlo da
 * 62,1 %. Las dos son correctas y describen cosas distintas, así que la figura tiene que
 * declarar cuál usa, y por eso el resultado devuelve `excluidos` para poder mostrarlo.
 */

export interface Segmento {
  codigo: number
  etiqueta: string
  n: number
  /** Sobre la base de respuestas efectivas. */
  porcentaje: number
}

export interface Agregado {
  segmentos: Segmento[]
  /** Denominador: respuestas efectivas, sin perdidos y sin códigos excluidos. */
  base: number
  /** Casos sin dato en la columna. */
  perdidos: number
  /** Casos con un código que se sacó del denominador a propósito. */
  excluidos: number
  /** Casos totales del recorte, antes de descontar nada. */
  total: number
}

export interface Resumen {
  media: number
  base: number
  perdidos: number
  total: number
}

/** Un corte demográfico del explorador. `null` es «sin corte». */
export type Corte = string | null

export interface Recorte {
  /** Oleadas a considerar. Vacío es «todas». */
  olas: number[]
  /** Si se descartan las personas que participaron en más de una oleada. */
  soloIndependientes?: boolean
}

export function filtrar (encuesta: Encuesta, recorte: Recorte): Caso[] {
  return encuesta.casos.filter((c) => {
    if (recorte.olas.length > 0 && !recorte.olas.includes(Number(c.ola))) return false
    if (recorte.soloIndependientes && Number(c.olas_panelista ?? 1) > 1) return false
    return true
  })
}

/**
 * Cuántas personas contestaron en más de una oleada. `olas_panelista` va por fila, así que quien
 * contestó dos veces aporta dos filas con un 2: se cuentan filas y se divide por su propio valor.
 */
export function personasRepetidas (encuesta: Encuesta): number {
  let personas = 0
  for (const c of encuesta.casos) {
    const olas = Number(c.olas_panelista ?? 1)
    if (olas > 1) personas += 1 / olas
  }
  return Math.round(personas)
}

function categoriasDe (variable: Variable): Map<number, string> {
  const m = new Map<number, string>()
  for (const c of variable.categorias ?? []) m.set(c.codigo, c.etiqueta)
  return m
}

/**
 * Distribución de una variable categórica sobre un conjunto de casos.
 *
 * `excluidos` son códigos que salen **del numerador y del denominador**, no solo del
 * numerador: es la diferencia entre «no lo cuento» y «no existió».
 */
export function distribucion (
  casos: Caso[],
  variable: Variable,
  { excluidos = [] as number[] } = {},
): Agregado {
  const etiquetas = categoriasDe(variable)
  const fuera = new Set(excluidos)

  const conteo = new Map<number, number>()
  let perdidos = 0
  let excluidosN = 0

  for (const caso of casos) {
    const v = caso[variable.nombre]
    if (v === null || v === undefined || v === '') { perdidos++; continue }
    const codigo = Number(v)
    if (Number.isNaN(codigo)) { perdidos++; continue }
    if (fuera.has(codigo)) { excluidosN++; continue }
    conteo.set(codigo, (conteo.get(codigo) ?? 0) + 1)
  }

  const base = [...conteo.values()].reduce((s, n) => s + n, 0)

  const segmentos = [...conteo.entries()]
    .map(([codigo, n]) => ({
      codigo,
      etiqueta: etiquetas.get(codigo) ?? `código ${codigo}`,
      n,
      porcentaje: base > 0 ? (100 * n) / base : 0,
    }))
    .sort((a, b) => a.codigo - b.codigo)

  return { segmentos, base, perdidos, excluidos: excluidosN, total: casos.length }
}

/** Porcentaje que representan ciertos códigos, sobre respuestas efectivas. */
export function proporcion (
  casos: Caso[],
  variable: Variable,
  codigos: number[],
  opciones: { excluidos?: number[] } = {},
): { porcentaje: number, base: number } {
  const d = distribucion(casos, variable, opciones)
  const n = d.segmentos.filter((s) => codigos.includes(s.codigo)).reduce((s, x) => s + x.n, 0)
  return { porcentaje: d.base > 0 ? (100 * n) / d.base : 0, base: d.base }
}

/** Media de una variable numérica, sobre los casos que tienen dato. */
export function media (casos: Caso[], nombre: string): Resumen {
  const valores: number[] = []
  for (const caso of casos) {
    const v = caso[nombre]
    if (typeof v === 'number' && !Number.isNaN(v)) valores.push(v)
  }
  return {
    media: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : NaN,
    base: valores.length,
    perdidos: casos.length - valores.length,
    total: casos.length,
  }
}

export interface Mencion {
  columna: string
  opcion: string
  n: number
  /** Sobre las personas que contestaron la pregunta, no sobre el total de menciones. */
  porcentaje: number
}

export interface Multirespuesta {
  menciones: Mencion[]
  /** Personas que marcaron al menos una opción. Es el denominador. */
  base: number
  /** Personas a las que no se les hizo la pregunta, o que no contestaron. */
  sinRespuesta: number
}

/**
 * Una pregunta de selección múltiple.
 *
 * **El porcentaje va sobre personas, no sobre menciones**, y ahí difiere del monitor actual,
 * que divide por el total de menciones. Con «elegir hasta dos opciones» las dos cifras son
 * distintas y la de personas es la que se puede leer en voz alta: «el 34 % mencionó
 * contaminación» tiene sentido, «el 19 % de las menciones fue contaminación» no dice cuánta
 * gente la eligió. Los porcentajes suman más de 100 a propósito.
 */
export function multirespuesta (casos: Caso[], grupo: Multiple, ola?: number): Multirespuesta {
  const opciones = ola === undefined
    ? grupo.opciones
    : grupo.opciones.filter((o) => o.olas.includes(ola))

  // En una abierta la base es quien escribió algo, marcado aparte: sus palabras solo guardan el 1.
  const marca = grupo.respuesta
  const respondieron = marca
    ? casos.filter((c) => c[marca] !== null && c[marca] !== undefined)
    : casos.filter((c) => opciones.some((o) => c[o.columna] !== null && c[o.columna] !== undefined))

  const menciones = opciones.map((o) => {
    const n = respondieron.filter((c) => Number(c[o.columna]) === 1).length
    return {
      columna: o.columna,
      opcion: o.opcion,
      n,
      porcentaje: respondieron.length > 0 ? (100 * n) / respondieron.length : 0,
    }
  }).sort((a, b) => b.n - a.n)

  return { menciones, base: respondieron.length, sinRespuesta: casos.length - respondieron.length }
}

/**
 * Corta un conjunto de casos por una variable de caracterización.
 *
 * Acepta cortes codificados (género, edad, educación) y cortes de texto (macrozona, impacto),
 * que son derivados del ETL y no tienen código. `orden` permite fijar la secuencia de los de
 * texto, donde el alfabético diría cosas falsas: «Alto, Bajo, Medio, Muy alto» sugiere una
 * escala que no es la que tiene.
 */
export function porGrupo (
  casos: Caso[],
  corte: string,
  variables: Variable[],
  orden?: string[],
): { clave: string, etiqueta: string, casos: Caso[] }[] {
  const variable = variables.find((v) => v.nombre === corte)
  const etiquetas = variable ? categoriasDe(variable) : new Map<number, string>()

  const grupos = new Map<string, Caso[]>()
  for (const caso of casos) {
    const v = caso[corte]
    if (v === null || v === undefined || v === '') continue
    const clave = String(v)
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave)!.push(caso)
  }

  const filas = [...grupos.entries()].map(([clave, casos]) => ({
    clave,
    etiqueta: etiquetas.get(Number(clave)) ?? clave,
    casos,
  }))

  if (orden) {
    // Un valor fuera de `orden` va al final, no al principio: `indexOf` da -1 y lo subía.
    const posicion = (etiqueta: string) => {
      const i = orden.indexOf(etiqueta)
      return i === -1 ? orden.length : i
    }
    return filas.sort((a, b) => posicion(a.etiqueta) - posicion(b.etiqueta))
  }
  return filas.sort((a, b) => Number(a.clave) - Number(b.clave))
}

export interface Ajuste {
  /** Intercepto y pendiente de la recta. */
  a: number
  b: number
  /** Predicción con su intervalo de confianza al 95 %, para cada x pedido. */
  puntos: { x: number, y: number, inferior: number, superior: number }[]
  n: number
  /** Proporción de la varianza explicada. Con una sola variable, suele ser baja. */
  r2: number
}

/**
 * Regresión lineal simple, en forma cerrada.
 *
 * Es lo que el monitor actual llama «predicción»: `lm(p5_1_1_value ~ p3)` con
 * `predict(interval = "confidence")`. Una sola variable explicativa, así que no hace falta
 * álgebra matricial ni una librería; la fórmula cabe en veinte líneas y se puede auditar.
 *
 * **El intervalo es de la media condicional, no de una observación nueva.** Es el que dibuja
 * el monitor, y es el angosto: dice dónde está el promedio del grupo, no dónde caería la
 * próxima persona.
 */
export function regresion (casos: Caso[], x: string, y: string, xs: number[]): Ajuste | null {
  const pares: { x: number, y: number }[] = []
  for (const caso of casos) {
    const cx = caso[x]
    const cy = caso[y]
    if (typeof cx !== 'number' || typeof cy !== 'number') continue
    if (Number.isNaN(cx) || Number.isNaN(cy)) continue
    pares.push({ x: cx, y: cy })
  }

  const n = pares.length
  if (n < 3) return null

  const mediaX = pares.reduce((s, p) => s + p.x, 0) / n
  const mediaY = pares.reduce((s, p) => s + p.y, 0) / n
  const sxx = pares.reduce((s, p) => s + (p.x - mediaX) ** 2, 0)
  if (sxx === 0) return null

  const sxy = pares.reduce((s, p) => s + (p.x - mediaX) * (p.y - mediaY), 0)
  const b = sxy / sxx
  const a = mediaY - b * mediaX

  const residuos = pares.reduce((s, p) => s + (p.y - (a + b * p.x)) ** 2, 0)
  const syy = pares.reduce((s, p) => s + (p.y - mediaY) ** 2, 0)
  const varianzaResidual = residuos / (n - 2)

  // 1,96 en vez del cuantil t exacto: con más de 500 casos la diferencia es de milésimas, y
  // traer una distribución t entera para eso no se justifica. Con n chico esto subestimaría
  // el intervalo, así que la función exige al menos 30 casos para devolver algo.
  if (n < 30) return null
  const z = 1.96

  const puntos = xs.map((xi) => {
    const y = a + b * xi
    const error = Math.sqrt(varianzaResidual * (1 / n + (xi - mediaX) ** 2 / sxx))
    return { x: xi, y, inferior: y - z * error, superior: y + z * error }
  })

  return { a, b, puntos, n, r2: syy === 0 ? 0 : 1 - residuos / syy }
}
