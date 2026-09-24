import type { Bloque, Fila, Modelo } from '../nucleo/explorador'
import { BASE_MINIMA, formaDeFigura, paletaDeCorte } from '../nucleo/explorador'
import { SEMANTICOS } from '../nucleo/paleta'
import { topePorcentaje } from '../nucleo/escala'
import { decimal, numero, porcentaje } from '../locale'
import Puntos from './Puntos'

/**
 * La figura del explorador, la única, en dos formas según lo que compare.
 *
 * **Barras de 0 a 100**: una oleada sin corte; el termómetro en todos sus estados; y las
 * comparaciones de preguntas con **dos categorías**, donde la segunda fila de una mancuerna es
 * 100 menos la primera (Felipe, décima ronda: «en estos casos podría ser mejor descartar las
 * mancuernas y quedarnos con barras»; y del termómetro, «esto queda mejor en barras»). Comparando,
 * cada categoría es un bloque con una barra por oleada o por grupo. Las menciones también van sobre
 * 100, y una categoría con 0 % no lleva barra.
 *
 * **Mancuerna**, con `Puntos`, en las demás comparaciones (entre oleadas o con un corte): una fila
 * por categoría y un punto por oleada o por grupo, y la distancia entre puntos es el cambio (Felipe,
 * novena ronda: «quiero que los gráficos que comparan entre oleadas sean gráficos de mancuernas»).
 *
 * **El color dice qué se compara:** oleadas en la rampa teal (`ORDEN`), grupos de un corte ordenado
 * en la violeta (`GRUPOS`), género en violeta y ocre (`GENERO`).
 *
 * El largo de las barras cambia con `transform: scaleX`, no con `width`, y en 200 ms: al pasar
 * de una oleada a otra la barra se estira desde donde estaba, que es justo el cambio que se quiere ver.
 */

const TRANSICION = 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]'

