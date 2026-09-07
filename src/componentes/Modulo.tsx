import type { ReactNode } from 'react'
import type { Variable } from '../nucleo/tipos'
import type { Modulo as Def } from '../nucleo/modulos'
import { numero } from '../locale'

/**
 * La anatomía de un módulo, idéntica para los doce.
 *
 * Título, enunciado completo de la pregunta, figura, y un pie de tres datos **siempre
 * presente**: base efectiva, oleadas en que se hizo la pregunta, y si es o no comparable
 * entre oleadas.
 *
 * Ese pie es la respuesta de diseño al tercer hecho de los datos: que una pregunta conserve
 * su nombre de variable no significa que sea la misma pregunta. Con el pie impreso en cada
 * figura, la comparabilidad deja de ser algo que hay que recordar.
 */

interface Props {
  definicion: Def
  variable: Variable
  base: number
  children: ReactNode
  /** Llega enfocado desde el recorrido (`#/tablero?foco=<id>`): se marca para que el lector
   *  encuentre de qué figura le hablaron, en una rejilla de veintisiete. */
  destacado?: boolean
}

const ANCHO = {
  tercio: 'md:col-span-2',
  medio: 'md:col-span-3',
  completo: 'md:col-span-6',
}

export default function Modulo ({ definicion, variable, base, children, destacado = false }: Props) {
  const olas = variable.olas
  const parcial = olas.length < 3
  // Con una sola oleada no hay nada que comparar, así que afirmar comparabilidad sería una
  // contradicción impresa en la propia figura. El diccionario de ICLAC marca
  // `uso_serie_longitudinal = sí` en preguntas que solo se hicieron en 2025, y la figura no
  // tiene por qué repetir esa marca cuando no aplica.
  const comparable = olas.length > 1

  return (
    <article
      id={`modulo-${definicion.id}`}
      // `scroll-mt-40` son los dos pegajosos que hay encima (encabezado y barra de controles) más
      // aire: sin eso el módulo enfocado queda debajo de ellos y parece que el enlace no hizo nada.
      className={`${ANCHO[definicion.ancho]} flex flex-col scroll-mt-40 rounded-lg border bg-white p-4 ${
        destacado ? 'border-brand-dark ring-2 ring-brand-dark/30' : 'border-gray-200'
      }`}
    >
      <h3 className="font-display text-base font-semibold text-gray-900">{definicion.titulo}</h3>
      <p className="mt-0.5 text-sm text-gray-600">{definicion.bajada}</p>

      {variable.etiqueta && (
        <p className="mt-2 text-xs italic leading-snug text-gray-500">{variable.etiqueta}</p>
      )}

      <div className="mt-3 grow">{children}</div>

      {definicion.advertencia && (
        <p className="mt-3 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-snug text-gray-700">
          {definicion.advertencia}
        </p>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span className="tabular-nums">n = {numero(base)}</span>
        <span aria-hidden>·</span>
        <span className={parcial ? 'text-amber-700' : undefined}>
          {olas.length === 1 ? `Solo ${olas[0]}` : parcial ? `Solo ${olas.join(' y ')}` : 'Las tres oleadas'}
        </span>
        {comparable && (
          <>
            <span aria-hidden>·</span>
            <span className={variable.serie ? undefined : 'text-amber-700'}>
              {variable.serie ? 'Comparable entre oleadas' : 'No comparable entre oleadas'}
            </span>
          </>
        )}
      </footer>
    </article>
  )
}
