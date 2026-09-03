import type { Caso, Encuesta, Variable } from '../nucleo/tipos'
import { distribucion } from '../nucleo/agregar'
import { numero, porcentaje } from '../locale'

/**
 * Una variable categórica desglosada por las dieciséis regiones, de norte a sur.
 *
 * Es la única figura del monitor con desagregación territorial completa, y la que justifica
 * el diseño muestral: la muestra se estratificó por peso económico de China en la región, no
 * por población.
 *
 * **Aquí sí van barras apiladas al 100 %**, a diferencia del resto del tablero: con dieciséis
 * filas, cuatro barras por fila serían sesenta y cuatro. Lo que se compara entre regiones es
 * la composición, y para eso la apilada sirve. El precio es que los segmentos chicos quedan
 * sin etiqueta, y por eso el valor aparece al pasar el cursor y la tabla queda accesible.
 *
 * **El N por región se muestra siempre.** La región más chica tiene 15 casos en las tres
 * oleadas juntas: sin el N a la vista, un 40 % sobre 15 personas se lee igual que un 40 %
 * sobre 400.
 */

/**
 * Escala de un solo tono, de oscuro a claro. El paso más claro tiene que seguir leyéndose
 * contra el fondo blanco: con `#E8F1F0` la última categoría desaparecía y las barras parecían
 * no llegar al 100 %, cuando en realidad sí llegaban.
 */
const COLORES = ['#00544D', '#00877E', '#4FB3A9', '#A5D5CF', '#D2E8E5']
const MINIMO_FIABLE = 30

interface Props {
  encuesta: Encuesta
  casos: Caso[]
  variable: Variable
}

export default function PorRegion ({ encuesta, casos, variable }: Props) {
  const porRegion = encuesta.regiones.map((r) => ({
    ...r,
    agregado: distribucion(casos.filter((c) => Number(c.region) === r.codigo), variable),
  })).filter((r) => r.agregado.base > 0)

  if (porRegion.length === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay datos disponibles para este recorte.</p>
  }

  // Un orden de categorías común a todas las filas: si cada región ordenara las suyas, los
  // colores cambiarían de significado de una fila a la siguiente.
  const categorias = variable.categorias ?? []

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-[2px]">
        {porRegion.map((r) => (
          <div key={r.codigo} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.6rem] items-center gap-2">
            <span className="truncate text-xs text-gray-600" title={r.etiqueta}>{r.etiqueta}</span>
            <div className="flex h-4 overflow-hidden rounded-sm bg-gray-100">
              {categorias.map((cat, i) => {
                const seg = r.agregado.segmentos.find((s) => s.codigo === cat.codigo)
                if (!seg || seg.porcentaje === 0) return null
                return (
                  <span
                    key={cat.codigo}
                    className="h-4"
                    style={{ width: `${seg.porcentaje}%`, backgroundColor: COLORES[i % COLORES.length] }}
                    title={`${r.etiqueta} · ${cat.etiqueta}: ${porcentaje(seg.porcentaje, 0)} (${numero(seg.n)})`}
                  />
                )
              })}
            </div>
            <span
              className={`text-right text-xs tabular-nums ${r.agregado.base < MINIMO_FIABLE ? 'text-amber-700' : 'text-gray-500'}`}
              title={r.agregado.base < MINIMO_FIABLE ? 'Menos de 30 casos: el porcentaje es poco fiable' : undefined}
            >
              {numero(r.agregado.base)}
            </span>
          </div>
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {categorias.map((cat, i) => (
          <li key={cat.codigo} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            {cat.etiqueta}
          </li>
        ))}
      </ul>

      <p className="mt-2 text-xs text-gray-500">
        La columna de la derecha es el número de casos de cada región. En ámbar, las que tienen menos de
        30: ahí el porcentaje se mueve mucho con una respuesta.
      </p>
    </div>
  )
}
