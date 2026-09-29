import { createContext } from 'react'
import type { Encuesta } from '../nucleo/tipos'

/**
 * De qué historia y de qué datos se arma el pop-up de método (`PopupMetodo.tsx`).
 *
 * Lo publica `CapaRecorrido` una sola vez: lo abren la barra, cada figura y el cierre, y pasarlo
 * por props obligaría a que cada escena lo recibiera solo para reenviarlo.
 *
 * En su propio archivo porque el que solo exporta componentes se recarga en caliente y el que
 * además exporta un contexto no (`react-refresh/only-export-components`).
 */
export const DatosMetodo = createContext<{ encuesta: Encuesta, historia: string, nombre: string } | null>(null)
