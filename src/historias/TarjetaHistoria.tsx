import type { Historia } from './indice'

/**
 * La tarjeta de una historia en el menú. Vive aparte porque la dibujan dos: el menú y la
 * transición hacia la portada (`Transicion.tsx`), que anima copias idénticas.
 *
 * `data-pregunta` marca lo que sobrevive a la transición (viaja hasta el título de la portada) y
 * `data-desvanece` lo que se apaga en el camino.
 */
export const TARJETA = 'flex w-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm'

export function ContenidoTarjeta ({ h, i }: { h: Historia, i: number }) {
  return (
    <>
      <span data-desvanece className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
        Historia {i + 1} · {h.nombre}
      </span>
      <span data-pregunta className="mt-2 font-display text-lg font-semibold leading-snug text-gray-900">
        {h.pregunta}
      </span>
      <span data-desvanece className="mt-2 text-sm leading-relaxed text-gray-600">{h.hallazgo}</span>
      <span data-desvanece className="mt-auto pt-4 text-sm font-semibold text-brand-dark group-hover:underline">
        Leer la historia <span aria-hidden>→</span>
      </span>
    </>
  )
}
