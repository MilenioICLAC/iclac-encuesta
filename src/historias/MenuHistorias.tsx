import { Link } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import { numero } from '../locale'
import { HISTORIAS } from './indice'

/**
 * La raíz del sitio: una tarjeta por historia.
 *
 * Cada tarjeta dice **la pregunta** (la misma de la portada de la historia) y **lo que se
 * encontró**, sin cifras (ver `indice.tsx`). El orden es el del cuestionario. No hay imagen ni
 * figura en miniatura: una figura sin su escena no dice nada y obliga a leer una leyenda chica.
 */
export default function MenuHistorias ({ encuesta }: { encuesta: Encuesta }) {
  const olas = encuesta.olas
  const n = encuesta.casos.length
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <h1 className="font-display text-2xl font-semibold text-gray-900 sm:text-3xl">
        Percepciones sobre China en Chile
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        {HISTORIAS.length} historias contadas con la encuesta de ICLAC: {olas.length} oleadas ({olas[0]} a {olas[olas.length - 1]}),{' '}
        {numero(n)} personas encuestadas en un panel en línea.
      </p>
      <ol className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {HISTORIAS.map((h, i) => (
          <li key={h.id} className="flex">
            <Link
              to={`/historias/${h.id}`}
              className="group flex w-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
                Historia {i + 1} · {h.nombre}
              </span>
              <span className="mt-2 font-display text-lg font-semibold leading-snug text-gray-900">
                {h.pregunta}
              </span>
              <span className="mt-2 text-sm leading-relaxed text-gray-600">{h.hallazgo}</span>
              <span className="mt-auto pt-4 text-sm font-semibold text-brand-dark group-hover:underline">
                Leer la historia <span aria-hidden>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
