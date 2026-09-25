import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConsulta, usePasoActivo } from '../nucleo/pasos'
import { BarraDeAvance } from './BarraDeAvance'
import { NumeroHistoria, Siguiente } from './siguiente'

/**
 * El recorrido vive en una capa propia, no en el scroll de la página.
 *
 * **Por qué separado.** Una historia y el explorador se leen distinto: la historia tiene un orden
 * y afirma cosas, el explorador es para consultar y no afirma nada (un registro de decisiones interno). Mezclados en un
 * scroll, el lector no sabe cuándo dejó de leer un relato y empezó a usar una herramienta, y el
 * scroll de la historia le secuestra la rueda a quien solo quería consultar.
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
 * **El botón de salida dice a dónde lleva**, no «cerrar»: las historias salen al menú.
 */

/**
 * Qué está leyendo el lector, para anunciarlo a quien no ve la pantalla.
 *
 * Cada pieza informa su estado y la capa lo anuncia. Va por contexto y no por props porque las
 * escenas son hijas del `children` que arma la página: la capa no las conoce.
 *
 * **La barra no nombra piezas.** «Escena», «pausa», «paso», «portada» y «cierre» son vocabulario
 * nuestro (Felipe, 22-09-2026): al lector le sirve saber cuánto le falta, no cómo llamamos a cada
 * tramo. Eso lo dicen las marcas de la barra de avance.
 */
interface EstadoEscena {
  indice: number
  /**
   * El titular de la escena, ya resuelto para el paso: una escena que cambia de tema a mitad de
   * camino (la 1 pasa del termómetro a la ideología) necesita que el anuncio la siga.
   */
  titulo: string
  enVista: boolean
}

/**
 * La parada de cada elemento del selector, en píxeles de scroll del contenedor: el scroll en que
 * un paso entra a la banda de lectura, o en que una sección llena la pantalla.
 *
 * **Se mide contra el contenedor, no con `offsetTop`.** `offsetTop` cuenta desde el ancestro
 * posicionado, y cada escena es una `<section class="relative">`: los pasos de la escena 3
 * devolvían números chicos, la lista salía revuelta y el teclado se quedaba clavado en la primera
 * parada (medido el 08-09-2026: el scroll no pasaba de 351 px por más flechas que se apretaran).
 *
 * **Y la parada es el borde menos su `scroll-margin-top`** (el colchón, 0,55 de la pantalla): con
 * el borde de un paso ahí, el paso toca la banda de lectura, que termina en el 55 %. Medido sin
 * imán el 22-09-2026: cada frase cambia a menos de 8 px de su marca.
 *
 * La usan el teclado y las marcas de la barra: si midieran distinto, la marca diría que el paso
 * está en un lugar y la flecha llevaría a otro.
 */
function paradas (contenedor: HTMLElement, selector: string) {
  const arriba = contenedor.getBoundingClientRect().top - contenedor.scrollTop
  const tope = contenedor.scrollHeight - contenedor.clientHeight
  return [...new Set([...contenedor.querySelectorAll<HTMLElement>(selector)].map((el) => {
    const margen = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    return Math.min(tope, Math.max(0, Math.round(el.getBoundingClientRect().top - arriba - margen)))
  }))].sort((a, b) => a - b)
}

/**
 * Adónde llevan «anterior» y «siguiente», con el teclado o con las flechas de la pantalla: **solo a
 * los lugares donde algo cambia** (la portada, cada paso, cada pausa y el final), no a los colchones
 * de entrada y salida de cada escena, donde no cambia nada.
 *
 * Existe por quien no tiene rueda (Fran, 25-09-2026): un clic en la barra de scroll baja 87,5 % de
 * la pantalla y se saltaba frases, y arrastrarla mueve de 10 a 23 px por píxel. Las flechas le dan
 * «el siguiente» en vez de una cantidad de píxeles.
 *
 * **Con el texto que corre (escritorio), la parada de un paso no es el destino.** En la parada la
 * figura cambia, pero la frase recién está entrando por abajo (su centro al 80 % de la pantalla).
 * El destino es, dentro del mismo paso, donde la frase queda centrada en la figura, sin entrar al
 * degradado bajo el titular y sin llegar al paso siguiente. Medido en el laboratorio del scroll: 48
 * de 48 llegadas centradas (a 25 px como máximo en 1366×768), enteras y con la figura en su paso.
 */
function paradasDeCambio (capa: HTMLElement) {
  const tope = capa.scrollHeight - capa.clientHeight
  const arriba = capa.getBoundingClientRect().top - capa.scrollTop
  const lista = paradas(capa, '.portada-recorrido, .respiro-recorrido, .paso-recorrido')
  if (lista[lista.length - 1] !== tope) lista.push(tope)
  for (const paso of capa.querySelectorAll<HTMLElement>('.paso-recorrido')) {
    const tarjeta = paso.querySelector<HTMLElement>('.tarjeta-frase')
    const escena = paso.closest('.escena-recorrido')?.querySelector<HTMLElement>(':scope > .escena')
    const figura = escena?.querySelector<HTMLElement>(':scope > .bloque-figura')
    const encabezado = escena?.querySelector<HTMLElement>('.bloque-encabezado')
    if (!tarjeta || !escena || !figura || !encabezado) continue
    const activacion = Math.round(paso.getBoundingClientRect().top - arriba - (parseFloat(getComputedStyle(paso).scrollMarginTop) || 0))
    // Todo en coordenadas de la escena pegada: su `top` de sticky más la distancia dentro de ella.
    const pegada = parseFloat(getComputedStyle(escena).top) || 0
    const re = escena.getBoundingClientRect()
    const rf = figura.getBoundingClientRect()
    const rt = tarjeta.getBoundingClientRect()
    const degradado = parseFloat(getComputedStyle(encabezado, '::after').height) || 0
    const centroFigura = pegada + rf.top - re.top + rf.height / 2
    const piso = pegada + encabezado.getBoundingClientRect().bottom - re.top + degradado
    const arribaTarjeta = rt.top - arriba
    const destino = Math.max(activacion, Math.min(
      arribaTarjeta + rt.height / 2 - centroFigura,
      arribaTarjeta - piso,
      activacion + paso.offsetHeight - 0.1 * capa.clientHeight,
    ))
    const k = lista.findIndex((y) => Math.abs(y - activacion) <= 3)
    if (k >= 0) lista[k] = Math.min(tope, Math.round(destino))
  }
  // La pausa cuya frase corre (escritorio, `index.css`): en su parada la frase recién entra, al
  // 80 %. El destino es donde queda al centro de la capa, sin pasar el final de lo quieto (el alto
  // de la pausa menos una pantalla), donde llega la escena siguiente.
  for (const pausa of capa.querySelectorAll<HTMLElement>('.respiro-recorrido')) {
    const escena = pausa.querySelector<HTMLElement>(':scope > .escena')
    if (!escena || getComputedStyle(escena).position !== 'absolute') continue
    const parada = Math.round(pausa.getBoundingClientRect().top - arriba - (parseFloat(getComputedStyle(pausa).scrollMarginTop) || 0))
    // El envoltorio mide cero de alto y la frase va centrada en él: su borde es el centro de la frase.
    const centro = escena.getBoundingClientRect().top - arriba
    const quieta = pausa.offsetHeight - capa.clientHeight
    const destino = Math.max(parada, Math.min(centro - capa.clientHeight / 2, parada + quieta - 0.1 * capa.clientHeight))
    const k = lista.findIndex((y) => Math.abs(y - parada) <= 3)
    if (k >= 0) lista[k] = Math.min(tope, Math.round(destino))
  }
  return lista.sort((a, b) => a - b)
}

