import type { Encuesta } from '../nucleo/tipos'
import { decimal, numero, porcentaje } from '../locale'

/**
 * Qué puede y qué no puede hacer una figura mientras avanza el scroll, y el caso de la recta.
 *
 * **Existe porque las historias afirman** con una figura que cambia, un formato cómodo de leer y
 * difícil de auditar. Las pruebas de cada frase están en `MetodoHistorias`, que las pide por id a
 * `Evidencia`; acá quedan las reglas que valen para todas y el único caso que necesita explicación
 * aparte (un punto de la escala que sostiene la pendiente).
 */

const REGLAS: [string, string][] = [
  ['La escala no depende de lo que se muestra.', 'Se calcula sobre todos los datos: un valor no cambia de lugar al avanzar.'],
  ['Ocultar no es borrar.', 'Lo apagado sigue en la página, para imprimir y para un lector de pantalla.'],
  ['El último paso muestra todo.', 'Es también lo que ve quien pide menos movimiento.'],
  ['Un eje recortado lo dice.', 'Si la figura no arranca en cero, el rótulo declara el tramo.'],
]

export default function MetodoRecorrido () {
  return (
    <ul className="flex flex-col gap-1.5">
      {REGLAS.map(([titulo, texto]) => (
        <li key={titulo}>
          <strong className="text-gray-900">{titulo}</strong> <span className="text-gray-600">{texto}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Por qué un puñado de respuestas puede inclinar una recta: el diagnóstico de la escena de ideología.
 *
 * **Las cifras salen del artefacto**: si una oleada nueva mueve la pendiente, este texto cambia solo.
 */
export function CasoDeLaRecta ({ encuesta }: { encuesta: Encuesta }) {
  const primera = encuesta.olas.at(0) ?? 0
  const regresion = encuesta.contrastes?.regresiones.find((r) => r.id === 'ideologia-china') ?? null
  const deLaPrimera = regresion?.porOla.find((o) => o.ola === primera) ?? null
  const sostiene = deLaPrimera?.sostiene ?? null
  const puntoSostiene = deLaPrimera?.puntos.find((q) => q.x === sostiene?.x) ?? null
  const puntoCentral = deLaPrimera?.puntos.reduce((mejor, q) => (q.n > mejor.n ? q : mejor), deLaPrimera.puntos[0]) ?? null
  if (!deLaPrimera || !sostiene || !puntoSostiene || !puntoCentral) return null

  const cifra = (v: number) => `${v > 0 ? '+' : ''}${decimal(v, 2)}`
  // Con tres decimales, un p de 0,0001 se imprime «0,000», que se lee como cero exacto. El método
  // no puede afirmar eso: con diez mil permutaciones el piso es 1/10.001.
  const valorP = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${decimal(p, 3)}`)

  return (
    <div className="flex flex-col gap-2">
      <p>
        En {primera} la pendiente es {cifra(deLaPrimera.recta.b)} ({valorP(deLaPrimera.recta.p)}). Sin
        las <strong>{numero(sostiene.n)} personas del punto {sostiene.x}</strong> queda en{' '}
        {cifra(sostiene.recta.b)} ({valorP(sostiene.recta.p)}): la inclinación depende de ellas.
      </p>
      <p>
        En una regresión, cuánto pesa una respuesta sobre la pendiente depende de su posición, no de su
        valor: el peso es <code className="rounded bg-gray-100 px-1">n·(x − x̄)² / Σ(x − x̄)²</code>. Esas{' '}
        {numero(puntoSostiene.n)} personas aportan {porcentaje(puntoSostiene.peso, 0)} de la inclinación;
        las {numero(puntoCentral.n)} del punto {puntoCentral.x}, {porcentaje(puntoCentral.peso, 0)}. Y su
        promedio está mal fijado{puntoSostiene.ic && <> (de {decimal(puntoSostiene.ic[0], 0)} a {decimal(puntoSostiene.ic[1], 0)})</>}.
        Mucho peso y mucha incertidumbre en el mismo lugar vuelven frágil el resultado.
      </p>
      <p>
        Sacar el punto es un diagnóstico de robustez, no una corrección: esas personas siguen contadas en
        todas las demás cifras.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left">
          <caption className="pb-1 text-left text-gray-500">
            Oleada {primera}: personas por punto de la escala y cuánto pesa cada punto en la pendiente.
          </caption>
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th scope="col" className="py-1 pr-3 font-medium">Escala</th>
              <th scope="col" className="py-1 pr-3 font-medium">Personas</th>
              <th scope="col" className="py-1 pr-3 font-medium">Promedio</th>
              <th scope="col" className="py-1 pr-3 font-medium">Peso</th>
            </tr>
          </thead>
          <tbody>
            {deLaPrimera.puntos.map((q) => (
              <tr key={q.x} className={`border-b border-gray-100 ${q.x === sostiene.x ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                <th scope="row" className="py-1 pr-3 font-normal tabular-nums">
                  {q.x}{q.x === deLaPrimera.puntos[0].x ? ' · izquierda' : q.x === deLaPrimera.puntos.at(-1)?.x ? ' · derecha' : ''}
                </th>
                <td className="py-1 pr-3 tabular-nums">{numero(q.n)}</td>
                <td className="py-1 pr-3 tabular-nums">
                  {q.media === null ? 'muy pocos casos' : decimal(q.media, 1)}
                  {q.ic && <span className="text-gray-400"> [{decimal(q.ic[0], 0)}; {decimal(q.ic[1], 0)}]</span>}
                </td>
                <td className="py-1 pr-3 tabular-nums">{porcentaje(q.peso, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
