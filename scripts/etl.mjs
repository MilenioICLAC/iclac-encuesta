// ETL de una oleada de la encuesta: deja los datos y su libro de códigos en un solo
// JSON que el sitio consume.
//
//   node scripts/etl.mjs 2023 [--out public/data/oleada_2023.json]
//
// Los valores se publican **en código** y las etiquetas viven una sola vez, en el
// diccionario de variables. Un dato, un lugar: si la etiqueta estuviera repetida en
// cada uno de los 664 casos, tarde o temprano divergen.
//
// Fuentes por oleada:
//   datos -> data/sources/<año>/data_csv.csv    (valores en código numérico)
//   libro -> data/sources/<año>/data_stata.dta  (enunciados y etiquetas de respuesta)
//
// El .dta se usa solo como libro de códigos. Es la única fuente legible por máquina que
// llegó de 2023; de 2024 no llegó ninguna. Ver docs/generales/correcciones_cliente.md C9.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { parsearCsv, detectarSeparador } from './lib/csv.mjs'
import { leerLibroDeCodigos } from './lib/dta.mjs'

// Metadatos del panel de Netquest, no respuestas. Quedan fuera del JSON publicado:
// CodPanelista es un identificador estable de la persona entre oleadas y no tiene para
// qué viajar al navegador.
const ADMINISTRATIVAS = new Set([
  'key', 'numericalid', 'accesscount', 'starttime', 'endtime',
  'duration', 'status', 'type', 'badwordsvariables', 'codpanelista'
])

