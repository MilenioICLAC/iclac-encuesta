import { useMemo } from 'react'
import type { Encuesta, Pregunta } from '../nucleo/tipos'
import { CORTES } from '../nucleo/modulos'
import { enunciadoEn, modelo, tituloEn, vistaPosible, type Modelo, type Vista } from '../nucleo/explorador'
import FiguraExplorador from './FiguraExplorador'
import { numero } from '../locale'
import { enfocarRadio, radioSiguiente } from '../nucleo/teclado'

const VISTAS: Vista[] = ['ola', 'serie']

/**
 * El explorador: cualquier pregunta del instrumento, para consultar. Las historias afirman; esto no.
 *
 * **Qué pregunta se ofrece y cómo se muestra lo decide el catálogo** (`encuesta.preguntas`, armado
 * en `scripts/lib/preguntas_explorador.mjs` y validado contra los datos en cada ETL): título
 * legible, orden de las categorías, y en qué oleadas se hizo la misma pregunta. Acá no se infiere
 * nada del diccionario.
 *
 * Tres estados, una sola figura (`nucleo/explorador.ts`): una oleada; una oleada con corte; y
 * «Entre oleadas», que pone una fila por oleada **sin sumar ninguna** (Felipe, 22-09-2026). Entre
 * oleadas el corte no se aplica, y la barra de estado lo muestra apagado.
 *
 * El estado vive en `App`, y la dirección lo refleja (`#/explorar?p=p7&vista=serie`): así sobrevive
 * al cambio de vista y se puede mandar un enlace a una pregunta en un estado exacto.
 */

interface Props {
  encuesta: Encuesta
  pregunta: string
  onPregunta: (id: string) => void
  vista: Vista
  onVista: (v: Vista) => void
  ola: number
  onOla: (ola: number) => void
  corte: string | null
  soloIndependientes: boolean
}

