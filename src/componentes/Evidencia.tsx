import type { Contrastes } from '../nucleo/tipos'
import { decimal, numero } from '../locale'
import { cruzaCero, valorP } from '../nucleo/prueba'

/**
 * Una prueba del artefacto, dibujada: el único lugar donde se escribe un contraste en «Sobre los datos».
 *
 * **Un contraste, un renderer.** Antes la misma diferencia salía en la tabla general, en el bloque de
 * brechas, en el método de cada historia y en las afirmaciones de «La mirada», cada una con su
 * formato y su criterio. Ahora las historias piden sus contrastes por id y todos pasan por acá.
 *
 * **«Parejo» lo decide el intervalo, no el p.** Donde el intervalo cruza el cero la fila dice
 * «parejo» aunque el p quede bajo 0,05: permutación y bootstrap pueden discrepar en el borde
 * (`riesgo-estrato` en 2024: p = 0,0498 con el intervalo tocando +0,01), y la regla de las
 * historias es la del intervalo.
 *
 * **Una diferencia dentro de una oleada no «sube».** Entre oleadas se dice sube o baja; en una
 * brecha o entre grupos, cuál queda arriba; en una recta, hacia dónde se inclina.
 */

type Intervalo = [number, number]

interface Fila {
  rotulo: string
  diferencia: number
  ic: Intervalo
  lectura: string
  detalle: string
}

interface Bloque {
  titulo: string
  unidad: string
  decimales: number
  advertencia?: string
  /** Un bloque que depende del anterior (cada tramo de un grupo, entre oleadas): va sangrado. */
  sub?: boolean
  filas: Fila[]
  notas: string[]
}

