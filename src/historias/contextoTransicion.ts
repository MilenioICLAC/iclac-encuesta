import { createContext, useContext } from 'react'

/**
 * La tarjeta elegida y dónde estaban las tarjetas al hacer clic (ver `Transicion.tsx`), y en qué
 * punto de su vaivén iba la cuchara, para que las copias sigan desde ahí y no salten al empezar.
 *
 * Se elige desde dos lugares: el menú, con las seis tarjetas, y la salida del cierre de una
 * historia, con una sola en miniatura (`mini`; las demás cajas van en `null`). `desde` es la ruta
 * donde se hizo el clic: si la ruta cambia antes de navegar, la transición se retira.
 */
export interface Eleccion {
  indice: number
  cajas: (DOMRect | null)[]
  vaiven?: number
  desde: string
  mini?: boolean
}

interface Contexto {
  iniciar: (eleccion: Eleccion) => void
  enCurso: boolean
  /** La historia de la que se acaba de volver al menú, o `null` si se llegó de otra parte. */
  volviendoDe: string | null
}

export const TransicionHistoria = createContext<Contexto>({ iniciar: () => {}, enCurso: false, volviendoDe: null })

export const useTransicionHistoria = () => useContext(TransicionHistoria)
