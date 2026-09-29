import type { ReactNode } from 'react'
import { decimal, lista, numero, plural, porcentaje, type Idioma } from '../../locale'
import { cardinal, rangoDeEnes } from '../lectura'
import type { FichaHistoria } from './tipos'

/**
 * Los textos de «La mirada», en los tres idiomas. La forma de estos módulos está en `tipos.ts`.
 *
 * El componente (`recorrido.tsx`, `parte="mirada"`) calcula las cifras y las banderas de las pruebas
 * y las deja en `Valores`; acá cada idioma escribe las mismas ramas con las mismas condiciones.
 */

/** Cómo quedó una brecha según su prueba (`describir` en `lectura.ts`). */
export interface Brecha { estado: 'parejos' | 'china' | 'eeuu', puntos: number }

/** Un número chico con letra, dentro de una frase. `cardinal()` de `lectura.ts` es solo español. */
const CARDINAL_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** En chino, antes de un clasificador (个), el dos es 两. */
const CARDINAL_CN = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九']
export const cardinalEn = (n: number) => CARDINAL_EN[n] ?? numero(n)
export const cardinalCn = (n: number) => CARDINAL_CN[n] ?? numero(n)

/** La primera letra en mayúscula, para una palabra que abre una oración en inglés. */
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export interface Valores {
  primeraOla: number
  penultimaOla: number
  ultimaOla: number
  // Escena 1: el termómetro.
  brechaPrimera: Brecha | null
  brechaPenultima: Brecha | null
  /** China arriba por encima del ruido en la última oleada y en ninguna anterior. */
  primeraVezArriba: boolean
  chinaSobreEeuu: boolean
  /** El país que encabeza la última oleada, ya traducido, y si encabeza todas. */
  mejorPais: string
  mejorEsJapon: boolean
  siempreMejor: boolean
  chinaUltima: number
  eeuuUltima: number
  mejorUltima: number
  /** Ningún país del termómetro se distingue del ruido entre la primera y la penúltima oleada. */
  quietasEntreOlas: boolean
  paises: number
  /** El mayor movimiento entre las dos primeras oleadas, y el mismo redondeado como se muestra. */
  quietas: number
  quietasRedondo: number
  baseMinima: number
  baseMaxima: number
  // El respiro que lleva a la ideología.
  /** Dos cortes donde todos los grupos suben, con su nombre ya traducido. Vacío si no hay puente. */
  cortesEnteros: { total: number, etiqueta: string }[]
  conPuente: boolean
  // Escena 2: la recta.
  pendientePrimera: number
  sostiene: { n: number, x: number, b: number, nRecta: number } | null
  icSostiene: [number, number]
  totalPrimera: number
  /** La base de cada oleada de la recta, para el paso que dibuja las tres. */
  enesRecta: number[]
  puntoMasPoblado: { x: number, n: number } | null
  // Escena 3: las palabras.
  trumpSube: boolean
  /** «Trump» sobre el diez por ciento en su última oleada. */
  trumpSobreDiez: boolean
  olaTrump: number
  saltoTrump: { desde: number, hasta: number, a: number, b: number } | null
  /** Las tres primeras palabras de cada país, como se ven en la figura. */
  palabrasChina: string[]
  palabrasEeuu: string[]
  /** «Tecnología» como se ve en la figura (traducción y original), y sus puntas. */
  palabraTecnologia: string
  tecnologia: { desde: number, hasta: number } | null
  tecnologiaFirme: boolean
  basesPalabras: number[]
}

/** Qué muestra la figura de la recta en el paso, para su pie. */
export type EtapaRecta = 'todas' | 'sin' | 'intervalo' | 'inicio'

interface FilaTexto { etiqueta: string, valores: (number | null)[] }

