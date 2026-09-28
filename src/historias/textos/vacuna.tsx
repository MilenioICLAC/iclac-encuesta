import type { ReactNode } from 'react'
import { decimal, lista, numero, porcentaje, type Idioma } from '../../locale'
import { casosDe } from '../lectura'
import type { FichaHistoria } from './tipos'

/**
 * Los textos de «La vacuna», en los tres idiomas. La forma de estos módulos está en `tipos.ts`; esta
 * historia es el ejemplo canónico que siguen las demás.
 */

interface Punto { ola: number, valor: number, n: number }

/** Lo que calcula `vacuna.tsx`: cifras, y las banderas que eligen cada frase. */
export interface Valores {
  primeraOla: number
  ultimaOla: number
  /** Dice haber recibido al menos una dosis, entre quienes recuerdan (`sinovac-recibio`), por oleada. */
  recibio: Punto[]
  /** Buena o muy buena opinión de Sinovac, entre quienes la recibieron (`sinovac-buena`). */
  buena: Punto[]
  /** Hubiese preferido Pfizer o Moderna, con la misma base (`prefiere-pfizer`). */
  pfizer: Punto[]
  /** La comparación de `sinovac-buena` entre las dos primeras oleadas. */
  primerTramo: { hasta: number, b: number, diferencia: number } | null
  /** «No recuerdo» en la última oleada, la opción nueva que la serie deja fuera. */
  noRecuerda: { porcentaje: number, n: number, base: number } | null
  /** `sinovac-recibio` no se distingue del ruido en ningún tramo. */
  recuerdoQuieto: boolean
  /** Las tres oleadas entre 70 y 80 %. */
  tresDeCuatro: boolean
  /** `sinovac-buena` baja entre la primera y la última oleada, más allá del ruido. */
  buenaCae: boolean
  /** Y toda la caída está en el primer tramo. */
  todoEnElPrimerAnio: boolean
  pfizerQuieto: boolean
  /** Piso y techo de `pfizer`, en puntos enteros. */
  rangoPfizer: [number, number]
}

export interface Contenido {
  /** El rótulo de la salida de la capa. */
  salida: string
  titularRecuerdo: string
  frasesRecuerdo: ReactNode[]
  /** Lo que lee un lector de pantalla en vez de la figura. */
  descripcionRecuerdo: string
  notaRecuerdo: ReactNode
  respiro: { titulo: string, cuerpo: ReactNode }
  titularOpinion: string
  frasesOpinion: ReactNode[]
  descripcionOpinion: string
  /** El rótulo de las barras de cada serie, antes del año. */
  barraBuena: string
  barraPfizer: string
  notaOpinion: ReactNode
}

export const FICHA: Record<Idioma, FichaHistoria> = {
  es: {
    nombre: 'La vacuna',
    pregunta: '¿Qué queda de la vacuna china?',
    hallazgo: 'El recuerdo de haberla recibido queda parejo; la buena opinión de quienes la recibieron cambia.',
  },
  en: {
    nombre: 'The vaccine',
    pregunta: 'What is left of the Chinese vaccine?',
    hallazgo: 'The share who say they received it shows no clear change; positive views among those who received it do change.',
  },
  cn: {
    nombre: '疫苗',
    pregunta: '中国疫苗留下了什么？',
    hallazgo: '表示接种过的比例在各轮间的变化与随机波动无法区分；接种者中的好评则有变化。',
  },
}

const fmt = (v: number) => porcentaje(v, 1)
const porOla = (puntos: Punto[]) => puntos.map((p) => `${p.ola}: ${fmt(p.valor)}`).join('. ')

