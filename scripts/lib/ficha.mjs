// Lo que la «Ficha técnica» necesita y no está en los casos: el campo de cada oleada y el índice de
// exposición a China con que se estratificó la muestra. Se calcula acá, desde las fuentes, para que
// la página no traiga ni una fecha ni un índice escritos a mano.

import { filas as filasDeHoja } from './xlsx.mjs'
import { impacto, IMPACTOS } from './regiones.mjs'

export const FUENTE_INDICE = 'data/sources/metodologia/Diseno_indice_impacto_China_por_region.xlsx'
const HOJA_INDICE = 'productos y regiones'

/**
 * Primer y último término registrado (`endtime`) y mediana de la duración (`duration`, en segundos)
 * de cada oleada. `endtime` llega como texto «AAAA-MM-DD hh:mm:ss»; se guarda solo el día.
 */
export function campo (filas) {
  const porOla = new Map()
  for (const f of filas) {
    if (typeof f.ola !== 'number') continue
    const g = porOla.get(f.ola) ?? { dias: [], duraciones: [] }
    if (typeof f.endtime === 'string' && /^\d{4}-\d{2}-\d{2}/.test(f.endtime)) g.dias.push(f.endtime.slice(0, 10))
    if (typeof f.duration === 'number' && f.duration > 0) g.duraciones.push(f.duration)
    porOla.set(f.ola, g)
  }
  const salida = {}
  for (const [ola, { dias, duraciones }] of [...porOla].sort((a, b) => a[0] - b[0])) {
    if (!dias.length || !duraciones.length) throw new Error(`ficha · ${ola}: sin endtime o sin duration`)
    dias.sort()
    salida[ola] = { desde: dias[0], hasta: dias[dias.length - 1], duracionMediana: mediana(duraciones) }
  }
  return salida
}

export function mediana (valores) {
  const a = [...valores].sort((x, y) => x - y)
  const k = a.length
  return k % 2 ? a[(k - 1) / 2] : (a[k / 2 - 1] + a[k / 2]) / 2
}

// Los nombres del archivo de diseño, con sus erratas («Valapraíso», «O´Higgins »), a código de región.
const CODIGOS = {
  'arica y parinacota': 15, tarapaca: 1, antofagasta: 2, atacama: 3, coquimbo: 4, valapraiso: 5, valparaiso: 5,
  metropolitana: 13, 'o´higgins': 6, "o'higgins": 6, 'el maule': 7, maule: 7, nuble: 16, biobio: 8,
  'la araucania': 9, 'los rios': 14, 'los lagos': 10, 'aysen del general': 11, aysen: 11, magallanes: 12,
}
const normalizar = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')

/**
 * El índice de cada región, leído del archivo de diseño de ICLAC.
 *
 * **Se comprueba contra `impacto()`**, que es el estrato con que el ETL agrupa las regiones: ordenadas
 * por el índice, cada cuartil de cuatro regiones tiene que caer en un mismo nivel, de Muy alto a Bajo.
 * Si el archivo y el código dejan de coincidir, el ETL se detiene antes de publicar dos criterios.
 */
export function indiceRegional (ruta = FUENTE_INDICE) {
  const f = filasDeHoja(ruta, HOJA_INDICE)
  const cabeza = f.findIndex((r) => normalizar(r[0]) === 'region')
  if (cabeza < 0) throw new Error(`ficha · ${ruta}: no encontré la fila «Region» en «${HOJA_INDICE}»`)
  const columna = f[cabeza].findIndex((c) => normalizar(c) === 'indice')
  const salida = []
  for (const r of f.slice(cabeza + 1)) {
    if (!r[0] || normalizar(r[0]) === 'salida') break
    const codigo = CODIGOS[normalizar(r[0])]
    if (codigo === undefined) throw new Error(`ficha · región sin código en el archivo de diseño: «${r[0]}»`)
    if (typeof r[columna] !== 'number') throw new Error(`ficha · «${r[0]}» sin índice`)
    salida.push({ codigo, indice: r[columna] })
  }
  if (new Set(salida.map((r) => r.codigo)).size !== 16) throw new Error(`ficha · el archivo de diseño trae ${salida.length} regiones, no 16`)

  salida.sort((a, b) => b.indice - a.indice)
  const niveles = [...IMPACTOS].reverse()
  salida.forEach((r, i) => {
    const esperado = niveles[Math.floor(i / 4)]
    if (impacto(r.codigo) !== esperado) throw new Error(`ficha · la región ${r.codigo} cae en «${esperado}» por el índice y en «${impacto(r.codigo)}» por impacto()`)
  })
  return salida
}
