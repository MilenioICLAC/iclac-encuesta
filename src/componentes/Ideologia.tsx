import { useState } from 'react'
import type { Caso, Encuesta } from '../nucleo/tipos'
import { filtrar, media, regresion } from '../nucleo/agregar'
import { decimal, numero } from '../locale'

/**
 * Opinión sobre China según autoubicación ideológica, **una línea por oleada**.
 *
 * Es la figura que abre el monitor y su hallazgo más citado: en Chile la evaluación de China
 * cae hacia la derecha del espectro, al revés de lo que encontraron Morgenstern y Bohigues
 * con datos regionales, y eso convierte al caso en desviado.
 *
 * **Pero el gradiente no es estable entre oleadas, y por eso no se pueden juntar.** Medido
 * sobre la base canónica, la diferencia entre los extremos es de 14,5 puntos en 2023, se
 * **invierte** en 2024 (la derecha evalúa mejor, por 4,3 puntos) y queda en 5,7 en 2025.
 * Agrupando las tres, el efecto desaparece. Una sola línea sobre las tres oleadas mostraría
 * una recta plana y escondería que el patrón se dio vuelta.
 *
 * **El eje parte en cero.** El monitor actual lo encuadra entre 40 y 75 con `oob = squish`,
 * que aplasta contra el borde en vez de recortar y exagera la pendiente.
 *
 * El `R²` va siempre a la vista junto a la pendiente: incluso en 2023, donde el gradiente es
 * claro, la ideología explica cerca del 1 % de la variación. Es una tendencia de promedios,
 * no una regla sobre personas.
 */

const ALTO = 210
const PAD = { arriba: 12, abajo: 30, izquierda: 30, derecha: 6 }
const ANCHO = 320
const ESCALA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const COLOR_OLA: Record<number, string> = { 2023: '#00544D', 2024: '#00A89C', 2025: '#F56A0D' }

interface Props {
  encuesta: Encuesta
  olas: number[]
  soloIndependientes: boolean
  variable: string
}

