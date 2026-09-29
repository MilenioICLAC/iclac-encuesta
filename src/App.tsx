import { useEffect, useMemo, useState } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import type { Encuesta } from './nucleo/tipos'
import { filtrar } from './nucleo/agregar'
import BarraEstado from './componentes/BarraEstado'
import Graficador from './componentes/Graficador'
import Descargas from './componentes/Descargas'
import FichaTecnica from './componentes/FichaTecnica'
import Encabezado from './componentes/Encabezado'
import { useTranslation } from 'react-i18next'
import { useIdioma } from './locale'
import { HISTORIAS } from './historias/indice'
import MenuHistorias from './historias/MenuHistorias'
import { ProveedorTransicion } from './historias/Transicion'
import { NumeroHistoria, Siguiente } from './componentes/siguiente'
import { CORTES } from './nucleo/modulos'
import type { Vista } from './nucleo/explorador'

/**
 * Borrador del visualizador.
 *
 * Las **historias**, que afirman lo que se movió entre oleadas, y el **explorador**, para
 * consultar cualquier pregunta. Las historias salen de los bloques de la «Guía de contexto para
 * el visualizador» que Urdinez mandó el 02-09-2026.
 *
 * **La desagregación es global**, en la barra de estado del explorador, y no una por figura como
 * en el monitor actual. Un solo control además impide cruzar dos variables, que es una regla del
 * producto y no una preferencia.
 *
 * Lo que falta está en `la documentación interna`, no en la interfaz.
 */

