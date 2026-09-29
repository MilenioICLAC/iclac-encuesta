import type { ReactNode } from 'react'
import { decimal, lista, numero, plural, porcentaje, type Idioma } from '../../locale'
import { rangoDeEnes } from '../lectura'
import type { FichaHistoria } from './tipos'

/**
 * Los textos de «Donde uno vive», en los tres idiomas. La forma de estos módulos está en `tipos.ts`.
 *
 * Los niveles de exposición y los nombres de las regiones llegan ya traducidos: los niveles de
 * `estrato()` (`nucleo/modulos.ts`), las regiones de `comun:regiones` (i18next). Un dato, un lugar.
 */

/** Los cuatro roles de `p8`, por código. */
type Rol = 1 | 2 | 3 | 4

/** Lo que calcula `territorio.tsx`: cifras, rótulos ya traducidos y las banderas que eligen cada frase. */
export interface Valores {
  primeraOla: number
  penultimaOla: number
  ultimaOla: number
  // ------------------------------------------------------------ Escena 1: `p7` en tres partes
  /** Desacuerdo y acuerdo en la primera oleada, de `riesgo-desacuerdo` y `riesgo-comuna`. */
  desacuerdo1: number
  acuerdo1: number
  /** Ninguna de las tres partes se distingue del ruido en ningún tramo. */
  partesQuietas: boolean
  /** El desacuerdo supera al acuerdo en cada oleada, con Holm (`neto-por-oleada`). */
  masDesacuerdo: boolean
  /** El promedio de esa ventaja, en puntos enteros. */
  netoMedio: number
  repartoP7: { ola: number, base: number, desacuerdo: number, indiferente: number, acuerdo: number }[]
  /** Personas por oleada en la serie de riesgo. */
  enesRiesgo: number[]
  // ------------------------------------------------------------ Escena 2: el mapa
  /** Cada nivel, de más a menos expuesto, con sus regiones ya traducidas. */
  regionesPorNivel: { nivel: string, regiones: string[] }[]
  /** Personas por nivel en la última oleada. */
  porNivel: { nivel: string, n: number }[]
  // ------------------------------------------------------------ Escena 3: el neto por nivel
  noOrdena: boolean
  o1: number
  o2: number
  o3: number
  /** El neto de los niveles muy alto y bajo en `o1`. */
  muyAlto1: number
  bajo1: number
  /** El nivel más alto en `o2`: si es el de mayor exposición, y su rótulo. */
  arriba2: { esMuyAlto: boolean, nivel: string, valor: number }
  /** Piso y techo de los cuatro niveles en `o3`. */
  rango3: [number, number]
  tramos: { ola: number, tramos: { nivel: string, media: number | null }[] }[]
  enesEstrato: [number, number]
  // ------------------------------------------------------------ Escena 4: `p8`
  proveedorPrimero: boolean
  caidaFirme: boolean
  /** Proveedor por oleada, en el orden de `encuesta.olas`. */
  proveedor: { ola: number, valor: number }[]
  /** El rol que sigue a proveedor en la primera oleada. */
  segundo1: { rol: Rol, valor: number }
  roles: { ola: number, valores: { rol: Rol, valor: number }[] }[]
  bases: { ola: number, base: number }[]
  /** Proveedor en el área profesional (`p2`), última oleada. */
  proveedorSector: number | null
}

export interface Contenido {
  salida: string
  /** Las tres partes de `p7`, como las rotula la figura. */
  partes: { desacuerdo: string, indiferente: string, acuerdo: string }
  titularRiesgo: string
  frasesRiesgo: ReactNode[]
  descripcionRiesgo: string
  /** El `title` de cada segmento de las barras. */
  tituloSegmento: (ola: number, parte: string, valor: number, base: number) => string
  notaRiesgo: ReactNode
  respiroRegion: { titulo: string, cuerpo: ReactNode }
  titularMapa: string
  frasesMapa: ReactNode[]
  descripcionMapa: string
  notaMapa: ReactNode
  respiroExposicion: { titulo: string, cuerpo: ReactNode }
  titularEstrato: string
  frasesEstrato: ReactNode[]
  descripcionEstrato: string
  /** El nombre del gráfico de cada escena, dentro de su figura (`RotuloFigura`). */
  rotuloRiesgo: string
  rotuloMapa: string
  /** El de la escena 3. **Cambia el 29-09-2026**: nombraba las filas («Exposición económica a
   *  China») y ahora nombra la medida, que es lo que el eje dibuja. */
  rotuloExposicion: string
  rotuloRol: string
  /** La unidad de la escala y el N, al pie de cada figura. Se calculan; no se transcriben. */
  ejeRiesgo: string
  ejeMapa: string
  unidadEjeEstrato: string
  tituloPuntoEstrato: (nivel: string, ola: string, valor: number) => string
  notaEstrato: ReactNode
  respiroRol: { titulo: string, cuerpo: ReactNode }
  titularRol: string
  /** El nombre de cada rol, como fila de la figura. */
  rol: Record<Rol, string>
  frasesRol: ReactNode[]
  descripcionRol: string
  unidadEjeRol: string
  tituloPuntoRol: (rol: string, ola: string, valor: number) => string
  notaRol: ReactNode
}

