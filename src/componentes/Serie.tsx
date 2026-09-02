import { escalaDe } from '../nucleo/escala'
import { numero, porcentaje } from '../locale'

/**
 * Una variable a lo largo de las tres oleadas.
 *
 * Tres puntos no son una tendencia, así que la figura no dibuja una curva suavizada ni
 * extrapola: puntos unidos por segmentos rectos, con el valor escrito al lado de cada uno.
 * El valor va escrito porque el color de marca da 2,89:1 contra el fondo y no alcanza para
 * cargar información solo.
 *
 * **Una oleada donde la pregunta no se hizo se dibuja como un hueco, no como un cero.** Es
 * la única señal de que ahí no hubo pregunta, y confundirla con un cero es el error que la
 * figura tiene que hacer imposible.
 */

export interface Punto {
  ola: number
  valor: number | null
  base: number
}

interface Props {
  puntos: Punto[]
  /** 'porcentaje' escala 0-100 y escribe con %. 'media' escala a los datos. */
  unidad: 'porcentaje' | 'media'
  /** Varias series en la misma figura, cada una con su etiqueta. */
  etiqueta?: string
  color?: string
}

const ALTO = 132
const PAD_Y = 18

export default function Serie ({ puntos, unidad, etiqueta, color = '#00776E' }: Props) {
  const escala = escalaDe([puntos], unidad)
  return <Trazo puntos={puntos} escala={escala} unidad={unidad} etiqueta={etiqueta} color={color} />
}

export function Trazo ({
  puntos, escala, unidad, etiqueta, color = '#00776E', mostrarEjeX = true,
}: Props & { escala: { min: number, max: number }, mostrarEjeX?: boolean }) {
  const ancho = 100
  const x = (i: number) => (puntos.length === 1 ? ancho / 2 : (i * ancho) / (puntos.length - 1))
  const y = (v: number) => {
    const t = (v - escala.min) / (escala.max - escala.min || 1)
    return ALTO - PAD_Y - t * (ALTO - PAD_Y * 2)
  }

  const conDato = puntos.map((p, i) => ({ ...p, i })).filter((p) => p.valor !== null)
  const fmt = (v: number) => (unidad === 'porcentaje' ? porcentaje(v, 0) : v.toFixed(1))

  // Los tramos se cortan donde falta una oleada, en vez de saltarla con una línea recta que
  // insinuaría continuidad.
  const tramos: { i: number, valor: number }[][] = []
  let actual: { i: number, valor: number }[] = []
  for (const p of puntos.map((p, i) => ({ ...p, i }))) {
    if (p.valor === null) { if (actual.length) tramos.push(actual); actual = [] } else {
      actual.push({ i: p.i, valor: p.valor })
    }
  }
  if (actual.length) tramos.push(actual)

  return (
    <figure className="mt-1">
      {etiqueta && <figcaption className="mb-1 text-xs text-gray-500">{etiqueta}</figcaption>}
      <svg viewBox={`-6 0 ${ancho + 12} ${ALTO}`} className="w-full" role="img"
        aria-label={`${etiqueta ?? 'Serie'}: ${conDato.map((p) => `${p.ola} ${fmt(p.valor!)}`).join(', ')}`}
      >
        {tramos.map((tramo, k) => (
          <polyline
            key={k}
            points={tramo.map((p) => `${x(p.i)},${y(p.valor)}`).join(' ')}
            fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"
          />
        ))}
        {conDato.map((p) => (
          <g key={p.ola}>
            <circle cx={x(p.i)} cy={y(p.valor!)} r="3.4" fill="white" stroke={color} strokeWidth="1.6" />
            <text
              x={x(p.i)} y={y(p.valor!) - 8} textAnchor="middle"
              className="fill-gray-900 text-[9px] font-medium tabular-nums"
            >
              {fmt(p.valor!)}
            </text>
          </g>
        ))}
        {mostrarEjeX && puntos.map((p, i) => (
          <text key={p.ola} x={x(i)} y={ALTO - 3} textAnchor="middle" className="fill-gray-500 text-[8px] tabular-nums">
            {p.ola}
          </text>
        ))}
      </svg>

      {puntos.some((p) => p.valor === null) && (
        <p className="mt-1 text-xs text-gray-500">
          Sin dato en {puntos.filter((p) => p.valor === null).map((p) => p.ola).join(' y ')}: la pregunta no se hizo esa oleada.
        </p>
      )}
      <p className="sr-only">
        {conDato.map((p) => `${p.ola}: ${fmt(p.valor!)} sobre ${numero(p.base)} casos`).join('. ')}
      </p>
    </figure>
  )
}
