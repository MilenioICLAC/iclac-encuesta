import type { ReactNode } from 'react'

/**
 * Una sección que se abre.
 *
 * **Plegado y no en pestañas:** lo cerrado sigue en el documento, se encuentra con Ctrl+F en Chrome
 * y se imprime abierto (`index.css`). Una pestaña oculta no.
 *
 * Vive en su propio archivo y no junto a quien la usa: la monta el pop-up de método, que no puede
 * importar nada que a su vez importe las historias (el registro de historias importa las historias,
 * que importan la capa, que importa el pop-up).
 */
export default function Plegable ({ id, resumen, children, abierta = false }: { id?: string, resumen: ReactNode, children: ReactNode, abierta?: boolean }) {
  return (
    <details id={id} open={abierta || undefined} className="plegable group border-t border-gray-200 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-start gap-2 py-3 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="mt-0.5 inline-block w-3 shrink-0 text-gray-400 transition-transform group-open:rotate-90">▸</span>
        <span className="min-w-0 flex-1">{resumen}</span>
      </summary>
      <div className="pb-4 pl-5">{children}</div>
    </details>
  )
}
