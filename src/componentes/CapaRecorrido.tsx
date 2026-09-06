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
 *
 * **La capa entra al historial.** En el teléfono, el gesto de atrás es el gesto de cerrar: sin una
 * entrada propia, el lector que quiere salir del recorrido se lleva puesto el sitio entero.
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
  // El cierre va por referencia y no por dependencia del efecto: llega como función anónima desde
  // la página, así que cambia de identidad en cada render, y con el efecto atado a ella cada
  // render agregaría otra entrada al historial.
  const alCerrarRef = useRef(alCerrar)
  alCerrarRef.current = alCerrar
  const [raiz, setRaiz] = useState<HTMLElement | null>(null)
  const [avance, setAvance] = useState(0)

  useEffect(() => {
    if (!abierta) return
    const anterior = document.activeElement as HTMLElement | null

    // Bloqueo del fondo. `overflow: hidden` sobre el cuerpo no alcanza en iOS Safari, que lo
    // ignora y sigue moviendo la página debajo de la capa: hay que fijar el cuerpo y compensar a
    // mano el desplazamiento que tenía, que es lo que se repone al cerrar.
    const desplazado = window.scrollY
    const estilo = document.body.style
    const previo = { overflow: estilo.overflow, position: estilo.position, top: estilo.top, width: estilo.width }
    estilo.overflow = 'hidden'
    estilo.position = 'fixed'
    estilo.top = `-${desplazado}px`
    estilo.width = '100%'

    // Una entrada propia en el historial, sin cambiar la URL: el recorrido no es una dirección
    // distinta del tablero, es una capa encima.
    history.pushState({ recorrido: true }, '')
    const alVolver = () => { alCerrarRef.current() }
    window.addEventListener('popstate', alVolver)

    cerrar.current?.focus()

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { alCerrarRef.current(); return }
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
      window.removeEventListener('popstate', alVolver)
      estilo.overflow = previo.overflow
      estilo.position = previo.position
      estilo.top = previo.top
      estilo.width = previo.width
      window.scrollTo(0, desplazado)
      // Si la entrada del historial sigue siendo la nuestra, el cierre vino del botón o de
      // `Escape` y hay que sacarla. Si vino del botón de atrás, ya no está y `back()` sacaría una
      // entrada ajena.
      if (history.state?.recorrido) history.back()
      anterior?.focus()
    }
  }, [abierta])

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
      className="capa-recorrido fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white"
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
 * Una escena del recorrido: la figura arriba, el texto abajo, los dos quietos mientras el scroll
 * avanza sobre una pista invisible.
 *
 * **La figura va arriba porque abajo la tapa el pulgar.** En el teléfono el dedo vive en la mitad
 * inferior de la pantalla, que es donde se empuja el scroll: lo que se quiere mirar no puede estar
 * ahí. Además, entrando a la escena la mirada cae primero en el dato y después en la frase que lo
 * explica, que es el orden que el recorrido quiere.
 *
 * **En el teléfono se ve una frase por paso.** Medido en la escena del termómetro: las cuatro
 * frases son 880 caracteres, que en 360 px son unos 460 px de los ~700 útiles. Con dos tercios de
 * pantalla ocupados por texto, la figura no compite, y el cambio de un punto pasa desapercibido.
 * Las frases que no son la activa **siguen en el documento**, con opacidad cero y fuera del flujo:
 * se copian, se buscan y las lee un lector de pantalla. En pantalla ancha no hace falta y el
 * párrafo va entero, encendiéndose por frase.
 *
 * Con `prefers-reduced-motion` el párrafo va entero también en el teléfono: quien pide menos
 * movimiento ve todo, no una versión recortada.
 */
