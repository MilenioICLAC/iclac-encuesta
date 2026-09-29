import type { ReactNode } from 'react'
import { decimal, lista, numero, porcentaje, type Idioma } from '../../locale'
import { casosDe, rangoDeEnes } from '../lectura'
import type { FichaHistoria } from './tipos'

/**
 * Los textos de «China cotidiana», en los tres idiomas. La forma de estos módulos está en
 * `tipos.ts`; el componente (`cotidiana.tsx`) calcula y compone, y no escribe una palabra.
 *
 * Términos del glosario de traducción: «mall chino» es *Chinese-run variety store (mall chino)* /
 * 华人经营的百货店（mall chino） en la primera mención de cada bloque y *Chinese-run store* /
 * 华人百货店 en rótulos (término 93, desvío de los libros, que dicen *Chinese mall*); «restaurante
 * chino» es *Chinese restaurant* / 中餐馆 (94); «persona de China o de ascendencia china», 95;
 * «parejo», *no clear difference* / 难分高下 (50); «se sostiene», *holds up* / 经检验仍成立 (49).
 */

interface Punto { ola: number, valor: number, n: number }
interface Tramo { media: number, n: number }

/** Lo que calcula `cotidiana.tsx`: cifras, y las banderas que eligen cada frase. */
export interface Valores {
  primeraOla: number
  ultimaOla: number
  /** Vive a menos de diez cuadras de un mall chino (`mall-cerca`), por oleada. */
  mall: Punto[]
  /** Lo mismo con un restaurante chino (`restaurante-cerca`). */
  restaurante: Punto[]
  /** La diferencia entre las puntas, en valor absoluto, de cada serie. */
  mallDiferencia: number
  restauranteDiferencia: number
  mallCrece: boolean
  restauranteParejo: boolean
  /** Conoce personalmente a alguien de China o de ascendencia china (`conoce-china`). */
  conoce: Punto[]
  contactoQuieto: boolean
  /** Las dos últimas oleadas de `conoce` redondean igual: la frase las dice juntas. */
  conoceIgualAlFinal: boolean
  /** Dónde ocurre el contacto (`p16`), si la nube y su contraste existen. */
  lugar: {
    /** Nombra el mall (`palabra-mall`). */
    mall: Punto[]
    mallQuieto: boolean
    unCuarto: boolean
    /** Las filas de la figura, con la palabra ya visible (`palabraVisible`). */
    filas: { etiqueta: string, valores: (number | null)[] }[]
    /** Personas que contestaron, por oleada. */
    bases: number[]
    /** Escribe «buena» sobre cómo fue el contacto (`palabra-buena`), si existe. */
    buena: Punto[] | null
  } | null
  /** Los buses eléctricos, en la única oleada que preguntó. */
  buses: {
    ola: number
    /** Porcentajes de «no lo sabía» (código 2) y «lo sabía» (código 1). */
    noSabia: number | null
    siSabia: number | null
    /** Muy positivo o positivo, sobre todas las personas. */
    venBien: number
    baseMarca: number
    baseOpinion: number
    /** «Ve bien», entre quienes sabían la marca y quienes no. */
    sabian: Tramo | null
    noSabian: Tramo | null
    separa: boolean
  }
  /** Dice haber visto racismo contra personas chinas o asiáticas (`racismo-visto`). */
  racismo: Punto[]
  racismoDiferencia: number
  racismoBaja: boolean
  racismoParejoEntreAnios: boolean
  /** La advertencia de la medida, ya en el idioma activo. */
  advertenciaRacismo: string
  /** El racismo visto según si conoce a alguien de China, en la última oleada (`racismo-contacto`). */
  contacto: { ola: number, conoce: Tramo | null, noConoce: Tramo | null, separado: boolean }
}

export interface Contenido {
  /** El rótulo de la salida de la capa. */
  salida: string
  titularCosas: string
  frasesCosas: ReactNode[]
  descripcionCosas: string
  /** El nombre del gráfico de cada escena (`RotuloFigura`) y la unidad con su N al pie. */
  rotuloCosas: string
  ejeCosas: string
  /** El rótulo de las barras de cada serie, antes del año. */
  barraMall: string
  barraRestaurante: string
  notaCosas: ReactNode
  respiroPersonas: { titulo: string, cuerpo: ReactNode }
  titularPersonas: string
  frasesPersonas: ReactNode[]
  descripcionPersonas: string
  rotuloPersonas: string
  ejePersonas: string
  notaPersonas: ReactNode
  respiroLugar: { titulo: string, cuerpo: ReactNode }
  titularLugar: string
  frasesLugar: ReactNode[]
  descripcionLugar: string
  rotuloLugar: string
  /** El título al pasar sobre un punto: palabra, oleada y valor ya formateado. */
  tituloPunto: (palabra: string, ola: string, valor: string) => string
  unidadLugar: string
  /** El ancho de la columna de palabras: fuera del español va la traducción con la palabra original al lado. */
  anchoPalabra: { telefono: string, escritorio: string }
  notaLugar: ReactNode
  respiroCalle: { titulo: string, cuerpo: ReactNode }
  titularBuses: string
  frasesBuses: ReactNode[]
  preguntaMarca: string
  noLoSabia: string
  loSabia: string
  preguntaOpinion: string
  todas: string
  quienesSabian: string
  quienesNoSabian: string
  /** El texto equivalente de la **primera** figura de la escena: la barra partida de la marca.
   *  No existía: en movimiento normal se apoyaba en la descripción de la figura de opinión, y
   *  con movimiento reducido, donde se dibujan las dos, se quedaba sin ninguna (29-09-2026). */
  descripcionMarca: string
  descripcionBuses: string
  ejeMarca: string
  ejeOpinion: string
  notaMarca: ReactNode
  notaOpinion: ReactNode
  respiroVisto: { titulo: string, cuerpo: ReactNode }
  titularVisto: string
  frasesVisto: ReactNode[]
  /** El rótulo de los dos grupos de la última figura. */
  grupoConoce: string
  grupoNoConoce: string
  descripcionVisto: string
  /** El texto equivalente de la **segunda** figura de la escena: los dos grupos de contacto.
   *  Iba vacío (`descripcion=""`), así que esa mitad de la escena no tenía equivalente. */
  descripcionContacto: string
  /** La escena cambia de figura **y de base** a mitad de camino: dos rótulos y dos ejes. */
  rotuloVistoSerie: string
  ejeVistoSerie: string
  rotuloVistoGrupos: string
  ejeVistoGrupos: string
  notaSerieVisto: ReactNode
  notaContacto: ReactNode
}

