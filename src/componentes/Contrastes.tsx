import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Contrastes as Datos } from '../nucleo/tipos'
import { decimal, numero, porcentaje, traducido, useIdioma, type Idioma } from '../locale'
import { firme, nominal, valorP } from '../nucleo/prueba'
import { entreCifraYUnidad, unidadDeDiferencia } from './unidades'

/**
 * Qué diferencias entre oleadas superan el azar de la propia muestra.
 *
 * **Va en «Sobre los datos» y no en las figuras**, y esa es la decisión de diseño: quien mira una
 * figura está leyendo un resultado, y quien llega acá está por citarlo.
 *
 * Los números vienen calculados del ETL (`scripts/lib/contraste.mjs`): son diez mil permutaciones
 * por comparación, que no es trabajo del navegador de nadie.
 */

const T = ({ children }: { children: ReactNode }) => <strong className="text-gray-900">{children}</strong>

/** Los seis párrafos de «Cómo se lee», un bloque por idioma: llevan cifras y negritas en medio. */
const COMO_SE_LEE: Record<Idioma, (rondas: number) => ReactNode[]> = {
  es: (rondas) => [
    <><T>El p.</T> Se baraja {numero(rondas)} veces
      lo que se está comparando y se cuenta cuántas barajadas dan una diferencia al menos tan grande como
      la observada. Entre oleadas se baraja el año; en una brecha dentro de la persona, el signo de cada
      diferencia; entre grupos, a qué grupo pertenece cada persona; en una recta, la opinión entre los
      puntos de la escala. Un p de {decimal(0.7, 2)} dice que siete de cada diez barajadas al azar dan lo mismo o más.</>,
    <><T>El intervalo.</T> Se remuestrean las respuestas (bootstrap)
      y se toma el rango del {porcentaje(95, 0)} de los remuestreos.</>,
    <><T>La corrección por familia.</T> Las hipótesis que se
      prueban juntas (las de una misma historia, o las cuatro palabras de las respuestas
      abiertas) se corrigen con el método de Holm: probar varias a la vez aumenta la chance
      de que alguna pase por azar, y la corrección lo compensa.</>,
    <><T>Qué se afirma.</T> Una diferencia se afirma, en las historias
      y en esta página, si su p queda bajo {decimal(0.05, 2)}, su intervalo no contiene el cero y, cuando es parte de
      una familia, también pasa la corrección. Si pasa lo primero pero no la corrección, la fila lo dice;
      si no, dice «parejo».</>,
    <><T>Edad y sexo fijos.</T> Cada diferencia entre oleadas lleva
      también su versión con las dos oleadas llevadas a una misma composición de edad y sexo. Si las dos se parecen, la
      edad y el sexo de quienes contestaron no explican el cambio; otras diferencias de composición
      siguen posibles.</>,
    <><T>Nada de esto es margen de error.</T> La muestra no es
      probabilística: estos números comparan las oleadas entre sí y no estiman a la población de Chile.
      Los cálculos son reproducibles: la misma base da siempre el mismo número.</>,
  ],
  en: (rondas) => [
    <><T>The p-value.</T> What is being compared is shuffled {numero(rondas)} times, and the number of
      shuffles that produce a difference at least as large as the observed one is counted. Across waves,
      the year is shuffled; in a within-person gap, the sign of each difference; between groups, the group
      each person belongs to; in a regression line, the opinions across the points of the scale. A p-value
      of {decimal(0.7, 2)} means that seven out of ten random shuffles give the same difference or a larger one.</>,
    <><T>The interval.</T> Responses are resampled (bootstrap), and the range covering {porcentaje(95, 0)} of
      the resamples is taken.</>,
    <><T>The family correction.</T> Hypotheses tested together (those of the same story, or the four words
      from the open-ended answers) are corrected with the Holm method: testing several at once raises the
      chance that one passes by chance, and the correction offsets this.</>,
    <><T>What is claimed.</T> A difference is claimed, in the stories and on this page, if its p-value is
      below {decimal(0.05, 2)}, its interval does not contain zero, and, when it belongs to a family, it also
      passes the correction. If it passes the first two but not the correction, the row says so; otherwise,
      it says “no clear difference.”</>,
    <><T>Age and sex held constant.</T> Each difference across waves also comes with a version in which both
      waves are brought to the same age and sex composition. If the two are similar, the age and sex of
      respondents do not explain the change; other differences in composition remain possible.</>,
    <><T>None of this is a margin of error.</T> The sample is not a probability sample: these numbers
      compare the waves with each other and do not estimate the population of Chile. The calculations are
      reproducible: the same data file always gives the same number.</>,
  ],
  cn: (rondas) => [
    <><T>p值。</T>将所比较的内容随机打乱{numero(rondas)}次，统计有多少次打乱得到的差异不小于实际观察到的差异。跨轮次比较时打乱年份；比较同一受访者内部的差距时，打乱每个差值的正负号；组间比较时，打乱每人所属的组；拟合直线时，在量表各刻度之间打乱观点。p值为{decimal(0.7, 2)}表示十次随机打乱中有七次得到相同或更大的差异。</>,
    <><T>区间。</T>对回答进行自助法重抽样（bootstrap），取重抽样结果中{porcentaje(95, 0)}的范围。</>,
    <><T>检验族校正。</T>一起检验的假设（同一数据故事中的假设，或开放式问题回答中的四个词）采用Holm校正：同时检验多项假设会提高其中某项偶然通过的可能，校正可抵消这一影响。</>,
    <><T>断言标准。</T>在数据故事和本页中，只有同时满足以下条件才断言存在差异：p值低于{decimal(0.05, 2)}，区间不含零，且若属于某个检验族，还须通过校正。若满足前两项但未通过校正，该行会注明；否则标注“难分高下”。</>,
    <><T>固定年龄与性别。</T>每项跨轮次差异还附有一个将两轮调查调整为相同年龄和性别构成后的版本。若两者相近，受访者的年龄和性别不能解释该变化；但其他构成差异仍可能存在。</>,
    <><T>以上均非误差范围。</T>样本不是概率样本：这些数字只用于各轮调查之间的比较，不用于推断智利总体。计算可重复：同一数据文件总是得到相同的结果。</>,
  ],
}

