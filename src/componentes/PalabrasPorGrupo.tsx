import { useState } from 'react'
import type { GrupoNube, NubePalabras } from '../nucleo/tipos'
import { IDENTIDAD } from '../nucleo/paleta'
import { numero, porcentaje } from '../locale'
import Puntos, { type FilaDePuntos, type SerieDePuntos } from './Puntos'

/**
 * Las palabras más repetidas, en puntos, con un punto por oleada sobre la fila de la palabra.
 *
 * **Reemplaza a la nube de palabras** (un registro de decisiones interno). Una nube compara áreas, y el ojo compara
 * áreas mal: además una palabra larga ocupa más espacio que una corta con la misma frecuencia,
 * así que el tamaño miente dos veces.
 *
 * **El eje es porcentaje, no conteo.** En 2025 contestaron 1.225 personas y en 2023 fueron
 * 664: un conteo crudo diría más sobre el tamaño de la muestra que sobre la palabra. El
 * conteo va igual, al pasar el cursor.
 *
 * El orden es por el total de las oleadas visibles, así que la palabra más mencionada queda
 * arriba y se puede leer la lista de corrido.
 */

interface Props {
  nube: NubePalabras
  /** Cuántas palabras mostrar. El resto está en la lista de abajo. */
  tope?: number
}

type Corte = 'ola' | 'ideologia'

interface Grupo {
  clave: string
  etiqueta: string
  base: number
  palabras: { palabra: string, n: number }[]
}

export default function PalabrasPorGrupo ({ nube, tope = 12 }: Props) {
  const [corte, setCorte] = useState<Corte>('ola')

  const porIdeologia: GrupoNube[] = nube.porIdeologia ?? []
  const hayIdeologia = porIdeologia.length > 0

  const grupos: Grupo[] = corte === 'ideologia' && hayIdeologia
    ? porIdeologia.map((g) => ({ clave: g.id, etiqueta: g.etiqueta, base: g.base ?? 0, palabras: g.palabras }))
    : nube.olas.map((ola) => ({
        clave: String(ola),
        etiqueta: String(ola),
        base: nube.baseOla?.[String(ola)] ?? 0,
        palabras: nube.porOla[String(ola)] ?? [],
      }))

  const conBase = grupos.filter((g) => g.base > 0)
  if (conBase.length === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay respuestas suficientes para este recorte.</p>
  }

  // El orden sale de la suma de porcentajes, no de conteos: si no, la oleada más grande
  // decidiría sola qué palabra va arriba.
  const puntaje = new Map<string, number>()
  for (const g of conBase) {
    for (const p of g.palabras) {
      puntaje.set(p.palabra, (puntaje.get(p.palabra) ?? 0) + (100 * p.n) / g.base)
    }
  }
  const palabras = [...puntaje.entries()].sort((a, b) => b[1] - a[1]).slice(0, tope).map(([p]) => p)

  const conteo = (g: Grupo, palabra: string) => g.palabras.find((p) => p.palabra === palabra)?.n ?? 0
  const pct = (g: Grupo, palabra: string) => (100 * conteo(g, palabra)) / g.base

  const series: SerieDePuntos[] = conBase.map((g, i) => ({
    clave: g.clave,
    etiqueta: g.etiqueta,
    color: IDENTIDAD[i % IDENTIDAD.length],
    nota: numero(g.base),
  }))
  const filas: FilaDePuntos[] = palabras.map((palabra) => ({
    clave: palabra,
    etiqueta: palabra,
    // Cero menciones no es un punto en el origen: es que esa palabra no aparece en esa oleada.
    valores: conBase.map((g) => (conteo(g, palabra) > 0 ? pct(g, palabra) : null)),
  }))
  const maximo = Math.max(...filas.flatMap((f) => f.valores.map((v) => v ?? 0)), 1)

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

      <Puntos
        series={series}
        filas={filas}
        escala={{ min: 0, max: maximo }}
        formato={(v) => porcentaje(v, v === 0 || v >= 10 ? 0 : 1)}
        titulo={(fila, serie, valor) => {
          const g = conBase.find((x) => x.clave === serie.clave)!
          return `${serie.etiqueta} · ${fila.etiqueta}: ${porcentaje(valor, 1)} (${numero(conteo(g, fila.clave))} de ${numero(g.base)})`
        }}
      />

      <p className="mt-2 text-xs leading-snug text-gray-500">
        Porcentaje de las personas que contestaron esa pregunta en cada {corte === 'ola' ? 'oleada' : 'grupo'}, no
        conteo: {conBase.map((g) => `${g.etiqueta} tiene ${numero(g.base)}`).join(', ')}, así que los conteos
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
