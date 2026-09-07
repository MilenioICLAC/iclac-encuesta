import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { Idioma } from '../locale'
import { TEXTOS } from '../textos'

/**
 * El encabezado, copiado del repositorio de inversiones y adaptado a esta aplicación.
 *
 * **Por qué copiarlo.** Las dos aplicaciones las publica ICLAC y el lector llega a ellas desde
 * iclac.cl. El encabezado de ese sitio mide 88 px en escritorio (logo de 68 px con 10 px arriba
 * y abajo) y se separa del contenido con sombra, no con borde: replicar las dos cosas hace que
 * pasar del sitio institucional a esta app no se lea como un corte. En teléfono no, ahí cada
 * píxel de alto se lo quita al contenido y el encabezado se queda compacto.
 *
 * **El nav navega de verdad**: cada destino es una vista con su URL, no un ancla dentro de un
 * scroll infinito. Una sola página larga no se recorre, se abandona.
 *
 * **Queda pegado arriba**, y por eso publica su alto medido en `--alto-encabezado`: la barra de
 * controles del tablero también es pegajosa y tiene que pegarse **debajo** de este, no debajo
 * del borde de la pantalla. El alto no se escribe a mano en ninguna de las dos, porque cambia
 * con el ancho (79 px en teléfono, 88 en escritorio) y dos números a mano se desincronizan.
 */

interface Props {
  idioma: Idioma
  onIdioma: (idioma: Idioma) => void
}

const IDIOMAS: { codigo: Idioma, etiqueta: string }[] = [
  { codigo: 'es', etiqueta: 'ES' },
  { codigo: 'en', etiqueta: 'EN' },
  { codigo: 'cn', etiqueta: '中文' },
]

/**
 * El ícono del recorrido: un triángulo de reproducción.
 *
 * El recorrido no es una página más del sitio, es algo que se mira y que dura: el ícono lo dice
 * antes de que el lector haga clic. Se exporta porque el botón de la portada usa el mismo glifo,
 * que es lo que ata las dos entradas al mismo lugar.
 */
