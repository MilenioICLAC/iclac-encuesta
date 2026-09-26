import { createContext, useContext } from 'react'

/**
 * La tarjeta elegida y dónde estaban todas al hacer clic (ver `Transicion.tsx`), y en qué punto de
 * su vaivén iba la cuchara, para que las copias sigan desde ahí y no salten al empezar.
 */
export interface Eleccion { indice: number, cajas: DOMRect[], vaiven?: number }

interface Contexto {
  iniciar: (eleccion: Eleccion) => void
  enCurso: boolean
  /** La historia de la que se acaba de volver al menú, o `null` si se llegó de otra parte. */
  volviendoDe: string | null
}

export const TransicionHistoria = createContext<Contexto>({ iniciar: () => {}, enCurso: false, volviendoDe: null })

export const useTransicionHistoria = () => useContext(TransicionHistoria)
