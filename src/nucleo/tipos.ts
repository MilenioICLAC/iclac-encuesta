/** Contrato de lo que escribe `npm run etl:combinada`. Ver scripts/etl_combinada.mjs. */

export type Ola = 2023 | 2024 | 2025

export interface Categoria {
  codigo: number
  etiqueta: string
  /** La etiqueta de este código no es la misma en todas las oleadas. */
  difiereEntreOlas: boolean
}

export interface Variable {
  nombre: string
  etiqueta: string | null
  tipo: string | null
  /** En qué oleadas se preguntó. Una variable ausente de una ola no es un cero. */
  olas: number[]
  /**
   * Si ICLAC la marca como comparable entre oleadas, en la columna
   * `uso_serie_longitudinal` de su diccionario. Es criterio metodológico suyo, no nuestro.
   */
  serie: boolean
  comparabilidad: string | null
  nota: string | null
  /** Uno de los seis bloques temáticos de la guía de Urdinez, o null si no entra en ninguno. */
  bloque: string | null
  categorias: Categoria[] | null
}

export interface Bloque {
  id: string
  titulo: string
}

export type Caso = Record<string, number | string | null>

export interface OpcionMultiple {
  columna: string
  opcion: string
  olas: number[]
}

/**
 * Una pregunta de selección múltiple. En la base cada opción es una columna binaria, así que
 * el grupo es la pregunta y `opciones` son sus alternativas.
 */
export interface Multiple {
  id: string
  titulo: string
  opciones: OpcionMultiple[]
}

export interface Region {
  codigo: number
  etiqueta: string
  /** Posición de norte a sur, para ordenar el eje. */
  orden: number
}

export interface Palabra {
  palabra: string
  n: number
}

export interface GrupoNube {
  id: string
  etiqueta: string
  /** Personas que contestaron la pregunta en ese grupo. Es el denominador del porcentaje. */
  base?: number
  palabras: Palabra[]
}

/**
 * Una respuesta abierta, ya contada. **No trae el texto que la persona escribió**: la
 * tokenización ocurre en el ETL y al navegador solo viajan frecuencias.
 */
export interface NubePalabras {
  id: string
  titulo: string
  olas: number[]
  total: Palabra[]
  /** Personas que contestaron la pregunta, en total y por oleada. */
  base?: number
  baseOla?: Record<string, number>
  porOla: Record<string, Palabra[]>
  porIdeologia?: GrupoNube[]
  porRol?: GrupoNube[]
}

/**
 * Una comparación entre dos oleadas, con su prueba.
 *
 * `p` sale de una prueba de permutación: qué proporción de las barajadas al azar de la etiqueta de
 * año produce una diferencia al menos tan grande como la observada. `ic` es el intervalo percentil
 * del bootstrap. `estandarizada` es la misma diferencia con la composición de edad y sexo fija, y
 * sirve para separar «piensan distinto» de «contestó otra gente».
 *
 * **No son margen de error**: la muestra no es probabilística y estos números comparan las oleadas
 * entre sí, no estiman a la población. El artefacto lo declara en `contrastes.metodo.alcance`.
 */
export interface Comparacion {
  desde: number
  hasta: number
  a: number
  b: number
  n: [number, number]
  diferencia: number
  ic: [number, number]
  p: number
  estandarizada: number | null
}

export interface Medida {
  id: string
  etiqueta: string
  unidad: string
  comparaciones: Comparacion[]
}

/** La misma pregunta contestada por la misma persona sobre dos países: la resta va dentro del caso. */
export interface Brecha {
  id: string
  etiqueta: string
  unidad: string
  porOla: { ola: number, n: number, diferencia: number, ic: [number, number], p: number }[]
}

/**
 * Comparaciones entre grupos **dentro** de cada oleada, además de entre oleadas.
 *
 * `brecha` compara las dos puntas del grupo (izquierda y derecha, por ejemplo) en esa oleada;
 * `entreOlas` compara cada tramo consigo mismo entre oleadas, que es lo que dice quién se movió.
 */
export interface Grupo {
  id: string
  etiqueta: string
  unidad: string
  porOla: {
    ola: number
    tramos: { nombre: string, media: number | null, n: number }[]
    brecha: { entre: string[], diferencia: number, ic: [number, number], p: number } | null
  }[]
  entreOlas: { tramo: string, desde: number, hasta: number, n: [number, number], diferencia: number, ic: [number, number], p: number }[]
}

/**
 * Una regresión sobre una escala, con lo que hace falta para contar el experimento: el promedio y
 * el número de casos de cada punto, la recta con el intervalo de su pendiente, y **qué punto la
 * sostiene**, que es el que más la mueve al salir.
 */
export interface Regresion {
  id: string
  etiqueta: string
  x: string
  y: string
  rango: [number, number]
  porOla: {
    ola: number
    puntos: { x: number, n: number, media: number | null, ic: [number, number] | null }[]
    recta: Recta
    sostiene: { x: number, n: number, cambio: number, recta: Recta } | null
  }[]
}

export interface Recta {
  b: number
  a: number
  centro: [number, number]
  r2: number
  n: number
  ic: [number, number]
  p: number
}

export interface Contrastes {
  metodo: { prueba: string, rondas: number, semilla: number, intervalo: string, alcance: string }
  medidas: Medida[]
  brechas: Brecha[]
  grupos: Grupo[]
  regresiones: Regresion[]
}

export interface Encuesta {
  generado: string
  fuente: string
  procedencia: string
  olas: number[]
  n: Record<string, number>
  bloques: Bloque[]
  multiples: Multiple[]
  nubes: NubePalabras[]
  regiones: Region[]
  variables: Variable[]
  casos: Caso[]
  contrastes?: Contrastes
}
