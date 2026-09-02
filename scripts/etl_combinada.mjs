// ETL de la base combinada: las tres oleadas en un solo artefacto para el navegador.
//
//   node scripts/etl_combinada.mjs [--out public/data/encuesta.json]
//
// Lee `data/sources/combinada/ICLAC_2023_2025_combinada.xlsx`, que es la base canónica que
// ICLAC rehízo el 01-09-2026 sobre los 1.228 casos completos de 2025. Emite los microdatos
// anonimizados y el diccionario, y **no calcula ni un porcentaje**: eso vive en
// `src/nucleo/agregar.ts`, en un solo lugar, para que la prueba de aceptación y la app no
// puedan divergir.
//
// Anonimización, que acá no es cortesía sino requisito: los microdatos viajan al navegador,
// así que salen los identificadores, las marcas de tiempo, la comuna (347 categorías, que
// cruzada con edad y educación identifica personas en celdas de un caso) y los verbatim de
// las respuestas abiertas. Queda `olas_panelista` como número, que permite filtrar los 159
// panelistas repetidos sin permitir seguirlos.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { registros } from './lib/xlsx.mjs'

const FUENTE = 'data/sources/combinada/ICLAC_2023_2025_combinada.xlsx'

// Columnas que no viajan al navegador.
const FUERA = new Set([
  'key', 'codpanelista', 'numericalid', 'accesscount', 'status', 'type',
  'starttime', 'endtime', 'duration', 'device', 'badwordsvariables',
  'rotacion_1', 'rotacion_2', 'rotacion_3', 'rotacion_4',
  'comuna', 'ppi_tp',
  // Bloque experimental: fuera del visualizador por decisión del equipo (guía de Urdinez).
  'p29_a_size', 'p29_b_size', 'p23_size', 'p28_size',
])

const ES_VERBATIM = (nombre) => nombre.endsWith('_txt') || nombre.endsWith('_texto')

// El bloque experimental completo, que la guía deja fuera del visualizador.
const EXPERIMENTAL = new Set([
  'p29a_1', 'p29a_2', 'p29a_3', 'p29a_4', 'p29b_1', 'p29b_2', 'p29b_3', 'p29b_4',
  'p30', 'p31', 'p32', 'p33', 'p34',
])

/**
 * Los seis bloques temáticos con los que Urdinez ordena el instrumento en su «Guía de
 * contexto para el visualizador» (02-09-2026). No son nuestros: son suyos, y por eso el
 * tablero agrupa por acá en vez de por un criterio que hubiéramos inventado nosotros.
 */
const BLOQUES = [
  { id: 'potencias', titulo: 'Cómo se mira a China frente a otras potencias' },
  { id: 'geopolitica', titulo: 'Chile entre Washington y Beijing' },
  { id: 'territorio', titulo: 'China en la economía del lugar donde uno vive' },
  { id: 'inversion', titulo: 'Inversión, sectores estratégicos y capacidad del Estado' },
  { id: 'cotidiana', titulo: 'La China cotidiana' },
  { id: 'vacunas', titulo: 'Vacunas y memoria de la pandemia' },
]

const DE_BLOQUE = {
  potencias: ['p5_1_val', 'p5_2_val', 'p5_3_val', 'p5_4_val', 'p5_5_val', 'p3'],
  geopolitica: ['p24', 'p25', 'p26', 'p37'],
  territorio: ['p7', 'p8', 'p1', 'p2'],
  inversion: ['p19', 'p20', 'p21', 'p22'],
  cotidiana: ['p12', 'p13', 'p14', 'p15', 'p16', 'p17_escala', 'p18', 'p18a', 'p18c', 'p18d', 'p18e', 'p6a_1'],
  vacunas: ['p9', 'p10', 'p11'],
}

function bloqueDe (nombre) {
  for (const [id, variables] of Object.entries(DE_BLOQUE)) {
    if (variables.includes(nombre)) return id
  }
  return null
}

