import { useMemo } from 'react'
import { numero } from '../locale'

/**
 * Nube de palabras.
 *
 * Es la figura más llamativa del monitor y la menos precisa: el área de una palabra no se
 * compara bien, y palabras largas ocupan más espacio con la misma frecuencia. Por eso acá
 * **el tamaño es la única variable visual** (sin color aleatorio ni rotación) y cada palabra
 * lleva su frecuencia al pasar el cursor. Debajo va la lista ordenada, que es lo que permite
 * leer la figura sin estimar áreas.
 *
 * Distribución determinista en filas, no aleatoria: el monitor usa `ggwordcloud`, que reordena
 * en cada corrida y hace que la misma figura se vea distinta dos veces seguidas. Acá la misma
 * entrada produce siempre la misma salida, que además es lo que permite compararla entre
 * cortes.
 *
 * **El recorte es por cantidad de palabras, no por cuantil.** Las tres nubes del monitor
 * cortan bajo un cuantil calculado sobre los datos filtrados, así que cambiar el filtro de
 * años cambia el umbral y la nube deja de ser reproducible a mano.
 */

export interface Palabra {
  palabra: string
  n: number
}

interface Props {
  palabras: Palabra[]
  /** Cuántas mostrar. El resto queda en la lista, no se pierde. */
  tope?: number
}

const MIN = 12
const MAX = 34

export default function Nube ({ palabras, tope = 40 }: Props) {
  const visibles = useMemo(() => palabras.slice(0, tope), [palabras, tope])

  if (visibles.length === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay respuestas suficientes para este recorte.</p>
  }

  const maximo = visibles[0].n
  const minimo = visibles[visibles.length - 1].n
  const tamano = (n: number) => {
    if (maximo === minimo) return (MIN + MAX) / 2
    // Raíz cuadrada: el ojo compara áreas, y con escala lineal las palabras frecuentes
    // aplastan visualmente a todo lo demás.
    const t = Math.sqrt((n - minimo) / (maximo - minimo))
    return MIN + t * (MAX - MIN)
  }

  return (
    <div>
      <ul className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 py-2">
        {visibles.map((p) => (
          <li
            key={p.palabra}
            style={{ fontSize: `${tamano(p.n)}px`, opacity: 0.55 + 0.45 * (p.n / maximo) }}
            className="font-display font-semibold leading-tight text-brand-dark"
            title={`${p.palabra}: ${numero(p.n)} menciones`}
          >
            {p.palabra}
          </li>
        ))}
      </ul>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
          Ver la lista con sus frecuencias
        </summary>
        <ol className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
          {palabras.map((p, i) => (
            <li key={p.palabra} className="flex justify-between gap-2 text-xs tabular-nums text-gray-600">
              <span className="truncate">{i + 1}. {p.palabra}</span>
              <span>{numero(p.n)}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}
