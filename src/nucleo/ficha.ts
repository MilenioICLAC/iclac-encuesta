import type { Encuesta } from './tipos'
import { ESTRATOS, type Estrato } from './modulos'
import i18n from '../i18n'

/**
 * Las cifras de la «Ficha técnica», calculadas de los casos. Lo que no está en los casos (fechas,
 * duración, índice) lo escribe el ETL en `encuesta.ficha`; acá no hay ninguna cifra a mano.
 */

/** Los estratos del diseño y sus rótulos están en `modulos.ts` (`ESTRATOS`): Q1 es «Muy alto». */

export interface FilaRegion {
  codigo: number
  nombre: string
  estrato: Estrato
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
    const e = estrato.get(codigo) as Estrato
    return {
      codigo,
      nombre: encuesta.regiones.find((x) => x.codigo === codigo)?.etiqueta ?? String(codigo),
      estrato: e,
      q: ESTRATOS.findIndex(([clave]) => clave === e) + 1,
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
  /** La variable de la base, que es la clave; `variable` es su nombre visible. */
  clave: string
  variable: string
  categorias: { codigo: number, etiqueta: string, n: Record<number, number> }[]
}

/**
 * Sexo, tramo de edad, nivel socioeconómico y nivel educativo, con las categorías originales de la
 * encuestadora. El tramo «0_17» de `edadr` está vacío en las tres oleadas y no se muestra.
 */
export function composicion (encuesta: Encuesta): GrupoComposicion[] {
  // Los rótulos visibles salen de `paginas.json` (`ficha.composicionRotulos`); sin traducción queda el
  // de la encuestadora, como las letras del nivel socioeconómico, que no se traducen.
  const t = (clave: string, respaldo: string, valores: Record<string, string> = {}) =>
    i18n.t(`ficha.composicionRotulos.${clave}`, { ns: 'paginas', defaultValue: respaldo, ...valores })
  const grupo = (variable: string, rotulo: (e: string, codigo: number) => string = (e, codigo) => t(`${variable}.${codigo}`, e)): GrupoComposicion => {
    const v = encuesta.variables.find((x) => x.nombre === variable)
    const categorias = (v?.categorias ?? []).map((cat) => {
      const n: Record<number, number> = {}
      for (const o of encuesta.olas) n[o] = encuesta.casos.filter((c) => c.ola === o && Number(c[variable]) === cat.codigo).length
      return { codigo: cat.codigo, etiqueta: rotulo(cat.etiqueta, cat.codigo), n }
    }).filter((cat) => encuesta.olas.some((o) => cat.n[o] > 0))
    return { clave: variable, variable: t(`grupos.${variable}`, variable), categorias }
  }
  // «18_24» → «18 a 24 años»; «65_+» → «65 años o más».
  const tramo = (e: string) => {
    const [desde, hasta] = e.split('_')
    return hasta === '+' ? t('tramoAbierto', e, { desde }) : t('tramo', e, { desde, hasta })
  }
  return [
    grupo('sexo'),
    grupo('edadr', tramo),
    grupo('nse'),
    grupo('educacion'),
  ]
}
