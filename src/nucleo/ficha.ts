import type { Encuesta } from './tipos'

/**
 * Las cifras de la «Ficha técnica», calculadas de los casos. Lo que no está en los casos (fechas,
 * duración, índice) lo escribe el ETL en `encuesta.ficha`; acá no hay ninguna cifra a mano.
 */

/** Los estratos del diseño, del de mayor exposición al de menor: Q1 es «Muy alto». */
export const ESTRATOS = ['Muy alto', 'Alto', 'Medio', 'Bajo'] as const
export const NIVEL_ESTRATO: Record<string, string> = { 'Muy alto': 'muy alta', Alto: 'alta', Medio: 'media', Bajo: 'baja' }

export interface FilaRegion {
  codigo: number
  nombre: string
  estrato: typeof ESTRATOS[number]
  /** 1 a 4. */
  q: number
  indice: number
  n: Record<number, number>
}

/** Las dieciséis regiones en el orden del índice, con su estrato y sus casos por oleada. */
export function regionesPorIndice (encuesta: Encuesta): FilaRegion[] {
  const estrato = new Map<number, string>()
  const n = new Map<number, Record<number, number>>()
  for (const c of encuesta.casos) {
    const r = Number(c.region)
    if (!Number.isFinite(r)) continue
    if (typeof c.region_impacto === 'string') estrato.set(r, c.region_impacto)
    const fila = n.get(r) ?? {}
    const o = Number(c.ola)
    fila[o] = (fila[o] ?? 0) + 1
    n.set(r, fila)
  }
  return (encuesta.ficha?.indice ?? []).map(({ codigo, indice }) => {
    const e = estrato.get(codigo) as typeof ESTRATOS[number]
    return {
      codigo,
      nombre: encuesta.regiones.find((x) => x.codigo === codigo)?.etiqueta ?? String(codigo),
      estrato: e,
      q: ESTRATOS.indexOf(e) + 1,
      indice,
      n: n.get(codigo) ?? {},
    }
  })
}

/** Qué parte de los casos de cada oleada es de una región, en porcentaje. */
export function pesoDeRegion (encuesta: Encuesta, codigo: number): Record<number, number> {
  const salida: Record<number, number> = {}
  for (const o of encuesta.olas) {
    const casos = encuesta.casos.filter((c) => c.ola === o)
    salida[o] = 100 * casos.filter((c) => Number(c.region) === codigo).length / casos.length
  }
  return salida
}

/** Edad mínima, máxima y mediana de cada oleada. */
export function edades (encuesta: Encuesta): Record<number, { min: number, max: number, mediana: number }> {
  const salida: Record<number, { min: number, max: number, mediana: number }> = {}
  for (const o of encuesta.olas) {
    const a = encuesta.casos.filter((c) => c.ola === o).map((c) => Number(c.edad)).filter((x) => Number.isFinite(x)).sort((x, y) => x - y)
    const k = a.length
    salida[o] = { min: a[0], max: a[k - 1], mediana: k % 2 ? a[(k - 1) / 2] : (a[k / 2 - 1] + a[k / 2]) / 2 }
  }
  return salida
}

export interface GrupoComposicion {
  variable: string
  categorias: { etiqueta: string, n: Record<number, number> }[]
}

/**
 * Sexo, tramo de edad, nivel socioeconómico y nivel educativo, con las categorías originales de la
 * encuestadora. El tramo «0_17» de `edadr` está vacío en las tres oleadas y no se muestra.
 */
export function composicion (encuesta: Encuesta): GrupoComposicion[] {
  const grupo = (variable: string, nombre: string, rotulo: (e: string) => string = (e) => e): GrupoComposicion => {
    const v = encuesta.variables.find((x) => x.nombre === variable)
    const categorias = (v?.categorias ?? []).map((cat) => {
      const n: Record<number, number> = {}
      for (const o of encuesta.olas) n[o] = encuesta.casos.filter((c) => c.ola === o && Number(c[variable]) === cat.codigo).length
      return { etiqueta: rotulo(cat.etiqueta), n }
    }).filter((cat) => encuesta.olas.some((o) => cat.n[o] > 0))
    return { variable: nombre, categorias }
  }
  // «18_24» → «18 a 24 años»; «65_+» → «65 años o más».
  const tramo = (e: string) => e.includes('+') ? e.replace('_+', ' años o más') : `${e.replace('_', ' a ')} años`
  return [
    grupo('sexo', 'Sexo'),
    grupo('edadr', 'Edad', tramo),
    grupo('nse', 'Nivel socioeconómico'),
    grupo('educacion', 'Nivel educativo'),
  ]
}