/** Cómo se lee cada fila: tres pasos y el aviso. */
export function ComoSeLee ({ rondas }: { rondas: number }) {
  const lang = useIdioma()
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      {COMO_SE_LEE[lang](rondas).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  )
}

/** Todas las medidas entre oleadas, en una tabla. Las brechas y los grupos están en su historia. */
export default function Contrastes ({ contrastes }: { contrastes: Datos }) {
  const { t } = useTranslation('paginas')
  const pares = contrastes.medidas[0]?.comparaciones.map((c) => [c.desde, c.hasta] as const) ?? []
  const entre = entreCifraYUnidad()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th scope="col" className="py-2 pr-3 font-medium">{t('contrastes.medida')}</th>
            {pares.map(([desde, hasta]) => (
              <th key={`${desde}-${hasta}`} scope="col" className="py-2 pr-3 font-medium tabular-nums">
                {desde} → {hasta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contrastes.medidas.map((medida) => (
            <tr key={medida.id} className="border-b border-gray-100 align-top">
              <th scope="row" className="py-1.5 pr-3 font-normal text-gray-900">
                {traducido(medida.etiqueta)}
                {medida.advertencia && <span className="block text-[11px] text-amber-800">{traducido(medida.advertencia)}</span>}
              </th>
              {pares.map(([desde, hasta]) => {
                const c = medida.comparaciones.find((x) => x.desde === desde && x.hasta === hasta)
                if (!c) return <td key={`${desde}-${hasta}`} className="py-1.5 pr-3 text-gray-400">{t('contrastes.sinDato')}</td>
                const afirma = firme(c)
                return (
                  <td key={`${desde}-${hasta}`} className="py-1.5 pr-3 tabular-nums">
                    <span className={afirma ? 'font-medium text-gray-900' : 'text-gray-500'}>
                      {c.diferencia > 0 ? '+' : ''}{decimal(c.diferencia, 1)}{entre}{unidadDeDiferencia(medida.unidad)}
                      {afirma ? '' : ` · ${nominal(c) ? t('contrastes.noPasa') : t('contrastes.parejo')}`}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      [{decimal(c.ic[0], 1)}; {decimal(c.ic[1], 1)}] · {valorP(c.p)}
                      {(c.holm ?? []).map((h) => ` · Holm ${valorP(h.p).replace('p ', '')}`).join('')}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
