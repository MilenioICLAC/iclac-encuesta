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
 * Cuál es el paso activo dado lo que el observador acaba de reportar.
 *
 * Va aparte del hook, y como función pura, porque es la única decisión del recorrido que se puede
 * equivocar en silencio: el navegador **no garantiza el orden** de las entradas de una misma
 * entrega, así que «la última entrada que intersecta» da un paso distinto según el orden en que
 * llegue. Acá la regla no depende del orden y se puede probar sin DOM.
 *
 * Con la banda angosta lo normal es que intersecte uno solo. Si intersectan varios (una entrega
 * después de un salto, o pasos más bajos que la banda), gana el más cercano al que estaba activo,
 * y en empate el mayor: el lector avanza más veces de las que retrocede.
 */
export function pasoActivo (entradas: { paso: number, dentro: boolean }[], actual: number): number {
  const candidatos = entradas.filter((e) => e.dentro && Number.isInteger(e.paso)).map((e) => e.paso)
  if (candidatos.length === 0) return actual
  return candidatos.reduce((mejor, paso) => {
    const d = Math.abs(paso - actual)
    const dMejor = Math.abs(mejor - actual)
    if (d < dMejor) return paso
    if (d === dMejor) return Math.max(paso, mejor)
    return mejor
  })
}

export function usePasoActivo (cantidad: number, raiz?: HTMLElement | null) {
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
      const reportadas = entradas.map((entrada) => ({
        paso: Number((entrada.target as HTMLElement).dataset.paso),
        dentro: entrada.isIntersecting,
      }))
      setActivo((actual) => pasoActivo(reportadas, actual))
    // `root` es el contenedor que hace scroll. Dentro de una capa con scroll propio, dejarlo
    // en la pantalla mide contra algo que no se mueve y ningún paso se activa nunca.
    }, { root: raiz ?? null, rootMargin: '-45% 0px -45% 0px', threshold: 0 })

    for (const el of refs.current) if (el) observador.observe(el)
    return () => { observador.disconnect() }
  }, [cantidad, reducido, raiz])

  return { activo, refs, reducido }
}
