import type React from 'react'

/**
 * Gráfico de puntos: una fila por entidad, un punto por grupo sobre esa misma fila.
 *
 * **Es la figura de comparación del producto**, y vive acá y no dentro de quien la usa porque
 * ya tiene dos usos (las palabras de las respuestas abiertas y el termómetro de los cinco
 * países) y todo su valor está en detalles de layout que se pagan una vez: los márgenes del
 * lienzo, el rótulo que despeja el punto, y el apilado en pantalla angosta. Copiada, las dos
 * copias derivan.
 *
 * **Por qué puntos y no líneas ni barras.** Con tres oleadas, una línea promete interpolación
 * que no existe: son tres encuestas sueltas, no un valor continuo muestreado. Y con varias
 * entidades a la vez las líneas se cruzan y el color tiene que distinguir todos los pares
 * contra todos, que es el caso donde la paleta validada topa en tres (un registro de decisiones interno). Con los
 * puntos en la fila de la entidad, la distancia entre ellos es el cambio y el nombre de la
 * fila carga la identidad.
 */

/** Margen en px a cada lado del lienzo: sin él, un punto en el mínimo o el máximo de la escala
 *  sale cortado por la mitad (se posiciona por su centro) y su rótulo se pierde fuera de la
 *  tarjeta. Es el mismo desborde que ya se pagó en las figuras de ideología. */
const MARGEN = 38
const PUNTO = 10
const ALTO_FILA = 22
/** Separación mínima entre el punto más chico y el más grande, en porcentaje del lienzo, para
 *  rotular los dos extremos. Bajo eso los dos rótulos se pisan y va solo el del máximo. */
const SEPARACION_MINIMA = 22

export interface SerieDePuntos {
  clave: string
  etiqueta: string
  color: string
  /** Se muestra en gris al lado de la etiqueta en la leyenda. Suele ser la base. */
  nota?: string
}

export interface FilaDePuntos {
  clave: string
  etiqueta: string
  /** Un valor por serie, en el mismo orden. `null` es «no hay dato», que no es cero. */
  valores: (number | null)[]
}

interface Props {
  series: SerieDePuntos[]
  filas: FilaDePuntos[]
  /** Compartida por toda la figura: si cada fila se autoescala, dejan de ser comparables. */
  escala: { min: number, max: number }
  formato: (v: number) => string
  /** Para las marcas del eje, cuando el rótulo del punto necesita más precisión que el eje.
   *  Un eje que dice «55,0» es ruido; un punto que dice «66» pierde el dato. */
  formatoEje?: (v: number) => string
  /** Texto del cursor sobre un punto. */
  titulo?: (fila: FilaDePuntos, serie: SerieDePuntos, valor: number) => string
  /** Cuántas marcas de eje, incluidos los dos extremos. */
  marcas?: number
  /** Ancho de la columna de nombres. Solo se ensancha si algún nombre se corta. */
  anchoEtiqueta?: string
  /**
   * Qué punto se rotula. `extremos` marca el mínimo y el máximo de cada fila, que es lo que
   * corresponde cuando ninguna serie es más importante que otra. Con un índice, esa serie va
   * rotulada **siempre**, y la más lejana además si hay espacio: es el caso del termómetro,
   * donde lo que importa es dónde está cada país hoy y no cuál fue su extremo histórico.
   */
  rotular?: 'extremos' | number
}

