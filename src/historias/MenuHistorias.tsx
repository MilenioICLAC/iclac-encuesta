import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import { numero } from '../locale'
import { HISTORIAS } from './indice'
import { ContenidoTarjeta, TARJETA } from './TarjetaHistoria'
import { useTransicionHistoria } from './contextoTransicion'

/**
 * La raíz del sitio: una tarjeta por historia.
 *
 * Cada tarjeta dice **la pregunta** (la misma de la portada de la historia) y **lo que se
 * encontró**, sin cifras (ver `indice.tsx`). El orden es el del cuestionario. No hay imagen ni
 * figura en miniatura: una figura sin su escena no dice nada y obliga a leer una leyenda chica.
 *
 * Al elegir una, la transición (`Transicion.tsx`) apila las demás bajo ella y lleva su pregunta
 * hasta el título de la portada. Con movimiento reducido, o con un clic que pide otra pestaña
 * (tecla modificadora, botón del medio), el enlace navega sin transición.
 */
export default function MenuHistorias ({ encuesta }: { encuesta: Encuesta }) {
  const olas = encuesta.olas
  const n = encuesta.casos.length
  const navegar = useNavigate()
  const { iniciar, enCurso, volviendoDe } = useTransicionHistoria()
  const tarjetas = useRef<(HTMLAnchorElement | null)[]>([])

  // De vuelta de una historia, el foco va a su tarjeta (ver `ProveedorTransicion`), y la tarjeta
  // a la vista. Un cuadro después: en este la capa todavía tiene el cuerpo fijo y lo devuelve al
  // scroll que tenía al abrirse, que es 0 (el menú ya se había desmontado y el documento se
  // acortó). Sin esperar, el foco quedaba en una tarjeta fuera de la pantalla.
  useEffect(() => {
    if (!volviendoDe) return
    const cuadro = requestAnimationFrame(() => {
      const tarjeta = tarjetas.current[HISTORIAS.findIndex((h) => h.id === volviendoDe)]
      tarjeta?.focus({ preventScroll: true })
      tarjeta?.scrollIntoView({ block: 'center' })
    })
    return () => { cancelAnimationFrame(cuadro) }
  }, [volviendoDe])

  const elegir = (e: React.MouseEvent, i: number) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (enCurso) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { navegar(`/historias/${HISTORIAS[i].id}`); return }
    iniciar({ indice: i, cajas: tarjetas.current.map((t) => t!.getBoundingClientRect()) })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10">
      <h1 className="font-display text-2xl font-semibold text-gray-900 sm:text-3xl">
        Percepciones sobre China en Chile
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        {HISTORIAS.length} historias contadas con la encuesta de ICLAC: {olas.length} oleadas ({olas[0]} a {olas[olas.length - 1]}),{' '}
        {numero(n)} personas encuestadas en un panel en línea.
      </p>
      {/* Durante la transición los originales quedan transparentes, no `invisible`: con
          `visibility: hidden` el enlace elegido perdía el foco y la lista salía del árbol
          accesible (medido por Codex, 22-09-2026). Fuera del tabulador mientras dura.
          La tarjeta responde al cursor con borde y sombra, no con `translate` ni `scale`: la
          transición copia su caja en el clic, y una caja a medio mover saldría corrida. */}
      <ol aria-busy={enCurso} className={`mt-8 grid list-none gap-4 p-0 md:grid-cols-2 md:gap-5 ${enCurso ? 'opacity-0' : ''}`}>
        {HISTORIAS.map((h, i) => (
          <li key={h.id} className="flex">
            <Link
              ref={(el) => { tarjetas.current[i] = el }}
              to={`/historias/${h.id}`}
              tabIndex={enCurso ? -1 : undefined}
              onClick={(e) => { elegir(e, i) }}
              className={`group ${TARJETA} transition-[border-color,box-shadow] duration-200 ease-in-out hover:border-brand-dark hover:shadow-md hover:shadow-brand-dark/10 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark`}
            >
              <ContenidoTarjeta h={h} i={i} />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
