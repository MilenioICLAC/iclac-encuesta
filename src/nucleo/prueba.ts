import { decimal } from '../locale'

/**
 * Cómo se lee una prueba del artefacto. **«Parejo» lo decide el intervalo, no el p**: permutación y
 * bootstrap pueden discrepar en el borde (`riesgo-estrato` en 2024: p = 0,0498 con el intervalo
 * tocando +0,01), y la regla de las historias es la del intervalo.
 */
export const cruzaCero = (ic: [number, number]) => ic[0] * ic[1] <= 0

/** Con tres decimales, un p de 0,0001 se imprimiría «0,000»: con diez mil rondas el piso es 1/10.001. */
export const valorP = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${decimal(p, 3)}`)
