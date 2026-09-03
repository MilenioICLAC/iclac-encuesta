import { useState } from 'react'
import type { Caso, Encuesta } from '../nucleo/tipos'
import { porGrupo } from '../nucleo/agregar'
import { CORTES } from '../nucleo/modulos'
import { numero } from '../locale'

/**
 * Cómo se reparten las respuestas del termómetro de 0 a 100.
 *
 * El promedio esconde la forma: dos oleadas con la misma media pueden tener una distribución
 * concentrada en el centro o partida en dos modas. Esta figura es la que muestra eso, y es la
 * que permite preguntarse si el aumento del comercio con China **polarizó** las opiniones en
 * vez de moverlas en bloque, que es lo que Eichenauer y sus coautores encuentran con datos de
 * Latinobarómetro para dieciocho países.
 *
 * **Se ve el pico en los múltiplos de diez**, y no es un defecto del suavizado: la gente
 * escribe números redondos. Con el suavizado del monitor esos picos se disimulan; acá el
 * ancho de banda es chico a propósito, para que el redondeo quede a la vista en vez de
 * quedar escondido bajo una curva bonita.
 */

const ANCHO = 320
const ALTO = 150
// El margen lateral tiene que alcanzar para la mitad de «100», que va centrada bajo el
// extremo derecho del eje. Con 6 se salía 2 px del lienzo.
const PAD = { arriba: 8, abajo: 20, izquierda: 10, derecha: 12 }
const COLORES = ['#00544D', '#00A89C', '#F56A0D', '#0176AF', '#7C7B7B', '#A344BA', '#E5087D']

interface Props {
  encuesta: Encuesta
  casos: Caso[]
  corte: string | null
  variable: string
}

/** Densidad por kernel gaussiano, evaluada en una grilla de 0 a 100. */
function densidad (valores: number[], anchoBanda: number) {
  const grilla = Array.from({ length: 101 }, (_, i) => i)
  if (valores.length === 0) return grilla.map((x) => ({ x, y: 0 }))

  const factor = 1 / (valores.length * anchoBanda * Math.sqrt(2 * Math.PI))
  return grilla.map((x) => ({
    x,
    y: factor * valores.reduce((s, v) => s + Math.exp(-0.5 * ((x - v) / anchoBanda) ** 2), 0),
  }))
}

export default function Densidad ({ encuesta, casos, corte, variable }: Props) {
  const [apilar, setApilar] = useState(false)

  const orden = CORTES.find((c) => c.nombre === corte)?.orden
  const grupos = corte
    ? porGrupo(casos, corte, encuesta.variables, orden)
    : [{ clave: 'total', etiqueta: 'Todas las respuestas', casos }]

  const series = grupos.map((g) => {
    const valores = g.casos.map((c) => c[variable]).filter((v): v is number => typeof v === 'number')
    return { etiqueta: g.etiqueta, n: valores.length, curva: densidad(valores, 4) }
  }).filter((s) => s.n >= 20)

  if (series.length === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay respuestas suficientes para este recorte.</p>
  }

  const tope = Math.max(...series.flatMap((s) => s.curva.map((p) => p.y)))
  const x = (v: number) => PAD.izquierda + (v / 100) * (ANCHO - PAD.izquierda - PAD.derecha)
  const y = (v: number) => ALTO - PAD.abajo - (v / tope) * (ALTO - PAD.arriba - PAD.abajo)

  return (
    <div>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img"
        aria-label={`Distribución de las respuestas de 0 a 100${series.length > 1 ? `, por ${series.length} grupos` : ''}`}
      >
        <line x1={PAD.izquierda} x2={ANCHO - PAD.derecha} y1={y(0)} y2={y(0)} stroke="#E5E7EB" strokeWidth="1" />
        {[0, 25, 50, 75, 100].map((v) => (
          <text key={v} x={x(v)} y={ALTO - 6} textAnchor="middle" className="fill-gray-500 text-[8px] tabular-nums">{v}</text>
        ))}

        {series.map((s, i) => (
          <g key={s.etiqueta}>
            <path
              d={`M ${x(0)},${y(0)} ${s.curva.map((p) => `L ${x(p.x)},${y(p.y)}`).join(' ')} L ${x(100)},${y(0)} Z`}
              fill={COLORES[i % COLORES.length]}
              fillOpacity={apilar ? 0.22 : 0.1}
            />
            <polyline
              points={s.curva.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')}
              fill="none" stroke={COLORES[i % COLORES.length]} strokeWidth="1.6"
            />
          </g>
        ))}
      </svg>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        {series.length > 1 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {series.map((s, i) => (
              <li key={s.etiqueta} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
                <span className="truncate">{s.etiqueta}</span>
                <span className="tabular-nums text-gray-400">{numero(s.n)}</span>
              </li>
            ))}
          </ul>
        )}
        <label className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={apilar} onChange={(e) => setApilar(e.target.checked)} className="rounded border-gray-300" />
          Rellenar
        </label>
      </div>

      <p className="mt-1 text-xs leading-snug text-gray-500">
        Los picos en 0, 50 y 100 son reales: la gente escribe números redondos. El promedio esconde
        esta forma, y con ella la pregunta de si las opiniones se polarizan o se mueven en bloque.
      </p>
    </div>
  )
}
