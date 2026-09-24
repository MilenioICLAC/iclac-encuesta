import { useEffect, useRef, useState } from 'react'
import type { Pregunta } from '../nucleo/tipos'
import { CORTES } from '../nucleo/modulos'
import { tituloEn, type Vista } from '../nucleo/explorador'
import { numero } from '../locale'
import { enfocarRadio, radioSiguiente } from '../nucleo/teclado'

/**
 * El estado del explorador, en un solo lugar y siempre visible: pregunta, oleada, corte, repetidos y N.
 *
 * El monitor actual tiene un selector de desagregación **por tarjeta**, diecinueve controles
 * que no conversan entre sí: comparar dos figuras obliga a configurarlas dos veces, y a la
 * altura de la figura 15 ya no se ve qué años están activos. Acá el estado es uno y queda pegado
 * arriba.
 *
 * **Oleada y «Entre oleadas» son un solo control** (Felipe, laboratorio `barra-explorador`,
 * 24-09-2026): eran cuatro estados excluyentes repartidos en dos grupos, uno pegado y otro no, y el
 * «En 2025» del segundo repetía la oleada del primero. Una oleada en que la pregunta no se hizo
 * queda atenuada pero se puede elegir: la figura dice en cuál sí se hizo, y la oleada elegida se
 * conserva al pasar a otra pregunta.
 *
 * Que el control de corte sea **uno solo** además hace cumplir sola la regla de un corte a la
 * vez: si no hay dos selectores, no hay forma de cruzar dos variables.
 *
 * **El título y la bajada del explorador son la cabeza de la barra** (nota del mismo laboratorio):
 * se van con el scroll y los controles quedan. La barra se pega a `--alto-encabezado` menos el alto
 * medido de esa cabeza, así que lo pegado son solo los controles.
 *
 * En teléfono los controles se pliegan en un resumen de una línea que los despliega encima de la
 * figura: desplegados de entrada tapaban el 37 % de una pantalla de 360×640.
 *
 * El N vive acá porque es el tamaño del recorte. La figura muestra igual su propia base, que es
 * otra cosa y suele ser menor.
 */

interface Props {
  olas: number[]
  preguntas: Pregunta[]
  /** La pregunta que se mira; sus oleadas y si se compara salen de ella. */
  pregunta: Pregunta
  onPregunta: (id: string) => void
  /** La vista ya resuelta: `serie` solo si la pregunta se compara. */
  vista: Vista
  onVista: (v: Vista) => void
  /** **Una sola.** Sumar oleadas da una cifra en que 2025 pesa el doble y que no describe a
   * ninguna (Felipe, 22-09-2026), así que el selector elige, no acumula. */
  ola: number
  onOla: (ola: number) => void
  corte: string | null
  onCorte: (corte: string | null) => void
  soloIndependientes: boolean
  onSoloIndependientes: (v: boolean) => void
  /** Casos del recorte, o `null` entre oleadas, donde la figura muestra la base de cada una. */
  n: number | null
}

const ROTULO = 'text-xs font-medium uppercase tracking-wide text-gray-500'
const CORTES_DESACTIVADOS = 'Cortes desactivados'

