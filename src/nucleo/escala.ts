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

/**
 * El tope del eje de una figura de barras, con aire para que la más larga no toque el borde.
 *
 * **Sube al múltiplo de cinco que quede sobre el máximo más un 10 %.** Sin el aire, la barra
 * mayor llega al borde del lienzo y se lee como un tope de la escala; con él, 60,8 sobre 100
 * termina en un eje de 70 y se ve como lo que es. Nunca pasa de 100: son proporciones.
 *
 * Se calcula con **todos** los valores de la escena, los que un paso todavía no enciende
 * incluidos, porque una escala que dependiera de lo visible movería la misma barra al avanzar.
 */
export function topeDeBarras (valores: number[]): number {
  const limpios = valores.filter((v) => Number.isFinite(v))
  if (limpios.length === 0) return 100
  return Math.min(100, Math.ceil((Math.max(...limpios) * 1.1) / 5) * 5)
}
