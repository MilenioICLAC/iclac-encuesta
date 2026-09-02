import { useEffect, useMemo, useState } from 'react'
import type { Oleada, Variable } from './tipos'
import { calcularDistribucion, variablesPublicadas } from './distribucion'
import { fecha, numero } from './locale'
import Barras from './componentes/Barras'
import Tabla from './componentes/Tabla'

/**
 * Explorador de una oleada.
 *
 * **No es el tablero ni el recorrido.** Esos se acuerdan con ICLAC en la sesión de
 * definición y todavía no hay guion ni lista de módulos. Esto es el instrumento para ver
 * qué trae realmente el archivo: una variable a la vez, con su N, sus perdidos y lo que el
 * ETL dejó marcado para revisar.
 */

const ORDEN_POR_CODIGO_HASTA = 12

type Orden = 'codigo' | 'frecuencia'
type Vista = 'grafico' | 'tabla'

export default function Explorador () {
  const [oleada, setOleada] = useState<Oleada | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('p18')
  const [orden, setOrden] = useState<Orden | null>(null)
  const [vista, setVista] = useState<Vista>('grafico')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/oleada_2023.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setOleada)
      .catch((e: Error) => setError(e.message))
  }, [])

  const variables = useMemo(() => (oleada ? variablesPublicadas(oleada) : []), [oleada])
  const variable: Variable | undefined = variables.find((v) => v.nombre === nombre) ?? variables[0]

  const distribucion = useMemo(
    () => (oleada && variable ? calcularDistribucion(variable, oleada.casos) : null),
    [oleada, variable]
  )

  // Las escalas ordinales llegan en el orden del cuestionario y hay que dejarlas así: de
  // «Muy en desacuerdo» a «Muy de acuerdo». En un nominal largo, como comuna, ese orden no
  // significa nada y conviene la frecuencia. El umbral es una conjetura razonable, no una
  // verdad, y por eso el control queda a la vista.
  const ordenEfectivo: Orden =
    orden ?? (distribucion && distribucion.barras.length > ORDEN_POR_CODIGO_HASTA ? 'frecuencia' : 'codigo')

  const barras = useMemo(() => {
    if (!distribucion) return []
    if (ordenEfectivo === 'codigo') return distribucion.barras
    return [...distribucion.barras].sort((a, b) => b.n - a.n)
  }, [distribucion, ordenEfectivo])

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-xl font-semibold text-gray-900">No se pudo cargar la oleada</h1>
        <p className="mt-3 text-gray-700">
          El explorador lee <code className="rounded bg-gray-100 px-1">public/data/oleada_2023.json</code>, que es
          salida del ETL y no está versionada. Generala con:
        </p>
        <pre className="mt-3 rounded bg-gray-900 px-4 py-3 text-sm text-gray-100">npm run etl 2023</pre>
        <p className="mt-3 text-sm text-gray-500">Detalle: {error}</p>
      </main>
    )
  }

  if (!oleada || !variable || !distribucion) {
    return <main className="mx-auto max-w-5xl px-6 py-16 text-gray-500">Cargando la oleada…</main>
  }

  const respondieron = oleada.n - distribucion.perdidos

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-[13px] uppercase tracking-wide text-gray-500">Explorador de datos · uso interno</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-gray-900">
          Encuesta de Percepciones sobre China en Chile
        </h1>
        <p className="mt-2 text-[13px] text-gray-600">
          Oleada {oleada.oleada} · {numero(oleada.n)} casos · {numero(variables.length)} variables ·
          procesada el {fecha(oleada.generado)} desde <code>{oleada.fuentes.datos}</code>
        </p>
        <p className="mt-3 max-w-3xl text-[13px] text-gray-500">
          Resultados sin ponderar, sobre casos efectivos y sin margen de error: la muestra es un panel en línea
          por cuotas, no probabilística. Esto no es el tablero del producto, que se acuerda con ICLAC.
        </p>
      </header>

      {oleada.revisiones.length > 0 && (
        <section className="mt-6 rounded border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {numero(oleada.revisiones.length)} cosas que el ETL dejó marcadas en esta oleada
          </h2>
          <ul className="mt-2 space-y-1 text-[13px] text-gray-700">
            {oleada.revisiones.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="text-amber-600">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-gray-600">Variable</span>
          <select
            value={variable.nombre}
            onChange={(e) => { setNombre(e.target.value); setOrden(null) }}
            className="min-w-[22rem] rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
          >
            {variables.map((v) => (
              <option key={v.nombre} value={v.nombre}>
                {v.nombre} — {v.enunciado ?? 'sin enunciado documentado'}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-gray-600">Orden</span>
          <select
            value={ordenEfectivo}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
          >
            <option value="codigo">Del cuestionario</option>
            <option value="frecuencia">Por frecuencia</option>
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-gray-600">Vista</span>
          <div className="flex rounded border border-gray-300">
            {(['grafico', 'tabla'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                aria-pressed={vista === v}
                className={`px-3 py-1.5 text-sm first:rounded-l last:rounded-r ${
                  vista === v ? 'bg-brand-dark text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {v === 'grafico' ? 'Gráfico' : 'Tabla'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gray-900">
          {variable.enunciado ?? variable.nombre}
          {variable.enunciadoTruncado && <span aria-hidden className="text-gray-400">…</span>}
        </h2>

        <p className="mt-1 text-[13px] text-gray-500">
          <code>{variable.nombre}</code> · {variable.tipo} · {numero(respondieron)} respondieron
          {distribucion.perdidos > 0 && <> · {numero(distribucion.perdidos)} sin dato</>}
          {distribucion.centinelas > 0 && <> · {numero(distribucion.centinelas)} prefirió no responder</>}
          {' · '}porcentajes sobre {numero(distribucion.base)}
        </p>

        {variable.enunciadoTruncado && (
          <p className="mt-2 text-[13px] text-gray-500">
            El enunciado viene recortado a 80 bytes por el archivo Stata. La pregunta completa está solo en el
            libro de códigos en docx.
          </p>
        )}

        {variable.huerfanos && (
          <p className="mt-2 text-[13px] text-amber-700">
            Códigos presentes en los datos que el libro no documenta: {variable.huerfanos.join(', ')}.
          </p>
        )}

        {variable.tipo === 'texto' && (
          <p className="mt-2 text-[13px] text-gray-500">
            Pregunta abierta: {numero(distribucion.distintas ?? 0)} respuestas distintas, de las cuales{' '}
            {numero(distribucion.colaUnica ?? 0)} las dijo una sola persona y no se grafican. Sin tokenizar ni
            lematizar; la nube de palabras es otro trabajo.
          </p>
        )}

        <div className="mt-5">
          {vista === 'grafico'
            ? <Barras barras={barras} />
            : <Tabla distribucion={{ ...distribucion, barras }} />}
        </div>
      </section>
    </main>
  )
}
