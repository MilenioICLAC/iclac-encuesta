import type { Recta, Regresion as Datos } from '../nucleo/tipos'
import { decimal, numero } from '../locale'

/**
 * La figura del experimento: la nube de promedios sobre una escala, y la recta que se le ajusta.
 *
 * **Es el hallazgo convertido en gesto.** Una línea plana no tiene épica, pero ver la recta
 * enderezarse cuando se retira un punto de treinta casos dice, sin adjetivos, que la inclinación
 * no estaba en los datos: estaba en una celda chica. El scroll sirve justamente para eso, para
 * mostrar un cambio, así que el método se cuenta en vez de resumirse.
 *
 * Decidido en el laboratorio del recorrido el 07-09-2026, con el cliente eligiendo entre seis
 * formas para el mismo hallazgo (ver la skill `recorrido`).
 *
 * Tres decisiones que no se deshacen sin querer:
 *
 *  - **El color es el año.** Los puntos de la oleada que se está mirando llevan el paso de la
 *    rampa de oleadas que le toca, el mismo que en el termómetro. El paso claro no llega al piso
 *    de contraste de 3:1 contra el papel, así que el punto lleva un aro del paso oscuro: el
 *    relleno dice el año y el aro pone el contraste.
 *  - **El área del punto dice cuánta gente hay.** Es lo que explica, sin una palabra, por qué el
 *    borde derecho salta y el centro no.
 *  - **El punto que se retira no se borra:** queda hueco. Ocultarlo sería el mismo truco que la
 *    escena está denunciando.
 */

const ANCHO = 360
const IZQ = 34
const DER = ANCHO - 14
const ARRIBA = 18
const ABAJO = 32

interface Props {
  datos: Datos
  /** Qué oleada protagoniza la figura. */
  ola: number
  /** Escala vertical, compartida por todos los pasos: no puede depender de lo que se muestra. */
  escala: { min: number, max: number, paso: number }
  tonos: string[]
  /** 0 solo los puntos · 1 con la recta · 2 marca el punto que la sostiene · 3 lo retira ·
   *  4 las tres oleadas. */
  paso: number
  olas: number[]
  etiquetaIzquierda: string
  etiquetaDerecha: string
  unidadEje: string
}

// Con signo siempre: un «0,83» al lado de un «−1,42» se lee como magnitud y no como dirección.
// El menos tipográfico lo pone `decimal`.
const cifra = (v: number) => `${v > 0 ? '+' : ''}${decimal(v, 2)}`

