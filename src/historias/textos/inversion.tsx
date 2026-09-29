import type { ReactNode } from 'react'
import { lista, numero, porcentaje, type Idioma } from '../../locale'
import { cardinal, casosDe, rangoDeEnes } from '../lectura'
import type { FichaHistoria } from './tipos'

/**
 * Los textos de «Inversión y Estado», en los tres idiomas. La forma de estos módulos está en
 * `tipos.ts`, y el ejemplo que siguen, en `textos/vacuna.tsx`.
 *
 * **Los sectores de `p20`.** En español el nombre sale de la opción del cliente («del cobre» →
 * «Cobre») y a mitad de frase va en minúscula. En inglés y en chino cada idioma escribe su forma de
 * fila y su forma dentro de la frase (`SECTORES`): el chino no tiene minúsculas, y en inglés
 * «5G» no se puede pasar a minúscula.
 */

interface Punto { ola: number, valor: number, n: number }
interface Mencion { columna: string, porcentaje: number }

/** Lo que calcula `inversion.tsx`: cifras, y las banderas que eligen cada frase. */
export interface Valores {
  primeraOla: number
  ultimaOla: number
  /** Quiere que el Estado pueda limitar inversiones en sectores estratégicos (`limitar-inversiones`). */
  limitar: Punto[]
  /** `limitar-inversiones` no se distingue del ruido en ningún tramo. */
  quieto: boolean
  /** Las tres oleadas entre 70 y 80 %. */
  tresDeCuatro: boolean
  /** La advertencia del contraste, ya en el idioma activo. */
  advertencia: string
  /** Los sectores de `p20`, sin «Otro», ordenados de mayor a menor en cada oleada en que se preguntó. */
  sectores: Array<{ ola: number, base: number, menciones: Mencion[] }>
  /** La opción del cliente por columna, en español («del cobre»): de ahí sale el nombre en español. */
  opcionEs: Record<string, string>
  /** Los tres primeros en la primera oleada, con el mismo orden en la última y el contraste del tercero. */
  podioFirme: boolean
  /** Los sectores quedan en el mismo orden en las dos oleadas. */
  mismoOrden: boolean
}

export interface Contenido {
  salida: string
  titularLimitar: string
  frasesLimitar: ReactNode[]
  descripcionLimitar: string
  /** El nombre del gráfico, dentro de la figura (`RotuloFigura`): la medida y su base. */
  rotuloLimitar: string
  /** La unidad de la escala y el N, al pie de la figura. Se calcula; no se transcribe. */
  ejeLimitar: string
  notaLimitar: ReactNode
  respiro: { titulo: string, cuerpo: ReactNode }
  titularSectores: string
  frasesSectores: ReactNode[]
  descripcionSectores: string
  rotuloSectores: string
  notaSectores: ReactNode
  /** El nombre de un sector como fila de la figura. */
  sector: (columna: string) => string
  /** El rótulo del eje de los sectores: la unidad, la base y el N.
   *  **La base no es la oleada entera**: solo contesta `p20` quien quiere poder limitar. */
  unidadEje: string
  /** El título emergente de un punto de la figura de sectores. */
  tituloPunto: (sector: string, ola: string, valor: number) => string
}

export const FICHA: Record<Idioma, FichaHistoria> = {
  es: {
    nombre: 'Inversión y Estado',
    pregunta: '¿Dónde poner límites a la inversión?',
    hallazgo: 'Una mayoría amplia y quieta quiere que el Estado pueda frenar inversiones, y sabe dónde: minería y electricidad.',
  },
  en: {
    nombre: 'Investment and the Chilean state',
    pregunta: 'Where should investment be limited?',
    hallazgo: 'A broad, steady majority wants the Chilean state to be able to stop investments, and knows where: mining and electricity.',
  },
  cn: {
    nombre: '投资与国家',
    pregunta: '应在哪些领域限制投资？',
    hallazgo: '广泛而稳定的多数受访者希望国家能够阻止投资，并且清楚在哪些领域：矿业和电力。',
  },
}

const fmt = (v: number) => porcentaje(v, 1)