export const FICHA: Record<Idioma, FichaHistoria> = {
  es: {
    nombre: 'Donde uno vive',
    pregunta: '¿Pesa China distinto según dónde se vive?',
    hallazgo: 'Hay más desacuerdo que acuerdo con que el acercamiento con China haya traído más riesgos que oportunidades, y ese reparto no se ordena según la exposición económica de la región.',
  },
  en: {
    nombre: 'Where people live',
    pregunta: 'Does China matter differently depending on where people live?',
    hallazgo: 'More respondents disagree than agree that closer ties with China have brought more risks than opportunities, and there is no clear difference in that pattern across levels of regional economic exposure to China.',
  },
  cn: {
    nombre: '身居何处',
    pregunta: '中国的分量是否因居住地而异？',
    hallazgo: '不同意“与中国关系的拉近带来的风险多于机遇”的受访者多于同意者，而回答高低也不随所在地区的对华经济关联度排列。',
  },
}

const fmt = (v: number) => porcentaje(v, 1)
const dec = (v: number) => decimal(v, 1)

export const TEXTOS: Record<Idioma, (v: Valores) => Contenido> = {
  es: (v) => {
    const partes = { desacuerdo: 'En desacuerdo', indiferente: 'Indiferente', acuerdo: 'De acuerdo' }
    const rol: Record<Rol, string> = { 3: 'Proveedor', 1: 'Inversor', 2: 'Comprador', 4: 'Competidor' }
    const titularRiesgo = v.masDesacuerdo
      ? 'Hay más desacuerdo que acuerdo con que el acercamiento con China haya traído más riesgos que oportunidades'
      : 'Qué contestan sobre si el acercamiento con China trajo más riesgos que oportunidades'
    const titularEstrato = v.noOrdena
      ? 'La exposición económica de la región a China no ordena las respuestas'
      : 'Las respuestas, según la exposición económica de la región a China'
    const titularRol = v.proveedorPrimero
      ? 'Para su comuna, China es ante todo un proveedor, en las tres oleadas'
      : 'Qué es China para la comuna'
    const [p1, p2, p3] = v.proveedor
    return {
      salida: 'Volver a las historias',
      partes,
      titularRiesgo,
      frasesRiesgo: [
        <>
          En {v.primeraOla}, el <strong>{fmt(v.desacuerdo1)}</strong> estaba en desacuerdo con que el acercamiento
          con China trajera más riesgos que oportunidades; el <strong>{fmt(v.acuerdo1)}</strong>, de acuerdo.
        </>,
        v.partesQuietas
          ? <>En {v.penultimaOla} y en {v.ultimaOla} el reparto es casi el mismo: <strong>ningún cambio en las tres partes se distingue del azar</strong>.</>
          : <>En {v.penultimaOla} y en {v.ultimaOla} el reparto cambia.</>,
        v.masDesacuerdo
          ? <>En cada oleada, el desacuerdo supera al acuerdo por <strong>unos {numero(v.netoMedio)} puntos</strong>, y la diferencia se sostiene.</>
          : <>Entre los dos lados no hay una diferencia que se pueda afirmar.</>,
      ],
      descripcionRiesgo: `Respuestas a si el acercamiento con China generó más riesgos que oportunidades, por oleada. ${v.repartoP7.map((r) => `${r.ola}: ${partes.desacuerdo} ${fmt(r.desacuerdo)}, ${partes.indiferente} ${fmt(r.indiferente)}, ${partes.acuerdo} ${fmt(r.acuerdo)}`).join('. ')}.`,
      tituloSegmento: (ola, parte, valor, base) => `${ola} · ${parte}: ${fmt(valor)} (n = ${numero(base)})`,
      notaRiesgo: (
        <>
          {lista(v.enesRiesgo.map(numero))} personas
          encuestadas. «Desacuerdo» suma muy en desacuerdo y en desacuerdo; «acuerdo», de acuerdo y muy de acuerdo. Pide
          pensar en la propia comuna, aunque la frase hable de Chile.
        </>
      ),
      respiroRegion: {
        titulo: '¿Influye cuánto pesa China en la economía de la región?',
        cuerpo: <>¿Influye cuánto pesa China en la <strong>economía de la región</strong>?</>,
      },
      titularMapa: 'La encuesta compara regiones con distinto vínculo económico con China',
      frasesMapa: [
        <>Las regiones se agruparon en <strong>cuatro niveles de exposición económica a China</strong>, según cuánto pesa China en su economía, sobre todo por lo que le exportan.</>,
      ],
      descripcionMapa: `Mapa de Chile por nivel de exposición económica a China. ${v.regionesPorNivel.map((x) => `${x.nivel}: ${lista(x.regiones)}`).join('. ')}.`,
      notaMapa: (
        <>
          El nivel es de la región; la pregunta del riesgo habla de la comuna o ciudad de cada persona. Personas por nivel
          en {v.ultimaOla}: {v.porNivel.map((x) => `${x.nivel.toLowerCase()} ${numero(x.n)}`).join(', ')}. Mapa: simplemaps.com.
        </>
      ),
      respiroExposicion: {
        titulo: '¿Cambia el riesgo según esa exposición?',
        cuerpo: <>¿Cambia el riesgo según esa <strong>exposición</strong>?</>,
      },
      titularEstrato,
      frasesEstrato: [
        <>
          En {v.o1}, el desacuerdo ganaba por <strong>{dec(v.muyAlto1)} puntos</strong> en las regiones más expuestas
          y por <strong>{dec(v.bajo1)}</strong> en las menos expuestas, pero la diferencia no se distingue del azar.
        </>,
        v.arriba2.esMuyAlto
          ? <>En {v.o2}, las más expuestas siguen arriba, con <strong>{dec(v.arriba2.valor)}</strong>.</>
          : <>En {v.o2} el orden se desarma: arriba queda el nivel de exposición {v.arriba2.nivel.toLowerCase()}, con <strong>{dec(v.arriba2.valor)}</strong>.</>,
        <>En {v.o3}, los cuatro niveles quedan <strong>entre {dec(v.rango3[0])} y {dec(v.rango3[1])} puntos</strong>.</>,
      ],
      descripcionEstrato: `Desacuerdo menos acuerdo con que el acercamiento con China trajo más riesgos que oportunidades, en puntos, según la exposición económica de su región. ${v.tramos.map((o) => `${o.ola}: ${o.tramos.map((t) => `${t.nivel} ${t.media === null ? 'sin casos' : dec(t.media)}`).join(', ')}`).join('. ')}.`,
      rotuloRiesgo: 'Acuerdo con que trajo más riesgos',
      rotuloMapa: 'Exposición económica de cada región',
      rotuloExposicion: 'Desacuerdo menos acuerdo, por exposición',
      rotuloRol: 'Qué es China para la comuna',
      ejeRiesgo: `% de quienes contestaron · n = ${rangoDeEnes(v.enesRiesgo, (a, b) => `${a} a ${b}`)}. Cada barra suma 100.`,
      ejeMapa: 'Así se agruparon las regiones; no es un resultado de la encuesta.',
      unidadEjeEstrato: `Puntos: desacuerdo − acuerdo · n = ${rangoDeEnes(v.enesEstrato, (a, b) => `${a} a ${b}`)} por nivel y oleada`,
      tituloPuntoEstrato: (nivel, ola, valor) => `${nivel} · ${ola}: ${dec(valor)} puntos`,
      notaEstrato: (
        <>
          Entre {numero(v.enesEstrato[0])} y {numero(v.enesEstrato[1])} personas por nivel y oleada. Positivo es más
          desacuerdo que acuerdo. Se comparan las puntas, oleada por oleada: las oleadas no se suman.
        </>
      ),
      respiroRol: { titulo: '¿Y qué es China para la comuna?', cuerpo: <>¿Y qué <strong>es</strong> China para la comuna?</> },
      titularRol,
      rol,
      frasesRol: [
        <>
          En {p1.ola}, el <strong>{fmt(p1.valor)}</strong> veía a China como un proveedor importante para su comuna.
          Le seguía {rol[v.segundo1.rol].toLowerCase()}, con {fmt(v.segundo1.valor)}.
        </>,
        <>
          En {p2.ola}, el <strong>{fmt(p2.valor)}</strong>; en {p3.ola}, el <strong>{fmt(p3.valor)}</strong>.
          {v.proveedorPrimero ? ' En las tres oleadas supera a inversor, comprador y competidor.' : v.caidaFirme ? ' Baja, y la baja se sostiene.' : ''}
        </>,
      ],
      descripcionRol: `Qué es China para su comuna, por oleada. ${v.roles.map((o) => `${o.ola}: ${o.valores.map((x) => `${rol[x.rol]} ${fmt(x.valor)}`).join(', ')}`).join('. ')}.`,
      unidadEjeRol: `% de quienes contestaron · n = ${rangoDeEnes(v.bases.map((x) => x.base), (a, b) => `${a} a ${b}`)}`,
      tituloPuntoRol: (r, ola, valor) => `${r} · ${ola}: ${fmt(valor)}`,
      notaRol: (
        <>
          Una respuesta por persona: {v.bases.map((x) => `${numero(x.base)} en ${x.ola}`).join(', ')}.
          {v.proveedorSector !== null && <> Pensando en su propia área de trabajo, el {fmt(v.proveedorSector)} la ve como proveedor ({v.ultimaOla}).</>}
        </>
      ),
    }
  },
  en: (v) => {
    const partes = { desacuerdo: 'Disagree', indiferente: 'Indifferent', acuerdo: 'Agree' }
    const rol: Record<Rol, string> = { 3: 'Supplier', 1: 'Investor', 2: 'Buyer', 4: 'Competitor' }
    const pp = (n: number) => plural(n, { one: 'percentage point', other: 'percentage points' })
    const titularRiesgo = v.masDesacuerdo
      ? 'More respondents disagree than agree that closer ties with China have brought more risks than opportunities'
      : 'How respondents answer whether closer ties with China brought more risks than opportunities'
    const titularEstrato = v.noOrdena
      ? 'Responses do not line up with the region’s economic exposure to China'
      : 'Responses by the region’s economic exposure to China'
    const titularRol = v.proveedorPrimero
      ? 'For their municipality, China is above all a supplier, in all three waves'
      : 'What China is to the municipality'
    const [p1, p2, p3] = v.proveedor
    return {
      salida: 'Back to stories',
      partes,
      titularRiesgo,
      frasesRiesgo: [
        <>
          In {v.primeraOla}, <strong>{fmt(v.desacuerdo1)}</strong> disagreed that closer ties with China brought more risks
          than opportunities; <strong>{fmt(v.acuerdo1)}</strong> agreed.
        </>,
        v.partesQuietas
          ? <>In {v.penultimaOla} and {v.ultimaOla} the split is almost the same: <strong>no change in any of the three parts can be distinguished from random variation</strong>.</>
          : <>In {v.penultimaOla} and {v.ultimaOla} the split changes.</>,
        v.masDesacuerdo
          ? <>In every wave, disagreement exceeds agreement by <strong>about {numero(v.netoMedio)} {pp(v.netoMedio)}</strong>, and the difference holds up.</>
          : <>The difference between the two sides cannot be distinguished from random variation.</>,
      ],
      descripcionRiesgo: `Responses on whether closer ties with China generated more risks than opportunities, by wave. ${v.repartoP7.map((r) => `${r.ola}: ${partes.desacuerdo} ${fmt(r.desacuerdo)}, ${partes.indiferente} ${fmt(r.indiferente)}, ${partes.acuerdo} ${fmt(r.acuerdo)}`).join('. ')}.`,
      tituloSegmento: (ola, parte, valor, base) => `${ola} · ${parte}: ${fmt(valor)} (n = ${numero(base)})`,
      notaRiesgo: (
        <>
          {lista(v.enesRiesgo.map(numero))} respondents. “Disagree” combines strongly disagree and disagree; “agree,” agree
          and strongly agree. The question asks respondents to think about their own municipality (comuna), even though the
          statement refers to Chile.
        </>
      ),
      respiroRegion: {
        titulo: 'Does China’s share in the regional economy make a difference?',
        cuerpo: <>Does China’s share in the <strong>regional economy</strong> make a difference?</>,
      },
      titularMapa: 'The survey compares regions with different economic ties to China',
      frasesMapa: [
        <>Regions were grouped into <strong>four levels of economic exposure to China</strong>, according to how much China matters to their economy, mainly through what they export to it.</>,
      ],
      descripcionMapa: `Map of Chile by level of economic exposure to China. ${v.regionesPorNivel.map((x) => `${x.nivel}: ${lista(x.regiones)}`).join('. ')}.`,
      notaMapa: (
        <>
          The level belongs to the region; the risk question refers to each respondent’s municipality or city. Respondents
          per level in {v.ultimaOla}: {lista(v.porNivel.map((x) => `${x.nivel.toLowerCase()} ${numero(x.n)}`))}. Map: simplemaps.com.
        </>
      ),
      respiroExposicion: {
        titulo: 'Does the perceived risk change with that exposure?',
        cuerpo: <>Does the perceived risk change with that <strong>exposure</strong>?</>,
      },
      titularEstrato,
      frasesEstrato: [
        <>
          In {v.o1}, disagreement led by <strong>{dec(v.muyAlto1)} {pp(v.muyAlto1)}</strong> in the most exposed regions
          and by <strong>{dec(v.bajo1)}</strong> in the least exposed, but the difference cannot be distinguished from random variation.
        </>,
        v.arriba2.esMuyAlto
          ? <>In {v.o2}, the most exposed regions are still on top, at <strong>{dec(v.arriba2.valor)}</strong>.</>
          : <>In {v.o2} the order breaks down: the {v.arriba2.nivel.toLowerCase()} exposure level comes out on top, at <strong>{dec(v.arriba2.valor)}</strong>.</>,
        <>In {v.o3}, the four levels fall <strong>between {dec(v.rango3[0])} and {dec(v.rango3[1])} percentage points</strong>.</>,
      ],
      descripcionEstrato: `Disagree minus agree that closer ties with China brought more risks than opportunities, in percentage points, by the economic exposure of the respondent’s region. ${v.tramos.map((o) => `${o.ola}: ${o.tramos.map((t) => `${t.nivel} ${t.media === null ? 'no cases' : dec(t.media)}`).join(', ')}`).join('. ')}.`,
      rotuloRiesgo: 'Agreement that it brought more risks',
      rotuloMapa: 'Economic exposure of each region',
      rotuloExposicion: 'Disagreement minus agreement, by exposure',
      rotuloRol: 'What China is for their municipality',
      ejeRiesgo: `% of those who answered · n = ${rangoDeEnes(v.enesRiesgo, (a, b) => `${a} to ${b}`)}. Each bar adds to 100.`,
      ejeMapa: 'This is how the regions were grouped; it is not a survey result.',
      unidadEjeEstrato: `Percentage points: disagree − agree · n = ${rangoDeEnes(v.enesEstrato, (a, b) => `${a} to ${b}`)} per level and wave`,
      tituloPuntoEstrato: (nivel, ola, valor) => `${nivel} · ${ola}: ${dec(valor)} ${pp(valor)}`,
      notaEstrato: (
        <>
          Between {numero(v.enesEstrato[0])} and {numero(v.enesEstrato[1])} respondents per level and wave. Positive means more
          disagreement than agreement. The two extreme levels are compared, wave by wave: the waves are not pooled.
        </>
      ),
      respiroRol: {
        titulo: 'And what is China to their municipality?',
        cuerpo: <>And what <strong>is</strong> China to their municipality?</>,
      },
      titularRol,
      rol,
      frasesRol: [
        <>
          In {p1.ola}, <strong>{fmt(p1.valor)}</strong> saw China as an important supplier for their municipality.
          Next came “{rol[v.segundo1.rol].toLowerCase()},” at {fmt(v.segundo1.valor)}.
        </>,
        <>
          In {p2.ola}, <strong>{fmt(p2.valor)}</strong>; in {p3.ola}, <strong>{fmt(p3.valor)}</strong>.
          {v.proveedorPrimero ? ' In all three waves it exceeds investor, buyer, and competitor.' : v.caidaFirme ? ' It falls, and the drop holds up.' : ''}
        </>,
      ],
      descripcionRol: `What China is to respondents’ municipality, by wave. ${v.roles.map((o) => `${o.ola}: ${o.valores.map((x) => `${rol[x.rol]} ${fmt(x.valor)}`).join(', ')}`).join('. ')}.`,
      unidadEjeRol: `% of those who answered · n = ${rangoDeEnes(v.bases.map((x) => x.base), (a, b) => `${a} to ${b}`)}`,
      tituloPuntoRol: (r, ola, valor) => `${r} · ${ola}: ${fmt(valor)}`,
      notaRol: (
        <>
          One response per respondent: {lista(v.bases.map((x) => `${numero(x.base)} in ${x.ola}`))}.
          {v.proveedorSector !== null && <> Thinking about their own professional area, {fmt(v.proveedorSector)} see it as a supplier ({v.ultimaOla}).</>}
        </>
      ),
    }
  },
  cn: (v) => {
    const partes = { desacuerdo: '不同意', indiferente: '中立', acuerdo: '同意' }
    const rol: Record<Rol, string> = { 3: '供应商', 1: '投资者', 2: '买家', 4: '竞争对手' }
    const titularRiesgo = v.masDesacuerdo
      ? '不同意“与中国关系的拉近带来的风险多于机遇”的受访者多于同意者'
      : '受访者如何看待“与中国关系的拉近带来的风险多于机遇”'
    const titularEstrato = v.noOrdena
      ? '回答的高低并不随地区对华经济关联度的高低而排列'
      : '按地区对华经济关联度划分的回答'
    const titularRol = v.proveedorPrimero
      ? '三轮调查中，对所在市镇而言，中国首先是供应商'
      : '对所在市镇而言，中国是什么'
    const [p1, p2, p3] = v.proveedor
    return {
      salida: '返回数据故事',
      partes,
      titularRiesgo,
      frasesRiesgo: [
        <>
          {v.primeraOla}年，<strong>{fmt(v.desacuerdo1)}</strong>的受访者不同意与中国关系的拉近带来的风险多于机遇；
          <strong>{fmt(v.acuerdo1)}</strong>表示同意。
        </>,
        v.partesQuietas
          ? <>{v.penultimaOla}年和{v.ultimaOla}年的分布几乎相同：<strong>三个部分的变化均与随机波动无法区分</strong>。</>
          : <>{v.penultimaOla}年和{v.ultimaOla}年的分布有所变化。</>,
        v.masDesacuerdo
          ? <>每一轮调查中，不同意的比例都比同意高出<strong>约{numero(v.netoMedio)}个百分点</strong>，且这一差异经检验仍成立。</>
          : <>不同意与同意难分高下。</>,
      ],
      descripcionRiesgo: `关于与中国关系的拉近是否带来了多于机遇的风险的回答，按轮次：${v.repartoP7.map((r) => `${r.ola}年：${partes.desacuerdo}${fmt(r.desacuerdo)}，${partes.indiferente}${fmt(r.indiferente)}，${partes.acuerdo}${fmt(r.acuerdo)}`).join('；')}。`,
      tituloSegmento: (ola, parte, valor, base) => `${ola}年 · ${parte}：${fmt(valor)}（n = ${numero(base)}）`,
      notaRiesgo: (
        <>
          各轮受访者分别为{lista(v.enesRiesgo.map(numero))}人。“不同意”合并了强烈不同意和不同意；“同意”合并了同意和强烈同意。题目请受访者考虑自己所在的市镇（comuna），尽管陈述针对的是智利。
        </>
      ),
      respiroRegion: {
        titulo: '中国在地区经济中的分量会产生影响吗？',
        cuerpo: <>中国在<strong>地区经济</strong>中的分量会产生影响吗？</>,
      },
      titularMapa: '本调查比较了与中国经济联系程度不同的地区',
      frasesMapa: [
        <>各地区按中国在其经济中的分量（主要看对华出口）分为<strong>四个对华经济关联度等级</strong>。</>,
      ],
      descripcionMapa: `按对华经济关联度划分的智利地图。${v.regionesPorNivel.map((x) => `${x.nivel}：${lista(x.regiones)}`).join('；')}。`,
      notaMapa: (
        <>
          关联度按地区划分；风险问题针对的是每位受访者所在的市镇或城市。{v.ultimaOla}年各等级受访者人数：
          {v.porNivel.map((x) => `${x.nivel}${numero(x.n)}人`).join('，')}。地图：simplemaps.com。
        </>
      ),
      respiroExposicion: {
        titulo: '对风险的看法会随关联度而变化吗？',
        cuerpo: <>对风险的看法会随<strong>关联度</strong>而变化吗？</>,
      },
      titularEstrato,
      frasesEstrato: [
        <>
          {v.o1}年，在关联度最高的地区，不同意比同意高<strong>{dec(v.muyAlto1)}个百分点</strong>；在关联度最低的地区，高<strong>{dec(v.bajo1)}</strong>个百分点，但两端的差异与随机波动无法区分。
        </>,
        v.arriba2.esMuyAlto
          ? <>{v.o2}年，关联度最高的地区仍居首位，为<strong>{dec(v.arriba2.valor)}</strong>。</>
          : <>{v.o2}年，这一次序被打破：关联度为“{v.arriba2.nivel}”的等级居首，为<strong>{dec(v.arriba2.valor)}</strong>。</>,
        <>{v.o3}年，四个等级都在<strong>{dec(v.rango3[0])}至{dec(v.rango3[1])}个百分点</strong>之间。</>,
      ],
      descripcionEstrato: `不同意减同意（关于与中国关系的拉近带来的风险多于机遇），单位为百分点，按受访者所在地区的对华经济关联度划分。${v.tramos.map((o) => `${o.ola}年：${o.tramos.map((t) => `${t.nivel}${t.media === null ? '无受访者' : dec(t.media)}`).join('，')}`).join('；')}。`,
      rotuloRiesgo: '认同“带来更多风险”的比例',
      rotuloMapa: '各大区的对华经济关联度',
      rotuloExposicion: '不同意减同意，按关联度',
      rotuloRol: '中国对所在市镇意味着什么',
      ejeRiesgo: `作答者占比（%）· n = ${rangoDeEnes(v.enesRiesgo, (a, b) => `${a}至${b}`)}。每条条形合计100。`,
      ejeMapa: '各大区的分组方式，并非调查结果。',
      unidadEjeEstrato: `百分点：不同意−同意 · n = ${rangoDeEnes(v.enesEstrato, (a, b) => `${a}至${b}`)}（按关联度与轮次）`,
      tituloPuntoEstrato: (nivel, ola, valor) => `${nivel} · ${ola}年：${dec(valor)}个百分点`,
      notaEstrato: (
        <>
          每个等级、每轮调查的受访者为{numero(v.enesEstrato[0])}至{numero(v.enesEstrato[1])}人。正值表示不同意多于同意。逐轮比较两端的等级：各轮调查不合并计算。
        </>
      ),
      respiroRol: {
        titulo: '那么，对所在市镇而言，中国是什么？',
        cuerpo: <>那么，对所在市镇而言，中国<strong>是什么</strong>？</>,
      },
      titularRol,
      rol,
      frasesRol: [
        <>
          {p1.ola}年，<strong>{fmt(p1.valor)}</strong>的受访者认为中国是其所在市镇的重要供应商。其次是“{rol[v.segundo1.rol]}”，占{fmt(v.segundo1.valor)}。
        </>,
        <>
          {p2.ola}年为<strong>{fmt(p2.valor)}</strong>，{p3.ola}年为<strong>{fmt(p3.valor)}</strong>。
          {v.proveedorPrimero ? '三轮调查中，供应商这一选项的比例都高于投资者、买家和竞争对手。' : v.caidaFirme ? '比例下降，且这一下降经检验仍成立。' : ''}
        </>,
      ],
      descripcionRol: `对所在市镇而言中国是什么，按轮次：${v.roles.map((o) => `${o.ola}年：${o.valores.map((x) => `${rol[x.rol]}${fmt(x.valor)}`).join('，')}`).join('；')}。`,
      unidadEjeRol: `作答者占比（%）· n = ${rangoDeEnes(v.bases.map((x) => x.base), (a, b) => `${a}至${b}`)}`,
      tituloPuntoRol: (r, ola, valor) => `${r} · ${ola}年：${fmt(valor)}`,
      notaRol: (
        <>
          每位受访者一个回答：{lista(v.bases.map((x) => `${x.ola}年${numero(x.base)}人`))}。
          {v.proveedorSector !== null && <>就自身职业领域而言，{fmt(v.proveedorSector)}的受访者视其为供应商（{v.ultimaOla}年）。</>}
        </>
      ),
    }
  },
}