/**
 * La parada siguiente o anterior a `desde`. Una parada a menos de 0,1 de pantalla no cuenta como
 * cambio: la portada para en el alto de la barra y la capa abre en 0; los cambios reales están a
 * 0,4 de pantalla o más.
 */
function paradaVecina (capa: HTMLElement, desde: number, sentido: number) {
  const lista = paradasDeCambio(capa)
  const cerca = 0.1 * capa.clientHeight
  return sentido > 0
    ? lista.find((y) => y > desde + cerca)
    : [...lista].reverse().find((y) => y < desde - cerca)
}

const Registro = createContext<((estado: EstadoEscena) => void) | null>(null)

/** La sección de método de la historia, para que el cierre la ofrezca sin que cada historia la repita. */
const Metodo = createContext('metodo-recorrido')

/**
 * Si un elemento puede recibir el foco de verdad, no solo hacer juego con el selector.
 *
 * `checkVisibility()` es lo correcto donde exista; el respaldo es contar cajas, que da cero con
 * `display: none` y sigue dando cajas para lo que está fuera de la pantalla pero renderizado
 * (que **sí** es enfocable, y tiene que seguir estando en la trampa).
 */
function visible (el: HTMLElement) {
  // `visibilityProperty`: la salida del cierre se esconde con `visibility: hidden` hasta su paso, y
  // sin la opción `checkVisibility()` la da por visible. Sería otra vez el defecto de «Método»: un
  // último foco que nunca puede estar activo y un `Tab` que se escapa de la capa.
  if (typeof el.checkVisibility === 'function') return el.checkVisibility({ visibilityProperty: true })
  return el.getClientRects().length > 0
}

interface Props {
  abierta: boolean
  alCerrar: () => void
  titulo: string
  /**
   * La sección de «Sobre los datos» que explica esta historia. Cada historia publica su propio
   * método: el enlace de la barra lleva al de la que se está leyendo, no al de otra.
   */
  metodo?: string
  /** Qué dice el botón de salida, que dice a dónde lleva. Las historias salen al menú. */
  salida?: string
  /** Recibe el contenedor con scroll: el observador de los pasos mide contra él y no contra la
   *  pantalla. Con la pantalla como raíz, dentro de una capa, ningún paso se activa nunca. */
  children: (raiz: HTMLElement | null) => React.ReactNode
}

