/**
 * Escala redondeada a un paso, para el gráfico de puntos.
 *
 * Hasta el 15-09-2026 vivía acá también `escalaDe`, la de la línea de tres puntos del tablero, que
 * agregaba un margen del 35 % porque en una línea el margen de datos es lo único que impide que la
 * curva toque el borde. En el gráfico de puntos ese trabajo lo hacen los márgenes en píxeles del
 * lienzo, así que un 35 % adicional solo aplasta los datos contra el centro. Acá el margen es el
 * redondeo, que además deja marcas de eje legibles: con paso 5, valores de 56,2 a 74,1 dan un eje
 * de 55 a 75.
 */
export function escalaRedonda (valores: number[], paso: number) {
  const limpios = valores.filter((v) => Number.isFinite(v))
  if (limpios.length === 0) return { min: 0, max: paso }
  const min = Math.floor(Math.min(...limpios) / paso) * paso
  const max = Math.ceil(Math.max(...limpios) / paso) * paso
  return { min, max: max === min ? min + paso : max }
}
