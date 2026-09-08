import { useEffect, useMemo, useState } from 'react'
import { HashRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import CapaRecorrido, { Escena, Portada, Respiro } from './componentes/CapaRecorrido'
import Divergente from './componentes/Divergente'
import { figuraBalanza, figuraConfianza } from './nucleo/confianza'
import Descargas from './componentes/Descargas'
import Contrastes from './componentes/Contrastes'
import MetodoRecorrido from './componentes/MetodoRecorrido'
import Encabezado from './componentes/Encabezado'
import { figuraTermometro } from './nucleo/termometro'
import { escalaRedonda } from './nucleo/escala'
import Regresion from './componentes/Regresion'
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
          {/* La raíz **es** el recorrido: la portada es su primera pantalla, no una página
              anterior que la capa tapaba. `#/recorrido` se queda como alias para los enlaces ya
              repartidos. */}
          <Route index element={<Recorrido encuesta={encuesta} abierta />} />
          <Route path="recorrido" element={<Recorrido encuesta={encuesta} abierta />} />
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
  const { pathname, search } = useLocation()

  // Cambiar de vista deja la vista nueva empezada por la mitad si se hereda el desplazamiento
  // de la anterior, que es más larga. **Salvo cuando la URL pide una figura**
  // (`#/tablero?foco=…`): ahí el destino lo fija ella, y mandar la vista arriba deshace el salto
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
    // Los cinco pasos del experimento cambian la figura entera, no los países: la tabla los deja
    // encendidos para que el estado sin JavaScript y el de movimiento reducido sigan mostrando
    // todo el termómetro.
    () => true,
    () => true,
    () => true,
    () => true,
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

/**
 * La portada del recorrido y, encima, la capa.
 *
 * **La capa la decide la ruta** (`#/recorrido`), no un estado suelto: así el gesto de atrás del
 * teléfono la cierra, se puede enlazar, y quien entra por la raíz cae adentro sin apretar nada.
 * La portada queda detrás, y es a donde vuelve el botón de atrás.
 *
 * **Salir lleva al tablero**, que es lo que quiere quien deja el relato: ir a consultar.
 */
/**
 * Lectura de los contrastes que el ETL dejó en el artefacto.
 *
 * **El recorrido solo afirma lo que pasa el contraste** (ver `CLAUDE.md`, «Cuándo un cambio entre
 * oleadas es un cambio»), así que las frases no describen la diferencia: describen el resultado de
 * la prueba. Si el artefacto viene sin contrastes, cada función devuelve `null` y la frase cae a
 * una versión que solo dice lo que se ve en la figura.
 */
function lector (encuesta: Encuesta) {
  const c = encuesta.contrastes
  return {
    /** La brecha entre dos países dentro de la misma persona, en una oleada. */
    brecha: (ola: number) =>
      c?.brechas.find((b) => b.id === 'brecha-china-eeuu')?.porOla.find((x) => x.ola === ola) ?? null,
    entre: (id: string, desde: number, hasta: number) =>
      c?.medidas.find((m) => m.id === id)?.comparaciones.find((x) => x.desde === desde && x.hasta === hasta) ?? null,
    /** Si ningún país del termómetro se distingue del ruido entre dos oleadas. */
    todosQuietos: (desde: number, hasta: number) => {
      const suyas = c?.medidas.filter((m) => m.id.startsWith('termometro-')) ?? []
      const comparaciones = suyas
        .map((m) => m.comparaciones.find((x) => x.desde === desde && x.hasta === hasta))
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
      return comparaciones.length === suyas.length && comparaciones.length > 0 &&
        comparaciones.every((x) => x.p >= 0.05)
    },
    paises: (c?.medidas.filter((m) => m.id.startsWith('termometro-')).length) ?? 0,
    /** La opinión sobre China por tramo ideológico, oleada por oleada. */
    ideologia: c?.grupos.find((g) => g.id === 'ideologia-china') ?? null,
    /** La misma pregunta sobre la escala entera de 1 a 10, con la recta y el punto que la sostiene. */
    regresion: c?.regresiones.find((r) => r.id === 'ideologia-china') ?? null,
    /** En cuántos grupos de cada corte sube la opinión sobre China, entre las dos últimas oleadas. */
    transversal: c?.transversal.find((t) => t.id === 'opinion-china') ?? null,
  }
}

/**
 * Los números chicos se escriben con letra dentro de una frase.
 *
 * Sale de los datos (son las medidas del termómetro que trae el artefacto), así que no se puede
 * escribir a mano, pero «ninguno de los 5 países» en medio de una oración se lee como una planilla.
 */
function cardinal (n: number): string {
  return ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'][n] ?? numero(n)
}

/**
 * Cómo se describe una brecha según lo que dice su prueba.
 *
 * Tres estados y no dos: además de «China arriba» y «Estados Unidos arriba» está **«parejos»**,
 * que es lo que corresponde cuando el intervalo contiene el cero. La escena decía que en 2023 y
 * 2024 Estados Unidos estaba mejor evaluado; en 2023 la brecha es de 2,1 puntos con un intervalo
 * que cruza el cero, así que esa mitad de la frase afirmaba de más.
 */
function describir (brecha: { diferencia: number, p: number } | null) {
  if (!brecha) return null
  if (brecha.p >= 0.05) return { estado: 'parejos' as const, puntos: Math.abs(brecha.diferencia) }
  return { estado: brecha.diferencia > 0 ? 'china' as const : 'eeuu' as const, puntos: Math.abs(brecha.diferencia) }
}

function Recorrido ({ encuesta, abierta }: { encuesta: Encuesta, abierta: boolean }) {
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
  // La escala, el orden de las filas y el rótulo del eje salen del módulo compartido con el
  // tablero: las dos vistas muestran la misma pregunta y no pueden verse distinto.
  const figura = figuraTermometro(termometro.map((t) => ({
    clave: t.pais,
    etiqueta: t.pais,
    valores: t.valores.map((v) => (v.base > 0 ? v.media : null)),
  })))
  const basesPorPais = new Map(termometro.map((t) => [t.pais, t.valores]))


  const chinaT = termometro[0].valores
  const eeuuT = termometro[1].valores
  // El mayor movimiento de cualquier país entre las dos primeras oleadas. Se calcula en vez de
  // escribirse porque la frase que lo usa deja de ser cierta el día que entre una oleada nueva.
  const quietas = Math.max(...termometro.map((t) => Math.abs((t.valores[1]?.media ?? 0) - (t.valores[0]?.media ?? 0))))
  // El singular se decide sobre el número que se **muestra**, no sobre el crudo. Con el crudo, el
  // mayor movimiento (0,973) se escribe «1,0» y se leía «más de 1,0 puntos».
  const quietasRedondo = Math.round(quietas * 10) / 10
  // El mejor evaluado sale de los datos, no del texto: hoy es Japón, y la frase que lo nombra se
  // corrige sola si deja de serlo. `siempreMejor` es lo que habilita decir «sigue», que es una
  // afirmación sobre las tres oleadas y no sobre la última.
  // La primera fila de la figura ya viene ordenada por la última oleada, que es justo lo que la
  // frase quiere decir: quién encabeza hoy.
  const mejor = termometro.find((t) => t.pais === figura.filas[0]?.clave) ?? termometro[0]
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
  /**
   * Las dos figuras de la escena 2.
   *
   * **La escena no elige un umbral**: muestra las cuatro categorías a los dos lados de un cero
   * común y cierra comparando dentro de la persona. Con «mucha» sola, China pasa a Estados Unidos
   * en 2025; con «mucha o algo», venía arriba desde 2023, y una frase cuyo signo depende de un
   * corte que la figura no declara es el defecto que ya dejó tres cifras de opinión circulando.
   */
  const confianzaFigura = p24 && p25
    ? figuraConfianza([{ grupo: 'China', variable: p24 }, { grupo: 'Estados Unidos', variable: p25 }], encuesta.olas, todos)
    : null
  const balanza = p24 && p25 ? figuraBalanza(encuesta.olas, todos) : null
  /** Poca o ninguna confianza: el lado que se achica, y el que la primera frase afirma. */
  const desconfia = (variable: typeof p24, ola: number) =>
    (variable ? proporcion(todos(ola), variable, [3, 99]).porcentaje : 0)
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

  // La escena de cierre repite las tres medidas del recorrido, una por panel, en la unidad de cada
  // una. `opinionChina` es el termómetro en el formato que `Serie` espera.
  const opinionChina = chinaT.map((v, i) => ({ ola: encuesta.olas[i], valor: v.media, base: v.base }))
  const sube = (serie: { valor: number }[]) => (serie.at(-1)?.valor ?? 0) > (serie.at(0)?.valor ?? 0)
  // El titular del cierre afirma que las tres medidas van al mismo lado, así que se comprueba
  // sobre las tres antes de escribirlo: con una oleada nueva que rompa el patrón, el título cambia
  // solo en vez de quedar contradiciendo a su propia figura.
  const mismaDireccion = sube(opinionChina) && sube(confianza) && sube(proChina)

  const navegar = useNavigate()

  // Lo que dicen las pruebas del ETL sobre las tres oleadas. Las frases de la escena 1 se arman
  // con esto y no con la diferencia cruda.
  const contraste = lector(encuesta)
  const primeraOla = encuesta.olas.at(0) ?? 0
  const penultima = encuesta.olas.at(-2) ?? 0
  const ultimaOla = encuesta.olas.at(-1) ?? 0
  const brechaPrimera = describir(contraste.brecha(primeraOla))
  const brechaPenultima = describir(contraste.brecha(penultima))
  const quietasEntreOlas = contraste.todosQuietos(primeraOla, penultima)
  // Estados Unidos en la escena 2, con «mucha o algo»: sube en la oleada del medio, baja en la
  // última, y en la serie completa no se distingue del ruido. Las tres cosas salen de la prueba y
  // no de mirar la figura.
  const vuelveEeuu = contraste.entre('confia-eeuu', penultima, ultimaOla)
  const serieEeuu = contraste.entre('confia-eeuu', primeraOla, ultimaOla)
  // La caída del empate es lo que sostiene el titular de la escena 4: la ventaja de China sale de
  // ahí y no de Estados Unidos, cuya baja no pasa el contraste.
  const caeElEmpate = contraste.entre('empate-confianza', primeraOla, ultimaOla)

  // **Los cinco pasos del experimento**, que son la segunda mitad de la escena 1.
  //
  // Reemplazaron a dos pasos que comparaban izquierda, centro y derecha como tres filas. Decían lo
  // mismo con menos: que el eje político no ordena la opinión sobre China. El experimento además
  // muestra **por qué** el monitor publicado encuentra un gradiente donde no lo hay, y eso solo se
  // puede contar mostrándolo. El hallazgo que se perdió (las dos puntas suben) sigue publicado en
  // «Sobre los datos».
  const regresion = contraste.regresion
  const primeraDeLaSerie = regresion?.porOla.find((o) => o.ola === primeraOla) ?? null
  // La escala vertical es una sola para los cinco pasos y para las tres oleadas: si dependiera de
  // lo que cada paso muestra, el mismo promedio cambiaría de lugar al avanzar el relato.
  const valoresRegresion = (regresion?.porOla ?? []).flatMap((o) => [
    ...o.puntos.map((q) => q.media).filter((v): v is number => v !== null),
    ...o.puntos.flatMap((q) => q.ic ?? []),
  ])
  const escalaRegresion = valoresRegresion.length > 0
    ? escalaRedonda(valoresRegresion, 4)
    : { min: 0, max: 100 }
  // El experimento solo se cuenta si el punto que sostiene la recta **la da vuelta**: con la
  // pendiente y su versión sin ese punto del mismo lado del cero, no hay nada que mostrar.
  const sostiene = primeraDeLaSerie?.sostiene ?? null
  const conExperimento = Boolean(
    regresion && primeraDeLaSerie && sostiene &&
    primeraDeLaSerie.recta.p < 0.05 && sostiene.recta.p >= 0.05,
  )
  const puntoMasPoblado = primeraDeLaSerie
    ? primeraDeLaSerie.puntos.reduce((mejor, q) => (q.n > mejor.n ? q : mejor), primeraDeLaSerie.puntos[0])
    : null
  const totalPrimera = primeraDeLaSerie ? primeraDeLaSerie.puntos.reduce((s, q) => s + q.n, 0) : 0

  // El puente entre las dos mitades de la escena: el alza no viene de un sector. Se nombran los
  // cortes donde **todos** los grupos se mueven en la misma dirección; el que tiene una excepción
  // se calla, porque la frase no tiene figura que la respalde y no puede redondear a su favor.
  const cortesEnteros = (contraste.transversal?.cortes ?? []).filter((c) => c.suben === c.total && c.total >= 3)
  const conPuente = cortesEnteros.length >= 2
  // «Por primera vez» es una afirmación sobre toda la serie, así que se comprueba sobre toda la
  // serie: China arriba y por encima del ruido en la última oleada, y en ninguna anterior.
  const arriba = (ola: number) => {
    const b = contraste.brecha(ola)
    return b !== null && b.diferencia > 0 && b.p < 0.05
  }
  const primeraVezArriba = arriba(ultimaOla) && encuesta.olas.slice(0, -1).every((ola) => !arriba(ola))

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
    <>      <CapaRecorrido
        abierta={abierta}
        alCerrar={() => { navegar('/tablero') }}
        titulo="Qué se movió entre 2023 y 2025"
      >
        {(raiz) => (
          <>
            {/* La tapa. **Es borrador**: dice qué es el recorrido, cuánto dura y por dónde va, que
                es el mínimo para decidir si entrar, pero no tiene guion acordado con ICLAC. */}
            <Portada raiz={raiz} titulo={`Qué se movió entre ${encuesta.olas.at(0)} y ${encuesta.olas.at(-1)}`}>
              <div className="mx-auto w-full max-w-2xl">
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-brand-dark">Recorrido</p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                  Qué se movió entre {encuesta.olas.at(0)} y {encuesta.olas.at(-1)}
                </h2>
                <p className="mt-3 text-base text-gray-600">
                  Cuatro escenas que se avanzan con el scroll, en unos dos minutos. Se sale cuando
                  quieras: el tablero queda del otro lado, con las tres oleadas completas.
                </p>

                <ol className="mt-5 divide-y divide-gray-200 border-y border-gray-200 text-sm text-gray-700">
                  {[
                    'China pasa a Estados Unidos, y el cambio entero ocurre en 2025.',
                    'La confianza en China crece, y la brecha se abre por un lado solo.',
                    'La mayoría no alineada se erosiona, y lo que pierde se va a China.',
                    'Las tres medidas, juntas.',
                  ].map((linea, i) => (
                    <li key={linea} className="flex gap-3 py-2">
                      <span className="w-4 shrink-0 text-right font-display text-xs font-semibold tabular-nums text-gray-400">
                        {i + 1}
                      </span>
                      {linea}
                    </li>
                  ))}
                </ol>

                {/* El botón hace lo mismo que el gesto, y por eso dice lo que el gesto hace: en el
                    teléfono el scroll es obvio, con teclado o con rueda dura no lo es tanto. */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const tapa = raiz?.querySelector('.portada-recorrido')
                      if (raiz && tapa) raiz.scrollTo({ top: (tapa as HTMLElement).offsetHeight, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-brand-dark px-4 py-2.5 text-sm font-medium text-white hover:bg-brand hover:text-gray-900"
                  >
                    Empezar
                    <span aria-hidden>↓</span>
                  </button>
                  <Link to="/tablero" className="text-sm text-gray-600 underline underline-offset-2 hover:text-brand-dark">
                    o ir directo al tablero
                  </Link>
                </div>
              </div>
            </Portada>

            <Escena
              indice={1}
              modulo="termometro"
              raiz={raiz}
              // La figura es una sola, así que en escritorio va el relato a un lado y la figura al
              // otro. Las escenas con dos o tres paneles en paralelo no pueden.
              dosColumnas
              // Un solo nivel de encabezado, con el hallazgo, como quedó en el laboratorio el
              // 07-09-2026. Lo que se está mirando bajó al pie de la figura, junto con las bases:
              // ahí se consulta cuando ya se vieron los puntos, y no compite con el titular.
              // «Las personas» y no «los chilenos»: la muestra no es probabilística y no habla
              // por el país.
              titulo={`En ${encuesta.olas.at(-1)} las personas evalúan mejor a ${chinaSobreEeuu ? 'China que a Estados Unidos' : 'Estados Unidos que a China'}.`}
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
              // **Las frases salen de las pruebas, no de restar dos promedios.** La brecha entre
              // los dos países se calcula dentro de cada persona, que es quien pone las dos notas:
              // así, «una oleada usó la escala más generosa» deja de ser una explicación posible.
              // Y donde el intervalo cruza el cero se dice «parejos», no se elige un ganador.
              frases={[
                <>
                  {brechaPrimera?.estado === 'parejos'
                    ? <>En {primeraOla} los dos estaban <strong>parejos</strong></>
                    : <>En {primeraOla} <strong>{brechaPrimera?.estado === 'china' ? 'China' : 'Estados Unidos'} estaba arriba</strong></>}
                  {brechaPenultima && (brechaPenultima.estado === 'parejos'
                    ? <>, y en {penultima} seguían parejos.</>
                    : <>, y en {penultima} <strong>{brechaPenultima.estado === 'china' ? 'China' : 'Estados Unidos'}</strong> quedó
                      arriba por {decimal(brechaPenultima.puntos)} puntos.</>)}
                </>,
                <>
                  {/* **La frase dice lo que la figura muestra.** Antes daba la brecha pareada
                      (6,5 puntos dentro de la misma persona), que es el estadístico más fuerte y
                      no tiene dónde verse en el gráfico: el lector leía un número que no está en
                      ningún punto. La brecha sigue sosteniendo la afirmación, y vive en el pie y
                      en «Sobre los datos», que es donde se va a buscar el método. */}
                  <strong>En {ultimaOla} China queda arriba{primeraVezArriba && ' por primera vez'}</strong>:
                  {' '}sube a {decimal(chinaT.at(-1)?.media ?? 0)} y Estados Unidos baja a{' '}
                  {decimal(eeuuT.at(-1)?.media ?? 0)}.
                </>,
                <>
                  <strong>{mejor.pais} {siempreMejor ? 'encabeza las tres oleadas' : `encabeza ${encuesta.olas.at(-1)}`}</strong>,
                  con {decimal(mejor.valores.at(-1)!.media)} en {encuesta.olas.at(-1)}:{' '}
                  {decimal((mejor.valores.at(-1)?.media ?? 0) - (chinaT.at(-1)?.media ?? 0))} puntos
                  sobre China.
                </>,
                <>
                  {/* Antes decía «ningún país se movió más de 1,0 puntos». El número era cierto y
                      no se podía calibrar: en una escala de 0 a 100 con desviación de 28, nadie
                      sabe si 1,0 es mucho. Con los contrastes se puede afirmar algo más fuerte y
                      sin número arbitrario. El hecho, en cambio, es el que sostiene el titular:
                      sin él no se distingue un quiebre de una tendencia que ya venía. */}
                  <strong>Todo el cambio de la serie ocurre en {ultimaOla}</strong>: entre{' '}
                  {primeraOla} y {penultima}{' '}
                  {quietasEntreOlas
                    ? <>ninguno de los {cardinal(contraste.paises)} países se distingue del ruido de la muestra</>
                    : <>ningún país se movió más de {decimal(quietas)} {quietasRedondo === 1 ? 'punto' : 'puntos'}</>}.
                </>,
              ]}
              figura={(activo) => (
                <Puntos
                  series={serieTermometro}
                  filas={figura.filas}
                  escala={figura.escala}
                  formato={(v) => decimal(v, 1)}
                  formatoEje={(v) => decimal(v, 0)}
                  titulo={(fila, serie, valor) => {
                    const i = encuesta.olas.indexOf(Number(serie.clave))
                    const v = basesPorPais.get(fila.clave)?.[i]
                    return `${fila.etiqueta} · ${serie.etiqueta}: ${decimal(valor)} sobre 100 (n = ${numero(v?.base ?? 0)})`
                  }}
                  marcas={figura.marcas}
                  anchoEtiqueta="6.5rem"
                  compacto
                  altoFila={40}
                  radioCreciente
                  leyenda={false}
                  // Corto a propósito: en 360 px, la versión larga se partía en tres líneas y se
                  // pegaba a las marcas del eje.
                  unidadEje={figura.unidadEje}
                  rotular={encuesta.olas.length - 1}
                  visible={(pais, ola) => pasosEncendidos[activo]?.(pais, Number(ola)) ?? true}
                />
              )}
              nota={(
                // La leyenda va acá, en la esquina de abajo a la derecha del gráfico: el lector la
                // busca cuando ya vio los puntos, no antes.
                // El pie mide **lo mismo que la figura**, y por eso va en columna y no al lado de
                // la leyenda: compartiendo fila, el texto se encogía a 140 px bajo un gráfico de
                // 328 y la escena crecía 49 px de puro salto de línea.
                <div className="flex flex-col gap-1">
                  <p className="text-xs leading-snug text-gray-500">
                    {/* **Corto porque el alto está contado.** En un iPhone 12 la escena tiene 621 px
                        útiles y con el pie largo medía 697: el enlace al tablero quedaba bajo el
                        borde. Lo que se fue es la explicación de «parejos» con su intervalo, que es
                        material de método y vive completo en «Cómo se hizo el recorrido», a un
                        toque desde la barra. */}
                    Un punto por oleada, promedio de quienes contestaron. Bases de{' '}
                    {numero(baseMinima)} a {numero(baseMaxima)} según país y oleada. «Parejos» y
                    «arriba» comparan las dos notas dentro de cada persona.
                  </p>
                  <LeyendaDeOleadas olas={encuesta.olas} tonos={tonos} />
                </div>
              )}
            />

            {/* **El puente entre las dos historias, ahora como pausa y no como paso.**
                Era el quinto paso de la escena del termómetro, y la barra lo anunciaba como «paso 5
                de 9»: el lector no estaba en una pausa, estaba a mitad de una escena, y al entrar
                el bloque de texto brincaba 187 px porque la figura desaparecía. Como respiro tiene
                su propia pantalla, la barra dice «Pausa» y no hay figura que se vaya. */}
            {conExperimento && (
              <Respiro
                raiz={raiz}
                indice={-2}
                titulo="El alza no se concentra en un solo grupo. ¿Y en el eje político?"
              >
                {conPuente
                  ? <>El alza aparece en {cardinal(cortesEnteros[0].total)} {cortesEnteros[0].etiqueta} y
                    en {cardinal(cortesEnteros[1].total)} {cortesEnteros[1].etiqueta}. <strong>¿Y en el eje
                    político?</strong></>
                  : <>El alza no se concentra en un solo grupo. <strong>¿Y en el eje político?</strong></>}
              </Respiro>
            )}

            {/* **El experimento es una escena propia.**
                Contar el método es contar un hallazgo cuando el método *es* el hallazgo: se muestra
                la recta que publica el monitor, se marca el punto de treinta personas que la
                sostiene, se retira y la recta se endereza. Las cifras salen del ETL: si una oleada
                nueva cambia cuál punto sostiene la recta, las frases se corrigen solas, y si el
                punto deja de darla vuelta, la escena entera desaparece. */}
            {conExperimento && regresion && (
              <Escena
                indice={2}
                modulo="ideologia"
                raiz={raiz}
                dosColumnas
                titulo="La posición política no ordena la opinión sobre China."
                cabecera={(activo) => (
                  <AnioDelPaso
                    olas={encuesta.olas}
                    tonos={tonos}
                    // El experimento trabaja sobre la primera oleada, y su último paso muestra las
                    // tres: el año grande dice lo mismo que la figura.
                    hasta={activo >= 3 ? encuesta.olas.length - 1 : 0}
                  />
                )}
                frases={[
                  <>
                    El monitor traza una recta y encuentra inclinación:{' '}
                    <strong>{decimal(Math.abs(primeraDeLaSerie?.recta.b ?? 0))} puntos menos por cada paso
                    hacia la derecha</strong>.
                  </>,
                  <>
                    Toda esa inclinación la sostiene <strong>un punto de {numero(sostiene?.n ?? 0)} personas</strong>,
                    cuyo promedio podría estar entre{' '}
                    {decimal(primeraDeLaSerie?.puntos.find((q) => q.x === sostiene?.x)?.ic?.[0] ?? 0, 0)} y{' '}
                    {decimal(primeraDeLaSerie?.puntos.find((q) => q.x === sostiene?.x)?.ic?.[1] ?? 0, 0)}.
                  </>,
                  <>
                    <strong>Sin esas {numero(sostiene?.n ?? 0)} personas la recta se endereza</strong>:{' '}
                    {decimal(sostiene?.recta.b ?? 0)} puntos, y el rango de pendientes compatibles
                    incluye la horizontal.
                  </>,
                  <>
                    Las otras oleadas dicen lo mismo: <strong>la posición política no ordena la
                    opinión sobre China</strong>.
                  </>,
                ]}
                figura={(activo) => (
                  <Regresion
                    datos={regresion}
                    ola={primeraOla}
                    escala={{ ...escalaRegresion, paso: Math.max(5, Math.round((escalaRegresion.max - escalaRegresion.min) / 3)) }}
                    tonos={tonos}
                    olas={encuesta.olas}
                    paso={activo + 1}
                    etiquetaIzquierda="1 · izquierda"
                    etiquetaDerecha="derecha · 10"
                    unidadEje="Evaluación de China de 0 a 100"
                  />
                )}
                nota={(activo, reducido) => (
                  // **El pie dice lo que la figura muestra en este paso.** Fijo, el paso que
                  // retira un punto seguiría declarando la muestra entera. La leyenda de oleadas
                  // aparece solo en el último, que es donde el color pasa a significar un año:
                  // antes hay una sola oleada en la figura y la clave ofrecería dos colores que
                  // no están dibujados.
                  <div className="flex flex-col gap-1">
                    <p className="text-xs leading-snug text-gray-500">
                      {/* Corto a propósito: el eje ya dice qué es 1 y qué es 10, y en un teléfono
                          de 664 px de alto cada línea del pie se la quita a la figura. */}
                      Cada punto es un promedio; su tamaño dice cuánta gente hay.{' '}
                      {activo >= 3 || reducido
                        ? <>Las tres oleadas, con sus muestras completas. La franja de cada recta es el rango de pendientes compatibles con los datos.</>
                        : activo === 2
                          ? <>Oleada {primeraOla} sin quienes se ubican en el {sostiene?.x}: {numero(sostiene?.recta.n ?? 0)} personas. El punto retirado queda hueco, no borrado.</>
                          : activo === 1
                            ? <>Oleada {primeraOla}, {numero(totalPrimera)} personas. La barra vertical es el intervalo del 95 % del promedio de ese punto.</>
                            : <>Oleada {primeraOla}, {numero(totalPrimera)} personas, de las cuales{' '}
                              {porcentaje(100 * (puntoMasPoblado?.n ?? 0) / (totalPrimera || 1), 0)} se ubica
                              en el {puntoMasPoblado?.x}. La recta es una regresión lineal simple de la
                              evaluación sobre la escala de ideología.</>}
                    </p>
                    {/* La leyenda del último paso lleva la pendiente de cada oleada: en la figura,
                        dos de las tres rectas terminan a menos de un punto y sus rótulos se pisan.
                        Acá el color ata cada cifra a su recta y no hay nada que se superponga. */}
                    {(activo >= 3 || reducido) && (
                      <ul className="ml-auto flex flex-wrap items-center justify-end gap-x-3.5 gap-y-1">
                        {encuesta.olas.map((ola, i) => {
                          const r = regresion?.porOla.find((o) => o.ola === ola)?.recta
                          const nula = r ? r.ic[0] <= 0 && r.ic[1] >= 0 : true
                          return (
                            <li key={ola} className="flex items-center gap-1.5 text-[11px] tabular-nums text-gray-500">
                              <span
                                className="inline-block h-0.5 w-4 shrink-0 rounded-full"
                                style={{ backgroundColor: tonos[i] }}
                              />
                              {ola}
                              {r && <> {r.b > 0 ? '+' : ''}{decimal(r.b, 2)}{nula && ' ns'}</>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              />
            )}

            {/* **El respiro entre las dos escenas.** La 1 termina midiendo evaluación y la 2 abre
                midiendo confianza, que son dos cosas distintas: sin la frase, el lector lee la
                segunda como si siguiera hablando de la primera. No es una escena y no se numera
                (ver `Respiro` en `CapaRecorrido.tsx`). */}
            <Respiro raiz={raiz} titulo="Entonces la gente evalúa mejor que antes a China, ¿pero confía en ella?">
              Ok, entonces la gente evalúa mejor que antes a China.{' '}
              <strong>¿Pero confía en ella?</strong>
            </Respiro>

            <Escena
              indice={3}
              modulo="confianza-china"
              raiz={raiz}
              // Una sola figura por paso, así que en escritorio va el relato a un lado y la figura
              // al otro, igual que la escena 1.
              dosColumnas
              titulo="La confianza en China crece, y en Estados Unidos vuelve a donde estaba"
              frases={[
                <>
                  En China se corre el reparto entero: <strong>poca o ninguna</strong> cae de{' '}
                  {porcentaje(desconfia(p24, primeraOla), 1)} a {porcentaje(desconfia(p24, ultimaOla), 1)}, y
                  «mucha» pasa de {porcentaje(confianza.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(confianza.at(-1)?.valor ?? 0, 1)}.
                </>,
                // **La frase anterior decía «no es que Estados Unidos pierda confianza».** Con la
                // escala entera a la vista eso es falso en el último tramo: con «mucha o algo»
                // pierde por encima del ruido. Lo que sí se sostiene, y es lo que dice ahora, es
                // que en la serie completa vuelve a donde estaba.
                <>
                  Estados Unidos sube en {encuesta.olas[1]} y <strong>vuelve</strong> en {ultimaOla}
                  {vuelveEeuu && vuelveEeuu.p < 0.05 && <> ({decimal(vuelveEeuu.diferencia)} puntos)</>}:{' '}
                  {serieEeuu && serieEeuu.p >= 0.05
                    ? <>en la serie completa no se distingue del ruido</>
                    : <>en la serie completa suma {decimal(serieEeuu?.diferencia ?? 0)} puntos</>}.
                </>,
              ]}
              figura={(activo, reducido) => (confianzaFigura && (
                <Divergente
                  categorias={confianzaFigura.categorias}
                  filas={confianzaFigura.filas}
                  extremo={confianzaFigura.extremo}
                  formato={(v) => decimal(v, 0)}
                  altoFila={26}
                  anchoEtiqueta="2.6rem"
                  // El primer paso habla solo de China. Las filas de Estados Unidos siguen en el
                  // documento con opacidad cero, y la escala ya está calculada sobre las seis, así
                  // que ningún segmento cambia de largo al encenderse.
                  visible={(clave) => reducido || activo >= 1 || clave.startsWith('p24-')}
                  unidadEje="Porcentaje de quienes contestaron. El 0 del eje es el borde entre los dos lados, y cada fila suma 100."
                  titulo={(fila, categoria, valor) =>
                    `${fila.grupo ?? ''} ${fila.etiqueta} · ${categoria.etiqueta}: ${decimal(valor, 1)} % (n = ${numero(fila.base)})`}
                />
              ))}
              nota={(
                <p className="text-xs leading-snug text-gray-500">
                  Las cuatro respuestas de la pregunta, sin elegir un umbral: con «mucha» sola, China
                  queda encima de Estados Unidos solo en {ultimaOla}; con «mucha o algo», ya estaba
                  encima en {primeraOla}.
                </p>
              )}
            />

            {/* **La segunda pausa, y por la misma razón que la primera.** Acá el recorrido cambia
                de figura: deja de mirar el reparto de cada potencia y pasa a mirar a cada persona.
                Sin pausa, el cambio ocurría en el mismo paso en que cambiaba la frase, y el bloque
                se recolocaba de golpe (medido: la figura pasaba de 412 px a 291 y el titular bajaba
                60 px). */}
            {balanza && (
              <Respiro
                raiz={raiz}
                indice={-3}
                titulo="Los dos repartos miran al país entero. ¿Y si miramos a cada persona?"
              >
                Los dos repartos miran al país entero. <strong>¿Y si miramos a cada persona?</strong>
              </Respiro>
            )}

            {balanza && (
              <Escena
                indice={4}
                modulo="confianza-eeuu"
                raiz={raiz}
                dosColumnas
                titulo="La ventaja de China se la saca al empate, no a Estados Unidos"
                frases={[
                  <>
                    Cada persona contesta por las dos potencias, así que se puede restar dentro del
                    caso. En {primeraOla} y {penultima} <strong>manda el empate</strong>:{' '}
                    {porcentaje(balanza.filas[0].valores[1], 1)} y{' '}
                    {porcentaje(balanza.filas[1].valores[1], 1)} les tienen la misma confianza a las dos.
                  </>,
                  <>
                    En {ultimaOla} quienes <strong>confían más en China</strong> saltan a{' '}
                    {porcentaje(balanza.filas[balanza.filas.length - 1].valores[2], 1)}, y el empate cae{' '}
                    {decimal(Math.abs(caeElEmpate?.diferencia ?? 0))} puntos. Estados Unidos no se mueve.
                  </>,
                ]}
                figura={(activo, reducido) => (
                  <Divergente
                    categorias={balanza.categorias}
                    filas={balanza.filas}
                    extremo={balanza.extremo}
                    formato={(v) => decimal(v, 0)}
                    altoFila={30}
                    anchoEtiqueta="2.6rem"
                    // La última oleada entra en el segundo paso: es donde ocurre el salto, y verlo
                    // aparecer es el cambio visible que ese paso se gana.
                    visible={(clave) => reducido || activo >= 1 || clave !== `balanza-${ultimaOla}`}
                    unidadEje="Cada persona contesta por las dos potencias, así que la comparación va dentro del caso. «La misma» queda a caballo del cero."
                    titulo={(fila, categoria, valor) =>
                      `${fila.etiqueta} · ${categoria.etiqueta}: ${decimal(valor, 1)} % (n = ${numero(fila.base)})`}
                  />
                )}
                nota={(
                  <p className="text-xs leading-snug text-gray-500">
                    Sobre quienes contestaron las dos preguntas: {balanza.filas.map((f) => numero(f.base)).join(', ')} personas.
                    La caída del empate pasa el contraste; la de Estados Unidos no.
                  </p>
                )}
              />
            )}

            <Escena
              indice={5}
              modulo="posicionamiento"
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

            {/*
              * La escena de cierre. **Es borrador**: repite las tres medidas en la unidad de cada
              * una y despide al tablero, pero su guion no está acordado con ICLAC, igual que el de
              * las escenas 2 y 3 (ver `estado.md`).
              *
              * No suma un hallazgo nuevo: junta los tres que el lector ya vio. Sin ella el
              * recorrido terminaba de golpe, en la última frase de la escena 3.
              */}
            <Escena
              indice={6}
              raiz={raiz}
              titulo={mismaDireccion
                ? 'Las tres medidas se mueven en la misma dirección'
                : 'Las tres medidas, juntas'}
              // **Frases de una línea, y es una restricción medida, no una preferencia.** En 360 px
              // la escena tiene 737 px de alto útil (la capa menos su barra) y los tres paneles se
              // llevan 544: con frases de dos líneas la escena mide 776 y la nota queda bajo el
              // borde. El cierre además no necesita explicar, que es lo que hicieron las tres
              // escenas anteriores: repite las tres cifras en la unidad de cada una.
              frases={[
                <>China sube a {decimal(chinaT.at(-1)?.media ?? 0)} puntos.</>,
                <>
                  Confianza: de {porcentaje(confianza.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(confianza.at(-1)?.valor ?? 0, 1)}.
                </>,
                <>
                  Preferirla: de {porcentaje(proChina.at(0)?.valor ?? 0, 1)} a{' '}
                  {porcentaje(proChina.at(-1)?.valor ?? 0, 1)}.
                </>,
              ]}
              figura={(activo) => (
                <div className="grid gap-x-6 sm:grid-cols-3">
                  <Serie
                    anchoLienzo={300}
                    puntos={opinionChina} unidad="media" etiqueta="Opinión sobre China"
                    color={SEMANTICOS['A favor de China']}
                  />
                  <Serie
                    anchoLienzo={300}
                    puntos={confianza} unidad="porcentaje" etiqueta="Mucha confianza en China"
                    color={SEMANTICOS['A favor de China']}
                    visible={() => activo >= 1}
                  />
                  <Serie
                    anchoLienzo={300}
                    puntos={proChina} unidad="porcentaje" etiqueta="A favor de China"
                    color={SEMANTICOS['A favor de China']}
                    visible={() => activo >= 2}
                  />
                </div>
              )}
              nota={(
                // Una línea, y no dos: en 360 px la escena mide 825 px contra una pantalla de
                // 780, y la nota es lo que sobra. Lo que la nota decía de la muestra ya está en
                // «Sobre los datos», que es donde se consulta; lo que no está en ninguna otra
                // parte es que estos tres ejes no se comparan entre sí.
                <p className="text-xs leading-snug text-gray-500">
                  Tres ejes distintos: las pendientes no se comparan.
                </p>
              )}
            />
          </>
        )}
      </CapaRecorrido>
    </>
  )
}

function Tablero ({ encuesta, casos, corte, soloIndependientes, olas }: {
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  soloIndependientes: boolean
  olas: number[]
}) {
  // De qué figura le hablaron. El recorrido enlaza `#/tablero?foco=termometro`, y el tablero
  // lleva la vista a ese módulo y lo marca: en una rejilla de veintisiete tarjetas, «está más
  // abajo» no es una respuesta.
  const [parametros] = useSearchParams()
  const foco = parametros.get('foco')
  useEffect(() => {
    if (!foco) return
    const nodo = document.getElementById(`modulo-${foco}`)
    // `start` y no `center`: el termómetro mide más que la pantalla, y centrarlo deja su título
    // (y su pregunta) arriba del borde. El aire bajo los pegajosos lo pone `scroll-mt-40`.
    nodo?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [foco])

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
                      destacado={def.id === foco}
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
                    destacado={def.id === foco}
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
  definicion, variable, encuesta, casos, corte, soloIndependientes, olas, destacado,
}: {
  definicion: typeof MODULOS[number]
  variable: NonNullable<ReturnType<typeof variableDe>>
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  soloIndependientes: boolean
  olas: number[]
  destacado: boolean
}) {
  // Con corte activo la figura muestra la distribución por grupo; sin corte, la serie por
  // oleada. Son dos preguntas distintas y no tiene sentido responder las dos a la vez.
  // `por-region` e `ideologia` ya son desagregaciones: aplicarles el corte encima cruzaría
  // dos variables, que es justo lo que la muestra no aguanta.
  // `termometro` entra acá porque **se desagrega él mismo**: con corte cambia sus filas de países
  // a grupos. Sin esta línea caía en la rama de distribución, que a una variable continua de 0 a
  // 100 le pide una categoría por valor: la tarjeta medía 7.667 px.
  const yaDesagrega = definicion.forma === 'por-region' || definicion.forma === 'ideologia' ||
    definicion.forma === 'densidad' || definicion.forma === 'termometro'
  if (corte && !yaDesagrega) {
    const agregado = distribucion(casos, variable, { excluidos: definicion.excluidos })
    const orden = CORTES.find((c) => c.nombre === corte)?.orden
    const grupos = porGrupo(casos, corte, encuesta.variables, orden).map((g) => ({
      etiqueta: g.etiqueta,
      agregado: distribucion(g.casos, variable, { excluidos: definicion.excluidos }),
    }))
    return (
      <Modulo destacado={destacado} definicion={definicion} variable={variable} base={agregado.base}>
        <Distribucion agregado={agregado} grupos={grupos} />
      </Modulo>
    )
  }

  if (definicion.forma === 'termometro') {
    return (
      <Modulo destacado={destacado} definicion={definicion} variable={variable} base={media(casos, definicion.variable).base}>
        <TermometroTablero
          encuesta={encuesta}
          casos={casos}
          corte={corte}
          olas={olas}
          variable={definicion.variable}
        />
      </Modulo>
    )
  }

  if (definicion.forma === 'densidad') {
    const base = media(casos, definicion.variable).base
    return (
      <Modulo destacado={destacado} definicion={definicion} variable={variable} base={base}>
        <Densidad encuesta={encuesta} casos={casos} corte={corte} variable={definicion.variable} />
      </Modulo>
    )
  }

  if (definicion.forma === 'ideologia') {
    const base = media(casos, definicion.variable).base
    return (
      <Modulo destacado={destacado} definicion={definicion} variable={variable} base={base}>
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
      <Modulo destacado={destacado} definicion={definicion} variable={variable} base={agregado.base}>
        <PorRegion encuesta={encuesta} casos={casos} variable={variable} />
      </Modulo>
    )
  }

  if (definicion.forma === 'distribucion') {
    const agregado = distribucion(casos, variable, { excluidos: definicion.excluidos })
    return (
      <Modulo destacado={destacado} definicion={definicion} variable={variable} base={agregado.base}>
        <Distribucion agregado={agregado} />
      </Modulo>
    )
  }

  const puntos = serie(encuesta, variable, (c) => valorDe(definicion, c, variable), { soloIndependientes })
  const base = definicion.forma === 'serie-media'
    ? media(casos, definicion.variable).base
    : distribucion(casos, variable, { excluidos: definicion.excluidos }).base

  return (
    <Modulo destacado={destacado} definicion={definicion} variable={variable} base={base}>
      <Serie puntos={puntos} unidad={definicion.forma === 'serie-media' ? 'media' : 'porcentaje'} />
    </Modulo>
  )
}

/**
 * El termómetro en el tablero: **la misma figura del recorrido**, con la misma escala y el mismo
 * orden de filas (ver `nucleo/termometro.ts`).
 *
 * **Sin corte, las filas son los países.** Un 65,8 solo no significa nada, que es lo que la bajada
 * del módulo viene prometiendo desde el principio y la figura no cumplía.
 *
 * **Con un corte activo, las filas son los grupos y el país es solo China.** La pregunta cambia:
 * ya no es «cómo se compara China con los otros» sino «quiénes evalúan mejor a China». Cinco
 * países por seis grupos serían treinta filas, que no se leen. Es una decisión del cliente
 * (07-09-2026), no una limitación técnica.
 */
function TermometroTablero ({ encuesta, casos, corte, olas, variable }: {
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  olas: number[]
  variable: string
}) {
  const activas = encuesta.olas.filter((o) => olas.includes(o))
  const tonos = pasosDeOrden(activas.length)
  const series = activas.map((ola, i) => ({ clave: String(ola), etiqueta: String(ola), color: tonos[i] }))
  const deOla = (lista: ReturnType<typeof filtrar>, ola: number) => lista.filter((c) => Number(c.ola) === ola)

  // Sin corte, una fila por país; con corte, una fila por grupo y solo China.
  const orden = CORTES.find((c) => c.nombre === corte)?.orden
  const fuentes = corte
    ? porGrupo(casos, corte, encuesta.variables, orden).map((g) => ({ clave: g.etiqueta, etiqueta: g.etiqueta, casos: g.casos, campo: variable }))
    : TERMOMETRO.map((p) => ({ clave: p.pais, etiqueta: p.pais, casos, campo: p.nombre }))

  const medidas = fuentes.map((f) => ({
    clave: f.clave,
    etiqueta: f.etiqueta,
    resumen: activas.map((ola) => media(deOla(f.casos, ola), f.campo)),
  }))

  const figura = figuraTermometro(medidas.map((m) => ({
    clave: m.clave,
    etiqueta: m.etiqueta,
    valores: m.resumen.map((r) => (r.base > 0 ? r.media : null)),
  })))
  const bases = new Map(medidas.map((m) => [m.clave, m.resumen]))

  if (figura.filas.length === 0 || activas.length === 0) {
    return <p className="text-sm text-gray-500">Sin casos para el recorte elegido.</p>
  }

  return (
    <Puntos
      series={series}
      filas={figura.filas}
      escala={figura.escala}
      marcas={figura.marcas}
      unidadEje={figura.unidadEje}
      formato={(v) => decimal(v, 1)}
      formatoEje={(v) => decimal(v, 0)}
      titulo={(fila, serie, valor) => {
        const i = activas.indexOf(Number(serie.clave))
        const r = bases.get(fila.clave)?.[i]
        return `${fila.etiqueta} · ${serie.etiqueta}: ${decimal(valor)} sobre 100 (n = ${numero(r?.base ?? 0)})`
      }}
      rotular={activas.length - 1}
      radioCreciente
      anchoEtiqueta="9rem"
    />
  )
}

/**
 * Los módulos de selección múltiple no tienen una variable en el diccionario: su `variable` es
 * el id de un grupo de columnas binarias. Por eso van por su propio camino, con una ficha
 * sintética que le da al pie del módulo lo que necesita.
 */
function MultipleFigura ({
  definicion, encuesta, casos, corte, destacado,
}: {
  definicion: typeof MODULOS[number]
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  destacado: boolean
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
    <Modulo destacado={destacado} definicion={definicion} variable={variable} base={datos.base}>
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
  // Mismo patrón que el tablero: `#/datos?foco=metodo-recorrido` lleva la vista al bloque. Es lo
  // que hace que el enlace desde el recorrido caiga en la sección y no al principio de la página.
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
            más de una oleada y se pueden excluir con el control del tablero.
          </li>
          <li>
            <strong>Los porcentajes van sobre respuestas efectivas</strong>, sin perdidos. Cada figura
            muestra su propia base, que suele ser menor que el total del recorte.
          </li>
        </ul>

        {encuesta.contrastes && <Contrastes contrastes={encuesta.contrastes} olas={encuesta.olas} />}

        <div id="metodo-recorrido">
          <MetodoRecorrido encuesta={encuesta} />
        </div>

        <h3 className="mt-8 font-display text-base font-semibold text-gray-900">Qué falta en este borrador</h3>
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
