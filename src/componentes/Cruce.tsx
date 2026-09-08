import { numero, porcentaje } from '../locale'

/**
 * Dos series que se cruzan, con el reparto completo del que salen dibujado arriba.
 *
 * Es la figura de una pregunta de **elección única** donde lo que importa es que dos opciones se
 * dan vuelta, y donde esas dos opciones son una minoría del total. `p26` es el caso: entre las dos
 * juntas no llegan a un tercio de la muestra, y el resto no quiere elegir bando.
 *
 * **Por qué dos escalas y no una.** Poner las cuatro categorías en un solo eje aplasta el cruce:
 * el no alineamiento es tres veces más grande que las dos series juntas, así que con un eje que lo
 * contenga el cruce entero mide once píxeles y la figura deja de contar lo que dice contar. Pero
 * mostrar solo las dos líneas miente por omisión, porque 16 % parece mucho hasta que uno sabe que
 * el 72 % no eligió. La franja de arriba resuelve las dos cosas: va en su propia escala de 100 %,
 * sin números y sin eje, y dice «estas dos líneas son este pedazo del total».
 *
 * **Sin marca de intersección, y es una decisión de honestidad.** Estuvo dibujada como línea
 * vertical con un círculo en el cruce, y se sacó: no sabemos en qué momento entre una oleada y la
 * siguiente se cruzaron las series. Marcar un punto del eje afirma una fecha que los datos no
 * tienen. Tres oleadas son tres mediciones, no una curva.
 *
 * **La escala no depende de lo encendido** (ver `nucleo/pasos.ts`): se calcula sobre todos los
 * puntos y por eso ninguna marca se mueve al avanzar el relato. Lo apagado sigue en el documento
 * con opacidad cero, así que está al imprimir y para un lector de pantalla.
 */

export interface PuntoCruce {
  ola: number
  valor: number
  /** Personas que contestaron la pregunta esa oleada: el denominador del porcentaje. */
  base: number
}

export interface SerieCruce {
  clave: string
  etiqueta: string
  color: string
  puntos: PuntoCruce[]
}

export interface CategoriaCruce {
  clave: string
  etiqueta: string
  color: string
  /** Su porcentaje en cada oleada, en el mismo orden que `olas`. */
  valores: number[]
}

interface Props {
  olas: number[]
  /** Las dos que se cruzan. Se dibujan en el eje de abajo. */
  series: SerieCruce[]
  /** El reparto completo, que suma 100 en cada oleada. Se dibuja en la franja de arriba. */
  reparto: CategoriaCruce[]
  /** Qué oleadas enciende este paso del recorrido. Sin ella, todas. */
  visible?: (ola: number) => boolean
  /** Qué se está midiendo, al pie. */
  unidadEje?: string
}

const ANCHO = 300
const ALTO = 150
/** Lo que se lleva la franja del reparto, arriba del eje de las líneas. */
const FRANJA = 56
const IZQ = 24
const DER = 96
const PAD_Y = 14