const signo = (v: number, d = 1) => `${v > 0 ? '+' : ''}${decimal(v, d)}`
const rango = (ic: Intervalo, d = 1) => `[${signo(ic[0], d)}; ${signo(ic[1], d)}]`
/** La unidad de una diferencia: una resta de porcentajes da puntos porcentuales, no por ciento. */
const deDiferencia = (unidad: string) => (unidad === '%' || unidad === 'puntos porcentuales' ? 'pp' : unidad)
const enumerar = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`)
const deNivel = (v: number, unidad: string) => (unidad === '%' ? `${decimal(v, 1)} %` : decimal(v, 1))

function bloques (c: Contrastes, id: string): Bloque[] {
  const salida: Bloque[] = []

  const m = c.medidas.find((x) => x.id === id)
  if (m) {
    salida.push({
      titulo: m.etiqueta,
      unidad: deDiferencia(m.unidad),
      decimales: 1,
      advertencia: m.advertencia,
      notas: [],
      filas: m.comparaciones.map((k) => ({
        rotulo: `${k.desde} → ${k.hasta}`,
        diferencia: k.diferencia,
        ic: k.ic,
        lectura: cruzaCero(k.ic) ? 'parejo' : k.diferencia > 0 ? 'sube' : 'baja',
        detalle: [
          `${deNivel(k.a, m.unidad)} → ${deNivel(k.b, m.unidad)}`,
          `IC ${rango(k.ic)}`,
          valorP(k.p),
          k.estandarizada !== null ? `con edad y sexo fijos ${signo(k.estandarizada)} ${deDiferencia(m.unidad)}` : null,
          `n = ${numero(k.n[0])} y ${numero(k.n[1])}`,
        ].filter(Boolean).join(' · '),
      })),
    })
  }

  const b = c.brechas.find((x) => x.id === id)
  if (b) {
    salida.push({
      // La resta usa las dos respuestas de la misma persona, que no son independientes. No es seguir a
      // nadie entre oleadas: cada persona contesta una vez.
      titulo: b.etiqueta,
      unidad: deDiferencia(b.unidad),
      decimales: 1,
      notas: ['Diferencia dentro de cada persona, en cada oleada.'],
      filas: b.porOla.map((o) => ({
        rotulo: String(o.ola),
        diferencia: o.diferencia,
        ic: o.ic,
        lectura: cruzaCero(o.ic) ? 'pareja' : o.diferencia > 0 ? 'positiva' : 'negativa',
        detalle: `IC ${rango(o.ic)} · ${valorP(o.p)} · n = ${numero(o.n)}`,
      })),
    })
  }

  const g = c.grupos.find((x) => x.id === id)
  if (g) {
    salida.push({
      titulo: g.etiqueta,
      unidad: deDiferencia(g.unidad),
      decimales: 1,
      notas: ['Diferencia entre las puntas, dentro de cada oleada. Debajo, cada tramo consigo mismo entre oleadas.'],
      filas: g.porOla.filter((o) => o.brecha).map((o) => {
        const [uno, otro] = o.brecha!.entre
        return {
          rotulo: String(o.ola),
          diferencia: o.brecha!.diferencia,
          ic: o.brecha!.ic,
          lectura: cruzaCero(o.brecha!.ic) ? 'parejos' : o.brecha!.diferencia > 0 ? `${uno} arriba` : `${otro} arriba`,
          detalle: `${o.tramos.map((t) => `${t.nombre} ${t.media === null ? 'sin casos' : deNivel(t.media, g.unidad)} (n = ${numero(t.n)})`).join(', ')} · ${uno} menos ${otro}, IC ${rango(o.brecha!.ic)} · ${valorP(o.brecha!.p)}`,
        }
      }),
    })
    const tramos = [...new Set(g.entreOlas.map((e) => e.tramo))]
    for (const tramo of tramos) {
      salida.push({
        titulo: `${tramo}, entre oleadas`,
        unidad: deDiferencia(g.unidad),
        decimales: 1,
        sub: true,
        notas: [],
        filas: g.entreOlas.filter((e) => e.tramo === tramo).map((e) => ({
          rotulo: `${e.desde} → ${e.hasta}`,
          diferencia: e.diferencia,
          ic: e.ic,
          lectura: cruzaCero(e.ic) ? 'parejo' : e.diferencia > 0 ? 'sube' : 'baja',
          detalle: `IC ${rango(e.ic)} · ${valorP(e.p)} · n = ${numero(e.n[0])} y ${numero(e.n[1])}`,
        })),
      })
    }
  }

  const r = c.regresiones.find((x) => x.id === id)
  if (r) {
    salida.push({
      titulo: `${r.etiqueta}: la recta`,
      unidad: 'puntos por punto',
      decimales: 2,
      notas: [
        `Pendiente por punto de la escala (${r.rango[0]} izquierda, ${r.rango[1]} derecha).`,
        // Solo cuando sacar el punto da vuelta la conclusión: si no, contarlo es ruido (skill `afirmaciones`).
        ...r.porOla.filter((o) => o.sostiene && !cruzaCero(o.recta.ic) && cruzaCero(o.sostiene.recta.ic)).map((o) =>
          `En ${o.ola} la inclinación la sostienen las ${numero(o.sostiene!.n)} personas del punto ${o.sostiene!.x}: sin ellas la pendiente queda en ${signo(o.sostiene!.recta.b, 2)} (IC ${rango(o.sostiene!.recta.ic, 2)}), plana. La inclinación de ${o.ola} no es robusta.`),
      ],
      filas: r.porOla.map((o) => ({
        rotulo: String(o.ola),
        diferencia: o.recta.b,
        ic: o.recta.ic,
        lectura: cruzaCero(o.recta.ic) ? 'plana' : o.recta.b < 0 ? 'baja hacia la derecha' : 'sube hacia la derecha',
        detalle: `IC ${rango(o.recta.ic, 2)} · ${valorP(o.recta.p)} · n = ${numero(o.recta.n)}`,
      })),
    })
  }

  const t = c.transversal.find((x) => x.id === id)
  if (t) {
    salida.push({
      titulo: `Opinión sobre China, ${t.desde} → ${t.hasta}, grupo por grupo`,
      unidad: '',
      decimales: 1,
      filas: [],
      notas: [
        `Sube el promedio en ${enumerar(t.cortes.map((k) => `${numero(k.suben)} de ${numero(k.total)} ${k.etiqueta}`))}.`,
        'Dice que el cambio no viene de un solo grupo; no afirma que cada grupo por separado se distinga del ruido.',
      ],
    })
  }

  return salida
}

/** El intervalo contra el cero. La escala es propia de cada contraste y simétrica: el cero queda al medio. */
function Raya ({ diferencia, ic, tope }: { diferencia: number, ic: Intervalo, tope: number }) {
  const ancho = 80
  const x = (v: number) => ancho / 2 + (v / tope) * (ancho / 2 - 5)
  const firme = !cruzaCero(ic)
  return (
    <svg viewBox={`0 0 ${ancho} 14`} width={ancho} height={14} aria-hidden="true" className="shrink-0 overflow-visible">
      <line x1={ancho / 2} x2={ancho / 2} y1={0} y2={14} className="stroke-gray-300" strokeWidth={1} />
      <line x1={x(ic[0])} x2={x(ic[1])} y1={7} y2={7} strokeWidth={2} strokeLinecap="round"
        className={firme ? 'stroke-brand-dark' : 'stroke-gray-400'} />
      <circle cx={x(diferencia)} cy={7} r={3.5} strokeWidth={1.5}
        className={firme ? 'fill-brand-dark stroke-brand-dark' : 'fill-white stroke-gray-500'} />
    </svg>
  )
}

export default function Evidencia ({ contrastes, id }: { contrastes: Contrastes, id: string }) {
  return (
    <>
      {bloques(contrastes, id).map((b) => {
        const tope = Math.max(...b.filas.flatMap((f) => [Math.abs(f.ic[0]), Math.abs(f.ic[1])]), 1e-9)
        return (
          <li key={b.titulo} className={b.sub ? 'ml-3 border-l-2 border-gray-100 py-2 pl-3 max-sm:ml-0 max-sm:pl-2' : 'border-t border-gray-100 py-3 first:border-t-0'}>
            <p className={b.sub ? 'text-gray-700' : 'font-medium text-gray-900'}>{b.titulo}</p>
            {b.advertencia && <p className="mt-0.5 text-amber-800">{b.advertencia}</p>}
            {b.filas.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {b.filas.map((f) => (
                  <li key={f.rotulo} className="grid grid-cols-[5.5rem_5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 max-sm:grid-cols-[5.25rem_5rem_minmax(0,1fr)] max-sm:gap-x-2">
                    <span className="whitespace-nowrap tabular-nums text-gray-600">{f.rotulo}</span>
                    <Raya diferencia={f.diferencia} ic={f.ic} tope={tope} />
                    <span className="tabular-nums">
                      <span className="font-medium text-gray-900">{signo(f.diferencia, b.decimales)}{'\u00a0'}{b.unidad}</span>
                      {/* En teléfono la lectura baja entera a su línea, en vez de cortarse en el punto medio. */}
                      <span className={`max-sm:block ${cruzaCero(f.ic) ? 'text-gray-500' : 'text-brand-dark'}`}><span className="max-sm:hidden"> · </span>{f.lectura}</span>
                    </span>
                    <span className="col-span-3 tabular-nums text-[11px] leading-snug text-gray-500 sm:col-start-2">{f.detalle}</span>
                  </li>
                ))}
              </ul>
            )}
            {b.notas.map((n) => <p key={n} className="mt-1.5 text-gray-600">{n}</p>)}
          </li>
        )
      })}
    </>
  )
}
