import { useMemo, useState } from 'react'
import type { Caso, Encuesta, Variable } from '../nucleo/tipos'
import { distribucion, media, multirespuesta, porGrupo, serie } from '../nucleo/agregar'
import { CORTES } from '../nucleo/modulos'
import Distribucion from './Distribucion'
import Menciones from './Menciones'
import BarrasPorOla from './BarrasPorOla'
import { numero } from '../locale'

/**
 * El explorador: cualquier pregunta del instrumento, para consultar. Las historias afirman; esto no.
 *
 * **La oleada y el corte vienen de la barra de estado**, y la oleada es una sola: nada suma
 * oleadas (Felipe, 22-09-2026). La distribución es la de esa oleada. La vista «Entre oleadas»
 * (y las numéricas, que solo tienen esa) pone una barra por oleada sin sumar nada, y por eso no
 * usa la oleada elegida: lo dice debajo de la figura.
 *
 * Lo único que agrega es qué pregunta mirar y cómo: en una oleada o comparando oleadas.
 */

type Vista = 'distribucion' | 'serie'

interface Props {
  encuesta: Encuesta
  casos: Caso[]
  corte: string | null
  soloIndependientes: boolean
  /** La oleada de la barra de estado. */
  ola: number
}

/** Las de caracterización no se grafican: son los cortes, no las preguntas. */
const CARACTERIZACION = new Set([
  'sexo', 'edad', 'edadr', 'educacion', 'region', 'nse', 'region_macrozona', 'region_impacto',
  'p3_3', 'edad_rec', 'educacion_rec', 'nse_rec',
  'olas_panelista', 'ola',
])