/** Nombre de fila y forma dentro de la frase, por columna de `p20`, en inglés y en chino. */
const SECTORES: Record<'en' | 'cn', Record<string, { fila: string, frase: string }>> = {
  en: {
    p20_1: { fila: 'Power distribution', frase: 'power distribution' },
    p20_2: { fila: 'Copper', frase: 'copper' },
    p20_3: { fila: 'Lithium', frase: 'lithium' },
    p20_4: { fila: 'Hotels', frase: 'hotels' },
    p20_5: { fila: '5G and telecom', frase: '5G and telecom' },
    p20_6: { fila: 'Wine industry', frase: 'the wine industry' },
    p20_7: { fila: 'Banking', frase: 'banking' },
  },
  cn: {
    p20_1: { fila: '配电', frase: '配电' },
    p20_2: { fila: '铜业', frase: '铜业' },
    p20_3: { fila: '锂业', frase: '锂业' },
    p20_4: { fila: '酒店业', frase: '酒店业' },
    p20_5: { fila: '5G与电信', frase: '5G与电信' },
    p20_6: { fila: '葡萄酒业', frase: '葡萄酒业' },
    p20_7: { fila: '银行业', frase: '银行业' },
  },
}
const sectorDe = (idioma: 'en' | 'cn', columna: string, forma: 'fila' | 'frase') => SECTORES[idioma][columna]?.[forma] ?? columna

/** Los números chicos con letra, en inglés y en chino, como `cardinal` en español. */
const CARDINAL_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const CARDINAL_CN = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九']