export function IconoRecorrido ({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

const NAV: { a: string, clave: keyof typeof TEXTOS.nav }[] = [
  { a: '/recorrido', clave: 'recorrido' },
  { a: '/tablero', clave: 'tablero' },
  { a: '/explorar', clave: 'explorar' },
  { a: '/descargas', clave: 'descargas' },
  { a: '/datos', clave: 'datos' },
]

// El encabezado de iclac.cl no se separa con borde sino con sombra. Es la misma constante del
// repositorio de inversiones, medida contra el sitio.
const SOMBRA = 'shadow-[0_5px_10px_0_rgba(50,50,50,0.06)]'

const clase = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-brand-dark'

export default function Encabezado ({ idioma, onIdioma }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const caja = useRef<HTMLElement | null>(null)
  // La portada y la capa son el mismo destino para el lector, aunque sean dos rutas: el ítem se
  // marca en las dos. `NavLink` solo por sí mismo marcaría la capa y dejaría la portada sin marca.
  const { pathname } = useLocation()
  const enRecorrido = pathname === '/' || pathname === '/recorrido'

  // El alto medido, no declarado: lo lee quien tenga que pegarse debajo.
  useEffect(() => {
    const nodo = caja.current
    if (!nodo) return
    const publicar = () => {
      document.documentElement.style.setProperty('--alto-encabezado', `${Math.round(nodo.getBoundingClientRect().height)}px`)
    }
    publicar()
    const observador = new ResizeObserver(publicar)
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [])

  const botonesIdioma = (
    <div className="flex gap-1 text-sm" role="group" aria-label={TEXTOS.idioma[idioma]}>
      {IDIOMAS.map((l) => (
        <button
          key={l.codigo}
          type="button"
          lang={l.codigo === 'cn' ? 'zh' : l.codigo}
          aria-pressed={idioma === l.codigo}
          onClick={() => { onIdioma(l.codigo) }}
          className={`rounded px-2 py-1 ${
            idioma === l.codigo
              ? 'bg-gray-900 text-white hover:bg-brand-dark'
              : 'text-gray-600 hover:bg-brand hover:text-gray-900'
          }`}
        >
          {l.etiqueta}
        </button>
      ))}
    </div>
  )

  return (
    <header
      ref={caja}
      className={`sticky top-0 z-40 bg-white px-4 py-3 sm:px-6 md:py-[0.625rem] ${SOMBRA}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <a href="https://iclac.cl/" target="_blank" rel="noopener noreferrer" className="shrink-0">
            {/* 68 px en md+ es el alto exacto con que iclac.cl dibuja este mismo logo. */}
            <img src={`${import.meta.env.BASE_URL}icons/iclac.webp`} alt="ICLAC" className="h-9 w-auto object-contain sm:h-10 md:h-[4.25rem]" />
          </a>
          <div className="min-w-0 leading-tight">
            <h1 className="font-display text-[0.8125rem] font-semibold leading-tight text-gray-900 sm:text-base">
              {TEXTOS.titulo[idioma]}
            </h1>
            {/* El distintivo va en la línea de abajo y no al lado del título: al lado le quitaba
                70 px de los 360 del teléfono y el nombre salía en cuatro líneas. La bajada se
                esconde en teléfono, el distintivo no: que esto es un borrador tiene que verse
                en todos los anchos. */}
            <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
              <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-amber-800">
                {TEXTOS.borrador[idioma]}
              </span>
              <span className="hidden truncate sm:inline">{TEXTOS.bajada[idioma]}</span>
            </p>
          </div>
        </div>

        {/* El nav completo aparece en lg y no en md, igual que en el repositorio de inversiones:
            al lado de un título largo, entre 768 y 1023 px no queda ancho y el h1 se parte en
            varias líneas estirando el encabezado. */}
        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <nav className="flex items-center gap-4 font-display text-[0.8125rem]">
            {NAV.map((n) => (n.clave === 'recorrido'
              ? (
                <NavLink
                  key={n.a}
                  to={n.a}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                    enRecorrido
                      ? 'border-brand-dark bg-brand-dark font-semibold text-white'
                      : 'border-brand-dark/40 text-brand-dark hover:bg-brand hover:text-gray-900'
                  }`}
                >
                  <IconoRecorrido className="h-3 w-3 shrink-0" />
                  {TEXTOS.nav[n.clave][idioma]}
                </NavLink>
                )
              : (
                <NavLink key={n.a} to={n.a} className={clase}>
                  {TEXTOS.nav[n.clave][idioma]}
                </NavLink>
                )))}
          </nav>
          <span className="h-5 w-px bg-gray-300" aria-hidden />
          {botonesIdioma}
        </div>

        <button
          type="button"
          onClick={() => { setMenuAbierto((o) => !o) }}
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? TEXTOS.cerrarMenu[idioma] : TEXTOS.menu[idioma]}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-gray-700 hover:bg-brand hover:text-gray-900 lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
            {menuAbierto
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />}
          </svg>
        </button>
      </div>

      {menuAbierto && (
        <div className="absolute inset-x-0 top-full z-40 flex flex-col gap-1 border-b border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden">
          <nav className="flex flex-col font-display text-sm">
            {NAV.map((n) => (
              <NavLink
                key={n.a}
                to={n.a}
                onClick={() => { setMenuAbierto(false) }}
                className={({ isActive }) => `flex items-center gap-2 rounded px-2 py-2 hover:bg-brand hover:text-gray-900 ${
                  n.clave === 'recorrido'
                    ? (enRecorrido ? 'font-semibold text-brand-dark' : 'text-brand-dark')
                    : clase({ isActive })
                }`}
              >
                {n.clave === 'recorrido' && <IconoRecorrido className="h-3 w-3 shrink-0" />}
                {TEXTOS.nav[n.clave][idioma]}
              </NavLink>
            ))}
          </nav>
          <div className="mt-2 border-t border-gray-100 pt-2">{botonesIdioma}</div>
        </div>
      )}
    </header>
  )
}