export default function Graficador ({ encuesta, casos, corte, soloIndependientes, ola }: Props) {
  const opciones = useMemo(() => {
    const categoricas = encuesta.variables
      .filter((v) => !CARACTERIZACION.has(v.nombre))
      .filter((v) => v.categorias !== null && v.categorias.length > 0)
      .map((v) => ({ clave: v.nombre, etiqueta: v.etiqueta ?? v.nombre, tipo: 'variable' as const }))

    const numericas = encuesta.variables
      .filter((v) => v.nombre.endsWith('_val'))
      .map((v) => ({ clave: v.nombre, etiqueta: v.etiqueta ?? v.nombre, tipo: 'numerica' as const }))

    const multiples = encuesta.multiples
      .map((m) => ({ clave: m.id, etiqueta: m.titulo, tipo: 'multiple' as const }))

    return [...categoricas, ...numericas, ...multiples]
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))
  }, [encuesta])

  const [clave, setClave] = useState('p26')
  const [vista, setVista] = useState<Vista>('distribucion')

  const elegida = opciones.find((o) => o.clave === clave) ?? opciones[0]
  const variable = encuesta.variables.find((v) => v.nombre === elegida?.clave)
  const grupo = encuesta.multiples.find((m) => m.id === elegida?.clave)

  if (!elegida) return null

  const olas = grupo
    ? [...new Set(grupo.opciones.flatMap((o) => o.olas))].sort()
    : variable?.olas ?? []

  // Qué dibuja la figura: la oleada elegida, o una barra por oleada.
  const entreOlas = !grupo && (elegida.tipo === 'numerica' || vista === 'serie')
  const sinOla = !entreOlas && !olas.includes(ola)

  const base = grupo
    ? multirespuesta(casos, grupo).base
    : variable
      ? (elegida.tipo === 'numerica' ? media(casos, variable.nombre).base : distribucion(casos, variable).base)
      : 0

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <h2 className="font-display text-2xl font-semibold">Explorar cualquier pregunta</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Cualquier pregunta de la encuesta, una oleada a la vez. La oleada y el corte se eligen arriba.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex min-w-[min(100%,16rem)] flex-1 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Pregunta</span>
          <select
            value={elegida.clave}
            onChange={(e) => setClave(e.target.value)}
            className="w-full truncate rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
          >
            {opciones.map((o) => (
              <option key={o.clave} value={o.clave}>{o.etiqueta}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Ver</span>
          <div className="flex rounded-md border border-gray-300">
            {([['distribucion', `En ${ola}`], ['serie', 'Entre oleadas']] as const).map(([id, texto], i) => (
              <button
                key={id}
                type="button"
                aria-pressed={vista === id}
                onClick={() => setVista(id)}
                className={`px-3 py-1.5 text-sm transition-colors ${i > 0 ? 'border-l border-gray-300' : ''} ${
                  vista === id ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                } ${i === 0 ? 'rounded-l-md' : 'rounded-r-md'}`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      </div>

      <article className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-display text-base font-semibold">{elegida.etiqueta}</h3>

        {sinOla
          ? (
            <p className="mt-3 text-sm text-gray-600">
              Esta pregunta no se hizo en {ola}. Está en {olas.join(' y ')}: elige {olas.length > 1 ? 'una de esas oleadas' : 'esa oleada'} arriba
              {variable?.serie && olas.length > 1 ? ', o mírala entre oleadas' : ''}.
            </p>
            )
          : <Figura
          encuesta={encuesta}
          casos={casos}
          corte={corte}
          soloIndependientes={soloIndependientes}
          vista={vista}
          variable={variable}
          grupo={grupo}
          esNumerica={elegida.tipo === 'numerica'}
        />}

        <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-500">
          {/* La base efectiva de la figura, no el tamaño del recorte: en una pregunta que se
              hizo en una sola oleada las dos cifras difieren mucho, y la que importa es esta. */}
          {!sinOla && (
            <>
              {entreOlas
                ? <span>Una barra por oleada; no usa la oleada ni el corte elegidos arriba</span>
                : <span className="tabular-nums">n = {numero(base)} · {ola}</span>}
              <span aria-hidden>·</span>
            </>
          )}
          <span className={olas.length < 3 ? 'text-amber-700' : undefined}>
            {olas.length === 0 ? 'Sin oleadas' : olas.length === 1 ? `Solo ${olas[0]}` : olas.length < 3 ? `Solo ${olas.join(' y ')}` : 'Las tres oleadas'}
          </span>
          {/* En una pregunta de una sola oleada no hay nada que comparar, así que afirmar que
              es comparable sería una contradicción impresa en la figura. */}
          {variable && olas.length > 1 && (
            <>
              <span aria-hidden>·</span>
              <span className={variable.serie ? undefined : 'text-amber-700'}>
                {variable.serie ? 'Comparable entre oleadas' : 'No comparable entre oleadas'}
              </span>
            </>
          )}
          {variable?.nota && <p className="w-full pt-1 leading-snug">{variable.nota}</p>}
        </footer>
      </article>
    </section>
  )
}

function Figura ({
  encuesta, casos, corte, soloIndependientes, vista, variable, grupo, esNumerica,
}: {
  encuesta: Encuesta
  casos: Caso[]
  corte: string | null
  soloIndependientes: boolean
  vista: Vista
  variable?: Variable
  grupo?: Encuesta['multiples'][number]
  esNumerica: boolean
}) {
  if (grupo) {
    const datos = multirespuesta(casos, grupo)
    const orden = CORTES.find((c) => c.nombre === corte)?.orden
    const grupos = corte ? porGrupo(casos, corte, encuesta.variables, orden) : []
    const contraste = grupos.length > 0
      ? { etiqueta: grupos[0].etiqueta, datos: multirespuesta(grupos[0].casos, grupo) }
      : undefined
    return <Menciones datos={datos} contraste={contraste} />
  }

  if (!variable) return null

  if (esNumerica) {
    // Una media no tiene distribución de categorías, así que la única vista útil es la serie.
    const puntos = serie(encuesta, variable, (c) => media(c, variable.nombre).media, { soloIndependientes })
    return <BarrasPorOla puntos={puntos} unidad="media" etiqueta="Promedio de 0 a 100" />
  }

  if (vista === 'serie') {
    // Entre oleadas se sigue la primera categoría de la variable: seguir todas a la vez daría
    // cuatro o cinco líneas cruzándose, que es exactamente lo que el monitor actual produce.
    const primera = variable.categorias?.[0]
    if (!primera) return null
    const puntos = serie(
      encuesta,
      variable,
      (c) => distribucion(c, variable).segmentos.find((s) => s.codigo === primera.codigo)?.porcentaje ?? 0,
      { soloIndependientes },
    )
    return <BarrasPorOla puntos={puntos} unidad="porcentaje" etiqueta={primera.etiqueta} />
  }

  const agregado = distribucion(casos, variable)
  const orden = CORTES.find((c) => c.nombre === corte)?.orden
  const grupos = corte
    ? porGrupo(casos, corte, encuesta.variables, orden).map((g) => ({
        etiqueta: g.etiqueta,
        agregado: distribucion(g.casos, variable),
      }))
    : undefined

  return <Distribucion agregado={agregado} grupos={grupos} />
}
