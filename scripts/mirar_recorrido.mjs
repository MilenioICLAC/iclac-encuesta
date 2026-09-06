#!/usr/bin/env node
// Recorre el recorrido con un navegador de verdad y **mide** lo que una captura sola no dice.
//
//   node scripts/mirar_recorrido.mjs [ancho] [carpeta de salida]
//
// Por qué existe: los defectos del recorrido son de geometría y de escala, y ninguno lo ve `lint`,
// los tipos ni las pruebas. Los tres que llegaron al cliente en septiembre de 2026 (dos leyendas,
// escenas superpuestas, rótulo doble) eran visibles en el primer render, y el paso desparejo se
// calculó mal dos veces en el papel antes de medirlo acá.
//
// Qué informa, por cada cambio de frase: en qué píxel de scroll ocurre, **cuánto costó respecto
// del anterior** (tienen que ser todos iguales), cuántas escenas hay a la vista (dos seguidas solo
// en la transición), cuántos ítems de leyenda hay (una leyenda por figura) y qué números están
// rotulados por fila (solo los de la oleada del paso).
//
// Requisitos: el servidor de desarrollo en el 5180 (`npm run dev`) y Playwright instalado una vez
// por máquina (`npm install -g playwright`), el mismo que usa `~/.claude/bin/captura-web.mjs`.

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const raiz = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
const { chromium } = createRequire(`${raiz}/`)('playwright')

const salida = process.argv[3] ?? './capturas'
mkdirSync(salida, { recursive: true })
const ancho = Number(process.argv[2] ?? 360)

const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: ancho, height: 780 }, deviceScaleFactor: 2 })
await pagina.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await pagina.getByRole('button', { name: 'Ver el recorrido' }).click()
await pagina.waitForSelector('[role="dialog"]')
// El imán mueve el scroll que se pide por código y contamina la medición de la geometría.
await pagina.addStyleTag({ content: '.capa-recorrido { scroll-snap-type: none !important }' })
await pagina.waitForTimeout(400)

const capa = pagina.locator('[role="dialog"]')

const estado = async () => pagina.evaluate(() => {
  const capa = document.querySelector('[role="dialog"]')
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0
  }
  const escenas = [...document.querySelectorAll('.escena')].map((e, i) => ({
    i, visible: visible(e), top: Math.round(e.getBoundingClientRect().top),
  })).filter((e) => e.visible)
  // Por clase y no por opacidad: la opacidad tarda 500 ms en llegar y mediría la transición, no
  // el paso.
  const frases = [...document.querySelectorAll('.parrafo-escena > span')]
    .filter((s) => visible(s.parentElement) && s.className.includes('text-gray-800'))
    .map((s) => s.textContent.trim().slice(0, 60))
  const rotulosPorFila = [...document.querySelectorAll('.fila-puntos')]
    .map((f) => [...f.querySelectorAll('span')].filter((s) => /^\d+[.,]?\d*$/.test(s.textContent.trim())).map((s) => s.textContent.trim()))
    .filter((r) => r.length > 0)
  const leyendas = document.querySelectorAll('.escena ul li').length
  return {
    scroll: Math.round(capa.scrollTop),
    escenasVisibles: escenas.length,
    frases,
    rotulosPorFila,
    itemsDeLeyenda: leyendas,
  }
})

const alto = await pagina.evaluate(() => document.querySelector('[role="dialog"]').scrollHeight)
const pantalla = await pagina.evaluate(() => document.querySelector('[role="dialog"]').clientHeight)
console.log(`ancho ${ancho} · scroll total ${alto} px · pantalla ${pantalla} px`)

let anterior = null
const cambios = []
for (let y = 0; y <= alto - pantalla; y += 40) {
  await capa.evaluate((el, y) => { el.scrollTop = y }, y)
  await pagina.waitForTimeout(60)
  const e = await estado()
  const clave = JSON.stringify(e.frases)
  if (clave !== anterior) {
    cambios.push({ y, ...e })
    anterior = clave
  }
}

console.log('\nCambios de frase (y = scroll del contenedor):')
let previo = null
for (const c of cambios) {
  const costo = previo === null ? '—' : `${c.y - previo} px`
  previo = c.y
  console.log(`  y=${String(c.y).padStart(5)}  costo ${String(costo).padStart(7)}  escenas visibles ${c.escenasVisibles}  leyenda ${c.itemsDeLeyenda}  rótulos ${JSON.stringify(c.rotulosPorFila)}`)
  console.log(`         «${c.frases.join(' | ')}»`)
}

for (const [i, c] of cambios.entries()) {
  await capa.evaluate((el, y) => { el.scrollTop = y }, c.y)
  await pagina.waitForTimeout(500)
  await pagina.screenshot({ path: `${salida}/paso-${ancho}-${String(i).padStart(2, '0')}.png` })
}
await navegador.close()
