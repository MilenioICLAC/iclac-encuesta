import type { Distribucion } from '../distribucion'
import { numero, porcentaje } from '../locale'

/**
 * La misma distribución en tabla. No es un extra: el gráfico usa un color por debajo de
 * 3:1 contra el fondo, y la regla es que ninguna cifra quede sujeta al color ni al hover.
 */
export default function Tabla ({ distribucion }: { distribucion: Distribucion }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th scope="col" className="py-2 pr-4 font-medium">Categoría</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Casos</th>
            <th scope="col" className="py-2 text-right font-medium">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          {distribucion.barras.map((b) => (
            <tr key={b.clave} className="border-b border-gray-100">
              <td className={`py-1.5 pr-4 ${b.sentinela ? 'italic text-gray-400' : 'text-gray-800'}`}>
                {b.etiqueta}
                {b.sentinela && <span className="ml-2 text-gray-400">(fuera de la base)</span>}
              </td>
              <td className="py-1.5 pr-4 text-right tabular-nums text-gray-800">{numero(b.n)}</td>
              <td className="py-1.5 text-right tabular-nums text-gray-600">
                {b.sentinela ? '—' : porcentaje(b.porcentaje)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-gray-500">
            <td className="py-2">Base del porcentaje</td>
            <td className="py-2 pr-4 text-right tabular-nums">{numero(distribucion.base)}</td>
            <td className="py-2 text-right">100,0 %</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