export const FICHA: Record<Idioma, FichaHistoria> = {
  es: {
    nombre: 'China cotidiana',
    pregunta: '¿Cuánta China hay en la vida diaria?',
    hallazgo: 'Entre la primera y la última oleada, más gente tiene un mall chino cerca; conocer a alguien de China, no.',
  },
  en: {
    nombre: 'China in everyday life',
    pregunta: 'How much of China is there in everyday life?',
    hallazgo: 'Between the first and the last wave, more people have a Chinese-run variety store (mall chino) nearby, while the share who know someone from China shows no clear change.',
  },
  cn: {
    nombre: '日常生活中的中国',
    pregunta: '日常生活中有多少中国元素？',
    hallazgo: '从第一轮到最后一轮调查，附近有华人经营的百货店（mall chino）的人变多了；认识来自中国或华裔人士的比例则未见超出随机波动的变化。',
  },
}

const fmt = (v: number) => porcentaje(v, 1)
const ultimo = (xs: Punto[]) => xs[xs.length - 1]

export const TEXTOS: Record<Idioma, (v: Valores) => Contenido> = {
  es: (v) => {
    const { buses, contacto, lugar } = v
    const partes = [
      buses.noSabia !== null ? `no ${fmt(buses.noSabia)}` : null,
      buses.siSabia !== null ? `sí ${fmt(buses.siSabia)}` : null,
    ].filter(Boolean)
    const filasOpinion = [
      `Todas las personas ${fmt(buses.venBien)}`,
      ...(buses.sabian ? [`Quienes lo sabían ${fmt(buses.sabian.media)}`] : []),
      ...(buses.noSabian ? [`Quienes no lo sabían ${fmt(buses.noSabian.media)}`] : []),
    ]
    const grupos = [
      ...(contacto.noConoce ? [`No conoce: ${fmt(contacto.noConoce.media)}`] : []),
      ...(contacto.conoce ? [`Conoce: ${fmt(contacto.conoce.media)}`] : []),
    ]
    const cierreConoce = `La diferencia con ${v.primeraOla} ${v.contactoQuieto ? 'no se distingue del ruido' : 'sí se sostiene'}.`
    const [, segunda, tercera] = v.conoce
    return {
      salida: 'Volver a las historias',
      rotuloCosas: 'Mall y restaurante chinos cerca de casa',
      ejeCosas: `% de las personas encuestadas · n = ${rangoDeEnes([...v.mall, ...v.restaurante].map((x) => x.n), (a, b) => `${a} a ${b}`)}`,
      rotuloPersonas: 'Conoce a alguien de China',
      ejePersonas: `% de las personas encuestadas · n = ${rangoDeEnes(v.conoce.map((x) => x.n), (a, b) => `${a} a ${b}`)}`,
      rotuloLugar: 'Dónde ocurre el contacto',
      descripcionMarca: `Sabía que los buses eléctricos de Santiago son de marcas chinas, en ${v.buses.ola}: lo sabía el ${porcentaje(v.buses.siSabia ?? 0, 1)}; no lo sabía el ${porcentaje(v.buses.noSabia ?? 0, 1)}.`,
      ejeMarca: `La barra entera es el 100 % · n = ${numero(v.buses.baseMarca)}, solo ${v.buses.ola}`,
      ejeOpinion: `% de cada fila · n = ${numero(v.buses.baseOpinion)} en total; ${numero(v.buses.sabian?.n ?? 0)} y ${numero(v.buses.noSabian?.n ?? 0)} por grupo`,
      rotuloVistoSerie: 'Dice haber visto racismo',
      ejeVistoSerie: `% de las personas encuestadas · n = ${rangoDeEnes(v.racismo.map((x) => x.n), (a, b) => `${a} a ${b}`)}`,
      rotuloVistoGrupos: 'Racismo visto, según si conoce a alguien',
      descripcionContacto: `Dice haber visto racismo en ${v.contacto.ola}, según si conoce a alguien de China: quienes no conocen, ${decimal(v.contacto.noConoce?.media ?? 0, 1)} %; quienes conocen, ${decimal(v.contacto.conoce?.media ?? 0, 1)} %.`,
      ejeVistoGrupos: `% de cada grupo · n = ${numero(v.contacto.noConoce?.n ?? 0)} y ${numero(v.contacto.conoce?.n ?? 0)}, solo ${v.contacto.ola}`,
      titularCosas: v.mallCrece && v.restauranteParejo
        ? `Entre ${v.primeraOla} y ${v.ultimaOla} creció la proporción que vive cerca de un mall chino; la del restaurante quedó pareja`
        : 'Qué tan cerca queda China del barrio',
      frasesCosas: [
        <>En {v.primeraOla}, el <strong>{fmt(v.mall[0].valor)}</strong> decía vivir a menos de diez cuadras de un mall chino.</>,
        <>En {v.ultimaOla}, el <strong>{fmt(ultimo(v.mall).valor)}</strong>: {decimal(v.mallDiferencia)} puntos más.</>,
        <>
          El restaurante chino, en cambio, <strong>{v.restauranteParejo ? 'queda parejo' : 'también se mueve'}</strong>:{' '}
          {fmt(v.restaurante[0].valor)} en {v.primeraOla} y {fmt(ultimo(v.restaurante).valor)} en {v.ultimaOla},
          {v.restauranteParejo ? ' prácticamente donde estaba.' : ` ${decimal(v.restauranteDiferencia)} puntos de diferencia.`}
        </>,
      ],
      descripcionCosas: `Vive a menos de diez cuadras de un mall chino y de un restaurante chino, por oleada. ${[...v.mall.map((p) => `Mall ${p.ola}: ${fmt(p.valor)}`), ...v.restaurante.map((p) => `Restaurante ${p.ola}: ${fmt(p.valor)}`)].join('. ')}.`,
      barraMall: 'Mall',
      barraRestaurante: 'Restaurante',
      notaCosas: (
        <>
          Sobre {lista(v.mall.map((p) => numero(p.n)))} personas
          encuestadas. Es lo que cada persona dice tener cerca, no un dato de su dirección.
        </>
      ),
      respiroPersonas: { titulo: '¿Y con personas?', cuerpo: <>¿Y con <strong>personas</strong>?</> },
      titularPersonas: v.contactoQuieto
        ? 'El contacto con personas de China queda parejo'
        : 'Cuántas personas conocen personalmente a alguien de China',
      frasesPersonas: [
        <>En {v.primeraOla}, el <strong>{fmt(v.conoce[0].valor)}</strong> decía conocer personalmente a alguien de China o de ascendencia china.</>,
        v.conoceIgualAlFinal
          ? <>En {segunda.ola} y en {v.ultimaOla} el <strong>{fmt(segunda.valor)}</strong>. {cierreConoce}</>
          : <>En {segunda.ola} el <strong>{fmt(segunda.valor)}</strong> y en {v.ultimaOla} el <strong>{fmt(tercera.valor)}</strong>. {cierreConoce}</>,
      ],
      descripcionPersonas: `Conoce personalmente a alguien de China o de ascendencia china, por oleada. ${v.conoce.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`,
      notaPersonas: <>{lista(v.conoce.map((p) => `${casosDe(p.valor, p.n)} de ${numero(p.n)}`))} personas encuestadas.</>,
      respiroLugar: { titulo: '¿Y dónde es ese contacto?', cuerpo: <>¿Y <strong>dónde</strong> es ese contacto?</> },
      titularLugar: lugar && lugar.mallQuieto && lugar.unCuarto
        ? 'Cerca de un cuarto nombra el mall cuando se le pregunta dónde tiene contacto con personas chinas, las tres oleadas'
        : 'Dónde ocurre el contacto con personas chinas',
      frasesLugar: lugar
        ? [
            <>En {v.primeraOla}, el <strong>{fmt(lugar.mall[0].valor)}</strong> nombraba el mall; también aparecían las compras y el restaurante.</>,
            <>
              En {lugar.mall.at(-2)!.ola}, el <strong>{fmt(lugar.mall.at(-2)!.valor)}</strong>; en {v.ultimaOla}, el <strong>{fmt(ultimo(lugar.mall).valor)}</strong>.
              {lugar.mallQuieto ? ' Tres oleadas en el mismo rango.' : ' Esta vez la cifra se mueve.'}
            </>,
          ]
        : [],
      descripcionLugar: `Dónde tiene contacto con personas de China, en porcentaje de quienes contestaron, por oleada. ${(lugar?.filas ?? []).map((f) => `${f.etiqueta}: ${f.valores.map((x) => (x === null ? 'sin dato' : fmt(x))).join(', ')}`).join('. ')}.`,
      tituloPunto: (palabra, ola, valor) => `«${palabra}» · ${ola}: ${valor}`,
      unidadLugar: `% que lo nombra · n = ${rangoDeEnes(v.lugar?.bases ?? [], (a, b) => `${a} a ${b}`)}. Suman más de 100: se puede nombrar más de un lugar.`,
      anchoPalabra: { telefono: '6rem', escritorio: '9.5rem' },
      notaLugar: lugar && (
        <>
          Respuesta abierta; se puede nombrar más de un lugar. Sin «chino», que repite la pregunta. Sobre{' '}
          {lugar.bases.map((b) => numero(b)).join(', ')} personas.
          {lugar.buena && <> Desde {lugar.buena[0].ola} se pregunta cómo fue ese contacto: «buena» la escribe el {lugar.buena.map((p) => fmt(p.valor)).join(' y el ')}.</>}
        </>
      ),
      respiroCalle: { titulo: '¿Y en la calle?', cuerpo: <>¿Y en la <strong>calle</strong>?</> },
      titularBuses: buses.noSabia !== null && buses.noSabia > 50
        ? 'Más de la mitad no sabía que los buses eléctricos de Santiago son de marcas chinas'
        : 'Quién sabía que los buses eléctricos de Santiago son de marcas chinas',
      frasesBuses: [
        <>En {buses.ola}, el <strong>{fmt(buses.noSabia ?? 0)}</strong> no sabía que los buses eléctricos de Santiago son de marcas chinas.</>,
        <>Y el <strong>{fmt(buses.venBien)}</strong> ve bien que el {porcentaje(30, 0)} de la flota sea eléctrica.</>,
        buses.separa
          ? <>Quienes sabían la marca la ven aún mejor: <strong>{fmt(buses.sabian?.media ?? 0)}</strong> contra <strong>{fmt(buses.noSabian?.media ?? 0)}</strong>.</>
          : <>Entre quienes sabían la marca y quienes no, queda <strong>parejo</strong>: {fmt(buses.sabian?.media ?? 0)} contra {fmt(buses.noSabian?.media ?? 0)}.</>,
      ],
      preguntaMarca: 'Sabía que los buses son chinos',
      noLoSabia: 'No lo sabía',
      loSabia: 'Lo sabía',
      preguntaOpinion: 'Ve bien la flota, según si sabía',
      todas: 'Todas las personas',
      quienesSabian: 'Quienes lo sabían',
      quienesNoSabian: 'Quienes no lo sabían',
      descripcionBuses: `En ${buses.ola}. Sabía que los buses son de marcas chinas: ${partes.join(', ')}. Ve bien la electrificación: ${filasOpinion.join(', ')}.`,
      notaMarca: <>{numero(buses.baseMarca)} personas encuestadas en {buses.ola}, la única oleada con estas preguntas.</>,
      notaOpinion: (
        <>
          «Ve bien» es muy positivo o positivo, sobre {numero(buses.baseOpinion)} personas: {numero(buses.sabian?.n ?? 0)} lo sabían y {numero(buses.noSabian?.n ?? 0)} no. Es una
          asociación: no dice que saber la marca cambie la opinión.
        </>
      ),
      respiroVisto: { titulo: '¿Y qué se ve?', cuerpo: <>¿Y qué se <strong>ve</strong>?</> },
      titularVisto: v.racismoBaja
        ? `Entre ${v.primeraOla} y ${v.ultimaOla} bajó la proporción que dice haber visto racismo contra personas chinas o asiáticas`
        : 'Quién dice haber visto racismo contra personas chinas o asiáticas',
      frasesVisto: [
        <>
          En {v.primeraOla} lo reportó el <strong>{fmt(v.racismo[0].valor)}</strong> de las personas encuestadas;
          en {v.racismo[1].ola}, el <strong>{fmt(v.racismo[1].valor)}</strong>.
          {v.racismoParejoEntreAnios ? ' De un año al otro, la baja no se distingue del azar.' : ' Cada año, la baja se sostiene.'}
        </>,
        <>
          En {v.ultimaOla}, el <strong>{fmt(v.racismo[2].valor)}</strong>: {decimal(v.racismoDiferencia)} puntos
          menos que en {v.primeraOla}. {v.racismoBaja ? 'Sumada, la baja sí se sostiene.' : 'Ni sumada se sostiene.'}
        </>,
        contacto.separado
          ? <>Quienes conocen personalmente a alguien de China <strong>lo reportan más</strong>: {fmt(contacto.conoce?.media ?? 0)} contra {fmt(contacto.noConoce?.media ?? 0)} en {contacto.ola}.</>
          : <>Entre quienes conocen y no conocen a alguien de China <strong>queda parejo</strong>: {fmt(contacto.conoce?.media ?? 0)} contra {fmt(contacto.noConoce?.media ?? 0)} en {contacto.ola}.</>,
      ],
      grupoConoce: 'Conoce',
      grupoNoConoce: 'No conoce',
      descripcionVisto: `Dice haber visto racismo contra personas chinas o asiáticas. Por oleada: ${v.racismo.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}. En ${contacto.ola}, según si conoce a alguien de China: ${grupos.join('. ')}.`,
      notaSerieVisto: (
        <>
          {lista(v.racismo.map((p) => `${casosDe(p.valor, p.n)} de ${numero(p.n)} en ${p.ola}`))}: baja la proporción, no el número de personas. {v.advertenciaRacismo} Y que menos personas lo reporten no dice si hay menos racismo o si el tema se nota menos.
        </>
      ),
      notaContacto: (
        <>
          {casosDe(contacto.noConoce?.media ?? 0, contacto.noConoce?.n ?? 0)} de {numero(contacto.noConoce?.n ?? 0)} y{' '}
          {casosDe(contacto.conoce?.media ?? 0, contacto.conoce?.n ?? 0)} de {numero(contacto.conoce?.n ?? 0)} personas
          encuestadas en {contacto.ola}. Es una asociación en la encuesta: no dice si el contacto cambia lo que
          se ve o lo que se reconoce como racista, ni descarta otras diferencias entre los dos grupos.
        </>
      ),
    }
  },
  en: (v) => {
    const { buses, contacto, lugar } = v
    const partes = [
      buses.noSabia !== null ? `no ${fmt(buses.noSabia)}` : null,
      buses.siSabia !== null ? `yes ${fmt(buses.siSabia)}` : null,
    ].filter(Boolean)
    const filasOpinion = [
      `All respondents ${fmt(buses.venBien)}`,
      ...(buses.sabian ? [`Those who knew ${fmt(buses.sabian.media)}`] : []),
      ...(buses.noSabian ? [`Those who did not know ${fmt(buses.noSabian.media)}`] : []),
    ]
    const grupos = [
      ...(contacto.noConoce ? [`Knows no one from China: ${fmt(contacto.noConoce.media)}`] : []),
      ...(contacto.conoce ? [`Knows someone from China: ${fmt(contacto.conoce.media)}`] : []),
    ]
    const cierreConoce = v.contactoQuieto
      ? `The difference from ${v.primeraOla} cannot be distinguished from random variation.`
      : `The difference from ${v.primeraOla} does hold up.`
    const [, segunda, tercera] = v.conoce
    return {
      salida: 'Back to stories',
      rotuloCosas: 'Chinese mall and restaurant nearby',
      ejeCosas: `% of people surveyed · n = ${rangoDeEnes([...v.mall, ...v.restaurante].map((x) => x.n), (a, b) => `${a} to ${b}`)}`,
      rotuloPersonas: 'Knows someone from China',
      ejePersonas: `% of people surveyed · n = ${rangoDeEnes(v.conoce.map((x) => x.n), (a, b) => `${a} to ${b}`)}`,
      rotuloLugar: 'Where the contact happens',
      descripcionMarca: `Knew that Santiago’s electric buses are from Chinese brands, in ${v.buses.ola}: ${porcentaje(v.buses.siSabia ?? 0, 1)} knew; ${porcentaje(v.buses.noSabia ?? 0, 1)} did not.`,
      ejeMarca: `The whole bar is 100 % · n = ${numero(v.buses.baseMarca)}, ${v.buses.ola} only`,
      ejeOpinion: `% of each row · n = ${numero(v.buses.baseOpinion)} in total; ${numero(v.buses.sabian?.n ?? 0)} and ${numero(v.buses.noSabian?.n ?? 0)} by group`,
      rotuloVistoSerie: 'Says they have seen racism',
      ejeVistoSerie: `% of people surveyed · n = ${rangoDeEnes(v.racismo.map((x) => x.n), (a, b) => `${a} to ${b}`)}`,
      rotuloVistoGrupos: 'Racism seen, by whether they know someone',
      descripcionContacto: `Say they have seen racism in ${v.contacto.ola}, by whether they know someone from China: those who do not, ${decimal(v.contacto.noConoce?.media ?? 0, 1)} %; those who do, ${decimal(v.contacto.conoce?.media ?? 0, 1)} %.`,
      ejeVistoGrupos: `% of each group · n = ${numero(v.contacto.noConoce?.n ?? 0)} and ${numero(v.contacto.conoce?.n ?? 0)}, ${v.contacto.ola} only`,
      titularCosas: v.mallCrece && v.restauranteParejo
        ? `Between ${v.primeraOla} and ${v.ultimaOla}, the share living near a Chinese-run variety store (mall chino) grew; for Chinese restaurants, there is no clear difference`
        : 'How close China is to the neighborhood',
      frasesCosas: [
        <>In {v.primeraOla}, <strong>{fmt(v.mall[0].valor)}</strong> said they lived less than ten blocks from a Chinese-run variety store (mall chino).</>,
        <>In {v.ultimaOla}, <strong>{fmt(ultimo(v.mall).valor)}</strong>: {decimal(v.mallDiferencia)} percentage points more.</>,
        <>
          Chinese restaurants, by contrast, <strong>{v.restauranteParejo ? 'show no clear difference' : 'also change'}</strong>:{' '}
          {fmt(v.restaurante[0].valor)} in {v.primeraOla} and {fmt(ultimo(v.restaurante).valor)} in {v.ultimaOla},
          {v.restauranteParejo ? ' practically where they started.' : ` a difference of ${decimal(v.restauranteDiferencia)} percentage points.`}
        </>,
      ],
      descripcionCosas: `Lives less than ten blocks from a Chinese-run variety store (mall chino) and from a Chinese restaurant, by wave. ${[...v.mall.map((p) => `Chinese-run store ${p.ola}: ${fmt(p.valor)}`), ...v.restaurante.map((p) => `Chinese restaurant ${p.ola}: ${fmt(p.valor)}`)].join('. ')}.`,
      barraMall: 'Chinese-run store',
      barraRestaurante: 'Chinese restaurant',
      notaCosas: (
        <>
          Based on {lista(v.mall.map((p) => numero(p.n)))} respondents. This is what each person
          reports having nearby, not data from their address.
        </>
      ),
      respiroPersonas: { titulo: 'And with people?', cuerpo: <>And with <strong>people</strong>?</> },
      titularPersonas: v.contactoQuieto
        ? 'Contact with people from China shows no clear change'
        : 'How many people personally know someone from China',
      frasesPersonas: [
        <>In {v.primeraOla}, <strong>{fmt(v.conoce[0].valor)}</strong> said they personally knew someone from China or of Chinese descent.</>,
        v.conoceIgualAlFinal
          ? <>In {segunda.ola} and in {v.ultimaOla}, <strong>{fmt(segunda.valor)}</strong>. {cierreConoce}</>
          : <>In {segunda.ola}, <strong>{fmt(segunda.valor)}</strong>, and in {v.ultimaOla}, <strong>{fmt(tercera.valor)}</strong>. {cierreConoce}</>,
      ],
      descripcionPersonas: `Personally knows someone from China or of Chinese descent, by wave. ${v.conoce.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`,
      notaPersonas: <>{lista(v.conoce.map((p) => `${casosDe(p.valor, p.n)} of ${numero(p.n)}`))} respondents.</>,
      respiroLugar: { titulo: 'And where does that contact happen?', cuerpo: <>And <strong>where</strong> does that contact happen?</> },
      titularLugar: lugar && lugar.mallQuieto && lugar.unCuarto
        ? 'About a quarter mention the Chinese-run variety store (mall chino) when asked where they have contact with Chinese people, in all three waves'
        : 'Where contact with Chinese people happens',
      frasesLugar: lugar
        ? [
            <>In {v.primeraOla}, <strong>{fmt(lugar.mall[0].valor)}</strong> mentioned the Chinese-run store; shopping and restaurants also came up.</>,
            <>
              In {lugar.mall.at(-2)!.ola}, <strong>{fmt(lugar.mall.at(-2)!.valor)}</strong>; in {v.ultimaOla}, <strong>{fmt(ultimo(lugar.mall).valor)}</strong>.
              {lugar.mallQuieto ? ' Three waves in the same range.' : ' This time the figure changes.'}
            </>,
          ]
        : [],
      descripcionLugar: `Where they have contact with people from China, as a share of those who answered, by wave. ${(lugar?.filas ?? []).map((f) => `${f.etiqueta}: ${f.valores.map((x) => (x === null ? 'no data' : fmt(x))).join(', ')}`).join('. ')}.`,
      tituloPunto: (palabra, ola, valor) => `“${palabra}” · ${ola}: ${valor}`,
      unidadLugar: `% who mention it · n = ${rangoDeEnes(v.lugar?.bases ?? [], (a, b) => `${a} to ${b}`)}. They add to more than 100: more than one place can be named.`,
      anchoPalabra: { telefono: '10.5rem', escritorio: '12.5rem' },
      notaLugar: lugar && (
        <>
          Open-ended question; more than one place can be named. Excludes “chino” (Chinese), which repeats the question. Based on{' '}
          {lista(lugar.bases.map((b) => numero(b)))} people.
          {lugar.buena && <> Since {lugar.buena[0].ola}, the survey asks how that contact went: “good” (buena) was written by {lista(lugar.buena.map((p) => `${fmt(p.valor)} in ${p.ola}`))}.</>}
        </>
      ),
      respiroCalle: { titulo: 'And on the street?', cuerpo: <>And on the <strong>street</strong>?</> },
      titularBuses: buses.noSabia !== null && buses.noSabia > 50
        ? 'More than half did not know that Santiago’s electric buses are from Chinese brands'
        : 'Who knew that Santiago’s electric buses are from Chinese brands',
      frasesBuses: [
        <>In {buses.ola}, <strong>{fmt(buses.noSabia ?? 0)}</strong> did not know that Santiago’s electric buses are from Chinese brands.</>,
        <>And <strong>{fmt(buses.venBien)}</strong> see it as positive that {porcentaje(30, 0)} of the fleet is electric.</>,
        buses.separa
          ? <>Those who knew the brand view it even more positively: <strong>{fmt(buses.sabian?.media ?? 0)}</strong> versus <strong>{fmt(buses.noSabian?.media ?? 0)}</strong>.</>
          : <>Between those who knew the brand and those who did not, there is <strong>no clear difference</strong>: {fmt(buses.sabian?.media ?? 0)} versus {fmt(buses.noSabian?.media ?? 0)}.</>,
      ],
      preguntaMarca: 'Knew the buses are Chinese',
      noLoSabia: 'Did not know',
      loSabia: 'Knew',
      preguntaOpinion: 'Positive view of the fleet, by awareness',
      todas: 'All respondents',
      quienesSabian: 'Those who knew',
      quienesNoSabian: 'Those who did not know',
      descripcionBuses: `In ${buses.ola}. Knew that the buses are from Chinese brands: ${partes.join(', ')}. Sees the electrification as positive: ${filasOpinion.join(', ')}.`,
      notaMarca: <>{numero(buses.baseMarca)} respondents in {buses.ola}, the only wave with these questions.</>,
      notaOpinion: (
        <>
          “Sees it as positive” means very positive or positive, based on {numero(buses.baseOpinion)} people: {numero(buses.sabian?.n ?? 0)} knew
          and {numero(buses.noSabian?.n ?? 0)} did not. This is an association: it does not show that knowing the brand changes the opinion.
        </>
      ),
      respiroVisto: { titulo: 'And what do people see?', cuerpo: <>And what do people <strong>see</strong>?</> },
      titularVisto: v.racismoBaja
        ? `Between ${v.primeraOla} and ${v.ultimaOla}, the share who say they have seen racism against Chinese or Asian people fell`
        : 'Who says they have seen racism against Chinese or Asian people',
      frasesVisto: [
        <>
          In {v.primeraOla}, <strong>{fmt(v.racismo[0].valor)}</strong> of respondents reported it;
          in {v.racismo[1].ola}, <strong>{fmt(v.racismo[1].valor)}</strong>.
          {v.racismoParejoEntreAnios ? ' From one year to the next, the drop cannot be distinguished from random variation.' : ' Each year, the drop holds up.'}
        </>,
        <>
          In {v.ultimaOla}, <strong>{fmt(v.racismo[2].valor)}</strong>: {decimal(v.racismoDiferencia)} percentage points
          lower than in {v.primeraOla}. {v.racismoBaja ? 'Taken together, the drop does hold up.' : 'Even taken together, it does not hold up.'}
        </>,
        contacto.separado
          ? <>Those who personally know someone from China <strong>report it more</strong>: {fmt(contacto.conoce?.media ?? 0)} versus {fmt(contacto.noConoce?.media ?? 0)} in {contacto.ola}.</>
          : <>Between those who do and do not know someone from China, there is <strong>no clear difference</strong>: {fmt(contacto.conoce?.media ?? 0)} versus {fmt(contacto.noConoce?.media ?? 0)} in {contacto.ola}.</>,
      ],
      grupoConoce: 'Knows someone from China',
      grupoNoConoce: 'Knows no one from China',
      descripcionVisto: `Says they have seen racism against Chinese or Asian people. By wave: ${v.racismo.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}. In ${contacto.ola}, by whether they know someone from China: ${grupos.join('. ')}.`,
      notaSerieVisto: (
        <>
          {lista(v.racismo.map((p) => `${casosDe(p.valor, p.n)} of ${numero(p.n)} in ${p.ola}`))}: it is the share that falls, not the number of people. {v.advertenciaRacismo} And
          fewer people reporting it does not tell whether there is less racism or whether the issue is less noticed.
        </>
      ),
      notaContacto: (
        <>
          {casosDe(contacto.noConoce?.media ?? 0, contacto.noConoce?.n ?? 0)} of {numero(contacto.noConoce?.n ?? 0)} and{' '}
          {casosDe(contacto.conoce?.media ?? 0, contacto.conoce?.n ?? 0)} of {numero(contacto.conoce?.n ?? 0)} respondents
          in {contacto.ola}. This is an association in the survey: it does not say whether contact changes what people see
          or what they recognize as racist, nor does it rule out other differences between the two groups.
        </>
      ),
    }
  },
  cn: (v) => {
    const { buses, contacto, lugar } = v
    const partes = [
      buses.noSabia !== null ? `不知道${fmt(buses.noSabia)}` : null,
      buses.siSabia !== null ? `知道${fmt(buses.siSabia)}` : null,
    ].filter(Boolean)
    const filasOpinion = [
      `全体受访者${fmt(buses.venBien)}`,
      ...(buses.sabian ? [`知道的受访者${fmt(buses.sabian.media)}`] : []),
      ...(buses.noSabian ? [`不知道的受访者${fmt(buses.noSabian.media)}`] : []),
    ]
    const grupos = [
      ...(contacto.noConoce ? [`不认识来自中国的人：${fmt(contacto.noConoce.media)}`] : []),
      ...(contacto.conoce ? [`认识来自中国的人：${fmt(contacto.conoce.media)}`] : []),
    ]
    const cierreConoce = v.contactoQuieto
      ? `与${v.primeraOla}年相比，差异与随机波动无法区分。`
      : `与${v.primeraOla}年相比，差异经检验仍成立。`
    const [, segunda, tercera] = v.conoce
    return {
      salida: '返回数据故事',
      rotuloCosas: '住处附近有中国商场与餐厅',
      ejeCosas: `受访者占比（%）· n = ${rangoDeEnes([...v.mall, ...v.restaurante].map((x) => x.n), (a, b) => `${a}至${b}`)}`,
      rotuloPersonas: '认识来自中国的人',
      ejePersonas: `受访者占比（%）· n = ${rangoDeEnes(v.conoce.map((x) => x.n), (a, b) => `${a}至${b}`)}`,
      rotuloLugar: '接触发生的场所',
      descripcionMarca: `${v.buses.ola}年，是否知道圣地亚哥的电动公交车为中国品牌：知道者${porcentaje(v.buses.siSabia ?? 0, 1)}，不知道者${porcentaje(v.buses.noSabia ?? 0, 1)}。`,
      ejeMarca: `整条条形为100 % · n = ${numero(v.buses.baseMarca)}，仅${v.buses.ola}年`,
      ejeOpinion: `各行的占比（%）· n = ${numero(v.buses.baseOpinion)}（合计）；分组为${numero(v.buses.sabian?.n ?? 0)}与${numero(v.buses.noSabian?.n ?? 0)}`,
      rotuloVistoSerie: '表示见过种族歧视',
      ejeVistoSerie: `受访者占比（%）· n = ${rangoDeEnes(v.racismo.map((x) => x.n), (a, b) => `${a}至${b}`)}`,
      rotuloVistoGrupos: '见过歧视，按是否认识中国人',
      descripcionContacto: `${v.contacto.ola}年表示见过种族歧视，按是否认识来自中国的人：不认识者${decimal(v.contacto.noConoce?.media ?? 0, 1)} %；认识者${decimal(v.contacto.conoce?.media ?? 0, 1)} %。`,
      ejeVistoGrupos: `各组的占比（%）· n = ${numero(v.contacto.noConoce?.n ?? 0)}与${numero(v.contacto.conoce?.n ?? 0)}，仅${v.contacto.ola}年`,
      titularCosas: v.mallCrece && v.restauranteParejo
        ? `${v.primeraOla}年至${v.ultimaOla}年间，住在华人经营的百货店（mall chino）附近的比例上升；中餐馆一项则难分高下`
        : '中国离街坊有多近',
      frasesCosas: [
        <>{v.primeraOla}年，<strong>{fmt(v.mall[0].valor)}</strong>的受访者表示住处距华人经营的百货店（mall chino）不到十个街区。</>,
        <>{v.ultimaOla}年为<strong>{fmt(ultimo(v.mall).valor)}</strong>，高出{decimal(v.mallDiferencia)}个百分点。</>,
        <>
          相比之下，中餐馆一项<strong>{v.restauranteParejo ? '难分高下' : '也有变化'}</strong>：
          {v.primeraOla}年为{fmt(v.restaurante[0].valor)}，{v.ultimaOla}年为{fmt(ultimo(v.restaurante).valor)}，
          {v.restauranteParejo ? '基本停留在原处。' : `相差${decimal(v.restauranteDiferencia)}个百分点。`}
        </>,
      ],
      descripcionCosas: `住处距华人经营的百货店（mall chino）和中餐馆不到十个街区的比例，按轮次。${[...v.mall.map((p) => `华人百货店${p.ola}年：${fmt(p.valor)}`), ...v.restaurante.map((p) => `中餐馆${p.ola}年：${fmt(p.valor)}`)].join('。')}。`,
      barraMall: '华人百货店',
      barraRestaurante: '中餐馆',
      notaCosas: <>基数分别为{lista(v.mall.map((p) => numero(p.n)))}名受访者。这是受访者自述附近有什么，而非根据其住址得出的数据。</>,
      respiroPersonas: { titulo: '那么与人的接触呢？', cuerpo: <>那么与<strong>人</strong>的接触呢？</> },
      titularPersonas: v.contactoQuieto
        ? '与来自中国的人的接触比例未见超出随机波动的变化'
        : '有多少人本人认识来自中国的人',
      frasesPersonas: [
        <>{v.primeraOla}年，<strong>{fmt(v.conoce[0].valor)}</strong>的受访者表示亲自认识来自中国的人或华裔人士。</>,
        v.conoceIgualAlFinal
          ? <>{segunda.ola}年和{v.ultimaOla}年均为<strong>{fmt(segunda.valor)}</strong>。{cierreConoce}</>
          : <>{segunda.ola}年为<strong>{fmt(segunda.valor)}</strong>，{v.ultimaOla}年为<strong>{fmt(tercera.valor)}</strong>。{cierreConoce}</>,
      ],
      descripcionPersonas: `亲自认识来自中国的人或华裔人士的比例，按轮次。${v.conoce.map((p) => `${p.ola}年：${fmt(p.valor)}`).join('。')}。`,
      notaPersonas: <>受访者中分别有：{lista(v.conoce.map((p) => `${numero(p.n)}人中的${casosDe(p.valor, p.n)}人`))}。</>,
      respiroLugar: { titulo: '那么，这种接触发生在哪里？', cuerpo: <>那么，这种接触发生在<strong>哪里</strong>？</> },
      titularLugar: lugar && lugar.mallQuieto && lugar.unCuarto
        ? '三轮调查中，约四分之一的受访者在被问及在哪里与中国人接触时，都提到华人经营的百货店（mall chino）'
        : '与中国人的接触发生在哪里',
      frasesLugar: lugar
        ? [
            <>{v.primeraOla}年，<strong>{fmt(lugar.mall[0].valor)}</strong>的受访者提到华人百货店；购物和餐馆也有人提及。</>,
            <>
              {lugar.mall.at(-2)!.ola}年为<strong>{fmt(lugar.mall.at(-2)!.valor)}</strong>，{v.ultimaOla}年为<strong>{fmt(ultimo(lugar.mall).valor)}</strong>。
              {lugar.mallQuieto ? '三轮调查都在同一区间。' : '这一次数字有变化。'}
            </>,
          ]
        : [],
      descripcionLugar: `与来自中国的人在何处接触，占作答者的百分比，按轮次。${(lugar?.filas ?? []).map((f) => `${f.etiqueta}：${f.valores.map((x) => (x === null ? '无数据' : fmt(x))).join('、')}`).join('。')}。`,
      tituloPunto: (palabra, ola, valor) => `“${palabra}” · ${ola}年：${valor}`,
      unidadLugar: `提及比例（%）· n = ${rangoDeEnes(v.lugar?.bases ?? [], (a, b) => `${a}至${b}`)}。总和超过100：可提及多个场所。`,
      anchoPalabra: { telefono: '8.5rem', escritorio: '10.5rem' },
      notaLugar: lugar && (
        <>
          开放式问题，可提及多个地点。已剔除重复题目用语的“chino”（中国的）。基数分别为{lista(lugar.bases.map((b) => numero(b)))}人。
          {lugar.buena && <>自{lugar.buena[0].ola}年起，问卷询问这种接触的感受：写下“好”（buena）的比例：{lugar.buena.map((p) => `${p.ola}年为${fmt(p.valor)}`).join('，')}。</>}
        </>
      ),
      respiroCalle: { titulo: '那么在街头呢？', cuerpo: <>那么在<strong>街头</strong>呢？</> },
      titularBuses: buses.noSabia !== null && buses.noSabia > 50
        ? '过半受访者不知道圣地亚哥的电动公交车是中国品牌'
        : '谁知道圣地亚哥的电动公交车是中国品牌',
      frasesBuses: [
        <>{buses.ola}年，<strong>{fmt(buses.noSabia ?? 0)}</strong>的受访者不知道圣地亚哥的电动公交车是中国品牌。</>,
        <>而<strong>{fmt(buses.venBien)}</strong>的受访者正面看待车队中{porcentaje(30, 0)}为电动车。</>,
        buses.separa
          ? <>知道这些公交车是中国品牌的受访者评价更为正面：<strong>{fmt(buses.sabian?.media ?? 0)}</strong>对<strong>{fmt(buses.noSabian?.media ?? 0)}</strong>。</>
          : <>知道与不知道这些公交车是中国品牌的受访者之间<strong>难分高下</strong>：{fmt(buses.sabian?.media ?? 0)}对{fmt(buses.noSabian?.media ?? 0)}。</>,
      ],
      preguntaMarca: '知道公交车是中国品牌',
      noLoSabia: '不知道',
      loSabia: '知道',
      preguntaOpinion: '对车队的正面看法，按是否知情',
      todas: '全体受访者',
      quienesSabian: '知道的受访者',
      quienesNoSabian: '不知道的受访者',
      descripcionBuses: `${buses.ola}年。是否知道公交车是中国品牌：${partes.join('，')}。正面看待电动化：${filasOpinion.join('，')}。`,
      notaMarca: <>{buses.ola}年共{numero(buses.baseMarca)}名受访者，这是唯一包含这些问题的一轮调查。</>,
      notaOpinion: (
        <>
          “正面看待”指非常正面或正面，基数为{numero(buses.baseOpinion)}人：其中{numero(buses.sabian?.n ?? 0)}人知道，{numero(buses.noSabian?.n ?? 0)}人不知道。这只是一种关联：并不说明知道品牌会改变看法。
        </>
      ),
      respiroVisto: { titulo: '那么，人们看到了什么？', cuerpo: <>那么，人们<strong>看到</strong>了什么？</> },
      titularVisto: v.racismoBaja
        ? `${v.primeraOla}年至${v.ultimaOla}年间，表示曾看到针对华人或亚裔的种族歧视的比例下降`
        : '谁表示曾看到针对华人或亚裔的种族歧视',
      frasesVisto: [
        <>
          {v.primeraOla}年，<strong>{fmt(v.racismo[0].valor)}</strong>的受访者表示看到过；{v.racismo[1].ola}年为<strong>{fmt(v.racismo[1].valor)}</strong>。
          {v.racismoParejoEntreAnios ? '相邻两年之间的降幅与随机波动无法区分。' : '每一年的降幅都经检验仍成立。'}
        </>,
        <>
          {v.ultimaOla}年为<strong>{fmt(v.racismo[2].valor)}</strong>，比{v.primeraOla}年低{decimal(v.racismoDiferencia)}个百分点。
          {v.racismoBaja ? '累计来看，降幅经检验仍成立。' : '累计来看，降幅仍与随机波动无法区分。'}
        </>,
        contacto.separado
          ? <>亲自认识来自中国的人的受访者<strong>报告得更多</strong>：{contacto.ola}年为{fmt(contacto.conoce?.media ?? 0)}对{fmt(contacto.noConoce?.media ?? 0)}。</>
          : <>认识与不认识来自中国的人的受访者之间<strong>难分高下</strong>：{contacto.ola}年为{fmt(contacto.conoce?.media ?? 0)}对{fmt(contacto.noConoce?.media ?? 0)}。</>,
      ],
      grupoConoce: '认识来自中国的人',
      grupoNoConoce: '不认识来自中国的人',
      descripcionVisto: `表示曾看到针对华人或亚裔的种族歧视。按轮次：${v.racismo.map((p) => `${p.ola}年：${fmt(p.valor)}`).join('。')}。${contacto.ola}年，按是否认识来自中国的人：${grupos.join('。')}。`,
      notaSerieVisto: (
        <>
          {lista(v.racismo.map((p) => `${p.ola}年${numero(p.n)}人中有${casosDe(p.valor, p.n)}人`))}：下降的是比例，而非人数。{v.advertenciaRacismo}报告的人变少，也不能说明种族歧视减少了，还是这一问题不那么受关注了。
        </>
      ),
      notaContacto: (
        <>
          {contacto.ola}年，{numero(contacto.noConoce?.n ?? 0)}名受访者中有{casosDe(contacto.noConoce?.media ?? 0, contacto.noConoce?.n ?? 0)}人，{numero(contacto.conoce?.n ?? 0)}名受访者中有{casosDe(contacto.conoce?.media ?? 0, contacto.conoce?.n ?? 0)}人。这是调查中的一种关联：它不能说明接触是否改变了人们看到的内容或对种族歧视的认定，也不能排除两组之间的其他差异。
        </>
      ),
    }
  },
}
