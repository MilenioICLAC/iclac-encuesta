import type { Caso, CategoriaPregunta, Encuesta, Pregunta, Variable } from './tipos'
import { distribucion, filtrar, media, multirespuesta, porGrupo, type Multirespuesta } from './agregar'
import { CORTES } from './modulos'
import { GENERO, IDENTIDAD, IDEOLOGIA, MACROZONA, NEUTRO, pasosDeGrupo, pasosDeOrden } from './paleta'

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
      /** `reparto` suma 100 dentro de cada fila; `menciones` no, porque se marca más de una;
       * `palabras` tampoco: una abierta, donde cada persona nombra varias cosas. */
      escala: 'reparto' | 'menciones' | 'palabras'
      /** En `palabras` con corte, bajo cuántas menciones un grupo no lleva punto. */
      minimo?: number
      bloques: Bloque[]
      /** Grupos u oleadas; vacío cuando hay una sola serie y cada bloque tiene una fila. */
      series: { clave: string, etiqueta: string }[]
      /** Qué son las series: define el color (oleadas y cortes ordenados van en rampa). */
      color: 'uno' | 'orden' | 'identidad'
      compara: Compara
      /** El corte de las series cuando `compara` es `grupos`; decide su paleta. */
      corte: string | null
    }
  | {
      forma: 'medias'
      filas: Fila[]
      series: { clave: string, etiqueta: string }[]
      color: 'uno' | 'orden' | 'identidad'
      compara: Compara
      corte: string | null
      /** Por fila, cuántos eligieron «Prefiero no responder» y sobre cuántos. */
      noResponde?: { clave: string, n: number, total: number }[]
    }
  | { forma: 'vacia', motivo: string }

/**
 * Qué compara la figura: oleadas entre sí, grupos de un corte, o nada (una oleada sin corte).
 * Decide la forma: sin comparación van barras; con ella, puntos en la fila de cada categoría.
 */
export type Compara = 'olas' | 'grupos' | 'nada'

export interface Estado {
  vista: Vista
  ola: number
  corte: string | null
  soloIndependientes: boolean
}

/** Con menos de estos casos una fila se muestra marcada: el porcentaje dice poco. */
export const BASE_MINIMA = 30

/**
 * Con qué se dibuja: barras o mancuerna. Barras sin comparación, en el termómetro siempre, y al
 * comparar preguntas de **dos categorías que reparten el 100 %**, donde la mancuerna dibujaría la
 * misma distancia dos veces (Felipe, décima ronda). Mancuerna en las demás comparaciones.
 */
export function formaDeFigura (m: Modelo): 'barras' | 'mancuerna' | 'nada' {
  if (m.forma === 'vacia') return 'nada'
  if (m.forma === 'medias' || m.compara === 'nada') return 'barras'
  return m.escala === 'reparto' && m.bloques.length === 2 ? 'barras' : 'mancuerna'
}

/**
 * Colores y tamaño de las series: oleadas en la rampa teal; grupos según su corte (`CORTES`). El
 * punto crece solo con las oleadas y las rampas de grupos, que van de menos a más. Ideología,
 * macrozona y género no crecen.
 */
