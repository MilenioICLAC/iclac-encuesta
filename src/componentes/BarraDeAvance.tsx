import { useLayoutEffect, useRef, useState } from 'react'
import { useMovimientoReducido } from '../nucleo/pasos'

/**
 * La barra de avance de una historia: una ola de tinta que un junco va dejando atrás.
 *
 * Decidida en el laboratorio `barra-barco` (25-09-2026), a partir de una ilustración de Felipe:
 * del dibujo quedaron el barco y la tinta; los colores son los de la barra de antes (la tinta en
 * `brand-dark`, lo que falta en gris 200) y las marcas siguen siendo cortes blancos, uno en cada
 * lugar donde algo cambia.
 *
 * La ola tiene período fijo en píxeles, contado desde el borde izquierdo: la tinta y el riel
 * comparten fase y un ancho distinto no estira la ola. Por eso se dibuja con el ancho medido y no
 * en un `viewBox` estirado.
 */

// Del JSON del laboratorio, parámetro por parámetro.
const AMPLITUD = 1.5 // px, alto de la ola sobre su línea media
const PERIODO = 40 // px, largo de una ola
const GROSOR = 6 // px, la tinta
const BARCO = 20 // px, alto visible del junco
const INCLINACION = 0.5 // «se inclina un poco»: la mitad de la pendiente de la ola
const CORTE = 4 // px, cada marca (laboratorio `pausa-corta`: Felipe los pidió un poco más anchos que 2)

const TINTA = '#00776E' // brand-dark
const RIEL = '#E5E7EB' // gray-200
const NEGRO = '#111827' // gray-900, el del texto

// La quilla se hunde en la tinta un 30 % de su grosor; arriba, lo que el barco necesita en la cresta.
const HUNDIDO = GROSOR * 0.3
const ALTO_BARRA = Math.ceil(BARCO + 2 * AMPLITUD + GROSOR / 2 + 2 - HUNDIDO)
const MEDIA = ALTO_BARRA - AMPLITUD - GROSOR / 2 - 1

const ola = (x: number) => MEDIA + AMPLITUD * Math.sin((2 * Math.PI * x) / PERIODO)
const pendiente = (x: number) => AMPLITUD * (2 * Math.PI / PERIODO) * Math.cos((2 * Math.PI * x) / PERIODO)

/** Una cinta entre `x0` y `x1`: borde de arriba de ida y el de abajo de vuelta. */
function cinta (x0: number, x1: number, centro: (x: number) => number, grosor: (x: number) => number) {
  if (x1 - x0 < 0.5) return ''
  const arriba: string[] = []
  const abajo: string[] = []
  for (let x = x0; ; x += 1.5) {
    const xx = Math.min(x, x1)
    const c = centro(xx)
    const t = Math.max(0, grosor(xx)) / 2
    arriba.push(`${xx.toFixed(2)},${(c - t).toFixed(2)}`)
    abajo.push(`${xx.toFixed(2)},${(c + t).toFixed(2)}`)
    if (xx >= x1) break
  }
  return `M${arriba.join('L')}L${abajo.reverse().join('L')}Z`
}

/** El pincel arranca apoyándose (a medio grosor) y la punta se afina a cero en los últimos 18 px. */
function afinar (x: number, fin: number) {
  const inicio = Math.min(1, 0.45 + 0.55 * (x / 10))
  const largo = Math.min(18, fin)
  return inicio * (largo > 0 ? Math.pow(Math.min(1, Math.max(0, (fin - x) / largo)), 0.6) : 1)
}

/**
 * La tinta en tres hebras, como las cerdas de un pincel: cada una con su pulso de grosor, un desvío
 * pequeño y un largo algo distinto en la punta. Donde el pulso cae, una hebra de borde se corta y
 * deja pasar el blanco. Todo es función de `x`: la misma posición se dibuja siempre igual.
 */
function hebras (X: number) {
  if (X <= 0.5) return []
  const separacion = GROSOR / 3
  return [-1, 0, 1].map((s) => {
    const fin = Math.max(0, X - Math.abs(s) * 3)
    const ancho = (x: number) => {
      const pulso = 0.72 + 0.28 * Math.sin(x / 6.1 + s * 1.9) * Math.sin(x / 17.3 + s * 0.7)
      const corte = s !== 0 && Math.sin(x / 11.7 + s * 2.3) * Math.sin(x / 29.9 + s) > 0.62 ? 0.25 : 1
      return (GROSOR / 2.1) * pulso * corte * afinar(x, fin)
    }
    return cinta(0, fin, (x) => ola(x) + s * separacion + 0.35 * Math.sin(x / 7.3 + s * 2), ancho)
  })
}

