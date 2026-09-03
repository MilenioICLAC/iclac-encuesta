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
import { impacto, macrozona, nombreCorto, orden } from './lib/regiones.mjs'
import { contar } from './lib/texto.mjs'

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

/**
 * Preguntas de selección múltiple. En la base cada opción es una columna binaria
 * (`p20_1`, `p20_2`, …) y la etiqueta del diccionario trae la opción y el enunciado pegados:
 * «del cobre - ¿Cuáles sectores le parece que son más importantes limitar inversiones…?».
 *
 * El ETL las agrupa y separa la opción del enunciado, que es lo mismo que hace
 * `iclac_multiples()` en el monitor en R. Sin esto no se pueden graficar: son las dos
 * preguntas que cruzan con el repositorio de inversiones.
 */
const MULTIPLES = [
  { id: 'p20', prefijo: 'p20_', titulo: 'Sectores donde limitar la inversión extranjera' },
  { id: 'p22', prefijo: 'p22_', titulo: 'Efectos observados de la inversión china en su comuna' },
  { id: 'p18a', prefijo: 'p18a_', titulo: 'Cómo se informa de asuntos internacionales' },
  { id: 'p6b', prefijo: 'p6b_', titulo: 'Países visitados' },
]

/** «del cobre - ¿Cuáles sectores…?» → «del cobre». */
function opcionDe (etiqueta) {
  return String(etiqueta ?? '').split(' - ')[0].trim().replace(/\s*:$/, '')
}

/**
 * Respuestas abiertas que alimentan las nubes de palabras.
 *
 * **El verbatim no viaja al navegador.** Se tokeniza y se cuenta acá, y al artefacto van
 * conteos agregados, que es lo que permite tener nubes sin romper la anonimización. El precio
 * es que los cortes disponibles son los que se precalculan, y por eso están declarados.
 */
const TEXTOS = [
  { id: 'p4_1', titulo: 'China', columnas: ['p4_1'], conCortes: true },
  { id: 'p4_2', titulo: 'Estados Unidos', columnas: ['p4_2'], conCortes: true },
  { id: 'p4_3', titulo: 'Corea del Sur', columnas: ['p4_3'], conCortes: true },
  { id: 'p4_4', titulo: 'Francia', columnas: ['p4_4'], conCortes: true },
  { id: 'p4_5', titulo: 'Japón', columnas: ['p4_5'], conCortes: true },
  { id: 'p16', titulo: 'Contextos de interacción', columnas: ['p16'], conCortes: false },
  { id: 'p17_texto', titulo: 'Cómo fueron las interacciones', columnas: ['p17_texto'], conCortes: false },
  { id: 'p6a', titulo: 'Marcas chinas mencionadas', columnas: ['p6a_2_txt', 'p6a_3_txt', 'p6a_4_txt'], conCortes: false },
]

/** Los tres tramos de ideología con los que el monitor parte las nubes. */
const TRAMOS_IDEOLOGIA = [
  { id: 'izquierda', etiqueta: 'Izquierda (1-4)', prueba: (p) => p >= 1 && p <= 4 },
  { id: 'centro', etiqueta: 'Centro (5-6)', prueba: (p) => p === 5 || p === 6 },
  { id: 'derecha', etiqueta: 'Derecha (7-10)', prueba: (p) => p >= 7 && p <= 10 },
]

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

  // Grupos de selección múltiple, con la opción de cada columna ya separada del enunciado.
  const multiples = MULTIPLES.map((m) => {
    const opciones = dicc
      .map((d) => String(d.variable ?? '').trim())
      .filter((n) => n.startsWith(m.prefijo) && !n.endsWith('_txt'))
      .map((n) => {
        const d = dicc.find((x) => String(x.variable ?? '').trim() === n)
        return {
          columna: n,
          opcion: opcionDe(d.etiqueta),
          olas: [2023, 2024, 2025].filter((a) => d[`ola_${a}`] === 'sí'),
        }
      })
    return { ...m, opciones }
  }).filter((m) => m.opciones.length > 0)

  const columnasMultiples = new Set(multiples.flatMap((m) => m.opciones.map((o) => o.columna)))

  // Nubes de palabras, ya contadas. El texto crudo se queda acá.
  const etiquetasP8 = etiquetas.get('p8')
  const nubes = TEXTOS.map((t) => {
    const disponibles = t.columnas.filter((c) => dicc.some((d) => String(d.variable ?? '').trim() === c))
    if (disponibles.length === 0) return null

    const textosDe = (filas) => filas.flatMap((f) => disponibles.map((c) => f[c]))
    const olasCon = [2023, 2024, 2025].filter((a) => filas.some((f) => f.ola === a && disponibles.some((c) => f[c])))

    const nube = {
      id: t.id,
      titulo: t.titulo,
      olas: olasCon,
      total: contar(textosDe(filas)).slice(0, 80),
      porOla: Object.fromEntries(olasCon.map((a) => [a, contar(textosDe(filas.filter((f) => f.ola === a))).slice(0, 60)])),
    }

    if (t.conCortes) {
      nube.porIdeologia = TRAMOS_IDEOLOGIA.map((tramo) => ({
        id: tramo.id,
        etiqueta: tramo.etiqueta,
        palabras: contar(textosDe(filas.filter((f) => typeof f.p3 === 'number' && tramo.prueba(f.p3)))).slice(0, 40),
      }))

      nube.porRol = [...(etiquetasP8?.values() ?? [])].map((cat) => ({
        id: String(cat.codigo),
        etiqueta: cat.etiqueta,
        palabras: contar(textosDe(filas.filter((f) => f.p8 === cat.codigo))).slice(0, 40),
      })).filter((g) => g.palabras.length > 0)
    }

    return nube
  }).filter(Boolean)

  const publicadas = new Set(variables.map((v) => v.nombre))
  const casos = filas.map((f) => {
    const caso = { ola: f.ola }
    for (const [k, v] of Object.entries(f)) {
      if (k === 'ola' || !(publicadas.has(k) || columnasMultiples.has(k))) continue
      caso[k] = v === '' ? null : v
    }
    // Número de oleadas en que participó la persona. Sin identificador: permite filtrar el
    // solapamiento sin permitir seguir a nadie.
    caso.olas_panelista = typeof f.olas_panelista === 'number' ? f.olas_panelista : 1

    // Agrupaciones de región: la muestra no aguanta cortar por las dieciséis.
    if (typeof f.region === 'number') {
      caso.region_macrozona = macrozona(f.region)
      caso.region_impacto = impacto(f.region)
    }
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
    multiples,
    nubes,
    // Regiones de norte a sur, con el número romano fuera del nombre: ocupa eje y no aporta.
    regiones: (etiquetas.get('region') ? [...etiquetas.get('region').values()] : [])
      .filter((c) => c.codigo <= 16)
      .map((c) => ({ codigo: c.codigo, etiqueta: nombreCorto(c.etiqueta), orden: orden(c.codigo) }))
      .sort((a, b) => a.orden - b.orden),
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
  console.log(`Grupos de selección múltiple: ${datos.multiples.map((m) => `${m.id} (${m.opciones.length})`).join(' · ')}`)
  console.log(`Nubes de palabras: ${datos.nubes.map((n) => `${n.id} (${n.total.length})`).join(' · ')}`)
  console.log(`En serie longitudinal: ${datos.variables.filter((v) => v.serie).length}`)
  console.log(`\nEscrito en ${salida}\n`)
}
