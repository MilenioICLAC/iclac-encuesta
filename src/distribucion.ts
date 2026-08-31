import type { Caso, Oleada, Variable } from './tipos'

export interface Barra {
  clave: string
  etiqueta: string
  n: number
  /** Sobre la base de respuestas efectivas, que excluye centinelas y perdidos. */
  porcentaje: number
  sentinela: boolean
}

export interface Distribucion {
  barras: Barra[]
  /** Denominador de los porcentajes: respuestas efectivas. */
  base: number
  /** Casos sin dato en la columna. */
  perdidos: number
  /** Casos que marcaron un centinela («prefiero no responder»). */
  centinelas: number
  /** Solo en variables de texto: cuántas respuestas distintas hubo. */
  distintas?: number
  /** Solo en variables de texto: cuántas barras se dejaron fuera por ser irrepetidas. */
  colaUnica?: number
}

/**
 * Los porcentajes se calculan sobre respuestas efectivas: sin perdidos y sin centinelas.
 * Los dos se muestran igual, aparte y con su número, porque un porcentaje sobre 664 cuando
 * 157 no contestaron dice otra cosa que el mismo porcentaje sobre 507.
 */
function conPorcentaje (crudas: Omit<Barra, 'porcentaje'>[]): Distribucion {
  const base = crudas.filter((b) => !b.sentinela).reduce((s, b) => s + b.n, 0)
  const centinelas = crudas.filter((b) => b.sentinela).reduce((s, b) => s + b.n, 0)
  return {
    barras: crudas.map((b) => ({ ...b, porcentaje: base > 0 && !b.sentinela ? (100 * b.n) / base : 0 })),
    base,
    centinelas,
    perdidos: 0
  }
}

function categorica (variable: Variable, casos: Caso[]): Distribucion {
  const conteo = new Map<number, number>()
  let perdidos = 0
  for (const caso of casos) {
    const v = caso[variable.nombre]
    if (v === null || v === undefined) { perdidos++; continue }
    conteo.set(Number(v), (conteo.get(Number(v)) ?? 0) + 1)
  }
  const crudas = (variable.categorias ?? [])
    .filter((c) => (conteo.get(c.codigo) ?? 0) > 0)
    .map((c) => ({
      clave: String(c.codigo),
      etiqueta: c.etiqueta,
      n: conteo.get(c.codigo) ?? 0,
      sentinela: Boolean(c.sentinela)
    }))
  return { ...conPorcentaje(crudas), perdidos }
}

/** Tramos de cinco años, que es como se leen las edades y como las agrupa el monitor. */
function numerica (variable: Variable, casos: Caso[]): Distribucion {
  const valores: number[] = []
  let perdidos = 0
  for (const caso of casos) {
    const v = caso[variable.nombre]
    if (v === null || v === undefined || typeof v !== 'number') { perdidos++; continue }
    valores.push(v)
  }
  if (valores.length === 0) return { barras: [], base: 0, perdidos, centinelas: 0 }

  const ancho = 5
  const desde = Math.floor(Math.min(...valores) / ancho) * ancho
  const hasta = Math.floor(Math.max(...valores) / ancho) * ancho
  const crudas = []
  for (let inicio = desde; inicio <= hasta; inicio += ancho) {
    const n = valores.filter((v) => v >= inicio && v < inicio + ancho).length
    crudas.push({ clave: String(inicio), etiqueta: `${inicio} a ${inicio + ancho - 1}`, n, sentinela: false })
  }
  return { ...conPorcentaje(crudas), perdidos }
}

/**
 * Las preguntas abiertas se muestran como frecuencia de la respuesta literal, sin tokenizar
 * ni lematizar. La nube de palabras del monitor hace eso y es otro trabajo; acá lo que
 * interesa es ver qué contestó la gente y cuánto se repite.
 */
function texto (variable: Variable, casos: Caso[]): Distribucion {
  const conteo = new Map<string, number>()
  let perdidos = 0
  for (const caso of casos) {
    const v = caso[variable.nombre]
    if (v === null || v === undefined || String(v).trim() === '') { perdidos++; continue }
    const clave = String(v).trim()
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
  }
  const todas = [...conteo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
  const repetidas = todas.filter(([, n]) => n > 1)
  const crudas = repetidas.map(([etiqueta, n]) => ({ clave: etiqueta, etiqueta, n, sentinela: false }))

  // La base es el total de respuestas, no solo las repetidas: si el 60% contestó algo
  // que nadie más dijo, ese 60% tiene que seguir estando en el denominador.
  const respuestas = casos.length - perdidos
  return {
    barras: crudas.map((b) => ({ ...b, porcentaje: respuestas > 0 ? (100 * b.n) / respuestas : 0 })),
    base: respuestas,
    perdidos,
    centinelas: 0,
    distintas: todas.length,
    colaUnica: todas.length - repetidas.length
  }
}

export function calcularDistribucion (variable: Variable, casos: Caso[]): Distribucion {
  if (variable.tipo === 'numerica') return numerica(variable, casos)
  if (variable.tipo === 'texto') return texto(variable, casos)
  return categorica(variable, casos)
}

export function variablesPublicadas (oleada: Oleada): Variable[] {
  return oleada.variables.filter((v) => v.publicada)
}
