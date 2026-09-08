import type React from 'react'

/**
 * Barras apiladas **divergentes**: una fila por entidad, los segmentos repartidos a los dos lados
 * de un cero común.
 *
 * Es la figura de las escalas con polaridad, como la confianza de `p24` y `p25` («ninguna, poca,
 * algo, mucha»). Frente a las dos alternativas obvias:
 *
 * - **Una serie con la caja de arriba** («mucha») tira tres categorías de cuatro y, peor, hace que
 *   la conclusión dependa de dónde se corte: con «mucha» China pasa a Estados Unidos en 2025, con
 *   «mucha o algo» venía arriba desde 2023. Acá no hay que elegir umbral, porque están las cuatro.
 * - **Una apilada al 100 % alineada a la izquierda** deja el punto de comparación en el borde, y lo
 *   que se quiere comparar es cuánto pesa cada lado. Con el cero en el medio, el desbalance se lee
 *   sin medir.
 *
 * **El cero es el borde entre los dos lados, no una categoría.** Cuando hay una categoría neutra
 * (`lado: 0`, como el empate de la comparación pareada) se dibuja a caballo del cero, mitad y
 * mitad: es la convención de las escalas Likert con punto medio, y evita tener que inventar de qué
 * lado cae la gente que no se inclina.
 *
 * La escala (`extremo`) se pasa hecha y **se calcula sobre todas las filas**, encendidas o no: si
 * dependiera de lo visible, un segmento cambiaría de largo al encenderse el resto (regla 1 de
 * `nucleo/pasos.ts`).
 */

export interface CategoriaDivergente {
  clave: string
  etiqueta: string
  color: string
  /** −1 a la izquierda del cero, 1 a la derecha, 0 a caballo (mitad y mitad). */
  lado: -1 | 0 | 1
}

export interface FilaDivergente {
  clave: string
  etiqueta: string
  /** Encabezado del bloque al que pertenece la fila. Se dibuja cuando cambia. */
  grupo?: string
  /** Un valor por categoría, en el mismo orden, en puntos porcentuales. */
  valores: number[]
  /** Personas que contestaron: es el denominador de los porcentajes de la fila. */
  base: number
}

interface Props {
  /** En orden visual: del extremo izquierdo al derecho. */
  categorias: CategoriaDivergente[]
  filas: FilaDivergente[]
  /**
   * Semiancho de la escala en puntos porcentuales: cuánto puede alejarse del cero el lado más
   * largo. Fijo para toda la figura y calculado sobre todas las filas.
   */
  extremo: number
  formato: (v: number) => string
  /** Qué filas están encendidas, para el recorrido. Las apagadas siguen en el documento con
   *  opacidad cero: están al imprimir y para un lector de pantalla. */
  visible?: (fila: string) => boolean
  altoFila?: number
  anchoEtiqueta?: string
  /** Unidad del eje. Se escribe una vez acá y no en cada frase del relato. */
  unidadEje?: string
  leyenda?: boolean
  titulo?: (fila: FilaDivergente, categoria: CategoriaDivergente, valor: number) => string
}

/** Bajo este ancho, en porcentaje del lienzo, el número no cabe dentro del segmento. */
const MINIMO_ROTULO = 11

/**
 * Tinta del número **según el relleno que tiene detrás**, no según la figura.
 *
 * Blanco sobre `#E9A26A` da 2:1, muy por debajo del piso de 4,5:1 para texto chico: el número de
 * «Poca» quedaba ilegible mientras el de «Ninguna», sobre un óxido oscuro, se leía bien. Se decide
 * con la luminancia relativa del relleno, así que un cambio de paleta no vuelve a romperlo.
 */
function tinta (fondo: string): string {
  const canal = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(fondo.slice(i, i + 2), 16) / 255))
  const luz = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // El umbral sale de igualar los dos contrastes: sobre este valor gana el texto oscuro.
  return luz > 0.32 ? '#1f2937' : '#ffffff'
}

