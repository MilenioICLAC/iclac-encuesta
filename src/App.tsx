import { useEffect, useMemo, useState } from 'react'
import { HashRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import type { Encuesta } from './nucleo/tipos'
import { filtrar } from './nucleo/agregar'
import BarraEstado from './componentes/BarraEstado'
import Graficador from './componentes/Graficador'
import Descargas from './componentes/Descargas'
import Contrastes from './componentes/Contrastes'
import MetodoRecorrido from './componentes/MetodoRecorrido'
import MetodoHistorias from './componentes/MetodoHistorias'
import Encabezado from './componentes/Encabezado'
import { fijarIdioma, locale, numero, type Idioma } from './locale'
import { TEXTOS } from './textos'
import { HISTORIAS } from './historias/indice'
import MenuHistorias from './historias/MenuHistorias'
import { NumeroHistoria, Siguiente } from './componentes/siguiente'

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
 * Lo que falta está anotado en «Sobre los datos», a la vista y no en un comentario.
 */

export default function App () {
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null)
  const [error, setError] = useState<string | null>(null)

  // **Una oleada a la vez** (Felipe, 22-09-2026): nada suma oleadas. Arranca en la última.
  const [ola, setOla] = useState<number | null>(null)
  const [corte, setCorte] = useState<string | null>(null)
  const [soloIndependientes, setSoloIndependientes] = useState(false)

  // El idioma vive acá arriba y no en el encabezado: además de los textos del cromo gobierna el
  // formato de los números, que se resuelve en `locale.ts` y lo usa toda la página.
  const [idioma, setIdioma] = useState<Idioma>('es')
  const cambiarIdioma = (siguiente: Idioma) => {
    fijarIdioma(siguiente)
    setIdioma(siguiente)
    document.documentElement.lang = locale()
  }

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/encuesta.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Encuesta) => { setEncuesta(d); setOla(d.olas[d.olas.length - 1]) })
      .catch((e: Error) => setError(e.message))
  }, [])

  const casos = useMemo(
    () => (encuesta && ola !== null ? filtrar(encuesta, { olas: [ola], soloIndependientes }) : []),
    [encuesta, ola, soloIndependientes],
  )

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="font-display text-xl font-semibold">No se pudieron cargar los datos</h1>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <p className="mt-4 text-sm text-gray-600">
          El artefacto se genera con <code className="rounded bg-gray-100 px-1">npm run etl:combinada</code>,
          que lee la base canónica de <code className="rounded bg-gray-100 px-1">data/sources/combinada/</code>.
        </p>
      </main>
    )
  }

  if (!encuesta || ola === null) {
    return <main className="mx-auto max-w-2xl p-8 text-sm text-gray-500">Cargando…</main>
  }

  const barra = (
    <BarraEstado
      olas={encuesta.olas}
      ola={ola}
      onOla={setOla}
      corte={corte}
      onCorte={setCorte}
      soloIndependientes={soloIndependientes}
      onSoloIndependientes={setSoloIndependientes}
      n={casos.length}
    />
  )

  return (
    // **Rutas por hash y no por ruta limpia.** El sitio todavía no tiene servidor elegido, y
    // `/explorar` como ruta real necesita que ese servidor devuelva el index en cualquier ruta.
    // Con hash funciona en cualquier hosting estático, incluido abrir el `dist/` a mano. Cuando
    // haya servidor con reescritura, esto pasa a `BrowserRouter` y no cambia nada más.
    <HashRouter>
      <Routes>
        <Route element={<Marco idioma={idioma} onIdioma={cambiarIdioma} />}>
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
            element={(
              <>
                {barra}
                <Graficador
                  encuesta={encuesta}
                  casos={casos}
                  corte={corte}
                  soloIndependientes={soloIndependientes}
                  ola={ola}
                />
              </>
            )}
          />
          <Route path="descargas" element={<Descargas />} />
          <Route path="datos" element={<SobreLosDatos encuesta={encuesta} />} />
          {/* Un hash escrito a mano o un enlace viejo no dejan al lector en una página en blanco. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

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
function Marco ({ idioma, onIdioma }: { idioma: Idioma, onIdioma: (i: Idioma) => void }) {
  const { pathname, search } = useLocation()

  // Cambiar de vista deja la vista nueva empezada por la mitad si se hereda el desplazamiento
  // de la anterior, que es más larga. **Salvo cuando la URL pide una sección**
  // (`#/datos?foco=…`): ahí el destino lo fija ella, y mandar la vista arriba deshace el salto
  // que el propio enlace acaba de hacer.
  useEffect(() => { if (!search) window.scrollTo(0, 0) }, [pathname, search])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Encabezado idioma={idioma} onIdioma={onIdioma} />
      {idioma !== 'es' && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          {TEXTOS.soloCromo[idioma]}
        </p>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs text-gray-500">
          <span>
            Núcleo Milenio Impactos de China en América Latina y el Caribe ·{' '}
            <a href="https://iclac.cl/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-dark">
              iclac.cl
            </a>
          </span>
          <NavLink to="/datos" className="underline hover:text-brand-dark">
            {TEXTOS.nav.datos[idioma]}
          </NavLink>
        </div>
      </footer>
    </div>
  )
}

/**
 * La vista «Sobre los datos»: lo que hay que saber antes de citar una cifra.
 *
 * Era el pie de la página única. Como vista tiene destino propio en el nav y en el pie de
 * crédito, que es donde alguien la va a buscar cuando ya vio una figura y quiere saber sobre
 * qué está parada.
 */
function SobreLosDatos ({ encuesta }: { encuesta: Encuesta }) {
  // `#/datos?foco=metodo-<id>` lleva la vista al bloque. Es lo que hace que el enlace desde una
  // historia caiga en su sección y no al principio de la página.
  const [parametros] = useSearchParams()
  const foco = parametros.get('foco')
  useEffect(() => {
    if (!foco) return
    const nodo = document.getElementById(foco)
    if (!nodo) return
    // **El alto del encabezado se mide, no se escribe.** `scroll-margin-top` en clase fija un
    // número que ya cambió dos veces (79 px en teléfono, 88 en escritorio), y el encabezado
    // publica el suyo en `--alto-encabezado`. Con `scroll-margin` a mano el título quedaba
    // debajo de la barra: 72 px de posición contra 79 de encabezado.
    const ir = (suave: boolean) => {
      const alto = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--alto-encabezado'), 10) || 0
      const destino = nodo.getBoundingClientRect().top + window.scrollY - alto - 16
      window.scrollTo({ top: Math.max(0, destino), behavior: suave ? 'smooth' : 'auto' })
    }
    ir(true)
    // **Y otra vez cuando las fuentes terminen de cargar.** Raleway llega después del primer
    // dibujo y cambia el alto de todo lo que está encima: medido, el destino se corría 40 px y el
    // título terminaba debajo del encabezado. El segundo salto no es suave para que no compita
    // con el primero si el lector ya empezó a moverse.
    let vivo = true
    void document.fonts?.ready.then(() => { if (vivo) requestAnimationFrame(() => { ir(false) }) })
    return () => { vivo = false }
  }, [foco])

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="font-display text-2xl font-semibold text-gray-900">Sobre los datos</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Lo que hay que saber antes de citar una cifra de este sitio.
      </p>
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-display text-base font-semibold text-gray-900">Cómo se leen las cifras</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>
            {encuesta.olas.map((o) => `${o}: ${numero(encuesta.n[o])} casos`).join(' · ')}. {encuesta.procedencia}
          </li>
          <li>
            <strong>Las cifras de 2025 no coinciden con las del monitor anterior, y es esperable.</strong> Ese
            sitio calcula sobre una submuestra de 662 casos que se armó con un script corrido dos veces sobre
            hojas ordenadas distinto. Acá se usa la entrega completa de 1.228, así que la opinión sobre China
            da 65,8 en vez de 67,0. Cuál de las dos se publica es decisión de ICLAC.
          </li>
          <li>
            <strong>Sin ponderadores.</strong> Es un panel en línea por cuotas, así que la muestra no es
            probabilística: los resultados van sin ponderar y no se declara margen de error.
          </li>
          <li>
            <strong>No es un panel.</strong> Son tres cortes transversales. 159 personas participaron en
            más de una oleada y se pueden excluir con el control del explorador.
          </li>
          <li>
            <strong>Los porcentajes van sobre respuestas efectivas</strong>, sin perdidos. Cada figura
            muestra su propia base, que suele ser menor que el total del recorte.
          </li>
        </ul>

        {encuesta.contrastes && <Contrastes contrastes={encuesta.contrastes} olas={encuesta.olas} />}

        {/* `metodo-recorrido` queda como ancla para los enlaces ya repartidos. */}
        <div id="metodo-recorrido">
          <MetodoRecorrido encuesta={encuesta} />
        </div>
        <MetodoHistorias encuesta={encuesta} />

        <h3 className="mt-8 font-display text-base font-semibold text-gray-900">Qué falta en este borrador</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-gray-500">
          <li>Los textos de las historias viven en el código; tienen que salir a un archivo de contenido con los tres idiomas.</li>
          <li>Las nubes de palabras no reproducen exactamente las del sitio: el monitor lematiza con Snowball y acá se normalizan los sufijos a mano.</li>
          <li>
            El sitio todavía no está en inglés ni en chino: el selector de idioma cambia el nav, los
            títulos del encabezado y el formato de los números, pero las figuras, sus notas y las
            historias siguen en español.
          </li>
        </ul>
      </div>
    </section>
  )
}
