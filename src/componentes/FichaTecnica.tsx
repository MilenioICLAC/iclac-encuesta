import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import type { Encuesta } from '../nucleo/tipos'
import { EXPOSICION } from '../nucleo/paleta'
import { composicion, edades, pesoDeRegion, regionesPorIndice } from '../nucleo/ficha'
import { ESTRATOS } from '../nucleo/modulos'
import { participacion } from '../nucleo/agregar'
import { decimal, lista, numero, plural, porcentaje, rangoDeFechas, traducido, useIdioma, type Idioma } from '../locale'
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
 * **Los párrafos van en `PROSA`, un bloque por idioma**, porque llevan cifras, referencias y enlaces
 * en medio y el orden de la frase cambia con el idioma; los rótulos cortos, en `paginas.json` (`ficha.*`).
 *
 * **Ninguna cifra a mano:** las de los casos se calculan (`nucleo/ficha.ts`) y las que no están en los
 * casos (fechas, duración, índice) las escribe el ETL en `encuesta.ficha`.
 */

// Q1 (exposición muy alta) es el paso más oscuro de la rampa, igual que en «Donde uno vive».
const colorQ = (q: number) => EXPOSICION[4 - q]
const rotuloQ = (q: number) => `Q${q} · ${traducido(ESTRATOS[q - 1][1].nivel).toLowerCase()}`

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

/** Lo que los párrafos necesitan ya calculado: cifras sueltas, sin formato. */
interface Datos {
  olas: number[]
  n: Record<number, number>
  respuestas: number
  repetidas: number
  enDos: number
  enTres: number
  filasRepetidas: number
  rmMin: number
  rmMax: number
  edades: Record<number, { min: number, max: number, mediana: number }>
}

interface Prosa {
  institucion: (d: Datos) => ReactNode
  objetivo: ReactNode
  aplicacion: ReactNode
  cuestionario: ReactNode
  estratificacion: ReactNode
  estratos: (d: Datos) => ReactNode
  casos: (d: Datos) => ReactNode
  transversales: (d: Datos) => ReactNode
  composicion: (d: Datos) => ReactNode
  alcance: ReactNode
  comparables: (explorador: ReactNode) => ReactNode
  explorador: string
  /** Las referencias. Los documentos están en español, y en inglés y en chino se dice. */
  fuentes: (descargas: (texto: string) => ReactNode) => ReactNode[]
}

const DOI = <a href="https://doi.org/10.5281/zenodo.12700686" target="_blank" rel="noopener noreferrer" className="break-all text-brand-dark underline">https://doi.org/10.5281/zenodo.12700686</a>
const POLICY = <i>Monitor de Opinión Pública 2023: ¿Qué piensan los chilenos sobre China?</i>
const NOTA = <i>Nota metodológica: diseño muestral y composición de la muestra. Olas 2023, 2024 y 2025.</i>
const BASE = <i>Base combinada de la Encuesta de Percepciones sobre China en Chile, 2023 a 2025.</i>
const CUESTIONARIO = <i>Cuestionario de la Encuesta de Percepciones sobre China en Chile, 2025.</i>