export default function App () {
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null)
  const [error, setError] = useState<string | null>(null)

  // El recorte del explorador vive en su dirección (`RutaExplorador`); acá solo se recuerda la
  // última, para que quien lee una historia y vuelve a explorar lo encuentre como lo dejó.
  const [busquedaExplorador, setBusquedaExplorador] = useState('')

  // El idioma lo guarda i18next (`i18n.ts`), no un estado de acá. `App` se suscribe para que al
  // cambiarlo se vuelva a dibujar el árbol entero: los textos y el formato de los números.
  useIdioma()
  const { t } = useTranslation('paginas')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/encuesta.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Encuesta) => setEncuesta(d))
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="font-display text-xl font-semibold">{t('app.errorTitulo')}</h1>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <p className="mt-4 text-sm text-gray-600">
          {t('app.errorAntes')}{' '}
          <a href="https://iclac.cl/" className="text-brand-dark underline">iclac.cl</a>{t('app.errorDespues')}
        </p>
      </main>
    )
  }

  if (!encuesta) {
    return <main className="mx-auto max-w-2xl p-8 text-sm text-gray-500">{t('app.cargando')}</main>
  }

  return (
    // **Rutas por hash y no por ruta limpia.** El sitio todavía no tiene servidor elegido, y
    // `/explorar` como ruta real necesita que ese servidor devuelva el index en cualquier ruta.
    // Con hash funciona en cualquier hosting estático, incluido abrir el `dist/` a mano. Cuando
    // haya servidor con reescritura, esto pasa a `BrowserRouter` y no cambia nada más.
    <HashRouter>
      {/* La transición del menú a la portada cruza el cambio de ruta: vive fuera de `Routes`. */}
      <ProveedorTransicion>
      <Routes>
        <Route element={<Marco />}>
          {/* La raíz es el menú de historias. `#/recorrido` era la historia única de antes: los
              enlaces ya repartidos llegan al menú. */}
          <Route index element={<MenuHistorias encuesta={encuesta} />} />
          <Route path="recorrido" element={<Navigate to="/" replace />} />
          {/* Cada historia sabe cuál sigue, para ofrecerla en su cierre (`Siguiente`). */}
          {HISTORIAS.map(({ id, Componente }, i) => {
            const s = HISTORIAS[i + 1]
            return (
              <Route
                key={id}
                path={`historias/${id}`}
                element={(
                  <NumeroHistoria.Provider value={i + 1}>
                    <Siguiente.Provider value={s ? { numero: i + 2, nombre: s.nombre, pregunta: s.pregunta, ruta: `/historias/${s.id}` } : null}>
                      <Componente encuesta={encuesta} abierta />
                    </Siguiente.Provider>
                  </NumeroHistoria.Provider>
                )}
              />
            )
          })}
          {/* El tablero salió de la app (22-09-2026): sumaba las oleadas activas en cada módulo, y
              consultar pregunta por pregunta ya lo hace el explorador. Sus enlaces llegan ahí. */}
          <Route path="tablero" element={<Navigate to="/explorar" replace />} />
          <Route
            path="explorar"
            element={<RutaExplorador encuesta={encuesta} recordada={busquedaExplorador} onRecordar={setBusquedaExplorador} />}
          />
          <Route path="descargas" element={<Descargas />} />
          <Route path="ficha" element={<FichaTecnica encuesta={encuesta} />} />
          {/* Un hash escrito a mano o un enlace viejo no dejan al lector en una página en blanco. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </ProveedorTransicion>
    </HashRouter>
  )
}

/**
 * El explorador con su estado en la dirección: `#/explorar?p=p7&vista=serie&ola=2024&corte=edad_rec`.
 *
 * **La dirección es la única fuente**, no una copia de un estado de React: con dos fuentes, el
 * primer render escribía los valores por omisión encima del enlace que se acababa de abrir. Un
 * enlace lleva a una pregunta en un estado exacto (lo usa el dashboard de decisiones), el botón de
 * atrás no se llena de pasos porque se reemplaza la entrada, y al volver al explorador desde otra
 * vista se retoma la última búsqueda, que `App` recuerda.
 *
 * **Una oleada a la vez** (Felipe, 22-09-2026): nada suma oleadas. Sin `ola`, la última.
 */
function RutaExplorador ({ encuesta, recordada, onRecordar }: { encuesta: Encuesta, recordada: string, onRecordar: (b: string) => void }) {
  const [params, setParams] = useSearchParams()
  const busqueda = params.toString()
  useEffect(() => { if (busqueda) onRecordar(busqueda) }, [busqueda, onRecordar])

  const olaPedida = Number(params.get('ola'))
  const ola = encuesta.olas.includes(olaPedida) ? olaPedida : encuesta.olas[encuesta.olas.length - 1]
  const cortePedido = params.get('corte')
  const corte = CORTES.some((c) => c.nombre !== null && c.nombre === cortePedido) ? cortePedido : null
  const soloIndependientes = params.get('independientes') === '1'
  const pregunta = encuesta.preguntas.some((x) => x.id === params.get('p')) ? params.get('p')! : 'p26'
  const vista: Vista = params.get('vista') === 'serie' ? 'serie' : 'ola'

  const casos = useMemo(() => filtrar(encuesta, { olas: [ola], soloIndependientes }), [encuesta, ola, soloIndependientes])

  if (!busqueda && recordada) return <Navigate to={`/explorar?${recordada}`} replace />

  const cambiar = (cambios: Record<string, string | null>) => {
    const siguiente = new URLSearchParams(params)
    if (!siguiente.has('p')) siguiente.set('p', pregunta)
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null) siguiente.delete(k)
      else siguiente.set(k, v)
    }
    setParams(siguiente, { replace: true })
  }

  const p = encuesta.preguntas.find((x) => x.id === pregunta) ?? encuesta.preguntas[0]
  const serie = vista === 'serie' && p.serie != null

  return (
    <>
      <BarraEstado
        olas={encuesta.olas}
        preguntas={encuesta.preguntas}
        pregunta={p}
        // Una pregunta que no se compara deja la vista de una oleada también en la dirección: si
        // no, `vista=serie` quedaba latente y reaparecía con la siguiente pregunta (Codex).
        onPregunta={(id) => cambiar({ p: id, vista: vista === 'serie' && encuesta.preguntas.find((x) => x.id === id)?.serie ? 'serie' : null })}
        vista={serie ? 'serie' : 'ola'}
        onVista={(v) => cambiar({ vista: v === 'serie' ? 'serie' : null })}
        ola={ola}
        // Elegir una oleada es pedir verla: sale de «Entre oleadas».
        onOla={(o) => cambiar({ ola: String(o), vista: null })}
        corte={corte}
        onCorte={(c) => cambiar({ corte: c })}
        soloIndependientes={soloIndependientes}
        onSoloIndependientes={(v) => cambiar({ independientes: v ? '1' : null })}
        // Entre oleadas los casos de una oleada no describen la figura: sus bases van en ella.
        n={serie ? null : casos.length}
      />
      <Graficador
        encuesta={encuesta}
        pregunta={pregunta}
        vista={vista}
        ola={ola}
        onOla={(o) => cambiar({ ola: String(o), vista: null })}
        corte={corte}
        soloIndependientes={soloIndependientes}
      />
    </>
  )
}

