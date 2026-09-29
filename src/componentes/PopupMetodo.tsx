import { useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { porcentaje } from '../locale'
import Evidencia from './Evidencia'
import { ComoSeLee } from './Contrastes'
import { CasoDeLaRecta } from './MetodoRecorrido'
import Plegable from './Plegable'
import { DatosMetodo } from './contextoMetodo'
import { MEDIDAS, medidasDe, type IdHistoria } from '../historias/medidas'

/**
 * El método, en un pop-up: uno por figura y uno por historia.
 *
 * **Por qué dejó de ser una página.** El método vivía en «Sobre los datos» (`#/datos`), una vista
 * aparte a la que se llegaba desde la barra de la capa y desde el cierre. ICLAC pidió retirarla
 * (29-09-2026), y con ella se va el viaje de ida y vuelta: quien duda de una cifra la está mirando
 * en ese momento, no al final ni en otra pantalla.
 *
 * **La nota al pie se mudó adentro.** Antes cada figura llevaba su pie en letra chica; ahora ese
 * texto es lo primero que muestra el pop-up de la figura, y lo que la figura declara por sí sola es
 * su nombre y su rótulo de eje (la convención de nombres, 29-09-2026).
 *
 * **Convive con la capa, que ya es un `dialog` modal.** `CapaRecorrido` escucha el teclado en
 * `document` para cerrar con `Escape`, avanzar con las flechas y atrapar el foco en toda la capa.
 * Un pop-up que se limitara a escuchar lo suyo heredaría los tres defectos: `Escape` cerraría la
 * historia entera por debajo, las flechas moverían el recorrido de atrás y el `Tab` pasearía por el
 * contenido tapado. Por eso este escucha **en fase de captura sobre `document`** y corta la
 * propagación mientras está abierto: la capa no llega a ver ninguna de esas teclas. El panel se va
 * al `body` por un portal, así que tampoco entra en la trampa de foco de la capa ni en su scroll.
 */

const FOCOS = 'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'

/** Mismo criterio que la trampa de foco de la capa: hacer juego con el selector no es ser enfocable. */
function enfocable (el: HTMLElement) {
  if (el.tabIndex < 0) return false
  if (typeof el.checkVisibility === 'function') return el.checkVisibility({ visibilityProperty: true })
  return el.getClientRects().length > 0
}

/** Las teclas que la capa se queda para mover el recorrido, y que acá tienen que scrollear el panel. */
const DEL_SCROLL = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ']

function Popup ({ titulo, alCerrar, ancho = false, children }: { titulo: string, alCerrar: () => void, ancho?: boolean, children: ReactNode }) {
  const { t } = useTranslation('capa')
  const panel = useRef<HTMLDivElement | null>(null)
  const id = useId()
  // Como el cierre llega distinto en cada render desde el botón, va por referencia: con él como
  // dependencia, el efecto se rearmaría en cada dibujo y el foco volvería al principio.
  const cerrarRef = useRef(alCerrar)
  cerrarRef.current = alCerrar

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    // El panel es el destino del foco y el que scrollea: con el foco en el botón de cerrar, las
    // flechas no mueven nada.
    panel.current?.focus()

    const alTeclear = (e: KeyboardEvent) => {
      const nodo = panel.current
      if (!nodo) return
      if (e.key === 'Escape') {
        // Sin cortar la propagación, el mismo `Escape` cierra también la historia de atrás.
        e.preventDefault()
        e.stopPropagation()
        cerrarRef.current()
        return
      }
      if (DEL_SCROLL.includes(e.key)) {
        // Se corta la propagación pero **no** el gesto: el navegador scrollea el panel, que es lo
        // que el lector espera. La capa, que las consume con `preventDefault`, no las ve.
        e.stopPropagation()
        return
      }
      if (e.key !== 'Tab') return
      e.stopPropagation()
      const focos = [...nodo.querySelectorAll<HTMLElement>(FOCOS)].filter(enfocable)
      if (focos.length === 0) { e.preventDefault(); nodo.focus(); return }
      e.preventDefault()
      // Con el foco en el panel (que no está en la lista) el índice es −1: hacia adelante toca el
      // primero y hacia atrás el último.
      const i = focos.indexOf(document.activeElement as HTMLElement)
      focos[e.shiftKey ? (i <= 0 ? focos.length : i) - 1 : (i + 1) % focos.length].focus()
    }
    document.addEventListener('keydown', alTeclear, true)
    return () => {
      document.removeEventListener('keydown', alTeclear, true)
      anterior?.focus()
    }
  }, [])

  return createPortal(
    // Encima de la capa (`z-50`) y de los portales de la transición (`z-[60]` y `z-[61]`).
    // En teléfono sube desde abajo y ocupa el ancho; desde `sm` va centrado.
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-900/40 sm:items-center sm:p-6"
      // `mousedown` y no `click`: soltar el botón sobre el fondo después de seleccionar texto
      // dentro del panel cerraría el pop-up a mitad de una copia.
      onMouseDown={(e) => { if (e.target === e.currentTarget) alCerrar() }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`flex max-h-[85svh] w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-xl outline-none sm:max-h-[80svh] sm:rounded-xl ${ancho ? 'max-w-4xl' : 'max-w-2xl'}`}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-gray-200 px-4 py-3 sm:px-5">
          <h2 id={id} className="min-w-0 flex-1 font-display text-base font-semibold text-gray-900">{titulo}</h2>
          <button
            type="button"
            onClick={alCerrar}
            className="presionable -mr-1 shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="sr-only">{t('cerrarMetodo')}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-4 text-sm leading-snug text-gray-600 sm:px-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * El disparador y su pop-up. El foco vuelve solo al botón al cerrar (lo hace `Popup`).
 *
 * El contenido se construye igual con el pop-up cerrado: son elementos de React, que no se dibujan
 * hasta montarse. Cerrado no hay nada en el documento, así que tampoco entra en la trampa de foco
 * de la capa.
 */
export function BotonMetodo ({ etiqueta, titulo, className, tabIndex, ancho = false, children }: {
  etiqueta: ReactNode
  titulo: string
  className?: string
  /** Para lo que trae una tabla: con el ancho de lectura, las tres columnas de medidas se parten. */
  ancho?: boolean
  /**
   * `-1` saca el botón del tabulador sin sacarlo del documento. Lo usa la escena que no está en la
   * banda de lectura: desvanecida bajo una pausa queda a opacidad cero, y un foco que se ve en
   * ningún lado es peor que uno que falta (la misma razón que las frases futuras del cierre).
   */
  tabIndex?: number
  children: ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = useCallback(() => { setAbierto(false) }, [])
  return (
    <>
      <button type="button" tabIndex={tabIndex} onClick={() => { setAbierto(true) }} className={className}>
        {etiqueta}
      </button>
      {abierto && <Popup titulo={titulo} alCerrar={cerrar} ancho={ancho}>{children}</Popup>}
    </>
  )
}

/**
 * Lo que va adentro: la nota de la figura, las pruebas que la sostienen y, plegado, cómo se lee una
 * prueba.
 *
 * **Las pruebas se piden por id y las dibuja `Evidencia`**, que es el único lugar donde se escribe
 * un contraste. Qué prueba sostiene cuál figura está en `src/historias/medidas.ts`.
 *
 * **«Cómo se prueba una diferencia» va plegado y no en otro pop-up.** Un diálogo dentro de otro
 * deja al lector sin saber qué cierra `Escape`; un `<details>` no se lleva el foco de ningún lado.
 */
export function CuerpoMetodo ({ nota, medidas, recta = false }: {
  /** La nota que hasta ahora iba al pie de la figura. */
  nota?: ReactNode
  medidas: string[]
  /** El diagnóstico de la recta de ideología, que solo tiene sentido en su figura. */
  recta?: boolean
}) {
  const { t } = useTranslation('capa')
  const datos = useContext(DatosMetodo)
  const c = datos?.encuesta.contrastes ?? null
  const conPruebas = c !== null && medidas.length > 0

  return (
    <div className="flex flex-col gap-4">
      {nota && <div className="flex max-w-2xl flex-col gap-2 text-gray-700">{nota}</div>}

      {conPruebas && (
        <div>
          <h3 className="font-display text-sm font-semibold text-gray-900">{t('pruebas')}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-snug">{t('pruebasComoLeer', { p95: porcentaje(95, 0) })}</p>
          <ul className="mt-2 max-w-3xl text-xs leading-snug">
            {medidas.map((id) => <Evidencia key={id} contrastes={c} id={id} />)}
          </ul>
        </div>
      )}

      {c && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 text-xs leading-snug">
          {recta && datos && (
            <Plegable resumen={<span className="font-medium text-gray-900">{t('recta')}</span>}>
              <CasoDeLaRecta encuesta={datos.encuesta} />
            </Plegable>
          )}
          <Plegable
            resumen={
              <>
                <span className="font-medium text-gray-900">{t('comoSeLee')}</span>
                <span className="block text-gray-500">{t('comoSeLeeBajada')}</span>
              </>
            }
          >
            <ComoSeLee rondas={c.metodo.rondas} />
          </Plegable>
        </div>
      )}
    </div>
  )
}

/**
 * El método de la historia entera: todas sus pruebas juntas, en el orden en que sus figuras las
 * usan. Lo abren el enlace de la barra y el «Cómo se hizo» del cierre.
 *
 * No importa el registro de historias (`indice.tsx`) sino el mapa de medidas: el registro importa
 * las historias, que importan la capa, que importa este archivo.
 */
export function MetodoDeHistoria () {
  const datos = useContext(DatosMetodo)
  const id = datos?.historia
  const conocida = id !== undefined && id in MEDIDAS
  return (
    <CuerpoMetodo
      medidas={conocida ? medidasDe(id as IdHistoria) : []}
      recta={id === 'mirada'}
    />
  )
}
