import { createContext, useContext } from 'react'

/** La tarjeta elegida y dónde estaban todas al hacer clic (ver `Transicion.tsx`). */
export interface Eleccion { indice: number, cajas: DOMRect[] }

interface Contexto {
  iniciar: (eleccion: Eleccion) => void
  enCurso: boolean
  /** La historia de la que se acaba de volver al menú, o `null` si se llegó de otra parte. */
  volviendoDe: string | null
}

export const TransicionHistoria = createContext<Contexto>({ iniciar: () => {}, enCurso: false, volviendoDe: null })

export const useTransicionHistoria = () => useContext(TransicionHistoria)
