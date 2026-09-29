import type { Contrastes, Correccion } from '../nucleo/tipos'
import { decimal, idioma, lista, numero, porcentaje, traducido, type Idioma } from '../locale'
import { firme, nominal, valorP } from '../nucleo/prueba'
import { entreCifraYUnidad, unidadDeDiferencia, unidadDePendiente } from './unidades'

/**
 * Una prueba del artefacto, dibujada: el único lugar donde se escribe un contraste.
 *
 * **Un contraste, un renderer.** Antes la misma diferencia salía en la tabla general, en el bloque de
 * brechas, en el método de cada historia y en las afirmaciones de «La mirada», cada una con su
 * formato y su criterio. Ahora las figuras piden sus contrastes por id (`src/historias/medidas.ts`)
 * y todos pasan por acá.
 *
 * **Una fila afirma lo que afirma la historia** (`firme`, en `src/nucleo/prueba.ts`): p nominal, intervalo
 * y, si la prueba es de una familia, Holm. Lo que pasa el nominal pero no la corrección lo dice.
 *
 * **Una diferencia dentro de una oleada no «sube».** Entre oleadas se dice sube o baja; en una
 * brecha o entre grupos, cuál queda arriba; en una recta, hacia dónde se inclina.
 *
 * **Cada frase se escribe entera en cada idioma** (`FRASES`): el orden de las piezas cambia, sobre
 * todo en chino, y armarla con trozos traducidos la dejaría en orden español.
 */

type Intervalo = [number, number]

