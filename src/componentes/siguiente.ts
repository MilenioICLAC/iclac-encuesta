import { createContext } from 'react'
import type { Traducible } from '../locale'

/**
 * La historia que viene después de la que se está leyendo, para la salida del cierre.
 *
 * **Va por contexto y no por props** porque el registro de historias (`src/historias/indice.tsx`)
 * importa las historias, y las historias importan la capa: si la capa leyera el registro, el ciclo
 * de módulos quedaría cerrado. La ruta de cada historia la arma `App` desde el registro y deja acá
 * la siguiente. `null` es la última: su cierre ofrece volver al menú.
 */
export interface HistoriaSiguiente {
  numero: number
  nombre: Traducible
  pregunta: Traducible
  ruta: string
}

export const Siguiente = createContext<HistoriaSiguiente | null>(null)

/** El número de la historia que se está leyendo, para el rótulo del cierre («Historia 3»). */
export const NumeroHistoria = createContext<number | null>(null)
