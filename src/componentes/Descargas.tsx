import { useEffect, useState } from 'react'
import { numero } from '../locale'

/**
 * Las bases para descargar, con su documentación al lado.
 *
 * ICLAC decidió publicar la base combinada, las tres por oleada y los tres libros de códigos,
 * **con la nota metodológica al lado**. Esto último no es decoración: sin la nota, quien baje
 * los datos no sabe que la muestra se estratificó por peso económico de China y no por
 * población, y va a leer los porcentajes como si fueran del país.
 *
 * **Las bases van sin identificadores de panelista.** Traen `key` y `codpanelista`, y 159
 * personas participaron en más de una oleada: con esas columnas se puede seguir a una persona
 * entre años. Publicar la versión que sí los trae es decisión de ICLAC (`C11`), y su propio
 * documento de lectura recomienda la anónima. Mientras no decidan, el sitio ofrece la que se
 * puede publicar sin preguntar, y lo dice.
 */

interface Archivo {
  archivo: string
  titulo: string
  tipo: 'datos' | 'documentacion'
  formato: string
  casos?: number
  columnas?: number
  bytes: number
  sha256: string
}

interface Manifiesto {
  generado: string
  quitadas: string[]
  archivos: Archivo[]
}

function tamano (bytes: number): string {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`
}

export default function Descargas () {
  const [manifiesto, setManifiesto] = useState<Manifiesto | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}descargas/manifiesto.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setManifiesto)
      // Sin manifiesto la sección no se muestra: es preferible a ofrecer enlaces rotos.
      .catch(() => setManifiesto(null))
  }, [])

  if (!manifiesto) return null

  const datos = manifiesto.archivos.filter((a) => a.tipo === 'datos')
  const docs = manifiesto.archivos.filter((a) => a.tipo === 'documentacion')

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-10">
      <h2 className="font-display text-2xl font-semibold">Descargar los datos</h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Las respuestas completas de las tres oleadas, para reanalizarlas. Van en CSV con codificación
        UTF-8 y separador de coma.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Grupo titulo="Respuestas" archivos={datos} />
        <Grupo titulo="Documentación" archivos={docs} />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700">
        <h3 className="font-display text-base font-semibold text-gray-900">Antes de usarlos</h3>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          <li>
            <strong>La muestra no es probabilística.</strong> Es un panel en línea por cuotas y no trae
            ponderadores, así que los resultados van sin ponderar y no corresponde declarar margen de
            error. La nota metodológica explica el diseño.
          </li>
          <li>
            <strong>Se estratificó por peso económico de China en la región, no por población.</strong> La
            Región Metropolitana pesa mucho menos que en el país. Leer los porcentajes como nacionales
            sería un error.
          </li>
          <li>
            <strong>No es un panel.</strong> Son tres cortes transversales. La columna{' '}
            <code className="rounded bg-gray-100 px-1">olas_panelista</code> dice en cuántas oleadas
            participó cada persona, para poder descartar a las 159 que repiten.
          </li>
          <li>
            <strong>Mismo nombre de variable no siempre es la misma pregunta.</strong> El diccionario trae
            la columna <code className="rounded bg-gray-100 px-1">uso_serie_longitudinal</code>, que da una
            primera orientación; el explorador indica, pregunta por pregunta, qué se compara entre oleadas.
          </li>
          <li>
            <strong>Sin identificadores de panelista.</strong> Se retiraron{' '}
            {manifiesto.quitadas.length} columnas de identificación y control de terreno, entre ellas{' '}
            <code className="rounded bg-gray-100 px-1">key</code> y{' '}
            <code className="rounded bg-gray-100 px-1">codpanelista</code>. Las respuestas están completas.
          </li>
        </ul>
      </div>
    </section>
  )
}

function Grupo ({ titulo, archivos }: { titulo: string, archivos: Archivo[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-display text-base font-semibold text-gray-900">{titulo}</h3>
      <ul className="mt-2 flex flex-col divide-y divide-gray-100">
        {archivos.map((a) => (
          <li key={a.archivo} className="flex items-baseline justify-between gap-3 py-1.5">
            <a
              href={`${import.meta.env.BASE_URL}descargas/${a.archivo}`}
              download
              className="min-w-0 text-sm text-brand-dark underline decoration-gray-300 underline-offset-2 hover:decoration-brand-dark"
            >
              {a.titulo}
            </a>
            <span className="shrink-0 text-xs tabular-nums text-gray-500">
              {a.casos !== undefined && <>{numero(a.casos)} filas · </>}
              {a.formato} · {tamano(a.bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
