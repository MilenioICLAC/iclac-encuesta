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

/**
 * Escala redondeada a un paso, para el gráfico de puntos.
 *
 * `escalaDe` agrega un margen del 35 % porque en una línea el margen de datos es lo único que
 * impide que la curva toque el borde. En el gráfico de puntos ese trabajo lo hacen los
 * márgenes en píxeles del lienzo, así que un 35 % adicional solo aplasta los datos contra el
 * centro. Acá el margen es el redondeo, que además deja marcas de eje legibles: con paso 5,
 * valores de 56,2 a 74,1 dan un eje de 55 a 75.
 */
export function escalaRedonda (valores: number[], paso: number) {
  const limpios = valores.filter((v) => Number.isFinite(v))
  if (limpios.length === 0) return { min: 0, max: paso }
  const min = Math.floor(Math.min(...limpios) / paso) * paso
  const max = Math.ceil(Math.max(...limpios) / paso) * paso
  return { min, max: max === min ? min + paso : max }
}
