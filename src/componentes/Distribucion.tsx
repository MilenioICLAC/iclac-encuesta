import type { Agregado } from '../nucleo/agregar'
import { numero, porcentaje } from '../locale'

/**
 * La distribución de una variable categórica, como barras horizontales.
 *
 * Una barra por categoría, con el valor escrito, en vez de una barra apilada al 100 %: en
 * una apilada los segmentos chicos quedan sin etiqueta y las categorías no comparten línea
 * base, así que comparar dos de ellas exige medir a ojo.
 *
 * Cuando hay corte, cada categoría se abre en una fila por grupo. **El porcentaje se calcula
 * dentro de cada grupo**, que es justo lo que cinco figuras del monitor actual hacen mal:
 * ahí el denominador es el total de la figura, así que la barra de un grupo chico se ve
 * corta porque el grupo es chico y no porque la respuesta sea menos frecuente.
 */

interface Props {
  agregado: Agregado
  /** Con corte activo: un agregado por grupo. */
  grupos?: { etiqueta: string, agregado: Agregado }[]
}

const COLORES = ['#00776E', '#00A89C', '#7FBFB8', '#B8D8D4', '#D9E7E5']

export default function Distribucion ({ agregado, grupos }: Props) {
  if (agregado.base === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay datos disponibles para este recorte.</p>
  }

  if (!grupos || grupos.length === 0) {
    return (
      <div className="mt-2 flex flex-col gap-[3px]">
        {agregado.segmentos.map((s) => (
          <Fila key={s.codigo} etiqueta={s.etiqueta} valor={s.porcentaje} n={s.n} />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      {agregado.segmentos.map((s) => (
        <div key={s.codigo}>
          <p className="text-xs font-medium text-gray-700">{s.etiqueta}</p>
          <div className="mt-1 flex flex-col gap-[3px]">
            {grupos.map((g, i) => {
              const seg = g.agregado.segmentos.find((x) => x.codigo === s.codigo)
              return (
                <Fila
                  key={g.etiqueta}
                  etiqueta={g.etiqueta}
                  valor={seg?.porcentaje ?? 0}
                  n={seg?.n ?? 0}
                  base={g.agregado.base}
                  color={COLORES[i % COLORES.length]}
                  sangria
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Fila ({
  etiqueta, valor, n, base, color = '#00776E', sangria = false,
}: { etiqueta: string, valor: number, n: number, base?: number, color?: string, sangria?: boolean }) {
  // Con menos de 30 casos el porcentaje deja de significar mucho. Se muestra igual, pero
  // marcado: esconderlo sería peor que mostrarlo con su advertencia.
  const escaso = base !== undefined && base < 30

  return (
    <div
      className={`grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 ${sangria ? 'pl-3' : ''}`}
      title={`${numero(n)} casos${base ? ` de ${numero(base)}` : ''}`}
    >
      <span className="truncate text-xs text-gray-600">{etiqueta}</span>
      <div className="h-4 rounded-sm bg-gray-100">
        <div
          className="h-4 rounded-sm"
          style={{ width: `${Math.max(valor, 0.6)}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-right text-xs tabular-nums ${escaso ? 'text-gray-400' : 'text-gray-900'}`}>
        {porcentaje(valor, 0)}{escaso ? '*' : ''}
      </span>
    </div>
  )
}
