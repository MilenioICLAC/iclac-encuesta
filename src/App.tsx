import { useEffect, useMemo, useState } from 'react'
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
import { escalaRedonda } from './nucleo/escala'
import { IDENTIDAD, SEMANTICOS } from './nucleo/paleta'
import { decimal, numero, porcentaje } from './locale'

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Encabezado />
      <Recorrido encuesta={encuesta} />
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
      <Tablero
        encuesta={encuesta}
        casos={casos}
        corte={corte}
        soloIndependientes={soloIndependientes}
        olas={olas}
      />
      <Nubes encuesta={encuesta} />
      <Graficador
        encuesta={encuesta}
        casos={casos}
        corte={corte}
        soloIndependientes={soloIndependientes}
      />
      <Descargas />
      <Pie encuesta={encuesta} />
    </div>
  )
}

function Encabezado () {
  return (
    <header className="bg-brand-dark text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-xs uppercase tracking-widest text-white/70">ICLAC · Borrador</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Monitor de opinión pública sobre China</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Tres oleadas de la Encuesta de Percepciones sobre China en Chile: 2023, 2024 y 2025.
        </p>
      </div>
    </header>
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
  const pasosEncendidos = encendidos(encuesta.olas)
  const bases = termometro.flatMap((t) => t.valores.map((v) => v.base)).filter((n) => n > 0)
  const baseMinima = Math.min(...bases)
  const baseMaxima = Math.max(...bases)

  const p24 = variableDe(encuesta, 'p24')
  const p26 = variableDe(encuesta, 'p26')

  const confianza = p24
    ? encuesta.olas.map((ola) => ({ ola, valor: proporcion(todos(ola), p24, [1]).porcentaje, base: todos(ola).length }))
    : []

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

  const serieTermometro = encuesta.olas.map((ola, i) => ({
    clave: String(ola),
    etiqueta: String(ola),
    color: IDENTIDAD[i % IDENTIDAD.length],
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
              titulo="China pasa a Estados Unidos, y el cambio entero ocurre en 2025"
              frases={[
                <>
                  Los cinco países se evalúan de 0 a 100. En 2023 y 2024 <strong>Estados Unidos
                  estaba mejor evaluado que China</strong>, y las dos oleadas dan casi lo mismo.
                </>,
                <>
                  En 2025 se invierte: China llega a {decimal(chinaT.at(-1)!.media)} y Estados Unidos
                  cae a {decimal(eeuuT.at(-1)!.media)}, <strong>la primera vez que China queda por
                  encima</strong>. Se mueven las dos, en direcciones opuestas y en magnitud parecida:
                  China sube {decimal(subeChina)} puntos respecto de 2024 y Estados Unidos baja{' '}
                  {decimal(bajaEeuu)}.
                </>,
                <>
                  <strong>Japón sigue siendo el mejor evaluado de los cinco</strong>, en las tres
                  oleadas y sin acercarse a nadie: la comparación con China no es contra un promedio,
                  sino contra países que la gente evalúa muy distinto entre sí.
                </>,
                <>
                  Y con los cinco a la vista se ve lo demás: <strong>2024 no pasó nada</strong>.
                  Ningún país se mueve más de {decimal(quietas)} puntos entre 2023 y 2024, así que el
                  cambio entero ocurre en la última oleada.
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
                  rotular={encuesta.olas.length - 1}
                  visible={(pais, ola) => pasosEncendidos[activo]?.(pais, Number(ola)) ?? true}
                />
              )}
              nota={(
                <p className="text-xs leading-snug text-gray-500">
                  Evaluación de 0 a 100, promedio de quienes contestaron. Rotulada la última oleada.
                  Las bases van de {numero(baseMinima)} a {numero(baseMaxima)} casos según país y
                  oleada, así que los promedios se comparan pero los n no son iguales.
                </p>
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
                  La confianza en Estados Unidos se mantiene prácticamente igual en las tres oleadas,
                  así que <strong>la brecha se abre por un lado solo</strong>: no es que Estados
                  Unidos pierda confianza, es que China gana.
                </>,
              ]}
              figura={() => (
                <Serie puntos={confianza} unidad="porcentaje" etiqueta="Mucha confianza en China" />
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
              figura={() => (
                <div className="grid gap-x-6 sm:grid-cols-3">
                  <Serie puntos={noAlineado} unidad="porcentaje" etiqueta="No alineamiento" />
                  <Serie puntos={proChina} unidad="porcentaje" etiqueta="A favor de China" color={SEMANTICOS['A favor de China']} />
                  <Serie puntos={proEeuu} unidad="porcentaje" etiqueta="A favor de EE. UU." color={SEMANTICOS['A favor de EE. UU.']} />
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

function Pie ({ encuesta }: { encuesta: Encuesta }) {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-600">
        <h2 className="font-display text-base font-semibold text-gray-900">Sobre estos datos</h2>
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
            más de una oleada y se pueden excluir con el control de arriba.
          </li>
          <li>
            <strong>Los porcentajes van sobre respuestas efectivas</strong>, sin perdidos. Cada figura
            muestra su propia base, que suele ser menor que el total del recorte.
          </li>
        </ul>

        <h2 className="mt-6 font-display text-base font-semibold text-gray-900">Qué falta en este borrador</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-gray-500">
          <li>Los textos del recorrido viven en el código; tienen que salir a un archivo de contenido con los tres idiomas.</li>
          <li>Las nubes de palabras no reproducen exactamente las del sitio: el monitor lematiza con Snowball y acá se normalizan los sufijos a mano.</li>
          <li>Falta el sitio en inglés y en chino: hoy solo español, y los textos viven en el código.</li>
          <li>Sin descargas todavía: la base combinada, las tres por ola y los libros de códigos van con la nota metodológica.</li>
        </ul>
      </div>
    </footer>
  )
}
