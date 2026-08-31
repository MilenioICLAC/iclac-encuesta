/**
 * El único lugar del repositorio donde se nombra un locale.
 *
 * Ningún locale se escribe a mano dentro de un `Intl`: un literal no falla, formatea, y
 * formatea mal en los otros idiomas. En la Fase 1 llegó a producción con dos lugares
 * apuntando a lados opuestos. Cuando entre i18next, este módulo lee el idioma activo y
 * nadie más cambia.
 *
 * Ojo con el chino: la etiqueta interna del producto es `cn`, pero `Intl` conoce `zh`.
 */
const IDIOMAS = { es: 'es-CL', en: 'en-US', cn: 'zh-CN' } as const

export type Idioma = keyof typeof IDIOMAS

let idiomaActivo: Idioma = 'es'

export function fijarIdioma (idioma: Idioma) {
  idiomaActivo = idioma
}

export function locale (): string {
  return IDIOMAS[idiomaActivo]
}

export function numero (valor: number): string {
  return new Intl.NumberFormat(locale()).format(valor)
}

export function porcentaje (valor: number, decimales = 1): string {
  return new Intl.NumberFormat(locale(), {
    style: 'percent',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor / 100)
}

export function fecha (iso: string): string {
  return new Intl.DateTimeFormat(locale(), { dateStyle: 'long' }).format(new Date(iso))
}
