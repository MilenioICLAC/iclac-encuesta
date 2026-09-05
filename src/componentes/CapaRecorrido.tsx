import { useEffect, useRef, useState } from 'react'
import { usePasoActivo } from '../nucleo/pasos'

/**
 * El recorrido vive en una capa propia, no en el scroll de la página.
 *
 * **Por qué separado.** El recorrido y el tablero se leen distinto: el recorrido tiene un orden
 * y afirma cosas, el tablero es para consultar y no afirma nada (un registro de decisiones interno). Mezclados en un
 * scroll, el lector no sabe cuándo dejó de leer un relato y empezó a usar una herramienta, y el
 * recorrido con scroll le secuestra la rueda a alguien que solo quería llegar al tablero.
 *
 * **Se entra cuando se quiere y se sale cuando se quiere.** Botón de cierre siempre a la vista,
 * `Escape`, y una barra de avance que dice cuánto falta: sin ella, «salir cuando quieras» es una
 * promesa que el lector no puede evaluar.
 *
 * El foco se lleva al botón de cierre al abrir y vuelve a donde estaba al cerrar, el `Tab` no se
 * escapa a la página de atrás, y el cuerpo queda sin scroll mientras la capa está abierta.
 */

interface Props {
  abierta: boolean
  alCerrar: () => void
  titulo: string
  /** Recibe el contenedor con scroll: el observador de los pasos mide contra él y no contra la
   *  pantalla. Con la pantalla como raíz, dentro de una capa, ningún paso se activa nunca. */
  children: (raiz: HTMLElement | null) => React.ReactNode
}

export default function CapaRecorrido ({ abierta, alCerrar, titulo, children }: Props) {
  const capa = useRef<HTMLDivElement | null>(null)
  const cerrar = useRef<HTMLButtonElement | null>(null)
  const [raiz, setRaiz] = useState<HTMLElement | null>(null)
  const [avance, setAvance] = useState(0)

  useEffect(() => {
    if (!abierta) return
    const anterior = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrar.current?.focus()

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { alCerrar(); return }
      if (e.key !== 'Tab' || !capa.current) return
      // Trampa de foco: sin esto el tabulador se va a la página de atrás, que está tapada.
      const focos = capa.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
      )
      if (focos.length === 0) return
      const primero = focos[0]
      const ultimo = focos[focos.length - 1]
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus() }
      if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
      anterior?.focus()
    }
  }, [abierta, alCerrar])

  if (!abierta) return null

  const alDesplazar = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const recorrible = el.scrollHeight - el.clientHeight
    setAvance(recorrible > 0 ? Math.min(1, el.scrollTop / recorrible) : 1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      ref={(el) => { capa.current = el; setRaiz(el) }}
      onScroll={alDesplazar}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white"
    >
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur sm:px-6">
        <span className="truncate font-display text-sm font-semibold text-gray-900">{titulo}</span>
        <div className="h-1 grow rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-brand-dark transition-[width] duration-200"
            style={{ width: `${Math.round(avance * 100)}%` }}
          />
        </div>
        <button
          ref={cerrar}
          type="button"
          onClick={alCerrar}
          className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>

      {children(raiz)}

      <div className="flex flex-col items-center gap-3 px-4 py-16">
        <p className="text-sm text-gray-600">Hasta acá el recorrido. El tablero queda abajo, para consultar.</p>
        <button
          type="button"
          onClick={alCerrar}
          className="rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand"
        >
          Ir al tablero
        </button>
      </div>
    </div>
  )
}

/**
 * Una escena del recorrido: el párrafo arriba, la figura abajo, los dos quietos mientras el
 * scroll avanza sobre una pista invisible.
 *
 * Las frases que todavía no llegaron van en gris claro, **no ocultas**: el texto está completo
 * para copiarlo, buscarlo o leerlo con un lector de pantalla, y la opacidad es una capa de
 * lectura sobre un párrafo que ya está entero, igual que con los puntos de la figura.
 */
export function Escena ({ titulo, frases, figura, nota, raiz }: {
  titulo: string
  frases: React.ReactNode[]
  figura: (activo: number) => React.ReactNode
  nota?: React.ReactNode
  raiz: HTMLElement | null
}) {
  const { activo, refs, reducido } = usePasoActivo(frases.length, raiz)

  return (
    <section className="relative">
      <div className="escena sticky top-0 flex flex-col justify-center gap-4 px-4 pb-6 pt-14 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <h3 className="font-display text-base font-semibold text-gray-900 sm:text-lg">{titulo}</h3>
          {/* Tipografía más chica en teléfono: la escena tiene que entrar entera en la pantalla,
              y con `text-sm leading-relaxed` el párrafo del primer tramo mide 440 px de 740. */}
          <p className="mt-2 text-[13px] leading-[1.55] sm:text-sm sm:leading-relaxed">
            {frases.map((frase, i) => (
              <span
                key={i}
                className={`transition-colors duration-500 ${
                  !reducido && i > activo ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {frase}{' '}
              </span>
            ))}
          </p>
        </div>
        <div className="mx-auto w-full max-w-2xl">
          {figura(activo)}
          {nota && <div className="mt-2">{nota}</div>}
        </div>
      </div>

      {/* La pista: no se ve y no se lee, solo mide el scroll. Cada tramo tiene que ser más alto
          que la banda de lectura del observador, que es el 10 % central del contenedor. */}
      <div aria-hidden>
        {frases.map((_, i) => (
          <div key={i} ref={(el) => { refs.current[i] = el }} data-paso={i} className="h-[55vh]" />
        ))}
      </div>
    </section>
  )
}
