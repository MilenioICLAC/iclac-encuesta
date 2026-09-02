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

export interface Encuesta {
  generado: string
  fuente: string
  procedencia: string
  olas: number[]
  n: Record<string, number>
  bloques: Bloque[]
  variables: Variable[]
  casos: Caso[]
}