const PROSA: Record<Idioma, Prosa> = {
  es: {
    institucion: (d) => <>
      La Encuesta de Percepciones sobre China en Chile es una encuesta de aplicación anual del Núcleo
      Milenio ICLAC, de la Pontificia Universidad Católica de Chile, financiada por ANID a través del
      Programa Iniciativa Científica Milenio, proyecto NCS2022_053. La serie disponible comprende las
      oleadas de {lista(d.olas.map(String))}.<Ref n="1, 3" />
    </>,
    objetivo: <>
      El objetivo de la encuesta es analizar el impacto económico de China a nivel subnacional. Su
      informe de referencia es el <i>Monitor de Opinión Pública 2023</i>, publicado en 2024.<Ref n="1" />
    </>,
    aplicacion: <>
      El cuestionario, autoadministrado, fue aplicado por Netquest a miembros de su panel en línea, y la
      selección de participantes fue no probabilística. Las fechas de la tabla van de la primera a la
      última respuesta completada de cada oleada.<Ref n="1, 3" />
    </>,
    cuestionario: <>
      El cuestionario de 2023 contenía alrededor de {numero(30)} preguntas.<Ref n="1, 2" /> En 2025 se incorporaron
      bloques sobre marcas y empresas chinas, fuentes de información y transporte público eléctrico,
      además de un módulo experimental sobre Estados Unidos y una inversión china en
      telecomunicaciones.<Ref n="2, 4" />
    </>,
    estratificacion: <>
      La muestra se estratificó según la exposición económica de cada región a China, y no en proporción
      a su población. El índice utilizado se construyó con las exportaciones regionales a China
      registradas por el Servicio Nacional de Aduanas entre enero y agosto de 2023, y combina, para cada
      región, su participación en el total exportado por Chile a China y el peso de China en las
      exportaciones totales de la región.<Ref n="1, 2" />
    </>,
    estratos: (d) => <>
      Las {numero(16)} regiones se ordenaron según el índice y se agruparon en cuatro estratos de cuatro regiones,
      equivalentes a sus cuartiles: Q1 reúne a las de mayor exposición y Q4 a las de menor. El tamaño
      objetivo fue de {numero(660)} casos. El diseño se mantuvo en las tres
      oleadas. Como consecuencia, la distribución regional de la muestra difiere de la de la población:
      la Región Metropolitana reúne entre el {decimal(d.rmMin)}% y
      el {decimal(d.rmMax)}% de los casos, según la oleada.<Ref n="1, 2, 3" />
    </>,
    casos: (d) => <>
      La base utilizada en este sitio contiene {lista(d.olas.map((o, i) => `${numero(d.n[o])}${i === 0 ? ' casos' : ''} de ${o}`))},
      que suman {numero(d.respuestas)} registros.<Ref n="3" /> En 2025 la muestra se amplió para aplicar
      un módulo experimental; por eso esa oleada tiene cerca del doble de casos que las anteriores.
    </>,
    transversales: (d) => <>
      Las tres oleadas son cortes transversales: no se sigue a las personas entre una y otra.{' '}
      {numero(d.repetidas)} personas participaron en más de una ({numero(d.enDos)} en dos y {numero(d.enTres)} en
      las tres), lo que corresponde a {numero(d.filasRepetidas)} registros.<Ref n="3" />
    </>,
    composicion: (d) => <>
      Número de casos y porcentaje sobre el total de cada oleada, sin ponderar. Las edades observadas van
      de {lista(d.olas.map((o) => `${d.edades[o].min} a ${d.edades[o].max} años en ${o}`))}, con medianas
      de {lista(d.olas.map((o) => numero(d.edades[o].mediana)))} años, respectivamente.<Ref n="3" />
    </>,
    alcance: <>
      Las cifras describen las respuestas de las personas participantes y no se extrapolan a la población
      de Chile ni de sus regiones. La selección es no probabilística y ninguna oleada dispone de factores
      de expansión. Por eso los resultados se presentan sin ponderar, sobre respuestas efectivas, con el
      número de casos indicado y sin margen de error. No se dispone de una tasa de respuesta
      documentada.<Ref n="1, 2, 3" />
    </>,
    comparables: (explorador) => <>
      Algunas preguntas cambiaron de enunciado o de categorías entre oleadas; solo se comparan entre
      oleadas las que se mantuvieron idénticas, salvo la intención de voto, que se compara por candidato
      y con una nota. El {explorador} lo indica pregunta por pregunta.
    </>,
    explorador: 'explorador',
    fuentes: (descargas) => [
      <>[1] Jenne, N., Labarca, C., Montt, M. y Urdinez, F. (2024). {POLICY} Policy Paper ICLAC 3.{' '}{DOI}</>,
      <>[2] ICLAC. {NOTA} Disponible en {descargas('Descargas')}.</>,
      <>[3] ICLAC. {BASE} Disponible en {descargas('Descargas')}.</>,
      <>[4] ICLAC. {CUESTIONARIO} Disponible en {descargas('Descargas')}.</>,
    ],
  },
  en: {
    institucion: (d) => <>
      The Survey on Perceptions of China in Chile is conducted annually by the ICLAC Millennium Nucleus,
      based at the Pontificia Universidad Católica de Chile, and funded by ANID through the Millennium
      Science Initiative Program, project NCS2022_053. The available survey series covers
      the {lista(d.olas.map(String))} waves.<Ref n="1, 3" />
    </>,
    objetivo: <>
      The survey aims to analyze the economic impact of China at the subnational level. Its reference
      report is <i>Monitor de Opinión Pública 2023</i> (Public opinion monitor 2023), published in 2024.<Ref n="1" />
    </>,
    aplicacion: <>
      The self-administered questionnaire was fielded by Netquest among members of its online panel, and
      participants were selected by non-probability methods. The dates in the table run from the first to
      the last completed response in each wave.<Ref n="1, 3" />
    </>,
    cuestionario: <>
      The 2023 questionnaire had about {numero(30)} questions.<Ref n="1, 2" /> In 2025, blocks were added on
      Chinese companies and brands, sources of information, and electric public transport, along with an
      experimental module on the United States and a Chinese investment in telecommunications.<Ref n="2, 4" />
    </>,
    estratificacion: <>
      The sample was stratified by each region&apos;s level of economic exposure to China, not in proportion
      to its population. The index was built from regional exports to China recorded by Chile&apos;s National
      Customs Service between January and August 2023. For each region, it combines the region&apos;s share
      of Chile&apos;s total exports to China and China&apos;s share of the region&apos;s total exports.<Ref n="1, 2" />
    </>,
    estratos: (d) => <>
      The {numero(16)} regions were ranked by the index and grouped into four strata of four regions each,
      equivalent to quartiles: Q1 contains the regions with the highest exposure and Q4 those with the
      lowest. The target sample size was {numero(660)} cases. The design was kept in all three waves. As a
      result, the regional distribution of the sample differs from that of the population: the Santiago
      Metropolitan Region accounts for between {porcentaje(d.rmMin)} and {porcentaje(d.rmMax)} of cases,
      depending on the wave.<Ref n="1, 2, 3" />
    </>,
    casos: (d) => <>
      The data file used on this site contains {lista(d.olas.map((o, i) => `${numero(d.n[o])}${i === 0 ? ` ${plural(d.n[o], { one: 'case', other: 'cases' })}` : ''} from ${o}`))},
      for a total of {numero(d.respuestas)} records.<Ref n="3" /> In 2025 the sample was expanded to field an
      experimental module, which is why that wave has about twice as many cases as the earlier ones.
    </>,
    transversales: (d) => <>
      The three waves are cross-sectional surveys: no one is followed from one wave to the next.{' '}
      {numero(d.repetidas)} people answered in more than one wave ({numero(d.enDos)} in two and {numero(d.enTres)} in
      all three), which corresponds to {numero(d.filasRepetidas)} records.<Ref n="3" />
    </>,
    composicion: (d) => <>
      Number of cases and percentage of each wave&apos;s total, unweighted. Observed ages range
      from {lista(d.olas.map((o) => `${numero(d.edades[o].min)} to ${numero(d.edades[o].max)} in ${o}`))}, with medians
      of {lista(d.olas.map((o) => numero(d.edades[o].mediana)))} years, respectively.<Ref n="3" />
    </>,
    alcance: <>
      The figures describe the responses of the people who took part and are not extrapolated to the
      population of Chile or its regions. Selection is non-probabilistic. None of the waves has survey
      weights. Results are therefore presented unweighted, based on valid responses, with the number of
      cases shown, and with no margin of error. No documented response rate is available.<Ref n="1, 2, 3" />
    </>,
    comparables: (explorador) => <>
      Some questions changed their wording or response options between waves. Only those that stayed
      identical are compared across waves, except vote intention, which is compared by candidate and with
      a note. The {explorador} indicates this question by question.
    </>,
    explorador: 'data explorer',
    fuentes: (descargas) => [
      <>[1] Jenne, N., Labarca, C., Montt, M., and Urdinez, F. (2024). {POLICY} Policy Paper ICLAC 3. In Spanish.{' '}{DOI}</>,
      <>[2] ICLAC. {NOTA} Methodological note on sample design and composition, in Spanish. Available in {descargas('Downloads')}.</>,
      <>[3] ICLAC. {BASE} Combined data file, in Spanish. Available in {descargas('Downloads')}.</>,
      <>[4] ICLAC. {CUESTIONARIO} The 2025 questionnaire, in Spanish. Available in {descargas('Downloads')}.</>,
    ],
  },
  cn: {
    institucion: (d) => <>
      智利对华认知调查是智利天主教大学ICLAC千禧年研究中心（Núcleo Milenio ICLAC）每年开展的调查，由智利国家研究与发展署（ANID）通过千禧年科学计划资助，项目编号NCS2022_053。目前可用的历次调查涵盖{lista(d.olas.map(String))}年各轮调查。<Ref n="1, 3" />
    </>,
    objetivo: <>
      调查旨在分析中国在次国家层面的经济影响。其参考报告为2024年发布的<i>Monitor de Opinión Pública 2023</i>（《2023年民意监测》）。<Ref n="1" />
    </>,
    aplicacion: <>
      自填式问卷由Netquest向其在线样本库成员发放，受访者以非概率方式选取。表中日期为各轮调查第一份至最后一份完成问卷的时间。<Ref n="1, 3" />
    </>,
    cuestionario: <>
      2023年问卷约含{numero(30)}道题。<Ref n="1, 2" />2025年新增了关于中国企业和品牌、信息来源以及电动公共交通的题组，并加入一个关于美国和一项中国电信投资的实验模块。<Ref n="2, 4" />
    </>,
    estratificacion: <>
      样本按各地区对华经济关联度分层，而非按人口比例分配。所用指数依据智利国家海关总署记录的2023年1月至8月各地区对华出口数据构建，对每个地区综合两项指标：该地区在智利对华出口总额中的占比，以及中国在该地区出口总额中的占比。<Ref n="1, 2" />
    </>,
    estratos: (d) => <>
      {numero(16)}个地区按指数排序，分为四个层，每层四个地区，相当于四分位：Q1为关联度最高的地区，Q4为最低的地区。目标样本量为{numero(660)}。三轮调查沿用同一设计。因此，样本的地区分布与人口分布不同：视轮次而定，圣地亚哥首都大区占样本的{porcentaje(d.rmMin)}至{porcentaje(d.rmMax)}。<Ref n="1, 2, 3" />
    </>,
    casos: (d) => <>
      本网站使用的数据文件包含{lista(d.olas.map((o, i) => `${o}年${numero(d.n[o])}名${i === 0 ? '受访者' : ''}`))}，共{numero(d.respuestas)}条记录。<Ref n="3" />2025年为实施实验模块扩大了样本，因此该轮样本量约为前几轮的两倍。
    </>,
    transversales: (d) => <>
      三轮调查均为横截面调查：各轮受访者并非同一批人。有{numero(d.repetidas)}人参加过多轮调查（{numero(d.enDos)}人参加两轮，{numero(d.enTres)}人参加全部三轮），对应{numero(d.filasRepetidas)}条记录。<Ref n="3" />
    </>,
    composicion: (d) => <>
      各类别的受访者人数及其占该轮总样本量的百分比，未加权。观察到的年龄范围为：{lista(d.olas.map((o) => `${o}年${numero(d.edades[o].min)}至${numero(d.edades[o].max)}岁`))}；中位数分别为{lista(d.olas.map((o) => numero(d.edades[o].mediana)))}岁。<Ref n="3" />
    </>,
    alcance: <>
      这些数据描述的是参与者的回答，不外推至智利或其各地区的总体人口。受访者以非概率方式选取。各轮调查均无权重。因此，结果未加权，以有效回答为基数，注明样本量，不报告误差范围。目前没有可查的应答率记录。<Ref n="1, 2, 3" />
    </>,
    comparables: (explorador) => <>
      部分题目的措辞或答案选项在各轮间有改动；只有保持完全一致的题目才做跨轮次对比，投票意向除外：该题按候选人比较，并附注释。{explorador}逐题标明这一点。
    </>,
    explorador: '数据探索工具',
    fuentes: (descargas) => [
      <>[1] Jenne, N., Labarca, C., Montt, M., Urdinez, F. (2024). {POLICY} Policy Paper ICLAC 3.（西班牙语）{DOI}</>,
      <>[2] ICLAC. {NOTA}（抽样设计与样本构成方法说明，西班牙语）可在{descargas('数据下载')}获取。</>,
      <>[3] ICLAC. {BASE}（合并数据文件，西班牙语）可在{descargas('数据下载')}获取。</>,
      <>[4] ICLAC. {CUESTIONARIO}（2025年问卷，西班牙语）可在{descargas('数据下载')}获取。</>,
    ],
  },
}