export function Escena ({ titulo, bajada, frases, figura, cabecera, nota, raiz }: {
  titulo: string
  /** Qué se está mirando, en una línea. El título dice el hallazgo y esta dice la figura: sin
   *  ella hay que repetir la unidad en cada frase. */
  bajada?: React.ReactNode
  frases: React.ReactNode[]
  figura: (activo: number) => React.ReactNode
  /** Leyenda y año del paso, arriba de la figura y fuera del lienzo. */
  cabecera?: (activo: number) => React.ReactNode
  nota?: React.ReactNode
  raiz: HTMLElement | null
}) {
  const { activo, refs, reducido } = usePasoActivo(frases.length, raiz)
  const escena = useRef<HTMLDivElement | null>(null)
  const alto = useAltoDe(raiz)
  // El alto de la escena **no** es el de la pantalla: con la figura grande y el texto a 19 px mide
  // bastante más, y esa diferencia era exactamente lo que le sobraba al primer paso.
  const altoEscena = useAltoDe(escena.current, alto)

  /*
   * Los pasos tienen que costar todos lo mismo, y no salen parejos solos: la escena pegada ocupa
   * una pantalla de flujo antes de que empiece la pista, así que el primer cambio llegaba una
   * pantalla más tarde que los demás.
   *
   * **La corrección va en la pista, no en la escena.** Anular el alto de la escena (margen
   * inferior negativo) emparejaba los pasos pero rompía la separación entre escenas: sin altura
   * propia, la escena queda pegada hasta el último píxel de su sección y la escena siguiente
   * entra encima, superpuesta. Subir la pista consigue lo mismo y deja el alto de la escena
   * intacto, que es lo que separa una escena de la que viene.
   *
   * Con la pista subida `alto − colchón`, el paso i entra a la banda de lectura exactamente a
   * `i × alto de paso`. En píxeles medidos y no en porcentaje: un margen en porcentaje se
   * resuelve contra el **ancho**.
   */
  const altoPaso = alto ? Math.round(alto * 0.75) : undefined
  const colchon = alto ? Math.round(alto * 0.55) : undefined
  // La pista sube **el alto de la escena entero**, y nada más.
  //
  // Dos errores medidos con Playwright el 06-09-2026, los dos en esta línea: subir el alto de la
  // pantalla en vez del de la escena (la escena mide más: figura grande y texto de 19 px), y
  // restarle además el colchón, que ya está dentro de la pista y quedaba contado dos veces. Con
  // los dos, el primer paso empezaba en 858 px en vez de 429 y duraba el doble que los demás.
  //
  // Con la pista arriba de todo, el paso i entra a la banda de lectura en `colchón + i × paso`
  // menos el propio colchón: exactamente `i × alto de paso`.
  const subirPista = altoEscena ? -altoEscena : undefined
  // El colchón de salida solo tiene que alcanzar para que el último paso entre a la banda. Al 55 %
  // sumaba media pantalla de scroll muerto a cada escena, encima del alto de la escena que ya hay
  // que recorrer para que salga.
  const colchonFinal = alto ? Math.round(alto * 0.2) : undefined

  // Una frase por paso solo en el teléfono, y solo con movimiento normal. La regla vive acá y no
  // en el CSS porque depende del paso activo, que es estado de React.
  const frase = (i: number) => {
    if (reducido) return 'text-gray-700'
    if (i === activo) return 'text-gray-800'
    // Invisible en angosto (todas comparten celda de grilla, así que el bloque no cambia de alto)
    // y en gris claro en ancho, donde el párrafo se lee entero.
    return 'opacity-0 sm:opacity-100 sm:text-gray-300'
  }

  return (
    <section className="relative">
      {/* `top` y el alto viven en `.escena` (index.css), atados a la barra de la capa. El aire de
          arriba es padding real y no compensación de la barra, así que no se pierde al pegarse. */}
      <div ref={escena} className="escena sticky flex flex-col justify-start gap-6 px-4 pb-6 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <h3 className="font-display text-base font-semibold text-gray-900 sm:text-lg">{titulo}</h3>
          {/* Gris 500 y no más claro: es el último tono que mantiene 4,5:1 sobre blanco, que es el
              piso de lectura para texto chico. Más apagado se ve mejor y deja gente afuera. */}
          {bajada && <p className="mt-1 text-[13px] leading-snug text-gray-500">{bajada}</p>}
        </div>
        <div className="mx-auto w-full max-w-2xl pt-3 sm:pt-4">
          {cabecera?.(activo)}
          {figura(activo)}
          {nota && <div className="mt-2">{nota}</div>}
        </div>
        <div className="mx-auto w-full max-w-2xl pt-2 sm:pt-3">
          {/* Una frase por paso en el teléfono, con todas en la misma celda de grilla: el bloque
              mide lo que la frase más alta y no cambia de alto al avanzar (ver `.parrafo-escena`
              en `index.css`). En pantalla ancha vuelve a ser un párrafo corrido. */}
          <p className="parrafo-escena text-[19px] leading-[1.4] sm:text-lg sm:leading-relaxed">
            {frases.map((f, i) => (
              <span key={i} className={`transition-opacity duration-500 sm:transition-colors ${frase(i)}`}>
                {f}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* La pista: no se ve y no se lee, solo mide el scroll. Cada tramo tiene que ser más alto
          que la banda de lectura del observador, que es el 10 % central del contenedor. Los altos
          van en píxeles cuando se conoce el alto de la capa, y en `svh` en el primer cuadro (ver
          `index.css`). El colchón de arriba es lo que empareja los pasos, y el de abajo lo que
          permite que el último alcance a activarse. */}
      <div aria-hidden className="pointer-events-none" style={subirPista ? { marginTop: subirPista } : undefined}>
        <div className="colchon-recorrido" style={colchon ? { height: colchon } : undefined} />
        {frases.map((_, i) => (
          <div
            key={i}
            ref={(el) => { refs.current[i] = el }}
            data-paso={i}
            className="paso-recorrido"
            // El imán cae donde cambia la figura, no donde empieza el tramo: sin el margen de
            // scroll, la pausa queda medio paso corrida respecto de lo que se está mirando.
            style={{
              ...(altoPaso ? { height: altoPaso } : {}),
              ...(colchon ? { scrollMarginTop: colchon } : {}),
            }}
          />
        ))}
        <div className="colchon-recorrido" style={colchonFinal ? { height: colchonFinal } : undefined} />
      </div>
    </section>
  )
}

/**
 * El alto del contenedor con scroll, en píxeles, y **estable frente a la barra del navegador**.
 *
 * En el teléfono la barra del navegador aparece y desaparece con el scroll, y con ella cambia el
 * alto del contenedor entre un 8 % y un 15 %. Si la geometría del recorrido siguiera cada uno de
 * esos cambios, el alto de los pasos se recalcularía en pleno gesto y el contenido saltaría bajo
 * el dedo: el lector lo ve como que «se movió solo».
 *
 * Así que el alto se fija al abrir y solo se rehace cuando **cambia el ancho**, que es lo que
 * distingue una rotación o un cambio de ventana de la barra yendo y viniendo. La escena no lo
 * necesita: su alto es `100%` del contenedor y se adapta sola (ver `.escena` en `index.css`).
 */
function useAltoDe (el: HTMLElement | null, cuando?: number) {
  const [alto, setAlto] = useState(0)
  const ancho = useRef(0)
  useEffect(() => {
    if (!el) return
    const medir = (forzar: boolean) => {
      if (!forzar && el.clientWidth === ancho.current) return
      ancho.current = el.clientWidth
      setAlto(el.clientHeight)
    }
    medir(true)
    if (typeof ResizeObserver === 'undefined') {
      const alCambiar = () => { medir(false) }
      window.addEventListener('resize', alCambiar)
      return () => { window.removeEventListener('resize', alCambiar) }
    }
    const observador = new ResizeObserver(() => { medir(false) })
    observador.observe(el)
    return () => { observador.disconnect() }
    // `cuando` fuerza una remedición: la escena se mide recién cuando ya se conoce el alto de la
    // capa, porque su propio alto depende de él.
  }, [el, cuando])
  return alto
}
