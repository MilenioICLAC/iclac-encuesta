import { useEffect, useMemo, useState } from 'react'
import { HashRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import type { Encuesta } from './nucleo/tipos'
import { filtrar, personasRepetidas } from './nucleo/agregar'
import BarraEstado from './componentes/BarraEstado'
import Graficador from './componentes/Graficador'
import Descargas from './componentes/Descargas'
import Contrastes, { ComoSeLee } from './componentes/Contrastes'
import MetodoHistorias, { Plegable } from './componentes/MetodoHistorias'
import Encabezado from './componentes/Encabezado'
import { fijarIdioma, locale, numero, type Idioma } from './locale'
import { TEXTOS } from './textos'
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
      .then((d: Encuesta) => setEncuesta(d))
      .catch((e: Error) => setError(e.message))
  }, [])

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

  if (!encuesta) {
    return <main className="mx-auto max-w-2xl p-8 text-sm text-gray-500">Cargando…</main>
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
            element={<RutaExplorador encuesta={encuesta} recordada={busquedaExplorador} onRecordar={setBusquedaExplorador} />}
          />
          <Route path="descargas" element={<Descargas />} />
          <Route path="datos" element={<SobreLosDatos encuesta={encuesta} />} />
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
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 text-gray-900">
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
 * La vista «Sobre los datos»: lo que hay que saber antes de citar una cifra, y el respaldo de cada
 * historia (el destino de los enlaces «Cómo se hizo»).
 *
 * **Arriba lo que necesita quien cita, abajo lo que necesita quien audita.** Lo primero va a la
 * vista, en cinco tarjetas; lo segundo va plegado, historia por historia, para que la página entre en
 * pocas pantallas y cada cosa se encuentre por su nombre. Una prueba se escribe una sola vez
 * (`Evidencia`).
 */
/** Abre la sección y cada sección que la contiene (`metodo-recta` vive dentro de `metodo-mirada`). */
function abrir (nodo: HTMLElement) {
  for (let n: HTMLElement | null = nodo; n; n = n.parentElement?.closest('details') ?? null) {
    if (n instanceof HTMLDetailsElement) n.open = true
  }
}

/**
 * Lleva el foco al destino sin mover la vista: quien navega con teclado o lector de pantalla sigue
 * desde ahí y no desde el enlace que tocó. En un `<details>` el foco va a su resumen, que ya es enfocable.
 */
function enfocar (nodo: HTMLElement) {
  const destino = nodo instanceof HTMLDetailsElement ? nodo.querySelector('summary') : nodo
  destino?.focus({ preventScroll: true })
}

function SobreLosDatos ({ encuesta }: { encuesta: Encuesta }) {
  // `#/datos?foco=<id>` abre la sección y lleva la vista hasta ella. Es lo que hace que el enlace desde
  // una historia caiga en su método y no al principio de la página.
  const [parametros] = useSearchParams()
  const foco = parametros.get('foco')
  useEffect(() => {
    if (!foco) return
    // `metodo-recorrido` es el ancla vieja de todos los enlaces: lleva al método de las historias.
    const nodo = document.getElementById(foco === 'metodo-recorrido' ? 'historias' : foco)
    if (!nodo) return
    // Abrir antes de medir: cerrada, la sección mide lo que su resumen.
    abrir(nodo)
    // **El alto del encabezado se mide, no se escribe.** El encabezado publica el suyo en
    // `--alto-encabezado` (79 px en teléfono, 88 en escritorio).
    const ir = (suave: boolean) => {
      const alto = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--alto-encabezado'), 10) || 0
      const destino = nodo.getBoundingClientRect().top + window.scrollY - alto - 16
      window.scrollTo({ top: Math.max(0, destino), behavior: suave ? 'smooth' : 'auto' })
    }
    ir(true)
    enfocar(nodo)
    // **Y otra vez cuando las fuentes terminen de cargar.** Raleway llega después del primer dibujo y
    // cambia el alto de lo que está encima; el segundo salto no es suave para no competir con el primero.
    let vivo = true
    void document.fonts?.ready.then(() => { if (vivo) requestAnimationFrame(() => { ir(false) }) })
    return () => { vivo = false }
  }, [foco])

  // Lo plegado se imprime abierto: una sección cerrada no sale en papel.
  useEffect(() => {
    const abrir = () => { document.querySelectorAll('details.plegable').forEach((d) => { (d as HTMLDetailsElement).open = true }) }
    window.addEventListener('beforeprint', abrir)
    return () => { window.removeEventListener('beforeprint', abrir) }
  }, [])

  const c = encuesta.contrastes
  const citar: [string, React.ReactNode][] = [
    ['Tres oleadas, tres muestras.', <>{encuesta.olas.map((o) => `${o}: ${numero(encuesta.n[o])}`).join(' · ')} casos. No se sigue a nadie entre oleadas: {numero(personasRepetidas(encuesta))} personas contestaron más de una vez, y el explorador permite excluirlas.</>],
    ['Sin ponderar y sin margen de error.', 'Es un panel en línea por cuotas, no una muestra probabilística: las cifras describen a las personas encuestadas, no estiman a Chile.'],
    ['Porcentajes sobre respuestas efectivas.', 'Sin los que no contestaron. Cada figura muestra su base, que suele ser menor que el total.'],
    ['Mismo nombre no es misma pregunta.', 'Algunas cambiaron de enunciado o de categorías entre oleadas. El explorador marca cada una como comparable o no, según el diccionario de ICLAC.'],
  ]

  const indice: [string, string][] = [
    ['citar', 'Antes de citar'],
    ['historias', 'Qué sostiene cada historia'],
    ['como-se-lee', 'Cómo se prueba una diferencia'],
    ['todas', 'Todas las comparaciones'],
  ]
  const irA = (id: string) => {
    const nodo = document.getElementById(id)
    if (!nodo) return
    abrir(nodo)
    const alto = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--alto-encabezado'), 10) || 0
    window.scrollTo({ top: Math.max(0, nodo.getBoundingClientRect().top + window.scrollY - alto - 16), behavior: 'smooth' })
    enfocar(nodo)
  }

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-sm text-gray-600">
      <h2 className="font-display text-2xl font-semibold text-gray-900">Sobre los datos</h2>
      <p className="mt-2 max-w-2xl">
        Lo que hay que saber antes de citar una cifra, y cómo se sostiene cada frase de las historias.
      </p>
      <nav aria-label="En esta página" className="mt-4 flex flex-wrap gap-2">
        {indice.map(([id, texto]) => (
          <button key={id} type="button" onClick={() => { irA(id) }}
            className="presionable rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:border-brand-dark hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark">
            {texto}
          </button>
        ))}
      </nav>

      <h3 id="citar" tabIndex={-1} className="mt-8 outline-none font-display text-base font-semibold text-gray-900">Antes de citar una cifra</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {citar.map(([titulo, texto]) => (
          <li key={titulo} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium text-gray-900">{titulo}</p>
            <p className="mt-1 text-xs leading-snug">{texto}</p>
          </li>
        ))}
      </ul>

      {c && (
        <>
          <h3 id="historias" tabIndex={-1} className="mt-10 outline-none font-display text-base font-semibold text-gray-900">Qué sostiene cada historia</h3>
          <p className="mt-2 max-w-2xl">
            Cada frase que afirma un cambio o una diferencia depende de una de estas pruebas. En cada fila,
            la raya vertical es el cero, el punto es la diferencia y la línea, su intervalo del 95 %. Si
            la línea cruza el cero, la fila dice «parejo» y la historia no elige ganador.
          </p>
          <div className="mt-3">
            <MetodoHistorias encuesta={encuesta} />
          </div>

          <h3 className="mt-10 font-display text-base font-semibold text-gray-900">Método</h3>
          <div className="mt-3 rounded-lg border border-gray-200 bg-white px-4">
            <Plegable id="como-se-lee" resumen={<><span className="font-medium text-gray-900">Cómo se prueba una diferencia</span><span className="block text-gray-500">El p, el intervalo, la composición fija y por qué no es margen de error</span></>}>
              <ComoSeLee rondas={c.metodo.rondas} />
            </Plegable>
            <Plegable id="todas" resumen={<><span className="font-medium text-gray-900">Todas las comparaciones entre oleadas</span><span className="block text-gray-500">{numero(c.medidas.length)} medidas en una tabla, incluidas las que ninguna historia usa</span></>}>
              <Contrastes contrastes={c} />
            </Plegable>
          </div>
        </>
      )}
    </section>
  )
}
