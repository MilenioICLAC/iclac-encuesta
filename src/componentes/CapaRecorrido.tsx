import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
 * **La capa es una ruta, no un estado suelto.** Vive en `#/recorrido`, y de ahí salen tres cosas
 * gratis: el gesto de atrás del teléfono la cierra (es el gesto de cerrar en Android), se puede
 * enlazar, y quien entra al sitio por la raíz cae adentro sin que nadie tenga que apretar nada.
 * Antes la capa se metía sola al historial con `pushState`; con la ruta encima eso duplicaba
 * entradas y el botón de atrás pedía dos toques.
 *
 * **Se sale al tablero.** Salir del recorrido es ir a consultar, así que el botón no dice
 * «cerrar»: dice a dónde lleva.
 */

/**
 * Dónde va el lector: qué escena y qué paso dentro de ella.
 *
 * Cada escena informa su estado y la capa lo pinta arriba. Va por contexto y no por props porque
 * las escenas son hijas del `children` que arma la página: la capa no las conoce.
 */
interface EstadoEscena {
  indice: number
  /**
   * El titular de la escena. **Puede depender del paso**: una escena que cambia de tema a mitad de
   * camino (la 1 pasa del termómetro a la ideología) necesita que el encabezado la siga, o el
   * lector lee un hallazgo sobre una figura que ya no está.
   */
  titulo: string | ((activo: number) => string)
  pasos: number
  activo: number
  enVista: boolean
}

