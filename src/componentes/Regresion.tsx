import type { ReactNode } from 'react'
import type { Recta, Regresion as Datos } from '../nucleo/tipos'
import { decimal, numero, traducido } from '../locale'
import { textoExplorador as t } from '../nucleo/explorador'
import RotuloFigura from './RotuloFigura'

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
  /** El nombre del gráfico: la medida y su base. Ver `RotuloFigura`. */
  rotulo?: string
  /**
   * El texto equivalente, con los datos del paso: pendiente, intervalo y sobre cuántas respuestas.
   *
   * **La escena la pasa por paso y no es fija.** El `aria-label` del `svg` dice de qué oleada es la
   * figura, que no alcanza: cada paso cambia lo que muestra (retira un punto, dibuja las tres
   * rectas) y sobre qué base. Hasta que la nota al pie se fue al pop-up, esa nota era el único
   * lugar donde esas cifras estaban escritas.
   */
  descripcion?: ReactNode
}

// Con signo siempre: un «0,83» al lado de un «−1,42» se lee como magnitud y no como dirección.
// El menos tipográfico lo pone `decimal`.
const cifra = (v: number) => `${v > 0 ? '+' : ''}${decimal(v, 2)}`

export default function Regresion ({ datos, ola, escala, tonos, paso, olas, etiquetaIzquierda, etiquetaDerecha, unidadEje, rotulo, descripcion }: Props) {
  // El lienzo es ancho y bajo. Con 300 de alto, en un teléfono de 664 px (iPhone 12) la escena
  // medía 728 y el pie quedaba bajo el borde: la figura se escala al ancho, así que cada unidad
  // de alto del `viewBox` cuesta casi un píxel de pantalla.
  const alto = 220
  const dato = datos.porOla.find((o) => o.ola === ola)
  if (!dato) return null
  const indiceOla = olas.indexOf(ola)
  const tono = tonos[indiceOla] ?? tonos[0]
  // El aro oscuro sostiene el contraste del punto claro (1,86:1 contra el papel), pero **la recta
  // va en el color del año**: en el último paso las tres rectas se pintan por oleada, y una recta
  // oscura en los pasos anteriores hacía que la de 2023 cambiara de color a mitad de la escena.
  const aro = tonos[tonos.length - 1]

  const px = (x: number) => IZQ + ((x - datos.rango[0]) / (datos.rango[1] - datos.rango[0])) * (DER - IZQ)
  const py = (y: number) => alto - ABAJO - ((y - escala.min) / (escala.max - escala.min)) * (alto - ARRIBA - ABAJO)
  const marcas: number[] = []
  for (let v = escala.min; v <= escala.max + 0.001; v += escala.paso) marcas.push(v)

  const sostiene = dato.sostiene
  const retirado = paso >= 3 && sostiene ? sostiene.x : null
  // Las líneas salen **en el paso del retiro**, no en los siguientes: es un gesto que marca el
  // momento, no un adorno permanente.
  const conEmanata = paso === 3 && sostiene !== null
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
      <RotuloFigura>{rotulo}</RotuloFigura>
      {descripcion && <p className="sr-only">{descripcion}</p>}
      <svg viewBox={`0 0 ${ANCHO} ${alto}`} className="w-full" role="img"
        aria-label={t('regresion.aria', { etiqueta: traducido(datos.etiqueta), cual: todas ? t('regresion.todas') : t('regresion.ola', { ola }) })}>
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

        {/* **La recta va antes que los puntos**, para que ellos y sus rótulos queden encima: con
            el orden inverso la línea cruzaba el rótulo del punto marcado y lo dejaba ilegible, y
            el halo no servía de nada porque quedaba debajo de la línea. */}
        {/* La recta de la oleada protagonista, con su abanico. */}
        {recta && !todas && (
          <g>
            {abanico(recta, tono, 0.18)}
            {retirado !== null && (
              <line
                x1={px(datos.rango[0])} y1={py(recta.centro[1])} x2={px(datos.rango[1])} y2={py(recta.centro[1])}
                stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4"
              />
            )}
            <line
              x1={px(datos.rango[0])} y1={py(enRecta(recta, datos.rango[0]))}
              x2={px(datos.rango[1])} y2={py(enRecta(recta, datos.rango[1]))}
              // Más gruesa que las del último paso porque va en el tono claro del año: a 2,5 px
              // ese color se pierde contra el papel.
              stroke={tono} strokeWidth={3.5}
            />
            <text x={IZQ + 4} y={ARRIBA - 6} fontSize={9} fill="#17211F">
              {t('regresion.pendiente', { b: cifra(recta.b), lo: cifra(recta.ic[0]), hi: cifra(recta.ic[1]) })}
            </text>
            <text x={IZQ + 4} y={ARRIBA + 6} fontSize={8} fill="#6B7280">
              {t('regresion.r2', { r2: decimal(recta.r2, 1), n: numero(recta.n) })}{retirado !== null ? t('regresion.sinEl', { x: numero(retirado) }) : ''}
            </text>
          </g>
        )}

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
                <text
                  x={px(q.x) - 10} y={py(q.ic[1]) - 6} textAnchor="end" fontSize={9} fill="#17211F"
                  // Halo del color del papel: la recta pasa justo por acá y sin él el rótulo del
                  // punto de la derecha quedaba cortado por la línea.
                  stroke="#FFFFFF" strokeWidth={3.5} paintOrder="stroke"
                >
                  {t('regresion.personas', { n: numero(q.n), media: decimal(q.media as number, 1) })}
                </text>
              )}
              {conEmanata && apagado && (
                // Ocho líneas radiales desde el perímetro del punto, no desde su centro: el gesto
                // es «sale de acá», y arrancando del centro se leería como un pinchazo.
                // El tono es el oscuro de la rampa: el claro del año da 1,86:1 contra el papel y a
                // este grosor no se vería. Sigue siendo el color del punto, que lleva los dos.
                <g className="emanata" aria-hidden>
                  {Array.from({ length: 8 }, (_, i) => {
                    const angulo = (i / 8) * Math.PI * 2 - Math.PI / 2
                    // Largas y cortas alternadas, como se dibuja una emanata en el papel: ocho
                    // líneas iguales se leen como un engranaje, no como algo que sale.
                    const largo = i % 2 === 0 ? 13 : 8
                    const desde = radio(q.n) + 4
                    const hasta = desde + largo
                    return (
                      <line
                        key={i}
                        x1={px(q.x) + Math.cos(angulo) * desde}
                        y1={py(q.media as number) + Math.sin(angulo) * desde}
                        x2={px(q.x) + Math.cos(angulo) * hasta}
                        y2={py(q.media as number) + Math.sin(angulo) * hasta}
                        stroke={aro}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeDasharray={largo}
                        style={{ '--largo': `${largo}px`, animationDelay: `${i * 22}ms` } as React.CSSProperties}
                      />
                    )
                  })}
                </g>
              )}
            </g>
          )
        })}

        {/*
          * **Las tres rectas no se rotulan en la figura.**
          *
          * Se probaron dos maneras y las dos fallan por la misma razón: en el extremo derecho, dos
          * de las tres rectas terminan a menos de un punto de distancia. Separar los rótulos a la
          * fuerza los apila sin decir de quién es cada uno; atarlos con un conector obliga a
          * cruzar la figura entera con una línea que compite con los datos.
          *
          * El color ya identifica el año, y la leyenda al pie lleva la pendiente de cada uno: es
          * el mismo dato, en el único lugar donde tres etiquetas no pueden pisarse.
          */}
      </svg>
    </figure>
  )
}
