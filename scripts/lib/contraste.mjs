// Cuándo una diferencia entre oleadas es una diferencia, y no el azar de la propia muestra.
//
// **Por qué no hay un t de Student acá.** La muestra no es probabilística: es un panel en línea
// por cuotas (hecho 2 del `CLAUDE.md`). Un t supone que cada oleada es una muestra aleatoria de
// Chile, que es justo lo que no tenemos, y su resultado se leería como margen de error, que acá
// no corresponde declarar.
//
// Lo que sí se puede afirmar sin marco probabilístico es mucho más chico y es lo que hace este
// módulo: **si la etiqueta de año fuera intercambiable entre estas respuestas, ¿cuántas veces el
// puro azar produciría una diferencia así de grande?** Es una afirmación sobre los datos que
// tenemos, no sobre el país.
//
// El supuesto es más débil que en un experimento. Ahí las etiquetas se asignan al azar y la
// permutación es exacta por diseño; acá las tres oleadas son tres reclutamientos distintos del
// mismo panel, así que la intercambiabilidad es un supuesto razonable y no un hecho. Por eso cada
// comparación viaja además con su versión **estandarizada** por edad y sexo: si el cambio se
// sostiene con la composición fija, no es que haya contestado otra gente.
//
// Todo es determinista: misma base, mismo número. La semilla va fija y el generador es
// `mulberry32`. **El generador congruencial clásico no sirve en JavaScript**: `semilla *
// 1103515245` pasa de 2^53 y la multiplicación pierde precisión, así que la secuencia deja de ser
// uniforme. Se notó porque el intervalo bootstrap salía incoherente con su propio p, que se
// calcula por otro camino.

export const SEMILLA = 20260907
export const RONDAS = 10000

export function generador (semilla = SEMILLA) {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const media = (v) => v.reduce((s, x) => s + x, 0) / v.length

const suma = (v) => v.reduce((s, x) => s + x, 0)

/**
 * Prueba de permutación de dos muestras independientes, a dos colas.
 *
 * Junta las dos oleadas en un solo montón, baraja las etiquetas y mide qué proporción de las
 * barajadas produce una diferencia de medias al menos tan grande como la observada. **Las
 * respuestas nunca cambian; lo único que se baraja es de qué año se dice que viene cada una.**
 *
 * El `+1` arriba y abajo evita el cero exacto: con 10.000 rondas el piso es 0,0001, y publicar
 * «p = 0» sería afirmar algo que el método no puede afirmar.
 */
export function permutacion (a, b, { rondas = RONDAS, semilla = SEMILLA } = {}) {
  const azar = generador(semilla)
  const observada = Math.abs(media(a) - media(b))
  const todos = Float64Array.from([...a, ...b])
  const na = a.length
  const nb = b.length
  const total = suma(todos)
  let extremos = 0
  for (let r = 0; r < rondas; r++) {
    // Fisher-Yates parcial: solo hacen falta las primeras `na` posiciones, porque el resto se
    // deduce del total. Barajar el arreglo entero cada ronda cuesta el doble y no aporta nada.
    let sumaA = 0
    for (let i = 0; i < na; i++) {
      const j = i + Math.floor(azar() * (todos.length - i))
      const t = todos[i]; todos[i] = todos[j]; todos[j] = t
      sumaA += todos[i]
    }
    if (Math.abs(sumaA / na - (total - sumaA) / nb) >= observada - 1e-12) extremos++
  }
  return (extremos + 1) / (rondas + 1)
}

/**
 * Prueba de permutación para datos pareados: la misma persona evalúa a los dos países.
 *
 * Acá lo intercambiable no es el año sino **cuál de los dos va primero**, así que la barajada es
 * cambiarle el signo a la diferencia de cada persona. Es la prueba exacta para este caso, y usa
 * la información que la comparación de dos promedios independientes tira a la basura: que las dos
 * cifras vienen del mismo encuestado y de su misma manera de usar la escala.
 */
export function permutacionPareada (diferencias, { rondas = RONDAS, semilla = SEMILLA } = {}) {
  const azar = generador(semilla)
  const observada = Math.abs(media(diferencias))
  const n = diferencias.length
  let extremos = 0
  for (let r = 0; r < rondas; r++) {
    let s = 0
    for (let i = 0; i < n; i++) s += azar() < 0.5 ? diferencias[i] : -diferencias[i]
    if (Math.abs(s / n) >= observada - 1e-12) extremos++
  }
  return (extremos + 1) / (rondas + 1)
}

/** Intervalo percentil del bootstrap para la diferencia de medias `media(b) − media(a)`. */
export function bootstrap (a, b, { rondas = RONDAS, semilla = SEMILLA + 1 } = {}) {
  const azar = generador(semilla)
  const dif = new Float64Array(rondas)
  for (let r = 0; r < rondas; r++) {
    let sa = 0
    for (let i = 0; i < a.length; i++) sa += a[Math.floor(azar() * a.length)]
    let sb = 0
    for (let i = 0; i < b.length; i++) sb += b[Math.floor(azar() * b.length)]
    dif[r] = sb / b.length - sa / a.length
  }
  dif.sort()
  return [dif[Math.floor(0.025 * rondas)], dif[Math.floor(0.975 * rondas)]]
}

/** El mismo intervalo, para una media pareada (la brecha dentro de cada persona). */
export function bootstrapMedia (valores, { rondas = RONDAS, semilla = SEMILLA + 1 } = {}) {
  const azar = generador(semilla)
  const medias = new Float64Array(rondas)
  for (let r = 0; r < rondas; r++) {
    let s = 0
    for (let i = 0; i < valores.length; i++) s += valores[Math.floor(azar() * valores.length)]
    medias[r] = s / valores.length
  }
  medias.sort()
  return [medias[Math.floor(0.025 * rondas)], medias[Math.floor(0.975 * rondas)]]
}

/**
 * La misma diferencia, con las dos oleadas llevadas a una composición común (estandarización
 * directa por celdas de edad × sexo, con los pesos del total de las dos).
 *
 * Responde la pregunta que la permutación no responde: si cambió el resultado, ¿fue porque la
 * gente piensa distinto o porque contestó otra gente? Las celdas sin casos en alguna de las dos
 * oleadas se descartan y el peso se renormaliza sobre las que quedan.
 */
export function estandarizada (casosA, casosB, valorDe, celdaDe) {
  const pool = [...casosA, ...casosB].filter((c) => valorDe(c) !== null)
  if (pool.length === 0) return null
  const pesos = new Map()
  for (const c of pool) {
    const k = celdaDe(c)
    pesos.set(k, (pesos.get(k) ?? 0) + 1 / pool.length)
  }
  const mediaDe = (casos) => {
    let acumulado = 0
    let peso = 0
    for (const [k, w] of pesos) {
      const v = casos.filter((c) => celdaDe(c) === k).map(valorDe).filter((x) => x !== null)
      if (v.length === 0) continue
      acumulado += w * media(v)
      peso += w
    }
    return peso > 0 ? acumulado / peso : null
  }
  const a = mediaDe(casosA)
  const b = mediaDe(casosB)
  return a === null || b === null ? null : b - a
}
