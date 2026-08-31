import { useState } from 'react'
import type { Barra } from '../distribucion'
import { numero, porcentaje } from '../locale'

/**
 * Barras horizontales de una sola serie.
 *
 * Una serie, un color: la marca lleva `brand` y el texto va en tinta, nunca en el color de
 * la serie. Sin leyenda, porque con una sola serie el título ya dice qué se está mirando.
 *
 * El color de marca da 2,89:1 contra el fondo, bajo el mínimo de 3:1, así que **el valor va
 * escrito en la punta de cada barra** y además existe la vista de tabla. Eso es lo que hace
 * legible el gráfico sin depender del color.
 *
 * Las barras miden 16 px (el tope es 24), el extremo del dato va redondeado a 4 px y el
 * arranque queda recto sobre la línea base. Entre barras hay 2 px de fondo, no un borde.
 */

const TOPE_BARRAS = 25

interface Props {
  barras: Barra[]
  /** Máximo de la escala. Se pasa aparte para que dos gráficos comparables no se autoescalen distinto. */
  maximo?: number
}

interface Posicion { x: number, y: number }

export default function Barras ({ barras, maximo }: Props) {
  const [activa, setActiva] = useState<{ barra: Barra, en: Posicion } | null>(null)
  const [verTodas, setVerTodas] = useState(false)

  if (barras.length === 0) {
    return <p className="text-sm text-gray-500">Sin respuestas para mostrar.</p>
  }

  const visibles = verTodas ? barras : barras.slice(0, TOPE_BARRAS)
  const cola = barras.length - visibles.length
  const tope = maximo ?? Math.max(...barras.map((b) => b.n))

  return (
    <div>
      <div className="flex flex-col gap-[2px]">
        {visibles.map((barra) => (
          <div
            key={barra.clave}
            tabIndex={0}
            role="img"
            aria-label={`${barra.etiqueta}: ${numero(barra.n)} casos${barra.sentinela ? '' : `, ${porcentaje(barra.porcentaje)}`}`}
            className="grid grid-cols-[minmax(0,14rem)_1fr] items-center gap-3 rounded-sm py-[3px] outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-dark"
            onPointerMove={(e) => setActiva({ barra, en: { x: e.clientX, y: e.clientY } })}
            onPointerLeave={() => setActiva(null)}
            onFocus={(e) => {
              const caja = e.currentTarget.getBoundingClientRect()
              setActiva({ barra, en: { x: caja.left + caja.width / 2, y: caja.top } })
            }}
            onBlur={() => setActiva(null)}
          >
            <span
              className={`truncate text-right text-[13px] ${barra.sentinela ? 'italic text-gray-400' : 'text-gray-700'}`}
              title={barra.etiqueta}
            >
              {barra.etiqueta}
            </span>

            <div className="flex items-center gap-2">
              <div
                className={`h-4 rounded-r ${barra.sentinela ? 'bg-gray-300' : 'bg-brand'}`}
                style={{ width: `${tope > 0 ? Math.max(2, (100 * barra.n) / tope) : 0}%` }}
              />
              <span className="shrink-0 text-[13px] tabular-nums text-gray-600">
                {numero(barra.n)}
                {!barra.sentinela && <span className="text-gray-400"> · {porcentaje(barra.porcentaje)}</span>}
              </span>
            </div>
          </div>
        ))}
      </div>

      {cola > 0 && (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          className="mt-2 text-[13px] text-brand-dark underline underline-offset-2 hover:text-gray-900"
        >
          Ver las {numero(cola)} categorías restantes
        </button>
      )}

      {activa && (
        <div
          className="pointer-events-none fixed z-20 max-w-xs rounded border border-gray-200 bg-white px-3 py-2 text-[13px] shadow-lg"
          style={{ left: activa.en.x + 14, top: activa.en.y + 14 }}
        >
          <div className="flex items-baseline gap-2">
            <span className="h-[2px] w-4 shrink-0 rounded-full bg-brand" />
            <span className="font-semibold tabular-nums text-gray-900">
              {numero(activa.barra.n)}
              {!activa.barra.sentinela && ` · ${porcentaje(activa.barra.porcentaje)}`}
            </span>
          </div>
          <div className="mt-1 text-gray-600">{activa.barra.etiqueta}</div>
          {activa.barra.sentinela && (
            <div className="mt-1 text-gray-400">Fuera de la base del porcentaje</div>
          )}
        </div>
      )}
    </div>
  )
}