interface Fila {
  rotulo: string
  diferencia: number
  ic: Intervalo
  lectura: string
  firme: boolean
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

interface Frases {
  noPasa: string
  sube: string
  baja: string
  parejo: string
  positiva: string
  negativa: string
  arriba: (grupo: string) => string
  bajaDerecha: string
  subeDerecha: string
  plana: string
  /** El intervalo en el detalle: «IC [−1,2; +3,4]». */
  ic: (rango: string) => string
  holm: (familia: string, p: string) => string
  fijos: (valor: string, unidad: string) => string
  n: (a: number, b?: number) => string
  dentroDePersona: string
  puntas: string
  sinCasos: string
  /** Los tramos de un grupo con su nivel, en una línea. */
  tramos: (xs: string[]) => string
  menos: (uno: string, otro: string, rango: string) => string
  entreOleadas: (tramo: string) => string
  recta: (etiqueta: string) => string
  pendiente: (izquierda: number, derecha: number) => string
  sostiene: (ola: number, n: number, x: number, b: string, rango: string) => string
  transversal: (desde: number, hasta: number) => string
  suben: (cortes: { suben: number, total: number, etiqueta: string }[]) => string
  noPorGrupo: string
}

const FRASES: Record<Idioma, Frases> = {
  es: {
    noPasa: 'no pasa la corrección',
    sube: 'sube',
    baja: 'baja',
    parejo: 'parejo',
    positiva: 'positiva',
    negativa: 'negativa',
    arriba: (grupo) => `${grupo} arriba`,
    bajaDerecha: 'baja hacia la derecha',
    subeDerecha: 'sube hacia la derecha',
    plana: 'plana',
    ic: (rango) => `IC ${rango}`,
    holm: (familia, p) => `Holm (${familia}): ${p}`,
    fijos: (valor, unidad) => `con edad y sexo fijos ${valor} ${unidad}`,
    n: (a, b) => (b === undefined ? `n = ${numero(a)}` : `n = ${numero(a)} y ${numero(b)}`),
    dentroDePersona: 'Diferencia dentro de cada persona, en cada oleada.',
    puntas: 'Diferencia entre las puntas, dentro de cada oleada. Debajo, cada tramo consigo mismo entre oleadas.',
    sinCasos: 'sin casos',
    tramos: (xs) => xs.join(', '),
    menos: (uno, otro, rango) => `${uno} menos ${otro}, IC ${rango}`,
    entreOleadas: (tramo) => `${tramo}, entre oleadas`,
    recta: (etiqueta) => `${etiqueta}: la recta`,
    pendiente: (izquierda, derecha) => `Pendiente por punto de la escala (${izquierda} izquierda, ${derecha} derecha).`,
    sostiene: (ola, n, x, b, rango) =>
      `En ${ola} la inclinación la sostienen las ${numero(n)} personas del punto ${x}: sin ellas la pendiente queda en ${b} (IC ${rango}), plana. La inclinación de ${ola} no es robusta.`,
    transversal: (desde, hasta) => `Opinión sobre China, ${desde} → ${hasta}, grupo por grupo`,
    suben: (cortes) => `Sube el promedio en ${lista(cortes.map((k) => `${numero(k.suben)} de ${numero(k.total)} ${k.etiqueta}`))}.`,
    noPorGrupo: 'Dice que el cambio no viene de un solo grupo; no afirma que cada grupo por separado se distinga del ruido.',
  },
  en: {
    noPasa: 'does not pass the correction',
    sube: 'up',
    baja: 'down',
    parejo: 'no clear difference',
    positiva: 'positive',
    negativa: 'negative',
    arriba: (grupo) => `${grupo} higher`,
    bajaDerecha: 'slopes down to the right',
    subeDerecha: 'slopes up to the right',
    plana: 'flat',
    ic: (rango) => `interval ${rango}`,
    holm: (familia, p) => `Holm (${familia}): ${p}`,
    fijos: (valor, unidad) => `age and sex held constant: ${valor} ${unidad}`,
    n: (a, b) => (b === undefined ? `n = ${numero(a)}` : `n = ${numero(a)} and ${numero(b)}`),
    dentroDePersona: 'Difference within each person, in each wave.',
    puntas: 'Difference between the two ends of the scale, within each wave. Below, each group compared with itself across waves.',
    sinCasos: 'no cases',
    tramos: (xs) => xs.join(', '),
    menos: (uno, otro, rango) => `${uno} minus ${otro}, interval ${rango}`,
    entreOleadas: (tramo) => `${tramo}, across waves`,
    recta: (etiqueta) => `${etiqueta}: the regression line`,
    pendiente: (izquierda, derecha) => `Slope per point of the scale (${numero(izquierda)} is left, ${numero(derecha)} is right).`,
    sostiene: (ola, n, x, b, rango) =>
      `In ${ola}, the slope rests on the ${numero(n)} people at point ${numero(x)}: without them it is ${b} (interval ${rango}), flat. The ${ola} slope is not robust.`,
    transversal: (desde, hasta) => `Opinion of China, ${desde} → ${hasta}, group by group`,
    suben: (cortes) => `The average rises in ${lista(cortes.map((k) => `${numero(k.suben)} of ${numero(k.total)} ${k.etiqueta}`))}.`,
    noPorGrupo: 'This shows the change does not come from a single group; it does not claim that each group on its own can be distinguished from random variation.',
  },
  cn: {
    noPasa: '未通过校正',
    sube: '上升',
    baja: '下降',
    parejo: '难分高下',
    positiva: '为正',
    negativa: '为负',
    arriba: (grupo) => `${grupo}较高`,
    bajaDerecha: '向右下降',
    subeDerecha: '向右上升',
    plana: '平坦',
    ic: (rango) => `区间 ${rango}`,
    holm: (familia, p) => `Holm校正（${familia}）：${p}`,
    fijos: (valor, unidad) => `固定年龄与性别构成：${valor}${unidad}`,
    n: (a, b) => (b === undefined ? `n = ${numero(a)}` : `n = ${numero(a)}、${numero(b)}`),
    dentroDePersona: '同一受访者自身的差异，逐轮列出。',
    puntas: '各轮内量表两端之间的差异。下方为每组自身的跨轮次对比。',
    sinCasos: '无受访者',
    tramos: (xs) => xs.join('，'),
    menos: (uno, otro, rango) => `${uno}减${otro}，区间 ${rango}`,
    entreOleadas: (tramo) => `${tramo}：跨轮次对比`,
    recta: (etiqueta) => `${etiqueta}：拟合直线`,
    pendiente: (izquierda, derecha) => `量表每一刻度的斜率（${numero(izquierda)}为左，${numero(derecha)}为右）。`,
    sostiene: (ola, n, x, b, rango) =>
      `${ola}年的斜率取决于刻度${numero(x)}上的${numero(n)}名受访者：去掉这些人后斜率为${b}（区间 ${rango}），趋于平坦。${ola}年的斜率不稳健。`,
    transversal: (desde, hasta) => `对中国的看法，${desde} → ${hasta}，逐组比较`,
    suben: (cortes) => `平均值上升的组：${lista(cortes.map((k) => `${numero(k.total)}个${k.etiqueta}中有${numero(k.suben)}个`))}。`,
    noPorGrupo: '这说明变化并非来自单一群体；但并不表明每个群体单独来看都能与随机波动区分。',
  },
}

const frases = () => FRASES[idioma()]

const signo = (v: number, d = 1) => `${v > 0 ? '+' : ''}${decimal(v, d)}`
const rango = (ic: Intervalo, d = 1) => idioma() === 'cn'
  ? `［${signo(ic[0], d)}；${signo(ic[1], d)}］`
  : `[${signo(ic[0], d)}; ${signo(ic[1], d)}]`

/** Un nivel: un porcentaje con el formato del idioma, o una cifra en la escala de la medida. */
const deNivel = (v: number, unidad: string) => {
  if (unidad !== '%') return decimal(v, 1)
  return idioma() === 'es' ? `${decimal(v, 1)} %` : porcentaje(v, 1)
}

/** Qué se lee: la palabra si es firme, «no pasa la corrección» si solo pasa el nominal, y si no, parejo. */
const leer = (x: { p: number, ic: Intervalo, holm?: Correccion[] }, si: string, parejo: string) =>
  firme(x) ? si : nominal(x) ? frases().noPasa : parejo

function bloques (c: Contrastes, id: string): Bloque[] {
  const f = frases()
  const separador = idioma() === 'cn' ? '；' : ' · '
  const nombre = (familia: string) => {
    const fam = c.familias?.find((x) => x.id === familia)
    return fam ? traducido(fam.etiqueta) : familia
  }
  /** Cada corrección con su familia: «Holm (hipótesis del bloque 3 de la guía): p = 0,067». */
  const holm = (x: { holm?: Correccion[] }) =>
    (x.holm ?? []).map((h) => f.holm(nombre(h.familia), valorP(h.p)))
  const salida: Bloque[] = []

  const m = c.medidas.find((x) => x.id === id)
  if (m) {
    salida.push({
      titulo: traducido(m.etiqueta),
      unidad: unidadDeDiferencia(m.unidad),
      decimales: 1,
      advertencia: m.advertencia ? traducido(m.advertencia) : undefined,
      notas: [],
      filas: m.comparaciones.map((k) => ({
        rotulo: `${k.desde} → ${k.hasta}`,
        diferencia: k.diferencia,
        ic: k.ic,
        lectura: leer(k, k.diferencia > 0 ? f.sube : f.baja, f.parejo),
        firme: firme(k),
        detalle: [
          `${deNivel(k.a, m.unidad)} → ${deNivel(k.b, m.unidad)}`,
          f.ic(rango(k.ic)),
          valorP(k.p),
          ...holm(k),
          k.estandarizada !== null ? f.fijos(signo(k.estandarizada), unidadDeDiferencia(m.unidad)) : null,
          f.n(k.n[0], k.n[1]),
        ].filter(Boolean).join(separador),
      })),
    })
  }

  const b = c.brechas.find((x) => x.id === id)
  if (b) {
    salida.push({
      // La resta usa las dos respuestas de la misma persona, que no son independientes. No es seguir a
      // nadie entre oleadas: cada persona contesta una vez.
      titulo: traducido(b.etiqueta),
      unidad: unidadDeDiferencia(b.unidad),
      decimales: 1,
      notas: [f.dentroDePersona],
      filas: b.porOla.map((o) => ({
        rotulo: String(o.ola),
        diferencia: o.diferencia,
        ic: o.ic,
        lectura: leer(o, o.diferencia > 0 ? f.positiva : f.negativa, f.parejo),
        firme: firme(o),
        detalle: [f.ic(rango(o.ic)), valorP(o.p), ...holm(o), f.n(o.n)].join(separador),
      })),
    })
  }

  const g = c.grupos.find((x) => x.id === id)
  if (g) {
    // Los tramos viajan con su clave en español; el rótulo, en `nombres`.
    const tramoDe = (clave: string) => (g.nombres[clave] ? traducido(g.nombres[clave]) : clave)
    salida.push({
      titulo: traducido(g.etiqueta),
      unidad: unidadDeDiferencia(g.unidad),
      decimales: 1,
      notas: [f.puntas],
      filas: g.porOla.filter((o) => o.brecha).map((o) => {
        const [uno, otro] = o.brecha!.entre.map(tramoDe)
        return {
          rotulo: String(o.ola),
          diferencia: o.brecha!.diferencia,
          ic: o.brecha!.ic,
          lectura: leer(o.brecha!, f.arriba(o.brecha!.diferencia > 0 ? uno : otro), f.parejo),
          firme: firme(o.brecha!),
          detalle: [
            f.tramos(o.tramos.map((t) => `${tramoDe(t.nombre)} ${t.media === null ? f.sinCasos : deNivel(t.media, g.unidad)} (${f.n(t.n)})`)),
            f.menos(uno, otro, rango(o.brecha!.ic)),
            valorP(o.brecha!.p),
            ...holm(o.brecha!),
          ].join(separador),
        }
      }),
    })
    const tramos = [...new Set(g.entreOlas.map((e) => e.tramo))]
    for (const tramo of tramos) {
      salida.push({
        titulo: f.entreOleadas(tramoDe(tramo)),
        unidad: unidadDeDiferencia(g.unidad),
        decimales: 1,
        sub: true,
        notas: [],
        filas: g.entreOlas.filter((e) => e.tramo === tramo).map((e) => ({
          rotulo: `${e.desde} → ${e.hasta}`,
          diferencia: e.diferencia,
          ic: e.ic,
          lectura: leer(e, e.diferencia > 0 ? f.sube : f.baja, f.parejo),
          firme: firme(e),
          detalle: [f.ic(rango(e.ic)), valorP(e.p), f.n(e.n[0], e.n[1])].join(separador),
        })),
      })
    }
  }

  const r = c.regresiones.find((x) => x.id === id)
  if (r) {
    salida.push({
      titulo: f.recta(traducido(r.etiqueta)),
      unidad: unidadDePendiente(),
      decimales: 2,
      notas: [
        f.pendiente(r.rango[0], r.rango[1]),
        // Solo cuando sacar el punto da vuelta la conclusión: si no, contarlo es ruido (skill `afirmaciones`).
        ...r.porOla.filter((o) => o.sostiene && firme(o.recta) && !firme(o.sostiene.recta)).map((o) =>
          f.sostiene(o.ola, o.sostiene!.n, o.sostiene!.x, signo(o.sostiene!.recta.b, 2), rango(o.sostiene!.recta.ic, 2))),
      ],
      filas: r.porOla.map((o) => ({
        rotulo: String(o.ola),
        diferencia: o.recta.b,
        ic: o.recta.ic,
        lectura: leer(o.recta, o.recta.b < 0 ? f.bajaDerecha : f.subeDerecha, f.plana),
        firme: firme(o.recta),
        detalle: [f.ic(rango(o.recta.ic, 2)), valorP(o.recta.p), f.n(o.recta.n)].join(separador),
      })),
    })
  }

  const t = c.transversal.find((x) => x.id === id)
  if (t) {
    salida.push({
      titulo: f.transversal(t.desde, t.hasta),
      unidad: '',
      decimales: 1,
      filas: [],
      notas: [
        f.suben(t.cortes.map((k) => ({ suben: k.suben, total: k.total, etiqueta: traducido(k.etiqueta) }))),
        f.noPorGrupo,
      ],
    })
  }

  return salida
}

/** El intervalo contra el cero. La escala es propia de cada contraste y simétrica: el cero queda al medio. */
function Raya ({ diferencia, ic, tope, firme }: { diferencia: number, ic: Intervalo, tope: number, firme: boolean }) {
  const ancho = 80
  const x = (v: number) => ancho / 2 + (v / tope) * (ancho / 2 - 5)
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
  const entre = entreCifraYUnidad()
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
                    <Raya diferencia={f.diferencia} ic={f.ic} tope={tope} firme={f.firme} />
                    <span className="tabular-nums">
                      <span className="font-medium text-gray-900">{signo(f.diferencia, b.decimales)}{entre}{b.unidad}</span>
                      {/* En teléfono la lectura baja entera a su línea, en vez de cortarse en el punto medio. */}
                      <span className={`max-sm:block ${f.firme ? 'text-brand-dark' : 'text-gray-500'}`}><span className="max-sm:hidden"> · </span>{f.lectura}</span>
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
