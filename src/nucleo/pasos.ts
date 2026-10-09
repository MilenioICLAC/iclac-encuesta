import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/**
 * El recorrido avanza con el scroll: cada frase del relato enciende los puntos de los que
 * habla.
 *
 * **Tres reglas que no son de estilo, son de honestidad, y por eso viven acá y no en el CSS:**
 *
 *  1. **La escala nunca depende de lo visible.** Se calcula sobre todos los datos y se pasa
 *     hecha a la figura. Si se recalculara con lo encendido, el mismo valor cambiaría de lugar
 *     al avanzar el relato, que es la manera más limpia de mentir con una animación.
 *  2. **Ocultar no es borrar.** Los puntos apagados siguen en el documento con opacidad cero,
 *     así que están al imprimir y para un lector de pantalla. La animación es una capa de
 *     lectura sobre una figura que ya está completa.
 *  3. **La vista quieta ve la figura entera desde el principio.** No una versión recortada:
 *     salta al último paso, que es el que tiene todo (ver `usePreferenciaVista`).
 */

/**
 * Si una media query se cumple, y se actualiza cuando deja de cumplirse. Sirve para decisiones que
 * viven en React y no solo en el CSS: en escritorio la escena dibuja sus frases en la pista (el
 * texto corre), y eso cambia qué se renderiza, no solo cómo se ve.
 */
export function useConsulta (consulta: string) {
  // Se lee al crear el estado y no solo en el efecto: partir en `false` dibujaba un primer cuadro
  // sin tarjetas y con pasos de 0,75, y las marcas de la barra saltaban (Codex, 25-09-2026).
  const [cumple, setCumple] = useState(() => typeof matchMedia === 'function' && matchMedia(consulta).matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const lista = matchMedia(consulta)
    setCumple(lista.matches)
    const alCambiar = () => { setCumple(lista.matches) }
    lista.addEventListener('change', alCambiar)
    return () => { lista.removeEventListener('change', alCambiar) }
  }, [consulta])
  return cumple
}

export function useMovimientoReducido () {
  const [reducido, setReducido] = useState(false)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const consulta = matchMedia('(prefers-reduced-motion: reduce)')
    setReducido(consulta.matches)
    const alCambiar = () => { setReducido(consulta.matches) }
    consulta.addEventListener('change', alCambiar)
    return () => { consulta.removeEventListener('change', alCambiar) }
  }, [])
  return reducido
}

/**
 * **Qué vista de las historias se lee: la animada, con pasos, o la quieta, con todo a la vista.**
 *
 * Por omisión la decide el sistema: quien activó «reducir movimiento» (Windows con los efectos de
 * animación apagados, iOS con «Reducir movimiento») recibe la quieta. Hasta el 08-10-2026 eso era
 * la misma capa pegada sin pista, que nadie diseñó y se desbordaba en pantallas bajas y en el
 * teléfono (`estado.md` §2.9). Ahora es una vista propia, y un interruptor deja pasar de una a otra
 * en los dos sentidos: hay quien tiene el ajuste puesto sin haberlo elegido (el ahorro de energía
 * de Windows lo activa) y quien prefiere leer de corrido sin tenerlo.
 *
 * La elección se guarda en el navegador y manda sobre el sistema. **Lo que no cambia es el
 * movimiento:** `sistema` sigue diciendo si el sistema pidió menos movimiento, y con eso se apagan
 * las transiciones (el CSS de `prefers-reduced-motion` no se toca). Quien tiene el ajuste y elige la
 * animada recibe los pasos, sin animación entre ellos.
 */
export type Vista = 'quieta' | 'animada'

const CLAVE_VISTA = 'vista-historias'

function vistaGuardada (): Vista | null {
  try {
    const valor = localStorage.getItem(CLAVE_VISTA)
    return valor === 'quieta' || valor === 'animada' ? valor : null
  } catch {
    return null
  }
}

export interface PreferenciaVista {
  /** La vista quieta: todo a la vista, sin pista ni pasos. */
  quieta: boolean
  /** Si el sistema pidió menos movimiento, elija el lector la vista que elija. */
  sistema: boolean
  /** Pasa a la otra vista y lo recuerda. */
  cambiar: () => void
}

