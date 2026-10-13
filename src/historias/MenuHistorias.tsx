import { useEffect, useRef } from 'react'
import { vistaQuietaElegida } from '../nucleo/pasos'
import { Link, useNavigate } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import { useTranslation } from 'react-i18next'
import { numero, plural } from '../locale'
import { participacion } from '../nucleo/agregar'
import { HISTORIAS } from './indice'
import { ContenidoTarjeta, TARJETA } from './TarjetaHistoria'
import { useTransicionHistoria } from './contextoTransicion'
import { BotonMetodo } from '../componentes/PopupMetodo'
import Contrastes, { ComoSeLee } from '../componentes/Contrastes'

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
  const p = participacion(encuesta)
  const navegar = useNavigate()
  const { iniciar, enCurso, volviendoDe } = useTransicionHistoria()
  const tarjetas = useRef<(HTMLAnchorElement | null)[]>([])
  const { t } = useTranslation('capa')
  const c = encuesta.contrastes

  // La frase entera es una plantilla por idioma (`capa.json`, `menu.intro`); acá solo se arman los
  // grupos de número y sustantivo, con la forma que pide cada número (el chino no tiene plural). Las
  // oleadas van en palabras hasta cinco; los años, sin separador de miles.
  const conNumero = (clave: string, n: number, texto = numero(n)) =>
    t(`menu.${clave}.${plural(n, { one: 'one', other: 'other' })}`, { n: texto })
  const intro = t('menu.intro', {
    historias: conNumero('historias', HISTORIAS.length),
    olas: conNumero('olas', olas.length, t(`menu.enPalabras.${olas.length}`, { defaultValue: numero(olas.length) })),
    desde: String(olas[0]),
    hasta: String(olas[olas.length - 1]),
    respuestas: conNumero('respuestas', p.respuestas),
    personas: conNumero('personas', p.personas),
  })

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
    // Sin transición en la vista quieta, también cuando se eligió con el interruptor y no la pidió el
    // sistema: «Ver sin animación» vale desde el menú (Codex, 08-10-2026).
    if (vistaQuietaElegida()) { navegar(`/historias/${HISTORIAS[i].id}`); return }
    // Las cucharas flotan juntas: el punto del vaivén de la elegida es el de todas.
    const vaiven = tarjetas.current[i]?.querySelector('[data-cuchara] .cuchara')?.getAnimations()[0]?.currentTime
    iniciar({ indice: i, cajas: tarjetas.current.map((t) => t!.getBoundingClientRect()), vaiven: typeof vaiven === 'number' ? vaiven : undefined, desde: '/' })
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10">
      <h1 className="font-display text-2xl font-semibold text-gray-900 sm:text-3xl">
        {t('menu.titulo')}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        {/* Respuestas y personas no son lo mismo: 159 personas contestaron en más de una oleada. */}
        {intro}{' '}
        <Link to="/ficha" className="text-brand-dark underline hover:no-underline">{t('menu.mas')}</Link>
      </p>
      {/* **La metodología es del conjunto, y por eso vive acá.** Cada historia publica en su
          cierre las pruebas que la sostienen; esta tabla trae las de las seis juntas, incluidas
          las que ninguna historia usa, y no es de ninguna en particular. Era la única parte de la vista «Sobre los datos» que no está en la Ficha
          técnica (Felipe, 29-09-2026). */}
      {c && (
        <p className="mt-1.5 text-sm">
          <BotonMetodo
            etiqueta={t('menu.metodologia')}
            titulo={t('menu.metodologiaTitulo')}
            className="text-brand-dark underline hover:no-underline"
            ancho
          >
            <div className="flex flex-col gap-4">
              <ComoSeLee rondas={c.metodo.rondas} />
              <div>
                <h3 className="font-display text-sm font-semibold text-gray-900">{t('menu.todas')}</h3>
                <p className="mt-1 text-xs">
                  {plural(c.medidas.length, {
                    one: t('menu.todasBajadaUna', { n: numero(c.medidas.length) }),
                    other: t('menu.todasBajada', { n: numero(c.medidas.length) }),
                  })}
                </p>
                <div className="mt-2">
                  <Contrastes contrastes={c} />
                </div>
              </div>
            </div>
          </BotonMetodo>
        </p>
      )}
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
