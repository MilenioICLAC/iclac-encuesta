import type { Caso, CategoriaPregunta, Encuesta, Pregunta, Variable } from './tipos'
import { distribucion, filtrar, media, multirespuesta, porGrupo } from './agregar'
import { CORTES } from './modulos'

/**
 * Qué dibuja el explorador para una pregunta, en cada uno de sus tres estados: una oleada, una
 * oleada con un corte, y «Entre oleadas».
 *
 * **Los tres estados salen de la misma forma**: bloques (una categoría, una opción) con filas
 * (una por grupo o una por oleada). Así la comparación por grupo y la comparación entre oleadas
 * se leen igual, y la figura sabe una sola cosa. Antes, «Entre oleadas» seguía la primera
 * categoría por código: en `p7` mostraba «Muy en desacuerdo» subiendo de 6,9 a 10,0 % con el
 * desacuerdo total quieto en 39,5 y 39,1 %.
 *
 * Todo lo que decide qué se compara viene del catálogo (`Pregunta`), que el ETL valida contra los
 * datos. Acá no se infiere comparabilidad de nada.
 */

export type Vista = 'ola' | 'serie'

export interface Fila {
  clave: string
  etiqueta: string
  /** Porcentaje o media. `null` si en esa oleada la pregunta no se hizo. */
  valor: number | null
  n: number
  /** Respuestas efectivas de esa fila: el denominador. */
  base: number
}

export interface Bloque {
  clave: string
  etiqueta: string
  filas: Fila[]
}

export type Modelo =
  | {
      forma: 'porcentajes'
      /** `reparto` suma 100 dentro de cada fila; `menciones` no, porque se marca más de una. */
      escala: 'reparto' | 'menciones'
      bloques: Bloque[]
      /** Grupos u oleadas; vacío cuando hay una sola serie y cada bloque tiene una fila. */
      series: { clave: string, etiqueta: string }[]
      /** Qué son las series: define el color (oleadas y cortes ordenados van en rampa). */
      color: 'uno' | 'orden' | 'identidad'
    }
  | {
      forma: 'medias'
      filas: Fila[]
      series: { clave: string, etiqueta: string }[]
      color: 'uno' | 'orden' | 'identidad'
      /** Por fila, cuántos eligieron «Prefiero no responder» y sobre cuántos. */
      noResponde?: { clave: string, n: number, total: number }[]
    }
  | { forma: 'vacia', motivo: string }

export interface Estado {
  vista: Vista
  ola: number
  corte: string | null
  soloIndependientes: boolean
}

/** Con menos de estos casos una fila se muestra marcada: el porcentaje dice poco. */
export const BASE_MINIMA = 30

// --- Textos de la pregunta -------------------------------------------------------------------

export function tituloEn (p: Pregunta, estado: Pick<Estado, 'vista' | 'ola'>): string {
  if (estado.vista === 'serie') return p.titulo
  return p.tituloPorOla?.[estado.ola] ?? p.titulo
}

export function enunciadoEn (p: Pregunta, estado: Pick<Estado, 'vista' | 'ola'>): string {
  if (estado.vista === 'serie' && p.serie) {
    // Entre oleadas el enunciado es el de la oleada más reciente de la serie.
    const ultima = p.serie.olas[p.serie.olas.length - 1]
    return p.enunciadoPorOla?.[ultima] ?? p.enunciado
  }
  return p.enunciadoPorOla?.[estado.ola] ?? p.enunciado
}

export function etiquetaEn (c: CategoriaPregunta, ola: number): string {
  return c.porOla?.[ola] ?? c.etiqueta
}

/** Si el corte elegido se aplica a esta pregunta en este estado. */
export function corteAplicable (p: Pregunta, estado: Pick<Estado, 'vista' | 'corte'>): boolean {
  if (!estado.corte) return false
  if (estado.vista === 'serie') return false
  return !(p.sinCortes ?? []).includes(estado.corte)
}

/** La vista pedida, o la que queda si la pedida no existe para esta pregunta. */
export function vistaPosible (p: Pregunta, vista: Vista): Vista {
  return vista === 'serie' && p.serie ? 'serie' : 'ola'
}

// --- El modelo -------------------------------------------------------------------------------

