import type { Caso, Encuesta, Variable } from './tipos'
import { media, proporcion } from './agregar'

/**
 * Los módulos del tablero.
 *
 * **La agrupación es de ICLAC, no nuestra.** Los seis bloques temáticos salen de la «Guía de
 * contexto para el visualizador» que Urdinez mandó el 02-09-2026, y cada módulo lleva su
 * variable y el porqué que él le da. Agrupar por tema, en vez de ordenar los módulos como
 * una secuencia, es lo que evita afirmar un orden argumental que nadie escribió.
 *
 * `ancho` decide cuánto ocupa el módulo en la rejilla, y responde al contenido y no a la
 * pantalla: `p8` desagrega por región y necesita ancho completo, mientras `p12` y `p13` son
 * dos preguntas de sí/no que caben en un tercio.
 */

export type Ancho = 'tercio' | 'medio' | 'completo'

export interface Modulo {
  id: string
  bloque: string
  titulo: string
  /** Qué mide, en una línea. No es el enunciado: eso sale del diccionario. */
  bajada: string
  variable: string
  ancho: Ancho
  /** Cómo se lee la figura. */
  forma: 'serie-media' | 'serie-porcentaje' | 'distribucion'
  /** Para las figuras de porcentaje: qué códigos son «el dato» que se sigue. */
  codigos?: number[]
  /** Códigos que salen del denominador, no solo del numerador. */
  excluidos?: number[]
  /** Salvedad que la figura tiene que mostrar siempre, no una nota al pie opcional. */
  advertencia?: string
}

export const MODULOS: Modulo[] = [
  // --- Bloque uno: cómo se mira a China frente a otras potencias -----------
  {
    id: 'termometro',
    bloque: 'potencias',
    titulo: 'Opinión sobre China, en perspectiva',
    bajada: 'Evaluación de 0 a 100. Los cinco países juntos, porque un 65,8 solo no significa nada.',
    variable: 'p5_1_val',
    ancho: 'completo',
    forma: 'serie-media',
  },

  // --- Bloque dos: Chile entre Washington y Beijing ------------------------
  {
    id: 'confianza-china',
    bloque: 'geopolitica',
    titulo: 'Confianza en China',
    bajada: 'Capacidad de China para lidiar responsablemente con los problemas de América Latina.',
    variable: 'p24',
    ancho: 'medio',
    forma: 'distribucion',
  },
  {
    id: 'confianza-eeuu',
    bloque: 'geopolitica',
    titulo: 'Confianza en Estados Unidos',
    bajada: 'La misma pregunta, la otra potencia. Van de a par: la comparación es la figura.',
    variable: 'p25',
    ancho: 'medio',
    forma: 'distribucion',
  },
  {
    id: 'posicionamiento',
    bloque: 'geopolitica',
    titulo: 'Cómo debería posicionarse Chile',
    bajada: 'La mayoría no alineada se erosiona, y lo que pierde se va a China.',
    variable: 'p26',
    ancho: 'completo',
    forma: 'distribucion',
  },

  // --- Bloque tres: China en la economía del lugar donde uno vive ----------
  {
    id: 'riesgos',
    bloque: 'territorio',
    titulo: 'Más riesgos que oportunidades',
    bajada: 'Acuerdo con que el acercamiento a China generó más riesgos en su comuna.',
    variable: 'p7',
    ancho: 'medio',
    forma: 'distribucion',
  },
  {
    id: 'rol-china',
    bloque: 'territorio',
    titulo: 'Qué rol cumple China en su comuna',
    bajada: 'Proveedor cae y inversor sube: la presencia china deja de ser solo mercancías.',
    variable: 'p8',
    ancho: 'medio',
    forma: 'distribucion',
  },

  // --- Bloque cuatro: inversión y capacidad del Estado ---------------------
  {
    id: 'screening',
    bloque: 'inversion',
    titulo: 'Poder limitar inversiones en sectores estratégicos',
    bajada: 'Tres cuartos lo piden desde 2023, sin moverse entre oleadas ni entre gobiernos.',
    variable: 'p19',
    ancho: 'completo',
    forma: 'serie-porcentaje',
    codigos: [1],
    advertencia: 'En 2025 esta pregunta se respondió después del bloque experimental. La posición en un cuestionario largo importa.',
  },

  // --- Bloque cinco: la China cotidiana ------------------------------------
  {
    id: 'mall',
    bloque: 'cotidiana',
    titulo: 'Vive cerca de un mall chino',
    bajada: 'A menos de diez cuadras.',
    variable: 'p12',
    ancho: 'tercio',
    forma: 'serie-porcentaje',
    codigos: [1],
  },
  {
    id: 'restaurante',
    bloque: 'cotidiana',
    titulo: 'Vive cerca de un restaurante chino',
    bajada: 'A menos de diez cuadras.',
    variable: 'p13',
    ancho: 'tercio',
    forma: 'serie-porcentaje',
    codigos: [1],
  },
  {
    id: 'conoce',
    bloque: 'cotidiana',
    titulo: 'Conoce a alguien de China',
    bajada: 'Personalmente, de China o de ascendencia china.',
    variable: 'p14',
    ancho: 'tercio',
    forma: 'serie-porcentaje',
    codigos: [1],
  },
  {
    id: 'racismo',
    bloque: 'cotidiana',
    titulo: 'Vio contenido racista',
    bajada: 'Noticia, meme o interacción contra personas chinas o asiáticas.',
    variable: 'p18',
    ancho: 'medio',
    forma: 'serie-porcentaje',
    codigos: [1],
    advertencia: 'Que baje puede ser una mejora del clima o una caída de la saliencia del tema. No se lee de un lado solo.',
  },

  // --- Bloque seis: vacunas -----------------------------------------------
  {
    id: 'sinovac',
    bloque: 'vacunas',
    titulo: 'Recibió vacunas Sinovac',
    bajada: 'Al menos una dosis durante la pandemia.',
    variable: 'p9',
    ancho: 'medio',
    forma: 'serie-porcentaje',
    codigos: [1, 2],
    excluidos: [4],
    advertencia: 'En 2025 se agregó «No recuerdo» y se llevó al 17 % de la muestra. Acá esa categoría sale del denominador: sobre todas las respuestas la cifra baja a 62,1 %. El olvido es en sí mismo un hallazgo.',
  },
]

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
  { nombre: null, etiqueta: 'Sin corte' },
  { nombre: 'sexo', etiqueta: 'Género' },
  { nombre: 'edadr', etiqueta: 'Edad' },
  { nombre: 'educacion', etiqueta: 'Educación' },
  { nombre: 'nse', etiqueta: 'Nivel socioeconómico' },
  { nombre: 'p3', etiqueta: 'Ideología' },
]

/** El valor que sigue un módulo, sobre un conjunto de casos ya recortado. */
export function valorDe (modulo: Modulo, casos: Caso[], variable: Variable): number {
  if (modulo.forma === 'serie-media') return media(casos, modulo.variable).media
  return proporcion(casos, variable, modulo.codigos ?? [], { excluidos: modulo.excluidos }).porcentaje
}

export function variableDe (encuesta: Encuesta, nombre: string): Variable | undefined {
  return encuesta.variables.find((v) => v.nombre === nombre)
}