/**
 * Las instituciones del pie: las del monitor anterior de Bastián Olea, con un cambio. El logo
 * ANID + Milenio pasa a MinCiencia + ANID en su variante monocroma, como en el mapa de inversiones
 * (30-07-2026): el ministerio que lo firmaba ya no corresponde, y la marca Milenio sale con él.
 * Los de las universidades vienen del monitor en gris y con margen propio dentro de un lienzo de
 * 380 × 160; por eso van más altos que el SVG, que llega recortado al borde.
 *
 * `clave` es la del nombre en `paginas.json` (`app.instituciones`), que se lee en cada idioma.
 */
const INSTITUCIONES = [
  { src: 'minciencia-anid.svg', clave: 'minciencia', href: 'https://anid.cl/', alto: 'h-12 sm:h-14' },
  { src: 'uc.png', clave: 'uc', href: 'https://www.uc.cl/', alto: 'h-14 sm:h-16' },
  { src: 'uchile.png', clave: 'uchile', href: 'https://uchile.cl/', alto: 'h-14 sm:h-16' },
  { src: 'ucn.png', clave: 'ucn', href: 'https://www.ucn.cl/', alto: 'h-14 sm:h-16' },
  { src: 'uta.png', clave: 'uta', href: 'https://www.uta.cl/', alto: 'h-14 sm:h-16' }
]

/**
 * El marco de todas las vistas: encabezado pegado arriba, la vista, y el pie de crédito.
 *
 * **Cada destino del nav es una vista con su URL.** Antes era una sola página con anclas, y una
 * página que se scrollea sin fin no se recorre: se abandona. Separada en vistas, cada una entra
 * en una o dos pantallas, el botón de atrás del navegador funciona, y un enlace a `#/descargas`
 * lleva a las descargas.
 *
 * **El recorte del explorador no se pierde al cambiar de vista.** El estado vive en `App`, que no
 * se desmonta: quien elige 2025, lee una historia y vuelve a explorar sigue con 2025.
 */
function Marco () {
  const { t: tp } = useTranslation('paginas')
  const { pathname, search } = useLocation()

  // Cambiar de vista deja la vista nueva empezada por la mitad si se hereda el desplazamiento
  // de la anterior, que es más larga. **Salvo cuando la URL pide un estado** (`#/explorar?p=…`):
  // ahí el destino lo fija ella, y mandar la vista arriba deshace el salto que el propio enlace
  // acaba de hacer.
  useEffect(() => { if (!search) window.scrollTo(0, 0) }, [pathname, search])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 text-gray-900">
      <Encabezado />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pt-5 sm:gap-x-6">
          {INSTITUCIONES.map(l => (
            <li key={l.src}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="block">
                <img src={`${import.meta.env.BASE_URL}icons/${l.src}`} alt={tp(`app.instituciones.${l.clave}`)} className={`w-auto object-contain ${l.alto}`} />
              </a>
            </li>
          ))}
        </ul>
        {/* Quién lo hizo. Las instituciones ya están arriba con su logo, cada uno enlazado al
            suyo, e iclac.cl sigue a un clic desde el logo del encabezado en todas las vistas.
            El nombre no se traduce. */}
        {/* Centrado y no `justify-between`: con los logos centrados arriba y un solo ítem acá,
            alineado a la izquierda quedaba como un resto de la línea anterior. */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-xs text-gray-500">
          <a
            href="https://www.linkedin.com/in/felipesotojorquera/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-dark"
          >
            Felipe Soto Jorquera
          </a>
        </div>
      </footer>
    </div>
  )
}
