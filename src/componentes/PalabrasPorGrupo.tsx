import { useState } from 'react'
import type { GrupoNube, NubePalabras } from '../nucleo/tipos'
import { IDENTIDAD } from '../nucleo/paleta'
import { numero, porcentaje } from '../locale'

/**
 * Las palabras más repetidas, en puntos, con un punto por oleada sobre la fila de la palabra.
 *
 * **Reemplaza a la nube de palabras.** Una nube compara áreas, y el ojo compara áreas mal:
 * además una palabra larga ocupa más espacio que una corta con la misma frecuencia, así que
 * el tamaño miente dos veces.
 *
 * **Y reemplaza a las barras agrupadas**, que fue el primer intento. Con una barra por oleada
 * cada palabra ocupaba tres filas y la comparación que importa (la misma palabra entre
 * oleadas) quedaba repartida en tres marcas que había que apilar con la vista. Con todos los
 * puntos en la fila de la palabra, la distancia entre ellos **es** el cambio entre oleadas.
 *
 * **El eje es porcentaje, no conteo.** En 2025 contestaron 1.225 personas y en 2023 fueron
 * 664: un conteo crudo diría más sobre el tamaño de la muestra que sobre la palabra. El
 * conteo va igual, al pasar el cursor.
 *
 * El orden es por el total de las oleadas visibles, así que la palabra más mencionada queda
 * arriba y se puede leer la lista de corrido.
 */

const ALTO_FILA = 22
/** Margen en px a cada lado del lienzo: sin él, un punto en 0 o en 100 sale cortado por la mitad
 *  y su rótulo se pierde fuera de la tarjeta. Es el mismo desborde que ya se pagó en las figuras
 *  de ideología. */
const MARGEN = 38
const PUNTO = 10
/** Separación mínima entre el punto más chico y el más grande, en porcentaje del lienzo, para
 *  rotular los dos extremos. Bajo eso los dos rótulos se pisan y va solo el del máximo. */
const SEPARACION_MINIMA = 22

interface Props {
  nube: NubePalabras
  /** Cuántas palabras mostrar. El resto está en la lista de abajo. */
  tope?: number
}

type Corte = 'ola' | 'ideologia'

interface Serie {
  clave: string
  etiqueta: string
  base: number
  palabras: { palabra: string, n: number }[]
}

