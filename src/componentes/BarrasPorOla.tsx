import { IDENTIDAD } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'

/**
 * Una variable a lo largo de las oleadas: una barra por oleada.
 *
 * **Reemplaza a la línea de tres puntos** (15-09-2026): tres puntos unidos no son una tendencia,
 * y el lienzo de la línea crecía en alto con el ancho de la tarjeta.
 *
 * La escala va de 0 a 100 en todas las filas, así que dos puntos de diferencia se ven como dos
 * puntos y no como una pendiente. **Parte en cero siempre**: el monitor actual encuadra el
 * termómetro entre 40 y 75 con `oob = squish`, que aplasta lo que queda fuera contra el borde y
 * exagera la pendiente del hallazgo principal, y una barra que no parte en cero miente con su
 * largo. La fila es la de `Distribucion`, con la oleada en el lugar de la categoría.
 *
 * **Una oleada donde la pregunta no se hizo es un hueco con su nombre, no una barra en cero.**
 */

export interface Punto {
  ola: number
  valor: number | null
  base: number
}

interface Props {
  puntos: Punto[]
  /**
   * 'porcentaje' escribe con %, 'media' con un decimal. Las dos se dibujan de 0 a 100: la única
   * media que el producto grafica es la del termómetro (las variables `_val`).
   */
  unidad: 'porcentaje' | 'media'
  /** Qué se está siguiendo, cuando el título de la figura no lo dice. */
  etiqueta?: string
}

export default function BarrasPorOla ({ puntos, unidad, etiqueta }: Props) {
  const conDato = puntos.filter((p): p is Punto & { valor: number } => p.valor !== null && Number.isFinite(p.valor))
  const max = Math.max(100, ...conDato.map((p) => p.valor))
  const fmt = (v: number) => (unidad === 'porcentaje' ? porcentaje(v, 0) : decimal(v))

  return (
    <figure className="mt-2">
      {etiqueta && <figcaption className="mb-1 text-xs text-gray-500">{etiqueta}</figcaption>}
      <div className="flex flex-col gap-[3px]" aria-hidden>
        {puntos.map((p) => {
          const valor = p.valor !== null && Number.isFinite(p.valor) ? p.valor : null
          // Con menos de 30 casos el valor se muestra igual, marcado, como en `Distribucion`.
          const escaso = p.base < 30
          return (
            <div
              key={p.ola}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.5rem] items-center gap-3"
              title={valor === null ? undefined : `${fmt(valor)} sobre ${numero(p.base)} casos`}
            >
              <span className={`text-xs tabular-nums ${valor !== null ? 'text-gray-600' : 'text-gray-400'}`}>
                {p.ola}
              </span>
              {valor === null
                ? (
                  <span className="col-span-2 text-xs italic text-gray-400">
                    {p.valor === null ? 'No se preguntó' : 'Sin respuestas'}
                  </span>
                  )
                : (
                  <>
                    <div className="h-4 rounded-sm bg-gray-100">
                      <div
                        className="h-4 rounded-sm"
                        style={{ width: `${Math.max((100 * valor) / max, 0.6)}%`, backgroundColor: IDENTIDAD[0] }}
                      />
                    </div>
                    <span className={`text-right text-xs tabular-nums ${!escaso ? 'text-gray-900' : 'text-gray-400'}`}>
                      {fmt(valor)}{escaso ? '*' : ''}
                    </span>
                  </>
                  )}
            </div>
          )
        })}
      </div>
      <p className="sr-only">
        {puntos.map((p) => (p.valor === null
          ? `${p.ola}: la pregunta no se hizo`
          : `${p.ola}: ${Number.isFinite(p.valor) ? fmt(p.valor) : 'sin respuestas'} sobre ${numero(p.base)} casos`)).join('. ')}
      </p>
    </figure>
  )
}
