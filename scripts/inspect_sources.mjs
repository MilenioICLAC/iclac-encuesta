// Reporta qué hay realmente dentro de los archivos de cada oleada: hojas, dimensiones
// y primeras columnas. No transforma nada.
//
// Existe porque los libros de códigos no cuadran con sus propios datos (el de 2023
// documenta P20 y P22, que no son columnas; el de 2024 omite seis que sí lo son), así
// que toda decisión de ETL se toma mirando el archivo, no la documentación.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import * as XLSX from 'xlsx'

const SOURCES = 'data/sources'

function inspeccionarExcel (ruta) {
  const wb = XLSX.read(readFileSync(ruta), { type: 'buffer', sheetRows: 3 })
  return wb.SheetNames.map((nombre, i) => {
    const hoja = wb.Sheets[nombre]
    const rango = hoja['!ref'] ?? '(vacía)'
    const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false })
    return { indice: i + 1, nombre, rango, primeraFila: filas[0] ?? [] }
  })
}

function inspeccionarCsv (ruta) {
  const texto = readFileSync(ruta, 'utf8')
  const [cabecera] = texto.split(/\r?\n/)
  const puntoYComa = (cabecera.match(/;/g) ?? []).length
  const coma = (cabecera.match(/,/g) ?? []).length
  const sep = puntoYComa > coma ? ';' : ','
  const columnas = cabecera.split(sep)
  const filas = texto.split(/\r?\n/).filter((l) => l.trim() !== '').length - 1
  return { sep, filas, columnas }
}

function resumirColumnas (columnas, tope = 12) {
  const muestra = columnas.slice(0, tope).join(', ')
  return columnas.length > tope ? `${muestra}, … (+${columnas.length - tope})` : muestra
}

for (const anio of readdirSync(SOURCES).sort()) {
  const dir = join(SOURCES, anio)
  if (!statSync(dir).isDirectory()) continue
  console.log(`\n${'='.repeat(72)}\nOLEADA ${anio}\n${'='.repeat(72)}`)

  for (const archivo of readdirSync(dir).sort()) {
    const ruta = join(dir, archivo)
    const ext = extname(archivo).toLowerCase()
    const kb = Math.round(statSync(ruta).size / 1024)

    if (ext === '.xls' || ext === '.xlsx') {
      console.log(`\n  ${archivo}  (${kb} kB)`)
      for (const h of inspeccionarExcel(ruta)) {
        console.log(`    hoja ${h.indice}: "${h.nombre}"  rango ${h.rango}`)
        console.log(`      fila 1: ${resumirColumnas(h.primeraFila.map(String))}`)
      }
    } else if (ext === '.csv') {
      const c = inspeccionarCsv(ruta)
      console.log(`\n  ${archivo}  (${kb} kB)`)
      console.log(`    separador "${c.sep}"  ${c.filas} filas de datos  ${c.columnas.length} columnas`)
      console.log(`      ${resumirColumnas(c.columnas)}`)
    } else {
      console.log(`\n  ${archivo}  (${kb} kB)  — sin inspección (${ext || 'sin extensión'})`)
    }
  }
}
console.log()