export default function CapaRecorrido ({ abierta, alCerrar, titulo, metodo = 'metodo-recorrido', salida = 'Volver a las historias', children }: Props) {
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
  // Si se está en la portada o al final: ahí la flecha correspondiente no lleva a ningún lado.
  const [extremo, setExtremo] = useState<{ inicio: boolean, fin: boolean }>({ inicio: true, fin: false })

  /*
   * Ir a la parada siguiente o anterior (ver `paradasDeCambio`). La comparten el teclado y las
   * flechas de la pantalla, así que llevan exactamente al mismo lugar.
   *
   * **Se cuenta desde el último destino pedido** mientras el scroll suave no llega: sin eso, dos
   * clics o dos teclas seguidas medían desde un scroll a mitad de camino y avanzaban uno solo.
   *
   * **Pero solo mientras ese scroll suave dura.** Si el lector mueve la rueda o el dedo, o pasa más
   * de lo que tarda un scroll suave, el destino se olvida y se cuenta desde donde está: con el
   * destino viejo, un clic después de la rueda devolvía 589 px hacia atrás, y desde el final
   * «Siguiente» quedaba habilitado sin hacer nada (Codex, 25-09-2026).
   */
  const destino = useRef<{ y: number, t: number } | null>(null)
  const irA = useCallback((sentido: number) => {
    const el = capa.current
    if (!el) return false
    const d = destino.current
    const pendiente = d !== null && performance.now() - d.t < 1200 && Math.abs(el.scrollTop - d.y) > 4
    const y = paradaVecina(el, pendiente ? d.y : el.scrollTop, sentido)
    if (y === undefined) return false
    destino.current = { y, t: performance.now() }
    el.scrollTo({ top: y, behavior: 'smooth' })
    return true
  }, [])
  useEffect(() => {
    const el = raiz
    if (!el) return
    const olvidar = () => { destino.current = null }
    el.addEventListener('wheel', olvidar, { passive: true })
    el.addEventListener('touchstart', olvidar, { passive: true })
    return () => {
      el.removeEventListener('wheel', olvidar)
      el.removeEventListener('touchstart', olvidar)
    }
  }, [raiz])

  // Cada escena informa; la capa se queda con lo último de cada una. Se compara antes de escribir
  // porque el observador de pasos reporta también cuando nada cambió, y un `setState` por reporte
  // vuelve a renderizar la capa entera en pleno scroll.
  const informar = useCallback((estado: EstadoEscena) => {
    setEscenas((previo) => {
      const antes = previo[estado.indice]
      if (antes && antes.titulo === estado.titulo && antes.enVista === estado.enVista) {
        return previo
      }
      return { ...previo, [estado.indice]: estado }
    })
  }, [])

  const lista = useMemo(
    () => Object.values(escenas).sort((a, b) => a.indice - b.indice),
    [escenas],
  )
  // La pieza en vista, y si ninguna lo está todavía (primer cuadro), la portada.
  const actual = lista.find((e) => e.enVista) ?? escenas[0] ?? lista[0]

  /*
   * Las marcas de la barra: una línea en cada lugar donde cambia algo (un paso o un respiro), en
   * fracción del recorrido. Así la barra dice cuánto scroll falta para lo próximo, sin nombrarlo.
   * Se miden con la misma función que el teclado, y se rehacen cuando
   * cambia el alto de algo: la geometría de la pista se fija después del primer cuadro.
   */
  const [marcas, setMarcas] = useState<number[]>([])
  useEffect(() => {
    const contenedor = raiz
    if (!abierta || !contenedor) return
    const medir = () => {
      const tope = contenedor.scrollHeight - contenedor.clientHeight
      if (tope <= 0) { setMarcas([]); return }
      const nuevas = paradas(contenedor, '.respiro-recorrido, .paso-recorrido')
        .map((y) => y / tope)
        // Ni el inicio ni el final llevan marca: ahí la barra ya tiene su borde.
        .filter((f) => f > 0.002 && f < 0.998)
      setMarcas((previas) =>
        previas.length === nuevas.length && previas.every((f, i) => Math.abs(f - nuevas[i]) < 0.0005) ? previas : nuevas)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(contenedor)
    for (const hijo of contenedor.children) observador.observe(hijo)
    return () => { observador.disconnect() }
  }, [abierta, raiz, lista.length])

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

      /*
       * **El teclado avanza de a un paso, no de a una pantalla.**
       *
       * `PageDown` mueve el alto del contenedor, que no coincide con el alto de un paso, y el
       * desfase acumulado se comía uno entero (medido el 08-09-2026: del cuarto saltaba al sexto).
       *
       * **Esto no es scroll-jacking:** no se toca la rueda ni el gesto táctil, que siguen libres.
       * Es lo contrario, de hecho: quien navega con teclado pide «el siguiente» y recibe el
       * siguiente, en vez de una cantidad de píxeles que a veces se salta el contenido.
       *
       * Desde el 25-09-2026 va a los mismos lugares que las flechas de la pantalla (`irA`): solo
       * donde algo cambia, sin parar en los colchones, y con el texto que corre, a donde la frase
       * se lee.
       */
      const teclas: Record<string, number> = { PageDown: 1, PageUp: -1, ArrowDown: 1, ArrowUp: -1 }
      const sentido = teclas[e.key]
      if (sentido && capa.current) {
        const activo = document.activeElement
        // Un campo o un control se queda con sus flechas: ahí significan otra cosa.
        const enControl = activo instanceof HTMLElement &&
          ['INPUT', 'SELECT', 'TEXTAREA'].includes(activo.tagName)
        if (!enControl) {
          // Lo mismo que las flechas de la pantalla: ver `paradasDeCambio`. La tecla se consume
          // aunque no quede parada en ese sentido: si no, en la portada el navegador la aplicaba
          // con su propio scroll de 40 px, dos veces sin cambiar nada.
          e.preventDefault()
          irA(sentido)
          return
        }
      }

      if (e.key !== 'Tab' || !capa.current) return
      // Trampa de foco: sin esto el tabulador se va a la página de atrás, que está tapada.
      //
      // **Y hay que filtrar por visibilidad, no solo por selector.** `querySelectorAll` hace
      // juego con lo que está `display: none`, que no puede recibir el foco: el enlace «Método»
      // de la barra se oculta bajo 640 px (`hidden … sm:inline`) y era el primero de la lista.
      // Como `document.activeElement` nunca podía ser ese nodo, la guarda de `Shift+Tab` no se
      // disparaba jamás y en teléfono el foco se escapaba de la capa al encabezado del sitio
      // (medido el 08-09-2026). Hacia adelante sí cerraba, porque el último foco está siempre
      // visible: por eso el defecto era asimétrico y costó verlo.
      // **Y por `tabIndex`**: un botón con `tabindex="-1"` hace juego con `button:not([disabled])`
      // pero el tabulador nunca lo alcanza. Un botón así del cierre quedaba de último, la guarda no
      // se disparaba y el foco se iba a la página de atrás (medido el 25-09-2026: 16 de 60 teclas).
      const focos = [...capa.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
      )].filter((el) => el.tabIndex >= 0 && visible(el))
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
  }, [abierta, irA])

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
    // Mismo umbral que `paradaVecina`: más cerca que eso del borde, no queda cambio en ese sentido.
    // La portada para en el alto de la barra, así que el inicio suma ese margen.
    const cerca = 0.1 * el.clientHeight
    const inicio = el.scrollTop <= cerca + (barra.current?.offsetHeight ?? 0)
    const fin = el.scrollTop >= recorrible - cerca
    setExtremo((previo) => (previo.inicio === inicio && previo.fin === fin ? previo : { inicio, fin }))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      ref={(el) => { capa.current = el; setRaiz(el) }}
      onScroll={alDesplazar}
      className="capa-recorrido fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-white"
      // Para la geometría de las pausas en `index.css`: un número, un lugar.
      style={{ '--subida-tras-pausa': SUBIDA_TRAS_PAUSA, '--lectura-texto-corre': LECTURA_TEXTO_CORRE } as React.CSSProperties}
    >
      <div ref={barra} className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur sm:px-6">
        {/* Cuánto falta, y cuánto hasta lo próximo: la tinta avanza con el scroll y cada línea es
            un lugar donde algo cambia. Sin rótulo: cómo se llama cada tramo es vocabulario nuestro.
            Las líneas son cortes blancos, así cortan igual la tinta y lo que falta. */}
        <BarraDeAvance avance={avance} marcas={marcas} />

        {/* El titular de lo que está en pantalla, para quien no ve la barra. `polite` y no
            `assertive`: avisa cuando el lector termina lo que estaba leyendo, no encima del scroll. */}
        <p aria-live="polite" className="sr-only">
          {actual ? actual.titulo : titulo}
        </p>

        {/* El método, a mano desde cualquier paso: el lector que duda de una cifra la está viendo
            en ese momento, no al final. En teléfono no cabe junto a la salida y se queda solo el
            enlace del cierre. */}
        <Link
          to={`/datos?foco=${metodo}`}
          className="hidden shrink-0 text-xs text-gray-500 underline underline-offset-2 hover:text-brand-dark sm:inline"
        >
          Método
        </Link>

        {/* El botón dice a dónde lleva. «Cerrar» no dice nada sobre qué pasa después, y salir de
            un relato para caer en la nada es peor que no poder salir. */}
        <button
          ref={cerrar}
          type="button"
          onClick={alCerrar}
          className="presionable flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          <span className="hidden sm:inline">{salida}</span>
          <span className="sm:hidden">Salir</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Anterior y siguiente con el mouse, para quien no tiene rueda: lo mismo que el teclado.
          Solo con puntero fino (ver `.flechas-recorrido` en `index.css`): con el dedo el gesto
          alcanza, y en el teléfono le quitarían sitio a la figura. */}
      <div className="flechas-recorrido">
        {([['Anterior', -1, 'M6 15l6-6 6 6', extremo.inicio], ['Siguiente', 1, 'M6 9l6 6 6-6', extremo.fin]] as const).map(([nombre, sentido, trazo, apagada]) => (
          <button
            key={nombre}
            type="button"
            aria-label={nombre}
            disabled={apagada}
            onClick={() => { irA(sentido) }}
            className="presionable grid h-11 w-11 place-items-center rounded-full border border-gray-300 bg-white text-brand-dark shadow-sm hover:border-brand-dark disabled:text-gray-300 disabled:hover:border-gray-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden className="h-[18px] w-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" d={trazo} />
            </svg>
          </button>
        ))}
      </div>

      {/* El final lo pone la página con `Cierre`, que conoce los titulares de las escenas. */}
      <Registro.Provider value={informar}>
        <Metodo.Provider value={metodo}>{children(raiz)}</Metodo.Provider>
      </Registro.Provider>
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
 * exacta, el mismo alto que una escena.
 *
 * **Lo de arriba lo pone la página; la invitación a avanzar la pone la portada**, porque es la que
 * sabe cuánto mide. La invitación es un botón y hace lo mismo que el gesto: con rueda o teclado el
 * scroll no es tan obvio como en el teléfono. Salió del laboratorio de la portada (15-09-2026).
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
    informar?.({ indice: 0, titulo, enVista })
  }, [informar, titulo, enVista])

  const avanzar = () => {
    const nodo = seccion.current
    if (!raiz || !nodo) return
    const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    raiz.scrollTo({ top: nodo.offsetHeight, behavior: quieto ? 'auto' : 'smooth' })
  }

  return (
    // El alto de la capa va en la sección, igual que en el respiro: su parada la deja en el borde
    // del contenedor, bajo la barra, así que es ella la que tiene que medir la pantalla entera.
    <section
      ref={seccion}
      className="portada-recorrido relative"
      style={alto ? ({ '--alto-capa': `${alto}px` } as React.CSSProperties) : undefined}
    >
      <div className="escena sticky flex flex-col items-center gap-6 px-4 py-6 text-center sm:px-6">
        {children}
        <button
          type="button"
          onClick={avanzar}
          className="invitar-portada mb-6 flex flex-col items-center gap-2.5 rounded-lg px-4 py-2 text-gray-500 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          {/* El texto va según el puntero y no según el ancho: hay tablets anchas que se deslizan
              y portátiles angostos con mouse. Los dos van en el marcado y el CSS esconde uno. */}
          <span className="texto-invitar leading-snug">
            <span className="texto-mouse">Haz scroll para desplazarte</span>
            <span className="texto-tactil">Desliza para desplazarte</span>
          </span>
          <ArcosPortada />
        </button>
      </div>
    </section>
  )
}

