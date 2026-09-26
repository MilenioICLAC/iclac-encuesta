import { CucharaPortada } from '../componentes/Sinan'
import type { Historia } from './indice'

/**
 * La tarjeta de una historia en el menú. Vive aparte porque la dibujan dos: el menú y la
 * transición hacia la portada (`Transicion.tsx`), que anima copias idénticas.
 *
 * `data-pregunta` marca lo que sobrevive a la transición (viaja hasta el título de la portada),
 * `data-cuchara` la cuchara del sinan, que también sobrevive (viaja al frente y se divide en tres),
 * y `data-desvanece` lo que se apaga en el camino.
 */
/** El relleno lo comparten la tarjeta y la copia elegida de la transición: si difieren, la pregunta arranca corrida. */
export const RELLENO = 'p-6'
export const TARJETA = `flex w-full flex-col rounded-lg border border-gray-200 bg-white ${RELLENO} shadow-sm`

export function ContenidoTarjeta ({ h, i }: { h: Historia, i: number }) {
  return (
    <>
      <span className="flex items-center justify-between gap-4 text-sm font-semibold text-brand-dark">
        <span data-desvanece><span className="sr-only">Historia {i + 1}: </span>{h.nombre}</span>
        {/* La cuchara de la portada, que flota: no se corre al pasar el cursor como la flecha. */}
        <span data-cuchara className="shrink-0"><CucharaPortada tamano={28} clase="cuchara-tarjeta" /></span>
      </span>
      <span data-pregunta className="mt-2 font-display text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
        {h.pregunta}
      </span>
      <span data-desvanece className="mt-3 max-w-[52ch] text-sm leading-relaxed text-gray-600 sm:text-base">{h.hallazgo}</span>
    </>
  )
}
