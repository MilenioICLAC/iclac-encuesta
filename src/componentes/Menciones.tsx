import type { Multirespuesta } from '../nucleo/agregar'
import { numero, porcentaje } from '../locale'

/**
 * Una pregunta de selección múltiple: barras horizontales, ordenadas por frecuencia.
 *
 * **Los porcentajes suman más de 100 y eso es correcto**, porque la persona elige varias
 * opciones. Se dice en el pie, y no en un comentario del código, porque quien lee la figura
 * necesita saberlo para no pensar que hay un error.
 *
 * El monitor actual recorta a ocho sectores y agrupa la cola en «Otros sectores» con
 * `fct_lump_n`. Acá se muestran todas: son siete u ocho opciones cerradas del cuestionario,
 * no una cola larga, y esconder dos de ellas obliga al lector a confiar en el recorte.
 */

interface Props {
  datos: Multirespuesta
  /** Comparación opcional, para ver una segunda oleada o grupo contra la principal. */
  contraste?: { etiqueta: string, datos: Multirespuesta }
}

export default function Menciones ({ datos, contraste }: Props) {
  if (datos.base === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay datos disponibles para este recorte.</p>
  }

  const tope = Math.max(...datos.menciones.map((m) => m.porcentaje), 1)

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-[3px]">
        {datos.menciones.map((m) => {
          const otro = contraste?.datos.menciones.find((x) => x.columna === m.columna)
          return (
            <div
              key={m.columna}
              className="grid grid-cols-[minmax(0,10rem)_1fr_3.2rem] items-center gap-2"
              title={`${numero(m.n)} de ${numero(datos.base)} personas`}
            >
              <span className="truncate text-xs text-gray-600" title={m.opcion}>{m.opcion}</span>
              <div className="relative h-4 rounded-sm bg-gray-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-brand-dark"
                  style={{ width: `${(100 * m.porcentaje) / tope}%` }}
                />
                {contraste && otro && (
                  // El contraste va como una marca vertical, no como una segunda barra: la
                  // comparación es «se movió o no», y dos barras apiladas la vuelven difícil.
                  <span
                    className="absolute inset-y-0 w-[2px] bg-gray-900"
                    style={{ left: `${(100 * otro.porcentaje) / tope}%` }}
                    title={`${contraste.etiqueta}: ${porcentaje(otro.porcentaje, 0)}`}
                  />
                )}
              </div>
              <span className="text-right text-xs tabular-nums text-gray-900">
                {porcentaje(m.porcentaje, 0)}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Sobre {numero(datos.base)} personas que contestaron. Se puede elegir más de una opción, así que
        los porcentajes suman más de 100.
        {contraste && <> La marca vertical es {contraste.etiqueta}.</>}
      </p>
    </div>
  )
}