/**
 * Tres arcos que apuntan hacia abajo, cada uno más angosto y más claro que el de arriba.
 *
 * Flotan en cascada: los tres bajan y vuelven con un desfase, y cada uno se aclara un poco al
 * bajar. El movimiento es solo `transform` y `opacity`, y con movimiento reducido se detiene
 * (`index.css`). Las medidas son las del laboratorio: 64 px de ancho, trazo de 3 y arcos a media
 * altura de un semicírculo.
 */
const ARCOS = (() => {
  const ancho = 64
  const trazo = 3
  const separacion = ancho * 0.12
  let y = trazo
  const arcos = [1, 0.7, 0.45].map((escala, i) => {
    const r = (ancho / 2 - trazo) * escala
    const ry = r / 2
    // De izquierda a derecha con barrido 0 la curva pasa por abajo: el arco apunta hacia abajo.
    const d = `M ${(ancho / 2 - r).toFixed(2)} ${y.toFixed(2)} A ${r.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${(ancho / 2 + r).toFixed(2)} ${y.toFixed(2)}`
    y += ry + separacion
    return { d, opacidad: escala, retraso: i * 0.18 }
  })
  return { ancho, trazo, alto: Math.ceil(y - separacion + trazo), arcos }
})()

function ArcosPortada () {
  return (
    <svg
      aria-hidden
      width={ARCOS.ancho}
      height={ARCOS.alto}
      viewBox={`0 0 ${ARCOS.ancho} ${ARCOS.alto}`}
      className="arcos-portada overflow-visible text-brand-dark"
    >
      {ARCOS.arcos.map((a) => (
        <path
          key={a.d}
          d={a.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={ARCOS.trazo}
          strokeLinecap="round"
          style={{
            '--opacidad': a.opacidad,
            '--opacidad-alta': Math.min(1, a.opacidad + 0.3),
            '--retraso': `${a.retraso}s`,
          } as React.CSSProperties}
        />
      ))}
    </svg>
  )
}

/**
 * Un respiro entre dos escenas: una frase sola, una pantalla, un gesto.
 *
 * **No es una escena y no se numera.** No afirma un hallazgo ni muestra una figura: cierra lo que
 * se acaba de leer y abre la pregunta de lo que viene. Numerarlo diría que el recorrido tiene una
 * escena más de las que tiene, y contarlo como paso de la escena anterior lo dejaría bajo un
 * titular que ya no es el suyo.
 *
 * Es el mismo recurso que el puente de la escena 1 —la frase sola y centrada, sin nada más donde
 * mirar—, pero entre escenas en vez de dentro de una. Ocupa una pantalla exacta, y su parada (la
 * sección llenando la pantalla) es una marca de la barra, igual que un paso.
 */
export function Respiro ({ raiz, indice = -1, titulo, children }: {
  raiz: HTMLElement | null
  /**
   * La clave con la que se registra en la capa. **Negativa**: los índices positivos son de las
   * escenas y el 0 de la portada. Va explícito para que dos respiros no se pisen entre sí.
   */
  indice?: number
  /** La frase en texto plano, para el anuncio del lector de pantalla. */
  titulo: string
  children: React.ReactNode
}) {
  const seccion = useRef<HTMLElement | null>(null)
  const alto = useAltoDe(raiz)
  const informar = useContext(Registro)
  const [enVista, setEnVista] = useState(false)

  /*
   * **Si ya se cruzó la línea de la pausa**, en los dos sentidos. La pausa se monta encima de la
   * escena anterior (`index.css`), y al cruzar su línea la escena se desvanece y la frase entra.
   * La línea es su parada: el borde de arriba de la sección en el de la capa.
   *
   * **Se lee la posición en cada scroll, no con un observador.** Una marca observada se puede
   * cruzar entera de un salto (un enlace, un scroll por código) sin tocar la banda, y entonces el
   * observador no avisa nunca: medido el 22-09-2026, un salto de 310 px dejaba la escena a la vista
   * encima de la pausa. Es una lectura por cuadro y no mueve nada: la escena sigue pegada con
   * `sticky`.
   */
  const [cruzada, setCruzada] = useState(false)
  /*
   * **Y si ya llegó la escena siguiente**, con la misma lectura. Montada sobre el final de la pausa
   * (`index.css`), llega cuando su borde de arriba está a la subida (`--subida-tras-pausa`) del de la capa: ahí
   * aparece con un fundido y la frase de la pausa se va. Solo entre dos escenas, como la entrada.
   */
  const [salida, setSalida] = useState(false)
  useEffect(() => {
    const nodo = seccion.current
    if (!nodo || !raiz) return
    let cuadro = 0
    const medir = () => {
      cuadro = 0
      const arriba = raiz.getBoundingClientRect().top
      setCruzada(nodo.getBoundingClientRect().top - arriba <= 1)
      const siguiente = nodo.nextElementSibling
      const entreEscenas = !!siguiente?.classList.contains('escena-recorrido') && !!nodo.previousElementSibling?.classList.contains('escena-recorrido')
      // La subida se lee del CSS y no de la constante: con movimiento reducido vuelve a ser 1.
      const subida = parseFloat(getComputedStyle(raiz).getPropertyValue('--subida-tras-pausa')) || 1
      setSalida(entreEscenas && !!siguiente && siguiente.getBoundingClientRect().top - arriba <= subida * raiz.clientHeight + 1)
    }
    const alMover = () => { if (!cuadro) cuadro = requestAnimationFrame(medir) }
    medir()
    raiz.addEventListener('scroll', alMover, { passive: true })
    return () => {
      raiz.removeEventListener('scroll', alMover)
      cancelAnimationFrame(cuadro)
    }
  }, [raiz, alto])

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

  // Montada sobre la escena, la sección toca la banda antes de verse: se anuncia recién cruzada.
  useEffect(() => {
    informar?.({ indice, titulo, enVista: enVista && cruzada })
  }, [informar, indice, titulo, enVista, cruzada])

  return (
    // El alto de la capa va en la sección y no en la escena: su parada la deja en el borde del
    // contenedor, así que es ella la que tiene que medir la pantalla entera (ver
    // `.respiro-recorrido` en `index.css`). La variable igual llega a la escena por herencia.
    <section
      ref={seccion}
      className="respiro-recorrido relative"
      data-cruzada={cruzada ? '' : undefined}
      data-salida={salida ? '' : undefined}
      style={alto ? ({ '--alto-capa': `${alto}px` } as React.CSSProperties) : undefined}
    >
      <div className="escena sin-figura sticky flex flex-col items-center justify-center px-4 py-6 sm:px-6">
        {/* El mismo cuerpo y el mismo gris que una frase de escena: es la misma voz, no un cartel.
            El centrado y el ancho corto salen de `.escena.sin-figura` en `index.css`. */}
        <p className="bloque-texto text-[19px] leading-[1.4] text-gray-800 sm:text-lg sm:leading-relaxed">
          {children}
        </p>
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
export function Escena ({ indice, titulo, bajada, frases, figura, cabecera, nota, raiz, dosColumnas = false }: {
  /** Qué número de escena es, la clave con que se registra en la capa. Va explícito y no contado solo: las
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

  // **Un paso puede no tener figura.** Cuando `figura` devuelve `null`, la escena se queda con la
  // frase sola y centrada: es la pausa entre dos historias, y una figura de relleno ahí compite con
  // el respiro en vez de aportarlo. Sin figura tampoco hay pie ni leyenda:
  // los dos hablan de algo que no está.
  const dibujo = figura(activo, reducido)
  const sinFigura = dibujo === null || dibujo === undefined
  const bloqueFigura = useRef<HTMLDivElement | null>(null)
  const [altoFigura, setAltoFigura] = useState(0)
  const encabezado = typeof titulo === 'function' ? titulo(activo) : titulo

  /*
   * **En escritorio el texto corre** (laboratorio del scroll, 25-09-2026). La figura queda pegada y
   * sigue encendiendo por paso, pero cada frase es una tarjeta dentro de su paso de la pista, que sube
   * con el scroll: el gesto mueve algo visible, y quien se pasa ve la frase irse y puede volver. Con
   * el texto quieto, la rueda recorría 6 a 8 giros sin que nada se moviera y después cambiaba todo.
   *
   * Solo con dos columnas (la frase va en la izquierda), desde 900 px y sin movimiento reducido: ahí
   * no hay pista y el párrafo va entero, como siempre. En teléfono no hubo queja y queda igual.
   */
  const escritorio = useConsulta('(min-width: 900px)')
  const corre = dosColumnas && escritorio && !reducido && !sinFigura


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
    informar?.({ indice, titulo: encabezado, enVista })
  }, [informar, indice, encabezado, enVista])

  // El alto mayor que la figura ya alcanzó. `useLayoutEffect` y no `useEffect`: se mide antes de
  // pintar, así que el lector no llega a ver el bloque en su alto chico.
  useLayoutEffect(() => {
    const nodo = bloqueFigura.current
    if (!nodo) return
    const medido = Math.round(nodo.getBoundingClientRect().height)
    setAltoFigura((previo) => (medido > previo ? medido : previo))
  }, [activo, reducido, dibujo])

  // Al cambiar el ancho, el máximo guardado deja de valer: la figura se reacomoda y el mínimo
  // viejo abriría un hueco. Se mira el ancho y no el alto, que en el teléfono cambia solo por la
  // barra del navegador yendo y viniendo.
  useEffect(() => {
    const nodo = escena.current
    if (!nodo || typeof ResizeObserver === 'undefined') return
    let previo = Math.round(nodo.getBoundingClientRect().width)
    const observador = new ResizeObserver(() => {
      const ahora = Math.round(nodo.getBoundingClientRect().width)
      if (ahora !== previo) { previo = ahora; setAltoFigura(0) }
    })
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [])

  const alto = useAltoDe(raiz)
  // El alto de la escena **no** es el de la pantalla: con la figura grande y el texto a 19 px mide
  // bastante más, y esa diferencia era exactamente lo que le sobraba al primer paso.
  const altoEscena = useAltoDe(escena.current, alto)

  // Una frase por paso, en todos los anchos. La regla vive acá y no en el CSS porque depende del
  // paso activo, que es estado de React.
  //
  // **En escritorio también.** Antes el párrafo se leía entero en pantalla ancha, con las futuras
  // en gris claro. Con el texto de escritorio a 34 px eso son cuatro frases que no entran, y
  // además rompe la premisa del recorrido: un paso muestra lo que ese paso cuenta.
  //
  // Dónde está cada frase respecto del paso activo: la que ya pasó quedó arriba y la que viene
  // espera abajo. El movimiento lo pone `.parrafo-escena` en `index.css`, y así el sentido se
  // invierte solo al volver atrás, sin saber hacia dónde va el scroll.
  const lugar = (i: number) => (i < activo ? 'antes' : i === activo ? 'activa' : 'despues')

  return (
    // El `id` es el destino de las frases del cierre, que llevan de vuelta a su escena.
    // El alto de la capa va en la sección y no en el bloque pegado: lo heredan los dos, y la
    // sección lo necesita para alargarse cuando la sigue una pausa (ver `.escena-recorrido` en
    // `index.css`).
    <section
      ref={seccion}
      id={`escena-${indice}`}
      className="escena-recorrido relative"
      style={alto ? ({ '--alto-capa': `${alto}px` } as React.CSSProperties) : undefined}
    >
      {/* `top` y el alto viven en `.escena` (index.css), atados a la barra de la capa. El aire de
          arriba es padding real y no compensación de la barra, así que no se pierde al pegarse. */}
      {/* El orden es titular, frase, figura, y el bloque va centrado en la escena. Salió del
          laboratorio del recorrido el 07-09-2026 (preset «La elegida»): con la figura arriba, la
          frase quedaba al pie de la pantalla, que es donde el pulgar la tapa. */}
      <div
        ref={escena}
        // `.escena` usa el alto de la capa (heredado de la sección) para su `min-height`, que es lo
        // que le da a `justify-center` espacio que repartir (ver `index.css`).
        className={`escena${dosColumnas ? ' en-columnas' : ''}${sinFigura ? ' sin-figura' : ''}${corre ? ' texto-corre' : ''} sticky flex flex-col justify-center gap-6 px-4 pb-6 pt-6 sm:px-6`}
      >
        {/* El titular y la frase son la misma voz, así que viajan juntos: en escritorio son una
            columna y la figura es la otra. En angosto el envoltorio es `display: contents` y no
            cambia nada (ver `.columna-relato` en `index.css`). */}
        <div className="columna-relato">
          <div className="bloque-encabezado mx-auto w-full max-w-2xl">
            {encabezado && (
              <h3 className="font-display text-base font-semibold text-gray-900 sm:text-lg">{encabezado}</h3>
            )}
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
                <span key={i} data-lugar={reducido ? undefined : lugar(i)} className={reducido ? 'text-gray-700' : 'text-gray-800'}>
                  {f}{' '}
                </span>
              ))}
            </p>
          </div>
        </div>
        {!sinFigura && (
        <div
          ref={bloqueFigura}
          className="bloque-figura mx-auto w-full max-w-2xl pt-3 sm:pt-4"
          // **El bloque de la figura no se encoge entre pasos.** Con la escena centrada
          // verticalmente, cualquier cambio de alto recoloca todo: el pie del experimento crece
          // 21 px al aparecer la leyenda de pendientes, y eso movía el titular y la frase. El
          // mínimo es el mayor alto que este bloque ya tuvo **en este ancho**, así que no hay
          // ningún número escrito a mano y se rehace solo al rotar el teléfono.
          style={altoFigura > 0 ? { minHeight: altoFigura } : undefined}
        >
          {cabecera?.(activo)}
          {dibujo}
          {nota && <div className="mt-2">{typeof nota === 'function' ? nota(activo, reducido) : nota}</div>}
        </div>
        )}
      </div>

      {!reducido && (
        <Pista
          cantidad={frases.length}
          refs={refs}
          alto={alto}
          altoEscena={altoEscena}
          salida={0.45}
          paso={corre ? PASO_TEXTO_CORRE : undefined}
          tarjetas={corre ? frases.map((f, i) => ({ frase: f, lugar: lugar(i) })) : undefined}
        />
      )}
    </section>
  )
}

