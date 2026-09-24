// Prepara los archivos que el sitio ofrece para descargar.
//
//   node scripts/descargas.mjs [--out public/descargas]
//
// Emite las bases en CSV **sin identificadores de panelista**, copia los libros de códigos y
// la nota metodológica, y escribe un manifiesto con el tamaño y el SHA-256 de cada archivo.
//
// Por qué anonimizadas: las bases traen `key` y `codpanelista`, y 159 personas participaron en
// más de una oleada. Con esas columnas se puede seguir a una persona entre años, y el propio
// `00_LEEME.docx` de ICLAC recomienda publicar una versión anónima. **Cuál se publica es
// decisión de ellos (`C11`)**; mientras no la tomen, el sitio ofrece la versión que no permite
// enlazar, que es la que se puede publicar sin preguntar.
//
// Qué NO se saca: comuna, región, edad y las respuestas abiertas. Son los datos del estudio y
// ICLAC ya los publica hoy. Sacarlos dejaría un archivo que no sirve para reanalizar nada.

import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { registros } from './lib/xlsx.mjs'

const COMBINADA = 'data/sources/combinada/ICLAC_2023_2025_combinada.xlsx'

/**
 * Columnas que no se publican.
 *
 * Las dos primeras son las que permiten enlazar a una persona entre oleadas. El resto es
 * control de terreno: no dice nada del estudio y sí puede acotar quién respondió (la marca de
 * tiempo exacta más la región deja pocas personas posibles).
 */
const SIN_PUBLICAR = new Set([
  'key', 'codpanelista', 'numericalid',
  'accesscount', 'starttime', 'endtime', 'duration', 'device', 'status', 'type',
  'badwordsvariables', 'rotacion_1', 'rotacion_2', 'rotacion_3', 'rotacion_4',
])

/** Archivos que se copian tal cual: son documentación, no datos de personas. */
const DOCUMENTOS = [
  { archivo: 'data/sources/combinada/ICLAC_libro_de_codigos_2023.xlsx', titulo: 'Libro de códigos 2023' },
  { archivo: 'data/sources/combinada/ICLAC_libro_de_codigos_2024.xlsx', titulo: 'Libro de códigos 2024' },
  { archivo: 'data/sources/combinada/ICLAC_libro_de_codigos_2025.xlsx', titulo: 'Libro de códigos 2025' },
  { archivo: 'data/sources/metodologia/Nota_metodologica_muestreo_ICLAC.docx', titulo: 'Nota metodológica del muestreo' },
  // Fuera desde el 24-09-2026 (Felipe): `Asignacion_muestral_por_region_y_estrato.xlsx` trae la población
  // de Biobío y Ñuble cruzada. Vuelve cuando ICLAC confirme el cruce (C25).
  { archivo: 'data/sources/metodologia/Diseno_indice_impacto_China_por_region.xlsx', titulo: 'Diseño del índice de impacto de China por región' },
  { archivo: 'data/sources/metodologia/Cuestionario_ICLAC_2023.docx', titulo: 'Cuestionario 2023' },
  { archivo: 'data/sources/metodologia/Cuestionario_ICLAC_2024.docx', titulo: 'Cuestionario 2024' },
  { archivo: 'data/sources/metodologia/Cuestionario_ICLAC_2025.docx', titulo: 'Cuestionario 2025' },
]

/**
 * Una celda de CSV.
 *
 * Se cita **todo lo que sea texto**, no solo lo que contiene el separador. Las respuestas
 * abiertas traen comas, comillas y saltos de línea, y una sola celda mal citada corre las
 * columnas del resto del archivo sin que nada avise.
 */
function celda (valor) {
  if (valor === null || valor === undefined) return ''
  if (typeof valor === 'number') return String(valor)
  const texto = String(valor)
  return `"${texto.replace(/"/g, '""')}"`
}

function aCsv (columnas, filas) {
  const lineas = [columnas.map(celda).join(',')]
  for (const f of filas) lineas.push(columnas.map((c) => celda(f[c])).join(','))
  // BOM: sin él, Excel abre el archivo en la codificación del sistema y rompe las tildes.
  return `﻿${lineas.join('\r\n')}\r\n`
}

