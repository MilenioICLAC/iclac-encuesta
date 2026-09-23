import type { Historia } from './indice'

/**
 * La tarjeta de una historia en el menú. Vive aparte porque la dibujan dos: el menú y la
 * transición hacia la portada (`Transicion.tsx`), que anima copias idénticas.
 *
 * `data-pregunta` marca lo que sobrevive a la transición (viaja hasta el título de la portada) y
 * `data-desvanece` lo que se apaga en el camino.
 */
/** El relleno lo comparten la tarjeta y la copia elegida de la transición: si difieren, la pregunta arranca corrida. */
export const RELLENO = 'p-6'
export const TARJETA = `flex w-full flex-col rounded-lg border border-gray-200 bg-white ${RELLENO} shadow-sm`

export function ContenidoTarjeta ({ h, i }: { h: Historia, i: number }) {
  return (
    <>
      <span data-desvanece className="flex items-baseline justify-between gap-4 text-sm font-semibold text-brand-dark">
        <span><span className="sr-only">Historia {i + 1}: </span>{h.nombre}</span>
        <span aria-hidden className="text-lg leading-none transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 motion-reduce:transition-none">→</span>
      </span>
      <span data-pregunta className="mt-2 font-display text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
        {h.pregunta}
      </span>
      <span data-desvanece className="mt-3 max-w-[52ch] text-sm leading-relaxed text-gray-600 sm:text-base">{h.hallazgo}</span>
    </>
  )
}
