import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import { EXPOSICION } from '../nucleo/paleta'
import { ESTRATOS, NIVEL_ESTRATO, composicion, edades, pesoDeRegion, regionesPorIndice } from '../nucleo/ficha'
import { participacion } from '../nucleo/agregar'
import { decimal, numero, rangoDeFechas } from '../locale'
import MapaRegiones from './MapaRegiones'

/**
 * La «Ficha técnica»: la encuesta en sí (quién, cómo, diseño, muestra, alcance), no lo que hace la
 * página, que va en «Sobre los datos».
 *
 * **Solo descriptiva.** Cada frase se sostiene en un hecho verificado; nada califica el diseño. El
 * texto se redactó con Codex sobre un expediente de hechos y se decidió en el laboratorio
 * `laboratorio/la-encuesta.html` (24-09-2026); la procedencia de cada frase está en
 * `la documentación interna`.
 *
 * **Ninguna cifra a mano:** las de los casos se calculan (`nucleo/ficha.ts`) y las que no están en los
 * casos (fechas, duración, índice) las escribe el ETL en `encuesta.ficha`.
 */

// Q1 (exposición muy alta) es el paso más oscuro de la rampa, igual que en «Donde uno vive».
const colorQ = (q: number) => EXPOSICION[4 - q]
const rotuloQ = (q: number) => `Q${q} · ${NIVEL_ESTRATO[ESTRATOS[q - 1]]}`
const lista = (xs: string[]) => xs.join(', ').replace(/, ([^,]+)$/, ' y $1')

const PARRAFO = 'mt-2 text-justify hyphens-auto'
const TITULO = 'mt-10 font-display text-base font-semibold text-gray-900'
const FUENTE = 'mt-1.5 text-center text-xs text-gray-500'
// Bajo 640 px la tabla se ajusta al ancho y reparte lo mínimo; sin tope crecería a su ancho máximo.
const TABLA = 'mx-auto w-full border-collapse border border-gray-200 bg-white text-[0.75rem] min-[400px]:text-[0.8125rem] sm:w-auto'
const CELDA = 'border-b border-gray-200 px-[3px] py-1 align-top first:pl-1.5 min-[400px]:px-[7px] sm:px-2.5'
const CABEZA = `${CELDA} bg-gray-50 text-left text-xs font-semibold text-gray-500`
const NUM = 'text-right tabular-nums whitespace-nowrap'

function Ref ({ n }: { n: string }) {
  return <sup className="text-[0.625rem] text-gray-500"> [{n}]</sup>
}

function Tabla ({ children }: { children: ReactNode }) {
  return <div className="mt-3 overflow-x-auto"><table className={TABLA}>{children}</table></div>
}