export default function Graficador ({
  encuesta, pregunta: id, onPregunta, vista: pedida, onVista, ola, onOla, corte, soloIndependientes,
}: Props) {
  const p = encuesta.preguntas.find((x) => x.id === id) ?? encuesta.preguntas[0]
  const vista = vistaPosible(p, pedida)
  const estado = { vista, ola, corte, soloIndependientes }
  const m: Modelo = useMemo(() => modelo(encuesta, p, estado), [encuesta, p, vista, ola, corte, soloIndependientes]) // eslint-disable-line react-hooks/exhaustive-deps

  const noEnOla = vista === 'ola' && !p.olas.includes(ola)
  const corteFuera = vista === 'ola' && corte !== null && (p.sinCortes ?? []).includes(corte)
  const etiquetaCorte = CORTES.find((c) => c.nombre === corte)?.etiqueta.toLowerCase()

  return (
    <section className="mx-auto max-w-5xl px-4 pb-12">
      <h2 className="font-display text-2xl font-semibold">Explorar cualquier pregunta</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Cualquier pregunta de la encuesta, una oleada a la vez o comparando las oleadas donde se hizo
        igual. La oleada y el corte se eligen arriba.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex min-w-[min(100%,16rem)] flex-1 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Pregunta</span>
          <select
            value={p.id}
            onChange={(e) => onPregunta(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
          >
            {/* El título de la oleada que se mira: `p21` en 2023 pregunta por la inversión china. */}
            {encuesta.preguntas.map((x) => (
              <option key={x.id} value={x.id}>{tituloEn(x, { vista: 'ola', ola })}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Ver</span>
          <div
            className="flex rounded-md border border-gray-300"
            role="radiogroup"
            aria-label="Ver"
            onKeyDown={(e) => {
              const i = radioSiguiente(e.key, VISTAS.indexOf(vista), [true, Boolean(p.serie)])
              if (i === null) return
              e.preventDefault()
              onVista(VISTAS[i])
              enfocarRadio(e.currentTarget, i)
            }}
          >
            {([['ola', `En ${ola}`], ['serie', 'Entre oleadas']] as const).map(([v, texto], i) => {
              const activa = vista === v
              const apagada = v === 'serie' && !p.serie
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={activa}
                  tabIndex={activa ? 0 : -1}
                  disabled={apagada}
                  onClick={() => onVista(v)}
                  className={[
                    'px-3 py-1.5 text-sm transition-[background-color,color,transform] duration-150 ease-out enabled:active:scale-[0.97]',
                    i > 0 ? 'rounded-r-md border-l border-gray-300' : 'rounded-l-md',
                    activa ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 enabled:hover:bg-gray-50',
                    apagada ? 'cursor-not-allowed text-gray-300' : '',
                  ].join(' ')}
                >
                  {texto}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <article className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-display text-base font-semibold text-balance">{tituloEn(p, estado)}</h3>
        <p className="mt-1 max-w-3xl text-xs leading-snug text-gray-500">«{enunciadoEn(p, estado)}»</p>

        {vista === 'serie' && p.serie && (
          <p className="mt-2 text-xs text-gray-600">
            Una fila por oleada: {p.serie.olas.join(', ').replace(/, (\d+)$/, ' y $1')}.
            {corte && ' El corte no se aplica entre oleadas.'}
          </p>
        )}
        {corteFuera && (
          <p className="mt-2 text-xs text-gray-600">El corte por {etiquetaCorte} no se aplica: es esta misma pregunta en tres tramos.</p>
        )}

        {noEnOla
          ? (
            <div className="mt-3 text-sm text-gray-600">
              <p>Esta pregunta no se hizo en {ola}.</p>
              <p className="mt-2 flex flex-wrap items-center gap-2">
                Se hizo en
                {p.olas.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOla(o)}
                    className="rounded-md border border-gray-300 px-2 py-0.5 tabular-nums text-brand-dark transition-transform duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
                  >
                    {o}
                  </button>
                ))}
              </p>
            </div>
            )
          : <FiguraExplorador modelo={m} />}

        <Pie p={p} vista={vista} ola={ola} modelo={m} encuesta={encuesta} noEnOla={noEnOla} />
      </article>
    </section>
  )
}

function Pie ({ p, vista, ola, modelo: m, encuesta, noEnOla }: { p: Pregunta, vista: Vista, ola: number, modelo: Modelo, encuesta: Encuesta, noEnOla: boolean }) {
  const advertencia = p.advertencia ? encuesta.contrastes?.medidas.find((x) => x.id === p.advertencia)?.advertencia : undefined
  const poblacion = (vista === 'ola' ? p.poblacionPorOla?.[ola] : undefined) ?? p.poblacion
  const base = !noEnOla && vista === 'ola' ? baseDe(m) : null

  const olasSerie = p.serie?.olas.join(', ').replace(/, (\d+)$/, ' y $1')
  // Si la oleada que se mira no entra en la comparación (`p4` en 2025), se dice, con la razón.
  const fueraDeLaSerie = Boolean(p.serie) && vista === 'ola' && !p.serie!.olas.includes(ola)
  const comparacion = p.serie
    ? fueraDeLaSerie ? `Entre oleadas se compara ${olasSerie}; ${ola} no entra.` : `Se compara entre ${olasSerie}.`
    : p.olas.length === 1
      ? `Solo se preguntó en ${p.olas[0]}.`
      : p.sinSerie ?? 'No se compara entre oleadas.'

  const notas = [
    poblacion,
    vista === 'serie' || fueraDeLaSerie ? p.serie?.nota : undefined,
    p.nota,
    advertencia,
  ].filter((x): x is string => Boolean(x))

  return (
    <footer className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
      <p className="flex flex-wrap gap-x-2 gap-y-1">
        {base !== null && <span className="tabular-nums">{numero(base)} respuestas en {ola}.</span>}
        <span className={p.serie ? undefined : 'text-amber-700'}>{comparacion}</span>
      </p>
      {notas.map((n) => <p key={n} className="mt-1 max-w-3xl leading-snug">{n}</p>)}
    </footer>
  )
}

/** Respuestas efectivas de la figura de una oleada: sin corte es la de la única fila; con corte, la suma de los grupos. */
function baseDe (m: Modelo): number | null {
  if (m.forma === 'vacia') return null
  if (m.forma === 'medias') return m.filas.reduce((s, f) => s + f.base, 0)
  return m.bloques[0]?.filas.reduce((s, f) => s + f.base, 0) ?? null
}
