import { CORTES } from '../nucleo/modulos'
import { numero } from '../locale'
import { enfocarRadio, radioSiguiente } from '../nucleo/teclado'

/**
 * El estado del explorador, en un solo lugar y siempre visible.
 *
 * El monitor actual tiene un selector de desagregación **por tarjeta**, diecinueve controles
 * que no conversan entre sí: comparar dos figuras obliga a configurarlas dos veces, y a la
 * altura de la figura 15 ya no se ve qué años están activos. Acá el estado es uno y queda pegado
 * arriba.
 *
 * Que el control de corte sea **uno solo** además hace cumplir sola la regla de un corte a la
 * vez: si no hay dos selectores, no hay forma de cruzar dos variables.
 *
 * El N vive acá porque es el tamaño del recorte. La figura muestra igual su propia base, que es
 * otra cosa y suele ser menor.
 */

interface Props {
  olas: number[]
  /** **Una sola.** Sumar oleadas da una cifra en que 2025 pesa el doble y que no describe a
   * ninguna (Felipe, 22-09-2026), así que el selector elige, no acumula. */
  ola: number
  onOla: (ola: number) => void
  corte: string | null
  onCorte: (corte: string | null) => void
  /** Si el corte no se aplica en este momento, por qué. Se muestra apagado y lo dice, no se ignora en silencio. */
  corteApagado?: string
  soloIndependientes: boolean
  onSoloIndependientes: (v: boolean) => void
  /** Casos del recorte, o `null` entre oleadas, donde la figura muestra la base de cada una. */
  n: number | null
}

export default function BarraEstado ({
  olas, ola: elegida, onOla, corte, onCorte, corteApagado, soloIndependientes, onSoloIndependientes, n,
}: Props) {
  const etiquetaCorte = corteApagado ? 'Sin corte' : CORTES.find((c) => c.nombre === corte)?.etiqueta ?? 'Sin corte'

  return (
    // El `top` sale del alto que el encabezado publica al medirse: pegada a `top-0` quedaba
    // debajo del encabezado pegajoso y sus controles no se veían. No es un número a mano
    // porque el encabezado mide 79 px en teléfono y 88 en escritorio.
    <div className="sticky z-10 border-b border-gray-200 bg-white/95 backdrop-blur" style={{ top: 'var(--alto-encabezado, 0px)' }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Oleada</span>
          <div
            role="radiogroup"
            aria-label="Oleada"
            className="flex rounded-md border border-gray-300"
            onKeyDown={(e) => {
              const i = radioSiguiente(e.key, olas.indexOf(elegida), olas.map(() => true))
              if (i === null) return
              e.preventDefault()
              onOla(olas[i])
              enfocarRadio(e.currentTarget, i)
            }}
          >
            {olas.map((ola, i) => {
              const activa = ola === elegida
              return (
                <button
                  key={ola}
                  type="button"
                  role="radio"
                  aria-checked={activa}
                  tabIndex={activa ? 0 : -1}
                  onClick={() => onOla(ola)}
                  className={[
                    'presionable px-3 py-1 text-sm tabular-nums',
                    i > 0 ? 'border-l border-gray-300' : '',
                    i === 0 ? 'rounded-l-md' : '',
                    i === olas.length - 1 ? 'rounded-r-md' : '',
                    activa ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {ola}
                </button>
              )
            })}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Corte</span>
          <select
            value={corte ?? ''}
            onChange={(e) => onCorte(e.target.value === '' ? null : e.target.value)}
            disabled={Boolean(corteApagado)}
            title={corteApagado}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          >
            {CORTES.map((c) => (
              <option key={c.etiqueta} value={c.nombre ?? ''}>{c.etiqueta}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={soloIndependientes}
            onChange={(e) => onSoloIndependientes(e.target.checked)}
            className="rounded border-gray-300"
          />
          Sin quienes respondieron en más de una oleada
        </label>

        <p className="ml-auto text-sm tabular-nums text-gray-500">
          {n === null ? 'Entre oleadas' : `${numero(n)} casos · ${etiquetaCorte.toLowerCase()}`}
        </p>
      </div>
    </div>
  )
}