export function procesar () {
  const { datos: filas } = registros(FUENTE, 'datos')
  const { datos: dicc } = registros(FUENTE, 'diccionario')
  const { datos: valores } = registros(FUENTE, 'valores')

  // Etiquetas de respuesta. La hoja las trae por ola porque el enunciado puede cambiar; nos
  // quedamos con la más reciente de cada código, que es la que usa el visualizador, y
  // dejamos anotado si difieren entre olas.
  const etiquetas = new Map()
  for (const v of valores) {
    const variable = String(v.variable ?? '').trim()
    if (!variable) continue
    if (!etiquetas.has(variable)) etiquetas.set(variable, new Map())
    const porCodigo = etiquetas.get(variable)
    const previa = porCodigo.get(v.codigo)
    porCodigo.set(v.codigo, {
      codigo: v.codigo,
      etiqueta: String(v.etiqueta ?? '').trim(),
      difiereEntreOlas: previa !== undefined && previa.etiqueta !== String(v.etiqueta ?? '').trim(),
    })
  }

  const variables = []
  for (const d of dicc) {
    const nombre = String(d.variable ?? '').trim()
    if (!nombre || FUERA.has(nombre) || ES_VERBATIM(nombre)) continue
    if (EXPERIMENTAL.has(nombre)) continue

    const categorias = etiquetas.has(nombre)
      ? [...etiquetas.get(nombre).values()].sort((a, b) => a.codigo - b.codigo)
      : null

    variables.push({
      nombre,
      etiqueta: d.etiqueta ?? null,
      tipo: d.tipo ?? null,
      olas: [2023, 2024, 2025].filter((a) => d[`ola_${a}`] === 'sí'),
      // La columna con la que ICLAC decide qué se puede comparar entre oleadas. Es su
      // criterio metodológico, no el nuestro.
      serie: d.uso_serie_longitudinal === 'sí',
      comparabilidad: d.comparabilidad ?? null,
      nota: d.nota ?? null,
      bloque: bloqueDe(nombre),
      categorias,
    })
  }

  const publicadas = new Set(variables.map((v) => v.nombre))
  const casos = filas.map((f) => {
    const caso = { ola: f.ola }
    for (const [k, v] of Object.entries(f)) {
      if (k === 'ola' || !publicadas.has(k)) continue
      caso[k] = v === '' ? null : v
    }
    // Número de oleadas en que participó la persona. Sin identificador: permite filtrar el
    // solapamiento sin permitir seguir a nadie.
    caso.olas_panelista = typeof f.olas_panelista === 'number' ? f.olas_panelista : 1
    return caso
  })

  const porOla = {}
  for (const c of casos) porOla[c.ola] = (porOla[c.ola] ?? 0) + 1

  return {
    generado: new Date().toISOString(),
    fuente: FUENTE,
    procedencia: 'Base combinada rehecha por ICLAC el 01-09-2026 sobre los 1.228 casos de terreno de 2025, menos un panelista duplicado.',
    olas: Object.keys(porOla).map(Number).sort(),
    n: porOla,
    bloques: BLOQUES,
    variables,
    casos,
  }
}

const esEjecutable = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())
if (esEjecutable) {
  const { values } = parseArgs({ options: { out: { type: 'string' } } })
  const salida = resolve(values.out ?? 'public/data/encuesta.json')
  const datos = procesar()
  mkdirSync(dirname(salida), { recursive: true })
  writeFileSync(salida, JSON.stringify(datos), 'utf8')

  console.log(`\nOleadas: ${datos.olas.map((o) => `${o} (${datos.n[o]})`).join(' · ')}`)
  console.log(`Variables publicadas: ${datos.variables.length}`)
  console.log(`En serie longitudinal: ${datos.variables.filter((v) => v.serie).length}`)
  console.log(`\nEscrito en ${salida}\n`)
}
