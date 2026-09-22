import type { Agregado } from '../nucleo/agregar'
import { IDENTIDAD, SEMANTICOS, pasosDeOrden } from '../nucleo/paleta'
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

export default function Distribucion ({ agregado, grupos }: Props) {
  if (agregado.base === 0) {
    return <p className="py-4 text-sm italic text-gray-500">No hay datos disponibles para este recorte.</p>
  }

  if (!grupos || grupos.length === 0) {
    return (
      <div className="mt-2 flex flex-col gap-[3px]">
        {agregado.segmentos.map((s) => (
          // Sin corte hay una sola serie: todas las barras del mismo color, porque el largo
          // ya dice cuánto y colorear por categoría gastaría el canal de identidad en
          // recodificar lo que la barra muestra. Las excepciones son las categorías con
          // polaridad propia, que llevan su color amarrado.
          <Fila
            key={s.codigo}
            etiqueta={s.etiqueta}
            valor={s.porcentaje}
            n={s.n}
            color={SEMANTICOS[s.etiqueta]}
          />
        ))}
      </div>
    )
  }

  // Los cortes que ofrece el explorador están ordenados (edad, educación, nivel socioeconómico,
  // macrozona de norte a sur, impacto de bajo a muy alto), así que van con la rampa de orden
  // y no con colores de identidad: el orden tiene que verse en el color.
  const colores = pasosDeOrden(grupos.length)

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
                  color={colores[i]}
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
  etiqueta, valor, n, base, color = IDENTIDAD[0], sangria = false,
}: { etiqueta: string, valor: number, n: number, base?: number, color?: string, sangria?: boolean }) {
  const tinte = color ?? IDENTIDAD[0]
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
          style={{ width: `${Math.max(valor, 0.6)}%`, backgroundColor: tinte }}
        />
      </div>
      <span className={`text-right text-xs tabular-nums ${escaso ? 'text-gray-400' : 'text-gray-900'}`}>
        {porcentaje(valor, 0)}{escaso ? '*' : ''}
      </span>
    </div>
  )
}
