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
}
