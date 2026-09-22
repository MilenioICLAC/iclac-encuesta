import type { Encuesta, Variable } from './tipos'

/*
 * Lo que queda de los módulos del tablero, que salió de la app el 22-09-2026: los países del
 * termómetro, los cortes de la barra de estado del explorador y la búsqueda de una variable.
 */

/** Los países del termómetro, en el orden en que la guía los compara. */
export const TERMOMETRO = [
  { nombre: 'p5_1_val', pais: 'China' },
  { nombre: 'p5_2_val', pais: 'Estados Unidos' },
  { nombre: 'p5_3_val', pais: 'Corea del Sur' },
  { nombre: 'p5_4_val', pais: 'Francia' },
  { nombre: 'p5_5_val', pais: 'Japón' },
]

/**
 * Los cortes que ofrece la barra de estado. **Uno a la vez, nunca dos**: la muestra no
 * aguanta cruzar dos variables, con 110 celdas de mediana 6,5 casos en región × educación.
 *
 * Quedan fuera a propósito dos que el monitor actual sí ofrece: `p4`, porque sus códigos
 * cambian de significado entre oleadas, y `p26`, porque cruzar dos preguntas de opinión no
 * es un corte de caracterización.
 */
export const CORTES = [
  { nombre: null, etiqueta: 'Sin corte', orden: undefined },
  { nombre: 'sexo', etiqueta: 'Género', orden: undefined },
  // Los tres van agrupados, no con sus categorías originales. Educación venía con diez
  // niveles y su grupo más chico tenía siete casos; nivel socioeconómico con siete. Un
  // porcentaje sobre siete personas no dice nada, y la rampa de color no distingue más de
  // seis pasos. Es la misma regla que obliga a ofrecer macrozonas en vez de dieciséis
  // regiones: agrupar antes de ofrecer.
  { nombre: 'edad_rec', etiqueta: 'Edad', orden: ['18 a 34', '35 a 44', '45 a 54', '55 a 64', '65 o más'] },
  { nombre: 'educacion_rec', etiqueta: 'Educación', orden: ['Media incompleta o menos', 'Media completa', 'Técnica o universitaria incompleta', 'Universitaria completa o más'] },
  { nombre: 'nse_rec', etiqueta: 'Nivel socioeconómico', orden: ['AB · C1', 'C2', 'C3', 'D', 'E'] },
  // En tres tramos, no la escala cruda de 1 a 10: diez grupos en una figura son ilegibles.
  { nombre: 'p3_3', etiqueta: 'Ideología', orden: ['Izquierda', 'Centro', 'Derecha'] },
  // Los dos territoriales son derivados del ETL y sus valores son texto, así que llevan su
  // orden explícito: alfabéticamente, «Alto, Bajo, Medio, Muy alto» sugiere una escala falsa.
  { nombre: 'region_macrozona', etiqueta: 'Macrozona', orden: ['Norte', 'Centro', 'Centro sur', 'Sur'] },
  { nombre: 'region_impacto', etiqueta: 'Impacto económico de China', orden: ['Bajo', 'Medio', 'Alto', 'Muy alto'] },
]

export function variableDe (encuesta: Encuesta, nombre: string): Variable | undefined {
  return encuesta.variables.find((v) => v.nombre === nombre)
}
