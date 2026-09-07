import type { Contrastes as Datos } from '../nucleo/tipos'
import { decimal, numero } from '../locale'

/**
 * Qué diferencias entre oleadas superan el azar de la propia muestra.
 *
 * **Va en «Sobre los datos» y no en las figuras**, y esa es la decisión de diseño: quien mira una
 * figura está leyendo un resultado, y quien llega acá está por citarlo. Este es el lugar donde se
 * responde «¿esto es real o es ruido?» sin obligar a nadie a leerlo antes de tiempo.
 *
 * Los números vienen calculados del ETL (`scripts/lib/contraste.mjs`): son diez mil permutaciones
 * por comparación, que no es trabajo del navegador de nadie.
 */

const marca = (p: number) => (p < 0.05
  ? { texto: 'supera el ruido', clase: 'text-gray-900' }
  : { texto: 'dentro del ruido', clase: 'text-gray-500' })

function Cifra ({ valor, unidad, signo = true }: { valor: number, unidad: string, signo?: boolean }) {
  const texto = `${signo && valor > 0 ? '+' : ''}${decimal(valor, 1)}`
  return <span className="tabular-nums">{texto}{unidad === '%' ? ' pp' : ''}</span>
}

export default function Contrastes ({ contrastes, olas }: { contrastes: Datos, olas: number[] }) {
  const pares = contrastes.medidas[0]?.comparaciones.map((c) => [c.desde, c.hasta] as const) ?? []

  return (
    <>
      <h3 className="mt-8 font-display text-base font-semibold text-gray-900">
        Cuándo un cambio entre oleadas es un cambio
      </h3>
      <div className="mt-2 flex max-w-2xl flex-col gap-2">
        <p>
          Cada diferencia de esta página está contrastada así: se juntan las respuestas de las dos
          oleadas en un solo montón, se baraja diez mil veces la etiqueta del año y se cuenta cuántas
          barajadas producen una diferencia al menos tan grande como la observada. Esa proporción es
          la columna <strong>p</strong>. Un p de 0,70 quiere decir que siete de cada diez barajadas
          al azar dan lo mismo o más, o sea que la diferencia no dice nada; uno de 0,001, que lo dan
          una de cada mil.
        </p>
        <p>
          El intervalo que va al lado de cada diferencia se calcula remuestreando las respuestas
          (bootstrap): es el rango donde queda el 95 % de los remuestreos. Cuando ese rango contiene
          el cero, la diferencia no se distingue de no haber cambio.
        </p>
        <p>
          <strong>Nada de esto es margen de error.</strong> La muestra no es probabilística, así que
          estos números comparan las oleadas <em>entre sí</em> y no estiman a la población de Chile.
          Y como el año arrastra todo lo que cambió con él, cada diferencia lleva también su versión
          con la composición de edad y sexo fija: si las dos se parecen, el cambio es de opinión y no
          de quién contestó.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-xs">
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
                <th scope="row" className="py-2 pr-3 font-normal text-gray-900">
                  {medida.etiqueta}
                  <span className="block text-[11px] text-gray-500">
                    {medida.unidad === '%' ? 'diferencia en puntos porcentuales' : 'diferencia en puntos'}
                  </span>
                </th>
                {pares.map(([desde, hasta]) => {
                  const c = medida.comparaciones.find((x) => x.desde === desde && x.hasta === hasta)
                  if (!c) return <td key={`${desde}-${hasta}`} className="py-2 pr-3 text-gray-400">sin dato</td>
                  const m = marca(c.p)
                  return (
                    <td key={`${desde}-${hasta}`} className={`py-2 pr-3 ${m.clase}`}>
                      <span className="font-medium"><Cifra valor={c.diferencia} unidad={medida.unidad} /></span>
                      <span className="block text-[11px] tabular-nums text-gray-500">
                        [{decimal(c.ic[0], 1)}; {decimal(c.ic[1], 1)}] · p = {c.p < 0.001 ? '<0,001' : decimal(c.p, 3)}
                      </span>
                      <span className="block text-[11px]">
                        {m.texto}
                        {c.estandarizada !== null && (
                          <span className="text-gray-500">
                            {' · '}con edad y sexo fijos <Cifra valor={c.estandarizada} unidad={medida.unidad} />
                          </span>
                        )}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contrastes.brechas.map((brecha) => (
        <div key={brecha.id} className="mt-6 max-w-2xl">
          <h4 className="font-display text-sm font-semibold text-gray-900">{brecha.etiqueta}</h4>
          <p className="mt-1 text-xs leading-snug text-gray-600">
            Acá la resta va <strong>dentro de cada persona</strong>, que es quien pone las dos notas.
            Comparar dos promedios sueltos deja abierta la explicación de que una oleada use la
            escala más generosa que otra; restando dentro del encuestado, esa explicación se cae.
            El contraste es de signo: se le cambia el signo al azar a cada diferencia individual.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs">
            {brecha.porOla.map((x) => (
              <li key={x.ola} className={marca(x.p).clase}>
                <span className="tabular-nums font-medium">{x.ola}</span>
                {': '}
                <Cifra valor={x.diferencia} unidad={brecha.unidad} /> puntos
                <span className="text-gray-500">
                  {' '}[{decimal(x.ic[0], 1)}; {decimal(x.ic[1], 1)}] · p = {x.p < 0.001 ? '<0,001' : decimal(x.p, 3)} ·
                  {' '}n = {numero(x.n)} · {marca(x.p).texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {contrastes.grupos.map((grupo) => (
        <div key={grupo.id} className="mt-6 max-w-2xl">
          <h4 className="font-display text-sm font-semibold text-gray-900">{grupo.etiqueta}</h4>
          <p className="mt-1 text-xs leading-snug text-gray-600">
            Acá la comparación es <strong>entre grupos dentro de una misma oleada</strong>. La
            brecha es la distancia entre las dos puntas, y su prueba dice si esa distancia es más de
            lo que produce repartir al azar a las mismas personas entre los dos tramos.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs">
            {grupo.porOla.map((o) => (
              <li key={o.ola} className={o.brecha && o.brecha.p < 0.05 ? 'text-gray-900' : 'text-gray-500'}>
                <span className="font-medium tabular-nums">{o.ola}</span>
                {': '}
                {o.tramos.map((t) => `${t.nombre} ${t.media === null ? 'sin datos' : decimal(t.media, 1)}`).join(' · ')}
                {o.brecha && (
                  <span className="text-gray-500">
                    {' · '}brecha {o.brecha.entre.join(' − ')}{' '}
                    <Cifra valor={o.brecha.diferencia} unidad={grupo.unidad} />{' '}
                    [{decimal(o.brecha.ic[0], 1)}; {decimal(o.brecha.ic[1], 1)}] · p ={' '}
                    {o.brecha.p < 0.001 ? '<0,001' : decimal(o.brecha.p, 3)} · {marca(o.brecha.p).texto}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-snug text-gray-600">
            Y cada tramo consigo mismo entre oleadas, que es lo que dice quién se movió:
          </p>
          <ul className="mt-1 flex flex-col gap-1 text-xs">
            {grupo.entreOlas.filter((e) => e.p < 0.05).map((e) => (
              <li key={`${e.tramo}-${e.desde}-${e.hasta}`} className="text-gray-900">
                <span className="tabular-nums">{e.tramo} {e.desde} → {e.hasta}</span>
                {': '}<Cifra valor={e.diferencia} unidad={grupo.unidad} />{' '}
                <span className="text-gray-500">
                  [{decimal(e.ic[0], 1)}; {decimal(e.ic[1], 1)}] · p = {e.p < 0.001 ? '<0,001' : decimal(e.p, 3)}
                </span>
              </li>
            ))}
            <li className="text-gray-500">
              El resto de los tramos y tramos de años quedan dentro del ruido.
            </li>
          </ul>
        </div>
      ))}

      <p className="mt-4 max-w-2xl text-xs text-gray-500">
        {contrastes.metodo.rondas.toLocaleString('es-CL')} rondas por contraste, semilla fija: la misma
        base da siempre el mismo número. Las oleadas comparadas son {olas.join(', ')}. El detalle del
        método está en <code className="rounded bg-gray-100 px-1">scripts/lib/contraste.mjs</code>.
      </p>
    </>
  )
}
