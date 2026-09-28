import { useTranslation } from 'react-i18next'
import i18n from './i18n'

/**
 * El único lugar del repositorio donde se nombra un locale.
 *
 * Ningún locale se escribe a mano dentro de un `Intl`: un literal no falla, formatea, y
 * formatea mal en los otros idiomas. En la Fase 1 llegó a producción con dos lugares
 * apuntando a lados opuestos. El idioma activo lo decide i18next (`i18n.ts`) y este módulo solo
 * lo lee: nadie más guarda una copia.
 *
 * Ojo con el chino: la etiqueta interna del producto es `cn`, pero `Intl` y `<html lang>` conocen `zh`.
 */
const IDIOMAS = { es: 'es-CL', en: 'en-US', cn: 'zh-CN' } as const

export type Idioma = keyof typeof IDIOMAS

/** Un texto en los tres idiomas. Así viajan los del catálogo y los contrastes en `encuesta.json`. */
export type Traducible = Record<Idioma, string>

const esIdioma = (x: string | undefined): x is Idioma => x !== undefined && x in IDIOMAS

/** El idioma activo. Fuera de React; dentro, `useIdioma`, que además vuelve a dibujar al cambiarlo. */
export function idioma (): Idioma {
  const activo = i18n.resolvedLanguage ?? i18n.language
  return esIdioma(activo) ? activo : 'es'
}

/**
 * El idioma activo, para un componente. **Suscribe al cambio**: sin esto el componente seguiría
 * dibujado en el idioma anterior. `App` lo llama, así que el árbol entero se vuelve a dibujar; un
 * `useMemo` que produzca texto lleva el idioma en sus dependencias.
 */
export function useIdioma (): Idioma {
  useTranslation()
  return idioma()
}

export function locale (): string {
  return IDIOMAS[idioma()]
}

/**
 * `<html lang>` y el título de la pestaña siguen al idioma. El lector de pantalla pronuncia según
 * `lang`, y el navegador elige con él la fuente de respaldo del chino (`:lang(zh)` en `index.css`).
 */
function alCambiar () {
  if (typeof document === 'undefined') return
  document.documentElement.lang = idioma() === 'cn' ? 'zh-CN' : idioma()
  document.title = i18n.t('titulo', { ns: 'comun' })
}
i18n.on('languageChanged', alCambiar)
// La primera detección ocurre en `i18n.ts`, antes de que este módulo se suscriba.
alCambiar()

/** Un texto publicado en los tres idiomas, en el activo. */
export function traducido (t: Traducible): string {
  return t[idioma()]
}

/**
 * Una palabra de las respuestas abiertas o de las nubes: la traducción, con la palabra que escribió
 * la gente entre paréntesis, «trade (comercio)». Sin el original, quien lee en inglés no sabría qué
 * se contó. Si la traducción es la misma palabra (una marca, un nombre), va una sola vez.
 */
export function palabraVisible (t: Traducible): string {
  const propia = t[idioma()]
  return idioma() === 'es' || propia === t.es ? t.es : idioma() === 'cn' ? `${propia}（${t.es}）` : `${propia} (${t.es})`
}

/**
 * Compara dos textos en español. Para lo que se ordena por la clave y no por lo que se ve: el
 * desempate de las palabras de una abierta tiene que ser el del ETL (`abiertas.mjs`), que marcó a
 * cada persona solo para esas palabras, en cualquier idioma.
 */
const COLACION_ES = new Intl.Collator(IDIOMAS.es)
export function compararEnEspanol (a: string, b: string): number {
  return COLACION_ES.compare(a, b)
}

/** «2023, 2024 y 2025», con la conjunción y la puntuación de cada idioma. */
export function lista (xs: string[], tipo: 'conjunction' | 'disjunction' = 'conjunction'): string {
  return new Intl.ListFormat(locale(), { style: 'long', type: tipo }).format(xs)
}

/**
 * La forma de una palabra según el número: `plural(n, { one: 'prueba', other: 'pruebas' })`. Las
 * categorías son las de `Intl.PluralRules` en el idioma activo; el chino solo usa `other`.
 */
export function plural (n: number, formas: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }): string {
  return formas[new Intl.PluralRules(locale()).select(n)] ?? formas.other
}

export function numero (valor: number): string {
  return new Intl.NumberFormat(locale()).format(valor)
}

export function porcentaje (valor: number, decimales = 1): string {
  return menos(new Intl.NumberFormat(locale(), {
    style: 'percent',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor / 100))
}

/**
 * El signo menos tipográfico (−, U+2212), no el guion del teclado (-, U+002D).
 *
 * `Intl` devuelve el guion, que es más corto y más alto: al lado de un texto de lectura se ve como
 * un guion de palabra y no como un signo. Se cambia acá y no en cada figura porque es el mismo
 * criterio del locale: un dato, un lugar.
 *
 * **No toca las descargas:** los CSV los generan los scripts de Node, que no pasan por este módulo.
 */
const menos = (texto: string): string => texto.replace('-', '−')

/** Un decimal, con el separador del idioma activo. En español es coma, no punto. */
export function decimal (valor: number, decimales = 1): string {
  return menos(new Intl.NumberFormat(locale(), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor))
}

/**
 * Un rango de días, «10–13 de octubre de 2023». Las fechas llegan como «AAAA-MM-DD», que `Date` lee
 * como medianoche UTC: se formatean en UTC, o en Chile el 10 de octubre saldría 9.
 */
export function rangoDeFechas (desde: string, hasta: string): string {
  return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .formatRange(new Date(desde), new Date(hasta))
}

export function fecha (iso: string): string {
  return new Intl.DateTimeFormat(locale(), { dateStyle: 'long' }).format(new Date(iso))
}