export default function FiguraExplorador ({ modelo }: { modelo: Modelo }) {
  if (modelo.forma === 'vacia') {
    return <p className="py-4 text-sm italic text-gray-500">{modelo.motivo}</p>
  }

  const { colores, tamanos } = paletaDeCorte(modelo)
  const colorDe = (i: number) => colores[Math.min(i, colores.length - 1)]

  if (modelo.forma === 'medias') return <FiguraMedias modelo={modelo} colorDe={colorDe} />

  const { bloques, series, escala, compara } = modelo
  const escasa = bloques.some((b) => b.filas.some((f) => f.base > 0 && f.base < BASE_MINIMA))
  const bases = bloques[0]?.filas.map((f) => f.base) ?? []
  const enBarras = formaDeFigura(modelo) === 'barras'
  const pie = (
    <>
      {escala === 'menciones' && (
        <p className="mt-2 text-xs text-gray-500">
          Se puede marcar más de una opción, así que los porcentajes suman más de 100.
        </p>
      )}
      {escasa && <NotaEscasa donde={compara === 'olas' ? 'en esa oleada' : compara === 'grupos' ? 'en ese grupo' : 'en esa fila'} />}
      <TablaAccesible
        cabeza={['', ...(compara === 'nada' ? ['%'] : series.map((s) => s.etiqueta))]}
        filas={[
          // Con respuestas en la oleada y sin valor, la categoría no existía ahí (`p4`): se dice.
          ...bloques.map((b) => [b.etiqueta, ...b.filas.map((f) => (f.valor !== null ? porcentaje(f.valor, 0) : f.base > 0 ? 'No se preguntó' : '—'))]),
          ['Respuestas', ...bases.map((x) => numero(x))],
        ]}
      />
    </>
  )

  if (compara === 'nada') {
    return (
      <figure className="mt-2">
        <div className="flex flex-col gap-[3px]">
          {bloques.map((b) => (
            <FilaBarra
              key={b.clave}
              fila={b.filas[0]}
              etiqueta={b.etiqueta}
              // Una serie: un color, salvo las categorías con polaridad propia.
              color={SEMANTICOS[b.etiqueta] ?? colores[0]}
              texto={(v) => porcentaje(v, 0)}
            />
          ))}
        </div>
        {pie}
      </figure>
    )
  }

  if (enBarras) {
    return (
      <figure className="mt-2">
        <Leyenda series={series} colorDe={colorDe} bases={bases} forma="barra" />
        <div className="flex flex-col gap-3">
          {bloques.map((b) => <BloqueAgrupado key={b.clave} bloque={b} colorDe={colorDe} />)}
        </div>
        {pie}
      </figure>
    )
  }

  const valores = bloques.flatMap((b) => b.filas.map((f) => f.valor)).filter((v): v is number => v !== null)
  const tope = topePorcentaje(valores)
  const puntosSeries = series.map((s, i) => ({ clave: s.clave, etiqueta: s.etiqueta, color: colorDe(i), ...(tamanos ? { tamano: tamanos[i] } : {}) }))
  // El punto crece con la oleada y en las rampas de grupos: dos vecinos de la rampa quedan bajo el
  // piso de separación con visión normal, y el tamaño los distingue sin color (`paletaDeCorte`).
  const filaDe = new Map(bloques.map((b) => [b.clave, b]))
  return (
    <figure className="mt-2">
      <Leyenda series={series} colorDe={colorDe} bases={bases} forma="punto" tamanos={tamanos} />
      <Puntos
        series={puntosSeries}
        filas={bloques.map((b) => ({
          clave: b.clave,
          etiqueta: b.etiqueta,
          valores: b.filas.map((f) => f.valor),
          // Sin la muestra de color semántico: los puntos ya llevan el color de la oleada o del
          // grupo, y un segundo color con otro significado en la misma figura se confunde (el
          // violeta de grupos contra el azul de «A favor de EE. UU.», ΔE 4,1 bajo deuteranopía).
        }))}
        escala={{ min: 0, max: tope }}
        marcas={tope / 20 + 1}
        formato={(v) => porcentaje(v, 0)}
        titulo={(fila, serie, v) => {
          const f = filaDe.get(fila.clave)?.filas.find((x) => x.clave === serie.clave)
          return `${serie.etiqueta} · ${fila.etiqueta}: ${porcentaje(v, 1)}${f ? ` (${numero(f.n)} de ${numero(f.base)})` : ''}`
        }}
        anchoEtiqueta="13rem"
        // Entre oleadas manda dónde está cada categoría hoy; entre grupos ninguno pesa más que otro.
        rotular={compara === 'olas' ? series.length - 1 : 'extremos'}
        esquivar
        entrada={false}
        unidadEje={escala === 'menciones'
          ? `Porcentaje que marcó cada opción${tope < 100 ? ` · eje de 0 a ${tope}` : ''}`
          : `Porcentaje de respuestas${tope < 100 ? ` · eje de 0 a ${tope}` : ''}`}
        leyenda={false}
        rotulosLargos
      />
      {pie}
    </figure>
  )
}

/**
 * El termómetro, en barras de 0 a 100: una por oleada, una por grupo, o una sola (Felipe, décima
 * ronda: «esto queda mejor en barras»). Sobre la escala entera no hay recorte que declarar.
 */
function FiguraMedias ({ modelo, colorDe }: { modelo: Extract<Modelo, { forma: 'medias' }>, colorDe: (i: number) => string }) {
  const { filas, series } = modelo
  const escasa = filas.some((f) => f.base > 0 && f.base < BASE_MINIMA)
  return (
    <figure className="mt-2">
      {series.length > 1 && <Leyenda series={series} colorDe={colorDe} bases={filas.map((f) => f.base)} forma="barra" />}
      <p className="mb-1 text-xs text-gray-500">Promedio de 0 a 100</p>
      <div className="flex flex-col gap-[3px]">
        {filas.map((f, i) => (
          <FilaBarra key={f.clave} fila={f} etiqueta={f.etiqueta} color={colorDe(i)} texto={(v) => decimal(v)} corta />
        ))}
      </div>
      {modelo.noResponde && (
        <p className="mt-2 text-xs text-gray-500">
          Prefirieron no responder:{' '}
          {modelo.noResponde.map((r, i) => (
            <span key={r.clave} className="tabular-nums">
              {i > 0 && ' · '}
              {filas.length > 1 && `${filas[i].etiqueta}: `}
              {r.total > 0 ? porcentaje((100 * r.n) / r.total, 0) : '—'}
            </span>
          ))}
          . Quedan fuera del promedio.
        </p>
      )}
      {escasa && <NotaEscasa donde={modelo.compara === 'olas' ? 'en esa oleada' : modelo.compara === 'grupos' ? 'en ese grupo' : 'en esa fila'} />}
      <TablaAccesible filas={filas.map((f) => [f.etiqueta, f.valor === null ? '—' : decimal(f.valor), numero(f.base)])} cabeza={['', 'Promedio', 'Respuestas']} />
    </figure>
  )
}

