import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { decimal, numero, plural, useIdioma, type Idioma } from '../locale'

/**
 * Las bases para descargar, con su documentación al lado.
 *
 * ICLAC decidió publicar la base combinada, las tres por oleada y los tres libros de códigos,
 * **con la nota metodológica al lado**. Esto último no es decoración: sin la nota, quien baje
 * los datos no sabe que la muestra se estratificó por peso económico de China y no por
 * población, y va a leer los porcentajes como si fueran del país.
 *
 * **Las bases van sin identificadores de panelista.** Traen `key` y `codpanelista`, y 159
 * personas participaron en más de una oleada: con esas columnas se puede seguir a una persona
 * entre años. Publicar la versión que sí los trae es decisión de ICLAC (`C11`), y su propio
 * documento de lectura recomienda la anónima. Mientras no decidan, el sitio ofrece la que se
 * puede publicar sin preguntar, y lo dice.
 *
 * **Los archivos están en español en cualquier idioma del sitio**, y en inglés y chino la página lo
 * dice. El título de cada archivo lo escribe `scripts/descargas.mjs` en el manifiesto; en español se
 * muestra ese, y en los otros idiomas el de `paginas.json` (`descargas.archivos`), elegido por el
 * nombre del archivo.
 */

interface Archivo {
  archivo: string
  titulo: string
  tipo: 'datos' | 'documentacion'
  formato: string
  casos?: number
  columnas?: number
  bytes: number
  sha256: string
}

interface Manifiesto {
  generado: string
  quitadas: string[]
  archivos: Archivo[]
}

function tamano (bytes: number): string {
  return bytes > 1048576 ? `${decimal(bytes / 1048576, 1)} MB` : `${numero(Math.round(bytes / 1024))} kB`
}

/** La clave del título en `paginas.json`, por el nombre del archivo. Un archivo nuevo cae al título del manifiesto. */
function claveDe (archivo: string): [clave: string, valores: Record<string, string>] | null {
  const anio = archivo.match(/_(\d{4})\.\w+$/)?.[1]
  if (anio && archivo.startsWith('ICLAC_encuesta_')) return ['oleada', { anio }]
  if (anio && archivo.startsWith('ICLAC_libro_de_codigos_')) return ['libro', { anio }]
  if (anio && archivo.startsWith('Cuestionario_')) return ['cuestionario', { anio }]
  const fijos: Record<string, string> = {
    'ICLAC_encuesta_combinada.csv': 'combinada',
    'ICLAC_encuesta_diccionario.csv': 'diccionario',
    'ICLAC_encuesta_valores.csv': 'valores',
    'ICLAC_encuesta_notas.csv': 'notas',
    'Nota_metodologica_muestreo_ICLAC.docx': 'nota',
    'Diseno_indice_impacto_China_por_region.xlsx': 'indice',
  }
  return fijos[archivo] ? [fijos[archivo], {}] : null
}

const C = ({ children }: { children: ReactNode }) => <code className="rounded bg-gray-100 px-1">{children}</code>

