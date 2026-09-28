import { idioma, type Idioma } from '../locale'

/**
 * Las unidades de los contrastes (`unidad` en el artefacto) como se escriben en la vista, en cada
 * idioma. Las usan `Evidencia` y la tabla de `Contrastes`; viven aparte porque un módulo de
 * componentes que además exporta funciones rompe la recarga en caliente.
 *
 * Una resta de porcentajes da puntos porcentuales, no por ciento: `pp` en español y en inglés, como
 * en las figuras, y 个百分点 en chino.
 */
const UNIDADES: Record<Idioma, { pp: string, puntos: string, escalones: string, pendiente: string }> = {
  es: { pp: 'pp', puntos: 'puntos', escalones: 'escalones', pendiente: 'puntos por punto' },
  en: { pp: 'pp', puntos: 'points', escalones: 'steps', pendiente: 'points per point' },
  cn: { pp: '个百分点', puntos: '分', escalones: '级', pendiente: '分／刻度' },
}

/** La unidad de una diferencia, en el idioma activo. */
export function unidadDeDiferencia (unidad: string): string {
  const u = UNIDADES[idioma()]
  if (unidad === '%' || unidad === 'puntos porcentuales') return u.pp
  if (unidad === 'puntos') return u.puntos
  if (unidad === 'escalones') return u.escalones
  return unidad
}

/** La unidad de la pendiente de una recta: cuánto cambia la medida por punto de la escala. */
export function unidadDePendiente (): string {
  return UNIDADES[idioma()].pendiente
}

/** En chino la unidad va pegada a la cifra («+3.2个百分点»); en los otros, con un espacio que no corta. */
export function entreCifraYUnidad (): string {
  return idioma() === 'cn' ? '' : '\u00a0'
}
