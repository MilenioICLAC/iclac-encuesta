import { useState } from 'react'
import type { Encuesta } from '../nucleo/tipos'
import Nube from './Nube'
import { numero } from '../locale'

/**
 * Las respuestas abiertas: qué palabra asocia la gente a cada país, en qué contexto ocurre el
 * contacto, y qué marcas chinas puede nombrar.
 *
 * **Los conteos vienen ya calculados del ETL.** El texto que la persona escribió no viaja al
 * navegador: una respuesta abierta puede contener datos que identifican, y el producto no la
 * necesita para dibujar la nube. El precio es que los cortes son los que se precalcularon, y
 * por eso acá hay tres y no los siete de la barra de estado.
 *
 * Es también la parte que **no reproduce el sitio al pie de la letra**: el monitor lematiza
 * con el stemmer español de Snowball y acá se normalizan los sufijos frecuentes a mano, así
 * que algunas palabras se agrupan distinto. Se dice en la figura.
 */

type Corte = 'total' | 'ideologia' | 'rol'

interface Props {
  encuesta: Encuesta
}

const PAISES = ['p4_1', 'p4_2', 'p4_3', 'p4_4', 'p4_5']

export default function Nubes ({ encuesta }: Props) {
  const [pais, setPais] = useState('p4_1')
  const [corte, setCorte] = useState<Corte>('total')

  const nubes = encuesta.nubes ?? []
  const dePais = nubes.filter((n) => PAISES.includes(n.id))
  const elegida = nubes.find((n) => n.id === pais) ?? dePais[0]
  const contactos = nubes.find((n) => n.id === 'p16')
  const marcas = nubes.find((n) => n.id === 'p6a')

  if (nubes.length === 0) return null

  const grupos = corte === 'ideologia' ? elegida?.porIdeologia : corte === 'rol' ? elegida?.porRol : undefined

  return (
    <section className="mx-auto max-w-5xl px-4 pb-4">
      <h3 className="mb-3 border-b border-gray-200 pb-1 font-display text-sm font-semibold uppercase tracking-wide text-gray-500">
        Lo que la gente escribió
      </h3>

      <div className="grid gap-3 md:grid-cols-6">
        <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 md:col-span-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="font-display text-base font-semibold text-gray-900">
                Qué es lo primero que se le viene a la cabeza
              </h4>
              <p className="mt-0.5 text-sm text-gray-600">
                Una palabra por persona, ante el nombre de cada país.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">País</span>
                <select
                  value={pais}
                  onChange={(e) => { setPais(e.target.value) }}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                >
                  {dePais.map((n) => <option key={n.id} value={n.id}>{n.titulo}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Separar por</span>
                <select
                  value={corte}
                  onChange={(e) => setCorte(e.target.value as Corte)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                >
                  <option value="total">Nada</option>
                  <option value="ideologia">Ideología</option>
                  <option value="rol">Rol de China en su comuna</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-3">
            {grupos
              ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grupos.map((g) => (
                    <div key={g.id}>
                      <p className="mb-1 text-xs font-medium text-gray-700">{g.etiqueta}</p>
                      <Nube palabras={g.palabras} tope={22} />
                    </div>
                  ))}
                </div>
                )
              : <Nube palabras={elegida?.total ?? []} />}
          </div>

          <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
            Los conteos se calculan en el procesamiento, así que el texto que la persona escribió no sale
            del origen. Estos cortes son los precalculados y no siguen la barra de estado.
          </p>
        </article>

        {contactos && (
          <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 md:col-span-3">
            <h4 className="font-display text-base font-semibold text-gray-900">Dónde ocurre el contacto</h4>
            <p className="mt-0.5 text-sm text-gray-600">
              En qué contextos interactúa con personas de China o de ascendencia china.
            </p>
            <div className="mt-3 grow"><Nube palabras={contactos.total} tope={30} /></div>
            <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
              {numero(contactos.total.reduce((s, p) => s + p.n, 0))} menciones.
            </p>
          </article>
        )}

        {marcas && (
          <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 md:col-span-3">
            <h4 className="font-display text-base font-semibold text-gray-900">Marcas chinas que puede nombrar</h4>
            <p className="mt-0.5 text-sm text-gray-600">
              Hasta tres por persona, escritas a mano y sin lista de dónde elegir.
            </p>
            <div className="mt-3 grow"><Nube palabras={marcas.total} tope={30} /></div>
            <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
              Solo se preguntó desde 2024.
            </p>
          </article>
        )}
      </div>

      <p className="mt-3 text-xs leading-snug text-gray-500">
        <strong>Estas figuras no reproducen exactamente las del sitio actual.</strong> El monitor agrupa
        las palabras con el lematizador de Snowball y acá se normalizan los sufijos frecuentes del
        español, así que algunas formas se juntan distinto. El diccionario de correcciones de grafía sí
        es el mismo.
      </p>
    </section>
  )
}
