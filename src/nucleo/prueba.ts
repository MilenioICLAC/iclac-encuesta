import { decimal } from '../locale'
import type { Correccion } from './tipos'

/**
 * Cómo se lee una prueba del artefacto, en las historias y en «Sobre los datos».
 *
 * **Una diferencia se afirma si pasa tres cosas** (Felipe, 23-09-2026): p nominal bajo 0,05, el
 * intervalo sin cruzar el cero y, si la prueba es de una familia de hipótesis, su p corregido por
 * Holm bajo 0,05 en todas sus familias. p e intervalo discrepan en una sola comparación del artefacto
 * (`riesgo-estrato` 2024, p = 0,0498 con el intervalo tocando +0,01); Holm tumba dos más
 * (`p8-proveedor` y `palabra-tecnologia`). La historia y la página leen esto mismo, así que no pueden
 * contradecirse.
 */
export const cruzaCero = (ic: [number, number]) => ic[0] * ic[1] <= 0

/** Con tres decimales, un p de 0,0001 se imprimiría «0,000»: con diez mil rondas el piso es 1/10.001. */
export const valorP = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${decimal(p, 3)}`)

interface Prueba { p: number, ic: [number, number], holm?: Correccion[] }

/**
 * El p corregido de una prueba en una familia. **`NaN` si no lo trae**: toda comparación con `NaN` es
 * falsa, así que ni «pasa» (`< 0,05`) ni «no pasa» (`>= 0,05`) se pueden afirmar sin el dato.
 */
export const corregido = (x: Prueba | null | undefined, familia: string): number =>
  x?.holm?.find((h) => h.familia === familia)?.p ?? Number.NaN

/** Pasa el nominal y el intervalo. */
export const nominal = (x: Prueba) => x.p < 0.05 && !cruzaCero(x.ic)

/** Pasa el nominal, el intervalo y cada una de sus correcciones de Holm. Es lo que se afirma. */
export const firme = (x: Prueba) => nominal(x) && (x.holm ?? []).every((h) => h.p < 0.05)