/**
 * La pista: no se ve y no se lee, solo mide el scroll. Cada tramo tiene que ser más alto que la
 * banda de lectura del observador, que es el 10 % central del contenedor. Los altos van en píxeles
 * cuando se conoce el alto de la capa, y en `svh` en el primer cuadro (ver `index.css`). El colchón
 * de arriba es lo que empareja los pasos, y el de abajo lo que permite que el último alcance a
 * activarse.
 *
 * **La comparten la escena y el cierre**, y por eso es un componente: la geometría de abajo costó
 * dos errores medidos, y dos copias se desincronizan a la primera corrección.
 *
 * **Con movimiento reducido no se dibuja.** La pista existe para medir el scroll que enciende los
 * pasos, y con `prefers-reduced-motion` no hay pasos que encender: la escena se muestra entera
 * desde el primer píxel. Dejarla igual le cobraba al lector el costo de una animación que pidió no
 * ver: medido el 08-09-2026, diecisiete tramos y unos 18.000 px de scroll sin nada nuevo. Ahora
 * cada escena cuesta su propio alto.
 */
/**
 * Con el texto que corre, cada paso mide 0,4 de pantalla y no 0,75: la frase sube lo que mide su
 * paso mientras está activa, y con 0,75 se leía entera solo el 25 a 43 % de ese tramo. Con 0,4 y la
 * frase al 80 %, el 84 a 100 % en promedio y 60 % la peor (seis historias, 1366, 1512 y 1920;
 * laboratorio del scroll, 25-09-2026).
 */