export function modelo (encuesta: Encuesta, p: Pregunta, estado: Estado): Modelo {
  const vista = vistaPosible(p, estado.vista)
  if (vista === 'ola' && !p.olas.includes(estado.ola)) {
    return { forma: 'vacia', motivo: `Esta pregunta no se hizo en ${estado.ola}.` }
  }

  // Las series de la figura: las oleadas de la comparación, los grupos del corte, o una sola.
  const series = seriesDe(encuesta, p, { ...estado, vista })
  const color: 'uno' | 'orden' | 'identidad' = series.length === 0
    ? 'uno'
    : vista === 'serie'
      ? 'orden'
      : CORTES.find((c) => c.nombre === estado.corte)?.nominal ? 'identidad' : 'orden'

  const unaSola = series.length === 0
  const grupos = unaSola ? [{ clave: 'todas', etiqueta: '', casos: casosDeLaOla(encuesta, estado), ola: estado.ola }] : series

  if (p.tipo === 'numerica') {
    const filas = grupos.map((g) => {
      const r = media(g.casos, p.variable)
      return { clave: g.clave, etiqueta: g.etiqueta || String(g.ola), valor: r.base > 0 ? r.media : null, n: r.base, base: r.base }
    })
    const noResponde = p.noResponde
      ? grupos.map((g) => {
          const conMarca = g.casos.filter((c) => c[p.noResponde!.variable] !== null && c[p.noResponde!.variable] !== undefined)
          return { clave: g.clave, n: conMarca.filter((c) => Number(c[p.noResponde!.variable]) === p.noResponde!.codigo).length, total: conMarca.length }
        })
      : undefined
    if (filas.every((f) => f.base === 0)) return { forma: 'vacia', motivo: 'No hay respuestas en este recorte.' }
    return { forma: 'medias', filas, series: series.map(({ clave, etiqueta }) => ({ clave, etiqueta })), color, noResponde }
  }

  if (p.tipo === 'multiple') {
    const grupo = encuesta.multiples.find((m) => m.id === p.variable)
    if (!grupo) return { forma: 'vacia', motivo: 'No hay datos para esta pregunta.' }
    // Entre oleadas, solo las opciones que se ofrecieron en todas: una opción nueva no es un alza.
    const olasFigura = [...new Set(grupos.map((g) => g.ola))]
    const opciones = (p.categorias ?? []).filter((c) => {
      const o = grupo.opciones.find((x) => x.columna === c.codigo)
      return o && olasFigura.every((ola) => o.olas.includes(ola))
    })
    const porGrupo = grupos.map((g) => ({ g, r: multirespuesta(g.casos, grupo, g.ola) }))
    const bloques = opciones.map((c) => ({
      clave: String(c.codigo),
      etiqueta: c.etiqueta,
      filas: porGrupo.map(({ g, r }) => {
        const m = r.menciones.find((x) => x.columna === c.codigo)
        return { clave: g.clave, etiqueta: g.etiqueta, valor: r.base > 0 ? m?.porcentaje ?? 0 : null, n: m?.n ?? 0, base: r.base }
      }),
    }))
    if (porGrupo.every(({ r }) => r.base === 0)) return { forma: 'vacia', motivo: 'No hay respuestas en este recorte.' }
    return { forma: 'porcentajes', escala: 'menciones', bloques: ordenar(p, bloques), series: series.map(({ clave, etiqueta }) => ({ clave, etiqueta })), color }
  }

  // Elección única: la columna y las categorías de la vista (la serie puede usar la derivada).
  const nombre = vista === 'serie' && p.serie ? p.serie.variable : p.variable
  const categorias = vista === 'serie' && p.serie?.categorias ? p.serie.categorias : p.categorias ?? []
  const olaDeEtiquetas = vista === 'serie' && p.serie ? p.serie.olas[0] : estado.ola
  const variable: Variable = {
    nombre,
    etiqueta: null,
    tipo: null,
    olas: p.olas,
    serie: true,
    comparabilidad: null,
    nota: null,
    categorias: categorias.map((c) => ({ codigo: Number(c.codigo), etiqueta: etiquetaEn(c, olaDeEtiquetas), difiereEntreOlas: false })),
  }
  const agregados = grupos.map((g) => ({ g, d: distribucion(g.casos, variable) }))
  if (agregados.every(({ d }) => d.base === 0)) return { forma: 'vacia', motivo: 'No hay respuestas en este recorte.' }

  const bloques = categorias.map((c) => ({
    clave: String(c.codigo),
    etiqueta: etiquetaEn(c, olaDeEtiquetas),
    filas: agregados.map(({ g, d }) => {
      const s = d.segmentos.find((x) => x.codigo === Number(c.codigo))
      return { clave: g.clave, etiqueta: g.etiqueta, valor: d.base > 0 ? s?.porcentaje ?? 0 : null, n: s?.n ?? 0, base: d.base }
    }),
  }))
  return { forma: 'porcentajes', escala: 'reparto', bloques: ordenar(p, bloques), series: series.map(({ clave, etiqueta }) => ({ clave, etiqueta })), color }
}

interface Serie { clave: string, etiqueta: string, casos: Caso[], ola: number }

function casosDeLaOla (encuesta: Encuesta, estado: Estado): Caso[] {
  return filtrar(encuesta, { olas: [estado.ola], soloIndependientes: estado.soloIndependientes })
}

function seriesDe (encuesta: Encuesta, p: Pregunta, estado: Estado): Serie[] {
  if (estado.vista === 'serie' && p.serie) {
    const { filtro } = p.serie
    return p.serie.olas.map((ola) => ({
      clave: String(ola),
      etiqueta: String(ola),
      ola,
      casos: filtrar(encuesta, { olas: [ola], soloIndependientes: estado.soloIndependientes })
        .filter((c) => !filtro || filtro.codigos.includes(Number(c[filtro.variable]))),
    }))
  }
  if (!corteAplicable(p, estado)) return []
  const orden = CORTES.find((c) => c.nombre === estado.corte)?.orden
  return porGrupo(casosDeLaOla(encuesta, estado), estado.corte!, encuesta.variables, orden)
    .map((g) => ({ clave: g.clave, etiqueta: g.etiqueta, casos: g.casos, ola: estado.ola }))
}

/**
 * El orden de lectura del catálogo, o de mayor a menor. La frecuencia se mide sobre todas las
 * filas juntas, para que el orden no cambie de un grupo a otro dentro de la misma figura, y **en
 * personas, no en porcentajes sumados**: sumar porcentajes le da a un grupo de 160 el peso de uno
 * de 400, y en `p18a` 2025 por edad ponía la televisión (795) sobre las redes (803) (Codex).
 */
function ordenar (p: Pregunta, bloques: Bloque[]): Bloque[] {
  if (p.orden !== 'frecuencia') return bloques
  const alFinal = new Set((p.alFinal ?? []).map(String))
  const peso = (b: Bloque) => b.filas.reduce((s, f) => s + f.n, 0)
  return [...bloques].sort((a, b) => {
    const fa = alFinal.has(a.clave) ? 1 : 0
    const fb = alFinal.has(b.clave) ? 1 : 0
    return fa - fb || peso(b) - peso(a)
  })
}