export function usePreferenciaVista (): PreferenciaVista {
  const sistema = useConsulta('(prefers-reduced-motion: reduce)')
  const [guardada, setGuardada] = useState<Vista | null>(vistaGuardada)
  const quieta = guardada ? guardada === 'quieta' : sistema
  const cambiar = useCallback(() => {
    const nueva: Vista = quieta ? 'animada' : 'quieta'
    try { localStorage.setItem(CLAVE_VISTA, nueva) } catch { /* sin almacenamiento, vale por esta visita */ }
    setGuardada(nueva)
  }, [quieta])
  return { quieta, sistema, cambiar }
}

/**
 * La preferencia, publicada por `CapaRecorrido` para sus piezas (portada, escenas, pausas y
 * cierre), que son hijas del `children` de cada historia y no la reciben por props. Fuera de una
 * capa vale `null`, y quien la lea cae al ajuste del sistema.
 */
export const ContextoVista = createContext<PreferenciaVista | null>(null)

/**
 * Cuál de los pasos está en la banda de lectura, que es el 10 % central de la pantalla.
 *
 * Lo que se observa es una **pista invisible**, no el texto: en la capa del recorrido el párrafo y
 * la figura quedan quietos, así que el texto no puede dar el ritmo. La pista es lo único que se
 * mueve, y su alto es el que decide cuánto scroll cuesta cada frase.
 *
 * La banda es angosta a propósito: con una más ancha hay dos pasos dentro a la vez y el paso
 * activo depende del orden en que el navegador entregue las entradas, que no está garantizado.
 * El precio es que cada paso tiene que ser más alto que la banda, y de eso se encarga el
 * `min-h` de la columna de texto.
 */
/**
 * Cuál es el paso activo, dado qué pasos están **ahora** dentro de la banda.
 *
 * Va aparte del hook, y como función pura, porque es la única decisión del recorrido que se puede
 * equivocar en silencio. Recibe el estado acumulado de todos los pasos, no la última entrega del
 * observador: el observador solo avisa cuando un paso **entra o sale** de la banda, y cada paso
 * mide 0,75 de pantalla contra una banda de 0,1, así que al cruzar una marca el paso anterior y el
 * nuevo están dentro a la vez durante un décimo de pantalla. Con la regla vieja («el más cercano
 * al activo, entre los de esta entrega»), volver atrás desde esa franja solo traía la salida del
 * nuevo y la frase no volvía nunca (medido el 22-09-2026; con imán, el scroll quedaba siempre ahí).
 *
 * **Gana el mayor de los que están dentro.** Con dos dentro, el scroll acaba de pasar la marca del
 * mayor, así que el activo es exactamente el de la última marca que quedó atrás, en los dos
 * sentidos y después de cualquier salto. No depende del orden de las entradas. Si no hay ninguno
 * dentro (antes de la pista o después), se queda el que estaba.
 */
export function pasoActivo (dentro: ReadonlyMap<number, boolean>, actual: number): number {
  let mayor = -1
  for (const [paso, esta] of dentro) if (esta && Number.isInteger(paso) && paso > mayor) mayor = paso
  return mayor < 0 ? actual : mayor
}

export function usePasoActivo (cantidad: number, raiz?: HTMLElement | null) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [activo, setActivo] = useState(0)
  const vista = useContext(ContextoVista)
  const sistema = useMovimientoReducido()
  // `reducido` es «el relato entero de una vez»: la vista quieta, o sin capa, el ajuste del sistema.
  const reducido = vista ? vista.quieta : sistema

  useEffect(() => {
    // Sin observador o en la vista quieta, el último paso: el que muestra todo.
    if (reducido || typeof IntersectionObserver === 'undefined') {
      setActivo(cantidad - 1)
      return
    }
    // Qué pasos están dentro de la banda, acumulado entre entregas: ver `pasoActivo`.
    const dentro = new Map<number, boolean>()
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        dentro.set(Number((entrada.target as HTMLElement).dataset.paso), entrada.isIntersecting)
      }
      setActivo((actual) => pasoActivo(dentro, actual))
    // `root` es el contenedor que hace scroll. Dentro de una capa con scroll propio, dejarlo
    // en la pantalla mide contra algo que no se mueve y ningún paso se activa nunca.
    }, { root: raiz ?? null, rootMargin: '-45% 0px -45% 0px', threshold: 0 })

    for (const el of refs.current) if (el) observador.observe(el)
    return () => { observador.disconnect() }
  }, [cantidad, reducido, raiz])

  return { activo, refs, reducido }
}
