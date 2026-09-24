import type { Bloque, Fila, Modelo } from '../nucleo/explorador'
import { BASE_MINIMA } from '../nucleo/explorador'
import { IDENTIDAD, SEMANTICOS, pasosDeOrden } from '../nucleo/paleta'
import { decimal, numero, porcentaje } from '../locale'

/**
 * La figura del explorador, la única: barras horizontales de 0 a 100.
 *
 * Reemplaza a tres (`Distribucion`, `Menciones`, `BarrasPorOla`) que dibujaban la misma pregunta
 * de tres maneras según el estado. Ahora la comparación por grupo y la comparación entre oleadas
 * se leen igual: cada categoría es un bloque, y dentro del bloque va una fila por grupo o por
 * oleada, con su nombre escrito. Sin corte y en una oleada, cada categoría es una sola fila.
 *
 * **Todas las barras van sobre 0 a 100**, también las menciones: normalizarlas contra la más
 * frecuente hacía que un 50 % llenara el ancho. Una categoría con 0 % no lleva barra.
 *
 * El largo cambia con `transform: scaleX`, no con `width`, y en 200 ms: al pasar de una oleada a
 * otra la barra se estira desde donde estaba, que es justo el cambio que se quiere ver.
 */

const TRANSICION = 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]'

export default function FiguraExplorador ({ modelo }: { modelo: Modelo }) {
  if (modelo.forma === 'vacia') {
    return <p className="py-4 text-sm italic text-gray-500">{modelo.motivo}</p>
  }

  const colores = modelo.color === 'orden'
    ? pasosDeOrden(modelo.series.length)
    : modelo.color === 'identidad'
      ? [...IDENTIDAD]
      : [IDENTIDAD[0]]

  if (modelo.forma === 'medias') {
    const escasa = modelo.filas.some((f) => f.base > 0 && f.base < BASE_MINIMA)
    return (
      <figure className="mt-2">
        {modelo.series.length > 1 && <Leyenda series={modelo.series} colores={colores} bases={modelo.filas.map((f) => f.base)} />}
        <p className="mb-1 text-xs text-gray-500">Promedio de 0 a 100</p>
        <div className="flex flex-col gap-[3px]">
          {modelo.filas.map((f, i) => (
            <FilaBarra
              key={f.clave}
              fila={f}
              etiqueta={f.etiqueta}
              color={colores[Math.min(i, colores.length - 1)]}
              texto={(v) => decimal(v)}
            />
          ))}
        </div>
        {modelo.noResponde && (
          <p className="mt-2 text-xs text-gray-500">
            Prefirieron no responder:{' '}
            {modelo.noResponde.map((r, i) => (
              <span key={r.clave} className="tabular-nums">
                {i > 0 && ' · '}
                {modelo.filas.length > 1 && `${modelo.filas[i].etiqueta}: `}
                {r.total > 0 ? porcentaje((100 * r.n) / r.total, 0) : '—'}
              </span>
            ))}
            . Quedan fuera del promedio.
          </p>
        )}
        {escasa && <NotaEscasa />}
        <TablaAccesible filas={modelo.filas.map((f) => [f.etiqueta, f.valor === null ? '—' : decimal(f.valor), numero(f.base)])} cabeza={['', 'Promedio', 'Respuestas']} />
      </figure>
    )
  }

  const { bloques, series, escala } = modelo
  const agrupada = series.length > 0
  const escasa = bloques.some((b) => b.filas.some((f) => f.base > 0 && f.base < BASE_MINIMA))

  return (
    <figure className="mt-2">
      {agrupada && <Leyenda series={series} colores={colores} bases={bloques[0]?.filas.map((f) => f.base) ?? []} />}
      <div className={`flex flex-col ${agrupada ? 'gap-3' : 'gap-[3px]'}`}>
        {bloques.map((b) => agrupada
          ? <BloqueAgrupado key={b.clave} bloque={b} colores={colores} />
          : (
            <FilaBarra
              key={b.clave}
              fila={b.filas[0]}
              etiqueta={b.etiqueta}
              // Sin corte hay una serie: un color, salvo las categorías con polaridad propia.
              color={SEMANTICOS[b.etiqueta] ?? colores[0]}
              texto={(v) => porcentaje(v, 0)}
            />
            ))}
      </div>
      {escala === 'menciones' && (
        <p className="mt-2 text-xs text-gray-500">
          Se puede marcar más de una opción, así que los porcentajes suman más de 100.
        </p>
      )}
      {escasa && <NotaEscasa />}
      <TablaAccesible
        cabeza={['', ...(agrupada ? series.map((s) => s.etiqueta) : ['%'])]}
        filas={[
          ...bloques.map((b) => [b.etiqueta, ...b.filas.map((f) => (f.valor === null ? '—' : porcentaje(f.valor, 0)))]),
          ['Respuestas', ...(bloques[0]?.filas.map((f) => numero(f.base)) ?? [])],
        ]}
      />
    </figure>
  )
}

