import type { Encuesta } from '../nucleo/tipos'
import { decimal, numero } from '../locale'
import { HISTORIAS } from '../historias/indice'

/**
 * El respaldo de cada historia, una sección por historia (`#/datos?foco=metodo-<id>`).
 *
 * **Se arma del registro de historias y del artefacto**, no de texto escrito a mano: cada historia
 * declara en `src/historias/indice.tsx` qué contrastes la sostienen, y acá se listan con su
 * diferencia, su intervalo y su p. Si una oleada nueva mueve un contraste, esta página cambia sola,
 * igual que la frase que lo usa.
 *
 * Es deliberadamente seca: es la página a la que llega quien quiere auditar una frase, no otra
 * historia. Lo que la animación puede y no puede hacer, y el caso de la recta ideológica, siguen en
 * `MetodoRecorrido`, que vale para todas.
 */
export default function MetodoHistorias ({ encuesta }: { encuesta: Encuesta }) {
  const c = encuesta.contrastes
  if (!c) return null

  const signo = (v: number) => `${v > 0 ? '+' : ''}${decimal(v, 1)}`
  const rango = (ic: [number, number]) => `[${signo(ic[0])}; ${signo(ic[1])}]`
  const valorP = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${decimal(p, 3)}`)
  // «Parejo» es la palabra de las historias para un intervalo que cruza el cero: acá se ve de dónde sale.
  const lectura = (ic: [number, number]) => (ic[0] * ic[1] <= 0 ? 'parejo' : ic[0] > 0 ? 'sube' : 'baja')

  const lineas = (id: string): { titulo: string, filas: string[] } | null => {
    const m = c.medidas.find((x) => x.id === id)
    if (m) {
      return {
        titulo: m.etiqueta,
        filas: m.comparaciones.map((k) =>
          `${k.desde} → ${k.hasta}: ${decimal(k.a, 1)} → ${decimal(k.b, 1)} ${m.unidad}, ${signo(k.diferencia)} ${rango(k.ic)}, ${valorP(k.p)} (${lectura(k.ic)}), n = ${numero(k.n[0])} y ${numero(k.n[1])}.`),
      }
    }
    const b = c.brechas.find((x) => x.id === id)
    if (b) {
      return {
        // «En cada oleada, con las mismas personas»: la resta usa las dos respuestas de la misma muestra, que
        // no son independientes. No es seguir a nadie entre oleadas (cada persona contesta una vez).
        titulo: `${b.etiqueta} (en cada oleada, con las mismas personas)`,
        filas: b.porOla.map((o) => `${o.ola}: ${signo(o.diferencia)} ${b.unidad} ${rango(o.ic)}, ${valorP(o.p)} (${lectura(o.ic)}), n = ${numero(o.n)}.`),
      }
    }
    const g = c.grupos.find((x) => x.id === id)
    if (g) {
      return {
        titulo: g.etiqueta,
        filas: g.porOla.filter((o) => o.brecha).map((o) =>
          `${o.ola}: ${o.tramos.map((t) => `${t.nombre} ${t.media === null ? 'sin casos' : decimal(t.media, 1)} (n = ${numero(t.n)})`).join(', ')}. ${o.brecha!.entre.join(' menos ')}: ${signo(o.brecha!.diferencia)} ${rango(o.brecha!.ic)}, ${valorP(o.brecha!.p)} (${lectura(o.brecha!.ic)}).`),
      }
    }
    const r = c.regresiones.find((x) => x.id === id)
    if (r) {
      return {
        titulo: `${r.etiqueta}: la recta, oleada por oleada (detalle más abajo)`,
        filas: r.porOla.map((o) => `${o.ola}: pendiente ${signo(o.recta.b)} ${rango(o.recta.ic)}, ${valorP(o.recta.p)}.`),
      }
    }
    return null
  }

  return (
    <>
      <h3 className="mt-8 font-display text-base font-semibold text-gray-900">Qué sostiene cada historia</h3>
      <p className="mt-2 max-w-2xl">
        Cada historia se escribió después de contrastar sus hipótesis, y cada frase que afirma un
        cambio o una diferencia depende de una de estas pruebas. Donde el intervalo cruza el cero,
        la historia dice «parejo» o una forma equivalente, y no elige un ganador.
      </p>
      {HISTORIAS.map((h, i) => (
        <section key={h.id} id={`metodo-${h.id}`} className="mt-5 max-w-2xl">
          <h4 className="font-display text-sm font-semibold text-gray-900">
            Historia {i + 1} · {h.nombre}
          </h4>
          <ul className="mt-2 flex flex-col gap-2.5 text-xs leading-snug">
            {h.medidas.map((id) => {
              const l = lineas(id)
              if (!l) return null
              return (
                <li key={id} className="border-l-2 border-gray-200 pl-3">
                  <p className="font-medium text-gray-900">{l.titulo}</p>
                  {l.filas.map((f) => <p key={f} className="tabular-nums text-gray-500">{f}</p>)}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
