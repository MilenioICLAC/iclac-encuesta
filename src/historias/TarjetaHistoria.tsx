import { useTranslation } from 'react-i18next'
import { CucharaPortada } from '../componentes/Sinan'
import type { Historia } from './indice'
import { traducido } from '../locale'

/**
 * La tarjeta de una historia. Vive aparte porque la dibujan tres: el menú, la salida del cierre de
 * cada historia (en miniatura: nombre, cuchara y pregunta, sin el hallazgo) y la transición hacia
 * la portada (`Transicion.tsx`), que anima copias idénticas.
 *
 * `data-pregunta` marca lo que sobrevive a la transición (viaja hasta el título de la portada),
 * `data-cuchara` la cuchara del sinan, que también sobrevive (viaja al frente y se divide en tres),
 * y `data-desvanece` lo que se apaga en el camino.
 */
/** El relleno lo comparten la tarjeta y la copia elegida de la transición: si difieren, la pregunta arranca corrida. */
export const RELLENO = 'p-6'
export const RELLENO_MINI = 'p-4'
const caja = (relleno: string) => `flex w-full flex-col rounded-lg border border-gray-200 bg-white ${relleno} shadow-sm`
export const TARJETA = caja(RELLENO)
export const TARJETA_MINI = caja(RELLENO_MINI)

/** Lo que la tarjeta necesita de una historia: el cierre no tiene el registro, solo esto. */
type DeTarjeta = Pick<Historia, 'nombre' | 'pregunta'> & Partial<Pick<Historia, 'hallazgo'>>

export function ContenidoTarjeta ({ h, i, mini = false }: { h: DeTarjeta, i: number, mini?: boolean }) {
  const { t } = useTranslation('capa')
  return (
    <>
      <span className="flex items-center justify-between gap-4 text-sm font-semibold text-brand-dark">
        <span data-desvanece data-parte="nombre"><span className="sr-only">{t('historiaDeTarjeta', { numero: i + 1 })}</span>{traducido(h.nombre)}</span>
        {/* La cuchara de la portada, que flota: no se corre al pasar el cursor como la flecha. */}
        <span data-cuchara className="shrink-0"><CucharaPortada tamano={28} clase="cuchara-tarjeta" /></span>
      </span>
      <span data-pregunta className={`font-display font-semibold leading-snug text-gray-900 ${mini ? 'mt-1 text-lg sm:text-xl' : 'mt-2 text-xl sm:text-2xl'}`}>
        {traducido(h.pregunta)}
      </span>
      {!mini && h.hallazgo && (
        <span data-desvanece className="mt-3 max-w-[52ch] text-sm leading-relaxed text-gray-600 sm:text-base">{traducido(h.hallazgo)}</span>
      )}
    </>
  )
}