const Registro = createContext<((estado: EstadoEscena) => void) | null>(null)

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
  const barra = useRef<HTMLDivElement | null>(null)
  const [avance, setAvance] = useState(0)
  const [escenas, setEscenas] = useState<Record<number, EstadoEscena>>({})

  // Cada escena informa; la capa se queda con lo último de cada una. Se compara antes de escribir
  // porque el observador de pasos reporta también cuando nada cambió, y un `setState` por reporte
  // vuelve a renderizar la capa entera en pleno scroll.
  const informar = useCallback((estado: EstadoEscena) => {
    setEscenas((previo) => {
      const antes = previo[estado.indice]
      if (antes && antes.activo === estado.activo && antes.enVista === estado.enVista && antes.pasos === estado.pasos) {
        return previo
      }
      return { ...previo, [estado.indice]: estado }
    })
  }, [])

  const lista = useMemo(
    () => Object.values(escenas).sort((a, b) => a.indice - b.indice),
    [escenas],
  )
  // La escena en vista, y si ninguna lo está todavía (primer cuadro), la primera.
  const actual = lista.find((e) => e.enVista) ?? lista[0]
  // La portada se registra con el índice 0 y no cuenta como escena: es la tapa del recorrido, no
  // uno de sus hallazgos. Si se contara, el lector leería «escena 1 de 5» sin haber visto ningún
  // dato todavía.
  const numeradas = lista.filter((e) => e.indice > 0).length

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
      estilo.overflow = previo.overflow
      estilo.position = previo.position
      estilo.top = previo.top
      estilo.width = previo.width
      window.scrollTo(0, desplazado)
      anterior?.focus()
    }
  }, [abierta])

  // El alto real de la barra, publicado para que la escena se pegue justo debajo. Escrito a mano
  // en el CSS decía 2,5 rem y la barra mide 43 px: la escena quedaba 3 px más alta que el hueco
  // que le toca, y su última línea caía bajo el borde de la capa.
  useEffect(() => {
    const nodo = barra.current
    const contenedor = capa.current
    if (!nodo || !contenedor) return
    const publicar = () => {
      contenedor.style.setProperty('--barra-capa', `${Math.round(nodo.getBoundingClientRect().height)}px`)
    }
    publicar()
    const observador = new ResizeObserver(publicar)
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [abierta, raiz])

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
      <div ref={barra} className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur sm:px-6">
        {/* Dónde va el lector, en dos niveles: qué escena de cuántas, y qué paso dentro de ella.
            La barra de avance sola dice cuánto falta pero no dice de qué; los puntos dicen que la
            escena tiene tres momentos y que este es el segundo. */}
        {actual
          ? (
            <span className="shrink-0 font-display text-xs font-semibold tabular-nums text-gray-900">
              {actual.indice === 0 ? 'Portada' : `Escena ${actual.indice} de ${numeradas}`}
            </span>
            )
          : <span className="truncate font-display text-sm font-semibold text-gray-900">{titulo}</span>}

        {actual && actual.indice > 0 && actual.pasos > 1 && (
          <ol aria-hidden className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {Array.from({ length: actual.pasos }, (_, i) => (
              <li
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i <= actual.activo ? 'bg-brand-dark' : 'bg-gray-300'}`}
              />
            ))}
          </ol>
        )}

        <div className="h-1 grow rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-brand-dark transition-[width] duration-200"
            style={{ width: `${Math.round(avance * 100)}%` }}
          />
        </div>

        {/* Lo mismo, en texto, para quien no ve la barra ni los puntos. `polite` y no `assertive`:
            avisa cuando el lector termina lo que estaba leyendo, no encima del scroll. */}
        <p aria-live="polite" className="sr-only">
          {actual
            ? (actual.indice === 0
                ? `Portada. ${actual.titulo}. El recorrido tiene ${numeradas} escenas.`
                : `Escena ${actual.indice} de ${numeradas}: ${actual.titulo}. Paso ${actual.activo + 1} de ${actual.pasos}.`)
            : titulo}
        </p>

        {/* El botón dice a dónde lleva. «Cerrar» no dice nada sobre qué pasa después, y salir de
            un relato para caer en la nada es peor que no poder salir. */}
        <button
          ref={cerrar}
          type="button"
          onClick={alCerrar}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          <span className="hidden sm:inline">Salir al tablero</span>
          <span className="sm:hidden">Salir</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <Registro.Provider value={informar}>{children(raiz)}</Registro.Provider>

      <div className="cierre-recorrido flex flex-col items-center gap-3 px-4 py-16">
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
 * La portada, **dentro** del recorrido y no antes de él.
 *
 * Entrar al sitio y aparecer en mitad de la primera escena no dice qué es esto ni cuánto dura.
 * La portada era una página aparte y el lector nunca la veía, porque la capa se abría encima:
 * como primera pantalla de la propia capa, es lo primero que se lee y se pasa con el mismo gesto
 * que el resto del recorrido.
 *
 * No es una escena: no tiene pasos, no cuenta un hallazgo y no se numera. Ocupa una pantalla
 * exacta —el mismo alto que una escena— y su sección es un punto del imán, así que el primer
 * gesto la deja atrás entera.
 */
export function Portada ({ raiz, titulo, children }: {
  raiz: HTMLElement | null
  /** Para el anuncio del lector de pantalla, que no ve la tapa. */
  titulo: string
  children: React.ReactNode
}) {
  const seccion = useRef<HTMLElement | null>(null)
  const alto = useAltoDe(raiz)
  const informar = useContext(Registro)
  const [enVista, setEnVista] = useState(true)

  useEffect(() => {
    const nodo = seccion.current
    if (!nodo || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(
      ([e]) => { setEnVista(e.isIntersecting) },
      { root: raiz ?? null, rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [raiz])

  useEffect(() => {
    informar?.({ indice: 0, titulo, pasos: 1, activo: 0, enVista })
  }, [informar, titulo, enVista])

  return (
    <section ref={seccion} className="portada-recorrido relative">
      <div
        className="escena sticky flex flex-col justify-center gap-6 px-4 py-6 sm:px-6"
        style={alto ? ({ '--alto-capa': `${alto}px` } as React.CSSProperties) : undefined}
      >
        {children}
      </div>
    </section>
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
export function Escena ({ indice, titulo, bajada, frases, figura, cabecera, nota, raiz, modulo, dosColumnas = false }: {
  /** Qué número de escena es, para la barra de la capa. Va explícito y no contado solo: las
   *  escenas se escriben a mano en la página, y un contador implícito se desordena en silencio
   *  al mover una. */
  indice: number
  /**
   * El titular de la escena. **Puede depender del paso**: una escena que cambia de tema a mitad de
   * camino (la 1 pasa del termómetro a la ideología) necesita que el encabezado la siga, o el
   * lector lee un hallazgo sobre una figura que ya no está.
   */
  titulo: string | ((activo: number) => string)
  /** Qué se está mirando, en una línea. El título dice el hallazgo y esta dice la figura: sin
   *  ella hay que repetir la unidad en cada frase. */
  bajada?: React.ReactNode
  frases: React.ReactNode[]
  /**
   * La figura del paso. `reducido` avisa que se está mostrando el relato entero de una vez
   * (`prefers-reduced-motion`), y una escena que **cambia de figura** entre pasos tiene que
   * mostrarlas todas ahí: si no, la mitad del texto habla de algo que no está dibujado.
   */
  figura: (activo: number, reducido: boolean) => React.ReactNode
  /** Leyenda y año del paso, arriba de la figura y fuera del lienzo. */
  cabecera?: (activo: number) => React.ReactNode
  /** El pie de la figura. **Puede depender del paso**: cuando una escena cambia lo que muestra la
   *  figura (la 1 pasa de países a tramos ideológicos), el pie tiene que cambiar con ella o queda
   *  describiendo una figura que ya no está. */
  nota?: React.ReactNode | ((activo: number, reducido: boolean) => React.ReactNode)
  raiz: HTMLElement | null
  /**
   * El módulo del tablero que responde esta misma pregunta, si lo hay. Con él, la escena termina
   * ofreciendo el camino del tramo que afirma al que deja consultar (un registro de decisiones interno), con el módulo ya
   * enfocado. Sin él, la escena no ofrece nada: mandar al tablero entero no es una respuesta.
   */
  modulo?: string
  /**
   * En escritorio, el relato a la izquierda y la figura a la derecha (ver `.escena.en-columnas` en
   * `index.css`). **Es por escena y no global**: sirve cuando la figura es una sola, como el
   * termómetro, y no cuando son varios paneles al lado. Las escenas 2 y 3 tienen tres series en
   * paralelo, y en media pantalla cada panel queda en 192 px, con los números a 6 px.
   */
  dosColumnas?: boolean
}) {
  const { activo, refs, reducido } = usePasoActivo(frases.length, raiz)
  const escena = useRef<HTMLDivElement | null>(null)
  const seccion = useRef<HTMLElement | null>(null)
  const informar = useContext(Registro)

  // **Cuál escena está en vista se mide con la misma banda que los pasos.** Con la escena pegada,
  // su sección ocupa toda su tajada de scroll: la que cruza el centro del contenedor es la que el
  // lector tiene delante, y las de arriba y abajo no compiten.
  const [enVista, setEnVista] = useState(indice === 1)
  useEffect(() => {
    const nodo = seccion.current
    if (!nodo || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(
      ([e]) => { setEnVista(e.isIntersecting) },
      { root: raiz ?? null, rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [raiz])

  useEffect(() => {
    informar?.({ indice, titulo: typeof titulo === 'function' ? titulo(activo) : titulo, pasos: frases.length, activo, enVista })
  }, [informar, indice, titulo, frases.length, activo, enVista])
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

  // Una frase por paso, en todos los anchos. La regla vive acá y no en el CSS porque depende del
  // paso activo, que es estado de React.
  //
  // **En escritorio también.** Antes el párrafo se leía entero en pantalla ancha, con las futuras
  // en gris claro. Con el texto de escritorio a 34 px eso son cuatro frases que no entran, y
  // además rompe la premisa del recorrido: un paso muestra lo que ese paso cuenta.
  const frase = (i: number) => {
    if (reducido) return 'text-gray-700'
    if (i === activo) return 'text-gray-800'
    // Todas comparten celda de grilla, así que el bloque no cambia de alto al avanzar.
    return 'opacity-0'
  }

  return (
    <section ref={seccion} className="relative">
      {/* `top` y el alto viven en `.escena` (index.css), atados a la barra de la capa. El aire de
          arriba es padding real y no compensación de la barra, así que no se pierde al pegarse. */}
      {/* El orden es titular, frase, figura, y el bloque va centrado en la escena. Salió del
          laboratorio del recorrido el 07-09-2026 (preset «La elegida»): con la figura arriba, la
          frase quedaba al pie de la pantalla, que es donde el pulgar la tapa. */}
      <div
        ref={escena}
        className={`escena${dosColumnas ? ' en-columnas' : ''} sticky flex flex-col justify-center gap-6 px-4 pb-6 pt-6 sm:px-6`}
        // El alto de la capa, en píxeles medidos. `.escena` lo usa para su `min-height`, que es lo
        // que le da a `justify-center` espacio que repartir (ver `index.css`).
        style={alto ? ({ '--alto-capa': `${alto}px` } as React.CSSProperties) : undefined}
      >
        {/* El titular y la frase son la misma voz, así que viajan juntos: en escritorio son una
            columna y la figura es la otra. En angosto el envoltorio es `display: contents` y no
            cambia nada (ver `.columna-relato` en `index.css`). */}
        <div className="columna-relato">
          <div className="bloque-encabezado mx-auto w-full max-w-2xl">
            <h3 className="font-display text-base font-semibold text-gray-900 sm:text-lg">
              {typeof titulo === 'function' ? titulo(activo) : titulo}
            </h3>
            {/* Gris 500 y no más claro: es el último tono que mantiene 4,5:1 sobre blanco, que es
                el piso de lectura para texto chico. Más apagado se ve mejor y deja gente afuera. */}
            {bajada && <p className="bajada-escena mt-1 text-[13px] leading-snug text-gray-500">{bajada}</p>}
          </div>
          <div className="bloque-texto mx-auto w-full max-w-2xl pt-2 sm:pt-3">
            {/* Todas las frases en la misma celda de grilla: el bloque mide lo que la frase más
                alta y no cambia de alto al avanzar (ver `.parrafo-escena` en `index.css`). Sin
                eso, la figura sube y baja a cada paso.
                Con `prefers-reduced-motion` se leen todas a la vez, y ahí la grilla las
                superpondría: en ese caso el párrafo vuelve a ser un párrafo. */}
            <p className={`${reducido ? '' : 'parrafo-escena'} text-[19px] leading-[1.4] sm:text-lg sm:leading-relaxed`}>
              {frases.map((f, i) => (
                <span key={i} className={`transition-opacity duration-500 ${frase(i)}`}>
                  {f}{' '}
                </span>
              ))}
            </p>
          </div>
        </div>
        <div className="bloque-figura mx-auto w-full max-w-2xl pt-3 sm:pt-4">
          {cabecera?.(activo)}
          {figura(activo, reducido)}
          {nota && <div className="mt-2">{typeof nota === 'function' ? nota(activo, reducido) : nota}</div>}
          {modulo && (
            <Link
              to={`/tablero?foco=${modulo}`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-dark underline underline-offset-2 hover:text-gray-900"
            >
              Ver esta pregunta en el tablero
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>

      {/* La pista: no se ve y no se lee, solo mide el scroll. Cada tramo tiene que ser más alto
          que la banda de lectura del observador, que es el 10 % central del contenedor. Los altos
          van en píxeles cuando se conoce el alto de la capa, y en `svh` en el primer cuadro (ver
          `index.css`). El colchón de arriba es lo que empareja los pasos, y el de abajo lo que
          permite que el último alcance a activarse. */}
      <div aria-hidden className="pointer-events-none" style={subirPista ? { marginTop: subirPista } : undefined}>
        <div
          className="colchon-recorrido"
          style={{ ...(colchon ? { height: colchon } : {}), ...(colchon ? { scrollMarginTop: colchon } : {}) }}
        />
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
        <div
          className="colchon-recorrido"
          style={{ ...(colchonFinal ? { height: colchonFinal } : {}), ...(colchon ? { scrollMarginTop: colchon } : {}) }}
        />
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