export interface Contenido {
  salida: string
  titularTermometro: string
  frasesTermometro: ReactNode[]
  /** El texto emergente de un punto del termómetro. */
  puntoTermometro: (pais: string, ola: string, valor: number, base: number) => string
  /** El rótulo del eje del termómetro, que `termometro.ts` da solo en español. */
  unidadTermometro: (escala: { min: number, max: number }, espanol: string) => string
  notaTermometro: ReactNode
  respiroPuente: { titulo: string, cuerpo: ReactNode }
  titularIdeologia: string
  frasesIdeologia: ReactNode[]
  izquierda: string
  derecha: string
  unidadRecta: (etapa: EtapaRecta) => string
  /** El nombre de cada gráfico, dentro de su figura (`RotuloFigura`). */
  /**
   * Qué dice la figura del termómetro, para quien no la ve.
   *
   * **Faltaba**: cada punto llevaba su `title`, pero no había ninguna frase que resumiera la figura
   * entera, así que había que recorrerla punto por punto para hacerse una idea (29-09-2026).
   */
  descripcionTermometro: (filas: { etiqueta: string, valores: (number | null)[] }[], olas: number[]) => string
  rotuloTermometro: string
  rotuloRecta: string
  notaRecta: (etapa: EtapaRecta) => ReactNode
  /** La marca de una pendiente cuyo intervalo cruza el cero, en la leyenda del último paso. */
  pendienteNula: string
  respiroPalabras: { titulo: string, cuerpo: ReactNode }
  titularPalabras: string
  frasesPalabras: ReactNode[]
  bloqueChina: string
  bloqueEeuu: string
  puntoPalabra: (bloque: string, palabra: string, ola: string, valor: number) => string
  unidadPalabras: string
  descripcionPalabras: (china: FilaTexto[], eeuu: FilaTexto[]) => string
  notaPalabras: ReactNode
}

export const FICHA: Record<Idioma, FichaHistoria> = {
  es: {
    nombre: 'La mirada',
    pregunta: '¿Qué opina la gente sobre China?',
    hallazgo: 'En la última oleada China queda por primera vez sobre Estados Unidos, y la posición política no ordena la opinión de forma robusta.',
  },
  en: {
    nombre: 'How China is seen',
    pregunta: 'What do people think of China?',
    hallazgo: 'In the latest wave, China comes out above the United States for the first time, and political position does not show a robust gradient in views of China.',
  },
  cn: {
    nombre: '对华观感',
    pregunta: '人们如何看待中国？',
    hallazgo: '在最近一轮调查中，中国首次高于美国；政治立场与对华看法之间没有稳健的对应关系。',
  },
}

const pct = (v: number) => porcentaje(v, 1)