function huella (ruta) {
  return createHash('sha256').update(readFileSync(ruta)).digest('hex').slice(0, 16)
}

export function preparar (destino) {
  // Se vacía antes de escribir: un archivo que sale de la lista tiene que dejar de estar servido, no
  // quedar a un enlace de distancia (pasó con la asignación muestral, 24-09-2026). Se vacía el
  // contenido y no la carpeta: si se borra la carpeta, Vite en marcha deja de servirla entera.
  mkdirSync(destino, { recursive: true })
  for (const nombre of readdirSync(destino)) rmSync(join(destino, nombre), { recursive: true, force: true })
  const salida = []

  const { columnas, datos } = registros(COMBINADA, 'datos')
  const publicables = columnas.filter((c) => c && !SIN_PUBLICAR.has(c))
  const quitadas = columnas.filter((c) => c && SIN_PUBLICAR.has(c))

  const bases = [
    { id: 'combinada', titulo: 'Las tres oleadas juntas', filas: datos },
    ...[2023, 2024, 2025].map((ola) => ({
      id: String(ola),
      titulo: `Oleada ${ola}`,
      filas: datos.filter((d) => d.ola === ola),
    })),
  ]

  for (const base of bases) {
    const nombre = `ICLAC_encuesta_${base.id}.csv`
    const ruta = `${destino}/${nombre}`
    writeFileSync(ruta, aCsv(publicables, base.filas), 'utf8')
    salida.push({
      archivo: nombre,
      titulo: base.titulo,
      tipo: 'datos',
      formato: 'CSV',
      casos: base.filas.length,
      columnas: publicables.length,
      bytes: readFileSync(ruta).length,
      sha256: huella(ruta),
    })
  }

  // Las hojas de documentación de la propia base, que explican cada variable.
  for (const hoja of ['diccionario', 'valores', 'notas']) {
    const { columnas: cols, datos: filas } = registros(COMBINADA, hoja)
    const nombre = `ICLAC_encuesta_${hoja}.csv`
    const ruta = `${destino}/${nombre}`
    writeFileSync(ruta, aCsv(cols.filter(Boolean), filas), 'utf8')
    salida.push({
      archivo: nombre,
      titulo: { diccionario: 'Diccionario de variables', valores: 'Etiquetas de respuesta', notas: 'Notas de la base' }[hoja],
      tipo: 'documentacion',
      formato: 'CSV',
      casos: filas.length,
      columnas: cols.filter(Boolean).length,
      bytes: readFileSync(ruta).length,
      sha256: huella(ruta),
    })
  }

  for (const doc of DOCUMENTOS) {
    const nombre = basename(doc.archivo)
    const ruta = `${destino}/${nombre}`
    copyFileSync(doc.archivo, ruta)
    salida.push({
      archivo: nombre,
      titulo: doc.titulo,
      tipo: 'documentacion',
      formato: nombre.split('.').pop().toUpperCase(),
      bytes: readFileSync(ruta).length,
      sha256: huella(ruta),
    })
  }

  const manifiesto = {
    generado: new Date().toISOString(),
    fuente: COMBINADA,
    quitadas,
    archivos: salida,
  }
  writeFileSync(`${destino}/manifiesto.json`, JSON.stringify(manifiesto, null, 2), 'utf8')
  return manifiesto
}

const esEjecutable = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())
if (esEjecutable) {
  const { values } = parseArgs({ options: { out: { type: 'string' } } })
  const destino = resolve(values.out ?? 'public/descargas')
  const m = preparar(destino)

  console.log(`\nColumnas retiradas: ${m.quitadas.join(', ')}`)
  for (const a of m.archivos) {
    const tamano = a.bytes > 1048576 ? `${(a.bytes / 1048576).toFixed(1)} MB` : `${Math.round(a.bytes / 1024)} kB`
    console.log(`  ${a.archivo.padEnd(46)} ${tamano.padStart(8)}${a.casos ? `  ${a.casos} filas` : ''}`)
  }
  console.log(`\nEscrito en ${destino}\n`)
}