export default function Divergente ({
  categorias, filas, extremo, formato, visible, altoFila = 30, anchoEtiqueta = '3.5rem',
  unidadEje, leyenda = true, titulo,
}: Props) {
  // Un punto porcentual, en porcentaje del ancho del lienzo. El lienzo va de −extremo a +extremo.
  const unidad = 50 / extremo
  const marcas = [-50, -25, 0, 25, 50].filter((m) => Math.abs(m) <= extremo)

  return (
    <div
      className="divergente flex flex-col"
      style={{
        // Dos nombres y cadena de respaldo: un valor en el atributo `style` le gana a cualquier
        // media query, así que el ancestro necesita poder pasarlo por encima (ver CLAUDE.md).
        '--alto-fila-divergente': `${altoFila}px`,
        '--ancho-etiqueta-divergente': anchoEtiqueta,
      } as React.CSSProperties}
    >
      <div className="flex flex-col gap-[3px]">
        {filas.map((fila, i) => {
          const encendida = visible ? visible(fila.clave) : true
          // Cuánto sobresale la fila hacia la izquierda del cero: todo lo negativo, más la mitad
          // de lo neutro.
          const izquierda = fila.valores.reduce((acc, v, j) => {
            const lado = categorias[j].lado
            return acc + (lado === -1 ? v : lado === 0 ? v / 2 : 0)
          }, 0)
          const cabecera = fila.grupo && fila.grupo !== filas[i - 1]?.grupo
          return (
            <div key={fila.clave}>
              {cabecera && (
                <p className="pb-0.5 pt-1.5 text-xs font-semibold text-gray-700">
                  {fila.grupo}
                </p>
              )}
              <div className="flex items-center gap-2">
                {/* **El nombre de la fila no se apaga.** Un segmento apagado es una figura
                    incompleta; un nombre ilegible es una fila sin dueño. Y con el nombre puesto y
                    la barra vacía, la figura dice «esto viene» antes de que el paso lo cuente. */}
                <span
                  className="shrink-0 text-right text-xs tabular-nums text-gray-600"
                  style={{
                    width: 'var(--ancho-etiqueta-divergente-ancho, var(--ancho-etiqueta-divergente))',
                  }}
                >
                  {fila.etiqueta}
                </span>
                <div
                  className="relative grow overflow-hidden rounded-[3px]"
                  style={{ height: 'var(--alto-fila-divergente-ancho, var(--alto-fila-divergente))' }}
                >
                  <div
                    className="flex h-full w-full transition-opacity duration-500"
                    style={{ opacity: encendida ? 1 : 0 }}
                  >
                    <div style={{ width: `${(extremo - izquierda) * unidad}%` }} />
                    {fila.valores.map((v, j) => {
                      const cat = categorias[j]
                      const ancho = v * unidad
                      return (
                        <div
                          key={cat.clave}
                          className="segmento-divergente flex items-center justify-center overflow-hidden font-medium tabular-nums"
                          // 1 px de fondo entre segmentos: sin la separación, dos tonos vecinos
                          // se leen como uno solo.
                          style={{ width: `${ancho}%`, backgroundColor: cat.color, color: tinta(cat.color), boxShadow: '1px 0 0 0 #fff inset' }}
                          title={titulo?.(fila, cat, v)}
                        >
                          {/* Por encima de la marca del cero: en la categoría neutra, que va a
                              caballo del cero, la línea partía el número al medio. */}
                          <span className="relative z-10">{ancho >= MINIMO_ROTULO && formato(v)}</span>
                        </div>
                      )
                    })}
                  </div>
                  {/* El cero, encima de las barras: es la referencia que hace divergente a la
                      figura, y por debajo desaparece bajo los segmentos. */}
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/80" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* El eje, al pie y con el cero rotulado: sin él, «cuánto sobresale» no tiene unidad. */}
      <div className="mt-1 flex items-center gap-2">
        <span className="shrink-0" style={{ width: 'var(--ancho-etiqueta-divergente-ancho, var(--ancho-etiqueta-divergente))' }} />
        <div className="relative grow">
          <div className="h-px w-full bg-gray-200" />
          {marcas.map((m) => (
            <span
              key={m}
              className="absolute top-0.5 -translate-x-1/2 text-[10px] tabular-nums text-gray-500"
              style={{ left: `${50 + m * unidad}%` }}
            >
              {Math.abs(m)}
            </span>
          ))}
        </div>
      </div>

      {unidadEje && <p className="pie-divergente mt-4 text-[11px] leading-snug text-gray-500">{unidadEje}</p>}

      {leyenda && (
        <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {categorias.map((c) => (
            <li key={c.clave} className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className="h-2.5 w-3.5 rounded-[2px]" style={{ backgroundColor: c.color }} />
              {c.etiqueta}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