export const TEXTOS: Record<Idioma, (v: Valores) => Contenido> = {
  es: (v) => {
    const titularIdeologia = 'La posición política no ordena la opinión sobre China de forma robusta'
    const comillas = (xs: string[]) => lista(xs.map((x) => `«${x}»`))
    const lectura = (filas: FilaTexto[]) => filas.map((f) => `${f.etiqueta} ${f.valores.map((x) => (x === null ? 'sin dato' : pct(x))).join(', ')}`).join('; ')
    return {
      salida: 'Volver a las historias',
      titularTermometro: v.primeraVezArriba
        ? `En ${v.ultimaOla} China pasa a Estados Unidos${v.siempreMejor && v.mejorEsJapon ? ', pero Japón sigue liderando' : ''}`
        : `En ${v.ultimaOla} las personas evalúan mejor a ${v.chinaSobreEeuu ? 'China que a Estados Unidos' : 'Estados Unidos que a China'}.`,
      frasesTermometro: [
        <>
          {v.brechaPrimera?.estado === 'parejos'
            ? <>En {v.primeraOla} los dos estaban <strong>parejos</strong></>
            : <>En {v.primeraOla} <strong>{v.brechaPrimera?.estado === 'china' ? 'China' : 'Estados Unidos'} estaba arriba</strong></>}
          {v.brechaPenultima && (v.brechaPenultima.estado === 'parejos'
            ? <>, y en {v.penultimaOla} seguían parejos.</>
            : <>, y en {v.penultimaOla} <strong>{v.brechaPenultima.estado === 'china' ? 'China' : 'Estados Unidos'}</strong> quedó
              arriba por {decimal(v.brechaPenultima.puntos)} puntos.</>)}
        </>,
        <>
          <strong>En {v.ultimaOla} China queda arriba{v.primeraVezArriba && ' por primera vez'}</strong>:
          {' '}sube a {decimal(v.chinaUltima)} y Estados Unidos baja a{' '}
          {decimal(v.eeuuUltima)}.
        </>,
        <>
          <strong>{v.mejorPais} {v.siempreMejor ? 'encabeza las tres oleadas' : `encabeza ${v.ultimaOla}`}</strong>,
          con {decimal(v.mejorUltima)} en {v.ultimaOla}:{' '}
          {decimal(v.mejorUltima - v.chinaUltima)} puntos
          sobre China.
        </>,
        <>
          <strong>Todo el cambio de la serie ocurre en {v.ultimaOla}</strong>: entre{' '}
          {v.primeraOla} y {v.penultimaOla}{' '}
          {v.quietasEntreOlas
            ? <>ningún cambio en los {cardinal(v.paises)} países se distingue del azar</>
            : <>ningún país se movió más de {decimal(v.quietas)} {v.quietasRedondo === 1 ? 'punto' : 'puntos'}</>}.
        </>,
      ],
      puntoTermometro: (pais, ola, valor, base) => `${pais} · ${ola}: ${decimal(valor)} sobre 100 (n = ${numero(base)})`,
      unidadTermometro: (_escala, espanol) => `${espanol} · n = ${rangoDeEnes([v.baseMinima, v.baseMaxima], (a, b) => `${a} a ${b}`)}`,
      notaTermometro: (
        <>
          Un punto por oleada, promedio de quienes contestaron. Bases de{' '}
          {numero(v.baseMinima)} a {numero(v.baseMaxima)} según país y oleada. «Parejos» y
          «arriba» comparan las dos notas dentro de cada persona.
        </>
      ),
      respiroPuente: {
        titulo: 'El alza no se concentra en un solo grupo. ¿Y en el eje político?',
        cuerpo: v.conPuente
          ? <>El alza aparece en {cardinal(v.cortesEnteros[0].total)} {v.cortesEnteros[0].etiqueta} y
            en {cardinal(v.cortesEnteros[1].total)} {v.cortesEnteros[1].etiqueta}. <strong>¿Y en el eje
            político?</strong></>
          : <>El alza no se concentra en un solo grupo. <strong>¿Y en el eje político?</strong></>,
      },
      titularIdeologia,
      frasesIdeologia: [
        <>
          Una recta sobre los tramos encuentra inclinación:{' '}
          <strong>{decimal(v.pendientePrimera)} puntos menos por cada paso
          hacia la derecha</strong>.
        </>,
        <>
          Toda esa inclinación la sostiene <strong>un solo punto</strong>: las{' '}
          {numero(v.sostiene?.n ?? 0)} personas del {v.sostiene?.x}, que evalúan a China entre{' '}
          {decimal(v.icSostiene[0], 0)} y{' '}
          {decimal(v.icSostiene[1], 0)}.
        </>,
        <>
          <strong>Sin ellas la recta se endereza</strong>: {decimal(v.sostiene?.b ?? 0)}{' '}
          puntos, y la horizontal entra en el rango.
        </>,
        <>
          Las otras oleadas dicen lo mismo: <strong>la posición política no ordena la
          opinión sobre China de forma robusta</strong>.
        </>,
      ],
      izquierda: '1 · izquierda',
      derecha: 'derecha · 10',
      unidadRecta: (etapa) => `Evaluación de 0 a 100 · n = ${etapa === 'todas'
        ? rangoDeEnes(v.enesRecta, (a, b) => `${a} a ${b}`)
        : numero(etapa === 'sin' ? (v.sostiene?.nRecta ?? 0) : v.totalPrimera)}`,
      descripcionTermometro: (filas, olas) => `Evaluación media de cada país, de 0 a 100, por oleada. ` + filas.map((f) => `${f.etiqueta}: ${f.valores.map((v, i) => v === null ? null : `${olas[i]} ${decimal(v, 1)}`).filter(Boolean).join(", ")}`).join(". "),
      rotuloTermometro: 'Simpatía media por cada país',
      rotuloRecta: 'Evaluación de China por tramo político',
      notaRecta: (etapa) => (
        <>
          Cada punto es un promedio; su tamaño dice cuánta gente hay.{' '}
          {etapa === 'todas'
            ? <>Las tres oleadas, con sus muestras completas. La franja de cada recta es el rango de pendientes compatibles con los datos.</>
            : etapa === 'sin'
              ? <>Oleada {v.primeraOla} sin quienes se ubican en el {v.sostiene?.x}: {numero(v.sostiene?.nRecta ?? 0)} personas. El punto retirado queda hueco, no borrado.</>
              : etapa === 'intervalo'
                ? <>Oleada {v.primeraOla}, {numero(v.totalPrimera)} personas. La barra vertical es el intervalo del 95 % del promedio de ese punto.</>
                : <>Oleada {v.primeraOla}, {numero(v.totalPrimera)} personas, de las cuales{' '}
                  {porcentaje(100 * (v.puntoMasPoblado?.n ?? 0) / (v.totalPrimera || 1), 0)} se ubica
                  en el {v.puntoMasPoblado?.x}. La recta es una regresión lineal simple de la
                  evaluación sobre la escala de ideología.</>}
        </>
      ),
      pendienteNula: ' ns',
      respiroPalabras: {
        titulo: '¿Y qué se les viene a la cabeza?',
        cuerpo: <>¿Y qué es lo <strong>primero</strong> que se les viene a la cabeza?</>,
      },
      titularPalabras: v.trumpSube && v.trumpSobreDiez
        ? `En ${v.olaTrump}, más de uno de cada diez escribe «Trump» cuando le nombran Estados Unidos`
        : 'Lo primero que se le viene a la cabeza con cada país',
      frasesPalabras: [
        <>
          Con China, en {v.ultimaOla}, se escribe sobre todo {comillas(v.palabrasChina)}.
          {v.tecnologia && !v.tecnologiaFirme && <> «Tecnología» pasa de {pct(v.tecnologia.desde)} a {pct(v.tecnologia.hasta)}, un alza que no alcanza a afirmarse.</>}
        </>,
        v.trumpSube && v.saltoTrump
          ? <>Con Estados Unidos, en {v.saltoTrump.desde} «Trump» lo escribía el {pct(v.saltoTrump.a)}. En {v.saltoTrump.hasta}, el <strong>{pct(v.saltoTrump.b)}</strong>.</>
          : <>Con Estados Unidos: {comillas(v.palabrasEeuu)}.</>,
      ],
      bloqueChina: 'Lo que se asocia a China',
      bloqueEeuu: 'Lo que se asocia a Estados Unidos',
      puntoPalabra: (bloque, palabra, ola, valor) => `${bloque} · «${palabra}» · ${ola}: ${pct(valor)}`,
      unidadPalabras: `% que la escribe · n = ${rangoDeEnes(v.basesPalabras, (a, b) => `${a} a ${b}`)}`,
      descripcionPalabras: (china, eeuu) => `Lo primero que se le viene a la cabeza, en porcentaje de quienes contestaron, por oleada. China: ${lectura(china)}. Estados Unidos: ${lectura(eeuu)}.`,
      notaPalabras: (
        <>
          Una palabra por persona, sin opciones. Sobre {v.basesPalabras.map(numero).join(', ')} personas.
          «Trump» y «tecnología» se eligieron después de ver las cifras: pruebas exploratorias.
        </>
      ),
    }
  },
  en: (v) => {
    const titularIdeologia = 'Political position does not show a robust gradient in views of China'
    const comillas = (xs: string[]) => lista(xs.map((x) => `“${x}”`))
    const lectura = (filas: FilaTexto[]) => filas.map((f) => `${f.etiqueta} ${f.valores.map((x) => (x === null ? 'no data' : pct(x))).join(', ')}`).join('; ')
    const lider = (b: Brecha | null) => (b?.estado === 'china' ? 'China' : 'the United States')
    return {
      salida: 'Back to stories',
      titularTermometro: v.primeraVezArriba
        ? `In ${v.ultimaOla}, China overtakes the United States${v.siempreMejor && v.mejorEsJapon ? ', but Japan still leads' : ''}`
        : `In ${v.ultimaOla}, respondents rate ${v.chinaSobreEeuu ? 'China more highly than the United States' : 'the United States more highly than China'}.`,
      frasesTermometro: [
        <>
          {v.brechaPrimera?.estado === 'parejos'
            ? <>In {v.primeraOla} there was <strong>no clear difference</strong> between the two</>
            : <>In {v.primeraOla} <strong>{capital(lider(v.brechaPrimera))} was ahead</strong></>}
          {v.brechaPenultima && (v.brechaPenultima.estado === 'parejos'
            ? <>, and in {v.penultimaOla} there was still no clear difference.</>
            : <>, and in {v.penultimaOla} <strong>{lider(v.brechaPenultima)}</strong> came out
              ahead by {decimal(v.brechaPenultima.puntos)} {plural(v.brechaPenultima.puntos, { one: 'point', other: 'points' })}.</>)}
        </>,
        <>
          <strong>In {v.ultimaOla}, China comes out ahead{v.primeraVezArriba && ' for the first time'}</strong>:
          {' '}it rises to {decimal(v.chinaUltima)} and the United States falls to{' '}
          {decimal(v.eeuuUltima)}.
        </>,
        <>
          <strong>{v.mejorPais} {v.siempreMejor ? 'leads in all three waves' : `leads in ${v.ultimaOla}`}</strong>,
          with {decimal(v.mejorUltima)} in {v.ultimaOla}:{' '}
          {decimal(v.mejorUltima - v.chinaUltima)} points above China.
        </>,
        <>
          <strong>All of the change in the survey series happens in {v.ultimaOla}</strong>: between{' '}
          {v.primeraOla} and {v.penultimaOla},{' '}
          {v.quietasEntreOlas
            ? <>no change in any of the {cardinalEn(v.paises)} countries can be distinguished from random variation</>
            : <>no country moved more than {decimal(v.quietas)} {plural(v.quietasRedondo, { one: 'point', other: 'points' })}</>}.
        </>,
      ],
      puntoTermometro: (pais, ola, valor, base) => `${pais} · ${ola}: ${decimal(valor)} out of 100 (n = ${numero(base)})`,
      unidadTermometro: (escala) => (escala.min > 0 || escala.max < 100
        ? `Rating from 0 to 100 · axis cut to ${numero(escala.min)}–${numero(escala.max)} · n = ${rangoDeEnes([v.baseMinima, v.baseMaxima], (a, b) => `${a} to ${b}`)}`
        : `Rating from 0 to 100 · n = ${rangoDeEnes([v.baseMinima, v.baseMaxima], (a, b) => `${a} to ${b}`)}`),
      notaTermometro: (
        <>
          One dot per wave: the average of those who answered. Valid responses from N = {numero(v.baseMinima)} to{' '}
          {numero(v.baseMaxima)}, depending on country and wave. “No clear difference” and “ahead”
          compare the two ratings within each person.
        </>
      ),
      respiroPuente: {
        titulo: 'The rise is not concentrated in a single group. What about the political spectrum?',
        cuerpo: v.conPuente
          ? <>The rise appears in {cardinalEn(v.cortesEnteros[0].total)} {v.cortesEnteros[0].etiqueta} and
            in {cardinalEn(v.cortesEnteros[1].total)} {v.cortesEnteros[1].etiqueta}. <strong>What about the
            political spectrum?</strong></>
          : <>The rise is not concentrated in a single group. <strong>What about the political spectrum?</strong></>,
      },
      titularIdeologia,
      frasesIdeologia: [
        <>
          A straight line fitted across the scale finds a slope:{' '}
          <strong>{decimal(v.pendientePrimera)} points lower for each step
          to the right</strong>.
        </>,
        <>
          That whole slope rests on <strong>a single point</strong>: the{' '}
          {numero(v.sostiene?.n ?? 0)} people at {v.sostiene?.x}, who rate China between{' '}
          {decimal(v.icSostiene[0], 0)} and{' '}
          {decimal(v.icSostiene[1], 0)}.
        </>,
        <>
          <strong>Without them, the line flattens</strong>: {decimal(v.sostiene?.b ?? 0)}{' '}
          points, and a flat line falls within the range.
        </>,
        <>
          The other waves say the same: <strong>political position does not show a robust gradient
          in views of China</strong>.
        </>,
      ],
      izquierda: '1 · left',
      derecha: 'right · 10',
      unidadRecta: (etapa) => `Rating from 0 to 100 · n = ${etapa === 'todas'
        ? rangoDeEnes(v.enesRecta, (a, b) => `${a} to ${b}`)
        : numero(etapa === 'sin' ? (v.sostiene?.nRecta ?? 0) : v.totalPrimera)}`,
      descripcionTermometro: (filas, olas) => `Average rating of each country, from 0 to 100, by wave. ` + filas.map((f) => `${f.etiqueta}: ${f.valores.map((v, i) => v === null ? null : `${olas[i]} ${decimal(v, 1)}`).filter(Boolean).join(", ")}`).join(". "),
      rotuloTermometro: 'Average warmth towards each country',
      rotuloRecta: 'Opinion of China by political position',
      notaRecta: (etapa) => (
        <>
          Each dot is an average; its size shows how many people it holds.{' '}
          {etapa === 'todas'
            ? <>All three waves, with their full samples. The band around each line is the range of slopes compatible with the data.</>
            : etapa === 'sin'
              ? <>{v.primeraOla} wave, without those who place themselves at {v.sostiene?.x}: {numero(v.sostiene?.nRecta ?? 0)} people. The removed point is left hollow, not erased.</>
              : etapa === 'intervalo'
                ? <>{v.primeraOla} wave, {numero(v.totalPrimera)} people. The vertical bar is the 95% interval of that point’s average.</>
                : <>{v.primeraOla} wave, {numero(v.totalPrimera)} people, of whom{' '}
                  {porcentaje(100 * (v.puntoMasPoblado?.n ?? 0) / (v.totalPrimera || 1), 0)} place themselves
                  at {v.puntoMasPoblado?.x}. The line is a simple linear regression of the
                  rating on the ideology scale.</>}
        </>
      ),
      pendienteNula: ' ns',
      respiroPalabras: {
        titulo: 'And what comes to mind?',
        cuerpo: <>And what is the <strong>first</strong> thing that comes to mind?</>,
      },
      titularPalabras: v.trumpSube && v.trumpSobreDiez
        ? `In ${v.olaTrump}, more than one in ten write “Trump” when the United States is mentioned`
        : 'The first thing that comes to mind for each country',
      frasesPalabras: [
        <>
          For China, in {v.ultimaOla}, people mostly write {comillas(v.palabrasChina)}.
          {v.tecnologia && !v.tecnologiaFirme && <> “{capital(v.palabraTecnologia)}” goes from {pct(v.tecnologia.desde)} to {pct(v.tecnologia.hasta)}, a rise that cannot be distinguished from random variation.</>}
        </>,
        v.trumpSube && v.saltoTrump
          ? <>For the United States, in {v.saltoTrump.desde}, {pct(v.saltoTrump.a)} wrote “Trump.” In {v.saltoTrump.hasta}, <strong>{pct(v.saltoTrump.b)}</strong>.</>
          : <>For the United States: {comillas(v.palabrasEeuu)}.</>,
      ],
      bloqueChina: 'What is associated with China',
      bloqueEeuu: 'What is associated with the United States',
      puntoPalabra: (bloque, palabra, ola, valor) => `${bloque} · “${palabra}” · ${ola}: ${pct(valor)}`,
      unidadPalabras: `% who write it · n = ${rangoDeEnes(v.basesPalabras, (a, b) => `${a} to ${b}`)}`,
      descripcionPalabras: (china, eeuu) => `The first thing that comes to mind, as a percentage of those who answered, by wave. China: ${lectura(china)}. United States: ${lectura(eeuu)}.`,
      notaPalabras: (
        <>
          One word per person, with no response options. Based on {lista(v.basesPalabras.map(numero))} people.
          “Trump” and “technology” were chosen after seeing the figures: exploratory tests.
        </>
      ),
    }
  },
  cn: (v) => {
    const titularIdeologia = '政治立场与对中国的看法之间没有稳健的对应关系'
    const comillas = (xs: string[]) => lista(xs.map((x) => `“${x}”`))
    const lectura = (filas: FilaTexto[]) => filas.map((f) => `${f.etiqueta} ${f.valores.map((x) => (x === null ? '无数据' : pct(x))).join('，')}`).join('；')
    const lider = (b: Brecha | null) => (b?.estado === 'china' ? '中国' : '美国')
    return {
      salida: '返回数据故事',
      titularTermometro: v.primeraVezArriba
        ? `${v.ultimaOla}年，中国超过美国${v.siempreMejor && v.mejorEsJapon ? '，但日本仍居首位' : ''}`
        : `${v.ultimaOla}年，受访者${v.chinaSobreEeuu ? '对中国的评价高于美国' : '对美国的评价高于中国'}。`,
      frasesTermometro: [
        <>
          {v.brechaPrimera?.estado === 'parejos'
            ? <>{v.primeraOla}年，两国<strong>难分高下</strong></>
            : <>{v.primeraOla}年，<strong>{lider(v.brechaPrimera)}领先</strong></>}
          {v.brechaPenultima && (v.brechaPenultima.estado === 'parejos'
            ? <>；{v.penultimaOla}年仍难分高下。</>
            : <>；{v.penultimaOla}年，<strong>{lider(v.brechaPenultima)}</strong>领先{decimal(v.brechaPenultima.puntos)}分。</>)}
        </>,
        <>
          <strong>{v.ultimaOla}年，中国{v.primeraVezArriba && '首次'}领先</strong>：升至{decimal(v.chinaUltima)}分，美国降至{decimal(v.eeuuUltima)}分。
        </>,
        <>
          <strong>{v.mejorPais}{v.siempreMejor ? '在三轮调查中均居首位' : `在${v.ultimaOla}年居首位`}</strong>，
          {v.ultimaOla}年为{decimal(v.mejorUltima)}分，比中国高{decimal(v.mejorUltima - v.chinaUltima)}分。
        </>,
        <>
          <strong>历次调查中的变化全部出现在{v.ultimaOla}年</strong>：{v.primeraOla}年至{v.penultimaOla}年间，
          {v.quietasEntreOlas
            ? <>这{cardinalCn(v.paises)}个国家的变化均与随机波动无法区分</>
            : <>没有一个国家的变动超过{decimal(v.quietas)}分</>}。
        </>,
      ],
      puntoTermometro: (pais, ola, valor, base) => `${pais} · ${ola}年：${decimal(valor)}分（满分100，n = ${numero(base)}）`,
      unidadTermometro: (escala) => (escala.min > 0 || escala.max < 100
        ? `评分0–100 · 坐标轴截取${numero(escala.min)}–${numero(escala.max)} · n = ${rangoDeEnes([v.baseMinima, v.baseMaxima], (a, b) => `${a}至${b}`)}`
        : `评分0–100 · n = ${rangoDeEnes([v.baseMinima, v.baseMaxima], (a, b) => `${a}至${b}`)}`),
      notaTermometro: (
        <>
          每轮一个点，为作答者的平均分。有效回答：N = {numero(v.baseMinima)}至{numero(v.baseMaxima)}，因国家和轮次而异。“难分高下”与“领先”比较的是同一受访者给两国的评分。
        </>
      ),
      respiroPuente: {
        titulo: '上升并不集中于某一个群体。那么在政治光谱上呢？',
        cuerpo: v.conPuente
          ? <>上升出现在{cardinalCn(v.cortesEnteros[0].total)}个{v.cortesEnteros[0].etiqueta}和{cardinalCn(v.cortesEnteros[1].total)}个{v.cortesEnteros[1].etiqueta}中。<strong>那么在政治光谱上呢？</strong></>
          : <>上升并不集中于某一个群体。<strong>那么在政治光谱上呢？</strong></>,
      },
      titularIdeologia,
      frasesIdeologia: [
        <>
          在各刻度上拟合一条直线，可见倾斜：<strong>每向右移一格，评分低{decimal(v.pendientePrimera)}分</strong>。
        </>,
        <>
          这一倾斜完全由<strong>一个点</strong>支撑：位于{v.sostiene?.x}的{numero(v.sostiene?.n ?? 0)}名受访者，他们对中国的评分在{decimal(v.icSostiene[0], 0)}至{decimal(v.icSostiene[1], 0)}之间。
        </>,
        <>
          <strong>去掉这些人，直线趋于水平</strong>：斜率为{decimal(v.sostiene?.b ?? 0)}分，水平线落入区间之内。
        </>,
        <>
          其他各轮调查结果相同：<strong>政治立场与对中国的看法之间没有稳健的对应关系</strong>。
        </>,
      ],
      izquierda: '1 · 左',
      derecha: '右 · 10',
      unidadRecta: (etapa) => `好感度（0–100） · n = ${etapa === 'todas'
        ? rangoDeEnes(v.enesRecta, (a, b) => `${a}至${b}`)
        : numero(etapa === 'sin' ? (v.sostiene?.nRecta ?? 0) : v.totalPrimera)}`,
      descripcionTermometro: (filas, olas) => `各国的平均评分（0–100），按轮次。` + filas.map((f) => `${f.etiqueta}: ${f.valores.map((v, i) => v === null ? null : `${olas[i]} ${decimal(v, 1)}`).filter(Boolean).join(", ")}`).join(". "),
      rotuloTermometro: '各国的平均好感度',
      rotuloRecta: '按政治立场看对华好感度',
      notaRecta: (etapa) => (
        <>
          每个点为一个平均值，点的大小表示人数。
          {etapa === 'todas'
            ? <>三轮调查，均为完整样本。每条直线周围的色带为与数据相容的斜率范围。</>
            : etapa === 'sin'
              ? <>{v.primeraOla}年调查，不含自我定位于{v.sostiene?.x}的受访者：{numero(v.sostiene?.nRecta ?? 0)}人。被移除的点显示为空心，而非删除。</>
              : etapa === 'intervalo'
                ? <>{v.primeraOla}年调查，{numero(v.totalPrimera)}名受访者。竖线为该点平均值的95%区间。</>
                : <>{v.primeraOla}年调查，{numero(v.totalPrimera)}名受访者，其中{porcentaje(100 * (v.puntoMasPoblado?.n ?? 0) / (v.totalPrimera || 1), 0)}自我定位于{v.puntoMasPoblado?.x}。直线为评分对政治倾向量表的简单线性回归。</>}
        </>
      ),
      pendienteNula: ' ns',
      respiroPalabras: {
        titulo: '他们会想到什么？',
        cuerpo: <>那么，他们<strong>首先</strong>想到的是什么？</>,
      },
      titularPalabras: v.trumpSube && v.trumpSobreDiez
        ? `${v.olaTrump}年，提到美国时，超过十分之一的受访者写下“特朗普（Trump）”`
        : '提到每个国家时首先想到什么',
      frasesPalabras: [
        <>
          提到中国，{v.ultimaOla}年受访者写得最多的是{comillas(v.palabrasChina)}。
          {v.tecnologia && !v.tecnologiaFirme && <>“{v.palabraTecnologia}”从{pct(v.tecnologia.desde)}升至{pct(v.tecnologia.hasta)}，但这一上升与随机波动无法区分。</>}
        </>,
        v.trumpSube && v.saltoTrump
          ? <>提到美国，{v.saltoTrump.desde}年有{pct(v.saltoTrump.a)}的受访者写下“特朗普（Trump）”；{v.saltoTrump.hasta}年为<strong>{pct(v.saltoTrump.b)}</strong>。</>
          : <>提到美国：{comillas(v.palabrasEeuu)}。</>,
      ],
      bloqueChina: '与中国相关联的词',
      bloqueEeuu: '与美国相关联的词',
      puntoPalabra: (bloque, palabra, ola, valor) => `${bloque} · “${palabra}” · ${ola}年：${pct(valor)}`,
      unidadPalabras: `写下该词的受访者占比（%）· n = ${rangoDeEnes(v.basesPalabras, (a, b) => `${a}至${b}`)}`,
      descripcionPalabras: (china, eeuu) => `首先想到的词，占作答者的百分比，按轮次。中国：${lectura(china)}。美国：${lectura(eeuu)}。`,
      notaPalabras: (
        <>
          每人一个词，无预设选项。基数分别为{lista(v.basesPalabras.map(numero))}名受访者。“特朗普”和“科技”是在看到数据后选定的：属于探索性检验。
        </>
      ),
    }
  },
}