const PASO_TEXTO_CORRE = 0.4

/** Dónde está el centro de la frase, en fracción de la capa, cuando su paso se activa y la figura
 *  cambia. Más arriba, la frase sube bajo el titular antes de terminar su paso. */
const LECTURA_TEXTO_CORRE = 0.8

/** Cuánto sube la escena que sigue a una pausa, en fracción de la capa (laboratorio `pausa-corta`,
 *  25-09-2026). Con una pantalla entera, la subida costaba más scroll que la pausa. El CSS lo lee
 *  como `--subida-tras-pausa`. */
const SUBIDA_TRAS_PAUSA = 0.4

/** El colchón de entrada, en fracción de la capa: es también el `scroll-margin-top` de cada paso,
 *  así que es la línea (55 %) donde el paso toca la banda de lectura y se activa. */
const COLCHON = 0.55

function Pista ({ cantidad, refs, alto, altoEscena, salida = 0.2, paso = 0.75, tarjetas }: {
  cantidad: number
  refs: React.MutableRefObject<(HTMLElement | null)[]>
  /** El alto de la capa. */
  alto: number
  /** El alto del bloque pegado que la pista acompaña. */
  altoEscena: number
  /** El colchón de salida, en fracción de la capa. Ver abajo. */
  salida?: number
  /** El alto de cada paso, en fracción de la capa. */
  paso?: number
  /**
   * Con el texto que corre, la frase de cada paso y dónde está respecto del activo. Van **dentro**
   * del paso, así que suben con el scroll. Son una copia visual: la frase de verdad sigue en la
   * escena con opacidad cero, para el lector de pantalla y para copiar, y la pista es `aria-hidden`.
   */
  tarjetas?: { frase: React.ReactNode, lugar: string }[]
}) {
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
   * Con la pista subida el alto de la escena, el paso i entra a la banda de lectura exactamente a
   * `i × alto de paso`. En píxeles medidos y no en porcentaje: un margen en porcentaje se
   * resuelve contra el **ancho**.
   */
  const altoPaso = alto ? Math.round(alto * paso) : undefined
  const colchon = alto ? Math.round(alto * COLCHON) : undefined
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
  // El colchón de salida. En el cierre solo tiene que alcanzar para que el último paso entre a la
  // banda (0,2): al 55 % sumaba media pantalla de scroll muerto. En una escena es además el tiempo
  // de lectura del último paso, y con 0,2 duraba 0,5 de pantalla contra 0,75 de los demás: el
  // texto y la figura se iban antes de tiempo (medido el 22-09-2026, 422 contra 633 px en
  // 390×844). La escena pasa 0,45, y su último paso dura lo mismo que cualquiera.
  const colchonFinal = alto ? Math.round(alto * salida) : undefined

  return (
    // Con tarjetas, la pista va **detrás** de la escena pegada (`pista-con-texto` en `index.css`): el
    // titular, con fondo blanco y un degradado debajo, tapa las frases que suben hasta él.
    <div aria-hidden className={`pointer-events-none${tarjetas ? ' pista-con-texto' : ''}`} style={subirPista ? { marginTop: subirPista } : undefined}>
      <div
        className="colchon-recorrido"
        style={{ ...(colchon ? { height: colchon } : {}), ...(colchon ? { scrollMarginTop: colchon } : {}) }}
      />
      {Array.from({ length: cantidad }, (_, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el }}
          data-paso={i}
          className="paso-recorrido"
          // La parada (teclado, marca de la barra) cae donde cambia la figura, no donde empieza el
          // tramo: sin el margen de scroll quedaría medio paso corrida.
          style={{
            ...(altoPaso ? { height: altoPaso } : {}),
            ...(colchon ? { scrollMarginTop: colchon } : {}),
          }}
        >
          {/* El paso se activa cuando su borde de arriba cruza el 55 %; a esa altura el centro de
              la frase queda en `LECTURA_TEXTO_CORRE` de la capa. */}
          {tarjetas?.[i] && (
            <div className="fila-tarjeta" style={alto ? { top: Math.round(alto * (LECTURA_TEXTO_CORRE - COLCHON)) } : undefined}>
              <p className="tarjeta-frase" data-lugar={tarjetas[i].lugar}>{tarjetas[i].frase}</p>
            </div>
          )}
        </div>
      ))}
      <div
        className="colchon-recorrido"
        style={{ ...(colchonFinal ? { height: colchonFinal } : {}), ...(colchon ? { scrollMarginTop: colchon } : {}) }}
      />
    </div>
  )
}

