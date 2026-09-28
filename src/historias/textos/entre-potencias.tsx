import type { ReactNode } from 'react'
import { decimal, lista, numero, porcentaje, type Idioma } from '../../locale'
import type { FichaHistoria } from './tipos'

/**
 * Los textos de «Entre dos potencias», en los tres idiomas. La forma de estos módulos está en
 * `tipos.ts`. El componente es el mismo de «La mirada» (`recorrido.tsx`, `parte="potencias"`).
 */

/** Una comparación entre dos oleadas, como la trae el contraste. */
interface Prueba { diferencia: number, p: number }

export interface Valores {
  primeraOla: number
  segundaOla: number
  penultimaOla: number
  ultimaOla: number
  /** `confia-china` sube entre las puntas, más allá del ruido. */
  subeChina: boolean
  /** «Mucha» confianza en China, primera y última oleada. */
  muchaChina: [number, number]
  /** `confia-eeuu` en el último tramo y en la serie completa. */
  vuelveEeuu: Prueba | null
  serieEeuu: Prueba | null
  /** La balanza: el empate en las dos primeras oleadas y «más en China» en la última. */
  empate: [number, number]
  masChinaUltima: number
  caeElEmpate: number
  caeEeuu: number
  basesBalanza: number[]
  eeuuSerieBalanza: Prueba | null
  // `p26`.
  vuelcoP26: boolean
  proChina: number[]
  proEeuu: number[]
  basesP26: number[]
  noAlineamiento: Prueba | null
  bajaNoAlineamiento: boolean
}

export interface Contenido {
  salida: string
  titularConfianza: string
  frasesConfianza: ReactNode[]
  /** El nombre de cada bloque de filas de la figura de confianza. */
  grupoChina: string
  grupoEeuu: string
  /** El rótulo de cada categoría de confianza (`clave` de `CATEGORIAS`), o el que ya trae la figura. */
  categoriaConfianza: (clave: string, original: string) => string
  unidadConfianza: string
  /** El texto emergente de un segmento de las dos figuras divergentes. */
  segmento: (fila: string, categoria: string, valor: number, base: number) => string
  notaConfianza: ReactNode
  respiroBalanza: { titulo: string, cuerpo: ReactNode }
  titularBalanza: string
  frasesBalanza: ReactNode[]
  categoriaBalanza: (clave: string, original: string) => string
  unidadBalanza: string
  notaBalanza: ReactNode
  respiroP26: { titulo: string, cuerpo: ReactNode }
  titularP26: string
  frasesP26: ReactNode[]
  /** El rótulo de cada categoría de `p26` por código; en español, el del libro de códigos. */
  categoriaP26: (codigo: number, original: string) => string
  /** El nombre corto de los dos extremos de `p26`, junto a sus cifras. */
  cortaP26: Record<number, string>
  notaP26: ReactNode
}

export const FICHA: Record<Idioma, FichaHistoria> = {
  es: {
    nombre: 'Entre dos potencias',
    pregunta: '¿Con quién se queda Chile?',
    hallazgo: 'La confianza en China se dispara, y en la última oleada cambia cuál potencia prefiere la minoría que elige.',
  },
  en: {
    nombre: 'Between two powers',
    pregunta: 'Who does Chile side with?',
    hallazgo: 'Trust in China soars, and in the latest wave the power preferred by the minority that picks a side changes.',
  },
  cn: {
    nombre: '两强之间',
    pregunta: '智利站在哪一边？',
    hallazgo: '对中国的信任大幅上升；在最近一轮调查中，选边的少数受访者所偏好的大国发生了变化。',
  },
}

const pct = (v: number) => porcentaje(v, 1)

