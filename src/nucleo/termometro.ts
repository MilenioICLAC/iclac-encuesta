import { escalaRedonda } from './escala'
import { numero } from '../locale'

/**
 * El trato de la figura del termómetro, en un solo lugar.
 *
 * **El recorrido y el tablero mostraban la misma pregunta y tenían que verse igual.** Hasta el
 * 07-09-2026 no se parecían en nada: el recorrido dibujaba cinco países en filas con un punto por
 * oleada, y el tablero una sola línea de tres puntos estirada a una tarjeta de ancho completo,
 * con los números a 91 px y el módulo midiendo 1.385 px de alto. Y con un corte activo era peor:
 * la variable es continua de 0 a 100, así que pedirle una distribución por categoría producía un
 * centenar de filas y una tarjeta de 4.247 px.
 *
 * Acá viven qué escala, en qué orden van las filas y qué dice el eje. El tablero salió de la app
 * (22-09-2026) y hoy solo la usa «La mirada», pero la regla sigue: si otra vista vuelve a dibujar
 * el termómetro, pasa por acá y **no elige su propia escala**.
 */

export interface FilaMedia {
  clave: string
  etiqueta: string
  /** Una media por oleada. `null` donde esa oleada no tiene casos. */
  valores: (number | null)[]
}

/** Marcas del eje, incluidos los dos extremos. */
export const MARCAS = 5

/**
 * El eje va **recortado y declarado**, y las dos cosas juntas.
 *
 * Cinco países caben en veinte puntos de escala: con 0 a 100 las diferencias que el recorrido
 * afirma se vuelven invisibles. Un eje recortado que no lo dice exagera la pendiente, que es el
 * defecto del monitor actual, así que el recorte se escribe al lado del eje.
 */
export function unidadEje (escala: { min: number, max: number }): string {
  const recortado = escala.min > 0 || escala.max < 100
  return recortado
    ? `Evaluación de 0 a 100 · eje recortado a ${numero(escala.min)}-${numero(escala.max)}`
    : 'Evaluación de 0 a 100'
}

/**
 * Filas ordenadas y escala común, a partir de las medias de cada fila.
 *
 * El orden sale de la última oleada: es la pregunta que el lector trae («¿quién está arriba
 * hoy?»), y no el promedio de la serie, que no le importa a nadie. La escala se calcula sobre
 * **todos** los valores, incluidos los que un paso del recorrido tenga apagados: si dependiera de
 * lo visible, el mismo valor cambiaría de lugar al avanzar el relato.
 */
export function figuraTermometro (filas: FilaMedia[], escalaFijada?: { min: number, max: number }) {
  const valores = filas.flatMap((f) => f.valores.filter((v): v is number => v !== null))
  // La escala se puede fijar desde afuera para que **dos juegos de filas compartan eje**: en el
  // recorrido, la escena 1 cambia de países a tramos ideológicos sin mover una sola marca, y el
  // lector puede comparar las dos vistas porque el eje es literalmente el mismo.
  const escala = escalaFijada ?? escalaRedonda(valores, MARCAS)
  const ultimo = (f: FilaMedia) => {
    for (let i = f.valores.length - 1; i >= 0; i--) if (f.valores[i] !== null) return f.valores[i] as number
    return Number.NEGATIVE_INFINITY
  }
  return {
    filas: [...filas].sort((a, b) => ultimo(b) - ultimo(a)),
    escala,
    marcas: MARCAS,
    unidadEje: unidadEje(escala),
  }
}