/**
 * El cierre del recorrido: una frase por conclusión, que se encienden con el scroll, y después la
 * salida.
 *
 * Decidido el 15-09-2026 en `laboratorio/cierre-recorrido.html` (combinación «propuesta»), en
 * reemplazo de «Hasta acá el recorrido». **No es una escena**, igual que la portada y los respiros;
 * a diferencia de ellos tiene pasos, y cada uno es una marca en la barra de avance.
 *
 * - **Las frases leídas quedan en gris 500, no se esconden.** El cierre es un resumen: al final se
 *   leen todas juntas. Gris 500 y no más claro, que es el último tono con 4,5:1 sobre blanco.
 * - **Cada frase lleva de vuelta a su escena.** Es la manera de verificar una conclusión sin
 *   rehacer el recorrido entero.
 * - **La salida tiene su propio paso.** Con la última frase compartía el gesto, y se leía antes
 *   de que la frase terminara de encenderse.
 * - **La salida principal es la historia siguiente**, con su número y su pregunta de portada, como
 *   la tarjeta del menú. La última historia ofrece volver al menú. Lo que sigue a una historia es
 *   otra (decisión de Felipe, 22-09-2026).
 */
export function Cierre ({ raiz, titulo, frases }: {
  raiz: HTMLElement | null
  titulo: string
  /** El titular de cada escena que el cierre repite, con la escena a la que lleva. */
  frases: { escena: number, texto: string }[]
}) {
  const siguiente = useContext(Siguiente)
  const numero = useContext(NumeroHistoria)
  const metodo = useContext(Metodo)
  // Una frase por paso, y uno más para la salida.
  const pasos = frases.length + 1
  const { activo, refs, reducido } = usePasoActivo(pasos, raiz)
  const seccion = useRef<HTMLElement | null>(null)
  const escena = useRef<HTMLDivElement | null>(null)
  const informar = useContext(Registro)
  const [enVista, setEnVista] = useState(false)

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

  // Índice negativo, fuera de los de las escenas y lejos de los de los respiros.
  useEffect(() => {
    informar?.({ indice: -99, titulo, enVista })
  }, [informar, titulo, enVista])

  const alto = useAltoDe(raiz)
  const altoEscena = useAltoDe(escena.current, alto)

  // Mismo cálculo que el teclado de la capa: contra el contenedor, nunca con `offsetTop`.
  const irA = (destino: Element | null | undefined) => {
    if (!raiz || !destino) return
    const arriba = raiz.getBoundingClientRect().top - raiz.scrollTop
    raiz.scrollTo({ top: destino.getBoundingClientRect().top - arriba, behavior: reducido ? 'auto' : 'smooth' })
  }

  // Los titulares se escriben sin punto final porque van de encabezado; acá son oraciones.
  const cerrada = (texto: string) => (/[.!?]$/.test(texto) ? texto : `${texto}.`)
  const salidaVisible = reducido || activo >= frases.length

  return (
    <section ref={seccion} className="cierre-recorrido relative">
      <div
        ref={escena}
        className="escena sticky flex flex-col justify-center px-4 py-6 sm:px-6"
        style={alto ? ({ '--alto-capa': `${alto}px` } as React.CSSProperties) : undefined}
      >
        {/* Las medidas de escritorio viven en `index.css` (`.cierre-recorrido`). */}
        <div className="bloque-cierre mx-auto w-full max-w-2xl">
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-brand-dark">{numero ? `Historia ${numero}` : 'Recorrido'}</p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-gray-900">{titulo}</h2>

          <ol className="frases-cierre mt-5 flex flex-col gap-3">
            {frases.map((f, i) => {
              const futura = !reducido && i > activo
              const tono = reducido ? 'text-gray-700' : i === activo ? 'text-gray-800' : futura ? 'opacity-0' : 'text-gray-500'
              return (
                <li key={f.escena} className={`flex items-baseline gap-3 text-[19px] leading-[1.4] transition-[opacity,color] duration-500 ${tono}`}>
                  <span
                    aria-hidden
                    className={`w-4 shrink-0 text-right font-display text-[0.6em] font-semibold tabular-nums transition-colors duration-500 ${!reducido && i === activo ? 'text-brand-dark' : 'text-gray-400'}`}
                  >
                    {i + 1}
                  </span>
                  {/* Un botón y no un enlace: las rutas van por hash, y un `href="#escena-3"`
                      navegaría a una ruta que no existe. La frase futura sigue en el documento,
                      pero fuera del tabulador: con opacidad cero no se ve dónde está el foco. */}
                  <button
                    type="button"
                    tabIndex={futura ? -1 : undefined}
                    onClick={() => { irA(raiz?.querySelector(`#escena-${f.escena}`)) }}
                    className="text-left underline decoration-gray-300 decoration-1 underline-offset-[3px] hover:decoration-brand-dark"
                  >
                    {cerrada(f.texto)}
                  </button>
                </li>
              )
            })}
          </ol>

          {/* `invisible` además de la opacidad: son controles, y un botón transparente se puede
              tabular y apretar sin verlo. */}
          <div className={`salida-cierre mt-7 border-t border-gray-200 pt-5 transition-[opacity,visibility] duration-500 ${salidaVisible ? '' : 'invisible opacity-0'}`}>
            {siguiente && (
              <>
                <p className="rotulo-siguiente font-display text-xs font-semibold uppercase tracking-widest text-brand-dark">
                  Siguiente · Historia {siguiente.numero}
                </p>
                <p className="pregunta-siguiente mt-1 text-balance font-display text-xl font-semibold leading-snug text-gray-900">{siguiente.pregunta}</p>
              </>
            )}
            <Link
              to={siguiente ? siguiente.ruta : '/'}
              aria-label={siguiente ? `Leer la historia ${siguiente.numero}: ${siguiente.nombre}` : undefined}
              className="boton-siguiente presionable mt-3.5 inline-flex items-center gap-2 rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand hover:text-gray-900"
            >
              {siguiente ? 'Leer la historia' : 'Ver todas las historias'} <span aria-hidden>→</span>
            </Link>
            <div className="otras-salidas mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              {siguiente && <Link to="/" className="underline underline-offset-2 hover:text-brand-dark">Volver a las historias</Link>}
              <Link to="/explorar" className="underline underline-offset-2 hover:text-brand-dark">Explorar las preguntas</Link>
              <Link to={`/datos?foco=${metodo}`} className="underline underline-offset-2 hover:text-brand-dark">Cómo se hizo</Link>
              <button
                type="button"
                onClick={() => { raiz?.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' }) }}
                className="underline underline-offset-2 hover:text-brand-dark"
              >
                Volver al inicio <span aria-hidden>↑</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {!reducido && <Pista cantidad={pasos} refs={refs} alto={alto} altoEscena={altoEscena} />}
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