/** Normaliza el nombre de columna con las mismas reglas del monitor en R, para que los dos coincidan. */
function normalizar (nombre) {
  return nombre.trim().toLowerCase().replace(/#/g, '_').replace(/new$/, '')
}

const esEntero = (v) => /^-?\d+$/.test(v)
const esNumero = (v) => /^-?\d+([.,]\d+)?$/.test(v)

// Un centinela es "no contestó", no una respuesta. Se reconoce por la etiqueta y nunca
// por el código: en esta misma oleada 98 es "Otro" y 99 es "Ninguna", que sí son
// respuestas, mientras 999 es "Prefiero no responder". Filtrar por número redondo
// borraría dos categorías reales.
const ES_CENTINELA = /^(no informad|prefiero no responder|no responde|sin dato|no sabe)/i

/**
 * Marca conjuntos de etiquetas donde alguna **empieza** en minúscula mientras el resto
 * del conjunto empieza en mayúscula. Es la firma de un texto al que le comieron el
 * arranque.
 *
 * Lo escribió el hallazgo del 31-08-2026: en las etiquetas de `comuna` de la oleada 2023
 * está borrada **toda** ocurrencia de "vi", y ninguna de las 346 comunas quedó con su
 * nombre. "Viña del Mar" es "ña del Mar", "Providencia" es "Prodencia", "San Vicente" es
 * "San cente". Nada en los datos lo delata: los códigos son correctos, el conjunto está
 * completo y los porcentajes salen bien. Solo se ve leyendo los nombres.
 *
 * Mira la primera letra y nada más. Un intento anterior miraba todas las palabras y
 * marcaba 24 variables, casi todas correctas: las etiquetas de respuesta van en mayúscula
 * de oración, así que "Muy en desacuerdo" tiene minúsculas legítimas. Un validador que
 * grita sobre datos correctos deja de leerse.
 *
 * No pretende encontrar cada etiqueta rota del conjunto: "Prodencia" y "San cente"
 * arrancan bien y se le escapan. Lo que tiene que hacer es que el **conjunto** no pase
 * callado, y para eso alcanza con una.
 */
function etiquetasDecapitadas (categorias) {
  const candidatas = categorias.filter((c) => !ES_CENTINELA.test(c.etiqueta) && /^\p{L}/u.test(c.etiqueta))
  if (candidatas.length < 4) return []
  const enMinuscula = candidatas.filter((c) => /^\p{Ll}/u.test(c.etiqueta))
  // Si el conjunto entero va en minúscula es un estilo, no un defecto.
  if (enMinuscula.length > candidatas.length * 0.5) return []
  return enMinuscula.map((c) => c.etiqueta)
}

/**
 * Procesa una oleada y devuelve el objeto que se escribe a disco. Está separado de `main`
 * para que las pruebas puedan contrastar el resultado sin pasar por el archivo.
 */
export function procesarOleada (anio) {
  const rutaCsv = `data/sources/${anio}/data_csv.csv`
  const rutaDta = `data/sources/${anio}/data_stata.dta`
  const correcciones = []
  const revisiones = []

  // 1. Datos
  const textoCsv = readFileSync(rutaCsv, 'utf8')
  const separador = detectarSeparador(textoCsv)
  const filas = parsearCsv(textoCsv, separador)
  const cabecera = filas[0]
  const cuerpo = filas.slice(1).filter((f) => f.some((c) => c !== ''))

  // 2. Libro de códigos
  const libro = leerLibroDeCodigos(readFileSync(rutaDta))

  // 3. Nombres
  const columnas = cabecera.map((original) => {
    const nombre = normalizar(original)
    if (nombre !== original) correcciones.push(`columna "${original}" -> "${nombre}"`)
    return { original, nombre }
  })
  const porNombre = new Map(libro.variables.map((v) => [normalizar(v.nombre), v]))

  // 4. Compuertas: que el libro y los datos hablen del mismo archivo
  if (cuerpo.length !== libro.casos) {
    throw new Error(`el CSV trae ${cuerpo.length} casos y el .dta declara ${libro.casos}`)
  }
  const soloEnDatos = columnas.filter((c) => !porNombre.has(c.nombre)).map((c) => c.nombre)
  const soloEnLibro = [...porNombre.keys()].filter((n) => !columnas.some((c) => c.nombre === n))
  if (soloEnDatos.length) revisiones.push(`columnas sin entrada en el libro de códigos: ${soloEnDatos.join(', ')}`)
  if (soloEnLibro.length) revisiones.push(`variables del libro que no son columna: ${soloEnLibro.join(', ')}`)

  // 5. Tipo de cada variable, deducido de los valores y no del libro
  const variables = columnas.map(({ original, nombre }, i) => {
    const bruto = cuerpo.map((f) => f[i] ?? '')
    const presentes = bruto.filter((v) => v !== '' && v !== '.')
    const doc = porNombre.get(nombre) ?? null
    const administrativa = ADMINISTRATIVAS.has(nombre)

    let tipo
    if (administrativa) tipo = 'administrativa'
    else if (doc?.categorias && presentes.every(esEntero)) tipo = 'categorica'
    else if (presentes.length && presentes.every(esNumero)) tipo = 'numerica'
    else tipo = 'texto'

    // Un código en los datos que el libro no documenta es de los fallos que no se ven en
    // el gráfico: la barra sale sin nombre, o directamente no sale.
    let huerfanos = []
    if (tipo === 'categorica') {
      const conocidos = new Set(doc.categorias.map((c) => c.codigo))
      huerfanos = [...new Set(presentes.map(Number))].filter((v) => !conocidos.has(v)).sort((a, b) => a - b)
      if (huerfanos.length) revisiones.push(`${nombre}: códigos sin etiqueta en el libro -> ${huerfanos.join(', ')}`)
    }

    // Firma de una pregunta de escala a la que le falta su columna de respuesta: el libro
    // la describe como "del 0 al 100" pero la columna solo guarda si la persona contestó.
    if (doc?.categorias?.some((c) => /del\s+\d+\s+al\s+\d+/i.test(c.etiqueta))) {
      const acompanante = columnas.some((c) => c.nombre !== nombre && c.nombre.startsWith(nombre) && /value$/.test(c.nombre))
      if (!acompanante) {
        revisiones.push(`${nombre}: el libro la declara escala numérica, pero no hay columna con el valor. En esta entrega solo se sabe si la persona respondió`)
      }
    }

    let categorias = null
    if (tipo === 'categorica') {
      categorias = doc.categorias.map((c) => ({ ...c, sentinela: ES_CENTINELA.test(c.etiqueta) || undefined }))

      const decapitadas = etiquetasDecapitadas(categorias)
      if (decapitadas.length) {
        revisiones.push(`${nombre}: ${decapitadas.length} de ${categorias.length} etiquetas empiezan en minúscula donde el resto empieza en mayúscula, señal de texto mutilado -> ${decapitadas.slice(0, 6).join(', ')}${decapitadas.length > 6 ? ', …' : ''}`)
      }
    }

    return {
      nombre,
      original,
      enunciado: doc?.enunciado ?? null,
      enunciadoTruncado: doc?.enunciadoTruncado ?? false,
      tipo,
      publicada: !administrativa,
      categorias,
      faltantes: bruto.length - presentes.length,
      huerfanos: huerfanos.length ? huerfanos : undefined
    }
  })

  // 6. Casos, solo con lo publicable
  const publicables = variables.map((v, i) => ({ v, i })).filter(({ v }) => v.publicada)
  const casos = cuerpo.map((fila) => {
    const caso = {}
    for (const { v, i } of publicables) {
      const bruto = (fila[i] ?? '').trim()
      if (bruto === '' || bruto === '.') { caso[v.nombre] = null; continue }
      caso[v.nombre] = v.tipo === 'texto' ? bruto : Number(bruto.replace(',', '.'))
    }
    return caso
  })

  return {
    oleada: Number(anio),
    generado: new Date().toISOString(),
    fuentes: {
      datos: rutaCsv,
      libroDeCodigos: rutaDta,
      releaseDta: libro.release,
      codificacion: libro.codificacion
    },
    n: casos.length,
    correcciones,
    revisiones,
    variables,
    casos
  }
}

function main () {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { out: { type: 'string' } }
  })
  const anio = positionals[0] ?? '2023'
  const salida = resolve(values.out ?? `public/data/oleada_${anio}.json`)
  const salidaJson = procesarOleada(anio)
  const { variables, casos, correcciones, revisiones } = salidaJson

  mkdirSync(dirname(salida), { recursive: true })
  writeFileSync(salida, JSON.stringify(salidaJson), 'utf8')

  const cuenta = (t) => variables.filter((v) => v.tipo === t).length
  console.log(`\nOleada ${anio}: ${casos.length} casos, ${variables.length} columnas`)
  console.log(`  ${cuenta('categorica')} categóricas, ${cuenta('numerica')} numéricas, ${cuenta('texto')} de texto, ${cuenta('administrativa')} administrativas (fuera del JSON)`)
  console.log(`  enunciado documentado en ${variables.filter((v) => v.enunciado).length}, de los cuales ${variables.filter((v) => v.enunciadoTruncado).length} vienen truncados a 80 bytes por el .dta`)

  console.log(`\nCorrecciones aplicadas (${correcciones.length}), todas deterministas y sin pérdida:`)
  for (const c of correcciones) console.log(`  · ${c}`)

  console.log(`\nPara revisar (${revisiones.length}). No se parchean acá; van al informe:`)
  for (const r of revisiones) console.log(`  ! ${r}`)
  console.log(`\nEscrito en ${salida}\n`)
}

// Solo al ejecutar el archivo. Importado desde las pruebas no debe escribir nada.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