/** «Antes de usarlos»: prosa con negritas y columnas en medio, un bloque por idioma. */
const AVISOS: Record<Idioma, (quitadas: number) => ReactNode[]> = {
  es: (quitadas) => [
    <><strong>La muestra no es probabilística.</strong> Es un panel en línea por cuotas y no trae
      ponderadores, así que los resultados van sin ponderar y no corresponde declarar margen de
      error. La nota metodológica explica el diseño.</>,
    <><strong>Se estratificó por peso económico de China en la región, no por población.</strong> La
      Región Metropolitana pesa mucho menos que en el país. Leer los porcentajes como nacionales
      sería un error.</>,
    <><strong>No es un panel.</strong> Son tres cortes transversales. La columna{' '}
      <C>olas_panelista</C> dice en cuántas oleadas
      participó cada persona, para poder descartar a las {numero(159)} que repiten.</>,
    <><strong>Mismo nombre de variable no siempre es la misma pregunta.</strong> El diccionario trae
      la columna <C>uso_serie_longitudinal</C>, que da una
      primera orientación; el explorador indica, pregunta por pregunta, qué se compara entre oleadas.</>,
    <><strong>Sin identificadores de panelista.</strong> Se retiraron{' '}
      {numero(quitadas)} columnas de identificación y control de terreno, entre ellas{' '}
      <C>key</C> y{' '}
      <C>codpanelista</C>. Las respuestas están completas.</>,
  ],
  en: (quitadas) => [
    <><strong>The sample is not a probability sample.</strong> It is a quota sample from an online panel,
      so results are unweighted and no margin of error should be reported. The methodological note
      explains the design.</>,
    <><strong>The sample was stratified by the region&apos;s economic exposure to China, not by population.</strong>{' '}
      The Santiago Metropolitan Region makes up a much smaller share of the sample than of the country.
      Reading the percentages as national figures would be a mistake.</>,
    <><strong>The waves do not follow the same people.</strong> They are three cross-sectional surveys.
      The <C>olas_panelista</C> column shows how many waves each person took part in, so the{' '}
      {numero(159)} people who answered in more than one wave can be excluded.</>,
    <><strong>The same variable name is not always the same question.</strong> The variable dictionary
      includes the <C>uso_serie_longitudinal</C> column as a first guide; the data explorer indicates,
      question by question, what is compared across waves.</>,
    <><strong>No respondent identifiers.</strong> {numero(quitadas)}{' '}
      {plural(quitadas, { one: 'identification or fieldwork-control column was', other: 'identification and fieldwork-control columns were' })} removed,
      including <C>key</C> and <C>codpanelista</C>. The responses are complete.</>,
  ],
  cn: (quitadas) => [
    <><strong>样本不是概率样本。</strong>样本来自在线样本库的配额抽样，因此结果未加权，不应报告误差范围。抽样方法说明介绍了设计。</>,
    <><strong>样本按地区对华经济关联度分层，而非按人口分层。</strong>圣地亚哥首都大区在样本中的占比远低于其在全国人口中的占比。把百分比当作全国数据是错误的。</>,
    <><strong>各轮受访者并非同一批人。</strong>三轮均为横截面调查。<C>olas_panelista</C>列标明每人参加了几轮调查，据此可排除参加过多轮调查的{numero(159)}人。</>,
    <><strong>变量名相同不一定是同一道题。</strong>变量词典中的<C>uso_serie_longitudinal</C>列可作初步参考；数据探索工具逐题标明哪些题目可以跨轮次对比。</>,
    <><strong>不含受访者标识符。</strong>已删除{numero(quitadas)}个身份识别和调查执行监控字段，包括<C>key</C>和<C>codpanelista</C>。回答数据完整。</>,
  ],
}

export default function Descargas () {
  const { t } = useTranslation('paginas')
  const idioma = useIdioma()
  const [manifiesto, setManifiesto] = useState<Manifiesto | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}descargas/manifiesto.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setManifiesto)
      // Sin manifiesto la sección no se muestra: es preferible a ofrecer enlaces rotos.
      .catch(() => setManifiesto(null))
  }, [])

  if (!manifiesto) return null

  const titulo = (a: Archivo) => {
    const clave = idioma === 'es' ? null : claveDe(a.archivo)
    return clave ? t(`descargas.archivos.${clave[0]}`, { ...clave[1], defaultValue: a.titulo }) : a.titulo
  }
  const datos = manifiesto.archivos.filter((a) => a.tipo === 'datos')
  const docs = manifiesto.archivos.filter((a) => a.tipo === 'documentacion')
  const avisoIdioma = t('descargas.idioma')

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10">
      <h2 className="font-display text-2xl font-semibold">{t('descargas.titulo')}</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{t('descargas.bajada')}</p>
      {avisoIdioma && <p className="mt-2 max-w-2xl text-sm font-medium text-gray-800">{avisoIdioma}</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Grupo titulo={t('descargas.respuestas')} archivos={datos} tituloDe={titulo} />
        <Grupo titulo={t('descargas.documentacion')} archivos={docs} tituloDe={titulo} />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700">
        <h3 className="font-display text-base font-semibold text-gray-900">{t('descargas.antes')}</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          {AVISOS[idioma](manifiesto.quitadas.length).map((aviso, i) => <li key={i}>{aviso}</li>)}
        </ul>
      </div>
    </section>
  )
}

function Grupo ({ titulo, archivos, tituloDe }: { titulo: string, archivos: Archivo[], tituloDe: (a: Archivo) => string }) {
  const { t } = useTranslation('paginas')
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-display text-base font-semibold text-gray-900">{titulo}</h3>
      <ul className="mt-2 flex flex-col divide-y divide-gray-100">
        {archivos.map((a) => (
          <li key={a.archivo} className="flex items-baseline justify-between gap-3 py-1.5">
            <a
              href={`${import.meta.env.BASE_URL}descargas/${a.archivo}`}
              download
              className="min-w-0 text-sm text-brand-dark underline decoration-gray-300 underline-offset-2 hover:decoration-brand-dark"
            >
              {tituloDe(a)}
            </a>
            <span className="shrink-0 text-xs tabular-nums text-gray-500">
              {a.casos !== undefined && <>{plural(a.casos, { one: t('descargas.fila', { n: numero(a.casos) }), other: t('descargas.filas', { n: numero(a.casos) }) })} · </>}
              {a.formato} · {tamano(a.bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
