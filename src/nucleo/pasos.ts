import { useEffect, useRef, useState } from 'react'

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
 *  3. **Quien pide menos movimiento ve la figura entera desde el principio.** No una versión
 *     recortada: `prefers-reduced-motion` salta al último paso, que es el que tiene todo.
 */

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
 * Cuál de los pasos está en la banda de lectura, que es el 10 % central de la pantalla.
 *
 * **Qué se observa cambia con el ancho, y no es un capricho.** En pantalla ancha el párrafo y la
 * figura caben juntos y quedan fijos, así que lo que se mueve es una pista invisible: sin ella el
 * párrafo mide 190 px y el recorrido entero pasaría en un golpe de rueda. En teléfono los dos
 * juntos miden más que la pantalla, así que la figura se pega arriba, el párrafo corre por debajo
 * y **las frases se observan a sí mismas**: ahí el propio texto da el ritmo y la pista sobra.
 *
 * La banda es angosta a propósito: con una más ancha hay dos pasos dentro a la vez y el paso
 * activo depende del orden en que el navegador entregue las entradas, que no está garantizado.
 * El precio es que cada paso tiene que ser más alto que la banda, y de eso se encarga el
 * `min-h` de la columna de texto.
 */
/** Si la pantalla llega a un ancho. Para elegir disposición, no para maquillar una sola. */
export function useAnchoMinimo (px: number) {
  const [alcanza, setAlcanza] = useState(false)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const consulta = matchMedia(`(min-width: ${px}px)`)
    setAlcanza(consulta.matches)
    const alCambiar = () => { setAlcanza(consulta.matches) }
    consulta.addEventListener('change', alCambiar)
    return () => { consulta.removeEventListener('change', alCambiar) }
  }, [px])
  return alcanza
}

export function usePasoActivo (cantidad: number) {
  const refs = useRef<(HTMLElement | null)[]>([])
  const [activo, setActivo] = useState(0)
  const reducido = useMovimientoReducido()

  useEffect(() => {
    // Sin observador o con movimiento reducido, el último paso: el que muestra todo.
    if (reducido || typeof IntersectionObserver === 'undefined') {
      setActivo(cantidad - 1)
      return
    }
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        const i = Number((entrada.target as HTMLElement).dataset.paso)
        if (Number.isInteger(i)) setActivo(i)
      }
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 })

    for (const el of refs.current) if (el) observador.observe(el)
    return () => { observador.disconnect() }
  }, [cantidad, reducido])

  return { activo, refs, reducido }
}
