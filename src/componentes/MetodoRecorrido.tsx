import type { ReactNode } from 'react'
import type { Encuesta } from '../nucleo/tipos'
import { decimal, numero, porcentaje, useIdioma, type Idioma } from '../locale'

/**
 * Por qué un puñado de respuestas puede inclinar una recta: el diagnóstico de la escena de ideología.
 *
 * **Las cifras salen del artefacto**: si una oleada nueva mueve la pendiente, este texto cambia solo.
 * Los textos van en `TEXTOS`, un bloque por idioma, con las cifras ya formateadas.
 */

/** Lo que los párrafos necesitan, ya formateado. */
interface Cifras {
  ola: number
  pendiente: string
  p: string
  n: string
  x: number
  sinEllos: string
  pSinEllos: string
  pesoPunto: string
  nCentral: string
  xCentral: number
  pesoCentral: string
  /** El intervalo del promedio del punto que sostiene la recta, si lo hay. */
  desde: string | null
  hasta: string | null
}

interface Textos {
  parrafos: (c: Cifras, formula: ReactNode) => ReactNode[]
  leyenda: (ola: number) => string
  escala: string
  personas: string
  promedio: string
  peso: string
  izquierda: string
  derecha: string
  pocos: string
}

const TEXTOS: Record<Idioma, Textos> = {
  es: {
    parrafos: (c, formula) => [
      <>En {c.ola} la pendiente es {c.pendiente} ({c.p}). Sin
        las <strong>{c.n} personas del punto {c.x}</strong> queda en{' '}
        {c.sinEllos} ({c.pSinEllos}): la inclinación depende de ellas.</>,
      <>En una regresión, cuánto pesa una respuesta sobre la pendiente depende de su posición, no de su
        valor: el peso es {formula}. Esas{' '}
        {c.n} personas aportan {c.pesoPunto} de la inclinación;
        las {c.nCentral} del punto {c.xCentral}, {c.pesoCentral}. Y su
        promedio está mal fijado{c.desde !== null && <> (de {c.desde} a {c.hasta})</>}.
        Mucho peso y mucha incertidumbre en el mismo lugar vuelven frágil el resultado.</>,
      <>Sacar el punto es un diagnóstico de robustez, no una corrección: esas personas siguen contadas en
        todas las demás cifras.</>,
    ],
    leyenda: (ola) => `Oleada ${ola}: personas por punto de la escala y cuánto pesa cada punto en la pendiente.`,
    escala: 'Escala',
    personas: 'Personas',
    promedio: 'Promedio',
    peso: 'Peso',
    izquierda: 'izquierda',
    derecha: 'derecha',
    pocos: 'muy pocos casos',
  },
  // «Peso» no se traduce por *weight* / 权重: en inglés y en chino se leería como ponderador, que la
  // encuesta no tiene (glosario, sección 2). Es cuánto de la pendiente aporta cada punto: *share* / 贡献度.
  en: {
    parrafos: (c, formula) => [
      <>In {c.ola}, the slope is {c.pendiente} ({c.p}). Without the <strong>{c.n} people at
        point {c.x}</strong>, it is {c.sinEllos} ({c.pSinEllos}): the slope depends on them.</>,
      <>In a regression, how much a response pulls on the slope depends on its position, not its value:
        its share is {formula}. Those {c.n} people account for {c.pesoPunto} of the slope; the {c.nCentral} at
        point {c.xCentral}, {c.pesoCentral}. And their average is poorly pinned
        down{c.desde !== null && <> (from {c.desde} to {c.hasta})</>}. A large share and a lot of uncertainty
        in the same place make the result fragile.</>,
      <>Removing the point is a robustness check, not a correction: those people are still counted in every
        other figure.</>,
    ],
    leyenda: (ola) => `${ola} wave: people at each point of the scale and each point's share of the slope.`,
    escala: 'Scale',
    personas: 'People',
    promedio: 'Average',
    peso: 'Share',
    izquierda: 'left',
    derecha: 'right',
    pocos: 'too few cases',
  },
  cn: {
    parrafos: (c, formula) => [
      <>{c.ola}年的斜率为{c.pendiente}（{c.p}）。去掉<strong>刻度{c.x}上的{c.n}名受访者</strong>后，斜率为{c.sinEllos}（{c.pSinEllos}）：斜率取决于这些人。</>,
      <>在回归中，一个回答对斜率的影响取决于它在量表上的位置，而非它的数值：其贡献度为{formula}。这{c.n}名受访者贡献了斜率的{c.pesoPunto}；刻度{c.xCentral}上的{c.nCentral}人贡献了{c.pesoCentral}。而且他们的平均值很不确定{c.desde !== null && <>（从{c.desde}到{c.hasta}）</>}。高贡献与高不确定性集中在同一处，使结果很脆弱。</>,
      <>去掉该刻度只是稳健性诊断，而非修正：这些人仍计入其他所有数据。</>,
    ],
    leyenda: (ola) => `${ola}年调查：量表各刻度的受访者人数及各刻度对斜率的贡献度。`,
    escala: '刻度',
    personas: '人数',
    promedio: '平均值',
    peso: '贡献度',
    izquierda: '左',
    derecha: '右',
    pocos: '样本量过小',
  },
}

