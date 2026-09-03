import { useEffect, useMemo, useState } from 'react'
import type { Encuesta } from './nucleo/tipos'
import { distribucion, filtrar, media, porGrupo, proporcion, serie } from './nucleo/agregar'
import { MODULOS, TERMOMETRO, variableDe, valorDe } from './nucleo/modulos'
import BarraEstado from './componentes/BarraEstado'
import Modulo from './componentes/Modulo'
import Distribucion from './componentes/Distribucion'
import Serie, { Trazo } from './componentes/Serie'
import { escalaDe } from './nucleo/escala'
import Explorador from './Explorador'
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

type Vista = 'visualizador' | 'explorador'

export default function App () {
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>('visualizador')

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
      <Encabezado vista={vista} onVista={setVista} />

      {vista === 'explorador'
        ? <Explorador />
        : (
          <>
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
            <Tablero encuesta={encuesta} casos={casos} corte={corte} soloIndependientes={soloIndependientes} />
            <Pie encuesta={encuesta} />
          </>
          )}
    </div>
  )
}

function Encabezado ({ vista, onVista }: { vista: Vista, onVista: (v: Vista) => void }) {
  return (
    <header className="bg-brand-dark text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-xs uppercase tracking-widest text-white/70">ICLAC · Borrador</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Monitor de opinión pública sobre China</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Tres oleadas de la Encuesta de Percepciones sobre China en Chile: 2023, 2024 y 2025.
        </p>
        <nav className="mt-5 flex gap-2 text-sm">
          {([['visualizador', 'Visualizador'], ['explorador', 'Explorador de datos']] as const).map(([id, texto]) => (
            <button
              key={id}
              type="button"
              onClick={() => onVista(id)}
              aria-current={vista === id ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                vista === id ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {texto}
            </button>
          ))}
        </nav>
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
function Recorrido ({ encuesta }: { encuesta: Encuesta }) {
  const todos = (ola: number) => filtrar(encuesta, { olas: [ola] })

  const termometro = TERMOMETRO.map((p) => ({
    ...p,
    puntos: encuesta.olas.map((ola) => ({ ola, valor: media(todos(ola), p.nombre).media, base: todos(ola).length })),
  }))
  const escala = escalaDe(termometro.map((t) => t.puntos), 'media')

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

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="font-display text-2xl font-semibold">Qué se movió entre 2023 y 2025</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Tres cambios que ordenan el resto. Las cifras se calculan sobre la base publicada, así que se
        corrigen solas cuando entra una oleada nueva.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Tramo titulo="China pasa a Estados Unidos, y no es porque China haya subido">
          <p>
            En 2023 y 2024 Estados Unidos estaba mejor evaluado que China. En 2025 se invierte: China
            llega a {decimal(termometro[0].puntos.at(-1)!.valor)} y Estados Unidos cae a{' '}
            {decimal(termometro[1].puntos.at(-1)!.valor)}. Es la primera vez que China queda por
            encima, y pesa más la caída estadounidense que el alza china. Japón sigue siendo el mejor
            evaluado de los cinco.
          </p>
          <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {termometro.map((t, i) => (
              <Trazo
                key={t.nombre}
                puntos={t.puntos}
                escala={escala}
                unidad="media"
                etiqueta={t.pais}
                color={['#00776E', '#0176AF', '#7FBFB8', '#B8D8D4', '#F56A0D'][i]}
              />
            ))}
          </div>
        </Tramo>

        <Tramo titulo="La confianza en China crece, y la brecha se abre por un lado solo">
          <p>
            Quienes dicen tener mucha confianza en la capacidad de China para manejar responsablemente
            los problemas de América Latina pasan de {porcentaje(confianza.at(0)?.valor ?? 0, 1)} a{' '}
            {porcentaje(confianza.at(-1)?.valor ?? 0, 1)}. La confianza en Estados Unidos se mantiene
            prácticamente igual en las tres oleadas.
          </p>
          <Serie puntos={confianza} unidad="porcentaje" etiqueta="Mucha confianza en China" />
        </Tramo>

        <Tramo titulo="La mayoría no alineada se erosiona, y lo que pierde se va a China">
          <p>
            Sumando a quienes quieren relacionarse con ambas potencias y a quienes prefieren mantener
            distancia de las dos, el no alineamiento cae de {porcentaje(primera, 1)} a{' '}
            {porcentaje(ultima, 1)}. Sigue siendo una mayoría amplia, pero se desgasta. Lo interesante
            es la composición de la minoría que sí quiere elegir: preferir a China pasa de{' '}
            {porcentaje(proChina.at(0)?.valor ?? 0, 1)} a {porcentaje(proChina.at(-1)?.valor ?? 0, 1)},
            mientras preferir a Estados Unidos baja de {porcentaje(proEeuu.at(0)?.valor ?? 0, 1)} a{' '}
            {porcentaje(proEeuu.at(-1)?.valor ?? 0, 1)}. En 2025, por primera vez, hay más chilenos que
            quieren alinearse con China que con Estados Unidos.
          </p>
          <div className="mt-2 grid gap-x-6 sm:grid-cols-3">
            <Serie puntos={noAlineado} unidad="porcentaje" etiqueta="No alineamiento" />
            <Serie puntos={proChina} unidad="porcentaje" etiqueta="A favor de China" color="#F56A0D" />
            <Serie puntos={proEeuu} unidad="porcentaje" etiqueta="A favor de EE.UU." color="#0176AF" />
          </div>
          <p className="mt-2 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-snug text-gray-700">
            <strong>Difiere de la guía.</strong> El documento de ICLAC describe este hallazgo como
            estable, «alrededor del 72 % en las tres olas». Sobre la base publicada el no alineamiento
            cae cinco puntos y cae de forma monótona; el 72 % describe solo a 2025. Está consultado
            con ICLAC (<code className="rounded bg-white/70 px-1">C16</code>).
          </p>
        </Tramo>
      </div>
    </section>
  )
}

function Tramo ({ titulo, children }: { titulo: string, children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      <div className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">{children}</div>
    </article>
  )
}

function Tablero ({ encuesta, casos, corte, soloIndependientes }: {
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  soloIndependientes: boolean
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
  definicion, variable, encuesta, casos, corte, soloIndependientes,
}: {
  definicion: typeof MODULOS[number]
  variable: NonNullable<ReturnType<typeof variableDe>>
  encuesta: Encuesta
  casos: ReturnType<typeof filtrar>
  corte: string | null
  soloIndependientes: boolean
}) {
  // Con corte activo la figura muestra la distribución por grupo; sin corte, la serie por
  // oleada. Son dos preguntas distintas y no tiene sentido responder las dos a la vez.
  if (corte) {
    const agregado = distribucion(casos, variable, { excluidos: definicion.excluidos })
    const grupos = porGrupo(casos, corte, encuesta.variables).map((g) => ({
      etiqueta: g.etiqueta,
      agregado: distribucion(g.casos, variable, { excluidos: definicion.excluidos }),
    }))
    return (
      <Modulo definicion={definicion} variable={variable} base={agregado.base}>
        <Distribucion agregado={agregado} grupos={grupos} />
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
          <li>Falta el resto de los módulos: nubes de palabras, multi-respuesta (p20, p22) y el explorador libre integrado.</li>
          <li>Falta la paleta categórica propia y la verificación en los tres anchos de pantalla.</li>
          <li>Sin descargas todavía: la base combinada, las tres por ola y los libros de códigos van con la nota metodológica.</li>
        </ul>
      </div>
    </footer>
  )
}