export default function BarraEstado ({
  olas, preguntas, pregunta: p, onPregunta, vista, onVista, ola: elegida, onOla,
  corte, onCorte, soloIndependientes, onSoloIndependientes, n,
}: Props) {
  const serie = vista === 'serie'
  const etiquetaCorte = serie ? 'Sin corte' : CORTES.find((c) => c.nombre === corte)?.etiqueta ?? 'Sin corte'
  const estadoN = n === null ? CORTES_DESACTIVADOS : `${numero(n)} casos · ${etiquetaCorte.toLowerCase()}`

  // El alto de la cabeza se mide: cambia con el ancho, el idioma y la llegada de Raleway.
  const cabeza = useRef<HTMLDivElement>(null)
  const [altoCabeza, setAltoCabeza] = useState(0)
  useEffect(() => {
    const nodo = cabeza.current
    if (!nodo) return
    const medir = () => { setAltoCabeza(Math.round(nodo.getBoundingClientRect().height)) }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [])

  const [abierta, setAbierta] = useState(false)
  useEffect(() => {
    if (!abierta) return
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false) }
    window.addEventListener('keydown', cerrar)
    return () => { window.removeEventListener('keydown', cerrar) }
  }, [abierta])

  // 2023 · 2024 · 2025 · Entre oleadas.
  const opciones = [
    ...olas.map((o) => ({
      clave: String(o),
      texto: String(o),
      activa: !serie && o === elegida,
      apagada: false,
      sinPregunta: !p.olas.includes(o),
      elegir: () => { onOla(o) },
    })),
    {
      clave: 'serie',
      texto: 'Entre oleadas',
      activa: serie,
      apagada: !p.serie,
      sinPregunta: false,
      elegir: () => { onVista('serie') },
    },
  ]
  const actual = Math.max(0, opciones.findIndex((o) => o.activa))

  const controles = (
    <>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <label className="flex min-w-[min(100%,16rem)] flex-1 flex-col gap-1">
          <span className={ROTULO}>Pregunta</span>
          <select
            value={p.id}
            onChange={(e) => { onPregunta(e.target.value) }}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
          >
            {/* El título de la oleada que se mira: `p21` en 2023 pregunta por la inversión china. */}
            {preguntas.map((x) => (
              <option key={x.id} value={x.id}>{tituloEn(x, { vista: 'ola', ola: elegida })}</option>
            ))}
          </select>
        </label>

        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <span className={ROTULO} aria-hidden="true">Oleada</span>
          <div
            role="radiogroup"
            aria-label="Oleada"
            className="flex rounded-md border border-gray-300"
            onKeyDown={(e) => {
              const i = radioSiguiente(e.key, actual, opciones.map((o) => !o.apagada))
              if (i === null) return
              e.preventDefault()
              opciones[i].elegir()
              enfocarRadio(e.currentTarget, i)
            }}
          >
            {opciones.map((o, i) => (
              <button
                key={o.clave}
                type="button"
                role="radio"
                aria-checked={o.activa}
                tabIndex={o.activa ? 0 : -1}
                disabled={o.apagada}
                title={o.sinPregunta ? `Esta pregunta no se hizo en ${o.texto}` : o.apagada ? 'Esta pregunta no se compara entre oleadas' : undefined}
                onClick={o.elegir}
                className={[
                  `presionable whitespace-nowrap py-1.5 text-sm tabular-nums sm:flex-none sm:px-3 ${o.clave === 'serie' ? 'flex-none px-3' : 'flex-1 px-1.5'}`,
                  i > 0 ? 'border-l border-gray-300' : 'rounded-l-md',
                  i === opciones.length - 1 ? 'rounded-r-md' : '',
                  o.activa && o.sinPregunta
                    ? 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-400'
                    : o.activa
                      ? 'bg-brand-dark text-white'
                      : o.apagada
                        ? 'cursor-not-allowed bg-white text-gray-300'
                        : `bg-white hover:bg-gray-50 ${o.sinPregunta ? 'text-gray-400' : 'text-gray-600'}`,
                ].join(' ')}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <label className="flex flex-col gap-1">
          <span className={ROTULO}>Corte</span>
          <select
            value={corte ?? ''}
            onChange={(e) => { onCorte(e.target.value === '' ? null : e.target.value) }}
            disabled={serie}
            title={serie ? 'El corte no se aplica entre oleadas' : undefined}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          >
            {CORTES.map((c) => (
              <option key={c.etiqueta} value={c.nombre ?? ''}>{c.etiqueta}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={soloIndependientes}
            onChange={(e) => { onSoloIndependientes(e.target.checked) }}
            className="rounded border-gray-300"
          />
          Sin quienes respondieron en más de una oleada
        </label>

        <p className="w-full pb-1.5 text-sm tabular-nums text-gray-500 sm:ml-auto sm:w-auto">{estadoN}</p>
      </div>
    </>
  )

  return (
    // Pegada al encabezado menos su propia cabeza: el título y la bajada se van con el scroll y los
    // controles quedan justo bajo el encabezado, que publica su alto en `--alto-encabezado`.
    <div className="sticky z-10" style={{ top: `calc(var(--alto-encabezado, 0px) - ${altoCabeza}px)` }}>
      {/* El telón va detrás del blanco de la barra y delante de la página; el encabezado (z-40) queda limpio. */}
      {abierta && <div className="fixed inset-0 -z-10 bg-gray-900/25 sm:hidden" aria-hidden="true" onClick={() => { setAbierta(false) }} />}
      <div className="relative border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div ref={cabeza} className="pb-3 pt-6">
            <h2 className="font-display text-2xl font-semibold">Explorar cualquier pregunta</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Cualquier pregunta de la encuesta, una oleada a la vez o comparando las oleadas donde se puede comparar.
            </p>
          </div>

          {/* Teléfono: un resumen que despliega los controles encima de la figura. */}
          <div className="relative pb-2.5 sm:hidden">
            <button
              type="button"
              aria-expanded={abierta}
              aria-controls="controles-explorador"
              onClick={() => { setAbierta((a) => !a) }}
              className="flex w-full items-center gap-2 text-left"
            >
              <span className="min-w-0 flex-1">
                {/* El mismo título que la figura: entre oleadas `p4` es «Voto en segunda vuelta presidencial». */}
                <span className="block truncate text-sm font-semibold text-gray-900">{tituloEn(p, { vista, ola: elegida })}</span>
                <span className="block text-xs tabular-nums text-gray-500">
                  {serie ? `Entre oleadas · ${CORTES_DESACTIVADOS.toLowerCase()}` : `${elegida} · ${estadoN}`}
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 text-gray-500 transition-transform duration-150 ease-out ${abierta ? 'rotate-180' : ''}`}>
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {abierta && (
              <div id="controles-explorador" className="absolute inset-x-[-1rem] top-full border-b border-gray-200 bg-white px-4 pb-3 pt-2 shadow-md">
                {controles}
              </div>
            )}
          </div>

          <div className="hidden pb-3 sm:block">{controles}</div>
        </div>
      </div>
    </div>
  )
}
