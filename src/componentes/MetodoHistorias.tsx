import type { ReactNode } from 'react'
import type { Encuesta } from '../nucleo/tipos'
import { HISTORIAS } from '../historias/indice'
import Evidencia from './Evidencia'
import { CasoDeLaRecta } from './MetodoRecorrido'

/**
 * Una sección que se abre. `id` es el ancla de `#/datos?foco=<id>`, que la abre antes de llevar la
 * vista hasta ella (`SobreLosDatos`).
 *
 * **Plegado y no en pestañas:** lo cerrado sigue en la página, se encuentra con Ctrl+F en Chrome y
 * se imprime abierto (`index.css`). Una pestaña oculta no.
 */
export function Plegable ({ id, resumen, children, abierta = false }: { id?: string, resumen: ReactNode, children: ReactNode, abierta?: boolean }) {
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

/**
 * El respaldo de cada historia, una sección por historia (`#/datos?foco=metodo-<id>`).
 *
 * **Se arma del registro de historias y del artefacto**, no de texto escrito a mano: cada historia
 * declara en `src/historias/indice.tsx` qué contrastes la sostienen, y acá se dibujan con `Evidencia`.
 * Si una oleada nueva mueve un contraste, esta página cambia sola, igual que la frase que lo usa.
 *
 * Cerrada muestra la pregunta y cuántas pruebas la sostienen; abierta, el hallazgo y las pruebas.
 */
export default function MetodoHistorias ({ encuesta }: { encuesta: Encuesta }) {
  const c = encuesta.contrastes
  if (!c) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4">
      {HISTORIAS.map((h, i) => (
        <Plegable
          key={h.id}
          id={`metodo-${h.id}`}
          resumen={
            <>
              <span className="font-display text-sm font-semibold text-gray-900">Historia {i + 1} · {h.nombre}</span>
              <span className="block text-gray-500">{h.pregunta} · {h.medidas.length} {h.medidas.length === 1 ? 'prueba' : 'pruebas'}</span>
            </>
          }
        >
          <p className="max-w-2xl text-gray-900"><span className="text-gray-500">Lo que afirma: </span>{h.hallazgo}</p>
          <ul className="mt-2 max-w-3xl text-xs leading-snug">
            {h.medidas.map((id) => <Evidencia key={id} contrastes={c} id={id} />)}
          </ul>
          {h.id === 'mirada' && (
            <div className="mt-2 max-w-2xl rounded-md bg-gray-50 px-3 text-xs leading-snug">
              <Plegable id="metodo-recta" resumen={<span className="font-medium text-gray-900">Por qué un puñado de respuestas puede inclinar una recta</span>}>
                <CasoDeLaRecta encuesta={encuesta} />
              </Plegable>
            </div>
          )}
        </Plegable>
      ))}
    </div>
  )
}