export const TEXTOS: Record<Idioma, (v: Valores) => Contenido> = {
  es: (v) => {
    const titularRecuerdo = v.recuerdoQuieto && v.tresDeCuatro
      ? `Entre quienes recuerdan, tres de cada cuatro dicen haber recibido Sinovac, igual que en ${v.primeraOla}`
      : 'Cuántos dicen haber recibido Sinovac'
    const titularOpinion = v.todoEnElPrimerAnio && v.primerTramo
      ? `Entre quienes la recibieron, la buena opinión de Sinovac cae en ${v.primerTramo.hasta} y ahí se queda`
      : v.buenaCae
        ? 'Entre quienes la recibieron, la buena opinión de Sinovac cae'
        : 'Qué opinan de Sinovac quienes la recibieron'
    const penultima = v.recibio.at(-2)!
    const ultima = v.recibio.at(-1)!
    return {
      salida: 'Volver a las historias',
      titularRecuerdo,
      frasesRecuerdo: [
        <>En {v.primeraOla}, el <strong>{fmt(v.recibio[0].valor)}</strong> decía haber recibido al menos una dosis de Sinovac.</>,
        <>
          En {penultima.ola}, el <strong>{fmt(penultima.valor)}</strong>; en {v.ultimaOla}, el <strong>{fmt(ultima.valor)}</strong>.
          {v.recuerdoQuieto ? ' En tres oleadas, ningún cambio se distingue del azar.' : ' Esta vez la cifra se mueve.'}
        </>,
      ],
      descripcionRecuerdo: `Dice haber recibido al menos una dosis de Sinovac, entre quienes recuerdan, por oleada: ${porOla(v.recibio)}.`,
      notaRecuerdo: (
        <>
          {lista(v.recibio.map((p) => `${casosDe(p.valor, p.n)} de ${numero(p.n)}`))} personas
          encuestadas.{v.noRecuerda && <> En {v.ultimaOla} se agregó la opción «No recuerdo»: la marcó el {fmt(v.noRecuerda.porcentaje)} ({numero(v.noRecuerda.n)} de {numero(v.noRecuerda.base)}), y esas personas
          quedan fuera de la cifra. Como la opción es nueva, no se puede saber cuánto de eso es olvido.</>}
        </>
      ),
      respiro: { titulo: '¿Y qué opinión dejó?', cuerpo: <>¿Y qué <strong>opinión</strong> dejó?</> },
      titularOpinion,
      frasesOpinion: [
        <>En {v.primeraOla}, el <strong>{fmt(v.buena[0].valor)}</strong> de quienes recibieron Sinovac tenía buena o muy buena opinión de ella.</>,
        <>
          En {v.primerTramo?.hasta}, el <strong>{fmt(v.primerTramo?.b ?? 0)}</strong>:{' '}
          {decimal(Math.abs(v.primerTramo?.diferencia ?? 0))} puntos {(v.primerTramo?.diferencia ?? 0) < 0 ? 'menos' : 'más'} en un año.
        </>,
        <>
          En {v.ultimaOla}, el <strong>{fmt(v.buena.at(-1)!.valor)}</strong>.
          {v.todoEnElPrimerAnio ? ' La caída entera ocurrió en el primer año.' : ''}
        </>,
        <>
          Quienes hubiesen preferido Pfizer o Moderna, en cambio,{' '}
          {v.pfizerQuieto
            ? <>se quedan <strong>entre {v.rangoPfizer[0]} y {v.rangoPfizer[1]} %</strong> las tres oleadas.</>
            : <>se mueven: {v.pfizer.map((p) => fmt(p.valor)).join(', ')}.</>}
        </>,
      ],
      descripcionOpinion: `Entre quienes recibieron Sinovac. Buena o muy buena opinión de la vacuna: ${porOla(v.buena)}. Hubiese preferido Pfizer o Moderna: ${porOla(v.pfizer)}.`,
      barraBuena: 'Buena opinión',
      barraPfizer: 'Prefería Pfizer',
      notaOpinion: (
        <>
          Solo quienes dicen haber recibido Sinovac: {lista(v.buena.map((p) => numero(p.n)))} personas encuestadas. En {v.primeraOla} estas preguntas se
          hacían solo a ellas, así que las otras oleadas se cuentan igual para poder comparar.
        </>
      ),
    }
  },
  en: (v) => {
    const titularRecuerdo = v.recuerdoQuieto && v.tresDeCuatro
      ? `Among those who remember, three in four say they received the Sinovac vaccine, as in ${v.primeraOla}`
      : 'How many say they received the Sinovac vaccine'
    const titularOpinion = v.todoEnElPrimerAnio && v.primerTramo
      ? `Among those who received it, the share with a good opinion of the Sinovac vaccine falls in ${v.primerTramo.hasta} and stays there`
      : v.buenaCae
        ? 'Among those who received it, the share with a good opinion of the Sinovac vaccine falls'
        : 'What those who received it think of the Sinovac vaccine'
    const penultima = v.recibio.at(-2)!
    const ultima = v.recibio.at(-1)!
    const diferencia = v.primerTramo?.diferencia ?? 0
    return {
      salida: 'Back to stories',
      titularRecuerdo,
      frasesRecuerdo: [
        <>In {v.primeraOla}, <strong>{fmt(v.recibio[0].valor)}</strong> said they had received at least one dose of the Sinovac vaccine.</>,
        <>
          In {penultima.ola}, <strong>{fmt(penultima.valor)}</strong>; in {v.ultimaOla}, <strong>{fmt(ultima.valor)}</strong>.
          {v.recuerdoQuieto ? ' Three waves, and no change can be distinguished from random variation.' : ' This time the figure moves.'}
        </>,
      ],
      descripcionRecuerdo: `Say they received at least one dose of the Sinovac vaccine, among those who remember, by wave: ${porOla(v.recibio)}.`,
      notaRecuerdo: (
        <>
          {lista(v.recibio.map((p) => `${casosDe(p.valor, p.n)} of ${numero(p.n)}`))} respondents.
          {v.noRecuerda && <> In {v.ultimaOla} the option “I don’t remember” was added: {fmt(v.noRecuerda.porcentaje)} chose it ({numero(v.noRecuerda.n)} of {numero(v.noRecuerda.base)}), and
          they are left out of the figure. Because the option is new, there is no way to know how much of that is forgetting.</>}
        </>
      ),
      respiro: { titulo: 'And what opinion did it leave?', cuerpo: <>And what <strong>opinion</strong> did it leave?</> },
      titularOpinion,
      frasesOpinion: [
        <>In {v.primeraOla}, <strong>{fmt(v.buena[0].valor)}</strong> of those who received the Sinovac vaccine had a good or very good opinion of it.</>,
        <>
          In {v.primerTramo?.hasta}, <strong>{fmt(v.primerTramo?.b ?? 0)}</strong>:{' '}
          {decimal(Math.abs(diferencia))} percentage points {diferencia < 0 ? 'lower' : 'higher'} in one year.
        </>,
        <>
          In {v.ultimaOla}, <strong>{fmt(v.buena.at(-1)!.valor)}</strong>.
          {v.todoEnElPrimerAnio ? ' The entire drop happened in the first year.' : ''}
        </>,
        <>
          The share who would have preferred the Pfizer or Moderna vaccine, by contrast,{' '}
          {v.pfizerQuieto
            ? <>stays <strong>between {porcentaje(v.rangoPfizer[0], 0)} and {porcentaje(v.rangoPfizer[1], 0)}</strong> in all three waves.</>
            : <>moves: {lista(v.pfizer.map((p) => fmt(p.valor)))}.</>}
        </>,
      ],
      descripcionOpinion: `Among those who received the Sinovac vaccine. Good or very good opinion of the vaccine: ${porOla(v.buena)}. Would have preferred the Pfizer or Moderna vaccine: ${porOla(v.pfizer)}.`,
      barraBuena: 'Good opinion',
      barraPfizer: 'Preferred Pfizer',
      notaOpinion: (
        <>
          Only those who say they received the Sinovac vaccine: {lista(v.buena.map((p) => numero(p.n)))} respondents. In {v.primeraOla} these questions were
          asked only of them, so the other waves are counted the same way to allow comparison.
        </>
      ),
    }
  },
  cn: (v) => {
    const titularRecuerdo = v.recuerdoQuieto && v.tresDeCuatro
      ? `在记得的受访者中，四分之三表示接种过科兴疫苗，与${v.primeraOla}年一样`
      : '多少受访者表示接种过科兴疫苗'
    const titularOpinion = v.todoEnElPrimerAnio && v.primerTramo
      ? `在接种者中，对科兴疫苗评价好的比例在${v.primerTramo.hasta}年下降，此后维持在这一水平`
      : v.buenaCae
        ? '在接种者中，对科兴疫苗评价好的比例下降'
        : '接种者如何看待科兴疫苗'
    const penultima = v.recibio.at(-2)!
    const ultima = v.recibio.at(-1)!
    const diferencia = v.primerTramo?.diferencia ?? 0
    const porOlaCn = (puntos: Punto[]) => puntos.map((p) => `${p.ola}年：${fmt(p.valor)}`).join('；')
    return {
      salida: '返回数据故事',
      titularRecuerdo,
      frasesRecuerdo: [
        <>{v.primeraOla}年，<strong>{fmt(v.recibio[0].valor)}</strong>的受访者表示至少接种过一剂科兴疫苗。</>,
        <>
          {penultima.ola}年为<strong>{fmt(penultima.valor)}</strong>，{v.ultimaOla}年为<strong>{fmt(ultima.valor)}</strong>。
          {v.recuerdoQuieto ? '三轮调查，这一数字的变化与随机波动无法区分。' : '这一次，数字有了变化。'}
        </>,
      ],
      descripcionRecuerdo: `在记得的受访者中，表示至少接种过一剂科兴疫苗的比例，按轮次：${porOlaCn(v.recibio)}。`,
      notaRecuerdo: (
        <>
          各轮分别为{lista(v.recibio.map((p) => `${numero(p.n)}名受访者中的${casosDe(p.valor, p.n)}人`))}。
          {v.noRecuerda && <>{v.ultimaOla}年新增了“不记得”选项：{fmt(v.noRecuerda.porcentaje)}的受访者选择了该项（{numero(v.noRecuerda.base)}人中的{numero(v.noRecuerda.n)}人），这些人不计入上述比例。由于该选项是新增的，无法得知其中有多少属于遗忘。</>}
        </>
      ),
      respiro: { titulo: '那么，它留下了怎样的评价？', cuerpo: <>那么，它留下了怎样的<strong>评价</strong>？</> },
      titularOpinion,
      frasesOpinion: [
        <>{v.primeraOla}年，在接种过科兴疫苗的受访者中，<strong>{fmt(v.buena[0].valor)}</strong>对其评价为好或非常好。</>,
        <>
          {v.primerTramo?.hasta}年为<strong>{fmt(v.primerTramo?.b ?? 0)}</strong>：一年内{diferencia < 0 ? '下降' : '上升'}{decimal(Math.abs(diferencia))}个百分点。
        </>,
        <>
          {v.ultimaOla}年为<strong>{fmt(v.buena.at(-1)!.valor)}</strong>。
          {v.todoEnElPrimerAnio ? '全部降幅都发生在第一年。' : ''}
        </>,
        <>
          相比之下，更希望接种辉瑞或莫德纳疫苗的受访者比例
          {v.pfizerQuieto
            ? <>在三轮调查中都保持在<strong>{porcentaje(v.rangoPfizer[0], 0)}至{porcentaje(v.rangoPfizer[1], 0)}</strong>之间。</>
            : <>有所变化：{lista(v.pfizer.map((p) => fmt(p.valor)))}。</>}
        </>,
      ],
      descripcionOpinion: `仅限接种过科兴疫苗的受访者。对该疫苗评价为好或非常好：${porOlaCn(v.buena)}。更希望接种辉瑞或莫德纳疫苗：${porOlaCn(v.pfizer)}。`,
      barraBuena: '评价好',
      barraPfizer: '更愿接种辉瑞',
      notaOpinion: (
        <>
          仅限表示接种过科兴疫苗的受访者：各轮分别为{lista(v.buena.map((p) => `${numero(p.n)}人`))}。{v.primeraOla}年这些问题只向他们提出，因此其他轮次也按同样方式统计，以便比较。
        </>
      ),
    }
  },
}