export function CasoDeLaRecta ({ encuesta }: { encuesta: Encuesta }) {
  const t = TEXTOS[useIdioma()]
  const primera = encuesta.olas.at(0) ?? 0
  const regresion = encuesta.contrastes?.regresiones.find((r) => r.id === 'ideologia-china') ?? null
  const deLaPrimera = regresion?.porOla.find((o) => o.ola === primera) ?? null
  const sostiene = deLaPrimera?.sostiene ?? null
  const puntoSostiene = deLaPrimera?.puntos.find((q) => q.x === sostiene?.x) ?? null
  const puntoCentral = deLaPrimera?.puntos.reduce((mejor, q) => (q.n > mejor.n ? q : mejor), deLaPrimera.puntos[0]) ?? null
  if (!deLaPrimera || !sostiene || !puntoSostiene || !puntoCentral) return null

  const cifra = (v: number) => `${v > 0 ? '+' : ''}${decimal(v, 2)}`
  // Con tres decimales, un p de 0,0001 se imprime «0,000», que se lee como cero exacto. El método
  // no puede afirmar eso: con diez mil permutaciones el piso es 1/10.001.
  const valorP = (p: number) => (p < 0.001 ? `p < ${decimal(0.001, 3)}` : `p = ${decimal(p, 3)}`)

  const cifras: Cifras = {
    ola: primera,
    pendiente: cifra(deLaPrimera.recta.b),
    p: valorP(deLaPrimera.recta.p),
    n: numero(sostiene.n),
    x: sostiene.x,
    sinEllos: cifra(sostiene.recta.b),
    pSinEllos: valorP(sostiene.recta.p),
    pesoPunto: porcentaje(puntoSostiene.peso, 0),
    nCentral: numero(puntoCentral.n),
    xCentral: puntoCentral.x,
    pesoCentral: porcentaje(puntoCentral.peso, 0),
    desde: puntoSostiene.ic ? decimal(puntoSostiene.ic[0], 0) : null,
    hasta: puntoSostiene.ic ? decimal(puntoSostiene.ic[1], 0) : null,
  }
  const formula = <code className="rounded bg-gray-100 px-1">n·(x − x̄)² / Σ(x − x̄)²</code>

  return (
    <div className="flex flex-col gap-2">
      {t.parrafos(cifras, formula).map((p, i) => <p key={i}>{p}</p>)}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left">
          <caption className="pb-1 text-left text-gray-500">{t.leyenda(primera)}</caption>
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th scope="col" className="py-1 pr-3 font-medium">{t.escala}</th>
              <th scope="col" className="py-1 pr-3 font-medium">{t.personas}</th>
              <th scope="col" className="py-1 pr-3 font-medium">{t.promedio}</th>
              <th scope="col" className="py-1 pr-3 font-medium">{t.peso}</th>
            </tr>
          </thead>
          <tbody>
            {deLaPrimera.puntos.map((q) => (
              <tr key={q.x} className={`border-b border-gray-100 ${q.x === sostiene.x ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                <th scope="row" className="py-1 pr-3 font-normal tabular-nums">
                  {q.x}{q.x === deLaPrimera.puntos[0].x ? ` · ${t.izquierda}` : q.x === deLaPrimera.puntos.at(-1)?.x ? ` · ${t.derecha}` : ''}
                </th>
                <td className="py-1 pr-3 tabular-nums">{numero(q.n)}</td>
                <td className="py-1 pr-3 tabular-nums">
                  {q.media === null ? t.pocos : decimal(q.media, 1)}
                  {q.ic && <span className="text-gray-400"> [{decimal(q.ic[0], 0)}; {decimal(q.ic[1], 0)}]</span>}
                </td>
                <td className="py-1 pr-3 tabular-nums">{porcentaje(q.peso, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