export default function FichaTecnica ({ encuesta }: { encuesta: Encuesta }) {
  const olas = encuesta.olas
  const campo = encuesta.ficha?.campo ?? {}
  const regiones = regionesPorIndice(encuesta)
  const rm = pesoDeRegion(encuesta, 13)
  const pesosRm = olas.map((o) => rm[o])
  const e = edades(encuesta)
  const p = participacion(encuesta)

  return (
    <section lang="es" className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-sm text-gray-600">
      <h2 className="font-display text-2xl font-semibold text-gray-900">Ficha técnica</h2>

      <h3 className="mt-8 font-display text-base font-semibold text-gray-900">Institución y objetivo</h3>
      <p className={PARRAFO}>
        La Encuesta de Percepciones sobre China en Chile es una encuesta de aplicación anual del Núcleo
        Milenio ICLAC, de la Pontificia Universidad Católica de Chile, financiada por ANID a través del
        Programa Iniciativa Científica Milenio, proyecto NCS2022_053. La serie disponible comprende las
        oleadas de {lista(olas.map(String))}.<Ref n="1, 3" />
      </p>
      <p className={PARRAFO}>
        El objetivo de la encuesta es analizar el impacto económico de China a nivel subnacional. Su
        informe de referencia es el <i>Monitor de Opinión Pública 2023</i>, publicado en 2024.<Ref n="1" />
      </p>

      <h3 className={TITULO}>Aplicación y cuestionario</h3>
      <p className={PARRAFO}>
        El cuestionario, autoadministrado, fue aplicado por Netquest a miembros de su panel en línea, y la
        selección de participantes fue no probabilística. Las fechas de la tabla van de la primera a la
        última respuesta completada de cada oleada.<Ref n="1, 3" />
      </p>
      <Tabla>
        <thead><tr><th className={CABEZA}>Oleada</th><th className={CABEZA}>Fechas de aplicación</th><th className={`${CABEZA} text-right`}>Duración mediana</th></tr></thead>
        <tbody>
          {olas.map((o) => campo[o] && (
            <tr key={o}>
              <td className={CELDA}>{o}</td>
              <td className={CELDA}>{rangoDeFechas(campo[o].desde, campo[o].hasta)}</td>
              <td className={`${CELDA} ${NUM}`}>{decimal(campo[o].duracionMediana / 60)} minutos</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      <p className={FUENTE}>Fuente: registro de las respuestas de cada oleada.<Ref n="3" /></p>
      <p className={PARRAFO}>
        El cuestionario de 2023 contenía alrededor de 30 preguntas.<Ref n="1, 2" /> En 2025 se incorporaron
        bloques sobre marcas y empresas chinas, fuentes de información y transporte público eléctrico,
        además de un módulo experimental sobre Estados Unidos y una inversión china en
        telecomunicaciones.<Ref n="2, 4" />
      </p>

      <h3 className={TITULO}>Diseño muestral</h3>
      <p className={PARRAFO}>
        La muestra se estratificó según la exposición económica de cada región a China, y no en proporción
        a su población. El índice utilizado se construyó con las exportaciones regionales a China
        registradas por el Servicio Nacional de Aduanas entre enero y agosto de 2023, y combina, para cada
        región, su participación en el total exportado por Chile a China y el peso de China en las
        exportaciones totales de la región.<Ref n="1, 2" />
      </p>
      <p className={PARRAFO}>
        Las 16 regiones se ordenaron según el índice y se agruparon en cuatro estratos de cuatro regiones,
        equivalentes a sus cuartiles: Q1 reúne a las de mayor exposición y Q4 a las de menor. El tamaño
        objetivo fue de 660 casos. El diseño se mantuvo en las tres
        oleadas. Como consecuencia, la distribución regional de la muestra difiere de la de la población:
        la Región Metropolitana reúne entre el {decimal(Math.min(...pesosRm))}% y
        el {decimal(Math.max(...pesosRm))}% de los casos, según la oleada.<Ref n="1, 2, 3" />
      </p>
      <div className="mt-3 flex items-start justify-center gap-5">
        {/* El mapa solo desde 640 px: en teléfono la tabla ya ocupa el ancho entero. */}
        <div className="ficha-mapa hidden shrink-0 flex-col gap-2 sm:flex">
          <MapaRegiones
            relleno={(codigo) => colorQ(regiones.find((r) => r.codigo === codigo)?.q ?? 4)}
            descripcion={`Mapa de Chile por estrato de exposición económica a China. ${[1, 2, 3, 4].map((q) => `${rotuloQ(q)}: ${lista(regiones.filter((r) => r.q === q).map((r) => r.nombre))}`).join('. ')}.`}
          />
          <ul className="flex flex-col gap-0.5 text-[0.71875rem] text-gray-600">
            {[1, 2, 3, 4].map((q) => (
              <li key={q}><span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: colorQ(q) }} />{rotuloQ(q)}</li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto sm:flex-none">
          <table className={TABLA}>
            <thead>
              <tr>
                <th className={CABEZA}>Estrato</th><th className={CABEZA}>Región</th><th className={`${CABEZA} text-right`}>Índice</th>
                {olas.map((o) => <th key={o} className={`${CABEZA} text-right`}>{o}</th>)}
              </tr>
            </thead>
            <tbody>
              {regiones.map((r) => (
                <tr key={r.codigo}>
                  <td className={`${CELDA} whitespace-nowrap`}>
                    <span aria-hidden className="mr-1.5 hidden h-2.5 w-2.5 rounded-sm align-[-1px] sm:inline-block" style={{ background: colorQ(r.q) }} />
                    <span className="sm:hidden">Q{r.q}</span><span className="hidden sm:inline">{rotuloQ(r.q)}</span>
                  </td>
                  <td className={CELDA}>{r.nombre}</td>
                  <td className={`${CELDA} ${NUM}`}>{decimal(r.indice, 2)}</td>
                  {olas.map((o) => <td key={o} className={`${CELDA} ${NUM}`}>{numero(r.n[o] ?? 0)}</td>)}
                </tr>
              ))}
              <tr className="font-semibold text-gray-900">
                <td className={`${CELDA} border-b-0`} /><td className={`${CELDA} border-b-0`}>Total</td><td className={`${CELDA} border-b-0`} />
                {olas.map((o) => <td key={o} className={`${CELDA} ${NUM} border-b-0`}>{numero(encuesta.n[o])}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className={FUENTE}>Fuentes: estratos e índice, nota metodológica<Ref n="2" />; casos por región, base combinada<Ref n="3" />.</p>

      <h3 className={TITULO}>Casos por oleada</h3>
      <p className={PARRAFO}>
        La base utilizada en este sitio contiene {lista(olas.map((o, i) => `${numero(encuesta.n[o])}${i === 0 ? ' casos' : ''} de ${o}`))},
        que suman {numero(p.respuestas)} registros.<Ref n="3" /> En 2025 la muestra se amplió para aplicar
        un módulo experimental; por eso esa oleada tiene cerca del doble de casos que las anteriores.
      </p>
      <p className={PARRAFO}>
        Las tres oleadas son cortes transversales: no se sigue a las personas entre una y otra.{' '}
        {numero(p.repetidas)} personas participaron en más de una ({numero(p.enDos)} en dos y {numero(p.enTres)} en
        las tres), lo que corresponde a {numero(p.filasRepetidas)} registros.<Ref n="3" />
      </p>

      <h3 className={TITULO}>Composición de las muestras</h3>
      <p className={PARRAFO}>
        Número de casos y porcentaje sobre el total de cada oleada, sin ponderar. Las edades observadas van
        de {lista(olas.map((o) => `${e[o].min} a ${e[o].max} años en ${o}`))}, con medianas
        de {lista(olas.map((o) => numero(e[o].mediana)))} años, respectivamente.<Ref n="3" />
      </p>
      <Tabla>
        <thead>
          <tr>
            <th className={CABEZA}><span className="sr-only">Categoría</span></th>
            {olas.map((o) => <th key={o} className={`${CABEZA} text-right`}>{o}<br /><span className="font-normal">n (%)</span></th>)}
          </tr>
        </thead>
        <tbody>
          {composicion(encuesta).map((g) => [
            <tr key={g.variable}><th scope="colgroup" colSpan={olas.length + 1} className={`${CELDA} bg-gray-50 text-left text-xs font-semibold text-gray-900`}>{g.variable}</th></tr>,
            ...g.categorias.map((c) => (
              <tr key={`${g.variable}-${c.etiqueta}`}>
                <td className={CELDA}>{c.etiqueta}</td>
                {/* En teléfono, n arriba y porcentaje abajo en todas las celdas, no solo en las que no caben. */}
                {olas.map((o) => (
                  <td key={o} className={`${CELDA} ${NUM}`}>
                    {numero(c.n[o])}<span className="block sm:ml-1 sm:inline">({decimal(100 * c.n[o] / encuesta.n[o])})</span>
                  </td>
                ))}
              </tr>
            )),
          ])}
        </tbody>
      </Tabla>
      <p className={FUENTE}>Fuente: base combinada<Ref n="3" />. Por redondeo, los porcentajes pueden no sumar 100.</p>

      <h3 className={TITULO}>Alcance de las cifras</h3>
      <p className={PARRAFO}>
        Las cifras describen las respuestas de las personas participantes y no se extrapolan a la población
        de Chile ni de sus regiones. La selección es no probabilística y ninguna oleada dispone de factores
        de expansión. Por eso los resultados se presentan sin ponderar, sobre respuestas efectivas, con el
        número de casos indicado y sin margen de error. No se dispone de una tasa de respuesta
        documentada.<Ref n="1, 2, 3" />
      </p>
      <p className={PARRAFO}>
        Algunas preguntas cambiaron de enunciado o de categorías entre oleadas; solo se comparan entre
        oleadas las que se mantuvieron idénticas, salvo la intención de voto, que se compara por candidato
        y con una nota. El <NavLink to="/explorar" className="text-brand-dark underline">explorador</NavLink> lo
        indica pregunta por pregunta.
      </p>

      <h3 className={TITULO}>Fuentes</h3>
      <ol className="mt-2 list-none space-y-1.5 p-0 text-[0.78125rem]">
        <li>
          [1] Jenne, N., Labarca, C., Montt, M. y Urdinez, F. (2024). <i>Monitor de Opinión Pública 2023: ¿Qué
          piensan los chilenos sobre China?</i> Policy Paper ICLAC 3.{' '}
          <a href="https://doi.org/10.5281/zenodo.12700686" target="_blank" rel="noopener noreferrer" className="break-all text-brand-dark underline">https://doi.org/10.5281/zenodo.12700686</a>
        </li>
        <li>[2] ICLAC. <i>Nota metodológica: diseño muestral y composición de la muestra. Olas 2023, 2024 y 2025.</i> Disponible en <NavLink to="/descargas" className="text-brand-dark underline">Descargas</NavLink>.</li>
        <li>[3] ICLAC. <i>Base combinada de la Encuesta de Percepciones sobre China en Chile, 2023 a 2025.</i> Disponible en <NavLink to="/descargas" className="text-brand-dark underline">Descargas</NavLink>.</li>
        <li>[4] ICLAC. <i>Cuestionario de la Encuesta de Percepciones sobre China en Chile, 2025.</i> Disponible en <NavLink to="/descargas" className="text-brand-dark underline">Descargas</NavLink>.</li>
      </ol>
    </section>
  )
}
