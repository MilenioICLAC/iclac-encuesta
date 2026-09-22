import type { Encuesta } from '../nucleo/tipos'
import { decimal, numero, porcentaje } from '../locale'

/**
 * Cómo se hizo el recorrido: qué sostiene cada afirmación y qué puede hacer una figura mientras
 * avanza el scroll.
 *
 * **Existe porque el recorrido afirma.** El explorador deja consultar y no dice nada; el recorrido
 * dice cosas, y en el formato en que las dice —una figura que cambia con el scroll— el lector no
 * tiene cómo auditar lo que se le muestra. Acá está el respaldo, y lo que la animación no hace.
 *
 * **Las cifras salen del artefacto**, no del texto: si una oleada nueva cambia un contraste, esta
 * página se corrige sola o queda en evidencia.
 */

function Regla ({ titulo, children }: { titulo: string, children: React.ReactNode }) {
  return (
    <li className="border-l-2 border-gray-200 pl-3">
      <strong className="text-gray-900">{titulo}</strong>{' '}
      <span className="text-gray-600">{children}</span>
    </li>
  )
}

export default function MetodoRecorrido ({ encuesta }: { encuesta: Encuesta }) {
  const c = encuesta.contrastes
  if (!c) return null

  const primera = encuesta.olas.at(0) ?? 0
  const penultima = encuesta.olas.at(-2) ?? 0
  const ultima = encuesta.olas.at(-1) ?? 0
  const medida = (id: string, desde: number, hasta: number) =>
    c.medidas.find((m) => m.id === id)?.comparaciones.find((x) => x.desde === desde && x.hasta === hasta) ?? null
  const brecha = (ola: number) =>
    c.brechas.find((b) => b.id === 'brecha-china-eeuu')?.porOla.find((x) => x.ola === ola) ?? null
  const regresion = c.regresiones.find((r) => r.id === 'ideologia-china') ?? null
  const deLaPrimera = regresion?.porOla.find((o) => o.ola === primera) ?? null
  const sostiene = deLaPrimera?.sostiene ?? null
  const puntoSostiene = deLaPrimera?.puntos.find((q) => q.x === sostiene?.x) ?? null
  const puntoCentral = deLaPrimera?.puntos.reduce((mejor, q) => (q.n > mejor.n ? q : mejor), deLaPrimera.puntos[0]) ?? null

  const cifra = (v: number) => `${v > 0 ? '+' : ''}${decimal(v, 2)}`
  const rango = (ic: [number, number]) => `[${cifra(ic[0])}; ${cifra(ic[1])}]`
  // Con tres decimales, un p de 0,0001 se imprime «0,000», que se lee como cero exacto. El método
  // no puede afirmar eso: con diez mil permutaciones el piso es 1/10.001.
  const valorP = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${decimal(p, 3)}`)

  // Las afirmaciones del recorrido, cada una con la prueba que la sostiene. La lista se arma con
  // los contrastes del artefacto: una frase sin su prueba acá es una frase que no debería estar
  // en el recorrido.
  const afirmaciones = [
    {
      escena: `La mirada · en ${primera} los dos estaban parejos`,
      dice: `La brecha entre China y Estados Unidos en ${primera} no se distingue de cero.`,
      prueba: brecha(primera) && `Brecha dentro de cada persona: ${cifra(brecha(primera)!.diferencia)} puntos ${rango(brecha(primera)!.ic)}, ${valorP(brecha(primera)!.p)}, n = ${numero(brecha(primera)!.n)}.`,
    },
    {
      escena: `La mirada · en ${ultima} China queda arriba`,
      dice: 'La misma persona pone a China por encima de Estados Unidos, y antes no.',
      prueba: brecha(ultima) && `${cifra(brecha(ultima)!.diferencia)} puntos ${rango(brecha(ultima)!.ic)}, ${valorP(brecha(ultima)!.p)}, n = ${numero(brecha(ultima)!.n)}. Es una comparación pareada: la misma persona pone las dos notas, así que «una oleada usó la escala más generosa» deja de ser una explicación posible.`,
    },
    {
      escena: `La mirada · entre ${primera} y ${penultima} no se movió nada`,
      dice: 'Ninguno de los cinco países del termómetro se distingue del ruido en ese tramo.',
      prueba: `Los cinco quedan sobre p = 0,05. El mayor movimiento es ${
        decimal(Math.max(...['china', 'eeuu', 'corea', 'francia', 'japon']
          .map((k) => Math.abs(medida(`termometro-${k}`, primera, penultima)?.diferencia ?? 0))), 1)
      } puntos, con su intervalo cruzando el cero.`,
    },
    {
      escena: 'La mirada · la posición política no ordena la opinión',
      dice: `En ${primera} la recta parece inclinada, y esa inclinación la sostiene un puñado de respuestas.`,
      prueba: deLaPrimera && sostiene && `Pendiente ${cifra(deLaPrimera.recta.b)} ${rango(deLaPrimera.recta.ic)}, ${valorP(deLaPrimera.recta.p)}, R² ${decimal(deLaPrimera.recta.r2, 1)} %. Sin el punto ${sostiene.x} (${numero(sostiene.n)} personas): ${cifra(sostiene.recta.b)} ${rango(sostiene.recta.ic)}, ${valorP(sostiene.recta.p)}.`,
    },
  ].filter((a) => a.prueba)

  return (
    <>
      <h3 className="mt-8 font-display text-base font-semibold text-gray-900">Cómo se hicieron las historias</h3>
      <div className="mt-2 flex max-w-2xl flex-col gap-2">
        <p>
          Las historias <strong>afirman</strong>, y lo hacen con una figura que cambia mientras se
          avanza. Ese formato es cómodo de leer y difícil de auditar, así que acá está lo que
          sostiene cada frase y lo que la animación tiene prohibido hacer.
        </p>
      </div>

      <h4 className="mt-5 font-display text-sm font-semibold text-gray-900">Qué puede y qué no puede hacer la figura</h4>
      <ul className="mt-2 flex max-w-2xl flex-col gap-2 text-xs leading-snug">
        <Regla titulo="La escala no depende de lo que se está mostrando.">
          Se calcula sobre todos los datos y se le pasa hecha a la figura. Si se recalculara con lo
          encendido, el mismo valor cambiaría de lugar al avanzar el relato, que es la manera más
          limpia de mentir con una animación.
        </Regla>
        <Regla titulo="Ocultar no es borrar.">
          Lo apagado sigue en la página con opacidad cero: está al imprimir y para un lector de
          pantalla. La animación es una capa de lectura sobre una figura que ya está completa.
        </Regla>
        <Regla titulo="El último paso muestra todo.">
          Es la garantía de que una historia no termina escondiendo nada, y es también lo que ve
          quien pide menos movimiento o navega sin JavaScript.
        </Regla>
        <Regla titulo="Un eje recortado lo dice.">
          Cuando la figura no arranca en cero, el rótulo del eje declara el tramo que muestra. Un
          eje recortado en silencio exagera la pendiente.
        </Regla>
      </ul>

      <h4 className="mt-5 font-display text-sm font-semibold text-gray-900">Las afirmaciones de «La mirada», en detalle</h4>
      <ul className="mt-2 flex max-w-2xl flex-col gap-3 text-xs leading-snug">
        {afirmaciones.map((a) => (
          <li key={a.escena}>
            <p className="font-medium text-gray-900">{a.escena}</p>
            <p className="text-gray-600">{a.dice}</p>
            <p className="mt-0.5 tabular-nums text-gray-500">{a.prueba}</p>
          </li>
        ))}
      </ul>

      {deLaPrimera && sostiene && puntoSostiene && puntoCentral && (
        <>
          <h4 className="mt-5 font-display text-sm font-semibold text-gray-900">
            Por qué un puñado de respuestas puede inclinar una recta
          </h4>
          <div className="mt-2 flex max-w-2xl flex-col gap-2 text-xs leading-snug text-gray-600">
            <p>
              En una regresión, cuánto pesa una respuesta sobre la <strong>inclinación</strong> no
              depende de su valor sino de su posición: las del centro de la escala casi no la
              mueven, porque están donde la recta gira, y las de los bordes mandan aunque sean
              pocas. El peso de cada punto sobre la pendiente es{' '}
              <code className="rounded bg-gray-100 px-1">n·(x − x̄)² / Σ(x − x̄)²</code>.
            </p>
            <p>
              En {primera} eso deja a <strong>{numero(puntoSostiene.n)} personas del punto{' '}
              {puntoSostiene.x}</strong> aportando {porcentaje(puntoSostiene.peso, 0)} de la
              inclinación, mientras {numero(puntoCentral.n)} del punto {puntoCentral.x} aportan{' '}
              {porcentaje(puntoCentral.peso, 0)}. Y el promedio de esas {numero(puntoSostiene.n)}{' '}
              respuestas no está bien fijado: {puntoSostiene.ic && (
                <>va de {decimal(puntoSostiene.ic[0], 0)} a {decimal(puntoSostiene.ic[1], 0)}</>
              )}.
            </p>
            <p>
              <strong>Mucho peso y mucha incertidumbre en el mismo lugar</strong> es lo que vuelve
              frágil el resultado. Sacar ese punto es un diagnóstico estándar de robustez, no una
              corrección de los datos: el sitio lo muestra para que se vea de qué depende la
              conclusión, y las {numero(sostiene.n)} personas siguen contadas en todas las demás
              cifras.
            </p>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
              <caption className="pb-1 text-left text-xs text-gray-500">
                Oleada {primera}: cuánta gente hay en cada punto de la escala y cuánto pesa sobre la pendiente.
              </caption>
              <thead>
                <tr className="border-b border-gray-300 text-gray-500">
                  <th scope="col" className="py-1 pr-3 font-medium">Escala</th>
                  <th scope="col" className="py-1 pr-3 font-medium">Personas</th>
                  <th scope="col" className="py-1 pr-3 font-medium">Promedio</th>
                  <th scope="col" className="py-1 pr-3 font-medium">Peso en la pendiente</th>
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
        </>
      )}

      <p className="mt-4 max-w-2xl text-xs text-gray-500">
        Las pruebas son las mismas de la sección anterior, sobre la base combinada. Y valen el mismo
        aviso: comparan las oleadas entre sí, no estiman a la población, y no son margen de error.
      </p>
    </>
  )
}
