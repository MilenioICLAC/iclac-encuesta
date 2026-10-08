#!/usr/bin/env node
// Recorre el recorrido con un navegador de verdad y **mide** lo que una captura sola no dice.
//
//   node scripts/mirar_recorrido.mjs [ancho] [carpeta de salida] [historia] [--idioma es|en|cn] [--puerto N]
//
// Sin historia recorre las seis, en el orden del menú; con una (`mirada`, `vacuna`…), solo esa.
// `--idioma` abre la página con `?lng=`, antes del `#` (así la lee el detector de `src/i18n.ts`), y
// fuera del español agrega el idioma al nombre de cada captura.
// Los identificadores se leen de `src/historias/indice.tsx`, que es donde viven.
//
// Por qué existe: los defectos del recorrido son de geometría y de escala, y ninguno lo ve `lint`,
// los tipos ni las pruebas. Los tres que llegaron al cliente en septiembre de 2026 (dos leyendas,
// escenas superpuestas, rótulo doble) eran visibles en el primer render, y el paso desparejo se
// calculó mal dos veces en el papel antes de medirlo acá.
//
// Qué informa, por cada cambio de frase o de pausa: en qué píxel de scroll ocurre, **cuánto costó
// respecto del anterior** (dentro de una escena, y del último paso a la pausa, tienen que ser todos
// iguales: 0,75 de pantalla), cuántas escenas hay a la vista (dos seguidas solo en la transición),
// cuántos ítems de leyenda hay (una leyenda por figura) y qué números están rotulados por fila
// (solo los de la oleada del paso).
//
// Requisitos: el servidor de desarrollo en el 5180 (`npm run dev`), o en el de `--puerto`, y Playwright instalado una vez
// por máquina (`npm install -g playwright`), el mismo que usa `~/.claude/bin/captura-web.mjs`.

import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'

const raiz = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
const { chromium } = createRequire(`${raiz}/`)('playwright')

// `--idioma en` y `--puerto 5185` pueden ir en cualquier lugar; lo demás son los posicionales de
// siempre. El puerto es el del Vite contra el que se mide (por omisión 5180, el de `npm run dev`):
// con varios servidores a la vez, cada uno mide el suyo. También vale la variable `PUERTO`.
const argumentos = process.argv.slice(2)
const opcion = (nombre, porOmision) => {
  const i = argumentos.indexOf(nombre)
  return i >= 0 ? argumentos.splice(i, 2)[1] : porOmision
}
const idioma = opcion('--idioma', 'es')
if (!['es', 'en', 'cn'].includes(idioma)) {
  console.error(`--idioma es, en o cn; llegó «${idioma}»`)
  process.exit(1)
}
const puerto = Number(opcion('--puerto', process.env.PUERTO ?? 5180))
if (!Number.isInteger(puerto) || puerto <= 0) {
  console.error('--puerto lleva un número de puerto')
  process.exit(1)
}
const sufijo = idioma === 'es' ? '' : `-${idioma}`

// Los identificadores, del registro de las historias: un dato, un lugar.
const registro = readFileSync(new URL('../src/historias/indice.tsx', import.meta.url), 'utf8')
const todas = [...registro.matchAll(/^\s*id: '([^']+)'/gm)].map((m) => m[1])
// Una historia se reconoce por su nombre en cualquier posición (`--idioma en vacuna` también).
const enLugar = argumentos.findIndex((a) => todas.includes(a))
const pedida = enLugar >= 0 ? argumentos.splice(enLugar, 1)[0] : argumentos[2]

const salida = argumentos[1] ?? './capturas'
mkdirSync(salida, { recursive: true })
const ancho = Number(argumentos[0] ?? 360)
if (!Number.isFinite(ancho)) {
  console.error(`El ancho es un número; llegó «${argumentos[0]}»`)
  process.exit(1)
}
if (pedida && !todas.includes(pedida)) {
  console.error(`No hay historia «${pedida}». Hay: ${todas.join(', ')}`)
  process.exit(1)
}

const navegador = await chromium.launch()

async function mirar (id) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: 780 }, deviceScaleFactor: 2 })
  // Cada historia es una ruta: se entra por ella y no por el menú, que anima la transición de la
  // tarjeta y no es lo que se mide acá.
  await pagina.goto(`http://localhost:${puerto}/encuesta-percepciones/historias/${id}?lng=${idioma}`, { waitUntil: 'networkidle' })
  await pagina.waitForSelector('[role="dialog"]')
  // La geometría de la pista se fija después del primer cuadro, cuando se conoce el alto de la capa.
  await pagina.waitForTimeout(1000)

  const capa = pagina.locator('[role="dialog"]')

  const estado = async () => pagina.evaluate(() => {
    const capa = document.querySelector('[role="dialog"]')
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight && r.width > 0
    }
    // Una escena desvanecida bajo su pausa sigue en su lugar, pero no se ve: no cuenta. Se lee del
    // estado de la pausa (`data-cruzada`) y no de la opacidad, que tarda 500 ms en llegar.
    const apagada = (e) => !!e.closest('.escena-recorrido')?.matches(':has(+ .respiro-recorrido[data-cruzada])')
    const escenas = [...document.querySelectorAll('.escena-recorrido > .escena')].map((e, i) => ({
      i, visible: visible(e) && !apagada(e), top: Math.round(e.getBoundingClientRect().top),
    })).filter((e) => e.visible)
    // Por `data-lugar` y no por opacidad: la opacidad tarda 500 ms en llegar y mediría la transición, no
    // el paso.
    const frases = [...document.querySelectorAll('.parrafo-escena > span')]
      .filter((s) => visible(s.parentElement) && !apagada(s.closest('.escena')) && s.dataset.lugar === 'activa')
      .map((s) => s.textContent.trim().slice(0, 60))
    // La pausa cuenta como un cambio más desde que se cruza su línea.
    for (const r of document.querySelectorAll('.respiro-recorrido[data-cruzada]')) {
      if (visible(r.querySelector('.bloque-texto'))) frases.push(`[pausa] ${r.textContent.trim().slice(0, 50)}`)
    }
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
  console.log(`\n== ${id} · ancho ${ancho} · scroll total ${alto} px · pantalla ${pantalla} px`)

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

  console.log('Cambios de frase (y = scroll del contenedor):')
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
    await pagina.screenshot({ path: `${salida}/${id}-${ancho}${sufijo}-${String(i).padStart(2, '0')}.png` })
  }
  await pagina.close()
}

for (const id of pedida ? [pedida] : todas) await mirar(id)
await navegador.close()
