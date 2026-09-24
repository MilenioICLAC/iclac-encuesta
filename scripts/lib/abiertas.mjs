// Las preguntas abiertas en el explorador: una múltiple de palabras por pregunta.
//
// El catálogo está en `ABIERTAS` (`preguntas_explorador.mjs`). Acá se cuentan las palabras con el
// tokenizador de las nubes (`texto.mjs`) y se deja, por persona, **solo lo necesario para la
// figura**: una marca de que contestó (`<id>_r`) y un 1 por cada palabra de las que pueden salir
// (`<id>_w_<raíz>`). Un 0 no se escribe: quien contestó y no la nombró no la tiene. Así el texto no
// viaja, y `encuesta.json` crece en unos 30 mil valores (440 kB sin comprimir, medido el
// 24-09-2026) y no en los 270 mil que daría un 0 o 1 por palabra y persona.
//
// **Qué palabras pueden salir.** El explorador elige las `palabras` más dichas según el estado:
// en una oleada, por personas; entre oleadas, por porcentaje promedio; con y sin la exclusión de
// repetidos. Acá se marcan las candidatas de todos esos órdenes, así que las diez que el explorador
// calcula siempre tienen su marca. El orden y el desempate son los mismos que usa `explorador.ts`.

import { ABIERTAS } from './preguntas_explorador.mjs'
import { claveDe, claves, etiquetas } from './texto.mjs'

const OLAS = [2023, 2024, 2025]

const textosDe = (fila, columnas) => columnas.map((c) => fila[c]).filter((x) => typeof x === 'string' && x.trim())
const sinTilde = (s) => s.normalize('NFD').replace(/\p{M}/gu, '')

/**
 * Cuenta y marca. Escribe las marcas en `casos` (alineados con `filas`: el ETL arma cada caso desde
 * su fila) y devuelve los grupos de selección múltiple y las entradas del catálogo, cada una con su
 * `despuesDe`.
 */
export function marcarAbiertas (filas, casos) {
  const multiples = []
  const preguntas = []
  for (const a of ABIERTAS.preguntas) {
    const respuestas = filas.map((f) => textosDe(f, a.columnas))
    const fuera = new Set(a.propia.map(claveDe))
    const personas = respuestas.map((r) => (r.length > 0 ? claves(r).filter((k) => !fuera.has(k)) : null))
    const nombres = etiquetas(respuestas.filter((r) => r.length > 0))
    const nombre = (k) => nombres.get(k) ?? k
    const olas = OLAS.filter((o) => filas.some((f, i) => f.ola === o && personas[i]))

    const conteo = (indices) => {
      const n = new Map()
      let base = 0
      for (const i of indices) {
        if (!personas[i]) continue
        base++
        for (const k of personas[i]) n.set(k, (n.get(k) ?? 0) + 1)
      }
      return { n, base }
    }
    // Mayor a menor, y a igualdad, alfabético por la forma visible: lo mismo que `explorador.ts`.
    const primeras = (claves, valor) => [...claves]
      .sort((x, y) => valor(y) - valor(x) || nombre(x).localeCompare(nombre(y), 'es'))
      .slice(0, ABIERTAS.palabras)

    const candidatas = new Set()
    for (const soloIndependientes of [false, true]) {
      const porOla = olas.map((ola) => conteo(filas.map((_, i) => i).filter((i) =>
        filas[i].ola === ola && (!soloIndependientes || Number(casos[i].olas_panelista ?? 1) === 1))))
      for (const c of porOla) for (const k of primeras(c.n.keys(), (x) => c.n.get(x))) candidatas.add(k)
      if (olas.length > 1) {
        const todas = new Set(porOla.flatMap((c) => [...c.n.keys()]))
        const promedio = (k) => porOla.reduce((s, c) => s + (c.base > 0 ? (c.n.get(k) ?? 0) / c.base : 0), 0) / porOla.length
        for (const k of primeras(todas, promedio)) candidatas.add(k)
      }
    }

    // Ninguna palabra rara viaja por persona: toda candidata la escribieron al menos `minimo`.
    const total = conteo(filas.map((_, i) => i)).n
    for (const k of candidatas) {
      if ((total.get(k) ?? 0) < ABIERTAS.minimo) throw new Error(`abiertas · ${a.id}: «${nombre(k)}» la escribieron ${total.get(k) ?? 0} personas`)
    }

    const respuesta = `${a.id}_r`
    const columna = new Map([...candidatas].map((k) => [k, `${a.id}_w_${sinTilde(k).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`]))
    if (new Set(columna.values()).size !== columna.size) throw new Error(`abiertas · ${a.id}: dos palabras dan la misma columna`)

    personas.forEach((ks, i) => {
      if (!ks) return
      casos[i][respuesta] = 1
      for (const k of ks) if (columna.has(k)) casos[i][columna.get(k)] = 1
    })

    const opciones = [...candidatas].map((k) => ({ columna: columna.get(k), opcion: nombre(k), olas }))
    multiples.push({ id: a.id, titulo: a.titulo, respuesta, opciones })
    preguntas.push({
      id: a.id,
      titulo: a.titulo,
      enunciado: a.enunciado,
      tipo: 'multiple',
      categorias: opciones.map((o) => [o.columna, o.opcion]),
      orden: 'frecuencia',
      abierta: { palabras: ABIERTAS.palabras, minimo: ABIERTAS.minimo },
      serie: olas.length > 1 ? { olas } : null,
      ...(a.poblacion ? { poblacion: a.poblacion } : {}),
      nota: ABIERTAS.nota,
      despuesDe: a.despuesDe,
    })
  }
  return { multiples, preguntas }
}

/** El catálogo con las abiertas en su lugar: cada una después de la pregunta que dice `despuesDe`. */
export function conAbiertas (catalogo, abiertasDelEtl) {
  const salida = [...catalogo]
  for (const p of abiertasDelEtl) {
    const i = salida.findIndex((x) => x.id === p.despuesDe)
    if (i < 0) throw new Error(`abiertas · ${p.id}: no existe la pregunta ${p.despuesDe} para ubicarla`)
    const { despuesDe: _, ...entrada } = p
    salida.splice(i + 1, 0, entrada)
  }
  return salida
}