/** Una categoría con una barra por oleada o por grupo. Sin color semántico, por lo mismo que la mancuerna. */
function BloqueAgrupado ({ bloque, colorDe }: { bloque: Bloque, colorDe: (i: number) => string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-800">{bloque.etiqueta}</p>
      <div className="mt-1 flex flex-col gap-[3px] pl-3">
        {bloque.filas.map((f, i) => (
          <FilaBarra key={f.clave} fila={f} etiqueta={f.etiqueta} color={colorDe(i)} texto={(v) => porcentaje(v, 0)} corta />
        ))}
      </div>
    </div>
  )
}

function FilaBarra ({
  fila, etiqueta, color, texto, corta = false,
}: { fila: Fila, etiqueta: string, color: string, texto: (v: number) => string, corta?: boolean }) {
  const escasa = fila.base > 0 && fila.base < BASE_MINIMA
  const valor = fila.valor
  // En teléfono, una categoría (rótulo largo) va en su propia línea sobre la barra: al lado, la
  // columna de 12rem dejaba la barra en 40 px. Un grupo o una oleada (rótulo corto) sigue al lado.
  const columnas = corta
    ? 'grid-cols-[minmax(0,6rem)_minmax(0,1fr)_3.25rem] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_3.25rem]'
    : 'grid-cols-[minmax(0,1fr)_3.25rem] sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_3.25rem]'
  return (
    <div
      className={`grid items-center gap-x-3 ${columnas}`}
      title={valor === null ? undefined : `${etiqueta ? `${etiqueta}: ` : ''}${numero(fila.n)} de ${numero(fila.base)} respuestas`}
    >
      {/* Rótulos completos, en dos líneas si hace falta: truncados, las opciones largas no se leían. */}
      <span className={`text-xs leading-snug text-gray-600 ${corta ? '' : 'col-span-2 sm:col-span-1'}`}>{etiqueta}</span>
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
 * no solo al pasar el cursor. La marca imita a la figura: cuadrado para barras, punto para la
 * mancuerna, y entre oleadas un punto que crece con la oleada.
 */
function Leyenda ({ series, colorDe, bases, forma, tamanos }: { series: { clave: string, etiqueta: string }[], colorDe: (i: number) => string, bases: number[], forma: 'barra' | 'punto', tamanos?: number[] | null }) {
  return (
    <ul className="mb-2 flex flex-wrap items-center gap-x-3.5 gap-y-1">
      {series.map((s, i) => {
        const d = tamanos?.[i] ?? 10
        const escasa = (bases[i] ?? 0) > 0 && (bases[i] ?? 0) < BASE_MINIMA
        return (
          <li key={s.clave} className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span aria-hidden className={`inline-block shrink-0 ${forma === 'barra' ? 'rounded-sm' : 'rounded-full'}`} style={{ width: d, height: d, backgroundColor: colorDe(i) }} />
            {s.etiqueta}
            <span className="tabular-nums text-gray-400">({numero(bases[i] ?? 0)}){escasa ? '*' : ''}</span>
          </li>
        )
      })}
      <li className="text-[11px] text-gray-400">entre paréntesis, respuestas</li>
    </ul>
  )
}

/**
 * Solo el dato, sin juicio sobre él (Felipe, décima ronda: «queremos entregar información en esta
 * sección más que dar conclusiones»). Hasta ahí decía además «el porcentaje dice poco».
 */
function NotaEscasa ({ donde }: { donde: string }) {
  return <p className="mt-1 text-xs text-gray-500">* Menos de {BASE_MINIMA} respuestas {donde}.</p>
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