export default function Puntos ({
  series, filas, escala, formato, formatoEje = formato, titulo, marcas = 3,
  anchoEtiqueta = '5.5rem', rotular = 'extremos',
}: Props) {
  const rango = escala.max - escala.min || 1
  /** Posición en el lienzo, de 0 a 100. */
  const x = (v: number) => Math.min(100, Math.max(0, (100 * (v - escala.min)) / rango))
  const cortes = Array.from({ length: marcas }, (_, i) => i / (marcas - 1))
  // El ancho de la columna de nombres viaja como variable CSS. El porqué está en `.fila-puntos`,
  // en index.css: ni clase de Tailwind (interpolada, el compilador no la ve) ni estilo en línea
  // (sin media query, y le gana a la clase, así que rompe el apilado en teléfono).
  const ancho = { '--ancho-etiqueta': anchoEtiqueta } as React.CSSProperties

  return (
    <div>
      {/* Eje arriba. Va sobre el mismo lienzo que los puntos, márgenes incluidos, o las marcas
          quedan corridas respecto de lo que rotulan. */}
      <div className="fila-puntos items-end" style={ancho}>
        <span className="hidden sm:block" />
        <div className="relative h-4" style={{ marginLeft: MARGEN, marginRight: MARGEN }}>
          {cortes.map((f) => (
            <span
              key={f}
              className="absolute bottom-0 text-[10px] tabular-nums text-gray-400"
              style={{ left: `${f * 100}%`, transform: f === 0 ? 'none' : f === 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {formatoEje(escala.min + f * rango)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {filas.map((fila) => {
          const puntos = fila.valores
            .map((v, i) => ({ valor: v, serie: series[i] }))
            .filter((p): p is { valor: number, serie: SerieDePuntos } => p.valor !== null && p.serie !== undefined)
          const posiciones = puntos.map((p) => x(p.valor))
          const min = Math.min(...posiciones)
          const max = Math.max(...posiciones)
          // Con los extremos pegados los dos rótulos se pisan, así que va solo el del máximo.
          const separados = puntos.length > 1 && max - min >= SEPARACION_MINIMA
          const enMin = puntos[posiciones.indexOf(min)]
          const enMax = puntos[posiciones.indexOf(max)]
          // Con una serie destacada, esa va rotulada aunque quede en medio, y la otra solo si
          // hay espacio. Sin ella, se rotulan los dos extremos cuando están separados.
          const destacado = typeof rotular === 'number'
            ? puntos.find((p) => p.serie.clave === series[rotular]?.clave)
            : undefined
          const aIzquierda = typeof rotular === 'number'
            ? (destacado === enMin ? destacado : separados ? enMin : undefined)
            : (separados ? enMin : undefined)
          const aDerecha = typeof rotular === 'number'
            ? (destacado === enMin ? (separados ? enMax : undefined) : destacado)
            : enMax

          return (
            // En pantalla angosta el nombre va sobre su fila y no al lado: la columna de texto
            // se comía 88 de los 296 px disponibles y los puntos quedaban unos encima de otros.
            <div
              key={fila.clave}
              className="fila-puntos items-center pb-1 sm:pb-0"
              style={ancho}
            >
              <span className="truncate text-xs text-gray-700 sm:text-right" title={fila.etiqueta}>
                {fila.etiqueta}
              </span>
              <div className="relative" style={{ height: `${ALTO_FILA}px`, marginLeft: MARGEN, marginRight: MARGEN }}>
                {cortes.map((f) => (
                  <span key={f} className="absolute inset-y-0 w-px bg-gray-100" style={{ left: `${f * 100}%` }} />
                ))}

                {/* El trazo entre el punto más chico y el más grande: es el rango de la fila, y
                    sin él se lee como puntos sueltos en vez de como un recorrido. */}
                {puntos.length > 1 && (
                  <span
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-gray-200"
                    style={{ left: `${min}%`, width: `${max - min}%` }}
                  />
                )}

                {/* El anillo blanco separa dos puntos vecinos. Dos puntos con el mismo valor sí
                    se tapan: el número exacto está al pasar el cursor. No se desplazan, porque
                    desplazarlos sería dibujar un valor que no es. */}
                {puntos.map((p) => (
                  <span
                    key={p.serie.clave}
                    className="absolute top-1/2 rounded-full ring-2 ring-white"
                    style={{
                      left: `${x(p.valor)}%`,
                      width: `${PUNTO}px`,
                      height: `${PUNTO}px`,
                      marginLeft: `${-PUNTO / 2}px`,
                      marginTop: `${-PUNTO / 2}px`,
                      backgroundColor: p.serie.color,
                    }}
                    title={titulo
                      ? titulo(fila, p.serie, p.valor)
                      : `${p.serie.etiqueta} · ${fila.etiqueta}: ${formato(p.valor)}`}
                  />
                ))}

                {aIzquierda && (
                  <span
                    className="absolute inset-y-0 flex items-center justify-end pr-2.5 text-[10px] tabular-nums text-gray-500"
                    style={{ right: `${100 - x(aIzquierda.valor)}%` }}
                  >
                    {formato(aIzquierda.valor)}
                  </span>
                )}
                {aDerecha && (
                  <span
                    className="absolute inset-y-0 flex items-center pl-2.5 text-[10px] tabular-nums text-gray-500"
                    style={{ left: `${x(aDerecha.valor)}%` }}
                  >
                    {formato(aDerecha.valor)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <li key={s.clave} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.etiqueta}
            {s.nota && <span className="tabular-nums text-gray-400">{s.nota}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
