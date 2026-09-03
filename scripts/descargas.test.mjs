import { describe, it, expect, beforeAll } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { preparar } from './descargas.mjs'
import { casosDe } from './lib/combinada.mjs'

/**
 * Lo que se publica para descargar.
 *
 * Dos cosas que tienen que ser ciertas y que no se ven mirando el sitio: que los archivos no
 * llevan identificadores de panelista, y que el CSV se puede volver a leer sin que las
 * respuestas abiertas corran las columnas. Un CSV mal citado no falla: entrega datos movidos
 * de lugar, y quien lo use no se entera.
 */

let destino
let manifiesto

beforeAll(() => {
  destino = mkdtempSync(join(tmpdir(), 'descargas-'))
  manifiesto = preparar(destino)
})

/** Parser de CSV con comillas, para verificar que lo emitido se puede volver a leer. */
function leerCsv (ruta) {
  const texto = readFileSync(ruta, 'utf8').replace(/^﻿/, '')
  const filas = []
  let fila = []
  let campo = ''
  let dentro = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (dentro) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else dentro = false
      } else campo += c
    } else if (c === '"') dentro = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\r') { /* el salto viene en el \n siguiente */ }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = '' }
    else campo += c
  }
  if (campo !== '' || fila.length > 0) { fila.push(campo); filas.push(fila) }
  return filas
}

describe('los archivos que se ofrecen para descargar', () => {
  it('no llevan identificadores de panelista', () => {
    for (const nombre of ['ICLAC_encuesta_combinada.csv', 'ICLAC_encuesta_2023.csv']) {
      const [encabezado] = leerCsv(join(destino, nombre))
      expect(encabezado).not.toContain('key')
      expect(encabezado).not.toContain('codpanelista')
      expect(encabezado).not.toContain('numericalid')
    }
    expect(manifiesto.quitadas).toContain('codpanelista')
  })

  it('conservan olas_panelista, que permite descartar a los repetidos sin identificarlos', () => {
    const [encabezado] = leerCsv(join(destino, 'ICLAC_encuesta_combinada.csv'))
    expect(encabezado).toContain('olas_panelista')
  })

  it('se pueden volver a leer sin que las respuestas abiertas corran las columnas', () => {
    // Es el fallo silencioso del CSV: una comilla o un salto de línea sin citar mueve todo lo
    // que sigue, y el archivo se abre igual.
    const filas = leerCsv(join(destino, 'ICLAC_encuesta_combinada.csv'))
    const anchos = new Set(filas.map((f) => f.length))
    expect(anchos.size).toBe(1)
    expect(filas.length - 1).toBe(casosDe(2023).length + casosDe(2024).length + casosDe(2025).length)
  })

  it('parten cada oleada con el número de casos que le corresponde', () => {
    for (const ola of [2023, 2024, 2025]) {
      const filas = leerCsv(join(destino, `ICLAC_encuesta_${ola}.csv`))
      expect(filas.length - 1).toBe(casosDe(ola).length)
    }
  })

  it('incluyen la documentación que ICLAC decidió publicar al lado de las bases', () => {
    const archivos = manifiesto.archivos.map((a) => a.archivo)
    for (const ola of [2023, 2024, 2025]) {
      expect(archivos).toContain(`ICLAC_libro_de_codigos_${ola}.xlsx`)
    }
    expect(archivos).toContain('Nota_metodologica_muestreo_ICLAC.docx')
  })
})