export default function Regresion ({ datos, ola, escala, tonos, paso, olas, etiquetaIzquierda, etiquetaDerecha, unidadEje }: Props) {
  // El lienzo es ancho y bajo. Con 300 de alto, en un teléfono de 664 px (iPhone 12) la escena
  // medía 728 y el pie quedaba bajo el borde: la figura se escala al ancho, así que cada unidad
  // de alto del `viewBox` cuesta casi un píxel de pantalla.
  const alto = 220
  const dato = datos.porOla.find((o) => o.ola === ola)
  if (!dato) return null
  const indiceOla = olas.indexOf(ola)
  const tono = tonos[indiceOla] ?? tonos[0]
  const aro = tonos[tonos.length - 1]

  const px = (x: number) => IZQ + ((x - datos.rango[0]) / (datos.rango[1] - datos.rango[0])) * (DER - IZQ)
  const py = (y: number) => alto - ABAJO - ((y - escala.min) / (escala.max - escala.min)) * (alto - ARRIBA - ABAJO)
  const marcas: number[] = []
  for (let v = escala.min; v <= escala.max + 0.001; v += escala.paso) marcas.push(v)

  const sostiene = dato.sostiene
  const retirado = paso >= 3 && sostiene ? sostiene.x : null
  const recta: Recta | null = paso === 0 ? null
    : paso >= 3 && sostiene ? sostiene.recta
      : dato.recta

  // El área crece con la raíz del número de casos: con el área lineal, el punto del centro (225
  // personas) se come la figura.
  const radio = (n: number) => Math.max(2.5, Math.min(13, Math.sqrt(n) * 0.72))
  const enRecta = (r: Recta, x: number) => r.centro[1] + r.b * (x - r.centro[0])

  const abanico = (r: Recta, color: string, opacidad: number) => (
    <polygon
      fill={color}
      opacity={opacidad}
      points={[
        [datos.rango[0], r.ic[0]], [datos.rango[1], r.ic[0]],
        [datos.rango[1], r.ic[1]], [datos.rango[0], r.ic[1]],
      ].map(([x, b]) => `${px(x)},${py(r.centro[1] + b * (x - r.centro[0]))}`).join(' ')}
    />
  )

  const todas = paso >= 4

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${ANCHO} ${alto}`} className="w-full" role="img"
        aria-label={`${datos.etiqueta}. ${todas ? 'Las tres oleadas' : `Oleada ${ola}`}.`}>
        {marcas.map((v) => (
          <g key={v}>
            <line x1={IZQ} y1={py(v)} x2={DER} y2={py(v)} stroke="#E4E7E6" strokeWidth={1} />
            <text x={IZQ - 5} y={py(v) + 3} textAnchor="end" fontSize={8} fill="#6B7280">{numero(v)}</text>
          </g>
        ))}
        <text x={px(datos.rango[0])} y={alto - 16} textAnchor="start" fontSize={8} fill="#6B7280">{etiquetaIzquierda}</text>
        <text x={px(datos.rango[1])} y={alto - 16} textAnchor="end" fontSize={8} fill="#6B7280">{etiquetaDerecha}</text>
        <text x={IZQ} y={alto - 4} fontSize={8} fill="#6B7280">{unidadEje}</text>

        {/* Las tres oleadas, en el último paso: cada recta con su abanico, punteada cuando el
            abanico contiene la horizontal. El trazo dice lo que dice el número. */}
        {todas && datos.porOla.map((o, i) => {
          const nula = o.recta.ic[0] <= 0 && o.recta.ic[1] >= 0
          return (
            <g key={o.ola}>
              {abanico(o.recta, tonos[i] ?? tonos[0], 0.13)}
              <line
                x1={px(datos.rango[0])} y1={py(enRecta(o.recta, datos.rango[0]))}
                x2={px(datos.rango[1])} y2={py(enRecta(o.recta, datos.rango[1]))}
                stroke={tonos[i] ?? tonos[0]} strokeWidth={2.5}
                strokeDasharray={nula ? '6 4' : undefined}
              />
            </g>
          )
        })}

        {/* La nube de la oleada protagonista. En el último paso queda de fondo. */}
        {dato.puntos.filter((q) => q.media !== null).map((q) => {
          const apagado = retirado === q.x
          const marcado = paso === 2 && sostiene?.x === q.x
          return (
            <g key={q.x}>
              {marcado && q.ic && (
                <line x1={px(q.x)} y1={py(q.ic[0])} x2={px(q.x)} y2={py(q.ic[1])} stroke={aro} strokeWidth={2} />
              )}
              <circle
                cx={px(q.x)} cy={py(q.media as number)} r={radio(q.n)}
                fill={apagado ? 'none' : tono}
                stroke={aro} strokeWidth={marcado ? 2.5 : 1}
                opacity={apagado ? 0.35 : todas ? 0.3 : 1}
                className="transition-opacity duration-500"
              />
              {marcado && q.ic && (
                <text x={px(q.x) - 10} y={py(q.ic[1]) - 6} textAnchor="end" fontSize={9} fill="#17211F">
                  {numero(q.n)} personas · {decimal(q.media as number, 1)}
                </text>
              )}
            </g>
          )
        })}

        {/* La recta de la oleada protagonista, con su abanico. */}
        {recta && !todas && (
          <g>
            {abanico(recta, aro, 0.12)}
            {retirado !== null && (
              <line
                x1={px(datos.rango[0])} y1={py(recta.centro[1])} x2={px(datos.rango[1])} y2={py(recta.centro[1])}
                stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4"
              />
            )}
            <line
              x1={px(datos.rango[0])} y1={py(enRecta(recta, datos.rango[0]))}
              x2={px(datos.rango[1])} y2={py(enRecta(recta, datos.rango[1]))}
              stroke={aro} strokeWidth={2.5}
            />
            <text x={IZQ + 4} y={ARRIBA - 6} fontSize={9} fill="#17211F">
              pendiente {cifra(recta.b)} [{cifra(recta.ic[0])}; {cifra(recta.ic[1])}]
            </text>
            <text x={IZQ + 4} y={ARRIBA + 6} fontSize={8} fill="#6B7280">
              R² {decimal(recta.r2, 1)} % · n {numero(recta.n)}{retirado !== null ? ` · sin el ${retirado}` : ''}
            </text>
          </g>
        )}

        {/* Los rótulos de las tres rectas, separados a la fuerza: dos que terminan a la misma
            altura se escriben encima la una de la otra. */}
        {todas && (() => {
          const usados: number[] = []
          return datos.porOla.map((o) => {
            const nula = o.recta.ic[0] <= 0 && o.recta.ic[1] >= 0
            let y = py(enRecta(o.recta, datos.rango[1])) + 3
            while (usados.some((u) => Math.abs(u - y) < 11)) y += 11
            usados.push(y)
            return (
              <text key={o.ola} x={DER + 2} y={y} textAnchor="end" fontSize={9} fill="#17211F"
                stroke="#FFFFFF" strokeWidth={3} paintOrder="stroke">
                {o.ola} {cifra(o.recta.b)}{nula ? ' ns' : ''}
              </text>
            )
          })
        })()}
      </svg>
    </figure>
  )
}