export const TEXTOS: Record<Idioma, (v: Valores) => Contenido> = {
  es: (v) => ({
    salida: 'Volver a las historias',
    titularConfianza: v.subeChina
      ? 'La confianza en China despega; la de Estados Unidos va y vuelve'
      : 'Cuánto se confía en China y en Estados Unidos',
    frasesConfianza: [
      <>
        En China <strong>se corre el reparto entero</strong>: «mucha» se duplica, de{' '}
        {pct(v.muchaChina[0])} a{' '}
        {pct(v.muchaChina[1])}.
      </>,
      <>
        Sumando <strong>«mucha» y «algo»</strong>, Estados Unidos sube en {v.segundaOla} y{' '}
        <strong>vuelve</strong> en {v.ultimaOla}
        {v.vuelveEeuu && v.vuelveEeuu.p < 0.05 && <> ({decimal(v.vuelveEeuu.diferencia)} puntos)</>}:{' '}
        {v.serieEeuu && v.serieEeuu.p >= 0.05
          ? <>entre {v.primeraOla} y {v.ultimaOla}, la diferencia no se distingue del azar</>
          : <>en la serie completa suma {decimal(v.serieEeuu?.diferencia ?? 0)} puntos</>}.
      </>,
    ],
    grupoChina: 'China',
    grupoEeuu: 'Estados Unidos',
    categoriaConfianza: (_clave, original) => original,
    unidadConfianza: 'Porcentaje de quienes contestaron. El 0 del eje es el borde entre los dos lados, y cada fila suma 100.',
    segmento: (fila, categoria, valor, base) => `${fila} · ${categoria}: ${decimal(valor, 1)} % (n = ${numero(base)})`,
    notaConfianza: (
      <>
        Las cuatro respuestas de la pregunta, sin elegir un umbral: con «mucha» sola, China
        queda encima de Estados Unidos solo en {v.ultimaOla}; con «mucha o algo», ya estaba
        encima en {v.primeraOla}.
      </>
    ),
    respiroBalanza: {
      titulo: 'Los dos repartos miran al país entero. ¿Y si miramos a cada persona?',
      cuerpo: <>Los dos repartos miran al país entero. <strong>¿Y si miramos a cada persona?</strong></>,
    },
    titularBalanza: 'La ventaja de China crece, y caen tanto el empate como Estados Unidos',
    frasesBalanza: [
      <>
        Cada persona contesta por las dos potencias, así que se puede restar dentro del
        caso. En {v.primeraOla} y {v.penultimaOla} <strong>manda el empate</strong>:{' '}
        {pct(v.empate[0])} y{' '}
        {pct(v.empate[1])} les tienen la misma confianza a las dos.
      </>,
      <>
        En {v.ultimaOla} quienes <strong>confían más en China</strong> saltan a{' '}
        {pct(v.masChinaUltima)}. El empate cae{' '}
        {decimal(v.caeElEmpate)} puntos y Estados Unidos{' '}
        {decimal(v.caeEeuu)}: los dos pasan el contraste.
      </>,
    ],
    categoriaBalanza: (_clave, original) => original,
    unidadBalanza: 'Cada persona contesta por las dos potencias, así que la comparación va dentro del caso. «La misma» queda a caballo del cero.',
    notaBalanza: (
      <>
        Sobre quienes contestaron las dos preguntas: {v.basesBalanza.map(numero).join(', ')} personas.
        Las tres categorías suman 100, así que lo que gana una es lo que pierden las otras
        dos: la figura no dice que las mismas personas hayan cambiado de lado. Entre{' '}
        {v.primeraOla} y {v.ultimaOla}, Estados Unidos {v.eeuuSerieBalanza && v.eeuuSerieBalanza.p >= 0.05 ? 'queda parejo' : `cambia ${decimal(v.eeuuSerieBalanza?.diferencia ?? 0)} puntos`}.
      </>
    ),
    respiroP26: {
      titulo: 'Una cosa es confiar más en un país. ¿Con cuál debería alinearse Chile?',
      cuerpo: <>Una cosa es confiar más en un país. <strong>¿Con cuál debería alinearse Chile?</strong></>,
    },
    titularP26: v.vuelcoP26
      ? `En ${v.ultimaOla}, alinearse con China supera a alinearse con Estados Unidos`
      : 'Con qué potencia debería alinearse Chile',
    frasesP26: [
      <>
        En {v.primeraOla} y {v.penultimaOla} <strong>ganaba Estados Unidos</strong>:{' '}
        {pct(v.proEeuu[0] ?? 0)} y{' '}
        {pct(v.proEeuu[1] ?? 0)} contra{' '}
        {pct(v.proChina[0] ?? 0)} y{' '}
        {pct(v.proChina[1] ?? 0)}. La gran mayoría no elige a ninguno.
      </>,
      <>
        <strong>En {v.ultimaOla} se da vuelta:</strong> China llega a{' '}
        {pct(v.proChina.at(-1) ?? 0)} y Estados Unidos baja a{' '}
        {pct(v.proEeuu.at(-1) ?? 0)}.
        {v.bajaNoAlineamiento && v.noAlineamiento && <> Quienes no eligen siguen siendo mayoría, pero bajan {decimal(Math.abs(v.noAlineamiento.diferencia))} puntos desde {v.primeraOla}.</>}
      </>,
    ],
    categoriaP26: (_codigo, original) => original,
    cortaP26: { 1: 'China', 2: 'EE. UU.' },
    notaP26: (
      <>
        Porcentaje de respuestas a cómo debería posicionarse Chile. Bases por oleada:{' '}
        {v.basesP26.map(numero).join(', ')} personas; sin respuestas faltantes.
      </>
    ),
  }),
  en: (v) => ({
    salida: 'Back to stories',
    titularConfianza: v.subeChina
      ? 'Trust in China takes off; trust in the United States rises and comes back down'
      : 'How much people trust China and the United States',
    frasesConfianza: [
      <>
        For China, <strong>the whole distribution shifts</strong>: “a great deal” doubles, from{' '}
        {pct(v.muchaChina[0])} to {pct(v.muchaChina[1])}.
      </>,
      <>
        Adding up <strong>“a great deal” and “some,”</strong> the United States rises in {v.segundaOla} and{' '}
        <strong>comes back down</strong> in {v.ultimaOla}
        {v.vuelveEeuu && v.vuelveEeuu.p < 0.05 && <> ({decimal(v.vuelveEeuu.diferencia)} percentage points)</>}:{' '}
        {v.serieEeuu && v.serieEeuu.p >= 0.05
          ? <>between {v.primeraOla} and {v.ultimaOla}, the difference cannot be distinguished from random variation</>
          : <>over the full survey series it changes by {decimal(v.serieEeuu?.diferencia ?? 0)} percentage points</>}.
      </>,
    ],
    grupoChina: 'China',
    grupoEeuu: 'United States',
    categoriaConfianza: (clave, original) => ({ mucha: 'A great deal', algo: 'Some', poca: 'Little', ninguna: 'None' } as Record<string, string>)[clave] ?? original,
    unidadConfianza: 'Percentage of those who answered. The 0 on the axis is the boundary between the two sides, and each row adds up to 100.',
    segmento: (fila, categoria, valor, base) => `${fila} · ${categoria}: ${pct(valor)} (n = ${numero(base)})`,
    notaConfianza: (
      <>
        All four answers to the question, without choosing a cutoff: with “a great deal” alone, China
        is above the United States only in {v.ultimaOla}; with “a great deal” or “some,” it was already
        above in {v.primeraOla}.
      </>
    ),
    respiroBalanza: {
      titulo: 'Both distributions look at respondents as a whole. What if we look at each person?',
      cuerpo: <>Both distributions look at respondents as a whole. <strong>What if we look at each person?</strong></>,
    },
    titularBalanza: 'China’s advantage grows, while both equal trust and the United States fall',
    frasesBalanza: [
      <>
        Each person answers about both powers, so the difference can be taken within each
        case. In {v.primeraOla} and {v.penultimaOla}, <strong>equal trust is the largest group</strong>:{' '}
        {pct(v.empate[0])} and {pct(v.empate[1])} trust both the same.
      </>,
      <>
        In {v.ultimaOla}, those who <strong>trust China more</strong> jump to{' '}
        {pct(v.masChinaUltima)}. Equal trust falls {decimal(v.caeElEmpate)} percentage points and the
        United States {decimal(v.caeEeuu)}: both hold up.
      </>,
    ],
    categoriaBalanza: (clave, original) => ({ eeuu: 'More in the United States', igual: 'The same', china: 'More in China' } as Record<string, string>)[clave] ?? original,
    unidadBalanza: 'Each person answers about both powers, so the comparison is made within each case. “The same” straddles zero.',
    notaBalanza: (
      <>
        Based on those who answered both questions: {lista(v.basesBalanza.map(numero))} people.
        The three categories add up to 100, so what one gains the other two lose: the figure does
        not say that the same people switched sides. Between {v.primeraOla} and {v.ultimaOla}, the
        United States {v.eeuuSerieBalanza && v.eeuuSerieBalanza.p >= 0.05 ? 'shows no clear difference' : `changes by ${decimal(v.eeuuSerieBalanza?.diferencia ?? 0)} percentage points`}.
      </>
    ),
    respiroP26: {
      titulo: 'Trusting one country more is one thing. Which one should Chile align with?',
      cuerpo: <>Trusting one country more is one thing. <strong>Which one should Chile align with?</strong></>,
    },
    titularP26: v.vuelcoP26
      ? `In ${v.ultimaOla}, siding with China overtakes siding with the United States`
      : 'Which power Chile should align with',
    frasesP26: [
      <>
        In {v.primeraOla} and {v.penultimaOla}, <strong>the United States was ahead</strong>:{' '}
        {pct(v.proEeuu[0] ?? 0)} and {pct(v.proEeuu[1] ?? 0)} against{' '}
        {pct(v.proChina[0] ?? 0)} and {pct(v.proChina[1] ?? 0)}. The large majority chooses neither.
      </>,
      <>
        <strong>In {v.ultimaOla} it flips:</strong> China reaches{' '}
        {pct(v.proChina.at(-1) ?? 0)} and the United States falls to{' '}
        {pct(v.proEeuu.at(-1) ?? 0)}.
        {v.bajaNoAlineamiento && v.noAlineamiento && <> The share choosing neither is still a majority, but it is down {decimal(Math.abs(v.noAlineamiento.diferencia))} percentage points since {v.primeraOla}.</>}
      </>,
    ],
    categoriaP26: (codigo, original) => ({ 1: 'Side with China', 2: 'Side with the United States', 3: 'Keep its distance from both', 4: 'Engage with both' } as Record<number, string>)[codigo] ?? original,
    cortaP26: { 1: 'China', 2: 'US' },
    notaP26: (
      <>
        Percentage of responses on how Chile should position itself. Valid responses by wave:{' '}
        N = {lista(v.basesP26.map(numero))}; no missing responses.
      </>
    ),
  }),
  cn: (v) => ({
    salida: '返回数据故事',
    titularConfianza: v.subeChina
      ? '对中国的信任大幅上升；对美国的信任先升后回落'
      : '对中国和美国的信任程度',
    frasesConfianza: [
      <>
        对中国，<strong>整个分布都在移动</strong>：“很多”翻了一番，从{pct(v.muchaChina[0])}升至{pct(v.muchaChina[1])}。
      </>,
      <>
        将<strong>“很多”和“一些”</strong>合计，美国在{v.segundaOla}年上升，在{v.ultimaOla}年<strong>回落</strong>
        {v.vuelveEeuu && v.vuelveEeuu.p < 0.05 && <>（{decimal(v.vuelveEeuu.diferencia)}个百分点）</>}：
        {v.serieEeuu && v.serieEeuu.p >= 0.05
          ? <>{v.primeraOla}年至{v.ultimaOla}年间，差异与随机波动无法区分</>
          : <>在历次调查中累计变化{decimal(v.serieEeuu?.diferencia ?? 0)}个百分点</>}。
      </>,
    ],
    grupoChina: '中国',
    grupoEeuu: '美国',
    categoriaConfianza: (clave, original) => ({ mucha: '很多', algo: '一些', poca: '很少', ninguna: '没有' } as Record<string, string>)[clave] ?? original,
    unidadConfianza: '占作答者的百分比。坐标轴上的0为两侧的分界，每行合计为100。',
    segmento: (fila, categoria, valor, base) => `${fila} · ${categoria}：${pct(valor)}（n = ${numero(base)}）`,
    notaConfianza: (
      <>
        呈现该题全部四个选项，不设阈值：仅看“很多”，中国只在{v.ultimaOla}年高于美国；看“很多”或“一些”，中国在{v.primeraOla}年就已高于美国。
      </>
    ),
    respiroBalanza: {
      titulo: '这两个分布看的是全体受访者。如果逐一看每位受访者呢？',
      cuerpo: <>这两个分布看的是全体受访者。<strong>如果逐一看每位受访者呢？</strong></>,
    },
    titularBalanza: '中国的优势扩大，信任相同者与更信任美国者的占比均下降',
    frasesBalanza: [
      <>
        每位受访者都对两个大国作答，因此可以在同一受访者内部相减。{v.primeraOla}年和{v.penultimaOla}年，<strong>信任相同者最多</strong>：分别有{pct(v.empate[0])}和{pct(v.empate[1])}对两国的信任相同。
      </>,
      <>
        {v.ultimaOla}年，<strong>更信任中国</strong>的受访者跃升至{pct(v.masChinaUltima)}。信任相同者下降{decimal(v.caeElEmpate)}个百分点，更信任美国者的占比下降{decimal(v.caeEeuu)}个百分点：两者均经检验仍成立。
      </>,
    ],
    categoriaBalanza: (clave, original) => ({ eeuu: '更信任美国', igual: '相同', china: '更信任中国' } as Record<string, string>)[clave] ?? original,
    unidadBalanza: '每位受访者都对两个大国作答，因此比较在同一受访者内部进行。“相同”横跨0点。',
    notaBalanza: (
      <>
        基数为两题均作答的受访者：分别为{lista(v.basesBalanza.map(numero))}人。三个类别合计为100，一个类别的增加即另外两个类别的减少：该图并不表明是同一批人改变了立场。{v.primeraOla}年至{v.ultimaOla}年间，更信任美国者的占比{v.eeuuSerieBalanza && v.eeuuSerieBalanza.p >= 0.05 ? '前后难分高下' : `变化${decimal(v.eeuuSerieBalanza?.diferencia ?? 0)}个百分点`}。
      </>
    ),
    respiroP26: {
      titulo: '更信任某个国家是一回事。智利应该与哪一方站在一起？',
      cuerpo: <>更信任某个国家是一回事。<strong>智利应该与哪一方站在一起？</strong></>,
    },
    titularP26: v.vuelcoP26
      ? `${v.ultimaOla}年，主张支持中国的比例超过支持美国`
      : '智利应与哪个大国站在一起',
    frasesP26: [
      <>
        {v.primeraOla}年和{v.penultimaOla}年，<strong>美国领先</strong>：{pct(v.proEeuu[0] ?? 0)}和{pct(v.proEeuu[1] ?? 0)}，对比中国的{pct(v.proChina[0] ?? 0)}和{pct(v.proChina[1] ?? 0)}。绝大多数受访者两边都不选。
      </>,
      <>
        <strong>{v.ultimaOla}年发生逆转：</strong>中国升至{pct(v.proChina.at(-1) ?? 0)}，美国降至{pct(v.proEeuu.at(-1) ?? 0)}。
        {v.bajaNoAlineamiento && v.noAlineamiento && <>两边都不选的受访者仍占多数，但比{v.primeraOla}年下降{decimal(Math.abs(v.noAlineamiento.diferencia))}个百分点。</>}
      </>,
    ],
    categoriaP26: (codigo, original) => ({ 1: '支持中国', 2: '支持美国', 3: '与两国保持距离', 4: '与两国都保持往来' } as Record<number, string>)[codigo] ?? original,
    cortaP26: { 1: '中国', 2: '美国' },
    notaP26: (
      <>
        关于智利应如何定位的回答百分比。各轮有效回答：N = {lista(v.basesP26.map(numero))}；无缺失回答。
      </>
    ),
  }),
}