export default function FichaTecnica ({ encuesta }: { encuesta: Encuesta }) {
  const { t } = useTranslation('paginas')
  const idioma = useIdioma()
  const prosa = PROSA[idioma]
  const olas = encuesta.olas
  const campo = encuesta.ficha?.campo ?? {}
  // El nombre visible de la región es el de `comun.json` (`regiones`), en los tres idiomas; el de la base
  // queda de respaldo.
  const regiones = regionesPorIndice(encuesta).map((r) => ({ ...r, nombre: t(`comun:regiones.${r.codigo}`, { defaultValue: r.nombre }) }))
  const rm = pesoDeRegion(encuesta, 13)
  const pesosRm = olas.map((o) => rm[o])
  const p = participacion(encuesta)
  const d: Datos = {
    olas,
    n: encuesta.n,
    respuestas: p.respuestas,
    repetidas: p.repetidas,
    enDos: p.enDos,
    enTres: p.enTres,
    filasRepetidas: p.filasRepetidas,
    rmMin: Math.min(...pesosRm),
    rmMax: Math.max(...pesosRm),
    edades: edades(encuesta),
  }
  const descargas = (texto: string) => <NavLink to="/descargas" className="text-brand-dark underline">{texto}</NavLink>
  // En chino las frases cierran con «。» y no se separan con espacio.
  const cierre = t('ficha.fin')
  const separador = idioma === 'cn' ? '' : ' '

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-sm text-gray-600">
      <h2 className="font-display text-2xl font-semibold text-gray-900">{t('ficha.titulo')}</h2>

      <h3 className="mt-8 font-display text-base font-semibold text-gray-900">{t('ficha.institucion')}</h3>
      <p className={PARRAFO}>{prosa.institucion(d)}</p>
      <p className={PARRAFO}>{prosa.objetivo}</p>

      <h3 className={TITULO}>{t('ficha.aplicacion')}</h3>
      <p className={PARRAFO}>{prosa.aplicacion}</p>
      <Tabla>
        <thead><tr><th className={CABEZA}>{t('ficha.oleada')}</th><th className={CABEZA}>{t('ficha.fechas')}</th><th className={`${CABEZA} text-right`}>{t('ficha.duracion')}</th></tr></thead>
        <tbody>
          {olas.map((o) => campo[o] && (
            <tr key={o}>
              <td className={CELDA}>{o}</td>
              <td className={CELDA}>{rangoDeFechas(campo[o].desde, campo[o].hasta)}</td>
              <td className={`${CELDA} ${NUM}`}>{t('ficha.minutos', { n: decimal(campo[o].duracionMediana / 60) })}</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      <p className={FUENTE}>{t('ficha.fuenteCampo')}<Ref n="3" /></p>
      <p className={PARRAFO}>{prosa.cuestionario}</p>

      <h3 className={TITULO}>{t('ficha.diseno')}</h3>
      <p className={PARRAFO}>{prosa.estratificacion}</p>
      <p className={PARRAFO}>{prosa.estratos(d)}</p>
      <div className="mt-3 flex items-start justify-center gap-5">
        {/* El mapa solo desde 640 px: en teléfono la tabla ya ocupa el ancho entero. */}
        <div className="ficha-mapa hidden shrink-0 flex-col gap-2 sm:flex">
          <MapaRegiones
            relleno={(codigo) => colorQ(regiones.find((r) => r.codigo === codigo)?.q ?? 4)}
            descripcion={[t('ficha.mapa'), ...[1, 2, 3, 4].map((q) => `${rotuloQ(q)}: ${lista(regiones.filter((r) => r.q === q).map((r) => r.nombre))}${cierre}`)].join(separador)}
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
                <th className={CABEZA}>{t('ficha.estrato')}</th><th className={CABEZA}>{t('ficha.region')}</th><th className={`${CABEZA} text-right`}>{t('ficha.indice')}</th>
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
                <td className={`${CELDA} border-b-0`} /><td className={`${CELDA} border-b-0`}>{t('ficha.total')}</td><td className={`${CELDA} border-b-0`} />
                {olas.map((o) => <td key={o} className={`${CELDA} ${NUM} border-b-0`}>{numero(encuesta.n[o])}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className={FUENTE}>{t('ficha.fuentesEstratosA')}<Ref n="2" />{t('ficha.fuentesEstratosB')}<Ref n="3" />{cierre}</p>

      <h3 className={TITULO}>{t('ficha.casos')}</h3>
      <p className={PARRAFO}>{prosa.casos(d)}</p>
      <p className={PARRAFO}>{prosa.transversales(d)}</p>

      <h3 className={TITULO}>{t('ficha.composicion')}</h3>
      <p className={PARRAFO}>{prosa.composicion(d)}</p>
      <Tabla>
        <thead>
          <tr>
            <th className={CABEZA}><span className="sr-only">{t('ficha.categoria')}</span></th>
            {olas.map((o) => <th key={o} className={`${CABEZA} text-right`}>{o}<br /><span className="font-normal">n (%)</span></th>)}
          </tr>
        </thead>
        <tbody>
          {composicion(encuesta).map((g) => [
            <tr key={g.clave}><th scope="colgroup" colSpan={olas.length + 1} className={`${CELDA} bg-gray-50 text-left text-xs font-semibold text-gray-900`}>{g.variable}</th></tr>,
            ...g.categorias.map((c) => (
              <tr key={`${g.clave}-${c.codigo}`}>
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
      <p className={FUENTE}>{t('ficha.fuenteComposicionA')}<Ref n="3" />{t('ficha.fuenteComposicionB')}</p>

      <h3 className={TITULO}>{t('ficha.alcance')}</h3>
      <p className={PARRAFO}>{prosa.alcance}</p>
      <p className={PARRAFO}>
        {prosa.comparables(<NavLink to="/explorar" className="text-brand-dark underline">{prosa.explorador}</NavLink>)}
      </p>

      <h3 className={TITULO}>{t('ficha.fuentes')}</h3>
      <ol className="mt-2 list-none space-y-1.5 p-0 text-[0.78125rem]">
        {prosa.fuentes(descargas).map((f, i) => <li key={i}>{f}</li>)}
      </ol>
    </section>
  )
}