export default function PalabrasPorGrupo ({ nube, tope = 12 }: Props) {
  const [corte, setCorte] = useState<Corte>('ola')

  const porIdeologia: GrupoNube[] = nube.porIdeologia ?? []
  const hayIdeologia = porIdeologia.length > 0

  const series: Serie[] = corte === 'ideologia' && hayIdeologia
    ? porIdeologia.map((g) => ({ clave: g.id, etiqueta: g.etiqueta, base: g.base ?? 0, palabras: g.palabras }))
    : nube.olas.map((ola) => ({
        clave: String(ola),
        etiqueta: String(ola),
        base: nube.baseOla?.[String(ola)] ?? 0,
        palabras: nube.porOla[String(ola)] ?? [],
      }))

  const conBase = series.filter((s) => s.base > 0)
  if (conBase.length === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay respuestas suficientes para este recorte.</p>
  }

  // El orden sale de la suma de porcentajes, no de conteos: si no, la oleada más grande
  // decidiría sola qué palabra va arriba.
  const puntaje = new Map<string, number>()
  for (const s of conBase) {
    for (const p of s.palabras) {
      puntaje.set(p.palabra, (puntaje.get(p.palabra) ?? 0) + (100 * p.n) / s.base)
    }
  }
  const palabras = [...puntaje.entries()].sort((a, b) => b[1] - a[1]).slice(0, tope).map(([p]) => p)

  const valor = (s: Serie, palabra: string) => {
    const e = s.palabras.find((p) => p.palabra === palabra)
    return { n: e?.n ?? 0, pct: e ? (100 * e.n) / s.base : 0 }
  }

  const maximo = Math.max(...palabras.flatMap((p) => conBase.map((s) => valor(s, p).pct)), 1)
  /** Posición del punto en el lienzo, de 0 a 100. */
  const x = (pct: number) => Math.min(100, (100 * pct) / maximo)

  const colorDe = (i: number) => IDENTIDAD[i % IDENTIDAD.length]
  const marcas = [0, 0.5, 1]

  return (
    <div>
      {hayIdeologia && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Comparar por</span>
          <div className="flex rounded-md border border-gray-300">
            {([['ola', 'Oleada'], ['ideologia', 'Ideología']] as const).map(([id, texto], i) => (
              <button
                key={id}
                type="button"
                aria-pressed={corte === id}
                onClick={() => { setCorte(id) }}
                className={`px-3 py-1 text-sm transition-colors ${i > 0 ? 'border-l border-gray-300' : ''} ${
                  corte === id ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                } ${i === 0 ? 'rounded-l-md' : 'rounded-r-md'}`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Eje arriba, con la mitad y el máximo. Sin él, un punto más a la derecha solo dice
          «más que el otro» y no cuánto. Va sobre el mismo lienzo que los puntos, márgenes
          incluidos, o las marcas quedan corridas respecto de lo que rotulan. */}
      <div className="grid grid-cols-1 items-end sm:grid-cols-[minmax(0,5.5rem)_1fr] sm:gap-2">
        <span className="hidden sm:block" />
        <div className="relative h-4" style={{ marginLeft: MARGEN, marginRight: MARGEN }}>
          {marcas.map((f) => (
            <span
              key={f}
              className="absolute bottom-0 text-[10px] tabular-nums text-gray-400"
              style={{ left: `${f * 100}%`, transform: f === 0 ? 'none' : f === 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {porcentaje(maximo * f, 0)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {palabras.map((palabra) => {
          const puntos = conBase
            .map((s, i) => ({ ...valor(s, palabra), serie: s, color: colorDe(i) }))
            .filter((p) => p.n > 0)
          const posiciones = puntos.map((p) => x(p.pct))
          const min = Math.min(...posiciones)
          const max = Math.max(...posiciones)
          // Con los extremos pegados los dos rótulos se pisan, así que va solo el del máximo.
          const dosRotulos = puntos.length > 1 && max - min >= SEPARACION_MINIMA
          const elMin = puntos[posiciones.indexOf(min)]
          const elMax = puntos[posiciones.indexOf(max)]

          return (
            // En pantalla angosta el nombre va sobre su fila y no al lado: la columna de texto
            // se comía 88 de los 296 px disponibles y los puntos quedaban unos encima de otros.
            <div
              key={palabra}
              className="grid grid-cols-1 items-center pb-1 sm:grid-cols-[minmax(0,5.5rem)_1fr] sm:gap-2 sm:pb-0"
            >
              <span className="truncate text-xs text-gray-700 sm:text-right" title={palabra}>{palabra}</span>
              <div className="relative" style={{ height: `${ALTO_FILA}px`, marginLeft: MARGEN, marginRight: MARGEN }}>
                {marcas.map((f) => (
                  <span key={f} className="absolute inset-y-0 w-px bg-gray-100" style={{ left: `${f * 100}%` }} />
                ))}

                {/* El trazo entre el punto más chico y el más grande: es el rango entre oleadas,
                    y sin él la fila se lee como puntos sueltos en vez de como un recorrido. */}
                {puntos.length > 1 && (
                  <span
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-gray-200"
                    style={{ left: `${min}%`, width: `${max - min}%` }}
                  />
                )}

                {/* El anillo blanco separa dos puntos vecinos. Dos puntos con el mismo valor sí
                    se tapan: el número exacto está al pasar el cursor y en la lista de abajo. */}
                {puntos.map((p) => (
                  <span
                    key={p.serie.clave}
                    className="absolute top-1/2 rounded-full ring-2 ring-white"
                    style={{
                      left: `${x(p.pct)}%`,
                      width: `${PUNTO}px`,
                      height: `${PUNTO}px`,
                      marginLeft: `${-PUNTO / 2}px`,
                      marginTop: `${-PUNTO / 2}px`,
                      backgroundColor: p.color,
                    }}
                    title={`${p.serie.etiqueta} · ${palabra}: ${porcentaje(p.pct, 1)} (${numero(p.n)} de ${numero(p.serie.base)})`}
                  />
                ))}

                {dosRotulos && elMin && (
                  <span
                    className="absolute inset-y-0 flex items-center justify-end pr-2.5 text-[10px] tabular-nums text-gray-500"
                    style={{ right: `${100 - min}%` }}
                  >
                    {porcentaje(elMin.pct, 1)}
                  </span>
                )}
                {elMax && (
                  <span
                    className="absolute inset-y-0 flex items-center pl-2.5 text-[10px] tabular-nums text-gray-500"
                    style={{ left: `${max}%` }}
                  >
                    {porcentaje(elMax.pct, 1)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {conBase.map((s, i) => (
          <li key={s.clave} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorDe(i) }} />
            {s.etiqueta}
            <span className="tabular-nums text-gray-400">{numero(s.base)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-xs leading-snug text-gray-500">
        Porcentaje de las personas que contestaron esa pregunta en cada {corte === 'ola' ? 'oleada' : 'grupo'}, no
        conteo: {conBase.map((s) => `${s.etiqueta} tiene ${numero(s.base)}`).join(', ')}, así que los conteos
        crudos no se comparan. Los rótulos son el mínimo y el máximo de cada fila; el resto aparece al pasar
        el cursor.
      </p>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
          Ver todas las palabras y sus frecuencias
        </summary>
        <ol className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
          {nube.total.map((p, i) => (
            <li key={p.palabra} className="flex justify-between gap-2 text-xs tabular-nums text-gray-600">
              <span className="truncate">{i + 1}. {p.palabra}</span>
              <span>{numero(p.n)}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}
