import { useEffect, useMemo, useState } from 'react'
import { HashRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import type { Encuesta } from './nucleo/tipos'
import { distribucion, filtrar, media, multirespuesta, porGrupo, proporcion, serie } from './nucleo/agregar'
import { CORTES, MODULOS, TERMOMETRO, variableDe, valorDe } from './nucleo/modulos'
import BarraEstado from './componentes/BarraEstado'
import Modulo from './componentes/Modulo'
import Distribucion from './componentes/Distribucion'
import Menciones from './componentes/Menciones'
import PorRegion from './componentes/PorRegion'
import Serie from './componentes/Serie'
import Graficador from './componentes/Graficador'
import Ideologia from './componentes/Ideologia'
import Nubes from './componentes/Nubes'
import Densidad from './componentes/Densidad'
import Puntos from './componentes/Puntos'
import CapaRecorrido, { Escena } from './componentes/CapaRecorrido'
import Descargas from './componentes/Descargas'
import Encabezado from './componentes/Encabezado'
import { escalaRedonda } from './nucleo/escala'
import { SEMANTICOS, pasosDeOrden } from './nucleo/paleta'
import { decimal, fijarIdioma, locale, numero, porcentaje, type Idioma } from './locale'
import { TEXTOS } from './textos'

/**
 * Borrador del visualizador.
 *
 * Dos tramos en una página, en este orden: el **recorrido**, que cuenta qué se movió entre
 * oleadas, y el **tablero**, para consultar. La estructura sale de la «Guía de contexto para
 * el visualizador» que Urdinez mandó el 02-09-2026: los tres hallazgos que abren el recorrido
 * y los seis bloques temáticos que agrupan el tablero son suyos, no nuestros.
 *
 * Tres decisiones que se ven en el código y conviene no deshacer sin querer:
 *
 *  - **La desagregación es global**, en la barra de estado, y no una por tarjeta como en el
 *    monitor actual. Un solo control además impide cruzar dos variables, que es una regla del
 *    producto y no una preferencia.
 *  - **El tablero arranca limpio**: no hereda el recorte del recorrido, para que nadie quede
 *    leyendo un filtro que no eligió.
 *  - **Los módulos son una rejilla temática, no una secuencia.** Ordenarlos afirmaría un
 *    argumento que nadie escribió.
 *
 * Lo que falta está anotado al pie de la página, a la vista y no en un comentario.
 */

export default function App () {
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [olas, setOlas] = useState<number[]>([])
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
      .then((d: Encuesta) => { setEncuesta(d); setOlas(d.olas) })
      .catch((e: Error) => setError(e.message))
  }, [])

  const casos = useMemo(
    () => (encuesta ? filtrar(encuesta, { olas, soloIndependientes }) : []),
    [encuesta, olas, soloIndependientes],
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

  if (!encuesta) {
    return <main className="mx-auto max-w-2xl p-8 text-sm text-gray-500">Cargando…</main>
  }

  const barra = (
    <BarraEstado
      olas={encuesta.olas}
      olasActivas={olas}
      onOlas={setOlas}
      corte={corte}
      onCorte={setCorte}
      soloIndependientes={soloIndependientes}
      onSoloIndependientes={setSoloIndependientes}
      n={casos.length}
    />
  )

  return (
    // **Rutas por hash y no por ruta limpia.** El sitio todavía no tiene servidor elegido, y
    // `/tablero` como ruta real necesita que ese servidor devuelva el index en cualquier ruta.
    // Con hash funciona en cualquier hosting estático, incluido abrir el `dist/` a mano. Cuando
    // haya servidor con reescritura, esto pasa a `BrowserRouter` y no cambia nada más.
    <HashRouter>
      <Routes>
        <Route element={<Marco idioma={idioma} onIdioma={cambiarIdioma} />}>
          <Route index element={<Recorrido encuesta={encuesta} />} />
          <Route
            path="tablero"
            element={(
              <>
                {barra}
                <Tablero
                  encuesta={encuesta}
                  casos={casos}
                  corte={corte}
                  soloIndependientes={soloIndependientes}
                  olas={olas}
                />
                <Nubes encuesta={encuesta} />
              </>
            )}
          />
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
 * **El recorte del tablero no se pierde al cambiar de vista.** El estado vive en `App`, que no se
 * desmonta: quien elige 2025 y va a explorar sigue con 2025.
 */
function Marco ({ idioma, onIdioma }: { idioma: Idioma, onIdioma: (i: Idioma) => void }) {
  const { pathname } = useLocation()

  // Cambiar de vista deja la vista nueva empezada por la mitad si se hereda el desplazamiento
  // de la anterior, que es más larga.
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

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
 * El recorrido, con los tres hallazgos que la guía propone para ordenar la narrativa.
 *
 * **Los textos son datos, no código.** Hoy están acá porque es un borrador, pero cada tramo
 * tiene que salir de un archivo de contenido con sus tres idiomas: así, que ICLAC entregue
 * tarde deja de bloquear el desarrollo.
 *
 * Y las cifras se calculan, no se transcriben. Es la diferencia entre una frase que envejece
 * mal y una que se corrige sola al incorporar una oleada.
 */
/**
 * Qué puntos enciende cada paso del primer tramo.
 *
 * Va como tabla y no repartido por el texto porque es la parte que hay que poder auditar de un
 * vistazo: es lo único que decide qué dato se muestra y qué dato se calla. **El último paso
 * enciende todo**, que es la garantía de que el recorrido no termina escondiendo nada, y el
 * estado sin JavaScript o con `prefers-reduced-motion` (ver `nucleo/pasos.ts`).
 */
function encendidos (olas: number[]) {
  const ultima = olas.at(-1)
  const dosPotencias = (pais: string) => pais === 'China' || pais === 'Estados Unidos'
  return [
    // Las dos potencias, sin la última oleada todavía: el paso habla de 2023 y 2024.
    (pais: string, ola: number) => dosPotencias(pais) && ola !== ultima,
    (pais: string) => dosPotencias(pais),
    (pais: string) => dosPotencias(pais) || pais === 'Japón',
    () => true,
  ]
}

/**
 * El año del dato más nuevo que ya entró, en grande y arriba de la figura.
 *
 * Hace el trabajo que la leyenda sola no hace: dice de qué oleada habla **este** paso, sin mandar
 * la vista fuera de la figura y traerla de vuelta. Va fuera del lienzo porque flotando sobre los
 * puntos chocaba con la fila de arriba, que es la del país mejor evaluado.
 */
function AnioDelPaso ({ olas, tonos, hasta }: { olas: number[], tonos: string[], hasta: number }) {
  return (
    <div className="mb-1 flex justify-end">
      <span
        className="font-display text-[34px] font-bold leading-none tracking-tight tabular-nums opacity-40 transition-colors duration-500"
        style={{ color: tonos[hasta] }}
        aria-hidden
      >
        {olas[hasta]}
      </span>
    </div>
  )
}

/**
 * Qué color es qué oleada, al pie de la figura y a la derecha.
 *
 * **La muestra es el punto, del mismo tamaño que tiene en la figura**, incluido el crecimiento por
 * oleada: la leyenda tiene que verse como lo que el lector está mirando. Con barras de color había
 * que traducir de barra a punto.
 */
function LeyendaDeOleadas ({ olas, tonos }: { olas: number[], tonos: string[] }) {
  return (
    <ul className="ml-auto flex flex-wrap items-center justify-end gap-x-3.5 gap-y-1">
      {olas.map((ola, i) => (
        <li key={ola} className="flex items-center gap-1.5 text-[11px] tabular-nums text-gray-500">
          <span
            className="inline-block shrink-0 rounded-full"
            style={{ backgroundColor: tonos[i], width: 8 + i * 2, height: 8 + i * 2 }}
          />
          {ola}
        </li>
      ))}
    </ul>
  )
}

function Recorrido ({ encuesta }: { encuesta: Encuesta }) {
  const todos = (ola: number) => filtrar(encuesta, { olas: [ola] })

  // Una fila por país y un punto por oleada, ordenadas por la última oleada. Con tres
  // encuestas sueltas una línea prometería interpolación que no existe, y cinco líneas que se
  // cruzan obligarían a distinguir todos los pares de color contra todos, que es el caso donde
  // la paleta topa en tres (un registro de decisiones interno). Acá el color son las tres oleadas y el nombre del país
  // carga la identidad, así que el tope alcanza justo.
  const termometro = TERMOMETRO.map((p) => ({
    ...p,
    valores: encuesta.olas.map((ola) => media(todos(ola), p.nombre)),
  }))
  const ordenados = [...termometro].sort((a, b) => (b.valores.at(-1)?.media ?? 0) - (a.valores.at(-1)?.media ?? 0))
  const escalaTermometro = escalaRedonda(termometro.flatMap((t) => t.valores.map((v) => v.media)), 5)

  const chinaT = termometro[0].valores
  const eeuuT = termometro[1].valores
  const subeChina = (chinaT.at(-1)?.media ?? 0) - (chinaT.at(-2)?.media ?? 0)
  const bajaEeuu = (eeuuT.at(-2)?.media ?? 0) - (eeuuT.at(-1)?.media ?? 0)
  // El mayor movimiento de cualquier país entre las dos primeras oleadas. Se calcula en vez de
  // escribirse porque la frase que lo usa deja de ser cierta el día que entre una oleada nueva.
  const quietas = Math.max(...termometro.map((t) => Math.abs((t.valores[1]?.media ?? 0) - (t.valores[0]?.media ?? 0))))
  // El singular se decide sobre el número que se **muestra**, no sobre el crudo. Con el crudo, el
  // mayor movimiento (0,973) se escribe «1,0» y se leía «más de 1,0 puntos».
  const quietasRedondo = Math.round(quietas * 10) / 10
  // El mejor evaluado sale de los datos, no del texto: hoy es Japón, y la frase que lo nombra se
  // corrige sola si deja de serlo. `siempreMejor` es lo que habilita decir «sigue», que es una
  // afirmación sobre las tres oleadas y no sobre la última.
  const mejor = ordenados[0]
  const siempreMejor = encuesta.olas.every((_, i) =>
    termometro.every((t) => (t.valores[i]?.media ?? 0) <= (mejor.valores[i]?.media ?? 0)))
  // El titular afirma quién quedó por encima en la última oleada, así que se arma con el dato y
  // no se escribe: el día que entre una oleada que dé vuelta la serie, el título se da vuelta con
  // ella en vez de quedar publicado diciendo lo contrario de su propia figura.
  const chinaSobreEeuu = (chinaT.at(-1)?.media ?? 0) > (eeuuT.at(-1)?.media ?? 0)
  const pasosEncendidos = encendidos(encuesta.olas)
  const bases = termometro.flatMap((t) => t.valores.map((v) => v.base)).filter((n) => n > 0)
  const baseMinima = Math.min(...bases)
  const baseMaxima = Math.max(...bases)

  const p24 = variableDe(encuesta, 'p24')
  const p25 = variableDe(encuesta, 'p25')
  const p26 = variableDe(encuesta, 'p26')

  const confianza = p24
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p24, [1]).porcentaje, base: todos(ola).length }))
    : []
  // La misma pregunta sobre la otra potencia. Va en la figura y no solo en el texto: la frase
  // afirma que la brecha se abre por un lado solo, y esa afirmación se lee comparando dos series.
  const confianzaEeuu = p25
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p25, [1]).porcentaje, base: todos(ola).length }))
    : []
  const subeConfChina = (confianza.at(-1)?.valor ?? 0) - (confianza.at(0)?.valor ?? 0)
  const subeConfEeuu = (confianzaEeuu.at(-1)?.valor ?? 0) - (confianzaEeuu.at(0)?.valor ?? 0)
  // La afirmación «por primera vez China queda por encima» se comprueba, no se escribe: el día que
  // entre una oleada nueva, la frase se corrige sola o desaparece.
  const encimaPorPrimeraVez = confianza.length > 1 && confianzaEeuu.length === confianza.length &&
    (confianza.at(-1)?.valor ?? 0) > (confianzaEeuu.at(-1)?.valor ?? 0) &&
    confianza.slice(0, -1).every((c, i) => c.valor <= (confianzaEeuu[i]?.valor ?? 0))

  const noAlineado = p26
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p26, [3, 4]).porcentaje, base: todos(ola).length }))
    : []
  const proChina = p26
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p26, [1]).porcentaje, base: todos(ola).length }))
    : []
  const proEeuu = p26
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p26, [2]).porcentaje, base: todos(ola).length }))
    : []

  const primera = noAlineado.at(0)?.valor ?? 0
  const ultima = noAlineado.at(-1)?.valor ?? 0

  const [abierta, setAbierta] = useState(false)

  // Las oleadas son una secuencia, no tres categorías sueltas: van en un tono de claro a oscuro,
  // que es la paleta de orden del proyecto. Con tres colores distintos hay que aprenderse cuál es
  // cuál; con la rampa, más oscuro es más nuevo y no hay nada que memorizar.
  const tonos = pasosDeOrden(encuesta.olas.length)
  const serieTermometro = encuesta.olas.map((ola, i) => ({
    clave: String(ola),
    etiqueta: String(ola),
    color: tonos[i],
  }))

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="font-display text-2xl font-semibold">Qué se movió entre 2023 y 2025</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Tres cambios que ordenan el resto. Se leen de corrido, en unos dos minutos.
      </p>

      <ol className="mt-4 max-w-2xl space-y-1 text-sm text-gray-600">
        <li>1 · China pasa a Estados Unidos, y el cambio entero ocurre en 2025.</li>
        <li>2 · La confianza en China crece, y la brecha se abre por un lado solo.</li>
        <li>3 · La mayoría no alineada se erosiona, y lo que pierde se va a China.</li>
      </ol>

      <button
        type="button"
        onClick={() => { setAbierta(true) }}
        className="mt-5 rounded-md bg-brand-dark px-4 py-2 text-sm font-medium text-white hover:bg-brand"
      >
        Ver el recorrido
      </button>

      <CapaRecorrido
        abierta={abierta}
        alCerrar={() => { setAbierta(false) }}
        titulo="Qué se movió entre 2023 y 2025"
      >
        {(raiz) => (
          <>
            <Escena
              raiz={raiz}
              // La única escena con una figura sola: la 2 y la 3 tienen dos y tres paneles en
              // paralelo, que en media pantalla quedan ilegibles.
              dosColumnas
              // Un solo nivel de encabezado, con el hallazgo, como quedó en el laboratorio el
              // 07-09-2026. Lo que se está mirando bajó al pie de la figura, junto con las bases:
              // ahí se consulta cuando ya se vieron los puntos, y no compite con el titular.
              // «Las personas» y no «los chilenos»: la muestra no es probabilística y no habla
              // por el país.
              titulo={`En el ${encuesta.olas.at(-1)} las personas evalúan mejor a ${chinaSobreEeuu ? 'China que a Estados Unidos' : 'Estados Unidos que a China'}.`}
              cabecera={(activo) => (
                <AnioDelPaso
                  olas={encuesta.olas}
                  tonos={tonos}
                  // Hasta qué oleada llegó el relato: es la más nueva que el paso enciende.
                  hasta={Math.max(0, ...encuesta.olas.map((ola, i) => (
                    termometro.some((t) => pasosEncendidos[activo]?.(t.pais, ola)) ? i : 0
                  )))}
                />
              )}
              frases={[
                <>
                  En 2023 y 2024 <strong>Estados Unidos estaba mejor evaluado que China</strong>.
                </>,
                <>
                  <strong>En {encuesta.olas.at(-1)} se invierte</strong>: China llega a{' '}
                  {decimal(chinaT.at(-1)!.media)} (sube {decimal(subeChina)} puntos) y Estados
                  Unidos cae a {decimal(eeuuT.at(-1)!.media)} (baja {decimal(bajaEeuu)}).
                </>,
                <>
                  <strong>{mejor.pais} {siempreMejor ? 'encabeza las tres oleadas' : `encabeza ${encuesta.olas.at(-1)}`}</strong>,
                  con {decimal(mejor.valores.at(-1)!.media)} en {encuesta.olas.at(-1)}:{' '}
                  {decimal((mejor.valores.at(-1)?.media ?? 0) - (chinaT.at(-1)?.media ?? 0))} puntos
                  sobre China.
                </>,
                <>
                  <strong>Todo el cambio de la serie ocurre en {encuesta.olas.at(-1)}</strong>: entre{' '}
                  {encuesta.olas.at(0)} y {encuesta.olas.at(-2)} ningún país se movió más de{' '}
                  {decimal(quietas)} {quietasRedondo === 1 ? 'punto' : 'puntos'}.
                </>,
              ]}
              figura={(activo) => (
                <Puntos
                  series={serieTermometro}
                  filas={ordenados.map((t) => ({
                    clave: t.pais,
                    etiqueta: t.pais,
                    valores: t.valores.map((v) => (v.base > 0 ? v.media : null)),
                  }))}
                  escala={escalaTermometro}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => {
                    const i = encuesta.olas.indexOf(Number(serie.clave))
                    const v = ordenados.find((t) => t.pais === fila.clave)!.valores[i]
                    return `${fila.etiqueta} · ${serie.etiqueta}: ${decimal(valor)} sobre 100 (n = ${numero(v.base)})`
                  }}
                  marcas={5}
                  anchoEtiqueta="6.5rem"
                  compacto
                  altoFila={40}
                  radioCreciente
                  leyenda={false}
                  // Corto a propósito: en 360 px, la versión larga se partía en tres líneas y se
                  // pegaba a las marcas del eje.
                  unidadEje={`Evaluación de 0 a 100 · eje recortado a ${numero(escalaTermometro.min)}-${numero(escalaTermometro.max)}`}
                  rotular={encuesta.olas.length - 1}
                  visible={(pais, ola) => pasosEncendidos[activo]?.(pais, Number(ola)) ?? true}
                />
              )}
              nota={(
                // La leyenda va acá, en la esquina de abajo a la derecha del gráfico: el lector la
                // busca cuando ya vio los puntos, no antes.
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <p className="max-w-[22rem] text-xs leading-snug text-gray-500">
                    Un punto por oleada. Promedio de quienes contestaron. Bases de{' '}
                    {numero(baseMinima)} a {numero(baseMaxima)} casos según país y oleada.
                  </p>
                  <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
                </div>
              )}
            />

            <Escena
              raiz={raiz}
              titulo="La confianza en China crece, y la brecha se abre por un lado solo"
              frases={[
                <>
                  Quienes dicen tener <strong>mucha confianza</strong> en la capacidad de China para
                  manejar responsablemente los problemas de América Latina pasan de{' '}
                  {porcentaje(confianza.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(confianza.at(-1)?.valor ?? 0, 1)}.
                </>,
                <>
                  La confianza en Estados Unidos también sube, de{' '}
                  {porcentaje(confianzaEeuu.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(confianzaEeuu.at(-1)?.valor ?? 0, 1)}, pero{' '}
                  {decimal(subeConfEeuu)} puntos contra los {decimal(subeConfChina)} de China:{' '}
                  <strong>no es que Estados Unidos pierda confianza, es que China crece mucho más
                  rápido</strong>
                  {encimaPorPrimeraVez && <>, y en {encuesta.olas.at(-1)} la pasa por primera vez</>}.
                </>,
              ]}
              figura={(activo) => (
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <Serie
                    anchoLienzo={300}
                    puntos={confianza} unidad="porcentaje" etiqueta="Mucha confianza en China"
                    color={SEMANTICOS['A favor de China']}
                  />
                  {/* La segunda potencia se enciende con su frase: en el primer paso el panel está
                      con su eje y sin sus puntos, que es la manera de decir «esto viene» sin
                      mostrar todavía el dato del que no se habló. */}
                  <Serie
                    anchoLienzo={300}
                    puntos={confianzaEeuu} unidad="porcentaje" etiqueta="Mucha confianza en EE. UU."
                    color={SEMANTICOS['A favor de EE. UU.']}
                    visible={() => activo >= 1}
                  />
                </div>
              )}
              nota={(
                <p className="text-xs leading-snug text-gray-500">
                  Porcentaje que responde «mucha», sobre quienes contestaron la pregunta. Las dos
                  figuras comparten eje de 0 a 100, así que las pendientes se comparan directo.
                </p>
              )}
            />

            <Escena
              raiz={raiz}
              titulo="La mayoría no alineada se erosiona, y lo que pierde se va a China"
              frases={[
                <>
                  Sumando a quienes quieren relacionarse con ambas potencias y a quienes prefieren
                  mantener distancia de las dos, <strong>el no alineamiento cae de{' '}
                  {porcentaje(primera, 1)} a {porcentaje(ultima, 1)}</strong>. Sigue siendo una
                  mayoría amplia, pero se desgasta.
                </>,
                <>
                  Lo interesante es la composición de la minoría que sí quiere elegir: preferir a
                  China pasa de {porcentaje(proChina.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(proChina.at(-1)?.valor ?? 0, 1)}, mientras preferir a Estados Unidos
                  baja de {porcentaje(proEeuu.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(proEeuu.at(-1)?.valor ?? 0, 1)}. <strong>En 2025, por primera vez, hay
                  más chilenos que quieren alinearse con China que con Estados Unidos.</strong>
                </>,
              ]}
              figura={(activo) => (
                <div className="grid gap-x-6 sm:grid-cols-3">
                  <Serie anchoLienzo={300} puntos={noAlineado} unidad="porcentaje" etiqueta="No alineamiento" />
                  {/* La composición de la minoría entra con la frase que la cuenta: en el primer
                      paso la figura es una sola serie, la que se está leyendo. */}
                  <Serie
                    anchoLienzo={300}
                    puntos={proChina} unidad="porcentaje" etiqueta="A favor de China"
                    color={SEMANTICOS['A favor de China']} visible={() => activo >= 1}
                  />
                  <Serie
                    anchoLienzo={300}
                    puntos={proEeuu} unidad="porcentaje" etiqueta="A favor de EE. UU."
                    color={SEMANTICOS['A favor de EE. UU.']} visible={() => activo >= 1}
                  />
                </div>
              )}
              nota={(
                <p className="border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-snug text-gray-700">
                  <strong>Difiere de la guía.</strong> El documento de ICLAC describe este hallazgo
                  como estable, «alrededor del 72 % en las tres olas». Sobre la base publicada el no
                  alineamiento cae cinco puntos y cae de forma monótona; el 72 % describe solo a 2025.
                  Está consultado con ICLAC (<code className="rounded bg-white/70 px-1">C16</code>).
                </p>
              )}
            />
          </>
        )}
      </CapaRecorrido>
    </section>
  )
}

function Tablero ({ encuesta, casos, corte, soloIndependientes, olas }: {
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  soloIndependientes: boolean
  olas: number[]
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="font-display text-2xl font-semibold">El tablero</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Los módulos van agrupados por tema, no en secuencia: el orden no afirma nada. Los controles de
        arriba gobiernan todas las figuras a la vez.
      </p>

      {encuesta.bloques.map((bloque) => {
        const suyos = MODULOS.filter((m) => m.bloque === bloque.id)
        if (suyos.length === 0) return null
        return (
          <div key={bloque.id} className="mt-8">
            <h3 className="mb-3 border-b border-gray-200 pb-1 font-display text-sm font-semibold uppercase tracking-wide text-gray-500">
              {bloque.titulo}
            </h3>
            <div className="grid gap-3 md:grid-cols-6">
              {suyos.map((def) => {
                if (def.forma === 'multiple') {
                  return (
                    <MultipleFigura
                      key={def.id}
                      definicion={def}
                      encuesta={encuesta}
                      casos={casos}
                      corte={corte}
                    />
                  )
                }
                const variable = variableDe(encuesta, def.variable)
                if (!variable) return null
                return (
                  <Figura
                    key={def.id}
                    definicion={def}
                    variable={variable}
                    encuesta={encuesta}
                    casos={casos}
                    corte={corte}
                    soloIndependientes={soloIndependientes}
                    olas={olas}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function Figura ({
  definicion, variable, encuesta, casos, corte, soloIndependientes, olas,
}: {
  definicion: typeof MODULOS[number]
  variable: NonNullable<ReturnType<typeof variableDe>>
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  soloIndependientes: boolean
  olas: number[]
}) {
  // Con corte activo la figura muestra la distribución por grupo; sin corte, la serie por
  // oleada. Son dos preguntas distintas y no tiene sentido responder las dos a la vez.
  // `por-region` e `ideologia` ya son desagregaciones: aplicarles el corte encima cruzaría
  // dos variables, que es justo lo que la muestra no aguanta.
  const yaDesagrega = definicion.forma === 'por-region' || definicion.forma === 'ideologia' || definicion.forma === 'densidad'
  if (corte && !yaDesagrega) {
    const agregado = distribucion(casos, variable, { excluidos: definicion.excluidos })
    const orden = CORTES.find((c) => c.nombre === corte)?.orden
    const grupos = porGrupo(casos, corte, encuesta.variables, orden).map((g) => ({
      etiqueta: g.etiqueta,
      agregado: distribucion(g.casos, variable, { excluidos: definicion.excluidos }),
    }))
    return (
      <Modulo definicion={definicion} variable={variable} base={agregado.base}>
        <Distribucion agregado={agregado} grupos={grupos} />
      </Modulo>
    )
  }

  if (definicion.forma === 'densidad') {
    const base = media(casos, definicion.variable).base
    return (
      <Modulo definicion={definicion} variable={variable} base={base}>
        <Densidad encuesta={encuesta} casos={casos} corte={corte} variable={definicion.variable} />
      </Modulo>
    )
  }

  if (definicion.forma === 'ideologia') {
    const base = media(casos, definicion.variable).base
    return (
      <Modulo definicion={definicion} variable={variable} base={base}>
        <Ideologia
          encuesta={encuesta}
          olas={olas}
          soloIndependientes={soloIndependientes}
          variable={definicion.variable}
        />
      </Modulo>
    )
  }

  if (definicion.forma === 'por-region') {
    const agregado = distribucion(casos, variable)
    return (
      <Modulo definicion={definicion} variable={variable} base={agregado.base}>
        <PorRegion encuesta={encuesta} casos={casos} variable={variable} />
      </Modulo>
    )
  }

  if (definicion.forma === 'distribucion') {
    const agregado = distribucion(casos, variable, { excluidos: definicion.excluidos })
    return (
      <Modulo definicion={definicion} variable={variable} base={agregado.base}>
        <Distribucion agregado={agregado} />
      </Modulo>
    )
  }

  const puntos = serie(encuesta, variable, (c) => valorDe(definicion, c, variable), { soloIndependientes })
  const base = definicion.forma === 'serie-media'
    ? media(casos, definicion.variable).base
    : distribucion(casos, variable, { excluidos: definicion.excluidos }).base

  return (
    <Modulo definicion={definicion} variable={variable} base={base}>
      <Serie puntos={puntos} unidad={definicion.forma === 'serie-media' ? 'media' : 'porcentaje'} />
    </Modulo>
  )
}

/**
 * Los módulos de selección múltiple no tienen una variable en el diccionario: su `variable` es
 * el id de un grupo de columnas binarias. Por eso van por su propio camino, con una ficha
 * sintética que le da al pie del módulo lo que necesita.
 */
function MultipleFigura ({
  definicion, encuesta, casos, corte,
}: {
  definicion: typeof MODULOS[number]
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
}) {
  const grupo = encuesta.multiples.find((m) => m.id === definicion.variable)
  if (!grupo) return null

  const olas = [...new Set(grupo.opciones.flatMap((o) => o.olas))].sort()
  const variable = {
    nombre: grupo.id,
    etiqueta: grupo.titulo,
    tipo: 'selección múltiple',
    olas,
    serie: false,
    comparabilidad: null,
    nota: null,
    bloque: definicion.bloque,
    categorias: null,
  }

  const datos = multirespuesta(casos, grupo)

  // Con corte activo se contrasta contra el primer grupo, en vez de dibujar una barra por
  // categoría: con nueve opciones y cinco grupos serían cuarenta y cinco barras.
  const orden = CORTES.find((c) => c.nombre === corte)?.orden
  const grupos = corte ? porGrupo(casos, corte, encuesta.variables, orden) : []
  const contraste = grupos.length > 0
    ? { etiqueta: grupos[0].etiqueta, datos: multirespuesta(grupos[0].casos, grupo) }
    : undefined

  return (
    <Modulo definicion={definicion} variable={variable} base={datos.base}>
      <Menciones datos={datos} contraste={contraste} />
    </Modulo>
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
            más de una oleada y se pueden excluir con el control del tablero.
          </li>
          <li>
            <strong>Los porcentajes van sobre respuestas efectivas</strong>, sin perdidos. Cada figura
            muestra su propia base, que suele ser menor que el total del recorte.
          </li>
        </ul>

        <h3 className="mt-6 font-display text-base font-semibold text-gray-900">Qué falta en este borrador</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-gray-500">
          <li>Los textos del recorrido viven en el código; tienen que salir a un archivo de contenido con los tres idiomas.</li>
          <li>Las nubes de palabras no reproducen exactamente las del sitio: el monitor lematiza con Snowball y acá se normalizan los sufijos a mano.</li>
          <li>
            El sitio todavía no está en inglés ni en chino: el selector de idioma cambia el nav, los
            títulos del encabezado y el formato de los números, pero las figuras, sus notas y el
            recorrido siguen en español.
          </li>
        </ul>
      </div>
    </section>
  )
}