export default function Ideologia ({ encuesta, olas, soloIndependientes, variable }: Props) {
  const [verAjuste, setVerAjuste] = useState(false)

  const series = olas.map((ola) => {
    const casos: Caso[] = filtrar(encuesta, { olas: [ola], soloIndependientes })
    const puntos = ESCALA.map((p) => {
      const m = media(casos.filter((c) => Number(c.p3) === p), variable)
      return { p, valor: m.base > 0 ? m.media : null, n: m.base }
    })
    return { ola, puntos, ajuste: regresion(casos, 'p3', variable, ESCALA) }
  }).filter((s) => s.puntos.some((p) => p.valor !== null))

  if (series.length === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay datos disponibles para este recorte.</p>
  }

  const valores = series.flatMap((s) => s.puntos.map((p) => p.valor).filter((v): v is number => v !== null))
  const maximo = Math.min(100, Math.ceil(Math.max(...valores) / 10) * 10)

  const x = (p: number) => PAD.izquierda + ((p - 1) / 9) * (ANCHO - PAD.izquierda - PAD.derecha)
  const y = (v: number) => ALTO - PAD.abajo - (v / maximo) * (ALTO - PAD.arriba - PAD.abajo)

  return (
    <div>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img"
        aria-label={series.map((s) => {
          const dif = diferenciaExtremos(s.puntos)
          return `${s.ola}: ${dif === null ? 'sin datos suficientes' : `${decimal(dif)} puntos entre extremos`}`
        }).join('. ')}
      >
        {[0, maximo / 2, maximo].map((v) => (
          <g key={v}>
            <line x1={PAD.izquierda} x2={ANCHO - PAD.derecha} y1={y(v)} y2={y(v)} stroke="#E5E7EB" strokeWidth="1" />
            <text x={PAD.izquierda - 4} y={y(v) + 3} textAnchor="end" className="fill-gray-500 text-[8px] tabular-nums">{v}</text>
          </g>
        ))}

        {series.map((s) => (
          <g key={s.ola}>
            {verAjuste && s.ajuste && (
              <polyline
                points={s.ajuste.puntos.map((q) => `${x(q.x)},${y(q.y)}`).join(' ')}
                fill="none" stroke={COLOR_OLA[s.ola] ?? '#666'} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.9"
              />
            )}
            <polyline
              points={s.puntos.filter((p) => p.valor !== null).map((p) => `${x(p.p)},${y(p.valor!)}`).join(' ')}
              fill="none" stroke={COLOR_OLA[s.ola] ?? '#666'} strokeWidth="1.8" strokeLinecap="round"
              opacity={verAjuste ? 0.35 : 1}
            />
            {s.puntos.filter((p) => p.valor !== null).map((p) => (
              <circle key={p.p} cx={x(p.p)} cy={y(p.valor!)} r="2.4" fill={COLOR_OLA[s.ola] ?? '#666'} opacity={verAjuste ? 0.35 : 1}>
                <title>{`${s.ola} · ideología ${p.p}: ${decimal(p.valor!)} puntos sobre ${numero(p.n)} personas`}</title>
              </circle>
            ))}
          </g>
        ))}

        {ESCALA.map((p) => (
          <text key={p} x={x(p)} y={ALTO - 14} textAnchor="middle" className="fill-gray-500 text-[8px] tabular-nums">{p}</text>
        ))}
        <text x={PAD.izquierda} y={ALTO - 3} textAnchor="start" className="fill-gray-400 text-[8px]">Izquierda</text>
        <text x={ANCHO - PAD.derecha} y={ALTO - 3} textAnchor="end" className="fill-gray-400 text-[8px]">Derecha</text>
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => {
          const dif = diferenciaExtremos(s.puntos)
          return (
            <li key={s.ola} className="flex items-center gap-1.5 text-xs text-gray-600 tabular-nums">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_OLA[s.ola] ?? '#666' }} />
              {s.ola}
              {dif !== null && (
                <span className={dif < 0 ? 'text-amber-700' : undefined}>
                  {dif >= 0 ? `−${decimal(dif)} hacia la derecha` : `+${decimal(-dif)} hacia la derecha`}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={verAjuste}
          onChange={(e) => setVerAjuste(e.target.checked)}
          className="rounded border-gray-300"
        />
        Mostrar la tendencia ajustada
      </label>

      {verAjuste && (
        <div className="mt-1 text-xs leading-snug text-gray-500">
          <p>
            Regresión lineal simple de la opinión sobre la escala de ideología, una por oleada.
          </p>
          <ul className="mt-1 flex flex-col gap-0.5 tabular-nums">
            {series.map((s) => (
              <li key={s.ola}>
                {s.ola}: {s.ajuste
                  ? <>pendiente {decimal(s.ajuste.b, 2)} por punto, R² {decimal(s.ajuste.r2, 3)}, n {numero(s.ajuste.n)}</>
                  : 'casos insuficientes para ajustar'}
              </li>
            ))}
          </ul>
          <p className="mt-1">
            Los R² son muy bajos incluso donde el gradiente se ve: la ideología describe una tendencia
            de promedios y explica una parte chica de la variación entre personas.
          </p>
        </div>
      )}
    </div>
  )
}

/** Cuánto cae la evaluación entre el extremo izquierdo (1-2) y el derecho (9-10). */
function diferenciaExtremos (puntos: { p: number, valor: number | null, n: number }[]): number | null {
  const promedio = (desde: number, hasta: number) => {
    const tramo = puntos.filter((p) => p.p >= desde && p.p <= hasta && p.valor !== null)
    const casos = tramo.reduce((s, p) => s + p.n, 0)
    if (casos === 0) return null
    return tramo.reduce((s, p) => s + p.valor! * p.n, 0) / casos
  }
  const izquierda = promedio(1, 2)
  const derecha = promedio(9, 10)
  if (izquierda === null || derecha === null) return null
  return izquierda - derecha
}
