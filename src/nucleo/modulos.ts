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

export type Forma = 'serie-media' | 'serie-porcentaje' | 'distribucion' | 'multiple' | 'por-region' | 'ideologia' | 'densidad'

export interface Modulo {
  id: string
  bloque: string
  titulo: string
  /** Qué mide, en una línea. No es el enunciado: eso sale del diccionario. */
  bajada: string
  variable: string
  ancho: Ancho
  /** Cómo se lee la figura. */
  forma: Forma
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

  {
    id: 'densidad',
    bloque: 'potencias',
    titulo: 'Cómo se reparten las respuestas',
    bajada: 'El promedio esconde la forma: dos oleadas con la misma media pueden repartirse muy distinto.',
    variable: 'p5_1_val',
    ancho: 'medio',
    forma: 'densidad',
  },
  {
    id: 'ideologia',
    bloque: 'potencias',
    titulo: 'Opinión sobre China según ideología',
    bajada: 'Una línea por oleada, porque el gradiente no es el mismo en las tres.',
    variable: 'p5_1_val',
    ancho: 'medio',
    forma: 'ideologia',
    advertencia: 'El hallazgo de que la evaluación cae hacia la derecha es de 2023, con 14,5 puntos entre los extremos. En 2024 se invierte (la derecha evalúa mejor, por 4,3 puntos) y en 2025 queda en 5,7. Juntar las tres oleadas lo hace desaparecer, así que la figura las separa.',
  },
  {
    id: 'democracia',
    bloque: 'potencias',
    titulo: 'Importa que el socio comercial sea democrático',
    bajada: 'Cuánto pesa el régimen político del país con el que Chile se relaciona económicamente.',
    variable: 'p6',
    ancho: 'medio',
    forma: 'distribucion',
    advertencia: 'Cambio menor de redacción entre oleadas: en 2023 dice «gobierno democrático» y en 2025 «democracia». Las categorías son idénticas.',
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
    id: 'derechos-humanos',
    bloque: 'geopolitica',
    titulo: 'Priorizar derechos humanos con China',
    bajada: 'Si Chile debe poner la agenda de derechos humanos en la relación con China.',
    variable: 'p37',
    ancho: 'medio',
    forma: 'distribucion',
    advertencia: 'Solo se preguntó en 2025, y después del bloque experimental. No se lee como una medición limpia.',
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
    id: 'rol-por-region',
    bloque: 'territorio',
    titulo: 'Qué rol cumple China, región por región',
    bajada: 'La única figura con desagregación territorial completa, y la que justifica el diseño muestral.',
    variable: 'p8',
    ancho: 'completo',
    forma: 'por-region',
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

  {
    id: 'sectores',
    bloque: 'inversion',
    titulo: 'En qué sectores limitar',
    bajada: 'El cobre primero, la distribución eléctrica tercera pese a concentrar la mayoría de la inversión china.',
    variable: 'p20',
    ancho: 'medio',
    forma: 'multiple',
    advertencia: 'Solo se preguntó en 2023 y 2024.',
  },
  {
    id: 'efectos',
    bloque: 'inversion',
    titulo: 'Efectos de la inversión china en su comuna',
    bajada: 'Qué observa la gente donde vive, no qué opina en general.',
    variable: 'p22',
    ancho: 'medio',
    forma: 'multiple',
    advertencia: 'Solo se preguntó en 2023 y 2024.',
  },
  {
    id: 'inversion-extranjera',
    bloque: 'inversion',
    titulo: 'Opinión sobre recibir más inversión',
    bajada: 'En 2023 preguntaba por inversión de China; desde 2024, por inversión extranjera en general.',
    variable: 'p21',
    ancho: 'medio',
    forma: 'distribucion',
    advertencia: 'No es serie: la pregunta cambió de objeto entre 2023 y 2024, así que las oleadas miden cosas distintas. Además en 2025 se respondió después del bloque experimental.',
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

  {
    id: 'medios',
    bloque: 'cotidiana',
    titulo: 'Cómo se informa de asuntos internacionales',
    bajada: 'Fuentes de información.',
    variable: 'p18a',
    ancho: 'medio',
    forma: 'multiple',
    advertencia: 'En 2023 no se preguntó, y en 2025 cambió de «cómo te informas sobre China» a «sobre asuntos internacionales»: no es la misma pregunta.',
  },
  {
    id: 'marcas',
    bloque: 'cotidiana',
    titulo: 'Puede nombrar tres marcas chinas',
    bajada: 'Conocimiento espontáneo de empresas chinas.',
    variable: 'p6a_1',
    ancho: 'tercio',
    forma: 'serie-porcentaje',
    codigos: [1],
  },
  {
    id: 'paises',
    bloque: 'cotidiana',
    titulo: 'Países que ha visitado',
    bajada: 'Contacto directo con los países que la encuesta pide evaluar.',
    variable: 'p6b',
    ancho: 'medio',
    forma: 'multiple',
    advertencia: 'Solo se preguntó en 2025.',
  },
  {
    id: 'buses',
    bloque: 'cotidiana',
    titulo: 'Sabía que los buses eléctricos son chinos',
    bajada: 'La presencia china que funciona sin ser percibida como tal.',
    variable: 'p18e',
    ancho: 'tercio',
    forma: 'distribucion',
    advertencia: 'Solo se preguntó en 2025.',
  },
  {
    id: 'electrificacion',
    bloque: 'cotidiana',
    titulo: 'Evaluación de la electrificación de la flota',
    bajada: 'La misma gente que en su mayoría no sabía de dónde venían los buses.',
    variable: 'p18d',
    ancho: 'tercio',
    forma: 'distribucion',
    advertencia: 'Solo se preguntó en 2025.',
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
  {
    id: 'opinion-sinovac',
    bloque: 'vacunas',
    titulo: 'Opinión de las vacunas Sinovac',
    bajada: 'Qué quedó de la reputación que China ganó proveyendo un bien público concreto.',
    variable: 'p11',
    ancho: 'medio',
    forma: 'distribucion',
  },
  {
    id: 'preferencia-vacuna',
    bloque: 'vacunas',
    titulo: 'Hubiese preferido Pfizer o Moderna',
    bajada: 'De haber estado disponibles en ese momento.',
    variable: 'p10',
    ancho: 'medio',
    forma: 'distribucion',
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

/** El valor que sigue un módulo, sobre un conjunto de casos ya recortado. */
export function valorDe (modulo: Modulo, casos: Caso[], variable: Variable): number {
  if (modulo.forma === 'serie-media') return media(casos, modulo.variable).media
  return proporcion(casos, variable, modulo.codigos ?? [], { excluidos: modulo.excluidos }).porcentaje
}

export function variableDe (encuesta: Encuesta, nombre: string): Variable | undefined {
  return encuesta.variables.find((v) => v.nombre === nombre)
}