function BloqueAgrupado ({ bloque, colores }: { bloque: Bloque, colores: string[] }) {
  const polaridad = SEMANTICOS[bloque.etiqueta]
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
        {/* La categoría con color propio lo muestra en el rótulo: las filas ya usan el color del grupo. */}
        {polaridad && <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: polaridad }} />}
        {bloque.etiqueta}
      </p>
      <div className="mt-1 flex flex-col gap-[3px]">
        {bloque.filas.map((f, i) => (
          <FilaBarra
            key={f.clave}
            fila={f}
            etiqueta={f.etiqueta}
            color={colores[Math.min(i, colores.length - 1)]}
            texto={(v) => porcentaje(v, 0)}
            sangria
          />
        ))}
      </div>
    </div>
  )
}

function FilaBarra ({
  fila, etiqueta, color, texto, sangria = false,
}: { fila: Fila, etiqueta: string, color: string, texto: (v: number) => string, sangria?: boolean }) {
  const escasa = fila.base > 0 && fila.base < BASE_MINIMA
  const valor = fila.valor
  // En teléfono, una categoría (rótulo largo) va en su propia línea sobre la barra: al lado, la
  // columna de 12rem dejaba la barra en 40 px. Un grupo o una oleada (rótulo corto) sigue al lado.
  const columnas = sangria
    ? 'grid-cols-[minmax(0,6rem)_minmax(0,1fr)_3.25rem] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_3.25rem] pl-3'
    : 'grid-cols-[minmax(0,1fr)_3.25rem] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_3.25rem]'
  return (
    <div
      className={`grid items-center gap-x-3 ${columnas}`}
      title={valor === null ? undefined : `${etiqueta ? `${etiqueta}: ` : ''}${numero(fila.n)} de ${numero(fila.base)} respuestas`}
    >
      {/* Rótulos completos, en dos líneas si hace falta: truncados, las opciones largas no se leían. */}
      <span className={`text-xs leading-snug text-gray-600 ${sangria ? '' : 'col-span-2 sm:col-span-1'}`}>{etiqueta}</span>
      {valor === null
        ? <span className="col-span-2 text-xs italic text-gray-400">No se preguntó</span>
        : (
          <>
            <div className="h-4 overflow-hidden rounded-sm bg-gray-100">
              <div
                className={`h-4 origin-left rounded-sm ${TRANSICION}`}
                style={{ transform: `scaleX(${Math.min(Math.max(valor, 0), 100) / 100})`, backgroundColor: color }}
              />
            </div>
            <span className={`text-right text-xs tabular-nums ${escasa ? 'text-gray-400' : 'text-gray-900'}`}>
              {texto(valor)}{escasa ? '*' : ''}
            </span>
          </>
          )}
    </div>
  )
}

/**
 * Qué color es qué grupo u oleada, **con su número de respuestas**: sin muestra probabilística ni
 * margen de error, el N es lo único que dice cuánto pesa cada fila, y tiene que estar a la vista,
 * no solo al pasar el cursor.
 */
function Leyenda ({ series, colores, bases }: { series: { clave: string, etiqueta: string }[], colores: string[], bases: number[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-3.5 gap-y-1">
      {series.map((s, i) => (
        <li key={s.clave} className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colores[Math.min(i, colores.length - 1)] }} />
          {s.etiqueta}
          <span className="tabular-nums text-gray-400">({numero(bases[i] ?? 0)})</span>
        </li>
      ))}
      <li className="text-[11px] text-gray-400">entre paréntesis, respuestas</li>
    </ul>
  )
}

function NotaEscasa () {
  return <p className="mt-1 text-xs text-gray-500">* Menos de {BASE_MINIMA} respuestas en esa fila: el porcentaje dice poco.</p>
}

function TablaAccesible ({ cabeza, filas }: { cabeza: string[], filas: string[][] }) {
  // `sr-only` va en un contenedor: una tabla ignora el ancho de 1 px y desbordaba el documento.
  return (
    <div className="sr-only">
      <table>
        <thead><tr>{cabeza.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
        <tbody>{filas.map((f, i) => <tr key={i}>{f.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
      </table>
    </div>
  )
}