export const TEXTOS: Record<Idioma, (v: Valores) => Contenido> = {
  es: (v) => {
    // Las opciones vienen como «del cobre», «de distribución eléctrica»: la fila lleva el sustantivo.
    // «5G/telecomunicaciones» no cabe en la columna de nombres de un teléfono.
    const sector = (columna: string) => {
      const limpio = (v.opcionEs[columna] ?? columna).replace(/^(del|de la|de)\s+/, '').replace('5G/telecomunicaciones', '5G y telecom.')
      return limpio.charAt(0).toUpperCase() + limpio.slice(1)
    }
    const enFrase = (columna: string) => sector(columna).toLowerCase()
    const [primeraS, ultimaS] = [v.sectores[0], v.sectores[v.sectores.length - 1]]
    const tres = primeraS.menciones.slice(0, 3)
    const titularLimitar = v.quieto && v.tresDeCuatro
      ? 'En todas las oleadas, tres de cada cuatro personas quieren que el Estado pueda frenar una inversión extranjera'
      : 'Cuántos quieren que el Estado pueda frenar una inversión extranjera'
    const titularSectores = v.podioFirme
      ? `Donde más se quiere poder frenarla: ${lista(tres.map((m) => enFrase(m.columna)))}`
      : 'En qué sectores se quiere poder frenarla'
    const penultima = v.limitar.at(-2)!
    const ultima = v.limitar.at(-1)!
    return {
      salida: 'Volver a las historias',
      rotuloLimitar: 'Poder limitar la inversión extranjera',
      ejeLimitar: `% de las personas encuestadas · n = ${rangoDeEnes(v.limitar.map((p) => p.n), (a, b) => `${a} a ${b}`)}`,
      rotuloSectores: 'Sectores donde importa poder limitarla',
      titularLimitar,
      frasesLimitar: [
        <>En {v.primeraOla}, el <strong>{fmt(v.limitar[0].valor)}</strong> prefería que el Estado pudiera bloquear inversiones que le quiten control sobre sectores estratégicos.</>,
        <>
          En {penultima.ola}, el <strong>{fmt(penultima.valor)}</strong>; en {v.ultimaOla}, el <strong>{fmt(ultima.valor)}</strong>.
          {v.quieto ? ' Una mayoría pareja en las tres oleadas.' : ' Esta vez la cifra sí se mueve.'}
        </>,
      ],
      descripcionLimitar: `Prefiere que el Estado pueda limitar inversiones en sectores estratégicos, por oleada. ${v.limitar.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`,
      notaLimitar: (
        <>
          {lista(v.limitar.map((p) => `${casosDe(p.valor, p.n)} de ${numero(p.n)}`))} personas
          encuestadas. La pregunta habla de empresas extranjeras, no de China. {v.advertencia}
        </>
      ),
      respiro: { titulo: '¿Y en qué sectores?', cuerpo: <>¿Y en qué <strong>sectores</strong>?</> },
      titularSectores,
      frasesSectores: [
        <>
          En {primeraS.ola}, de quienes querían poder limitar, el <strong>{fmt(tres[0].porcentaje)}</strong> marcó {enFrase(tres[0].columna)},
          el <strong>{fmt(tres[1].porcentaje)}</strong> {enFrase(tres[1].columna)} y
          el <strong>{fmt(tres[2].porcentaje)}</strong> {enFrase(tres[2].columna)}.
        </>,
        v.mismoOrden
          ? <>En {ultimaS.ola} cambian las cifras, pero no el orden: <strong>los {cardinal(ultimaS.menciones.length)} sectores quedan igual</strong>, de punta a punta.</>
          : <>En {ultimaS.ola}: {enFrase(ultimaS.menciones[0].columna)} {fmt(ultimaS.menciones[0].porcentaje)}, {enFrase(ultimaS.menciones[1].columna)} {fmt(ultimaS.menciones[1].porcentaje)}.</>,
      ],
      descripcionSectores: `Sectores donde es más importante limitar la inversión extranjera, entre quienes quieren poder limitarla. ${v.sectores.map((s) => `${s.ola}: ${s.menciones.map((m) => `${sector(m.columna)} ${fmt(m.porcentaje)}`).join(', ')}`).join('. ')}.`,
      notaSectores: (
        <>
          Solo quienes quieren poder limitar ({lista(v.sectores.map((x) => `${numero(x.base)} en ${x.ola}`))}). Cada
          persona marca varios sectores: suman más de 100. Sin «otro». No se preguntó en {v.ultimaOla}.
        </>
      ),
      sector,
      unidadEje: `% de quienes quieren el límite · n = ${rangoDeEnes(v.sectores.map((x) => x.base), (a, b) => `${a} a ${b}`)}. Suman más de 100: cada persona marca varios.`,
      tituloPunto: (s, ola, valor) => `${s} · ${ola}: ${fmt(valor)}`,
    }
  },
  en: (v) => {
    const sector = (columna: string) => sectorDe('en', columna, 'fila')
    const enFrase = (columna: string) => sectorDe('en', columna, 'frase')
    const [primeraS, ultimaS] = [v.sectores[0], v.sectores[v.sectores.length - 1]]
    const tres = primeraS.menciones.slice(0, 3)
    const cuantos = ultimaS.menciones.length
    const titularLimitar = v.quieto && v.tresDeCuatro
      ? 'In every wave, three in four respondents want the Chilean state to be able to stop a foreign investment'
      : 'How many want the Chilean state to be able to stop a foreign investment'
    const titularSectores = v.podioFirme
      ? `Where respondents most want that power: ${lista(tres.map((m) => enFrase(m.columna)))}`
      : 'In which sectors respondents want that power'
    const penultima = v.limitar.at(-2)!
    const ultima = v.limitar.at(-1)!
    return {
      salida: 'Back to stories',
      rotuloLimitar: 'Power to limit foreign investment',
      ejeLimitar: `% of people surveyed · n = ${rangoDeEnes(v.limitar.map((p) => p.n), (a, b) => `${a} to ${b}`)}`,
      rotuloSectores: 'Sectors where the power matters most',
      titularLimitar,
      frasesLimitar: [
        <>In {v.primeraOla}, <strong>{fmt(v.limitar[0].valor)}</strong> preferred that the state be able to block investments that would cost it control over strategic sectors.</>,
        <>
          In {penultima.ola}, <strong>{fmt(penultima.valor)}</strong>; in {v.ultimaOla}, <strong>{fmt(ultima.valor)}</strong>.
          {v.quieto ? ' A similarly sized majority, three waves in a row.' : ' This time the figure does move.'}
        </>,
      ],
      descripcionLimitar: `Prefer that the state be able to limit investment in strategic sectors, by wave. ${v.limitar.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')}.`,
      notaLimitar: (
        <>
          {lista(v.limitar.map((p) => `${casosDe(p.valor, p.n)} of ${numero(p.n)}`))} respondents.
          The question is about foreign companies, not China. {v.advertencia}
        </>
      ),
      respiro: { titulo: 'And in which sectors?', cuerpo: <>And in which <strong>sectors</strong>?</> },
      titularSectores,
      frasesSectores: [
        <>
          In {primeraS.ola}, among those who wanted that power, <strong>{fmt(tres[0].porcentaje)}</strong> chose {enFrase(tres[0].columna)},{' '}
          <strong>{fmt(tres[1].porcentaje)}</strong> {enFrase(tres[1].columna)}, and{' '}
          <strong>{fmt(tres[2].porcentaje)}</strong> {enFrase(tres[2].columna)}.
        </>,
        v.mismoOrden
          ? <>In {ultimaS.ola} the figures change, but not the order: <strong>all {CARDINAL_EN[cuantos] ?? numero(cuantos)} sectors keep their places</strong>, from top to bottom.</>
          : <>In {ultimaS.ola}: {enFrase(ultimaS.menciones[0].columna)} {fmt(ultimaS.menciones[0].porcentaje)}, {enFrase(ultimaS.menciones[1].columna)} {fmt(ultimaS.menciones[1].porcentaje)}.</>,
      ],
      descripcionSectores: `Sectors where limiting foreign investment matters most, among those who want that power. ${v.sectores.map((s) => `${s.ola}: ${s.menciones.map((m) => `${sector(m.columna)} ${fmt(m.porcentaje)}`).join(', ')}`).join('. ')}.`,
      notaSectores: (
        <>
          Only those who want that power ({lista(v.sectores.map((x) => `${numero(x.base)} in ${x.ola}`))}). Each
          person can choose several sectors, so the percentages add up to more than 100. “Other” is left out. Not asked in {v.ultimaOla}.
        </>
      ),
      sector,
      unidadEje: `% of those who want the power · n = ${rangoDeEnes(v.sectores.map((x) => x.base), (a, b) => `${a} to ${b}`)}. They add to more than 100: each person marks several.`,
      tituloPunto: (s, ola, valor) => `${s} · ${ola}: ${fmt(valor)}`,
    }
  },
  cn: (v) => {
    const sector = (columna: string) => sectorDe('cn', columna, 'fila')
    const enFrase = (columna: string) => sectorDe('cn', columna, 'frase')
    const [primeraS, ultimaS] = [v.sectores[0], v.sectores[v.sectores.length - 1]]
    const tres = primeraS.menciones.slice(0, 3)
    const cuantos = ultimaS.menciones.length
    const titularLimitar = v.quieto && v.tresDeCuatro
      ? '每一轮调查中，都有四分之三的受访者希望国家能够阻止某项外国投资'
      : '多少受访者希望国家能够阻止某项外国投资'
    const titularSectores = v.podioFirme
      ? `受访者最希望能够阻止外国投资的行业：${lista(tres.map((m) => enFrase(m.columna)))}`
      : '受访者希望在哪些行业能够阻止外国投资'
    const penultima = v.limitar.at(-2)!
    const ultima = v.limitar.at(-1)!
    return {
      salida: '返回数据故事',
      rotuloLimitar: '希望能够限制外国投资',
      ejeLimitar: `受访者占比（%）· n = ${rangoDeEnes(v.limitar.map((p) => p.n), (a, b) => `${a}至${b}`)}`,
      rotuloSectores: '最需要限制的行业',
      titularLimitar,
      frasesLimitar: [
        <>{v.primeraOla}年，<strong>{fmt(v.limitar[0].valor)}</strong>的受访者希望国家能够阻止那些会使其失去对战略性行业控制权的投资。</>,
        <>
          {penultima.ola}年为<strong>{fmt(penultima.valor)}</strong>，{v.ultimaOla}年为<strong>{fmt(ultima.valor)}</strong>。
          {v.quieto ? '连续三年，同样是多数。' : '这一次，数字确实有变化。'}
        </>,
      ],
      descripcionLimitar: `希望国家能够限制战略性行业投资的受访者比例，按轮次：${v.limitar.map((p) => `${p.ola}年：${fmt(p.valor)}`).join('；')}。`,
      notaLimitar: (
        <>
          各轮分别为{lista(v.limitar.map((p) => `${numero(p.n)}名受访者中的${casosDe(p.valor, p.n)}人`))}。该题问的是外国企业，而非中国。{v.advertencia}
        </>
      ),
      respiro: { titulo: '那么，是哪些行业？', cuerpo: <>那么，是哪些<strong>行业</strong>？</> },
      titularSectores,
      frasesSectores: [
        <>
          {primeraS.ola}年，在希望能够限制投资的受访者中，<strong>{fmt(tres[0].porcentaje)}</strong>选择了{enFrase(tres[0].columna)}，
          <strong>{fmt(tres[1].porcentaje)}</strong>选择了{enFrase(tres[1].columna)}，
          <strong>{fmt(tres[2].porcentaje)}</strong>选择了{enFrase(tres[2].columna)}。
        </>,
        v.mismoOrden
          ? <>{ultimaS.ola}年，数字有变化，但排序不变：<strong>{CARDINAL_CN[cuantos] ?? numero(cuantos)}个行业的位次从头到尾完全相同</strong>。</>
          : <>{ultimaS.ola}年：{enFrase(ultimaS.menciones[0].columna)}{fmt(ultimaS.menciones[0].porcentaje)}，{enFrase(ultimaS.menciones[1].columna)}{fmt(ultimaS.menciones[1].porcentaje)}。</>,
      ],
      descripcionSectores: `在希望能够限制外国投资的受访者中，认为最需要限制外国投资的行业。${v.sectores.map((s) => `${s.ola}年：${s.menciones.map((m) => `${sector(m.columna)}${fmt(m.porcentaje)}`).join('，')}`).join('；')}。`,
      notaSectores: (
        <>
          仅限希望能够限制投资的受访者（{lista(v.sectores.map((x) => `${x.ola}年${numero(x.base)}人`))}）。每人可选多个行业，因此合计超过100%。不含“其他”。{v.ultimaOla}年未询问此题。
        </>
      ),
      sector,
      unidadEje: `希望设限者中的占比（%）· n = ${rangoDeEnes(v.sectores.map((x) => x.base), (a, b) => `${a}至${b}`)}。总和超过100：每人可多选。`,
      tituloPunto: (s, ola, valor) => `${s} · ${ola}年：${fmt(valor)}`,
    }
  },
}