// El junco, con proa a la derecha. Caja de 40 × 27,5, el alto visible; los sables son cortes blancos.
const JUNCO = {
  ancho: 40,
  alto: 27.5,
  quilla: 26.8,
  casco: 'M1.2 15.6 Q3 19.8 8 20.6 Q20 22 32 20.4 Q36 19.6 39 17.2 Q37.6 22.4 34 25.2 Q31.5 26.8 27 26.8 L11.5 26.8 Q6 26.8 3.6 22.6 Q2 19.6 1.2 15.6 Z',
  mastiles: 'M21 21 V1.8 M31 20 V6.8 M7.2 19.5 V8.4',
  velas: 'M21.4 2.4 L13.2 4.4 Q9.6 12 11.8 20.2 L21.4 20.6 Z M31.4 7.4 L25.6 9 Q23.2 14 24.8 19.6 L31.4 19.8 Z M7.6 8.8 L3.6 10.4 Q2 14 3.2 18 L7.6 18.2 Z',
  sables: 'M12.4 8.4 L21.4 7.5 M11.3 12.6 L21.4 11.9 M11.4 16.6 L21.4 16.2 M24.6 12.6 L31.4 12 M24.4 16.2 L31.4 15.9 M2.9 13.6 L7.6 13.3',
}

export function BarraDeAvance ({ avance, marcas }: { avance: number, marcas: number[] }) {
  const caja = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(0)
  const reducido = useMovimientoReducido()

  useLayoutEffect(() => {
    const nodo = caja.current
    if (!nodo) return
    const medir = () => { setAncho(nodo.clientWidth) }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => { observador.disconnect() }
  }, [])

  const W = ancho
  const X = Math.max(0, Math.min(W, avance * W))
  const escala = BARCO / JUNCO.alto
  const anchoBarco = JUNCO.ancho * escala
  // El barco va centrado en la punta de la tinta, sin salirse de la barra: en 0 y en 100 % se queda
  // en el borde, con la punta bajo el casco.
  const bx = Math.max(anchoBarco / 2, Math.min(W - anchoBarco / 2, X))
  const by = ola(bx) + HUNDIDO
  // Se inclina con la ola; con movimiento reducido, derecho.
  const angulo = reducido ? 0 : (Math.atan(pendiente(bx)) * 180 / Math.PI) * INCLINACION
  const franja = { y: MEDIA - AMPLITUD - GROSOR, alto: 2 * (AMPLITUD + GROSOR) }

  return (
    <div
      ref={caja}
      role="progressbar"
      aria-label="Avance de la historia"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(avance * 100)}
      className="relative grow"
      style={{ height: ALTO_BARRA }}
    >
      {W > 0 && (
        <svg aria-hidden width={W} height={ALTO_BARRA} viewBox={`0 0 ${W} ${ALTO_BARRA}`} className="absolute inset-0 block overflow-visible">
          <path fill={RIEL} d={cinta(X, W, ola, () => Math.max(2, GROSOR * 0.55))} />
          {hebras(X).map((d, i) => <path key={i} fill={TINTA} d={d} />)}
          {/* Las marcas cortan la franja de la ola, no el barco. */}
          {marcas.map((f) => (
            <rect key={f} fill="#fff" x={f * W - CORTE / 2} y={franja.y} width={CORTE} height={franja.alto} />
          ))}
          <g transform={`translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${angulo.toFixed(2)}) scale(${escala.toFixed(4)}) translate(${-JUNCO.ancho / 2} ${-JUNCO.quilla})`}>
            <path d={JUNCO.mastiles} stroke={NEGRO} strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <path d={JUNCO.velas} fill={NEGRO} />
            <path d={JUNCO.sables} stroke="#fff" strokeWidth={1.1} fill="none" strokeLinecap="round" />
            <path d={JUNCO.casco} fill={NEGRO} />
          </g>
        </svg>
      )}
    </div>
  )
}