export default function Cruce ({ olas, series, reparto, visible, unidadEje }: Props) {
  const encendido = (ola: number) => (visible ? visible(ola) : true)

  // **La escala se calcula sobre todos los puntos, encendidos o no.** Con la escala siguiendo a lo
  // visible, el mismo valor cambiaría de lugar al avanzar el relato, que es la manera más limpia
  // de mentir con una animación.
  const todos = series.flatMap((s) => s.puntos.map((p) => p.valor))
  const tope = Math.max(...todos)
  const max = Math.max(5, Math.ceil((tope * 1.25) / 5) * 5)

  const x = (i: number) => IZQ + (i * (ANCHO - IZQ - DER)) / Math.max(1, olas.length - 1)
  const y = (v: number) => FRANJA + PAD_Y + (1 - v / max) * (ALTO - FRANJA - PAD_Y * 2)

  const anchoTira = ANCHO - IZQ - DER
  const ultima = olas.length - 1

  const resumen = series
    .map((s) => `${s.etiqueta}: ${s.puntos.map((p) => `${p.ola} ${porcentaje(p.valor, 1)}`).join(', ')}`)
    .join('. ')

  return (
    <figure className="mt-1">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full" role="img" aria-label={resumen}>
        {/* La franja: una tira por oleada, apilada al 100 %. Sin números y sin eje, porque no se
            consulta, se mira una vez. Quién es cada color lo dice la leyenda de abajo. */}
        {olas.map((ola, i) => {
          let acumulado = 0
          return (
            <g key={ola}>
              {reparto.map((cat) => {
                const w = (cat.valores[i] / 100) * anchoTira
                const izquierda = IZQ + acumulado
                acumulado += w
                return (
                  <rect
                    key={cat.clave}
                    x={izquierda} y={6 + i * 13} width={Math.max(w, 0)} height={10}
                    fill={cat.color}
                    className={`transition-opacity duration-500 ${encendido(ola) ? 'opacity-100' : 'opacity-0'}`}
                  />
                )
              })}
              <text
                x={IZQ - 5} y={6 + i * 13 + 8} textAnchor="end"
                className="fill-gray-500 text-[8px] tabular-nums"
              >
                {ola}
              </text>
            </g>
          )
        })}

        {/* Las dos series. Los tramos se cortan donde el paso todavía no encendió un extremo: el
            segmento aparece recién cuando sus dos puntas están contadas. */}
        {series.map((serie) => {
          const visibles = serie.puntos
            .map((p, i) => ({ ...p, i }))
            .filter((p) => encendido(p.ola))
          return (
            <g key={serie.clave} style={{ color: serie.color }}>
              {visibles.length > 1 && (
                <polyline
                  points={visibles.map((p) => `${x(p.i)},${y(p.valor)}`).join(' ')}
                  fill="none" stroke={serie.color} strokeWidth="1.6" strokeLinecap="round"
                />
              )}
              {serie.puntos.map((p, i) => (
                <g
                  key={p.ola}
                  className={`punto transition-opacity duration-500 ${encendido(p.ola) ? 'opacity-100 dato-nuevo' : 'opacity-0'}`}
                >
                  <circle cx={x(i)} cy={y(p.valor)} r="3.4" fill="white" stroke={serie.color} strokeWidth="1.6" />
                  {/* El número de cada punto, salvo el último: ahí va pegado al nombre, que se
                      dibuja aparte porque no se apaga con el punto. */}
                  {i !== ultima && (
                    <text
                      x={x(i)} y={y(p.valor) - 7} textAnchor={i === 0 ? 'start' : 'middle'}
                      className="fill-gray-900 text-[9px] font-medium tabular-nums"
                    >
                      {porcentaje(p.valor, 1)}
                    </text>
                  )}
                </g>
              ))}

              {/* **El nombre de la serie va pegado a su último punto encendido, no al último.**
                  Dos razones, y la segunda es de honestidad:

                  - Con el nombre puesto desde el primer paso el lector sabe cuál línea es cuál, en
                    vez de tener que ir a la leyenda y volver.
                  - Anclado siempre al punto final, en el primer paso los dos nombres aparecen ya
                    en el orden del desenlace («China» arriba de «EE. UU.») y la figura cuenta el
                    final antes que el relato. Siguiendo al dato encendido, el nombre dice lo que
                    hay hasta acá y se mueve cuando el dato lo mueve.

                  El valor sí espera al último punto: es lo que el paso está por contar. */}
              {(() => {
                const p = [...serie.puntos].reverse().find((q) => encendido(q.ola))
                if (!p) return null
                const i = serie.puntos.indexOf(p)
                return (
                  <text
                    x={x(i) + 6} y={y(p.valor) + 3}
                    style={{ fill: serie.color }}
                    className="text-[9px] font-semibold tabular-nums transition-all duration-500"
                  >
                    {serie.etiqueta}
                    {i === ultima && ` ${porcentaje(p.valor, 1)}`}
                  </text>
                )
              })()}
            </g>
          )
        })}

        {olas.map((ola, i) => (
          <text
            key={ola} x={x(i)} y={ALTO - 3} textAnchor={i === 0 ? 'start' : i === ultima ? 'middle' : 'middle'}
            className="fill-gray-500 text-[8px] tabular-nums"
          >
            {ola}
          </text>
        ))}
      </svg>

      {/* **La leyenda nombra las cuatro, y las dos del medio no son «el resto».** «Mantener
          distancia de ambos» y «relacionarse con ambos» son dos posiciones distintas de política
          exterior: dejarlas sin nombre las convierte en un bloque gris sin significado. */}
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {reparto.map((cat) => (
          <li key={cat.clave} className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span aria-hidden className="h-2.5 w-3.5 shrink-0 rounded-[2px]" style={{ background: cat.color }} />
            {cat.etiqueta}
          </li>
        ))}
      </ul>

      {unidadEje && <p className="mt-2 text-[11px] leading-snug text-gray-500">{unidadEje}</p>}

      <p className="sr-only">
        {resumen}. Reparto completo por oleada:{' '}
        {olas.map((ola, i) => `${ola}, ${reparto.map((c) => `${c.etiqueta} ${porcentaje(c.valores[i], 1)}`).join(', ')}`).join('. ')}.
        Bases: {series[0]?.puntos.map((p) => `${p.ola}, ${numero(p.base)} casos`).join('. ')}.
      </p>
    </figure>
  )
}