export function paletaDeCorte (m: Exclude<Modelo, { forma: 'vacia' }>): { colores: string[], tamanos: number[] | null } {
  const n = m.series.length
  // 8, 10, 12… px: el escalón de `Puntos` con `radioCreciente`.
  const escalon = (k: number) => 8 + 2 * k
  if (m.compara === 'olas') return { colores: pasosDeOrden(n), tamanos: m.series.map((_, i) => escalon(i)) }
  if (m.compara === 'nada') return { colores: [IDENTIDAD[0]], tamanos: null }
  const corte = CORTES.find((c) => c.nombre === m.corte)
  // **El color y el tamaño siguen al grupo, no a su posición:** se buscan en el `orden` del corte.
  // Si un recorte dejara fuera a «Centro», «Derecha» no hereda su gris, y AB · C1 no se achica.
  const orden = corte?.orden ?? m.series.map((s) => s.etiqueta)
  const lugar = m.series.map((s, i) => {
    const k = orden.indexOf(s.etiqueta)
    return k >= 0 ? k : i
  })
  const porGrupo = (paleta: readonly string[]) => lugar.map((k) => paleta[k] ?? NEUTRO)
  switch (corte?.paleta) {
    case 'genero': return { colores: porGrupo(GENERO), tamanos: null }
    case 'ideologia': return { colores: porGrupo(IDEOLOGIA), tamanos: null }
    case 'macrozona': return { colores: porGrupo(MACROZONA), tamanos: null }
    default: return { colores: porGrupo(pasosDeGrupo(orden.length)), tamanos: lugar.map((k) => escalon(k)) }
  }
}

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

  const compara: Compara = series.length === 0 ? 'nada' : vista === 'serie' ? 'olas' : 'grupos'
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
    return { forma: 'medias', filas, series: series.map(({ clave, etiqueta }) => ({ clave, etiqueta })), color, compara, corte: compara === 'grupos' ? estado.corte : null, noResponde }
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
    const abierta = p.abierta
    const elegidas = abierta ? palabrasDe(abierta.palabras, opciones, porGrupo.map(({ r }) => r), vista === 'serie' ? null : multirespuesta(casosDeLaOla(encuesta, estado), grupo, estado.ola)) : opciones
    const bloques = elegidas.map((c) => ({
      clave: String(c.codigo),
      etiqueta: c.etiqueta,
      filas: porGrupo.map(({ g, r }) => {
        const m = r.menciones.find((x) => x.columna === c.codigo)
        const n = m?.n ?? 0
        // Con corte, una palabra que casi nadie nombró en un grupo no lleva punto ahí (`ABIERTAS`).
        const bajoMinimo = abierta !== undefined && compara === 'grupos' && n < abierta.minimo
        return { clave: g.clave, etiqueta: g.etiqueta, valor: r.base > 0 && !bajoMinimo ? m?.porcentaje ?? 0 : null, n, base: r.base }
      }),
    }))
    if (porGrupo.every(({ r }) => r.base === 0)) return { forma: 'vacia', motivo: 'No hay respuestas en este recorte.' }
    return {
      forma: 'porcentajes',
      escala: abierta ? 'palabras' : 'menciones',
      ...(abierta ? { minimo: abierta.minimo } : {}),
      bloques: ordenar(p, bloques),
      series: series.map(({ clave, etiqueta }) => ({ clave, etiqueta })),
      color,
      compara,
      corte: compara === 'grupos' ? estado.corte : null,
    }
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
      // Una categoría de la serie que no existe en esta oleada no es 0 %: no se preguntó (`p4`).
      const existe = !c.olas || c.olas.includes(g.ola)
      return { clave: g.clave, etiqueta: g.etiqueta, valor: d.base > 0 && existe ? s?.porcentaje ?? 0 : null, n: s?.n ?? 0, base: d.base }
    }),
  }))
  return { forma: 'porcentajes', escala: 'reparto', bloques: ordenar(p, bloques), series: series.map(({ clave, etiqueta }) => ({ clave, etiqueta })), color, compara, corte: compara === 'grupos' ? estado.corte : null }
}

/**
 * Las palabras de una abierta que entran en la figura. En una oleada, con o sin corte, las más
 * nombradas en esa oleada entera (`unaOla`), así el corte muestra las mismas palabras que sin él;
 * entre oleadas, las de mayor porcentaje promedio, para que 2025 no pese el doble. A igualdad,
 * alfabético. El ETL marca a cada persona justo para estos órdenes (`scripts/lib/abiertas.mjs`).
 */
function palabrasDe <T extends { codigo: number | string, etiqueta: string }> (cuantas: number, opciones: T[], porOla: Multirespuesta[], unaOla: Multirespuesta | null): T[] {
  const puntaje = (c: T) => unaOla
    ? unaOla.menciones.find((m) => m.columna === c.codigo)?.n ?? 0
    : porOla.reduce((s, r) => s + (r.menciones.find((m) => m.columna === c.codigo)?.porcentaje ?? 0), 0) / porOla.length
  return [...opciones].sort((a, b) => puntaje(b) - puntaje(a) || a.etiqueta.localeCompare(b.etiqueta, 'es')).slice(0, cuantas)
}

interface Serie { clave: string, etiqueta: string, casos: Caso[], ola: number }

function casosDeLaOla (encuesta: Encuesta, estado: Estado): Caso[] {
  return filtrar(encuesta, { olas: [estado.ola], soloIndependientes: estado.soloIndependientes })
}

function seriesDe (encuesta: Encuesta, p: Pregunta, estado: Estado): Serie[] {
  if (estado.vista === 'serie' && p.serie) {
    const { filtro, recodificar, variable } = p.serie
    return p.serie.olas.map((ola) => {
      const casos = filtrar(encuesta, { olas: [ola], soloIndependientes: estado.soloIndependientes })
        .filter((c) => !filtro || filtro.codigos.includes(Number(c[filtro.variable])))
      // Los códigos de esta oleada, llevados a los de la serie (en `p4` 2025, 1 es Kast y 2 Jara).
      const mapa = recodificar?.[ola]
      return {
        clave: String(ola),
        etiqueta: String(ola),
        ola,
        casos: mapa
          ? casos.map((c) => {
            const v = c[variable]
            const final = v === null || v === undefined ? undefined : mapa[String(v)]
            return final === undefined ? c : { ...c, [variable]: final }
          })
          : casos,
      }
    })
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
