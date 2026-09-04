import { useState } from 'react'
import type { GrupoNube, NubePalabras } from '../nucleo/tipos'
import { IDENTIDAD } from '../nucleo/paleta'
import { numero, porcentaje } from '../locale'

/**
 * Las palabras más repetidas, en barras, con una serie por oleada.
 *
 * **Reemplaza a la nube de palabras.** Una nube compara áreas, y el ojo compara áreas mal:
 * además una palabra larga ocupa más espacio que una corta con la misma frecuencia, así que
 * el tamaño miente dos veces. Con barras alineadas a una base común, la comparación entre
 * palabras y entre oleadas se lee de verdad.
 *
 * **El eje es porcentaje, no conteo.** En 2025 contestaron 1.225 personas y en 2023 fueron
 * 664: un conteo crudo diría más sobre el tamaño de la muestra que sobre la palabra. El
 * conteo va igual, al pasar el cursor.
 *
 * El orden es por el total de las oleadas visibles, así que la palabra más mencionada queda
 * arriba y se puede leer la lista de corrido.
 */

const ALTO_FILA = 15
const SEPARACION = 5

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
  /** Ancho de la barra en porcentaje del lienzo. Con un mínimo visible para lo que no es cero. */
  const largo = (pct: number) => Math.max((100 * pct) / maximo, pct > 0 ? 1.5 : 0)

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
                onClick={() => setCorte(id)}
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

      {/* Eje de referencia arriba, con la marca de la mitad y del máximo. Sin él, una barra
          larga solo dice «más que las otras» y no cuánto. */}
      <div className="mb-1 grid grid-cols-[minmax(0,6.5rem)_1fr_2.6rem] items-end gap-3">
        <span />
        <div className="relative h-4 text-[10px] tabular-nums text-gray-400">
          {[0, 0.5, 1].map((f) => (
            <span
              key={f}
              className="absolute bottom-0"
              style={{ left: `${f * 100}%`, transform: f === 0 ? 'none' : f === 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {porcentaje(maximo * f, 0)}
            </span>
          ))}
        </div>
        <span />
      </div>

      <div className="flex flex-col gap-2">
        {palabras.map((palabra) => (
          <div key={palabra} className="grid grid-cols-[minmax(0,6.5rem)_1fr_2.6rem] items-center gap-3">
            <span className="truncate text-right text-xs text-gray-700" title={palabra}>{palabra}</span>
            <div className="flex flex-col" style={{ gap: `${SEPARACION}px` }}>
              {conBase.map((s, i) => {
                const v = valor(s, palabra)
                return (
                  <div
                    key={s.clave}
                    className="relative rounded-sm bg-gray-100"
                    style={{ height: `${ALTO_FILA}px` }}
                    title={`${s.etiqueta} · ${palabra}: ${porcentaje(v.pct, 1)} (${numero(v.n)} de ${numero(s.base)})`}
                  >
                    {/* El valor va escrito porque las barras son finas y el color no alcanza
                        para leer magnitudes: es la misma regla del resto del tablero. Cuando la
                        barra llega casi al final, el número no cabe afuera y va **dentro de la
                        barra**, en blanco. Tiene que ir dentro del div de color y no del riel:
                        posicionado contra el riel, el texto blanco cae sobre el gris. */}
                    <div
                      className="absolute inset-y-0 left-0 flex items-center justify-end overflow-hidden rounded-sm"
                      style={{
                        width: `${largo(v.pct)}%`,
                        backgroundColor: IDENTIDAD[i % IDENTIDAD.length],
                      }}
                    >
                      {v.n > 0 && largo(v.pct) > 82 && (
                        <span className="pr-1.5 text-[10px] font-medium tabular-nums text-white">
                          {porcentaje(v.pct, 1)}
                        </span>
                      )}
                    </div>
                    {v.n > 0 && largo(v.pct) <= 82 && (
                      <span
                        className="absolute inset-y-0 flex items-center pl-1.5 text-[10px] tabular-nums text-gray-500"
                        style={{ left: `${largo(v.pct)}%` }}
                      >
                        {porcentaje(v.pct, 1)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <span />
          </div>
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {conBase.map((s, i) => (
          <li key={s.clave} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: IDENTIDAD[i % IDENTIDAD.length] }} />
            {s.etiqueta}
            <span className="tabular-nums text-gray-400">{numero(s.base)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-xs leading-snug text-gray-500">
        Porcentaje de las personas que contestaron esa pregunta en cada {corte === 'ola' ? 'oleada' : 'grupo'}, no
        conteo: {conBase.map((s) => `${s.etiqueta} tiene ${numero(s.base)}`).join(', ')}, así que los conteos
        crudos no se comparan. El número exacto aparece al pasar el cursor.
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
