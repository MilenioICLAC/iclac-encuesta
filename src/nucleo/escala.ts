import type { Punto } from '../componentes/Serie'

/**
 * Mínimo y máximo del eje vertical de una serie.
 *
 * Vive fuera del componente para que varias series de la misma figura compartan escala: si
 * cada una se autoescala, dos gráficos que se leen como comparables dejan de serlo.
 *
 * **En porcentaje el eje parte en cero, siempre.** El monitor actual encuadra el termómetro
 * entre 40 y 75 con `oob = squish`, lo que aplasta los valores fuera de rango contra el borde
 * y exagera visualmente la pendiente del hallazgo principal.
 */
export function escalaDe (series: Punto[][], unidad: 'porcentaje' | 'media') {
  const valores = series.flat().map((p) => p.valor).filter((v): v is number => v !== null)
  if (valores.length === 0) return { min: 0, max: 1 }
  if (unidad === 'porcentaje') return { min: 0, max: Math.max(100, ...valores) }

  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const margen = Math.max(4, (max - min) * 0.35)
  return { min: Math.max(0, min - margen), max: max + margen }
}
