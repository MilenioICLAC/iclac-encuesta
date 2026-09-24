// Recorre cada pregunta del explorador en sus tres estados y mide lo que se rompe a la vista.
//
//   node scripts/mirar_explorador.mjs [url base] [carpeta de capturas] [anchos separados por coma]
//
// Por pregunta y ancho: una oleada sin corte, la misma con corte por edad, y entre oleadas. Mide
// desborde horizontal del documento y de la tarjeta, líneas del título, rótulos de valor que se
// salen de su caja y errores de consola, y deja una captura de la tarjeta por estado. Imprime una
// línea por problema y un resumen; sale con código 1 si hay alguno.

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { chromium } = require(execFileSync('npm', ['root', '-g']).toString().trim() + '/playwright')

const base = process.argv[2] ?? 'http://localhost:5180'
const carpeta = process.argv[3] ?? 'capturas-explorador'
const anchos = (process.argv[4] ?? '390,1512').split(',').map(Number)
mkdirSync(carpeta, { recursive: true })

const { preguntas } = JSON.parse(readFileSync('public/data/encuesta.json', 'utf8'))
const problemas = []
let medidas = 0

const browser = await chromium.launch()
for (const ancho of anchos) {
  const movil = ancho < 700
  const page = await browser.newPage({ viewport: { width: ancho, height: movil ? 844 : 945 }, hasTouch: movil, isMobile: movil })
  const errores = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()) })
  page.on('pageerror', (e) => errores.push(e.message))
  await page.goto(`${base}/#/explorar`)
  await page.waitForSelector('article h3')

  for (const p of preguntas) {
    const ultima = p.olas[p.olas.length - 1]
    const estados = [
      ['ola', `p=${p.id}&ola=${ultima}`],
      ['corte', `p=${p.id}&ola=${ultima}&corte=edad_rec`],
      ...(p.serie ? [['serie', `p=${p.id}&vista=serie`]] : []),
    ]
    for (const [nombre, q] of estados) {
      errores.length = 0
      await page.evaluate((h) => { window.location.hash = h }, `#/explorar?${q}`)
      await page.waitForFunction((t) => document.querySelector('article h3')?.textContent?.length > 0 && document.location.hash.includes(t), p.id)
      await page.waitForTimeout(260) // lo que dura la transición de las barras
      const m = await page.evaluate(() => {
        const art = document.querySelector('article')
        const h3 = art.querySelector('h3')
        const lh = parseFloat(getComputedStyle(h3).lineHeight)
        const valores = [...art.querySelectorAll('.tabular-nums')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent)
        const rotulos = [...art.querySelectorAll('span.text-xs')].filter((e) => e.getBoundingClientRect().right > art.getBoundingClientRect().right + 1).map((e) => e.textContent)
        return {
          doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          art: art.scrollWidth - art.clientWidth,
          lineasTitulo: Math.round(h3.getBoundingClientRect().height / lh),
          valores,
          rotulos,
          filas: art.querySelectorAll('figure .grid').length,
          titulo: h3.textContent,
        }
      })
      medidas++
      const donde = `${ancho} · ${p.id} · ${nombre}`
      if (m.doc > 0) problemas.push(`${donde}: el documento desborda ${m.doc} px`)
      if (m.art > 0) problemas.push(`${donde}: la tarjeta desborda ${m.art} px`)
      if (m.lineasTitulo > (movil ? 3 : 2)) problemas.push(`${donde}: título en ${m.lineasTitulo} líneas («${m.titulo}»)`)
      if (m.valores.length) problemas.push(`${donde}: valores cortados ${m.valores.join(', ')}`)
      if (m.rotulos.length) problemas.push(`${donde}: rótulos fuera de la tarjeta ${m.rotulos.join(', ')}`)
      if (m.filas === 0 && nombre !== 'ola') problemas.push(`${donde}: la figura quedó vacía`)
      for (const e of errores) problemas.push(`${donde}: consola: ${e}`)
      await page.locator('article').screenshot({ path: `${carpeta}/${p.id}-${nombre}-${ancho}.png` })
    }
  }
  await page.close()
}
await browser.close()

for (const x of problemas) console.log(x)
console.log(`\n${medidas} estados medidos en ${anchos.join(' y ')} px; ${problemas.length} problemas. Capturas en ${carpeta}/`)
process.exit(problemas.length > 0 ? 1 : 0)
