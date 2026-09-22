// Geometría de las regiones para el mapa de «Donde uno vive».
//
//   node scripts/geometria_regiones.mjs
//
// Lee el SVG de simplemaps (`data/sources/geo/simplemaps_cl_admin1.svg`, descargado el 22-09-2026 de
// https://simplemaps.com/static/svg/country/cl/admin1/cl.svg; «Free for Commercial Use», términos en
// https://simplemaps.com/resources/svg-license, piden atribución y el mapa la lleva) y escribe
// `public/data/chile-regiones.json`: el `viewBox` recortado a Chile continental y un `d` por región,
// con el código de región de la encuesta. Pedido de Felipe, 22-09-2026.

import { readFileSync, writeFileSync } from 'node:fs'

const FUENTE = 'data/sources/geo/simplemaps_cl_admin1.svg'
const SALIDA = 'public/data/chile-regiones.json'

// Código simplemaps → código de región de la encuesta (el de `regiones` en `encuesta.json`).
const CODIGOS = {
  CLTA: 1, CLAN: 2, CLAT: 3, CLCO: 4, CLVS: 5, CLLI: 6, CLML: 7, CLBI: 8,
  CLAR: 9, CLLL: 10, CLAI: 11, CLMA: 12, CLRM: 13, CLLR: 14, CLAP: 15, CLNB: 16,
}

const svg = readFileSync(FUENTE, 'utf8')
const regiones = []
for (const m of svg.matchAll(/<path d="([^"]+)" id="(CL[A-Z]+)" name="([^"]+)"/g)) {
  const [, d, id, nombre] = m
  if (!(id in CODIGOS)) throw new Error(`región sin código: ${id} ${nombre}`)
  regiones.push({ codigo: CODIGOS[id], nombre, d })
}
if (regiones.length !== 16) throw new Error(`se esperaban 16 regiones y hay ${regiones.length}`)

// Caja de cada subtrazo: el SVG usa solo M/m absolutos-relativos, l relativo y z.
function subtrazos (d) {
  const salida = []
  let x = 0; let y = 0; let actual = null
  for (const [, cmd, args] of d.matchAll(/([MmLlZz])([^MmLlZz]*)/g)) {
    const n = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number)
    if (cmd === 'M' || cmd === 'm') {
      x = cmd === 'M' ? n[0] : x + n[0]; y = cmd === 'M' ? n[1] : y + n[1]
      actual = { minX: x, maxX: x, minY: y, maxY: y }
      salida.push(actual)
      for (let i = 2; i < n.length; i += 2) { x += n[i]; y += n[i + 1]; ampliar(actual, x, y) }
    } else if (cmd === 'l') {
      for (let i = 0; i < n.length; i += 2) { x += n[i]; y += n[i + 1]; ampliar(actual, x, y) }
    }
  }
  return salida
}
function ampliar (c, x, y) { c.minX = Math.min(c.minX, x); c.maxX = Math.max(c.maxX, x); c.minY = Math.min(c.minY, y); c.maxY = Math.max(c.maxY, y) }

// Recorte a Chile continental: fuera quedan las islas oceánicas (Rapa Nui, Juan Fernández), que
// están en Valparaíso y achicarían todo el mapa. Se descartan los subtrazos al oeste de x = 380.
const cajas = regiones.flatMap((r) => subtrazos(r.d)).filter((c) => c.minX > 380)
const minX = Math.min(...cajas.map((c) => c.minX)); const maxX = Math.max(...cajas.map((c) => c.maxX))
const minY = Math.min(...cajas.map((c) => c.minY)); const maxY = Math.max(...cajas.map((c) => c.maxY))
const pad = 4
const viewBox = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad].map((v) => Math.round(v * 10) / 10).join(' ')

writeFileSync(SALIDA, JSON.stringify({ fuente: 'simplemaps.com (Free for Commercial Use)', viewBox, regiones }))
console.log(`Escrito ${SALIDA}: viewBox ${viewBox}`)
