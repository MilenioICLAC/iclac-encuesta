/** Contrato de lo que escribe `npm run etl <año>`. Ver scripts/etl.mjs. */

export type TipoVariable = 'administrativa' | 'categorica' | 'numerica' | 'texto'

export interface Categoria {
  codigo: number
  etiqueta: string
  /** «Prefiero no responder», «No informada». No es una respuesta, así que no entra en la base del porcentaje. */
  sentinela?: boolean
}

export interface Variable {
  nombre: string
  original: string
  enunciado: string | null
  /** El .dta recorta los enunciados a 80 bytes. Media pregunta no se publica como si fuera la pregunta. */
  enunciadoTruncado: boolean
  tipo: TipoVariable
  publicada: boolean
  categorias: Categoria[] | null
  faltantes: number
  /** Códigos presentes en los datos que el libro no documenta. */
  huerfanos?: number[]
}

export type Caso = Record<string, number | string | null>

export interface Oleada {
  oleada: number
  generado: string
  fuentes: {
    datos: string
    libroDeCodigos: string
    releaseDta: number
    codificacion: string
  }
  n: number
  correcciones: string[]
  revisiones: string[]
  variables: Variable[]
  casos: Caso[]
}
