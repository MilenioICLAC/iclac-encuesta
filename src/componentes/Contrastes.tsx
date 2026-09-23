import type { Contrastes as Datos } from '../nucleo/tipos'
import { decimal } from '../locale'
import { cruzaCero, valorP } from '../nucleo/prueba'

/**
 * Qué diferencias entre oleadas superan el azar de la propia muestra.
 *
 * **Va en «Sobre los datos» y no en las figuras**, y esa es la decisión de diseño: quien mira una
 * figura está leyendo un resultado, y quien llega acá está por citarlo.
 *
 * Los números vienen calculados del ETL (`scripts/lib/contraste.mjs`): son diez mil permutaciones
 * por comparación, que no es trabajo del navegador de nadie.
 */

/** Cómo se lee cada fila: tres pasos y el aviso. */
export function ComoSeLee ({ rondas }: { rondas: number }) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <p>
        <strong className="text-gray-900">El p.</strong> Se baraja {rondas.toLocaleString('es-CL')} veces
        lo que se está comparando y se cuenta cuántas barajadas dan una diferencia al menos tan grande como
        la observada. Entre oleadas se baraja el año; en una brecha dentro de la persona, el signo de cada
        diferencia; entre grupos, a qué grupo pertenece cada persona; en una recta, la opinión entre los
        puntos de la escala. Un p de 0,70 dice que siete de cada diez barajadas al azar dan lo mismo o más.
      </p>
      <p>
        <strong className="text-gray-900">El intervalo.</strong> Se remuestrean las respuestas (bootstrap)
        y se toma el rango del 95 % de los remuestreos. <strong className="text-gray-900">Si contiene el
        cero, la fila dice «parejo»</strong>, aunque el p quede apenas bajo 0,05.
      </p>
      <p>
        <strong className="text-gray-900">Edad y sexo fijos.</strong> Cada diferencia entre oleadas lleva
        también su versión con las dos oleadas llevadas a una misma composición de edad y sexo. Si las dos se parecen, la
        edad y el sexo de quienes contestaron no explican el cambio; otras diferencias de composición
        siguen posibles.
      </p>
      <p>
        <strong className="text-gray-900">Nada de esto es margen de error.</strong> La muestra no es
        probabilística: estos números comparan las oleadas entre sí y no estiman a la población de Chile.
        Semilla fija, así que la misma base da siempre el mismo número.
      </p>
    </div>
  )
}

/** Todas las medidas entre oleadas, en una tabla. Las brechas y los grupos están en su historia. */
export default function Contrastes ({ contrastes }: { contrastes: Datos }) {
  const pares = contrastes.medidas[0]?.comparaciones.map((c) => [c.desde, c.hasta] as const) ?? []

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th scope="col" className="py-2 pr-3 font-medium">Medida</th>
            {pares.map(([desde, hasta]) => (
              <th key={`${desde}-${hasta}`} scope="col" className="py-2 pr-3 font-medium tabular-nums">
                {desde} → {hasta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contrastes.medidas.map((medida) => (
            <tr key={medida.id} className="border-b border-gray-100 align-top">
              <th scope="row" className="py-1.5 pr-3 font-normal text-gray-900">
                {medida.etiqueta}
                {medida.advertencia && <span className="block text-[11px] text-amber-800">{medida.advertencia}</span>}
              </th>
              {pares.map(([desde, hasta]) => {
                const c = medida.comparaciones.find((x) => x.desde === desde && x.hasta === hasta)
                if (!c) return <td key={`${desde}-${hasta}`} className="py-1.5 pr-3 text-gray-400">sin dato</td>
                const parejo = cruzaCero(c.ic)
                return (
                  <td key={`${desde}-${hasta}`} className="py-1.5 pr-3 tabular-nums">
                    <span className={parejo ? 'text-gray-500' : 'font-medium text-gray-900'}>
                      {c.diferencia > 0 ? '+' : ''}{decimal(c.diferencia, 1)}{medida.unidad === '%' ? ' pp' : ` ${medida.unidad}`}
                      {parejo ? ' · parejo' : ''}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      [{decimal(c.ic[0], 1)}; {decimal(c.ic[1], 1)}] · {valorP(c.p)}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
